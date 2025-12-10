// app/gestao/turmas/[id]/avaliacao/page.tsx
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, User, ArrowLeft, AlertCircle, Download, CheckSquare, Square, RotateCcw, Lock, Unlock, FileBarChart, Users, BookOpen, Loader2 } from "lucide-react";
import Link from "next/link";
import api from "@/app/services/api";
import Swal from 'sweetalert2';

// --- Interfaces (Usando as interfaces do contexto global) ---
import { Turma, Aluno, Capacidade, Criterio } from "@/app/types";

// Interface para o DTO de Resultado do Boletim (usado no backend)
interface ResultadoBoletimDTO {
    nomeAluno: string;
    nomeDisciplina: string;
    qtdCriticosAtendidos: number;
    qtdDesejaveisAtendidos: number;
    totalCriticosDisciplina: number;
    totalDesejaveisDisciplina: number;
    nivelAlcancado: number;
    percentualConclusao: number;
}

// Tipo para o estado de avaliação, incluindo o status de finalização
interface AvaliacaoEstado { 
    atendeu: boolean | null; 
    obs: string; 
    finalizada: boolean | undefined; 
}

// NOVO: Estruturas disponíveis para o select (Simulação/Mock)
interface EstruturaDisponivel {
    id: number;
    nomeDisciplina: string;
    sigla: string;
}


export default function AvaliacaoTurmaPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    const turmaId = params?.id as string;
    const estruturaDisciplinaIdUrl = searchParams.get('estruturaId'); // ID do Snapshot (imutável) vindo da URL

    const [turma, setTurma] = useState<Turma | null>(null);
    const [alunos, setAlunos] = useState<Aluno[]>([]);
    const [loading, setLoading] = useState(true);
    
    // NOVO: Estado para a estrutura de avaliação selecionada (Snapshot ID)
    const [selectedEstruturaId, setSelectedEstruturaId] = useState<string | null>(estruturaDisciplinaIdUrl);
    // NOVO: Lista de todas as estruturas disponíveis (Simulando uma busca)
    const [estruturasDisponiveis, setEstruturasDisponiveis] = useState<EstruturaDisponivel[]>([]);
    
    // Estado principal do aluno
    const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
    
    // Estrutura de Avaliação
    const [capacidades, setCapacidades] = useState<Capacidade[]>([]);
    const [avaliacoesState, setAvaliacoesState] = useState<Record<number, AvaliacaoEstado>>({});

    // Status de Finalização
    const [avaliacaoFinalizada, setAvaliacaoFinalizada] = useState(false);
    const [resultadoFinal, setResultadoFinal] = useState<ResultadoBoletimDTO | null>(null);
    const [finalizando, setFinalizando] = useState(false);
    
    // Mapeamento de todos os IDs de critério para uso em ações de massa
    const todosCriteriosIds = useMemo(() => {
        return capacidades.flatMap(cap => cap.criterios ? cap.criterios.map(c => c.id) : []);
    }, [capacidades]);


    // Função auxiliar para verificar o status de fechamento
    const checarStatusFinalizacao = useCallback(async (alunoId: number, estruturaId: string) => {
        if (!estruturaId) return;

        try {
            // 1. Busca todas as avaliações do aluno para o SNAPSHOT
            const res = await api.get(`/avaliacoes`, {
                params: { alunoId, estruturaDisciplinaId: estruturaId }
            });

            const avaliacoes = Array.isArray(res.data) ? res.data : [];
            
            // Verifica o status de finalização baseado em qualquer registro
            const isFinalizada = avaliacoes.some(av => av.finalizada === true);

            setAvaliacaoFinalizada(isFinalizada);

            if (isFinalizada) {
                // Se finalizada, busca o boletim para mostrar a nota
                const resBoletim = await api.get<ResultadoBoletimDTO>(`/avaliacoes/boletim`, { 
                    params: { alunoId, estruturaDisciplinaId: estruturaId } 
                });
                setResultadoFinal(resBoletim.data);
            } else {
                setResultadoFinal(null);
            }

            // Mapeia as notas
            const mapa: Record<number, AvaliacaoEstado> = {};
            avaliacoes.forEach((av: any) => {
                const critId = av.criterio?.id || av.criterioId;
                if (critId) mapa[critId] = { atendeu: av.atendeu, obs: av.observacao, finalizada: av.finalizada };
            });
            setAvaliacoesState(mapa);

        } catch (error) {
            console.error("Erro ao checar status de finalização:", error);
            setAvaliacaoFinalizada(false);
            setResultadoFinal(null);
            setAvaliacoesState({});
        }
    }, []);


    // 1. Carregar Dados Iniciais (Turma, Alunos)
    useEffect(() => {
        if (!turmaId) {
            setLoading(false);
            return;
        }
        
        setLoading(true);
        
        Promise.all([
            api.get<Turma>(`/turmas/${turmaId}`),
            api.get<Aluno[]>(`/turmas/${turmaId}/alunos`),
            // [NOVA CHAMADA SIMULADA] Deveria ser uma rota para buscar todas as Estruturas (disciplinas/snapshots) vinculadas à turma, mas vamos simular:
            // api.get<EstruturaDisponivel[]>(`/turmas/${turmaId}/estruturas`)
        ]).then(([resTurma, resAlunos]) => {
            setTurma(resTurma.data);
            setAlunos(Array.isArray(resAlunos.data) ? resAlunos.data : []);
            
            // Simula o preenchimento da lista de Estruturas com o dado do objeto Turma
            const initialEstrutura = {
                id: resTurma.data.estruturaSnapshotId,
                nomeDisciplina: resTurma.data.nomeDisciplina,
                sigla: resTurma.data.nomeDisciplina.substring(0, 3).toUpperCase(),
            }
            // MOCK: Adicionando uma segunda estrutura para fins de teste do select
            const mockEstruturas: EstruturaDisponivel[] = [
                 initialEstrutura,
                 { id: 9999, nomeDisciplina: "Simulação de Segunda Disciplina", sigla: "SD2" }
            ].filter(e => e.id !== null) as EstruturaDisponivel[]; // Filtra IDs nulos
            
            setEstruturasDisponiveis(mockEstruturas);

            // Se a URL não enviou o ID, usa o ID padrão da turma
            if (!selectedEstruturaId && resTurma.data.estruturaSnapshotId) {
                setSelectedEstruturaId(resTurma.data.estruturaSnapshotId.toString());
            }

            // Seleciona o primeiro aluno
            if (resAlunos.data.length > 0) {
                setAlunoSelecionado(resAlunos.data[0]);
            }
            
            setLoading(false);
        }).catch(err => {
            console.error("Erro ao carregar dados da turma:", err);
            Swal.fire('Erro', 'Não foi possível carregar os dados iniciais.', 'error');
            setLoading(false);
        });
    }, [turmaId]);


    // 2. Carregar Estrutura (Capacidades) e Avaliações
    useEffect(() => {
        if (!selectedEstruturaId) {
            setCapacidades([]);
            setAvaliacaoFinalizada(false);
            setResultadoFinal(null);
            setAvaliacoesState({});
            return;
        }
        
        const loadEstruturaAndAvaliacao = async () => {
             setLoading(true);
             try {
                // Carrega a Estrutura (Capacidades)
                const resCapacidades = await api.get<Capacidade[]>(`/estrutura/${selectedEstruturaId}/capacidades`);
                setCapacidades(Array.isArray(resCapacidades.data) ? resCapacidades.data : []);
                
                // Recarrega as avaliações do aluno selecionado
                if (alunoSelecionado) {
                    await checarStatusFinalizacao(alunoSelecionado.id, selectedEstruturaId);
                }
             } catch (err) {
                 console.error("Erro ao carregar estrutura/avaliações:", err);
             } finally {
                 setLoading(false);
             }
        }
        
        loadEstruturaAndAvaliacao();

    }, [selectedEstruturaId, alunoSelecionado?.id, checarStatusFinalizacao]);
    

    // --- AÇÕES DE SALVAMENTO ---
    
    // Salvar Avaliação Individual (Impedido se finalizada)
    const salvarAvaliacao = async (criterioId: number, atendeu: boolean | null, obs: string) => {
        if (finalizando || avaliacaoFinalizada || !alunoSelecionado || !selectedEstruturaId) return; 

        // 1. Atualiza o estado OTIMISTAMENTE
        const novoEstado = { ...avaliacoesState, [criterioId]: { atendeu, obs, finalizada: false } };
        setAvaliacoesState(novoEstado);

        try {
            await api.post(`/avaliacoes`, {
                alunoId: alunoSelecionado.id,
                // [CORRIGIDO] Usa o ID do Snapshot
                estruturaDisciplinaId: parseInt(selectedEstruturaId, 10), 
                criterioId: criterioId,
                atendeu: atendeu,
                observacao: obs
            });
        } catch (err) {
            console.error(err);
            Swal.fire('Erro', 'Falha ao salvar a avaliação.', 'error');
            // Recarrega o estado atual do servidor
            checarStatusFinalizacao(alunoSelecionado.id, selectedEstruturaId);
        }
    };

    // Salvar em Massa (Atingiu/Não Atingiu/Nulo)
    const marcarTodos = async (atendeu: boolean | null) => {
        if (finalizando || avaliacaoFinalizada || !alunoSelecionado || !selectedEstruturaId || todosCriteriosIds.length === 0) return;

        setFinalizando(true);
        
        const novoEstado: Record<number, AvaliacaoEstado> = { ...avaliacoesState };
        const promises: Promise<any>[] = [];

        todosCriteriosIds.forEach(critId => {
            const obsAtual = avaliacoesState[critId]?.obs || "";
            novoEstado[critId] = { atendeu, obs: obsAtual, finalizada: false };

            promises.push(api.post(`/avaliacoes`, {
                alunoId: alunoSelecionado.id,
                // [CORRIGIDO] Usa o ID do Snapshot
                estruturaDisciplinaId: parseInt(selectedEstruturaId, 10),
                criterioId: critId,
                atendeu: atendeu,
                observacao: obsAtual
            }));
        });

        setAvaliacoesState(novoEstado);

        try {
            await Promise.all(promises);
            const msg = atendeu === null ? 'Limpeza concluída!' : 'Avaliação em massa concluída!';
            Swal.fire({ icon: 'success', title: msg, toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
        } catch (error) {
            Swal.fire('Erro', 'Houve um problema ao salvar as avaliações em massa.', 'error');
            // Recarrega o estado após a falha
            checarStatusFinalizacao(alunoSelecionado.id, selectedEstruturaId);
        } finally {
            setFinalizando(false);
        }
    };
    
    // --- AÇÕES DE FECHAMENTO/REABERTURA ---
    
    const handleFinalizar = async () => {
        if (!alunoSelecionado || !selectedEstruturaId) return;
        
        const result = await Swal.fire({
            title: 'Confirmar Fechamento?',
            text: "Após fechar, as notas não poderão ser alteradas. Deseja prosseguir?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, Fechar Avaliação',
        });
        
        if (!result.isConfirmed) return;
        
        setFinalizando(true);
        try {
            // [CORRIGIDO] Usa selectedEstruturaId
            const res = await api.post(`/avaliacoes/fechar?alunoId=${alunoSelecionado.id}&estruturaDisciplinaId=${selectedEstruturaId}`);
            setAvaliacaoFinalizada(true);
            setResultadoFinal(res.data);
            Swal.fire('Fechada!', 'Avaliação finalizada e nota registrada.', 'success');
            checarStatusFinalizacao(alunoSelecionado.id, selectedEstruturaId);
        } catch (error: any) {
             Swal.fire('Erro', error.response?.data || 'Falha ao fechar avaliação.', 'error');
        } finally {
            setFinalizando(false);
        }
    };
    
    const handleReabrir = async () => {
        if (!alunoSelecionado || !selectedEstruturaId) return;

        const result = await Swal.fire({
            title: 'Reabrir Avaliação?',
            text: "Isso permitirá editar as notas novamente e apagará o Nível Final salvo. Continuar?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sim, Reabrir',
        });

        if (!result.isConfirmed) return;

        setFinalizando(true);
        try {
            // [CORRIGIDO] Usa selectedEstruturaId
            await api.post(`/avaliacoes/reabrir?alunoId=${alunoSelecionado.id}&estruturaDisciplinaId=${selectedEstruturaId}`);
            setAvaliacaoFinalizada(false);
            setResultadoFinal(null);
            checarStatusFinalizacao(alunoSelecionado.id, selectedEstruturaId);
            Swal.fire('Reaberta!', 'Avaliação reaberta para edição.', 'success');
        } catch (error: any) {
            Swal.fire('Erro', error.response?.data || 'Falha ao reabrir avaliação.', 'error');
        } finally {
            setFinalizando(false);
        }
    };

    // --- FUNÇÕES DE RENDERIZAÇÃO ---
    
    const baixarBoletim = async () => {
        if (!alunoSelecionado || !turma || !selectedEstruturaId) return;
        try {
            const response = await api.get('/arquivos/boletim/download', {
                params: { alunoId: alunoSelecionado.id, estruturaDisciplinaId: selectedEstruturaId }, // CORRIGIDO
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

    // Determina o nome da disciplina selecionada
    const disciplinaSelecionada = estruturasDisponiveis.find(e => e.id.toString() === selectedEstruturaId);
    const nomeDisciplina = disciplinaSelecionada?.nomeDisciplina || turma?.nomeDisciplina || 'N/A';


    if (loading) return <div className="p-8 flex justify-center text-gray-500"><Loader2 size={32} className="animate-spin" /> Carregando dados da turma...</div>;
    if (!turma) return <div className="p-8 text-red-500">Turma não encontrada.</div>;
    if (!selectedEstruturaId) return <div className="p-8 text-red-500">Selecione uma Estrutura de Avaliação.</div>;
    
    const safeEstruturaId = turma.estruturaSnapshotId?.toString(); // Usado para voltar ao Relatório

    return (
        // Layout principal com sidebar fixa
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            
            {/* SIDEBAR (Fixo) */}
            <aside className="w-80 bg-white border-r flex flex-col shadow-lg z-20 shrink-0 fixed h-full top-0 left-0 pt-16">
                 {/* Cabeçalho da Sidebar */}
                <div className="p-4 border-b bg-blue-700 text-white flex justify-between items-center">
                    <div>
                        <h2 className="font-bold text-lg flex items-center gap-2"><Users size={20} className='text-white'/> Alunos</h2>
                        <p className="text-xs text-blue-200 mt-1">{alunos.length} matriculados</p>
                    </div>
                    <Link href={`/gestao/turmas/${turmaId}`} className="p-2 hover:bg-blue-600 rounded text-white" title="Voltar"><ArrowLeft size={18} /></Link>
                </div>
                
                {/* Lista de Alunos */}
                {alunos.length === 0 ? (
                    <div className="p-4 text-gray-500 text-sm text-center">Nenhum aluno.</div>
                ) : (
                    <div className="overflow-y-auto flex-1">
                        {alunos.map((aluno) => (
                            <button 
                                key={aluno.id} 
                                onClick={() => setAlunoSelecionado(aluno)} 
                                className={`w-full text-left p-4 border-b hover:bg-gray-50 transition-colors flex items-center justify-between ${alunoSelecionado?.id === aluno.id ? "bg-blue-50 border-l-4 border-l-blue-600" : "border-l-4 border-l-transparent"}`}
                            >
                                <span className="font-medium text-sm text-gray-700 truncate uppercase">{aluno.nome}</span>
                            </button>
                        ))}
                    </div>
                )}
                <div className="p-4 border-t bg-gray-50">
                    <p className="text-xs font-bold text-gray-400 uppercase">
                        {alunoSelecionado?.nome ? `AVAL. DE ${alunoSelecionado.nome}` : 'SELECIONE UM ALUNO'}
                    </p>
                </div>
            </aside>

            {/* MAIN CONTENT (com offset de 80px para a sidebar) */}
            <main className="flex-1 flex flex-col h-full pl-80">
                
                {/* HEADER DE CONTROLE (Fixo no topo) */}
                <header className="sticky top-0 h-16 bg-white border-b flex items-center px-6 justify-between shadow-sm z-10">
                    
                    <div className="flex items-center gap-4">
                        <div className="bg-gray-100 p-2 rounded-full"><BookOpen className="text-gray-600" size={20} /></div>
                        
                        {/* NOVO: SELECT DE DISCIPLINA/ESTRUTURA */}
                        <select
                            value={selectedEstruturaId || ''}
                            onChange={(e) => setSelectedEstruturaId(e.target.value)}
                            className="p-2 border border-gray-300 rounded-md text-sm font-semibold text-indigo-700 bg-indigo-50 focus:ring-2 focus:ring-indigo-500"
                        >
                            {estruturasDisponiveis.map(estrutura => (
                                <option key={estrutura.id} value={estrutura.id}>
                                    {estrutura.nomeDisciplina} ({estrutura.sigla})
                                </option>
                            ))}
                        </select>
                        <span className="text-xs text-gray-500">({turma.anoSemestre} - {turma.termoAtual}º Termo)</span>
                    </div>

                    {alunoSelecionado && (
                        <div className="flex gap-2">
                            {finalizando ? (
                                <span className="text-indigo-600 flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Processando...</span>
                            ) : (
                                <>
                                    {/* Botões de Ação em Massa (Apenas se NÃO finalizada) */}
                                    {!avaliacaoFinalizada && (
                                        <>
                                            <button onClick={() => marcarTodos(true)} className="flex items-center gap-1 h-8 bg-green-500 text-white px-4 py-2 rounded-md text-xs font-bold hover:bg-green-600 transition">
                                                Todos Atingiu
                                            </button>
                                            <button onClick={() => marcarTodos(false)} className="flex items-center gap-1 h-8 bg-red-500 text-white px-4 py-2 rounded-md text-xs font-bold hover:bg-red-600 transition">
                                                Todos NÃO ATINGIU
                                            </button>
                                            <button onClick={() => marcarTodos(null)} className="flex items-center gap-1 h-8 bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-xs font-bold hover:bg-gray-400 transition" title="Limpar todas as avaliações">
                                                Limpar Tudo
                                            </button>
                                        </>
                                    )}
                                    
                                    {/* Botão Finalizar / Reabrir */}
                                    <button
                                        onClick={avaliacaoFinalizada ? handleReabrir : handleFinalizar}
                                        className={`px-4 py-2 rounded-md flex items-center gap-2 h-8 transition shadow-sm font-medium text-xs ml-4 ${
                                            avaliacaoFinalizada ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                        }`}
                                    >
                                        {avaliacaoFinalizada ? <Unlock size={16} /> : <Lock size={16} />} 
                                        {avaliacaoFinalizada ? 'Reabrir Avaliação' : 'Finalizar Avaliação'}
                                    </button>

                                    {/* Botão de Relatório */}
                                    <Link 
                                        href={`/gestao/turmas/${turmaId}/relatorio?estruturaId=${selectedEstruturaId}`} 
                                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 shadow-sm font-medium transition text-xs"
                                    >
                                        <FileBarChart size={16} /> Relatório
                                    </Link>
                                </>
                            )}
                        </div>
                    )}
                </header>

                {/* Conteúdo de Edição (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
                    
                    {/* Renderiza Status Finalizado ou Conteúdo de Edição */}
                    {alunoSelecionado && avaliacaoFinalizada && (
                        <div className="mb-8">{renderStatusFinalizado(alunoSelecionado, resultadoFinal, handleReabrir, finalizando)}</div>
                    )}

                    {/* Conteúdo de Avaliação */}
                    {!alunoSelecionado ? (
                        <div className="flex h-full flex-col items-center justify-center text-gray-400">
                            <User size={64} className="mb-4 text-gray-300" />
                            <p className="text-lg">Selecione um aluno na barra lateral para começar.</p>
                        </div>
                    ) : (
                        // Bloco de Edição
                        <div className={`${avaliacaoFinalizada ? 'opacity-50 pointer-events-none' : ''}`}>
                            {capacidades.length === 0 ? (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
                                    <AlertCircle size={48} className="text-yellow-500 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-yellow-800 mb-2">Sem Critérios</h3>
                                    <p className="text-yellow-700">O Snapshot desta turma não tem critérios para a estrutura **{nomeDisciplina}**. Verifique a disciplina base.</p>
                                </div>
                            ) : (
                                <div className="max-w-5xl mx-auto space-y-8 pb-20">
                                    {capacidades.map((cap, index) => (
                                        <div key={cap.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                                            {/* Cabeçalho da Capacidade */}
                                            <div className={`p-4 ${
                                                cap.tipo === 'TECNICA' ? 'bg-indigo-50 text-indigo-800' : 'bg-pink-50 text-pink-800'
                                            } border-b`}>
                                                <h3 className="text-lg font-bold">
                                                    {cap.tipo} {index + 1}. {cap.descricao}
                                                </h3>
                                            </div>

                                            {/* Lista de Critérios */}
                                            <div className="divide-y divide-gray-100">
                                                {cap.criterios && cap.criterios.length > 0 ? (
                                                    cap.criterios.map((crit) => {
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
                                                                        {/* Botões de Atingiu / Não Atingiu */}
                                                                        <button onClick={() => salvarAvaliacao(crit.id, true, av.obs)} className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition ${av.atendeu === true ? "bg-green-600 text-white shadow-md" : "bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700"}`}><CheckCircle size={18} /> Atingiu</button>
                                                                        <button onClick={() => salvarAvaliacao(crit.id, false, av.obs)} className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition ${av.atendeu === false ? "bg-red-600 text-white shadow-md" : "bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-700"}`}><XCircle size={18} /> Não Atingiu</button>
                                                                        
                                                                        {/* Botão de Limpar Individual */}
                                                                        {av.atendeu !== null && (
                                                                            <button onClick={() => salvarAvaliacao(crit.id, null, av.obs)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition" title="Limpar avaliação"><RotateCcw size={16} /></button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {/* Input de Observação (Visível ao passar o mouse ou se já preenchida) */}
                                                                <div className={`mt-3 ${av.obs ? 'block' : 'hidden group-hover:block'}`}>
                                                                    <input onBlur={() => av.atendeu !== null && salvarAvaliacao(crit.id, av.atendeu, av.obs)} placeholder="Observação..." className="w-full text-sm p-2 border rounded bg-white focus:ring-1 focus:ring-blue-300 outline-none" value={av.obs || ""} onChange={(e) => { const val = e.target.value; setAvaliacoesState({ ...avaliacoesState, [crit.id]: { ...av, obs: val } }) }} />
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <p className="p-4 text-gray-500 italic text-sm">Nenhum critério vinculado a esta capacidade.</p>
                                                )}
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

// --- Componente auxiliar para Status Finalizado (mantido para evitar warnings) ---
const renderStatusFinalizado = (aluno: Aluno, resultado: ResultadoBoletimDTO | null, handleReabrir: () => Promise<void>, finalizando: boolean) => {
    if (!aluno || !resultado) return null;

    const nivel = resultado.nivelAlcancado;
    const statusCor = nivel >= 50 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    const statusTexto = nivel >= 50 ? 'APROVADO' : 'RETIDO';

    return (
        <div className="bg-white p-6 rounded-lg shadow-xl border-l-4 border-l-green-600 flex justify-between items-center max-w-5xl mx-auto">

            {/* Status Principal */}
            <div className="flex items-center gap-4">
                <Lock size={36} className="text-gray-500" />
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Avaliação Finalizada</p>
                    <h3 className="text-2xl font-bold text-gray-800">
                        {aluno.nome} - Resultado Final
                    </h3>
                </div>
            </div>

            {/* Resultado e Ação */}
            <div className="flex items-center gap-6">
                <div className="text-center">
                    <span className="text-4xl font-extrabold text-indigo-700">{nivel}</span>
                    <p className="text-xs font-bold text-gray-500">Nível Final</p>
                </div>

                <span className={`px-4 py-2 rounded-full text-sm font-bold ${statusCor}`}>
                    {statusTexto}
                </span>

                <button
                    onClick={handleReabrir}
                    disabled={finalizando}
                    className="bg-red-500 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-red-600 transition shadow-md disabled:opacity-50"
                >
                    <Unlock size={18} /> Reabrir Edição
                </button>
            </div>
        </div>
    );
};