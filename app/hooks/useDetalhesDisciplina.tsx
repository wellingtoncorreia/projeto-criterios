 import { useState, useEffect } from 'react';
import api from '@/app/services/api';
import Swal from 'sweetalert2';
import { Disciplina, Capacidade, CapacidadeEdicaoDTO } from '@/app/types';

export function useDetalhesDisciplina(id: string) {
  const [disciplina, setDisciplina] = useState<Disciplina | null>(null);
  const [capacidades, setCapacidades] = useState<Capacidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportador, setShowImportador] = useState(false);
  const [initialData, setInitialData] = useState<CapacidadeEdicaoDTO[] | null>(null);
  const [gerandoNiveis, setGerandoNiveis] = useState(false);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [resDisc, resCap] = await Promise.all([
        api.get<Disciplina>(`/disciplinas/${id}`),
        api.get<Capacidade[]>(`/disciplinas/${id}/capacidades`) 
      ]);
      setDisciplina(resDisc.data);
      setCapacidades(resCap.data);
    } catch (error) {
      Swal.fire('Erro', 'Falha ao carregar dados.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarDados(); }, [id]);

  const handleOpenEditor = (mode: 'import' | 'edit') => {
    if (mode === 'import') {
      setInitialData(null);
      setShowImportador(true);
    } else {
      if (capacidades.length === 0) {
          Swal.fire('Atenção', 'Nada para editar. Importe primeiro.', 'warning');
          return;
      }
      const mappedData: CapacidadeEdicaoDTO[] = capacidades.map(cap => ({
        id: cap.id.toString(), 
        descricao: cap.descricao,
        tipo: cap.tipo,
        criterios: cap.criterios?.map(crit => ({
          id: crit.id.toString(), descricao: crit.descricao, tipo: crit.tipo,
        })) || [],
      }));
      setInitialData(mappedData);
      setShowImportador(true);
    }
  };

  const handleGerarNiveis = async () => {
    const result = await Swal.fire({
      title: 'Gerar Níveis?',
      text: 'Isso substituirá a régua atual.',
      icon: 'warning', showCancelButton: true, confirmButtonText: 'Sim, gerar', cancelButtonText: 'Cancelar'
    });
    
    if (!result.isConfirmed) return;
    setGerandoNiveis(true);
    try {
        await api.post(`/gestao/disciplinas/${id}/gerar-niveis`);
        Swal.fire('Sucesso!', 'Níveis gerados.', 'success');
    } catch (error) {
        Swal.fire('Erro', 'Erro ao gerar níveis.', 'error');
    } finally {
        setGerandoNiveis(false);
    }
  };

  return {
    disciplina, capacidades, loading, 
    modal: {
        isOpen: showImportador,
        close: () => setShowImportador(false),
        open: handleOpenEditor,
        data: initialData,
        onSuccess: () => { setShowImportador(false); carregarDados(); }
    },
    actions: { handleGerarNiveis, reload: carregarDados },
    gerandoNiveis
  };
}