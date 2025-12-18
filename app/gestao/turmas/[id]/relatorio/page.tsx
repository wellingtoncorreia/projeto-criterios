"use client";

import { useEffect, useState, use, useCallback } from "react";
import { ArrowLeft, BookOpen, BarChart3, HelpCircle, Loader2, FileBarChart } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/app/services/api";
import { Turma, Disciplina } from "@/app/types";

// ... (Interfaces mantidas iguais) ...
interface Boletim {
  nomeAluno: string;
  qtdCriticosAtendidos: number;
  qtdDesejaveisAtendidos: number;
  totalCriticosDisciplina: number;
  totalDesejaveisDisciplina: number;
  nivelAlcancado: number;
  percentualConclusao: number;
}

interface NivelRegra {
  id: number;
  nivel: number;
  minCriticos: number;
  minDesejaveis: number;
}

interface DisciplinaComSnapshot extends Disciplina {
  snapshotId: number | null;
  isPrincipal: boolean;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RelatorioNotasPage({ params }: PageProps) {
  const { id: turmaId } = use(params);
  const searchParams = useSearchParams();
  
  // [NOVO] Captura a origem da navegação ('detalhes' ou 'avaliacao')
  const origem = searchParams.get('origem'); 

  const [turma, setTurma] = useState<Turma | null>(null);
  const [disciplinas, setDisciplinas] = useState<DisciplinaComSnapshot[]>([]);
  
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(searchParams.get('estruturaId'));

  const [boletins, setBoletins] = useState<Boletim[]>([]);
  const [niveisRegra, setNiveisRegra] = useState<NivelRegra[]>([]);
  
  const [loadingDados, setLoadingDados] = useState(true);
  const [loadingRelatorio, setLoadingRelatorio] = useState(false);

  // ... (carregarDadosIniciais mantido igual) ...
  const carregarDadosIniciais = useCallback(async () => {
    setLoadingDados(true);
    try {
      const [resTurma, resDiscs] = await Promise.all([
        api.get<Turma>(`/turmas/${turmaId}`),
        api.get<Disciplina[]>(`/turmas/${turmaId}/disciplinas`)
      ]);

      const turmaData = resTurma.data;
      setTurma(turmaData);

      const disciplinasPromises = resDiscs.data.map(async (d) => {
        let snapId: number | null = null;
        if (d.id === turmaData.disciplinaId && turmaData.estruturaSnapshotId) {
            snapId = turmaData.estruturaSnapshotId;
        } else {
            try {
                const res = await api.get<number>(`/disciplinas/${d.id}/snapshot-status`);
                snapId = res.data;
            } catch {
                snapId = null;
            }
        }
        return {
          ...d,
          isPrincipal: d.id === turmaData.disciplinaId,
          snapshotId: snapId
        } as DisciplinaComSnapshot;
      });

      const disciplinasResolvidas = await Promise.all(disciplinasPromises);
      setDisciplinas(disciplinasResolvidas);

      if (!selectedSnapshotId) {
        const principal = disciplinasResolvidas.find(d => d.isPrincipal && d.snapshotId);
        if (principal) {
            setSelectedSnapshotId(principal.snapshotId!.toString());
        } else {
            const qualqer = disciplinasResolvidas.find(d => d.snapshotId);
            if (qualqer) setSelectedSnapshotId(qualqer.snapshotId!.toString());
        }
      }

    } catch (err) {
      console.error("Erro ao carregar dados iniciais", err);
    } finally {
      setLoadingDados(false);
    }
  }, [turmaId, selectedSnapshotId]);

  useEffect(() => { carregarDadosIniciais(); }, [carregarDadosIniciais]);

  useEffect(() => {
    if (!selectedSnapshotId) {
        setBoletins([]);
        setNiveisRegra([]);
        return;
    }

    setLoadingRelatorio(true);
    
    // [AJUSTE] Mantém a origem na URL ao trocar de filtro, para o botão voltar não quebrar
    const paramsUrl = new URLSearchParams();
    paramsUrl.set('estruturaId', selectedSnapshotId);
    if (origem) paramsUrl.set('origem', origem);

    const novaUrl = `/gestao/turmas/${turmaId}/relatorio?${paramsUrl.toString()}`;
    window.history.replaceState(null, '', novaUrl);

    Promise.all([
      api.get<Boletim[]>(`/avaliacoes/boletim/turma/${turmaId}`, { 
        params: { estruturaDisciplinaId: selectedSnapshotId } 
      }),
      api.get<NivelRegra[]>(`/disciplinas/niveis/snapshot/${selectedSnapshotId}`)
    ])
    .then(([resBol, resNiveis]) => {
        const ordenado = Array.isArray(resBol.data) 
            ? resBol.data.sort((a, b) => a.nomeAluno.localeCompare(b.nomeAluno)) 
            : [];
        setBoletins(ordenado);

        const regras = Array.isArray(resNiveis.data) ? resNiveis.data : [];
        setNiveisRegra(regras);
    })
    .catch(err => {
        console.error("Erro ao carregar relatório", err);
        setBoletins([]);
        setNiveisRegra([]);
    })
    .finally(() => setLoadingRelatorio(false));

  }, [turmaId, selectedSnapshotId, origem]);

  if (loadingDados) return <div className="p-8 text-center flex flex-col items-center text-gray-500"><Loader2 className="animate-spin mb-2"/> Carregando contexto da turma...</div>;
  if (!turma) return <div className="p-8 text-center text-red-500">Turma não encontrada.</div>;

  const disciplinaAtiva = disciplinas.find(d => d.snapshotId?.toString() === selectedSnapshotId);

  return (
    <div className="p-8 max-w-[1400px] mx-auto bg-gray-50 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          
          {/* [LÓGICA DO BOTÃO VOLTAR] */}
          {origem === 'detalhes' ? (
             <Link 
               href={`/gestao/turmas/${turmaId}`} 
               className="text-gray-500 hover:text-blue-600 flex items-center gap-2 mb-2 text-sm font-medium"
             >
               <ArrowLeft size={16} /> Voltar para Detalhes
             </Link>
          ) : (
             <Link 
               // Inclui discId para a página de avaliação carregar corretamente
               href={`/gestao/turmas/${turmaId}/avaliacao?estruturaId=${selectedSnapshotId}&discId=${disciplinaAtiva?.id || ''}`} 
               className="text-gray-500 hover:text-blue-600 flex items-center gap-2 mb-2 text-sm font-medium"
             >
               <ArrowLeft size={16} /> Voltar para Avaliação
             </Link>
          )}

          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FileBarChart className="text-blue-600" /> Relatório Final da Turma
          </h1>
          <p className="text-gray-500 mt-1">Turma: {turma.nome} | {turma.anoSemestre}</p>
        </div>

        {/* ... (Seletor de disciplina mantido igual) ... */}
        <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 mr-2">
            <BookOpen size={18} /> Disciplina:
          </div>
          
          <select 
            value={selectedSnapshotId || ''} 
            onChange={(e) => setSelectedSnapshotId(e.target.value)}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 min-w-[250px]"
          >
            {disciplinas.length === 0 && <option value="">Nenhuma disciplina disponível</option>}
            
            {disciplinas.map(disc => (
                <option 
                    key={disc.id} 
                    value={disc.snapshotId?.toString() || ''} 
                    disabled={!disc.snapshotId}
                >
                    {disc.nome} {disc.isPrincipal ? '(Principal)' : ''} {!disc.snapshotId ? '(Sem Avaliação Iniciada)' : ''}
                </option>
            ))}
          </select>
        </div>
      </div>

      {/* ... (Restante do conteúdo: Tabela e Régua de Níveis mantidos iguais) ... */}
      {!selectedSnapshotId ? (
         <div className="p-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Nenhum Relatório Disponível</h3>
            <p className="text-gray-500 mt-2">Selecione uma disciplina acima que possua avaliação iniciada (Snapshot criado).</p>
         </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Tabela de Desempenho */}
            <div className="xl:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
                <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <BarChart3 size={20} /> Desempenho - {disciplinaAtiva?.nome || 'Disciplina'}
                    </h3>
                    {boletins.length > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-bold">
                            {boletins.length} Alunos Listados
                        </span>
                    )}
                </div>

                {loadingRelatorio ? (
                <div className="p-20 text-center flex flex-col items-center justify-center text-gray-400">
                    <Loader2 className="animate-spin mb-4" size={32} />
                    <p>Processando notas e níveis...</p>
                </div>
                ) : boletins.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        Nenhum dado de avaliação encontrado para esta disciplina.
                    </div>
                ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs font-bold text-gray-500 uppercase border-b bg-gray-50/50">
                            <th className="px-6 py-3">Aluno</th>
                            <th className="px-6 py-3 text-center text-red-600">Críticos</th>
                            <th className="px-6 py-3 text-center text-gray-600">Desejáveis</th>
                            <th className="px-6 py-3 text-center">Nível Final</th>
                            <th className="px-6 py-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {boletins.map((boletim, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition group">
                                <td className="px-6 py-4 font-medium text-gray-800">{boletim.nomeAluno}</td>
                                <td className="px-6 py-4 text-center group-hover:bg-red-50/30 transition">
                                    <span className="font-bold text-red-600">{boletim.qtdCriticosAtendidos}</span> 
                                    <span className="text-gray-400 text-xs ml-1">/ {boletim.totalCriticosDisciplina}</span>
                                </td>
                                <td className="px-6 py-4 text-center group-hover:bg-gray-50/50 transition">
                                    <span className="font-bold text-gray-700">{boletim.qtdDesejaveisAtendidos}</span>
                                    <span className="text-gray-400 text-xs ml-1">/ {boletim.totalDesejaveisDisciplina}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold ${boletim.nivelAlcancado >= 50 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                        {boletim.nivelAlcancado}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${boletim.nivelAlcancado >= 50 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                        {boletim.nivelAlcancado >= 50 ? 'APROVADO' : 'RETIDO'}
                                    </span>
                                </td>
                            </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                )}
            </div>

            {/* Regra de Cálculo */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-fit">
                <div className="px-4 py-3 border-b bg-yellow-50 flex items-center gap-2">
                    <HelpCircle size={18} className="text-yellow-600" />
                    <h3 className="font-bold text-yellow-800 text-sm uppercase">Régua de Níveis</h3>
                </div>
                <div className="p-4 bg-yellow-50/30">
                    <p className="text-[11px] text-gray-500 mb-3">
                        Regras aplicadas para o cálculo de nível nesta avaliação (Snapshot #{selectedSnapshotId}):
                    </p>
                    <div className="overflow-hidden border rounded-lg bg-white">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 text-gray-600 text-[10px] uppercase">
                                <tr>
                                    <th className="px-2 py-2 text-center">Nível</th>
                                    <th className="px-2 py-2 text-center text-red-600">Mín. Crít.</th>
                                    <th className="px-2 py-2 text-center text-gray-600">Mín. Des.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {niveisRegra.length === 0 ? (
                                    <tr><td colSpan={3} className="text-center py-2 text-gray-400 text-xs">Sem regras definidas</td></tr>
                                ) : (
                                    niveisRegra.map((regra) => (
                                        <tr key={regra.id}>
                                            <td className="px-2 py-2 text-center font-bold text-blue-600">{regra.nivel}</td>
                                            <td className="px-2 py-2 text-center font-medium">{regra.minCriticos}</td>
                                            <td className="px-2 py-2 text-center text-gray-500">{regra.minDesejaveis}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}