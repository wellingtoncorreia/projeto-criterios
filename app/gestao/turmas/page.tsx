'use client';

import Link from 'next/link';
import { Plus, Users, GraduationCap, UserCheck, Edit, Trash2, X, Loader2, CheckCircle2, AlertCircle, Zap } from 'lucide-react'; 
import { useTurmas } from '@/app/hooks/useTurmas';

export default function TurmasPage() {
  const { turmas, loading, userRole, handleDelete, modal } = useTurmas();
  const isGestor = userRole === 'GESTOR';

  if(loading) return <div className="p-8 text-center text-gray-500 flex flex-col items-center"><Loader2 className="animate-spin mb-2"/> Carregando turmas...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto relative">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-bold text-gray-800">Gestão de Turmas</h1>
            <p className="text-gray-500">Visualize turmas e seus professores responsáveis.</p>
        </div>
        {isGestor && (
            <Link href="/gestao/turmas/nova" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 shadow-sm transition">
                <Plus size={20} /> Nova Turma
            </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {turmas.length > 0 ? (
          turmas.map((t) => (
            <div key={t.id} className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{t.nome}</h3>
                    <div className="flex gap-2 mt-1">
                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">{t.anoSemestre}</span>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">{t.termoAtual}º Termo</span>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-2 rounded-full text-blue-600"><Users size={24} /></div>
                </div>
                <div className="mb-4">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1"><UserCheck size={14}/> Docentes</p>
                    <div className="flex flex-col gap-1">
                        {t.professores && t.professores.length > 0 ? (
                            t.professores.map(prof => (
                                <div key={prof.id} className="text-sm text-gray-700 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">{prof.nome.charAt(0)}</div>
                                    <span className="truncate">{prof.nome}</span>
                                </div>
                            ))
                        ) : <span className="text-sm text-red-400 italic">Sem professores</span>}
                    </div>
                </div>
              </div>
              
              <div className={`border-t pt-4 mt-2 grid gap-2 ${isGestor ? 'grid-cols-4' : 'grid-cols-3'}`}>
                {isGestor && (
                    <>
                        <button onClick={() => handleDelete(t.id, t.nome)} className="flex items-center justify-center gap-1 text-center bg-red-50 text-red-700 font-semibold py-2 rounded border border-red-200 hover:bg-red-100 transition text-xs"><Trash2 size={14} /> Excluir</button>
                    </>
                )}
                <Link href={`/gestao/turmas/${t.id}/editar`} className="flex items-center justify-center gap-1 text-center bg-yellow-50 text-yellow-700 font-semibold py-2 rounded border border-yellow-200 hover:bg-yellow-100 transition text-xs"><Edit size={14} /> Editar</Link>
                <Link href={`/gestao/turmas/${t.id}`} className="flex items-center justify-center gap-1 text-center bg-gray-50 text-blue-600 font-semibold py-2 rounded border border-gray-200 hover:bg-blue-50 transition text-xs"><Users size={14} /> Alunos</Link>
                <button onClick={() => modal.open(t)} className="flex items-center justify-center gap-1 text-center bg-green-50 text-green-700 font-semibold py-2 rounded border border-green-200 hover:bg-green-100 transition text-xs"><GraduationCap size={14} /> Avaliar</button>
              </div>
            </div>
          ))
        ) : <div className="col-span-full text-center py-12 bg-gray-50 rounded border border-dashed text-gray-500">Nenhuma turma encontrada.</div>}
      </div>

      {/* MODAL */}
      {modal.isOpen && modal.selectedTurma && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                    <div><h3 className="text-lg font-bold text-gray-800">Avaliar Turma</h3><p className="text-sm text-gray-500">{modal.selectedTurma.nome}</p></div>
                    <button onClick={modal.close} className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-1 rounded-full transition"><X size={20} /></button>
                </div>
                <div className="p-6">
                    {modal.loading ? (
                        <div className="py-8 flex flex-col items-center text-gray-400"><Loader2 className="animate-spin mb-2" size={32}/><p className="text-xs">Buscando avaliações...</p></div>
                    ) : modal.data.length === 0 ? (
                        <div className="text-center py-6 bg-yellow-50 rounded-lg text-yellow-700 border border-yellow-200"><AlertCircle className="mx-auto mb-2" />Nenhuma disciplina encontrada.</div>
                    ) : (
                        <div className="space-y-3">
                            {modal.data.map((disc) => (
                                <div key={disc.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition group">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${disc.snapshotId ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}><GraduationCap size={20} /></div>
                                        <div>
                                            <h4 className={`font-semibold ${disc.snapshotId ? 'text-gray-800' : 'text-gray-400'}`}>{disc.nome}</h4>
                                            <span className="text-xs text-gray-500">{disc.snapshotId ? <span className="text-green-600 flex items-center gap-1"><CheckCircle2 size={10}/> Avaliação Ativa</span> : 'Avaliação não iniciada'}</span>
                                        </div>
                                    </div>

                                    {/* AQUI ESTÁ A LÓGICA DO BOTÃO CRIAR SNAPSHOT */}
                                    <div className="flex items-center gap-2">
                                        {!disc.snapshotId && (
                                            <button 
                                                onClick={() => modal.selectedTurma && modal.criarSnapshot(modal.selectedTurma.id, disc.id)}
                                                className="px-3 py-2 rounded text-sm font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition flex items-center gap-1 shadow-sm"
                                                title="Criar Snapshot para iniciar avaliação"
                                            >
                                                <Zap size={14} /> Criar
                                            </button>
                                        )}

                                        <button 
                                            onClick={() => disc.snapshotId && modal.selectedTurma && modal.navegar(modal.selectedTurma.id, disc.snapshotId, disc.id)} 
                                            disabled={!disc.snapshotId} 
                                            className={`px-4 py-2 rounded text-sm font-medium transition ${disc.snapshotId ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                        >
                                            Avaliar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}