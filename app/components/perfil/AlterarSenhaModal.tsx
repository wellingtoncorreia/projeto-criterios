'use client';

import { useState } from 'react';
import { Lock, X } from 'lucide-react';
import api from '@/app/services/api';
import Swal from 'sweetalert2';

interface Props {
  onClose: () => void;
}

export default function AlterarSenhaModal({ onClose }: Props) {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenha.length < 6) {
        Swal.fire('Atenção', 'A nova senha deve ter pelo menos 6 caracteres.', 'warning');
        return;
    }
    setLoading(true);

    try {
      await api.post('/admin/perfil/alterar-senha', {
        senhaAtual,
        novaSenha
      });
      
      Swal.fire({
        title: 'Sucesso!',
        text: 'Sua senha foi alterada com sucesso. Você será desconectado.',
        icon: 'success',
        confirmButtonColor: '#10b981'
      }).then(() => {
        // Força logout após alteração de senha
        localStorage.clear();
        window.location.href = '/login'; 
      });
    } catch (error: any) {
      const msg = error.response?.data || 'Erro ao alterar senha. Verifique a senha atual.';
      Swal.fire('Erro', typeof msg === 'string' ? msg : 'Erro ao alterar senha.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-100 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Lock size={22} /> Alterar Senha</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha Atual</label>
            <input required type="password" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} placeholder="Sua senha atual" className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
            <input required type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} placeholder="Nova senha (mín. 6 caracteres)" className="w-full p-2 border rounded" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white p-2 rounded font-bold hover:bg-indigo-700 disabled:opacity-50">
            {loading ? 'Salvando...' : 'Confirmar Alteração'}
          </button>
        </form>
      </div>
    </div>
  );
}