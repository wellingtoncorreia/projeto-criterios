import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/services/api";
import Swal from 'sweetalert2';
import { Turma, Aluno, Capacidade, Disciplina, Avaliacao, Criterio } from "@/app/types";

// Tipos auxiliares locais ou exportados
export interface DisciplinaDisponivel extends Disciplina {
  avaliacaoId: number;
  isPrincipal: boolean;
}

export interface ResultadoBoletimDTO {
  nomeAluno: string;
  nomeDisciplina: string;
  nivelAlcancado: number;
}

export interface AvaliacaoEstado {
  atendeu: boolean | null;
  obs: string;
  finalizada: boolean | undefined;
}

export function useAvaliacaoTurma(turmaId: string, initialEstruturaId: string | null, initialDiscId: string | null) {
  const router = useRouter();
  
  // --- ESTADOS DE DADOS ---
  const [turma, setTurma] = useState<Turma | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [disciplinasDisponiveis, setDisciplinasDisponiveis] = useState<DisciplinaDisponivel[]>([]);
  
  // --- ESTADOS DE SELEÇÃO ---
  const [selectedEstruturaId, setSelectedEstruturaId] = useState<string | null>(initialEstruturaId);
  const [selectedDiscId, setSelectedDiscId] = useState<string | null>(initialDiscId);
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);

  // --- ESTADOS DE AVALIAÇÃO ---
  const [capacidades, setCapacidades] = useState<Capacidade[]>([]);
  const [avaliacoesState, setAvaliacoesState] = useState<Record<number, AvaliacaoEstado>>({});
  const [avaliacaoFinalizada, setAvaliacaoFinalizada] = useState(false);
  const [resultadoFinal, setResultadoFinal] = useState<ResultadoBoletimDTO | null>(null);
  const [finalizando, setFinalizando] = useState(false);

  // --- COMPUTED (Memoized) ---
  const disciplinaSelecionada = useMemo(() => {
    if (selectedDiscId) return disciplinasDisponiveis.find(d => d.id.toString() === selectedDiscId);
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

  const nomeDisciplina = disciplinaSelecionada?.nome || turma?.nomeDisciplina || 'N/A';
  const idSnapshotExibicao = isSnapshotReady ? selectedEstruturaId : 'AUSENTE';
  const todosCriteriosIds = useMemo(() => capacidades.flatMap(cap => cap.criterios ? cap.criterios.map(c => c.id) : []), [capacidades]);

  // --- ACTIONS: Carregamento Inicial ---
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
      setAlunos(Array.isArray(resAlunos.data) ? resAlunos.data : []);

      const defaultSnapshotId = turmaData.estruturaSnapshotId || 0;
      
      const initialDiscs: DisciplinaDisponivel[] = Array.isArray(resDiscs.data) ? resDiscs.data.map(d => ({
        ...d, isPrincipal: d.id === turmaData.disciplinaId, avaliacaoId: d.id, 
      })) : [];
      
      const mappedDiscs = await Promise.all(initialDiscs.map(async d => {
          if (d.isPrincipal && defaultSnapshotId) return { ...d, avaliacaoId: defaultSnapshotId };
          try {
              const res = await api.get<number>(`/disciplinas/${d.id}/snapshot-status`);
              return { ...d, avaliacaoId: res.data };
          } catch { return d; }
      }));
      setDisciplinasDisponiveis(mappedDiscs);

      // Auto-seleção de disciplina/estrutura se não vier na URL
      if (!selectedEstruturaId && mappedDiscs.length > 0) {
          const def = mappedDiscs.find(d => d.isPrincipal) || mappedDiscs[0];
          setSelectedEstruturaId(def.avaliacaoId.toString());
          setSelectedDiscId(def.id.toString());
      }
      // Auto-seleção de aluno
      if (!alunoSelecionado && resAlunos.data.length > 0) {
          setAlunoSelecionado(resAlunos.data[0]);
      }

    } catch (err) {
      console.error(err); Swal.fire('Erro', 'Erro ao carregar dados da turma.', 'error');
    } finally { setLoading(false); }
  }, [turmaId, selectedEstruturaId, alunoSelecionado]);

  useEffect(() => { carregarTurmaEAuxiliares(); }, [carregarTurmaEAuxiliares]);

  // --- ACTIONS: Checagem de Status ---
  const checarStatusFinalizacao = useCallback(async (alunoId: number, estruturaId: string) => {
    if (!estruturaId || !isSnapshotReady) {
      setAvaliacaoFinalizada(false); setResultadoFinal(null); setAvaliacoesState({}); return;
    }
    try {
      const res = await api.get(`/avaliacoes`, { params: { alunoId, estruturaDisciplinaId: estruturaId } });
      const avaliacoes = Array.isArray(res.data) ? res.data : [];
      const isFinalizada = avaliacoes.some((av: any) => av.finalizada === true);
      setAvaliacaoFinalizada(isFinalizada);
      
      if (isFinalizada) {
        const resBol = await api.get<ResultadoBoletimDTO>(`/avaliacoes/boletim`, { params: { alunoId, estruturaDisciplinaId: estruturaId } });
        setResultadoFinal(resBol.data);
      } else setResultadoFinal(null);

      const mapa: Record<number, AvaliacaoEstado> = {};
      avaliacoes.forEach((av: any) => {
        const cId = av.criterio?.id || av.criterioId;
        if (cId) mapa[cId] = { atendeu: av.atendeu, obs: av.observacao || '', finalizada: av.finalizada };
      });
      setAvaliacoesState(mapa);
    } catch {
      setAvaliacaoFinalizada(false); setResultadoFinal(null); setAvaliacoesState({});
    }
  }, [isSnapshotReady]);

  // Carregar Capacidades quando a estrutura muda
  useEffect(() => {
    const load = async () => {
      if (!selectedEstruturaId || !isSnapshotReady) {
        setCapacidades([]); return;
      }
      setLoading(true);
      try {
        const res = await api.get<Capacidade[]>(`/estrutura/${selectedEstruturaId}/capacidades`);
        setCapacidades(Array.isArray(res.data) ? res.data : []);
        if (alunoSelecionado) await checarStatusFinalizacao(alunoSelecionado.id, selectedEstruturaId);
      } catch {
        setCapacidades([]); Swal.fire('Erro', 'Falha ao carregar estrutura de critérios.', 'error');
      } finally { setLoading(false); }
    };
    load();
  }, [selectedEstruturaId, isSnapshotReady, alunoSelecionado, checarStatusFinalizacao]);


  // --- ACTIONS: Negócio ---

  const handleGerarSnapshot = async () => {
    if (!turma || !templateIdSelecionado) return;
    const res = await Swal.fire({ title: 'Criar Snapshot?', text: 'Criar versão imutável para avaliação?', icon: 'info', showCancelButton: true, confirmButtonText: 'Sim' });
    if (!res.isConfirmed) return;
    
    setFinalizando(true);
    try {
      const apiRes = await api.post<Turma>(`/turmas/${turmaId}/snapshot/${templateIdSelecionado}`);
      const novoId = apiRes.data?.estruturaSnapshotId;
      if (novoId) {
        setTurma(apiRes.data);
        setDisciplinasDisponiveis(prev => prev.map(d => d.id.toString() === templateIdSelecionado ? { ...d, avaliacaoId: novoId } : d));
        setSelectedEstruturaId(novoId.toString());
        router.push(`/gestao/turmas/${turmaId}/avaliacao?estruturaId=${novoId}&discId=${templateIdSelecionado}`);
        Swal.fire('Sucesso!', 'Snapshot criado.', 'success');
      }
    } catch (e) { Swal.fire('Erro', 'Falha ao criar Snapshot.', 'error'); } 
    finally { setFinalizando(false); }
  };

  const handleAtualizarSnapshot = async () => {
    const res = await Swal.fire({ title: 'Atualizar Snapshot?', text: 'Isso recria a estrutura baseada no template atual. Cuidado ao alterar.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sim, Atualizar', confirmButtonColor: '#f59e0b' });
    if (!res.isConfirmed || !templateIdSelecionado) return;
    
    setFinalizando(true);
    try {
      const apiRes = await api.post<Turma>(`/turmas/${turmaId}/snapshot/${templateIdSelecionado}`);
      const novoId = apiRes.data?.estruturaSnapshotId;
      if (novoId) {
        setDisciplinasDisponiveis(prev => prev.map(d => d.id.toString() === templateIdSelecionado ? { ...d, avaliacaoId: novoId } : d));
        setSelectedEstruturaId(novoId.toString());
        Swal.fire('Atualizado!', 'Estrutura recriada.', 'success');
      }
    } catch { Swal.fire('Erro', 'Falha ao atualizar.', 'error'); }
    finally { setFinalizando(false); }
  };

  const salvarAvaliacao = async (criterioId: number, atendeu: boolean | null, obs: string) => {
    if (avaliacaoFinalizada || !alunoSelecionado || !isSnapshotReady) return;
    setAvaliacoesState(prev => ({ ...prev, [criterioId]: { atendeu, obs, finalizada: false } }));
    try {
      await api.post(`/avaliacoes`, { alunoId: alunoSelecionado.id, estruturaDisciplinaId: Number(selectedEstruturaId), criterioId, atendeu, observacao: obs });
    } catch { 
      Swal.fire({ title: 'Erro ao salvar', toast: true, position: 'bottom-end', icon: 'error', timer: 2000, showConfirmButton: false });
    }
  };

  const marcarTodos = async (atendeu: boolean | null) => {
    if (!alunoSelecionado || !selectedEstruturaId || !isSnapshotReady) return;
    setFinalizando(true);
    try {
      const promises = todosCriteriosIds.map(critId => api.post(`/avaliacoes`, {
        alunoId: alunoSelecionado.id, estruturaDisciplinaId: Number(selectedEstruturaId), criterioId: critId, atendeu, observacao: avaliacoesState[critId]?.obs || ''
      }));
      await Promise.all(promises);
      setAvaliacoesState(prev => {
        const novo = { ...prev };
        todosCriteriosIds.forEach(id => novo[id] = { atendeu, obs: novo[id]?.obs || '', finalizada: false });
        return novo;
      });
      Swal.fire({ icon: 'success', title: 'Atualizado!', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
    } catch { Swal.fire('Erro', 'Falha na atualização em massa.', 'error'); }
    finally { setFinalizando(false); }
  };

  const toggleStatusAvaliacao = async (finalizar: boolean) => {
    if (!alunoSelecionado || !selectedEstruturaId) return;
    const action = finalizar ? 'fechar' : 'reabrir';
    const confirm = await Swal.fire({ title: finalizar ? 'Finalizar?' : 'Reabrir?', icon: 'question', showCancelButton: true });
    if (!confirm.isConfirmed) return;
    
    setFinalizando(true);
    try {
      const res = await api.post(`/avaliacoes/${action}?alunoId=${alunoSelecionado.id}&estruturaDisciplinaId=${selectedEstruturaId}`);
      if (finalizar) setResultadoFinal(res.data);
      else setResultadoFinal(null);
      
      setAvaliacaoFinalizada(finalizar);
      await checarStatusFinalizacao(alunoSelecionado.id, selectedEstruturaId);
      Swal.fire('Sucesso!', `Avaliação ${finalizar ? 'finalizada' : 'reaberta'}.`, 'success');
    } catch (e: any) { Swal.fire('Erro', e.response?.data || 'Erro na operação.', 'error'); }
    finally { setFinalizando(false); }
  };

  const handleFinalizarTurma = async () => {
    const res = await Swal.fire({ title: 'Fechar Turma?', text: 'Isso fechará a nota de TODOS os alunos.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#7e22ce' });
    if (!res.isConfirmed || !turmaId) return;
    
    setFinalizando(true);
    try {
      await api.post(`/avaliacoes/fechar/turma/${turmaId}?estruturaDisciplinaId=${selectedEstruturaId}`);
      Swal.fire('Concluído!', 'Turma fechada.', 'success');
      if (alunoSelecionado) await checarStatusFinalizacao(alunoSelecionado.id, selectedEstruturaId!);
    } catch { Swal.fire('Erro', 'Falha ao fechar turma.', 'error'); }
    finally { setFinalizando(false); }
  };

  const handleSelectDiscipline = (val: string) => {
    const d = disciplinasDisponiveis.find(x => x.id.toString() === val);
    if (d) {
        setSelectedEstruturaId(d.avaliacaoId.toString());
        setSelectedDiscId(val);
        router.push(`/gestao/turmas/${turmaId}/avaliacao?estruturaId=${d.avaliacaoId}&discId=${val}`);
    }
  };

  const baixarBoletim = async () => {
    if (!alunoSelecionado || !selectedEstruturaId) return;
    try {
      const res = await api.get('/arquivos/boletim/download', { params: { alunoId: alunoSelecionado.id, disciplinaId: selectedEstruturaId }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Boletim_${alunoSelecionado.nome}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch { Swal.fire('Erro', 'Falha no download.', 'error'); }
  };

  return {
    // Dados Principais
    turma, alunos, loading, capacidades,
    // Seleção
    selection: { 
        aluno: alunoSelecionado, 
        setAluno: setAlunoSelecionado, 
        discId: selectedDiscId, 
        setDiscId: handleSelectDiscipline, 
        estId: selectedEstruturaId, 
        disciplinas: disciplinasDisponiveis 
    },
    // Estado da Avaliação Atual
    avaliacao: { 
        state: avaliacoesState, 
        finalizada: avaliacaoFinalizada, 
        resultado: resultadoFinal, 
        finalizando, 
        isSnapshotReady,
        idSnapshotExibicao,
        templateIdSelecionado
    },
    // Ações
    actions: { 
        handleGerarSnapshot, 
        handleAtualizarSnapshot,
        salvarAvaliacao, 
        marcarTodos, 
        toggleStatusAvaliacao,
        handleFinalizarTurma,
        baixarBoletim
    }
  };
}