'use client';

import Link from 'next/link';
import { ArrowLeft, Save, Users, UserCheck, Lock } from "lucide-react";
import { useEditarTurma } from '@/app/hooks/useEditarTurma';

export default function EditarTurmaPage() {
  const {
    id,
    loading,
    professores,
    formData, setFormData,
    prof1, setProf1,
    prof2, setProf2,
    handleSubmit,
    isGestor
  } = useEditarTurma();

  if (!id) return <div className="p-8 text-center text-gray-400">ID da turma não encontrado.</div>;
  if (loading) return <div className="p-8 text-center text-gray-500">Carregando dados da turma...</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
        
        <Link href={`/gestao/turmas`} className="text-gray-500 hover:text-gray-700 flex items-center gap-2 mb-6">
            <ArrowLeft size={20} /> Voltar
        </Link>

        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                    <Users size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Editar Turma #{id}</h1>
                    <p className="text-sm text-gray-500">Altere os dados e a equipe docente da turma.</p>
                </div>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Dados Básicos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Turma</label>
                        <input 
                            required 
                            name="nome"
                            value={formData.nome}
                            onChange={e => setFormData({...formData, nome: e.target.value})}
                            placeholder="Ex: Desenv. Sistemas - Manhã" 
                            className="w-full p-3 border rounded text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" 
                        />
                    </div>
                
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ano/Semestre</label>
                        <input 
                            required 
                            name="anoSemestre"
                            value={formData.anoSemestre}
                            onChange={e => setFormData({...formData, anoSemestre: e.target.value})}
                            placeholder="Ex: 2025/1" 
                            className="w-full p-3 border rounded text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Termo Atual</label>
                        <select 
                            name="termoAtual"
                            value={formData.termoAtual}
                            onChange={e => setFormData({...formData, termoAtual: Number(e.target.value)})}
                            className="w-full p-3 border rounded bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="1">1º Termo</option>
                            <option value="2">2º Termo</option>
                            <option value="3">3º Termo</option>
                            <option value="4">4º Termo</option>
                        </select>
                    </div>
                </div>

                {/* Seleção de Professores */}
                <div className={`p-4 rounded-md border ${isGestor ? 'bg-gray-50 border-gray-200' : 'bg-gray-100 border-gray-300'}`}>
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <UserCheck size={18} /> Atribuição de Professores
                        </h3>
                        {!isGestor && (
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded flex items-center gap-1 font-semibold">
                                <Lock size={12} /> Restrito a Gestores
                            </span>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Professor Responsável (Min. 1)</label>
                            <select 
                                value={prof1}
                                onChange={e => setProf1(e.target.value)}
                                disabled={!isGestor}
                                className={`w-full p-2.5 border rounded outline-none transition
                                    ${isGestor 
                                        ? 'bg-white focus:ring-2 focus:ring-blue-500' 
                                        : 'bg-gray-200 text-gray-500 cursor-not-allowed border-gray-300'
                                    }`}
                            >
                                <option value="">Nenhum</option>
                                {professores.map(p => (
                                    <option key={p.id} value={p.id}>{p.nome}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Professor Co-Responsável (Max. 2)</label>
                            <select 
                                value={prof2}
                                onChange={e => setProf2(e.target.value)}
                                disabled={!isGestor}
                                className={`w-full p-2.5 border rounded outline-none transition
                                    ${isGestor 
                                        ? 'bg-white focus:ring-2 focus:ring-blue-500' 
                                        : 'bg-gray-200 text-gray-500 cursor-not-allowed border-gray-300'
                                    }`}
                            >
                                <option value="">Nenhum</option>
                                {professores.map(p => (
                                    <option key={p.id} value={p.id}>{p.nome}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        * A turma deve ter pelo menos um professor e no máximo dois.
                    </p>
                </div>

                <button type="submit" disabled={loading} className="mt-2 bg-blue-600 text-white p-3 rounded hover:bg-blue-700 flex justify-center items-center gap-2 font-semibold disabled:opacity-50 transition shadow-sm">
                    {loading ? 'Salvando...' : <><Save size={20} /> Salvar Alterações</>}
                </button>
            </form>
        </div>
    </div>
  );
}