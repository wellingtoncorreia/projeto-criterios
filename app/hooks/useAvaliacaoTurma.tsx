import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/services/api";
import Swal from 'sweetalert2';
import { Turma, Aluno, Capacidade, DisciplinaDisponivel, ResultadoBoletimDTO, AvaliacaoEstado } from "@/app/types";

export function useAvaliacaoTurma(turmaId: string, initialEstruturaId: string | null, initialDiscId: string | null) {
  const router = useRouter();
  const [turma, setTurma] = useState<Turma | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [disciplinasDisponiveis, setDisciplinasDisponiveis] = useState<DisciplinaDisponivel[]>([]);
  const [selectedEstruturaId, setSelectedEstruturaId] = useState<string | null>(initialEstruturaId);
  const [selectedDiscId, setSelectedDiscId] = useState<string | null>(initialDiscId);

  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const [capacidades, setCapacidades] = useState<Capacidade[]>([]);
  const [avaliacoesState, setAvaliacoesState] = useState<Record<number, AvaliacaoEstado>>({});
  
  const [avaliacaoFinalizada, setAvaliacaoFinalizada] = useState(false);
  const [resultadoFinal, setResultadoFinal] = useState<ResultadoBoletimDTO | null>(null);
  const [finalizando, setFinalizando] = useState(false);

  // Computed
  const disciplinaSelecionada = useMemo(() => {
    if (selectedDiscId) return disciplinasDisponiveis.find(d => d.id.toString() === selectedDiscId);
    if (!selectedEstruturaId) return undefined;
    return disciplinasDisponiveis.find(d => d.avaliacaoId.toString() === selectedEstruturaId) || disciplinasDisponiveis.find(d => d.id.toString() === selectedEstruturaId);
  }, [disciplinasDisponiveis, selectedEstruturaId, selectedDiscId]);

  const templateIdSelecionado = disciplinaSelecionada?.id?.toString() ?? null;
  const isSnapshotReady = disciplinaSelecionada && selectedEstruturaId && disciplinaSelecionada.id.toString() !== selectedEstruturaId;

  // Actions
  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const [resTurma, resAlunos, resDiscs] = await Promise.all([
        api.get<Turma>(`/turmas/${turmaId}`), api.get<Aluno[]>(`/turmas/${turmaId}/alunos`), api.get<any[]>(`/turmas/${turmaId}/disciplinas`)
      ]);
      setTurma(resTurma.data);
      setAlunos(resAlunos.data);

      const mappedDiscs = await Promise.all(resDiscs.data.map(async d => {
          let avId = d.id;
          if (d.id === resTurma.data.disciplinaId && resTurma.data.estruturaSnapshotId) avId = resTurma.data.estruturaSnapshotId;
          else {
              try { const r = await api.get(`/disciplinas/${d.id}/snapshot-status`); avId = r.data; } catch {}
          }
          return { ...d, isPrincipal: d.id === resTurma.data.disciplinaId, avaliacaoId: avId } as DisciplinaDisponivel;
      }));
      setDisciplinasDisponiveis(mappedDiscs);

      // Auto-select logic
      if (!selectedEstruturaId && mappedDiscs.length > 0) {
          const def = mappedDiscs.find(d => d.isPrincipal) || mappedDiscs[0];
          setSelectedEstruturaId(def.avaliacaoId.toString());
          setSelectedDiscId(def.id.toString());
      }
      if (!alunoSelecionado && resAlunos.data.length > 0) setAlunoSelecionado(resAlunos.data[0]);

    } catch (err) { Swal.fire('Erro', 'Falha ao carregar dados.', 'error'); } 
    finally { setLoading(false); }
  }, [turmaId]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  // Carregar Estrutura e Avaliações
  useEffect(() => {
      if (!selectedEstruturaId || !isSnapshotReady) {
          setCapacidades([]); return;
      }
      const loadEstrutura = async () => {
          try {
              const res = await api.get(`/estrutura/${selectedEstruturaId}/capacidades`);
              setCapacidades(res.data);
              if (alunoSelecionado) checkFinalizacao(alunoSelecionado.id, selectedEstruturaId);
          } catch { setCapacidades([]); }
      };
      loadEstrutura();
  }, [selectedEstruturaId, isSnapshotReady, alunoSelecionado]);

  const checkFinalizacao = async (alunoId: number, estId: string) => {
      try {
          const res = await api.get(`/avaliacoes`, { params: { alunoId, estruturaDisciplinaId: estId } });
          const avs = res.data || [];
          const finalizada = avs.some((a: any) => a.finalizada);
          setAvaliacaoFinalizada(finalizada);
          
          if (finalizada) {
              const bol = await api.get(`/avaliacoes/boletim`, { params: { alunoId, estruturaDisciplinaId: estId } });
              setResultadoFinal(bol.data);
          } else setResultadoFinal(null);

          const map: Record<number, AvaliacaoEstado> = {};
          avs.forEach((a: any) => { map[a.criterio?.id || a.criterioId] = { atendeu: a.atendeu, obs: a.observacao, finalizada: a.finalizada }; });
          setAvaliacoesState(map);
      } catch {}
  };

  // Actions de Negócio
  const handleGerarSnapshot = async () => {
      const result = await Swal.fire({ title: 'Criar Snapshot?', text: 'Cria versão imutável.', icon: 'info', showCancelButton: true });
      if (!result.isConfirmed) return;
      setFinalizando(true);
      try {
          const res = await api.post(`/turmas/${turmaId}/snapshot/${templateIdSelecionado}`);
          const newId = res.data.estruturaSnapshotId;
          setTurma(res.data);
          setSelectedEstruturaId(newId.toString());
          router.push(`/gestao/turmas/${turmaId}/avaliacao?estruturaId=${newId}&discId=${templateIdSelecionado}`);
          Swal.fire('Sucesso', 'Snapshot criado.', 'success');
          carregarDados();
      } catch (e) { Swal.fire('Erro', 'Falha ao criar snapshot.', 'error'); }
      finally { setFinalizando(false); }
  };

  const salvarAvaliacao = async (criterioId: number, atendeu: boolean | null, obs: string) => {
      setAvaliacoesState(p => ({...p, [criterioId]: { atendeu, obs, finalizada: false }}));
      try {
          await api.post(`/avaliacoes`, { alunoId: alunoSelecionado!.id, estruturaDisciplinaId: Number(selectedEstruturaId), criterioId, atendeu, observacao: obs });
      } catch { Swal.fire('Erro', 'Falha ao salvar.', 'error'); }
  };

  const marcarTodos = async (val: boolean | null) => {
      if (!alunoSelecionado || !selectedEstruturaId) return;
      const ids = capacidades.flatMap(c => c.criterios || []).map(crit => crit.id);
      setFinalizando(true);
      try {
          await Promise.all(ids.map(cid => api.post(`/avaliacoes`, { alunoId: alunoSelecionado!.id, estruturaDisciplinaId: Number(selectedEstruturaId), criterioId: cid, atendeu: val, observacao: '' })));
          checkFinalizacao(alunoSelecionado.id, selectedEstruturaId);
          Swal.fire('Sucesso', 'Massa atualizada.', 'success');
      } catch { Swal.fire('Erro', 'Falha em massa.', 'error'); }
      finally { setFinalizando(false); }
  };

  const handleFinalizar = async (turmaMode = false) => {
      if (!selectedEstruturaId) return;
      if (turmaMode && !await Swal.fire({ title: 'Fechar Turma?', text: 'Todos os alunos serão finalizados.', icon: 'warning', showCancelButton: true }).then(r => r.isConfirmed)) return;
      
      setFinalizando(true);
      try {
          const url = turmaMode ? `/avaliacoes/fechar/turma/${turmaId}` : `/avaliacoes/fechar`;
          const params = turmaMode ? { estruturaDisciplinaId: selectedEstruturaId } : { alunoId: alunoSelecionado!.id, estruturaDisciplinaId: selectedEstruturaId };
          
          if (turmaMode) await api.post(`${url}?estruturaDisciplinaId=${selectedEstruturaId}`);
          else await api.post(`${url}?alunoId=${alunoSelecionado!.id}&estruturaDisciplinaId=${selectedEstruturaId}`);
          
          Swal.fire('Sucesso', 'Finalizado.', 'success');
          if (alunoSelecionado) checkFinalizacao(alunoSelecionado.id, selectedEstruturaId);
      } catch { Swal.fire('Erro', 'Falha ao finalizar.', 'error'); }
      finally { setFinalizando(false); }
  };
  
  const handleSelectDiscipline = (id: string) => {
      const d = disciplinasDisponiveis.find(x => x.id.toString() === id);
      if (d) {
          setSelectedEstruturaId(d.avaliacaoId.toString());
          setSelectedDiscId(id);
          router.push(`/gestao/turmas/${turmaId}/avaliacao?estruturaId=${d.avaliacaoId}&discId=${id}`);
      }
  };

  return {
    turma, alunos, loading, capacidades, 
    selection: { aluno: alunoSelecionado, setAluno: setAlunoSelecionado, discId: selectedDiscId, setDiscId: handleSelectDiscipline, estId: selectedEstruturaId, disciplinas: disciplinasDisponiveis },
    avaliacao: { state: avaliacoesState, finalizada: avaliacaoFinalizada, resultado: resultadoFinal, finalizando, isSnapshotReady },
    actions: { handleGerarSnapshot, salvarAvaliacao, marcarTodos, finalizar: handleFinalizar, reabrir: () => {/*Implementar similar*/}, baixarBoletim: () => {/*Implementar*/} }
  };
}