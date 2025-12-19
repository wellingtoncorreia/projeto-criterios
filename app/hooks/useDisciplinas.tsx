import { useState, useEffect } from 'react';
import api from '@/app/services/api';
import Swal from 'sweetalert2';
import { Disciplina } from '@/app/types';

export function useDisciplinas() {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarDisciplinas = async () => {
    try {
        const res = await api.get('/disciplinas');
        setDisciplinas(res.data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { carregarDisciplinas(); }, []);

  const handleDelete = async (id: number, nome: string) => {
    const result = await Swal.fire({
        title: 'Excluir Disciplina?',
        text: `Você está prestes a apagar "${nome}".`,
        icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33',
        confirmButtonText: 'Sim, excluir', cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            await api.delete(`/disciplinas/${id}`);
            await Swal.fire('Excluída!', 'Disciplina removida.', 'success');
            carregarDisciplinas();
        } catch (error) {
            Swal.fire('Erro', 'Não foi possível excluir.', 'error');
        }
    }
  };

  return { disciplinas, loading, handleDelete };
}