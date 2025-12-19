"use client";

import { useState, useRef, useEffect, use } from "react";
import { useSearchParams } from "next/navigation";
import { 
    CheckCircle, XCircle, User, ArrowLeft, Download, 
    RotateCcw, Lock, Unlock, FileBarChart, Users, BookOpen, 
    Loader2, Zap, ShieldCheck, RefreshCw, Menu, MoreVertical, 
    ChevronDown, Filter 
} from "lucide-react";
import Link from "next/link";
import { useAvaliacaoTurma } from "@/app/hooks/useAvaliacaoTurma";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AvaliacaoTurmaPage({ params }: PageProps) {
  const { id: turmaId } = use(params);
  const searchParams = useSearchParams();
  const initialEstruturaId = searchParams.get('estruturaId');
  const initialDiscId = searchParams.get('discId');

  // --- HOOK COM A LÓGICA ---
  const {
      turma, alunos, loading, capacidades,
      selection, avaliacao, actions
  } = useAvaliacaoTurma(turmaId, initialEstruturaId, initialDiscId);

  // Estados apenas de UI (Menus e Sidebars)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  // Fecha menus ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setActionsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Ao trocar de aluno ou disciplina, fecha sidebar no mobile
  const handleSelectAlunoUI = (aluno: any) => {
      selection.setAluno(aluno);
      setSidebarOpen(false);
  };
  const handleSelectDiscUI = (val: string) => {
      selection.setDiscId(val);
      setSidebarOpen(false);
  };


  // --- RENDER ---

  if (loading) return <div className="h-screen flex flex-col items-center justify-center text-gray-500 gap-3"><Loader2 size={40} className="animate-spin text-blue-600" /><p>Carregando ambiente de avaliação...</p></div>;
  if (!turma) return <div className="p-8 text-red-500">Turma não encontrada.</div>;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden relative">
      
      {/* --- SIDEBAR RESPONSIVA --- */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />}
      
      <aside className={`fixed md:static inset-y-0 left-0 z-30 w-80 bg-white border-r flex flex-col shadow-lg transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} pt-0`}>
        <div className="h-16 border-b bg-blue-700 text-white flex justify-between items-center px-4 shrink-0">
            <div className="flex items-center gap-2">
                <Users size={20} className='text-white/80'/> 
                <div>
                    <h2 className="font-bold text-sm leading-tight">Lista de Alunos</h2>
                    <p className="text-[10px] text-blue-200">{alunos.length} matriculados</p>
                </div>
            </div>
            <Link href={`/gestao/turmas/${turmaId}`} className="p-1.5 hover:bg-white/10 rounded-full transition" title="Voltar"><ArrowLeft size={18} /></Link>
        </div>

        <div className="overflow-y-auto flex-1 bg-white">
            {alunos.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">Nenhum aluno encontrado.</div>
            ) : (
                alunos.map((aluno) => (
                    <button 
                        key={aluno.id} 
                        onClick={() => handleSelectAlunoUI(aluno)} 
                        className={`w-full text-left p-4 border-b hover:bg-gray-50 transition-all flex items-center gap-3 ${selection.aluno?.id === aluno.id ? "bg-blue-50 border-l-4 border-l-blue-600" : "border-l-4 border-l-transparent text-gray-600"}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${selection.aluno?.id === aluno.id ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-500'}`}>
                            {aluno.nome.charAt(0)}
                        </div>
                        <span className="font-medium text-sm truncate uppercase flex-1">{aluno.nome}</span>
                    </button>
                ))
            )}
        </div>
      </aside>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <main className="flex-1 flex flex-col h-full w-full relative">
        
        {/* HEADER */}
        <header className="h-16 bg-white border-b flex items-center px-4 md:px-6 justify-between shadow-sm z-10 shrink-0 gap-3">
          <div className="flex items-center gap-3 flex-1 overflow-hidden">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-md"><Menu size={24}/></button>
            
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 flex-1 overflow-hidden">
                <div className="relative max-w-[250px] md:max-w-xs w-full">
                    <select 
                        value={selection.discId || ''} 
                        onChange={(e) => handleSelectDiscUI(e.target.value)} 
                        className={`w-full pl-9 pr-8 py-2 border rounded-lg text-sm font-semibold appearance-none focus:ring-2 outline-none transition cursor-pointer
                            ${avaliacao.isSnapshotReady ? 'border-indigo-200 bg-indigo-50 text-indigo-700 focus:ring-indigo-200' : 'border-red-200 bg-red-50 text-red-700 focus:ring-red-200'}`}
                    >
                        {selection.disciplinas.sort((a,b) => (a.isPrincipal ? -1 : 1)).map(d => (
                            <option key={d.id} value={d.id.toString()}>{d.nome} {d.isPrincipal ? '(Principal)' : ''}</option>
                        ))}
                    </select>
                    <BookOpen size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${avaliacao.isSnapshotReady ? 'text-indigo-500' : 'text-red-500'}`} />
                    <ChevronDown size={16} className={`absolute right-3 top-1/2 -translate-y-1/2 ${avaliacao.isSnapshotReady ? 'text-indigo-400' : 'text-red-400'}`} />
                </div>
                <div className="hidden md:flex flex-col">
                     <span className="text-xs font-bold text-gray-500">{turma.anoSemestre}</span>
                     <span className="text-[10px] text-gray-400">Snapshot ID: {avaliacao.idSnapshotExibicao}</span>
                </div>
            </div>
          </div>

          {/* ÁREA DO ALUNO E AÇÕES */}
          {selection.aluno && (
             <div className="flex items-center gap-2 md:gap-4">
                <div className="hidden md:block text-right">
                    <p className="text-sm font-bold text-gray-800">{selection.aluno.nome}</p>
                    <p className="text-xs text-gray-500">{avaliacao.finalizada ? 'Avaliação Fechada' : 'Em Avaliação'}</p>
                </div>

                {avaliacao.isSnapshotReady && !avaliacao.finalizando && (
                    <div className="relative" ref={actionsMenuRef}>
                        <button onClick={() => setActionsMenuOpen(!actionsMenuOpen)} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium text-sm transition">
                            <span className="hidden md:inline">Ações</span>
                            <MoreVertical size={18} />
                        </button>
                        
                        {/* DROPDOWN MENU - Z-INDEX AUMENTADO AQUI (z-[100]) */}
                        {actionsMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                                <div className="px-4 py-2 border-b border-gray-100 md:hidden">
                                    <p className="text-xs font-bold text-gray-500 uppercase">Aluno</p>
                                    <p className="text-sm font-bold text-gray-800 truncate">{selection.aluno.nome}</p>
                                </div>
                                
                                <button onClick={() => actions.toggleStatusAvaliacao(!avaliacao.finalizada)} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-gray-50 ${avaliacao.finalizada ? 'text-red-600' : 'text-indigo-600'}`}>
                                    {avaliacao.finalizada ? <Unlock size={16}/> : <Lock size={16}/>}
                                    {avaliacao.finalizada ? 'Reabrir Avaliação' : 'Finalizar Avaliação'}
                                </button>
                                
                                <div className="border-t my-1"></div>

                                <Link href={`/gestao/turmas/${turmaId}/relatorio?estruturaId=${selection.estId}&origem=avaliacao`} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                                    <FileBarChart size={16} /> Relatório da Turma
                                </Link>
                                <button onClick={actions.baixarBoletim} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                                    <Download size={16} /> Baixar Boletim
                                </button>
                                
                                <div className="border-t my-1"></div>

                                <button onClick={actions.handleFinalizarTurma} className="w-full text-left px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 flex items-center gap-3">
                                    <ShieldCheck size={16} /> Fechar Turma Inteira
                                </button>
                                <button onClick={actions.handleAtualizarSnapshot} className="w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-3">
                                    <RefreshCw size={16} /> Atualizar Snapshot
                                </button>
                            </div>
                        )}
                    </div>
                )}
             </div>
          )}
        </header>

        {/* ÁREA DE SCROLL */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8">
            {avaliacao.finalizando && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-40 flex items-center justify-center">
                    <div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-3">
                        <Loader2 className="animate-spin text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">Processando...</span>
                    </div>
                </div>
            )}

            {!selection.aluno ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <User size={64} className="mb-4 text-gray-300 opacity-50" />
                    <p className="text-lg font-medium">Selecione um aluno para começar.</p>
                    <button onClick={() => setSidebarOpen(true)} className="mt-4 md:hidden bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">Abrir Lista</button>
                </div>
            ) : (
                <div className="max-w-5xl mx-auto pb-20">
                    
                    {/* STATUS FINALIZADO */}
                    {avaliacao.finalizada && avaliacao.resultado && (
                        <div className="mb-6 bg-white border border-green-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                             <div className="flex items-center gap-4">
                                <div className="bg-green-100 p-3 rounded-full text-green-700"><Lock size={24}/></div>
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg">Avaliação Concluída</h3>
                                    <p className="text-sm text-gray-500">Este aluno já possui nota fechada.</p>
                                </div>
                             </div>
                             <div className="flex items-center gap-4">
                                <div>
                                    <span className="block text-3xl font-bold text-indigo-600">{avaliacao.resultado.nivelAlcancado}</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Nível</span>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${avaliacao.resultado.nivelAlcancado >= 50 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {avaliacao.resultado.nivelAlcancado >= 50 ? 'APROVADO' : 'RETIDO'}
                                </div>
                             </div>
                        </div>
                    )}

                    {/* BARRA DE AVALIAÇÃO RÁPIDA */}
                    {avaliacao.isSnapshotReady && !avaliacao.finalizada && (
                        <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-xl p-2 mb-6 shadow-sm flex flex-wrap items-center justify-between gap-2">
                             <div className="flex items-center gap-2 px-2">
                                <Filter size={16} className="text-gray-400" />
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Avaliação Rápida</span>
                             </div>
                             <div className="flex gap-2 flex-1 justify-end">
                                <button onClick={() => actions.marcarTodos(true)} className="flex-1 sm:flex-none bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition">
                                    <CheckCircle size={14}/> Todos Sim
                                </button>
                                <button onClick={() => actions.marcarTodos(false)} className="flex-1 sm:flex-none bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition">
                                    <XCircle size={14}/> Todos Não
                                </button>
                                <button onClick={() => actions.marcarTodos(null)} className="bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold transition" title="Limpar">
                                    <RotateCcw size={14}/>
                                </button>
                             </div>
                        </div>
                    )}

                    {/* LISTA DE CRITÉRIOS */}
                    {!avaliacao.isSnapshotReady ? (
                        <div className="bg-white border-2 border-dashed border-yellow-300 rounded-xl p-8 text-center">
                             <Zap className="mx-auto text-yellow-500 mb-2" size={40} />
                             <h3 className="text-lg font-bold text-yellow-800">Snapshot Pendente</h3>
                             <p className="text-sm text-yellow-700 mb-4">A avaliação desta disciplina ainda não foi inicializada.</p>
                             <button onClick={actions.handleGerarSnapshot} className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 font-medium text-sm shadow-md transition">
                                Criar Snapshot Agora
                             </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {capacidades.map((cap, i) => (
                                <div key={cap.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className={`px-4 py-3 border-b flex justify-between items-center ${cap.tipo === 'TECNICA' ? 'bg-indigo-50/50' : 'bg-pink-50/50'}`}>
                                        <h4 className={`text-sm font-bold ${cap.tipo === 'TECNICA' ? 'text-indigo-800' : 'text-pink-800'}`}>
                                            {i + 1}. {cap.descricao}
                                        </h4>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${cap.tipo === 'TECNICA' ? 'bg-indigo-100 text-indigo-700' : 'bg-pink-100 text-pink-700'}`}>{cap.tipo}</span>
                                    </div>
                                    <div className="divide-y divide-gray-50">
                                        {cap.criterios?.map(crit => {
                                            const st = avaliacao.state[crit.id] || { atendeu: null, obs: '' };
                                            return (
                                                <div key={crit.id} className={`p-4 transition-colors ${st.atendeu === true ? 'bg-green-50/30' : st.atendeu === false ? 'bg-red-50/30' : 'hover:bg-gray-50'}`}>
                                                    <div className="flex flex-col sm:flex-row gap-3 sm:items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`w-2 h-2 rounded-full ${crit.tipo === 'CRITICO' ? 'bg-red-500' : 'bg-blue-400'}`} />
                                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{crit.tipo}</span>
                                                            </div>
                                                            <p className="text-sm text-gray-700 leading-snug">{crit.descricao}</p>
                                                        </div>
                                                        
                                                        {/* BOTÕES DE AVALIAÇÃO INDIVIDUAL (GRANDES) */}
                                                        {!avaliacao.finalizada && (
                                                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                                                <button 
                                                                    onClick={() => actions.salvarAvaliacao(crit.id, true, st.obs)} 
                                                                    className={`flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm
                                                                    ${st.atendeu === true 
                                                                        ? 'bg-green-600 text-white shadow-md' 
                                                                        : 'bg-white text-gray-500 border border-gray-200 hover:border-green-300 hover:text-green-600'}`}
                                                                >
                                                                    <CheckCircle size={16} /> Atingiu
                                                                </button>
                                                                
                                                                <button 
                                                                    onClick={() => actions.salvarAvaliacao(crit.id, false, st.obs)} 
                                                                    className={`flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm
                                                                    ${st.atendeu === false 
                                                                        ? 'bg-red-600 text-white shadow-md' 
                                                                        : 'bg-white text-gray-500 border border-gray-200 hover:border-red-300 hover:text-red-600'}`}
                                                                >
                                                                    <XCircle size={16} /> Não Atingiu
                                                                </button>

                                                                {st.atendeu !== null && (
                                                                    <button onClick={() => actions.salvarAvaliacao(crit.id, null, st.obs)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition" title="Limpar">
                                                                        <RotateCcw size={16} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                        
                                                        {avaliacao.finalizada && st.atendeu !== null && (
                                                            <div className={`px-3 py-1 rounded-full text-xs font-bold self-start ${st.atendeu ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                {st.atendeu ? 'ATINGIU' : 'NÃO ATINGIU'}
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {!avaliacao.finalizada && (
                                                        <input 
                                                            className={`mt-2 w-full text-xs bg-transparent border-b border-dashed border-gray-300 focus:border-blue-400 focus:bg-blue-50/20 outline-none p-1 transition-all ${st.obs ? 'text-gray-600' : 'text-gray-400'}`}
                                                            placeholder="Adicionar observação..."
                                                            value={st.obs}
                                                            onChange={e => actions.salvarAvaliacao(crit.id, st.atendeu, e.target.value)} 
                                                            onBlur={() => st.atendeu !== null && actions.salvarAvaliacao(crit.id, st.atendeu, st.obs)}
                                                        />
                                                    )}
                                                    {avaliacao.finalizada && st.obs && <p className="mt-2 text-xs text-gray-500 italic border-l-2 border-gray-300 pl-2">Obs: {st.obs}</p>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
      </main>
    </div>
  );
}