import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/app/services/api'; 
import Swal from 'sweetalert2';

export function useLogin() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState(''); 

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = { email, senha, nome: isRegister ? nome : undefined };

      const res = await api.post(endpoint, payload);
      
      if (isRegister) {
        Swal.fire({
          title: 'Sucesso!',
          text: 'Cadastro realizado com sucesso. Faça login agora.',
          icon: 'success',
          confirmButtonColor: '#4338ca' 
        });
        setIsRegister(false);
        setLoading(false);
      } else {
        sessionStorage.setItem('token', res.data.token);
        sessionStorage.setItem('user', res.data.nome || 'Professor'); 
        sessionStorage.setItem('role', res.data.tipo);
        localStorage.setItem('lastActiveTime', Date.now().toString());
        router.push('/dashboard'); 
      }
    } catch (err: any) {
      setLoading(false);
      Swal.fire({
        title: 'Erro de Acesso',
        text: err.response?.data?.message || 'Credenciais inválidas ou erro no servidor.',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    }
  }

  return {
    form: { email, setEmail, senha, setSenha, nome, setNome },
    state: { isRegister, setIsRegister, loading },
    actions: { handleLogin }
  };
}