"use client";

import { useEffect, useState, use } from "react";
import { ArrowLeft, BookOpen, BarChart3, HelpCircle } from "lucide-react";
import Link from "next/link";
import api from "@/app/services/api";

// Tipagens
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

interface Disciplina { id: number; nome: string; }
interface Turma { id: number; nome: string; }

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RelatorioNotasPage({ params }: PageProps) {
  const { id: turmaId } = use(params);

  const [turma, setTurma] = useState<Turma | null>(null);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState<number | null>(null);
  
  const [boletins, setBoletins] = useState<Boletim[]>([]);
  const [niveisRegra, setNiveisRegra] = useState<NivelRegra[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Carrega dados iniciais
  useEffect(() => {
    Promise.all([
      api.get(`/turmas`), 
      api.get(`/disciplinas`)
    ]).then(([resTurma, resDisc]) => {
      const t = resTurma.data.find((x: Turma) => x.id === Number(turmaId));
      setTurma(t);
      setDisciplinas(resDisc.data);
      
      if (resDisc.data.length > 0) {
        setDisciplinaSelecionada(resDisc.data[0].id);
      }
    });
  }, [turmaId]);

  // 2. Carrega o Relatório e as Regras quando muda a disciplina
  useEffect(() => {
    if (!disciplinaSelecionada) return;
    
    setLoading(true);
    
    // Busca Notas da Turma + Regras de Nível da Disciplina
    Promise.all([
        api.get(`/avaliacoes/boletim/turma/${turmaId}`, { params: { disciplinaId: disciplinaSelecionada } }),
        api.get(`/disciplinas/${disciplinaSelecionada}/niveis`)
    ])
    .then(([resBol, resNiveis]) => {
        setBoletins(resBol.data);
        setNiveisRegra(resNiveis.data);
    })
    .catch(err => console.error(err))
    .finally(() => setLoading(false));

  }, [turmaId, disciplinaSelecionada]);

  if (!turma) return <div className="p-8">Carregando...</div>;

  return (
    <div className="p-8 max-w-[1400px] mx-auto bg-gray-50 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <Link href={`/gestao/turmas/${turmaId}`} className="text-gray-500 hover:text-gray-700 flex items-center gap-2 mb-2 text-sm">
            <ArrowLeft size={16} /> Voltar para Detalhes
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Relatório Final da Turma</h1>
          <p className="text-gray-500">{turma.nome}</p>
        </div>

        {/* Seletor de Disciplina */}
        <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 flex items-center gap-2">
          <BookOpen className="text-blue-600 ml-2" size={20} />
          <select 
            className="bg-transparent border-none text-gray-700 font-medium focus:ring-0 cursor-pointer py-1 pr-8 outline-none"
            value={disciplinaSelecionada || ""}
            onChange={(e) => setDisciplinaSelecionada(Number(e.target.value))}
          >
            {disciplinas.map(d => (
              <option key={d.id} value={d.id}>{d.nome}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* COLUNA ESQUERDA: Tabela de Notas dos Alunos */}
        <div className="xl:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <BarChart3 size={20} /> Desempenho dos Alunos
            </h3>
            </div>

            {loading ? (
            <div className="p-12 text-center text-gray-500">Calculando notas...</div>
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
                    <tr key={idx} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-medium text-gray-800">{boletim.nomeAluno}</td>
                        
                        <td className="px-6 py-4 text-center">
                            <span className="font-bold text-red-600">{boletim.qtdCriticosAtendidos}</span>
                            <span className="text-gray-400 text-xs"> / {boletim.totalCriticosDisciplina}</span>
                        </td>
                        
                        <td className="px-6 py-4 text-center">
                            <span className="font-bold text-gray-700">{boletim.qtdDesejaveisAtendidos}</span>
                            <span className="text-gray-400 text-xs"> / {boletim.totalDesejaveisDisciplina}</span>
                        </td>
                        
                        <td className="px-6 py-4 text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 border-2 border-blue-100 font-bold text-blue-700 text-lg">
                                {boletim.nivelAlcancado}
                            </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                            {boletim.nivelAlcancado >= 50 ? (
                                <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                    APROVADO
                                </span>
                            ) : (
                                <span className="inline-block px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                                    RETIDO
                                </span>
                            )}
                        </td>
                    </tr>
                    ))}
                    {boletins.length === 0 && (
                        <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhum dado encontrado.</td></tr>
                    )}
                </tbody>
                </table>
            </div>
            )}
        </div>

        {/* COLUNA DIREITA: Tabela de Regras de Nível (Referência) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-fit">
            <div className="px-4 py-3 border-b bg-yellow-50 flex items-center gap-2">
                <HelpCircle size={18} className="text-yellow-600" />
                <h3 className="font-bold text-yellow-800 text-sm uppercase">Regra de Cálculo</h3>
            </div>
            
            <div className="p-4 bg-yellow-50/30">
                <p className="text-xs text-gray-500 mb-3">
                    Para atingir um nível, o aluno deve cumprir <strong>ambos</strong> os requisitos mínimos abaixo:
                </p>
                <div className="overflow-hidden border rounded-lg">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                            <tr>
                                <th className="px-3 py-2 text-center">Nível</th>
                                <th className="px-3 py-2 text-center text-red-600">Mín. Crít.</th>
                                <th className="px-3 py-2 text-center">Mín. Des.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {niveisRegra.map((regra) => (
                                <tr key={regra.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 text-center font-bold text-blue-600">{regra.nivel}</td>
                                    <td className="px-3 py-2 text-center font-medium">{regra.minCriticos}</td>
                                    <td className="px-3 py-2 text-center text-gray-500">{regra.minDesejaveis}</td>
                                </tr>
                            ))}
                            {niveisRegra.length === 0 && (
                                <tr><td colSpan={3} className="p-4 text-center text-xs text-gray-400">Sem regras cadastradas</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}