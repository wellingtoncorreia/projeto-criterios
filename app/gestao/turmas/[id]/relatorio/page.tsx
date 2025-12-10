'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, Download, CheckSquare, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import api from '@/app/services/api';
import Swal from 'sweetalert2';
import { Turma } from '@/app/types';
import { formatPercentual } from '@/app/utils/formatters';

// Interface do DTO de Resultado (mesmo que venha do backend)
interface ResultadoBoletimDTO {
    nomeAluno: string;
    nomeDisciplina: string;
    qtdCriticosAtendidos: number;
    qtdDesejaveisAtendidos: number;
    totalCriticosDisciplina: number;
    totalDesejaveisDisciplina: number;
    nivelAlcancado: number;
    percentualConclusao: number;
    finalizada: boolean;
    alunoId: number;
}

export default function RelatorioTurmaPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const turmaId = params?.id as string;
    
    // Recebe o ID da Estrutura (Snapshot) da URL para inicialização
    // É importante buscá-lo aqui, mas o mais confiável é o que vem no objeto Turma.
    const estruturaDisciplinaIdUrl = searchParams.get('estruturaId'); 

    const [turma, setTurma] = useState<Turma | null>(null);
    const [resultados, setResultados] = useState<ResultadoBoletimDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [finalizando, setFinalizando] = useState(false);

    async function carregarBoletim() {
        setLoading(true);
        
        let idSnapshot = estruturaDisciplinaIdUrl;

        try {
            const resTurma = await api.get<Turma>(`/turmas/${turmaId}`);
            setTurma(resTurma.data);
            
            // Prioriza o ID do Snapshot vindo do objeto Turma (que é mais confiável)
            if (resTurma.data.estruturaSnapshotId) { // <-- USANDO O CAMPO CORRETO
                idSnapshot = resTurma.data.estruturaSnapshotId.toString(); 
            }

            if (!idSnapshot) {
                Swal.fire('Erro', 'Estrutura da disciplina não definida para esta turma.', 'error');
                setLoading(false);
                return;
            }

            // [CORREÇÃO] Passa o ID do Snapshot para o endpoint
            const resBoletim = await api.get<ResultadoBoletimDTO[]>(`/avaliacoes/boletim/turma/${turmaId}?estruturaDisciplinaId=${idSnapshot}`); 
            setResultados(resBoletim.data);

        } catch (error) {
            console.error("Erro ao carregar boletim:", error);
            Swal.fire('Erro', 'Não foi possível carregar o boletim da turma.', 'error');
        } finally {
            setLoading(false);
        }
    }

    // Função de Download
    const handleDownload = async () => {
        // Usa o campo correto do DTO
        if (!turma || !turma.estruturaSnapshotId) { 
            Swal.fire('Erro', 'ID da estrutura de disciplina (Snapshot) não encontrado para exportação.', 'error');
            return;
        }

        try {
            Swal.fire({
                title: 'Preparando Download...',
                text: 'Aguarde enquanto o arquivo é gerado.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // [CORREÇÃO] Passa o ID do Snapshot
            // alunoId=0 indica download do relatório completo da turma
            const response = await api.get(`/arquivos/boletim/download?alunoId=0&estruturaDisciplinaId=${turma.estruturaSnapshotId}`, {
                responseType: 'blob', // Recebe como Blob para download
            });

            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Boletim-${turma.nome.replace(/\s/g, '_')}-${turma.anoSemestre}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            
            Swal.close();
            Swal.fire('Sucesso', 'Download iniciado!', 'success');

        } catch (error) {
            Swal.close();
            console.error("Erro no download:", error);
            Swal.fire('Erro', 'Houve um erro ao gerar o arquivo de boletim.', 'error');
        }
    };
    
    // Função para Finalizar Turma
    const handleFinalizarTurma = async () => {
        if (!turma || !turma.estruturaSnapshotId) return;

        const result = await Swal.fire({
            title: 'Finalizar Avaliações da Turma?',
            text: `Isso irá calcular o Nível Final para todos os alunos e travará o lançamento de notas para a turma "${turma.nome}". Esta ação é reversível.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sim, Finalizar'
        });

        if (result.isConfirmed) {
            setFinalizando(true);
            try {
                // [CORREÇÃO] Passa o ID do Snapshot
                await api.post(`/avaliacoes/finalizar/turma/${turmaId}?estruturaDisciplinaId=${turma.estruturaSnapshotId}`);
                await Swal.fire('Sucesso!', 'Todas as avaliações da turma foram finalizadas.', 'success');
                carregarBoletim();
            } catch (error: any) {
                const message = error.response?.data || 'Erro ao finalizar avaliações.';
                Swal.fire('Erro', typeof message === 'string' ? message : 'Erro desconhecido.', 'error');
            } finally {
                setFinalizando(false);
            }
        }
    };
    
    // Função para Reabrir Turma
    const handleReabrirTurma = async () => {
        if (!turma || !turma.estruturaSnapshotId) return;

        const result = await Swal.fire({
            title: 'Reabrir Turma para Avaliação?',
            text: `Isso irá reverter a finalização das notas para a turma "${turma.nome}", permitindo novos lançamentos.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sim, Reabrir'
        });

        if (result.isConfirmed) {
            setFinalizando(true);
            try {
                // [CORREÇÃO] Passa o ID do Snapshot
                await api.post(`/avaliacoes/reabrir/turma/${turmaId}?estruturaDisciplinaId=${turma.estruturaSnapshotId}`);
                await Swal.fire('Sucesso!', 'A turma foi reaberta para avaliação.', 'success');
                carregarBoletim();
            } catch (error: any) {
                const message = error.response?.data || 'Erro ao reabrir avaliações.';
                Swal.fire('Erro', typeof message === 'string' ? message : 'Erro desconhecido.', 'error');
            } finally {
                setFinalizando(false);
            }
        }
    };


    useEffect(() => {
        carregarBoletim();
    }, [turmaId]); 

    // Determina o ID do Snapshot de forma segura para o JSX
    const safeEstruturaId = turma?.estruturaSnapshotId?.toString(); // <-- USANDO O CAMPO CORRETO
    
    if (loading) return <div className="p-8 text-center text-gray-500"><Loader2 size={32} className="animate-spin mx-auto mb-2"/> Carregando Boletim...</div>;
    if (!turma || !safeEstruturaId) return <div className="p-8 text-red-500">Turma não encontrada ou estrutura de avaliação não definida.</div>;

    const nomeDisciplina = turma.nomeDisciplina || 'N/A';
    const todosFinalizados = resultados.length > 0 && resultados.every(r => r.finalizada);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <Link 
                    href={`/gestao/turmas/${turmaId}`} 
                    className="text-gray-500 hover:text-gray-700 flex items-center gap-2"
                >
                    <ArrowLeft size={20} /> Voltar para Detalhes da Turma
                </Link>

                <div className="flex gap-3">
                    {/* Botão de Finalizar/Reabrir Turma */}
                    {todosFinalizados ? (
                        <button 
                            onClick={handleReabrirTurma}
                            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center gap-2 text-sm font-medium transition shadow-sm"
                            disabled={finalizando}
                        >
                            {finalizando ? <Loader2 size={18} className="animate-spin"/> : <RotateCcw size={18} />} Reabrir Avaliações
                        </button>
                    ) : (
                        <button 
                            onClick={handleFinalizarTurma}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium transition shadow-sm"
                            disabled={finalizando}
                        >
                            {finalizando ? <Loader2 size={18} className="animate-spin"/> : <CheckSquare size={18} />} Finalizar Avaliações
                        </button>
                    )}
                    
                    {/* Botão de Download */}
                    <button 
                        onClick={handleDownload}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2 text-sm font-medium transition shadow-sm"
                    >
                        <Download size={18} /> Exportar Boletim (XLSX)
                    </button>
                </div>
            </div>

            <div className="mb-8 border-b pb-4">
                <h1 className="text-3xl font-bold text-gray-800">Boletim da Turma: {turma.nome}</h1>
                <p className="text-gray-500 text-lg">
                    Disciplina: {nomeDisciplina} | {turma.anoSemestre} - {turma.termoAtual}º Termo 
                    <span className="ml-4 text-sm font-medium bg-gray-100 px-3 py-1 rounded-full">Snapshot ID: {safeEstruturaId}</span>
                </p>
                {todosFinalizados && (
                    <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-lg font-semibold">
                        <p>AVISO: As avaliações desta turma estão FINALIZADAS. O nível exibido é o resultado final.</p>
                    </div>
                )}
            </div>

            {/* Tabela de Resultados */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aluno</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Críticos (Atendidos / Total)</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Desejáveis (Atendidos / Total)</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Conclusão</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Nível Alcançado</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {resultados.map((res, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {res.nomeAluno}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                    <span className={res.qtdCriticosAtendidos < res.totalCriticosDisciplina ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                                        {res.qtdCriticosAtendidos}
                                    </span>
                                    {' / '}
                                    {res.totalCriticosDisciplina}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                                    {res.qtdDesejaveisAtendidos} / {res.totalDesejaveisDisciplina}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold">
                                    {formatPercentual(res.percentualConclusao)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className={`px-3 py-1 text-sm font-bold rounded-full ${
                                        res.nivelAlcancado > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                        NÍVEL {res.nivelAlcancado}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {resultados.length === 0 && (
                <div className="p-12 text-center bg-gray-50 rounded-lg border border-dashed text-gray-500 mt-6">
                    <p>Nenhum aluno encontrado ou nenhuma avaliação registrada para esta turma.</p>
                </div>
            )}
        </div>
    );
}