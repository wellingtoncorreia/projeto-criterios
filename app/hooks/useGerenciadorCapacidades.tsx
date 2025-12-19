import { useState, useEffect } from 'react';
import api from '@/app/services/api';
import Swal from 'sweetalert2';
import { Capacidade, NovoCriterioDTO, TipoCriterio } from '@/app/types';

export function useGerenciadorCapacidades(capacidadesIniciais: Capacidade[], onChange: () => void) {
  const [capacidades, setCapacidades] = useState<Capacidade[]>(capacidadesIniciais);
  const [expandedCapacities, setExpandedCapacities] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [novoCrit, setNovoCrit] = useState<NovoCriterioDTO | null>(null);

  useEffect(() => { setCapacidades(capacidadesIniciais); }, [capacidadesIniciais]);

  const toggleExpand = (id: number) => {
    setExpandedCapacities(prev => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const handleCreateCriterio = async (capacidadeId: number) => {
    if (!novoCrit || !novoCrit.descricao.trim()) return Swal.fire('Atenção', 'Descrição vazia.', 'warning');
    
    setLoading(true);
    try {
        await api.post('/gestao/criterios', {
            capacidadeId, descricao: novoCrit.descricao, tipo: novoCrit.tipo,
        });
        Swal.fire('Sucesso!', 'Critério adicionado.', 'success');
        setNovoCrit(null);
        onChange();
    } catch (error) {
        Swal.fire('Erro', 'Falha ao adicionar critério.', 'error');
    } finally { setLoading(false); }
  };
  
  const handleDeleteCriterio = async (critId: number) => {
    const result = await Swal.fire({
      title: 'Excluir?', text: 'Avaliações vinculadas serão perdidas.',
      icon: 'warning', showCancelButton: true, confirmButtonText: 'Sim, excluir'
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        await api.delete(`/criterios/${critId}`);
        Swal.fire('Excluído!', 'Critério removido.', 'success');
        onChange();
      } catch (error) { Swal.fire('Erro', 'Falha ao excluir.', 'error'); } 
      finally { setLoading(false); }
    }
  };

  const toggleNovoCritForm = (capId: number | null, tipo: TipoCriterio = 'CRITICO') => {
    setNovoCrit(capId ? { id: `new-${Date.now()}`, descricao: '', tipo, capacidadeId: capId } : null);
  };

  return {
    capacidades, expandedCapacities, loading, novoCrit,
    actions: { toggleExpand, createCriterio: handleCreateCriterio, deleteCriterio: handleDeleteCriterio, toggleForm: toggleNovoCritForm, setNovoCrit }
  };
}