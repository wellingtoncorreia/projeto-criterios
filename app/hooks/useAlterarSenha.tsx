import { useState } from 'react';
import api from '@/app/services/api';
import Swal from 'sweetalert2';

export function useAlterarSenha(onClose: () => void) {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenha.length < 6) return Swal.fire('Atenção', 'A nova senha deve ter pelo menos 6 caracteres.', 'warning');
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await api.post('/admin/perfil/alterar-senha', { senhaAtual, novaSenha }, { headers: { Authorization: `Bearer ${token}` } });
      
      await Swal.fire({ title: 'Sucesso!', text: 'Senha alterada. Faça login novamente.', icon: 'success', confirmButtonColor: '#10b981' });
      
      if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = '/login'; 
      }
    } catch (error: any) {
      Swal.fire('Erro', error.response?.data || 'Erro ao alterar senha.', 'error');
    } finally { setLoading(false); }
  };

  return { senhaAtual, setSenhaAtual, novaSenha, setNovaSenha, loading, handleSubmit };
}