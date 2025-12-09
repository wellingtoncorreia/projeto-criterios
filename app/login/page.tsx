'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/app/services/api'; // Verifique se o caminho do seu axios está correto
import Swal from 'sweetalert2';
import { GraduationCap, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  
  // Estados
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState(''); // Adicionei para capturar o nome real no cadastro

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      
      // No cadastro envia o nome digitado, no login envia undefined (a API ignora)
      const payload = { 
        email, 
        senha, 
        nome: isRegister ? nome : undefined 
      };

      const res = await api.post(endpoint, payload);
      
      if (isRegister) {
        Swal.fire({
          title: 'Sucesso!',
          text: 'Cadastro realizado com sucesso. Faça login agora.',
          icon: 'success',
          confirmButtonColor: '#4338ca' // Indigo-700
        });
        setIsRegister(false);
        setLoading(false);
      } else {
        // LOGIN COM SUCESSO
        // 1. Salva o Token
        localStorage.setItem('token', res.data.token);
        
        // 2. Salva o Nome (A Navbar vai ler isso para mostrar a inicial)
        // Certifique-se que sua API retorna { token: '...', nome: 'Nome do User' }
        localStorage.setItem('user', res.data.nome || 'Professor'); 
        localStorage.setItem('role', res.data.tipo);
        
        router.push('/dashboard'); // Redireciona para a Home (Dashboard)
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-100">
        
        {/* Cabeçalho com Logo SENAI style */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-50 p-3 rounded-full mb-3">
            <GraduationCap size={40} className="text-indigo-700" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isRegister ? 'Criar Conta' : 'Acesso Docente'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Sistema de Gestão SENAI</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Campo de Nome (Aparece apenas no Cadastro) */}
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
              <input 
                className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" 
                placeholder="Ex: Carlos Silva" 
                value={nome} 
                onChange={e => setNome(e.target.value)}
                required={isRegister}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Institucional</label>
            <input 
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" 
              placeholder="professor@sp.senai.br" 
              type="email"
              value={email} 
              onChange={e => setEmail(e.target.value)}
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input 
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition" 
              type="password" 
              placeholder="••••••••" 
              value={senha} 
              onChange={e => setSenha(e.target.value)}
              required 
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-700 text-white p-2.5 rounded-md font-medium hover:bg-indigo-800 transition duration-200 flex items-center justify-center gap-2 mt-6 disabled:opacity-70"
          >
            {loading ? (
              <> <Loader2 className="animate-spin" size={20} /> Processando... </>
            ) : (
              isRegister ? 'Cadastrar Professor' : 'Entrar no Sistema'
            )}
          </button>
        </form>

      </div>
    </div>
  );
}