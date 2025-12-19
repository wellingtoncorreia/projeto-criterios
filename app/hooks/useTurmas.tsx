import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/app/services/api';
import Swal from 'sweetalert2';
import { Turma, Disciplina, DisciplinaOpcao } from '@/app/types';

export function useTurmas() {
  const router = useRouter();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null);
  const [disciplinasModal, setDisciplinasModal] = useState<DisciplinaOpcao[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);

  // 1. Carregar Turmas
  const carregarTurmas = useCallback(async () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || sessionStorage.getItem('token')) : null;
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/turmas', { headers: { Authorization: `Bearer ${token}` } });
      setTurmas(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire('Erro', 'Não foi possível carregar a lista de turmas.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        setUserRole(localStorage.getItem('role') || sessionStorage.getItem('role'));
    }
    carregarTurmas();
  }, [carregarTurmas]);

  // 2. Exclusão
  const handleDelete = async (id: number, nome: string) => {
    const result = await Swal.fire({
      title: 'Excluir Turma?',
      text: `Você está prestes a apagar a turma "${nome}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Sim, excluir'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        await api.delete(`/turmas/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        await Swal.fire('Excluída!', 'Turma removida.', 'success');
        carregarTurmas();
      } catch (error) {
        Swal.fire('Erro', 'Não foi possível excluir.', 'error');
      }
    }
  };

  // 3. Modal e Navegação
  const abrirModalAvaliacao = useCallback(async (turma: Turma) => {
    setSelectedTurma(turma);
    setIsModalOpen(true);
    setLoadingModal(true);
    setDisciplinasModal([]);

    try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const resDiscs = await api.get<Disciplina[]>(`/turmas/${turma.id}/disciplinas`, { headers });
        const disciplinasVerificadas = await Promise.all(resDiscs.data.map(async (d) => {
            let snapId: number | null = null;
            if (d.id === turma.disciplinaId && turma.estruturaSnapshotId) {
                snapId = turma.estruturaSnapshotId;
            } else {
                try {
                    const resSnap = await api.get<number>(`/disciplinas/${d.id}/snapshot-status`, { headers });
                    snapId = resSnap.data;
                } catch { snapId = null; }
            }
            return { ...d, snapshotId: snapId, status: snapId ? 'PRONTO' : 'SEM_SNAPSHOT' } as DisciplinaOpcao;
        }));
        setDisciplinasModal(disciplinasVerificadas);
    } catch (err) {
        Swal.fire('Erro', 'Erro ao carregar disciplinas.', 'error');
        setIsModalOpen(false);
    } finally {
        setLoadingModal(false);
    }
  }, []);

  // --- NOVA FUNÇÃO: CRIAR SNAPSHOT ---
  const criarSnapshot = async (turmaId: number, disciplinaId: number) => {
    setLoadingModal(true);
    try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        // Chama endpoint de criação
        const res = await api.post(`/turmas/${turmaId}/snapshot/${disciplinaId}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const novoSnapshotId = res.data?.estruturaSnapshotId;

        if (novoSnapshotId) {
             // Atualiza a lista localmente para liberar o botão "Avaliar" imediatamente
            setDisciplinasModal(prev => prev.map(d => 
                d.id === disciplinaId ? { ...d, snapshotId: novoSnapshotId, status: 'PRONTO' } : d
            ));
            
            Swal.fire({
                icon: 'success',
                title: 'Snapshot Criado!',
                text: 'A avaliação foi iniciada.',
                timer: 1500,
                showConfirmButton: false
            });
        }
    } catch (err) {
        console.error(err);
        Swal.fire('Erro', 'Erro ao criar Snapshot de avaliação.', 'error');
    } finally {
        setLoadingModal(false);
    }
  };

  const handleNavegarAvaliacao = (turmaId: number, snapshotId: number, discId: number) => {
      setIsModalOpen(false);
      router.push(`/gestao/turmas/${turmaId}/avaliacao?estruturaId=${snapshotId}&discId=${discId}`);
  };

  return {
    turmas, loading, userRole, handleDelete,
    modal: {
        isOpen: isModalOpen,
        close: () => setIsModalOpen(false),
        open: abrirModalAvaliacao,
        data: disciplinasModal,
        selectedTurma,
        loading: loadingModal,
        navegar: handleNavegarAvaliacao,
        criarSnapshot // Exportado aqui
    }
  };
}