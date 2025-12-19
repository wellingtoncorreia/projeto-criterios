'use client';
import { use, useEffect } from "react"; //
import { ArrowLeft, BookOpen, BarChart3, HelpCircle, Loader2, FileBarChart } from "lucide-react";
import Link from "next/link";
import { useRelatorioTurma } from "@/app/hooks/useRelatorioTurma";

interface PageProps { params: Promise<{ id: string }>; }

export default function RelatorioNotasPage({ params }: PageProps) {
  const { id } = use(params);
  const { 
    turma, disciplines, boletins, niveisRegra, 
    loadingDados, loadingRelatorio, selectedSnapshotId, setSelectedSnapshotId, 
    origem, disciplinaAtiva 
  } = useRelatorioTurma(id);

  if (loadingDados) return <div className="p-8 text-center flex flex-col items-center text-gray-500"><Loader2 className="animate-spin mb-2"/> Carregando contexto...</div>;
  if (!turma) return <div className="p-8 text-center text-red-500">Turma não encontrada.</div>;

  return (
    <div className="p-8 max-w-[1400px] mx-auto bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <Link href={origem === 'detalhes' ? `/gestao/turmas/${id}` : `/gestao/turmas/${id}/avaliacao?estruturaId=${selectedSnapshotId}&discId=${disciplinaAtiva?.id || ''}`} className="text-gray-500 hover:text-blue-600 flex items-center gap-2 mb-2 text-sm font-medium">
             <ArrowLeft size={16} /> Voltar
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3"><FileBarChart className="text-blue-600" /> Relatório Final</h1>
          <p className="text-gray-500 mt-1">Turma: {turma.nome} | {turma.anoSemestre}</p>
        </div>

        <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 mr-2"><BookOpen size={18} /> Disciplina:</div>
          <select value={selectedSnapshotId || ''} onChange={(e) => setSelectedSnapshotId(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block p-2.5 min-w-[250px]">
            {disciplines.map(d => <option key={d.id} value={d.snapshotId?.toString() || ''} disabled={!d.snapshotId}>{d.nome} {d.isPrincipal ? '(Principal)' : ''} {!d.snapshotId ? '(Pendente)' : ''}</option>)}
          </select>
        </div>
      </div>

      {!selectedSnapshotId ? (
         <div className="p-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Sem Relatório</h3>
            <p className="text-gray-500 mt-2">Selecione uma disciplina com avaliação iniciada.</p>
         </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            <div className="xl:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
                <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2"><BarChart3 size={20} /> Desempenho</h3>
                    {boletins.length > 0 && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-bold">{boletins.length} Alunos</span>}
                </div>
                {loadingRelatorio ? <div className="p-20 text-center text-gray-400"><Loader2 className="animate-spin mb-4 mx-auto" size={32} />Processando...</div> : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead><tr className="text-xs font-bold text-gray-500 uppercase border-b bg-gray-50/50"><th className="px-6 py-3">Aluno</th><th className="px-6 py-3 text-center text-red-600">Críticos</th><th className="px-6 py-3 text-center text-gray-600">Desejáveis</th><th className="px-6 py-3 text-center">Nível</th><th className="px-6 py-3 text-center">Status</th></tr></thead>
                        <tbody className="divide-y divide-gray-100">
                            {boletins.map((b, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4 font-medium text-gray-800">{b.nomeAluno}</td>
                                <td className="px-6 py-4 text-center"><span className="font-bold text-red-600">{b.qtdCriticosAtendidos}</span><span className="text-gray-400 text-xs ml-1">/ {b.totalCriticosDisciplina}</span></td>
                                <td className="px-6 py-4 text-center"><span className="font-bold text-gray-700">{b.qtdDesejaveisAtendidos}</span><span className="text-gray-400 text-xs ml-1">/ {b.totalDesejaveisDisciplina}</span></td>
                                <td className="px-6 py-4 text-center"><div className={`inline-flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold ${b.nivelAlcancado >= 50 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>{b.nivelAlcancado}</div></td>
                                <td className="px-6 py-4 text-center"><span className={`px-3 py-1 rounded-full text-xs font-bold border ${b.nivelAlcancado >= 50 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>{b.nivelAlcancado >= 50 ? 'APROVADO' : 'RETIDO'}</span></td>
                            </tr>))}
                        </tbody>
                    </table>
                </div>)}
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-fit">
                <div className="px-4 py-3 border-b bg-yellow-50 flex items-center gap-2"><HelpCircle size={18} className="text-yellow-600" /><h3 className="font-bold text-yellow-800 text-sm uppercase">Régua</h3></div>
                <div className="p-4 bg-yellow-50/30">
                    <div className="overflow-hidden border rounded-lg bg-white">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 text-gray-600 text-[10px] uppercase"><tr><th className="px-2 py-2 text-center">Nível</th><th className="px-2 py-2 text-center text-red-600">Crít.</th><th className="px-2 py-2 text-center text-gray-600">Des.</th></tr></thead>
                            <tbody className="divide-y divide-gray-100">
                                {niveisRegra.length === 0 ? <tr><td colSpan={3} className="text-center py-2 text-gray-400 text-xs">Sem regras</td></tr> : niveisRegra.map((r) => (<tr key={r.id}><td className="px-2 py-2 text-center font-bold text-blue-600">{r.nivel}</td><td className="px-2 py-2 text-center font-medium">{r.minCriticos}</td><td className="px-2 py-2 text-center text-gray-500">{r.minDesejaveis}</td></tr>))}
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