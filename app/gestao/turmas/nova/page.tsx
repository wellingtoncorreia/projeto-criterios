'use client';
import { Plus, ArrowLeft, Save } from "lucide-react";
import Link from 'next/link';
import { useNovaTurma } from '@/app/hooks/useNovaTurma';

export default function NovaTurmaPage() {
  const { loading, professores, disciplinas, formData, setFormData, prof1, setProf1, prof2, setProf2, handleSubmit } = useNovaTurma();

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando dados...</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
        <Link href="/gestao/turmas" className="text-gray-500 hover:text-gray-700 flex items-center gap-2 mb-6"><ArrowLeft size={20} /> Voltar para Gestão de Turmas</Link>
        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <div className="bg-blue-100 p-2 rounded-full text-blue-600"><Plus size={24} /></div>
                <div><h1 className="text-2xl font-bold text-gray-800">Nova Turma</h1><p className="text-sm text-gray-500">Crie uma nova turma e vincule a uma disciplina template.</p></div>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="bg-red-50 p-4 rounded-md border border-red-200">
                    <label className="block text-sm font-bold text-red-700 mb-1">Disciplina Base (Template)</label>
                    <select required value={formData.disciplinaTemplateId || ''} onChange={e => setFormData({...formData, disciplinaTemplateId: Number(e.target.value)})} className="w-full p-3 border rounded bg-white text-gray-800 focus:ring-2 focus:ring-red-500 outline-none">
                        <option value="">Selecione a Disciplina Template</option>
                        {disciplinas.map(d => <option key={d.id} value={d.id}>{d.nome} ({d.sigla})</option>)}
                    </select>
                    <p className="text-xs text-red-600 mt-2">* A estrutura será COPIADA (Snapshot).</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Turma</label>
                        <input required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} placeholder="Ex: Desenv. Sistemas" className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ano/Semestre</label>
                        <input required value={formData.anoSemestre} onChange={e => setFormData({...formData, anoSemestre: e.target.value})} placeholder="Ex: 2025/1" className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Termo Atual</label>
                        <select value={formData.termoAtual} onChange={e => setFormData({...formData, termoAtual: Number(e.target.value)})} className="w-full p-3 border rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                            {[1, 2, 3, 4].map(t => <option key={t} value={t}>{t}º Termo</option>)}
                        </select>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Atribuição de Professores</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Professor Responsável</label>
                            <select required value={prof1} onChange={e => setProf1(e.target.value)} className="w-full p-2.5 border rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                                <option value="">Selecione...</option>
                                {professores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Co-Responsável</label>
                            <select value={prof2} onChange={e => setProf2(e.target.value)} className="w-full p-2.5 border rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                                <option value="">Nenhum</option>
                                {professores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <button type="submit" disabled={loading || formData.disciplinaTemplateId === null} className="mt-2 bg-blue-600 text-white p-3 rounded hover:bg-blue-700 flex justify-center items-center gap-2 font-semibold disabled:opacity-50 transition shadow-sm">
                    {loading ? 'Criando Turma...' : <><Save size={20} /> Criar Turma</>}
                </button>
            </form>
        </div>
    </div>
  );
}