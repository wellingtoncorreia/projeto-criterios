'use client';
import { UserPlus, Mail, Lock, User } from 'lucide-react';
import { useProfessores } from '@/app/hooks/useProfessores';

export default function GestaoProfessoresPage() {
  const { professores, loading, formData, setFormData, handleCadastro } = useProfessores();

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Gestão Docente</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 sticky top-24">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><UserPlus className="text-indigo-600" /> Novo Professor</h2>
                <form onSubmit={handleCadastro} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Nome</label>
                        <div className="flex items-center border rounded-md px-3 bg-gray-50"><User size={16} className="text-gray-400" /><input required className="w-full p-2 bg-transparent outline-none text-sm" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} /></div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                        <div className="flex items-center border rounded-md px-3 bg-gray-50"><Mail size={16} className="text-gray-400" /><input required type="email" className="w-full p-2 bg-transparent outline-none text-sm" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Senha</label>
                        <div className="flex items-center border rounded-md px-3 bg-gray-50"><Lock size={16} className="text-gray-400" /><input required type="password" className="w-full p-2 bg-transparent outline-none text-sm" value={formData.senha} onChange={e => setFormData({...formData, senha: e.target.value})} /></div>
                    </div>
                    <button className="w-full bg-indigo-600 text-white py-2 rounded-md font-bold hover:bg-indigo-700 transition">Cadastrar</button>
                </form>
            </div>
        </div>
        <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b"><h3 className="font-bold text-gray-700">Professores Ativos ({professores.length})</h3></div>
                {loading ? <div className="p-8 text-center text-gray-400">Carregando...</div> : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 border-b"><tr><th className="px-6 py-3">Nome</th><th className="px-6 py-3">Email</th><th className="px-6 py-3 text-center">Status</th></tr></thead>
                        <tbody className="divide-y divide-gray-100">
                            {professores.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">{p.nome.charAt(0)}</div>{p.nome}</td>
                                    <td className="px-6 py-4 text-gray-600">{p.email}</td>
                                    <td className="px-6 py-4 text-center"><span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">Ativo</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}