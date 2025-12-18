"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, User, ArrowLeft, AlertCircle, Download, RotateCcw, Lock, Unlock, FileBarChart, Users, BookOpen, Loader2, Zap, ShieldCheck } from "lucide-react";
import Link from "next/link";
import api from "@/app/services/api";
import Swal from 'sweetalert2';

import { Turma, Aluno, Capacidade, Criterio, Disciplina, TurmaResponseDTO } from "@/app/types";

interface ResultadoBoletimDTO {
  nomeAluno: string;
  nomeDisciplina: string;
  qtdCriticosAtendidos: number;
  qtdDesejaveisAtendidos: number;
  totalCriticosDisciplina: number;
  totalDesejaveisDisciplina: number;
  nivelAlcancado: number;
  percentualConclusao: number;
}

interface AvaliacaoEstado {
  atendeu: boolean | null;
  obs: string;
  finalizada: boolean | undefined;
}

interface DisciplinaDisponivel extends Disciplina {
  avaliacaoId: number; // Snapshot ID ou Template ID
  isPrincipal: boolean;
}

export default function AvaliacaoTurmaPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const turmaId = params?.id as string;
  const initialEstruturaId = searchParams.get('estruturaId');
  const initialDiscId = searchParams.get('discId');

  const [turma, setTurma] = useState<Turma | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);

  const [disciplinasDisponiveis, setDisciplinasDisponiveis] = useState<DisciplinaDisponivel[]>([]);
  const [selectedEstruturaId, setSelectedEstruturaId] = useState<string | null>(initialEstruturaId ?? null);
  const [selectedDiscId, setSelectedDiscId] = useState<string | null>(initialDiscId ?? null);

  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const [capacidades, setCapacidades] = useState<Capacidade[]>([]);
  const [avaliacoesState, setAvaliacoesState] = useState<Record<number, AvaliacaoEstado>>({});

  const [avaliacaoFinalizada, setAvaliacaoFinalizada] = useState(false);
  const [resultadoFinal, setResultadoFinal] = useState<ResultadoBoletimDTO | null>(null);
  const [finalizando, setFinalizando] = useState(false);

  const todosCriteriosIds = useMemo(() => capacidades.flatMap(cap => cap.criterios ? cap.criterios.map(c => c.id) : []), [capacidades]);

  // --- Helpers ---
  const disciplinaSelecionada = useMemo(() => {
    if (selectedDiscId) {
        return disciplinasDisponiveis.find(d => d.id.toString() === selectedDiscId);
    }
    if (!selectedEstruturaId) return undefined;
    let disc = disciplinasDisponiveis.find(d => d.avaliacaoId.toString() === selectedEstruturaId);
    if (!disc) disc = disciplinasDisponiveis.find(d => d.id.toString() === selectedEstruturaId);
    return disc;
  }, [disciplinasDisponiveis, selectedEstruturaId, selectedDiscId]);

  const templateIdSelecionado = disciplinaSelecionada?.id?.toString() ?? null;

  const isSnapshotReady = useMemo(() => {
    if (!disciplinaSelecionada || !selectedEstruturaId) return false;
    return disciplinaSelecionada.id.toString() !== selectedEstruturaId;
  }, [disciplinaSelecionada, selectedEstruturaId]);

  // --- API calls ---
  const carregarTurmaEAuxiliares = useCallback(async () => {
    if (!turmaId) return;
    setLoading(true);
    try {
      const [resTurma, resAlunos, resDiscs] = await Promise.all([
        api.get<Turma>(`/turmas/${turmaId}`),
        api.get<Aluno[]>(`/turmas/${turmaId}/alunos`),
        api.get<Disciplina[]>(`/turmas/${turmaId}/disciplinas`),
      ]);

      const turmaData = resTurma.data;
      setTurma(turmaData);

      const alunosData = Array.isArray(resAlunos.data) ? resAlunos.data : [];
      setAlunos(alunosData);

      const defaultSnapshotId = turmaData.estruturaSnapshotId || 0;
      
      const initialDisciplinasMapeadas: DisciplinaDisponivel[] = Array.isArray(resDiscs.data) ? resDiscs.data.map(d => ({
        ...d,
        isPrincipal: d.id === turmaData.disciplinaId,
        avaliacaoId: d.id, 
      })) : [];
      
      const snapshotPromises = initialDisciplinasMapeadas.map(async d => {
          if (d.isPrincipal && defaultSnapshotId) {
              return { ...d, avaliacaoId: defaultSnapshotId };
          }
          try {
              const res = await api.get<number>(`/disciplinas/${d.id}/snapshot-status`);
              return { ...d, avaliacaoId: res.data };
          } catch (error: any) {
              if (error.response?.status === 404) return d;
              return d;
          }
      });
      
      const disciplinasMapeadas = await Promise.all(snapshotPromises);
      setDisciplinasDisponiveis(disciplinasMapeadas);

      let initial = initialEstruturaId ?? null;
      let initialDisc = initialDiscId ?? null;

      if (!initial) {
        if (defaultSnapshotId) {
            initial = defaultSnapshotId.toString();
            if (turmaData.disciplinaId) initialDisc = turmaData.disciplinaId.toString();
        }
        else if (turmaData.disciplinaId) {
            initial = turmaData.disciplinaId.toString();
            initialDisc = turmaData.disciplinaId.toString();
        }
        else if (disciplinasMapeadas.length > 0) {
            initial = disciplinasMapeadas[0].avaliacaoId.toString();
            initialDisc = disciplinasMapeadas[0].id.toString();
        }
      }
      
      if (initial) setSelectedEstruturaId(initial);
      if (initialDisc) setSelectedDiscId(initialDisc);

      if (alunosData.length > 0) setAlunoSelecionado(prev => prev ?? alunosData[0]);

    } catch (err) {
      console.error('Erro ao carregar dados iniciais', err);
      Swal.fire('Erro', 'Não foi possível carregar os dados iniciais.', 'error');
    } finally {
      setLoading(false);
    }
  }, [turmaId, initialEstruturaId, initialDiscId]);

  useEffect(() => { carregarTurmaEAuxiliares(); }, [carregarTurmaEAuxiliares]);

  const checarStatusFinalizacao = useCallback(async (alunoId: number, estruturaId: string) => {
    if (!estruturaId || !isSnapshotReady) {
      setAvaliacaoFinalizada(false);
      setResultadoFinal(null);
      setAvaliacoesState({});
      return;
    }

    try {
      const res = await api.get(`/avaliacoes`, { params: { alunoId, estruturaDisciplinaId: estruturaId } });
      const avaliacoes = Array.isArray(res.data) ? res.data : [];
      const isFinalizada = avaliacoes.some((av: any) => av.finalizada === true);
      setAvaliacaoFinalizada(isFinalizada);

      if (isFinalizada) {
        const resBoletim = await api.get<ResultadoBoletimDTO>(`/avaliacoes/boletim`, { params: { alunoId, estruturaDisciplinaId: estruturaId } });
        setResultadoFinal(resBoletim.data);
      } else setResultadoFinal(null);

      const mapa: Record<number, AvaliacaoEstado> = {};
      avaliacoes.forEach((av: any) => {
        const critId = av.criterio?.id || av.criterioId;
        if (critId) mapa[critId] = { atendeu: av.atendeu, obs: av.observacao || '', finalizada: av.finalizada };
      });
      setAvaliacoesState(mapa);
    } catch (err) {
      console.error('Erro ao checar status de finalizacao', err);
      setAvaliacaoFinalizada(false);
      setResultadoFinal(null);
      setAvaliacoesState({});
    }
  }, [isSnapshotReady]);

  useEffect(() => {
    const load = async () => {
      if (!selectedEstruturaId) return;
      
      if (!isSnapshotReady) {
        setCapacidades([]);
        setAvaliacoesState({});
        setAvaliacaoFinalizada(false);
        setResultadoFinal(null);
        return;
      }

      setLoading(true);
      try {
        const estruturaIdNum = parseInt(selectedEstruturaId, 10);
        const resCaps = await api.get<Capacidade[]>(`/estrutura/${estruturaIdNum}/capacidades`);
        setCapacidades(Array.isArray(resCaps.data) ? resCaps.data : []);

        if (alunoSelecionado) await checarStatusFinalizacao(alunoSelecionado.id, selectedEstruturaId);
      } catch (err) {
        console.error('Erro ao carregar estrutura:', err);
        Swal.fire('Erro', 'Falha ao carregar a Estrutura de Avaliação (Snapshot).', 'error');
        setCapacidades([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedEstruturaId, isSnapshotReady, alunoSelecionado, checarStatusFinalizacao]);

  // --- actions ---
  const handleGerarSnapshot = async () => {
    if (!turma || !templateIdSelecionado || finalizando) return;

    const result = await Swal.fire({
      title: `Criar Snapshot para ${disciplinaSelecionada?.nome}?`,
      text: `Isso copiará a estrutura de Capacidades e Critérios (Template ID: ${templateIdSelecionado}) para criar uma versão imutável (Snapshot). Confirma?`,
      icon: 'info', showCancelButton: true, confirmButtonText: 'Sim, Criar Snapshot', confirmButtonColor: '#10b981'
    });

    if (!result.isConfirmed) return;

    setFinalizando(true);
    try {
      const res = await api.post<TurmaResponseDTO>(`/turmas/${turmaId}/snapshot/${templateIdSelecionado}`);
      const novoSnapshotId = res.data?.estruturaSnapshotId;

      if (!novoSnapshotId) throw new Error("O servidor não retornou o ID do Snapshot.");
      const novoSnapshotIdStr = novoSnapshotId.toString();

      setTurma(res.data); 

      setDisciplinasDisponiveis(prev => prev.map(d => 
          d.id.toString() === templateIdSelecionado ? { ...d, avaliacaoId: novoSnapshotId } : d
      ));
      
      setSelectedEstruturaId(novoSnapshotIdStr);
      router.push(`/gestao/turmas/${turmaId}/avaliacao?estruturaId=${novoSnapshotIdStr}&discId=${templateIdSelecionado}`);
      
      Swal.fire('Sucesso!', 'Snapshot criado e ativado para avaliação.', 'success');
      
    } catch (err: any) {
      console.error('Erro ao criar snapshot', err);
      Swal.fire('Erro', err?.response?.data || 'Falha ao criar o Snapshot.', 'error');
    } finally { setFinalizando(false); }
  };

  const salvarAvaliacao = async (criterioId: number, atendeu: boolean | null, obs: string) => {
    if (finalizando || avaliacaoFinalizada || !alunoSelecionado || !selectedEstruturaId || !isSnapshotReady) {
      Swal.fire('Erro', 'A avaliação está bloqueada ou a estrutura não é válida.', 'error');
      return;
    }
    setAvaliacoesState(prev => ({ ...prev, [criterioId]: { atendeu, obs, finalizada: false } }));
    try {
      await api.post(`/avaliacoes`, {
        alunoId: alunoSelecionado.id,
        estruturaDisciplinaId: parseInt(selectedEstruturaId, 10),
        criterioId,
        atendeu,
        observacao: obs,
      });
    } catch (err) {
      console.error('Falha ao salvar avaliacao', err);
      Swal.fire('Erro', 'Falha ao salvar a avaliação.', 'error');
      if (alunoSelecionado) await checarStatusFinalizacao(alunoSelecionado.id, selectedEstruturaId);
    }
  };

  const marcarTodos = async (atendeu: boolean | null) => {
    if (finalizando || avaliacaoFinalizada || !alunoSelecionado || !selectedEstruturaId || todosCriteriosIds.length === 0 || !isSnapshotReady) return;
    setFinalizando(true);
    try {
      const promises = todosCriteriosIds.map(critId => api.post(`/avaliacoes`, {
        alunoId: alunoSelecionado.id,
        estruturaDisciplinaId: parseInt(selectedEstruturaId, 10),
        criterioId: critId,
        atendeu,
        observacao: avaliacoesState[critId]?.obs || '',
      }));
      await Promise.all(promises);
      setAvaliacoesState(prev => {
        const novo = { ...prev };
        todosCriteriosIds.forEach(id => novo[id] = { atendeu, obs: novo[id]?.obs || '', finalizada: false });
        return novo;
      });
      Swal.fire({ icon: 'success', title: atendeu === null ? 'Limpeza concluída!' : 'Avaliação em massa concluída!', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
    } catch (err) {
      Swal.fire('Erro', 'Erro ao salvar em massa.', 'error');
      if (alunoSelecionado) await checarStatusFinalizacao(alunoSelecionado.id, selectedEstruturaId);
    } finally { setFinalizando(false); }
  };

  const handleFinalizar = async () => {
    if (!alunoSelecionado || !selectedEstruturaId || !isSnapshotReady) return;
    const result = await Swal.fire({ title: 'Confirmar Fechamento?', text: 'Notas não poderão ser alteradas. Continuar?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sim, Fechar' });
    if (!result.isConfirmed) return;
    setFinalizando(true);
    try {
      const res = await api.post(`/avaliacoes/fechar?alunoId=${alunoSelecionado.id}&estruturaDisciplinaId=${selectedEstruturaId}`);
      setAvaliacaoFinalizada(true);
      setResultadoFinal(res.data);
      Swal.fire('Fechada!', 'Avaliação finalizada.', 'success');
      await checarStatusFinalizacao(alunoSelecionado.id, selectedEstruturaId);
    } catch (err: any) {
      Swal.fire('Erro', err?.response?.data || 'Falha ao fechar.', 'error');
    } finally { setFinalizando(false); }
  };

  // --- NOVA FUNÇÃO: FECHAR TURMA INTEIRA ---
  const handleFinalizarTurma = async () => {
    if (!turmaId || !selectedEstruturaId || !isSnapshotReady) return;

    const result = await Swal.fire({
      title: 'Fechar Toda a Turma?',
      text: 'Esta ação finalizará as avaliações de TODOS os alunos matriculados nesta turma. As notas serão geradas e gravadas. Deseja continuar?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, Fechar Turma',
      confirmButtonColor: '#7e22ce',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    setFinalizando(true);
    try {
      await api.post(`/avaliacoes/fechar/turma/${turmaId}?estruturaDisciplinaId=${selectedEstruturaId}`);
      
      Swal.fire('Concluído!', 'A turma foi fechada com sucesso. Todas as notas foram calculadas.', 'success');
      
      // Atualiza o status do aluno atual para refletir o fechamento
      if (alunoSelecionado) {
        await checarStatusFinalizacao(alunoSelecionado.id, selectedEstruturaId);
      }
    } catch (err: any) {
      Swal.fire('Erro', err?.response?.data || 'Erro ao fechar a turma.', 'error');
    } finally {
      setFinalizando(false);
    }
  };

  const handleReabrir = async () => {
    if (!alunoSelecionado || !selectedEstruturaId || !isSnapshotReady) return;
    const result = await Swal.fire({ title: 'Reabrir Avaliação?', text: 'Permite editar notas novamente. Continuar?', icon: 'question', showCancelButton: true, confirmButtonText: 'Sim, Reabrir' });
    if (!result.isConfirmed) return;
    setFinalizando(true);
    try {
      await api.post(`/avaliacoes/reabrir?alunoId=${alunoSelecionado.id}&estruturaDisciplinaId=${selectedEstruturaId}`);
      setAvaliacaoFinalizada(false);
      setResultadoFinal(null);
      await checarStatusFinalizacao(alunoSelecionado.id, selectedEstruturaId);
      Swal.fire('Reaberta!', 'Avaliação reaberta.', 'success');
    } catch (err: any) {
      Swal.fire('Erro', err?.response?.data || 'Falha ao reabrir.', 'error');
    } finally { setFinalizando(false); }
  };

  const handleSelectDiscipline = (disciplinaId: string) => {
    const disc = disciplinasDisponiveis.find(d => d.id.toString() === disciplinaId);
    if (disc) {
        const targetEstruturaId = disc.avaliacaoId.toString();
        setSelectedEstruturaId(targetEstruturaId);
        setSelectedDiscId(disciplinaId);
        router.push(`/gestao/turmas/${turmaId}/avaliacao?estruturaId=${targetEstruturaId}&discId=${disciplinaId}`);
    }
  };

  const baixarBoletim = async () => {
    if (!alunoSelecionado || !turma || !selectedEstruturaId || !isSnapshotReady) return;
    try {
      const response = await api.get('/arquivos/boletim/download', { params: { alunoId: alunoSelecionado.id, disciplinaId: selectedEstruturaId }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Boletim_${alunoSelecionado.nome.replace(/\s+/g, '_')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) { Swal.fire('Erro', 'Não foi possível baixar o boletim.', 'error'); }
  };

  const nomeDisciplina = disciplinaSelecionada?.nome || turma?.nomeDisciplina || 'N/A';
  const idExibicao = disciplinaSelecionada?.id || 'N/A';
  const idSnapshotExibicao = isSnapshotReady ? selectedEstruturaId : 'AUSENTE';
  const safeEstruturaId = selectedEstruturaId;

  if (loading) return <div className="p-8 flex justify-center text-gray-500"><Loader2 size={32} className="animate-spin" /> Carregando dados da turma...</div>;
  if (!turma) return <div className="p-8 text-red-500">Turma não encontrada.</div>;
  if (!selectedEstruturaId) return <div className="p-8 text-red-500">Estrutura de avaliação não definida para esta turma.</div>;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="w-80 bg-white border-r flex flex-col shadow-lg z-20 shrink-0 fixed h-full top-0 left-0 pt-16">
        <div className="p-4 border-b bg-blue-700 text-white flex justify-between items-center">
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2"><Users size={20} className='text-white'/> Alunos</h2>
            <p className="text-xs text-blue-200 mt-1">{alunos.length} matriculados</p>
          </div>
          <Link href={`/gestao/turmas/${turmaId}`} className="p-2 hover:bg-blue-600 rounded text-white" title="Voltar"><ArrowLeft size={18} /></Link>
        </div>

        {alunos.length === 0 ? (
          <div className="p-4 text-gray-500 text-sm text-center">Nenhum aluno.</div>
        ) : (
          <div className="overflow-y-auto flex-1">
            {alunos.map((aluno) => (
              <button key={aluno.id} onClick={() => setAlunoSelecionado(aluno)} className={`w-full text-left p-4 border-b hover:bg-gray-50 transition-colors flex items-center justify-between ${alunoSelecionado?.id === aluno.id ? "bg-blue-50 border-l-4 border-l-blue-600" : "border-l-4 border-l-transparent"}`}>
                <span className="font-medium text-sm text-gray-700 truncate uppercase">{aluno.nome}</span>
              </button>
            ))}
          </div>
        )}
        <div className="p-4 border-t bg-gray-50">
          <p className="text-xs font-bold text-gray-400 uppercase">{alunoSelecionado?.nome ? `AVAL. DE ${alunoSelecionado.nome}` : 'SELECIONE UM ALUNO'}</p>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full pl-80">
        <header className="sticky top-0 h-16 bg-white border-b flex items-center px-6 justify-between shadow-sm z-10">
          <div className="flex items-center gap-4">
            <div className="bg-gray-100 p-2 rounded-full"><BookOpen className="text-gray-600" size={20} /></div>
            
            <select 
                value={selectedDiscId || ''} 
                onChange={(e) => handleSelectDiscipline(e.target.value)} 
                className={`p-2 border border-gray-300 rounded-md text-sm font-semibold focus:ring-2 ${isSnapshotReady ? 'text-indigo-700 bg-indigo-50 focus:ring-indigo-500' : 'text-red-700 bg-red-50 focus:ring-red-500'}`}
            >
              {[...disciplinasDisponiveis]
                 .sort((a, b) => (a.id === turma.disciplinaId ? -1 : (b.id === turma.disciplinaId ? 1 : 0)))
                 .map(estrutura => (
                    <option key={estrutura.id} value={estrutura.id.toString()}>
                        {estrutura.nome} ({estrutura.sigla}) {estrutura.id === turma.disciplinaId && ' (Principal)'}
                    </option>
              ))}
            </select>
            <span className="text-xs text-gray-500">({turma.anoSemestre} - {turma.termoAtual}º Termo) | Snapshot ID: **{idSnapshotExibicao}**</span>
          </div>

          {alunoSelecionado && (
            <div className="flex gap-2">
              {finalizando ? (
                <span className="text-indigo-600 flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Processando...</span>
              ) : (
                <>
                  {!avaliacaoFinalizada && isSnapshotReady && (
                    <>
                      <button onClick={() => marcarTodos(true)} className="flex items-center gap-1 h-8 bg-green-500 text-white px-4 py-2 rounded-md text-xs font-bold hover:bg-green-600 transition">Todos Atingiu</button>
                      <button onClick={() => marcarTodos(false)} className="flex items-center gap-1 h-8 bg-red-500 text-white px-4 py-2 rounded-md text-xs font-bold hover:bg-red-600 transition">Todos NÃO ATINGIU</button>
                      <button onClick={() => marcarTodos(null)} className="flex items-center gap-1 h-8 bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-xs font-bold hover:bg-gray-400 transition" title="Limpar todas as avaliações">Limpar Tudo</button>
                    </>
                  )}

                  {isSnapshotReady && (
                    <button onClick={avaliacaoFinalizada ? handleReabrir : handleFinalizar} className={`px-4 py-2 rounded-md flex items-center gap-2 h-8 transition shadow-sm font-medium text-xs ml-4 ${avaliacaoFinalizada ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
                      {avaliacaoFinalizada ? <Unlock size={16} /> : <Lock size={16} />}{avaliacaoFinalizada ? 'Reabrir Avaliação' : 'Finalizar Avaliação'}
                    </button>
                  )}
                  
                  {/* BOTÃO FECHAR TURMA */}
                  {isSnapshotReady && (
                    <button 
                        onClick={handleFinalizarTurma}
                        className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center gap-2 shadow-sm font-medium transition text-xs ml-2"
                        title="Finalizar avaliações de todos os alunos"
                    >
                        <ShieldCheck size={16} /> Fechar Turma
                    </button>
                  )}

                  {isSnapshotReady && (
                    <Link href={`/gestao/turmas/${turmaId}/relatorio?estruturaId=${safeEstruturaId}&origem=avaliacao`} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 shadow-sm font-medium transition text-xs"><FileBarChart size={16} /> Relatório</Link>
                  )}

                  {isSnapshotReady && (
                    <button onClick={baixarBoletim} className="bg-gray-200 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-300 flex items-center gap-2 shadow-sm font-medium transition text-xs" title="Download Boletim Individual"><Download size={16} /></button>
                  )}
                </>
              )}
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
          {alunoSelecionado && avaliacaoFinalizada && (<div className="mb-8">{renderStatusFinalizado(alunoSelecionado, resultadoFinal, handleReabrir, finalizando)}</div>)}

          {!alunoSelecionado ? (
            <div className="flex h-full flex-col items-center justify-center text-gray-400"><User size={64} className="mb-4 text-gray-300" /><p className="text-lg">Selecione um aluno na barra lateral para começar.</p></div>
          ) : (
            <div>
              {!isSnapshotReady ? (
                <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center mb-8 ${avaliacaoFinalizada ? 'opacity-50 pointer-events-none' : ''}`}>
                  <AlertCircle size={48} className="text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-yellow-800 mb-2">Estrutura Não Ativa (Snapshot Ausente)</h3>
                  <p className="text-yellow-700">A disciplina <strong>{nomeDisciplina}</strong> (Template ID: {idExibicao}) não possui um Snapshot de Avaliação criado ou ativo para esta turma. **Você precisa criar o Snapshot para continuar a avaliação.**</p>
                  {templateIdSelecionado && (
                    <button onClick={handleGerarSnapshot} disabled={finalizando} className="mt-4 bg-emerald-600 text-white px-6 py-2 rounded-md hover:bg-emerald-700 flex items-center gap-2 text-sm font-medium transition shadow-sm mx-auto disabled:opacity-50">{finalizando ? <Loader2 size={18} className="animate-spin"/> : <Zap size={18}/>} Criar Snapshot Agora e Avaliar</button>
                  )}
                </div>
              ) : (
                <div className={`${avaliacaoFinalizada ? 'opacity-50 pointer-events-none' : ''}`}>
                  {capacidades.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center"><AlertCircle size={48} className="text-yellow-500 mx-auto mb-4" /><h3 className="text-xl font-bold text-yellow-800 mb-2">Sem Critérios</h3><p className="text-yellow-700">O Snapshot desta estrutura de avaliação não tem critérios cadastrados. Verifique a disciplina base.</p></div>
                  ) : (
                    <div className="max-w-5xl mx-auto space-y-8 pb-20">
                      {capacidades.map((cap, index) => (
                        <div key={cap.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                          <div className={`p-4 ${cap.tipo === 'TECNICA' ? 'bg-indigo-50 text-indigo-800' : 'bg-pink-50 text-pink-800'} border-b`}><h3 className="text-lg font-bold">{cap.tipo} {index + 1}. {cap.descricao}</h3></div>
                          <div className="divide-y divide-gray-100">
                            {cap.criterios && cap.criterios.length > 0 ? (
                              cap.criterios.map((crit: Criterio) => {
                                const critId = crit.id;
                                const av = avaliacoesState[critId] || { atendeu: null, obs: '' };
                                return (
                                  <div key={critId} className="p-4 hover:bg-gray-50 transition group">
                                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1"><span className={`w-2 h-2 rounded-full ${crit.tipo === 'CRITICO' ? 'bg-red-500' : 'bg-blue-400'}`}></span><span className="text-[10px] font-bold text-gray-400 uppercase">{crit.tipo}</span></div>
                                        <p className="text-gray-800 font-medium">{crit.descricao}</p>
                                      </div>
                                      <div className="flex items-center gap-2 min-w-[280px] justify-end">
                                        <button onClick={() => salvarAvaliacao(critId, true, av.obs)} className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition ${av.atendeu === true ? "bg-green-600 text-white shadow-md" : "bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700"}`}><CheckCircle size={18} /> Atingiu</button>
                                        <button onClick={() => salvarAvaliacao(critId, false, av.obs)} className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition ${av.atendeu === false ? "bg-red-600 text-white shadow-md" : "bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-700"}`}><XCircle size={18} /> Não Atingiu</button>
                                        {av.atendeu !== null && (<button onClick={() => salvarAvaliacao(critId, null, av.obs)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition" title="Limpar avaliação"><RotateCcw size={16} /></button>)}
                                      </div>
                                    </div>
                                    <div className={`mt-3 ${av.obs ? 'block' : 'hidden group-hover:block'}`}>
                                      <input onBlur={() => av.atendeu !== null && salvarAvaliacao(critId, av.atendeu, av.obs)} placeholder="Observação..." className="w-full text-sm p-2 border rounded bg-white focus:ring-1 focus:ring-blue-300 outline-none" value={av.obs || ''} onChange={(e) => { const val = e.target.value; setAvaliacoesState(prev => ({ ...prev, [critId]: { ...prev[critId], obs: val } })); }} />
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="p-4 text-gray-500 italic text-sm">Nenhum critério vinculado a esta capacidade.</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const renderStatusFinalizado = (aluno: Aluno, resultado: ResultadoBoletimDTO | null, handleReabrir: () => Promise<void>, finalizando: boolean) => {
  if (!aluno || !resultado) return null;
  const nivel = resultado.nivelAlcancado;
  const statusCor = nivel >= 50 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  const statusTexto = nivel >= 50 ? 'APROVADO' : 'RETIDO';
  return (
    <div className="bg-white p-6 rounded-lg shadow-xl border-l-4 border-l-green-600 flex justify-between items-center max-w-5xl mx-auto">
      <div className="flex items-center gap-4"><Lock size={36} className="text-gray-500" /><div><p className="text-xs font-bold text-gray-500 uppercase">Avaliação Finalizada</p><h3 className="text-2xl font-bold text-gray-800">{aluno.nome} - Resultado Final</h3></div></div>
      <div className="flex items-center gap-6"><div className="text-center"><span className="text-4xl font-extrabold text-indigo-700">{resultado.nivelAlcancado}</span><p className="text-xs font-bold text-gray-500">Nível Final</p></div><span className={`px-4 py-2 rounded-full text-sm font-bold ${statusCor}`}>{statusTexto}</span><button onClick={handleReabrir} disabled={finalizando} className="bg-red-500 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-red-600 transition shadow-md disabled:opacity-50"><Unlock size={18} /> Reabrir Edição</button></div>
    </div>
  );
};