"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, XCircle, User, BookOpen, ArrowLeft, AlertCircle, Download, CheckSquare, Square, RotateCcw } from "lucide-react";
import Link from "next/link";
import api from "@/app/services/api"; 
import Swal from 'sweetalert2';

// --- Interfaces de Tipagem ---
interface Aluno { id: number; nome: string; }
interface Disciplina { id: number; nome: string; sigla: string; }
interface Criterio { id: number; descricao: string; tipo: string; capacidadeId: number; }
interface Capacidade { id: number; descricao: string; tipo: string; criterios: Criterio[]; }

export default function TelaAvaliacao() {
    const params = useParams();
    const [turmaId, setTurmaId] = useState<string | null>(null);
    const [paramsLoaded, setParamsLoaded] = useState(false);

    // Sincroniza turmaId quando params mudar
    useEffect(() => {
        if (params?.id) {
            setTurmaId(params.id as string);
            setParamsLoaded(true);
        }
    }, [params]);

    // --- Estados ---
    const [alunos, setAlunos] = useState<Aluno[]>([]);
    const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
    const [loading, setLoading] = useState(true);
    const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
    const [disciplinaSelecionada, setDisciplinaSelecionada] = useState<Disciplina | null>(null);
    const [capacidades, setCapacidades] = useState<Capacidade[]>([]);
    
    // Estado aceita boolean ou null (null = não avaliado)
    const [avaliacoesState, setAvaliacoesState] = useState<Record<number, { atendeu: boolean | null, obs: string }>>({});

    // 1. Carregar Dados Iniciais
    useEffect(() => {
        if (!turmaId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        Promise.all([
            api.get(`/turmas/${turmaId}/alunos`),
            api.get(`/turmas/${turmaId}/disciplinas`)
        ]).then(([resAlunos, resDisc]) => {
            setAlunos(resAlunos.data);
            setDisciplinas(resDisc.data);
            if (resDisc.data.length > 0) setDisciplinaSelecionada(resDisc.data[0]);
            setLoading(false);
        }).catch(err => {
            console.error("Erro ao carregar dados da turma:", err);
            Swal.fire('Erro', 'Não foi possível carregar os dados da turma.', 'error');
            setLoading(false);
        });
    }, [turmaId]);

    // 2. Carregar Avaliações
    useEffect(() => {
        if (!disciplinaSelecionada) return;
        setCapacidades([]);
        setAvaliacoesState({});

        api.get(`/disciplinas/${disciplinaSelecionada.id}/capacidades`)
            .then(res => setCapacidades(Array.isArray(res.data) ? res.data : []))
            .catch(() => setCapacidades([]));

        if (alunoSelecionado) {
            api.get(`/avaliacoes`, {
                params: { alunoId: alunoSelecionado.id, disciplinaId: disciplinaSelecionada.id }
            }).then(res => {
                const mapa: Record<number, { atendeu: boolean | null, obs: string }> = {};
                if (Array.isArray(res.data)) {
                    res.data.forEach((av: any) => {
                        const critId = av.criterio?.id || av.criterioId;
                        if (critId) mapa[critId] = { atendeu: av.atendeu, obs: av.observacao };
                    });
                }
                setAvaliacoesState(mapa);
            });
        }
    }, [alunoSelecionado, disciplinaSelecionada]);

    // --- Salvar Avaliação Individual (Aceita null para limpar) ---
    const salvarAvaliacao = async (criterioId: number, atendeu: boolean | null, obs: string) => {
        if (!alunoSelecionado || !disciplinaSelecionada) return;

        const novoEstado = { ...avaliacoesState, [criterioId]: { atendeu, obs } };
        setAvaliacoesState(novoEstado);

        try {
            await api.post(`/avaliacoes`, {
                alunoId: alunoSelecionado.id,
                disciplinaId: disciplinaSelecionada.id,
                criterioId: criterioId,
                atendeu: atendeu, // Agora envia null se for para limpar
                observacao: obs
            });
        } catch (err) {
            console.error(err);
        }
    };

    // --- Salvar em Massa (Aceita null) ---
    const marcarTodos = async (atendeu: boolean | null) => {
        if (!alunoSelecionado || !disciplinaSelecionada || capacidades.length === 0) return;

        const novoEstado = { ...avaliacoesState };
        const promises: Promise<any>[] = [];

        capacidades.forEach(cap => {
            cap.criterios.forEach(crit => {
                const obsAtual = avaliacoesState[crit.id]?.obs || "";
                novoEstado[crit.id] = { atendeu, obs: obsAtual };
                
                promises.push(api.post(`/avaliacoes`, {
                    alunoId: alunoSelecionado.id,
                    disciplinaId: disciplinaSelecionada.id,
                    criterioId: crit.id,
                    atendeu: atendeu,
                    observacao: obsAtual
                }));
            });
        });

        setAvaliacoesState(novoEstado);

        try {
            await Promise.all(promises);
            const msg = atendeu === null ? 'Limpeza concluída!' : 'Avaliação em massa concluída!';
            Swal.fire({ icon: 'success', title: msg, toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
        } catch (error) {
            Swal.fire('Erro', 'Houve um problema ao salvar.', 'error');
        }
    };

    const baixarBoletim = async () => {
        if (!alunoSelecionado || !disciplinaSelecionada) return;
        try {
            const response = await api.get('/arquivos/boletim/download', {
                params: { alunoId: alunoSelecionado.id, disciplinaId: disciplinaSelecionada.id },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const nomeArquivo = `Boletim_${alunoSelecionado.nome.replace(/\s+/g, '_')}.xlsx`;
            link.setAttribute('download', nomeArquivo);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            Swal.fire('Erro', 'Não foi possível baixar o boletim.', 'error');
        }
    };

    if (!paramsLoaded) return <div className="p-8 flex justify-center text-gray-400">Carregando...</div>;
    if (loading) return <div className="p-8 flex justify-center text-gray-500">Carregando dados da turma...</div>;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            
            {/* SIDEBAR */}
            <aside className="w-80 bg-white border-r flex flex-col shadow-lg z-20">
                <div className="p-4 border-b bg-blue-700 text-white flex justify-between items-center">
                    <div>
                        <h2 className="font-bold text-lg flex items-center gap-2"><User size={20} /> Alunos</h2>
                        <p className="text-xs text-blue-200 mt-1">{alunos.length} matriculados</p>
                    </div>
                    <Link href="/gestao/turmas" className="p-2 hover:bg-blue-600 rounded text-white" title="Voltar"><ArrowLeft size={18} /></Link>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {alunos.length === 0 ? <p className="p-4 text-gray-500 text-sm text-center">Nenhum aluno.</p> : 
                        alunos.map((aluno) => (
                            <button key={aluno.id} onClick={() => setAlunoSelecionado(aluno)} className={`w-full text-left p-4 border-b hover:bg-gray-50 transition-colors flex items-center justify-between ${alunoSelecionado?.id === aluno.id ? "bg-blue-50 border-l-4 border-l-blue-600" : "border-l-4 border-l-transparent"}`}>
                                <span className="font-medium text-sm text-gray-700 truncate uppercase">{aluno.nome}</span>
                            </button>
                        ))
                    }
                </div>
                {alunoSelecionado && disciplinaSelecionada && (
                    <div className="p-4 border-t bg-gray-50">
                        <div className="mb-3"><p className="text-xs font-bold text-gray-400 uppercase">Aluno Selecionado</p><p className="font-bold text-gray-800 truncate text-sm">{alunoSelecionado.nome}</p></div>
                        <button onClick={baixarBoletim} className="w-full bg-green-600 text-white py-2 px-4 rounded-md flex items-center justify-center gap-2 hover:bg-green-700 transition shadow-sm font-medium text-xs"><Download size={16} /> Baixar Boletim Excel</button>
                    </div>
                )}
            </aside>

            {/* MAIN */}
            <main className="flex-1 flex flex-col h-full relative">
                <header className="h-16 bg-white border-b flex items-center px-6 justify-between shadow-sm z-10">
                    <div className="flex items-center gap-4">
                        <div className="bg-gray-100 p-2 rounded-full"><BookOpen className="text-gray-600" size={20} /></div>
                        <select className="bg-white border border-gray-300 text-gray-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-96 p-2.5 font-medium shadow-sm outline-none" value={disciplinaSelecionada?.id || ""} onChange={(e) => { const disc = disciplinas.find(d => d.id === Number(e.target.value)); setDisciplinaSelecionada(disc || null); }}>
                            {disciplinas.map(d => (<option key={d.id} value={d.id}>{d.nome}</option>))}
                        </select>
                    </div>
                    
                    {alunoSelecionado && (
                        <div className="flex gap-2">
                            <button onClick={() => marcarTodos(true)} className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-green-200 transition">
                                <CheckSquare size={14} /> Todos Atingiu
                            </button>
                            <button onClick={() => marcarTodos(false)} className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-red-200 transition">
                                <Square size={14} /> Todos NÃO ATINGIU
                            </button>
                            <button onClick={() => marcarTodos(null)} className="flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-gray-200 transition" title="Limpar todas as avaliações">
                                <RotateCcw size={14} /> Limpar Tudo
                            </button>
                        </div>
                    )}
                </header>

                <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
                    {!alunoSelecionado ? (
                        <div className="flex h-full flex-col items-center justify-center text-gray-400">
                            <User size={64} className="mb-4 text-gray-300" />
                            <p className="text-lg">Selecione um aluno na barra lateral para começar.</p>
                        </div>
                    ) : (
                        <div className="max-w-5xl mx-auto space-y-8 pb-20">
                            {capacidades.length === 0 ? (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
                                    <AlertCircle size={48} className="text-yellow-500 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-yellow-800 mb-2">Sem Critérios</h3>
                                    <Link href={`/gestao/disciplinas/${disciplinaSelecionada?.id}`} className="text-yellow-700 underline">Cadastrar Critérios Agora</Link>
                                </div>
                            ) : (
                                capacidades.map((cap) => (
                                    <div key={cap.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                        <div className="bg-gray-100 px-6 py-4 border-b flex items-center justify-between">
                                            <div>
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase mr-2 tracking-wider ${cap.tipo === 'TECNICA' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>{cap.tipo}</span>
                                                <span className="font-bold text-gray-700 text-lg">{cap.descricao}</span>
                                            </div>
                                        </div>
                                        <div className="divide-y divide-gray-100">
                                            {cap.criterios?.map((crit) => {
                                                const av = avaliacoesState[crit.id] || { atendeu: null, obs: "" };
                                                return (
                                                    <div key={crit.id} className="p-4 hover:bg-gray-50 transition group">
                                                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className={`w-2 h-2 rounded-full ${crit.tipo === 'CRITICO' ? 'bg-red-500' : 'bg-blue-400'}`}></span>
                                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">{crit.tipo}</span>
                                                                </div>
                                                                <p className="text-gray-800 font-medium">{crit.descricao}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2 min-w-[280px] justify-end">
                                                                <button onClick={() => salvarAvaliacao(crit.id, true, av.obs)} className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition ${av.atendeu === true ? "bg-green-600 text-white shadow-md" : "bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700"}`}><CheckCircle size={18} /> Atingiu</button>
                                                                <button onClick={() => salvarAvaliacao(crit.id, false, av.obs)} className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition ${av.atendeu === false ? "bg-red-600 text-white shadow-md" : "bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-700"}`}><XCircle size={18} /> Não Atingiu</button>
                                                                
                                                                {/* Botão de Limpar Individual */}
                                                                {av.atendeu !== null && (
                                                                    <button onClick={() => salvarAvaliacao(crit.id, null, av.obs)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition" title="Limpar avaliação"><RotateCcw size={16} /></button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className={`mt-3 ${av.atendeu !== null ? 'block' : 'hidden group-hover:block'}`}>
                                                            <input placeholder="Observação..." className="w-full text-sm p-2 border rounded bg-white focus:ring-1 focus:ring-blue-300 outline-none" value={av.obs || ""} onChange={(e) => { const val = e.target.value; setAvaliacoesState({...avaliacoesState, [crit.id]: { ...av, obs: val }}) }} onBlur={() => av.atendeu !== null && salvarAvaliacao(crit.id, av.atendeu, av.obs)}/>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}