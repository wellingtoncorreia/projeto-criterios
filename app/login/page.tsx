'use client';

import { useLogin } from '@/app/hooks/useLogin';
import { GraduationCap, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { form, state, actions } = useLogin();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-100">
        
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-50 p-3 rounded-full mb-3">
            <GraduationCap size={40} className="text-indigo-700" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            {state.isRegister ? 'Criar Conta' : 'Acesso Docente'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Sistema de Gestão SENAI</p>
        </div>

        <form onSubmit={actions.handleLogin} className="space-y-4">
          {state.isRegister && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
              <input className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none transition" placeholder="Ex: Carlos Silva" value={form.nome} onChange={e => form.setNome(e.target.value)} required={state.isRegister} />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Institucional</label>
            <input className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none transition" placeholder="professor@sp.senai.br" type="email" value={form.email} onChange={e => form.setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none transition" type="password" placeholder="••••••••" value={form.senha} onChange={e => form.setSenha(e.target.value)} required />
          </div>

          <button type="submit" disabled={state.loading} className="w-full bg-indigo-700 text-white p-2.5 rounded-md font-medium hover:bg-indigo-800 transition duration-200 flex items-center justify-center gap-2 mt-6 disabled:opacity-70">
            {state.loading ? <><Loader2 className="animate-spin" size={20} /> Processando...</> : (state.isRegister ? 'Cadastrar Professor' : 'Entrar no Sistema')}
          </button>
        </form>
      </div>
    </div>
  );
}