import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/app/services/api';
import Swal from 'sweetalert2';
import { Turma, Aluno, Disciplina, DisciplinaOpcao } from '@/app/types';

export function useDetalhesTurma(id: string) {
  const router = useRouter();
  const [turma, setTurma] = useState<Turma | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportador, setShowImportador] = useState(false);
  
  // Modal Avaliação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [disciplinasModal, setDisciplinasModal] = useState<DisciplinaOpcao[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [resTurma, resAlunos] = await Promise.all([
        api.get<Turma>(`/turmas/${id}`),
        api.get<Aluno[]>(`/turmas/${id}/alunos`) 
      ]);
      setTurma(resTurma.data);
      setAlunos(resAlunos.data);
    } catch (error) {
      Swal.fire('Erro', 'Erro ao carregar turma.', 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { carregarDados(); }, [id]);

  const handleDeleteAluno = async (alunoId: number) => {
    const result = await Swal.fire({
      title: 'Excluir Aluno?', text: 'Notas serão perdidas.',
      icon: 'warning', showCancelButton: true, confirmButtonText: 'Sim, excluir'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/alunos/${alunoId}`);
        Swal.fire('Excluído!', 'Aluno removido.', 'success');
        carregarDados(); 
      } catch (error) { Swal.fire('Erro', 'Falha ao excluir.', 'error'); }
    }
  };

  const abrirModalAvaliacao = async () => {
    if (!turma) return;
    setIsModalOpen(true);
    setLoadingModal(true);
    setDisciplinasModal([]);

    try {
        const resDiscs = await api.get<Disciplina[]>(`/turmas/${turma.id}/disciplinas`);
        const checked = await Promise.all(resDiscs.data.map(async (d) => {
            let snapId = (d.id === turma.disciplinaId && turma.estruturaSnapshotId) ? turma.estruturaSnapshotId : null;
            if (!snapId) {
                try {
                    const res = await api.get<number>(`/disciplinas/${d.id}/snapshot-status`);
                    snapId = res.data;
                } catch { snapId = null; }
            }
            return { ...d, snapshotId: snapId, status: snapId ? 'PRONTO' : 'SEM_SNAPSHOT' } as DisciplinaOpcao;
        }));
        setDisciplinasModal(checked);
    } catch (err) {
        Swal.fire('Erro', 'Erro ao buscar disciplinas.', 'error');
        setIsModalOpen(false);
    } finally { setLoadingModal(false); }
  };

  const navegarAvaliacao = (snapshotId: number, discId: number) => {
      setIsModalOpen(false);
      router.push(`/gestao/turmas/${id}/avaliacao?estruturaId=${snapshotId}&discId=${discId}`);
  };

  return {
    turma, alunos, loading, showImportador, setShowImportador,
    modalAvaliacao: {
        isOpen: isModalOpen,
        close: () => setIsModalOpen(false),
        open: abrirModalAvaliacao,
        data: disciplinasModal,
        loading: loadingModal,
        navegar: navegarAvaliacao
    },
    actions: { handleDeleteAluno, reload: carregarDados },
    isStructureReady: turma?.estruturaSnapshotId !== undefined && turma?.estruturaSnapshotId !== null
  };
}