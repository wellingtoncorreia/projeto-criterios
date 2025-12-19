import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/app/services/api';
import Swal from 'sweetalert2';

export function useNovaDisciplina() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      nome: formData.get('nome'),
      sigla: formData.get('sigla'),
      periodicidade: formData.get('periodicidade'),
      termo: Number(formData.get('termo')),
    };

    try {
      await api.post('/disciplinas', data);
      Swal.fire('Sucesso!', 'Disciplina criada!', 'success');
      router.push('/gestao/disciplinas');
      router.refresh(); 
    } catch (error) {
      Swal.fire('Erro', 'Erro ao criar disciplina.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return { loading, handleSubmit };
}