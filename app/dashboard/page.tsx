'use client';

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { TrendingUp, Filter, AlertTriangle } from 'lucide-react';
import { useDashboard } from '@/app/hooks/useDashboard'; // Importa o Hook

const COLORS_PIE = ['#10b981', '#ef4444']; 

export default function DashboardPage() {
  // O componente agora é PURA visualização. Zero lógica de API.
  const { 
    turmas, selectedTurmaId, setSelectedTurmaId, 
    loadingDados, loadingFiltros, 
    nomeDisciplinaAtual, estruturaSnapshotId, totalAlunos,
    kpis, dataStatus, dataFaixas, topAlunos 
  } = useDashboard();

  if (loadingFiltros) return <div className="flex h-screen items-center justify-center text-indigo-600 font-medium">Carregando sistema...</div>;

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-gray-50">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard Analítico</h1>
        <p className="text-gray-500">Indicadores baseados no Snapshot imutável da Turma.</p>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center gap-2 text-indigo-600 font-semibold px-2 border-r pr-4 border-gray-200"><Filter size={20} /> Filtros:</div>
        <div className="flex-1">
            <select 
                className="w-full p-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500" 
                value={selectedTurmaId} 
                onChange={(e) => setSelectedTurmaId(e.target.value)}
            >
                {turmas.length > 0 ? (
                    turmas.map(t => <option key={t.id} value={t.id}>{t.nome} ({t.anoSemestre})</option>)
                ) : <option value="">Nenhuma Turma Encontrada</option>}
            </select>
        </div>
        <div className="flex-1 text-sm font-medium text-gray-700 bg-gray-100 p-2 rounded-lg border border-gray-300">
            Disciplina: <span className="font-bold text-indigo-700">{nomeDisciplinaAtual}</span>
            {estruturaSnapshotId && <span className="text-[10px] bg-indigo-200 text-indigo-800 px-2 py-1 rounded ml-2">SNAPSHOT ACTIVE: #{estruturaSnapshotId}</span>}
        </div>
      </div>

      {loadingDados ? (
        <div className="text-center py-20 text-gray-400">Processando indicadores de desempenho...</div>
      ) : totalAlunos === 0 ? (
        !estruturaSnapshotId ? (
              <div className="text-center py-20 bg-white rounded-xl border border-dashed border-red-300 text-red-500">
                <AlertTriangle size={32} className="mx-auto mb-2"/>
                <p>A Turma selecionada não possui uma estrutura de avaliação (Snapshot) gerada.</p>
            </div>
        ) : (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">Nenhum aluno ou avaliação encontrada.</div>
        )
      ) : (
        <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase">Nível Médio</p>
                  <h3 className="text-3xl font-bold text-blue-800">{kpis.mediaGeral}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase">Alunos com Nível</p>
                  <h3 className="text-3xl font-bold text-emerald-600">{kpis.aprovados}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase">Sem Nível Alcançado</p>
                  <h3 className="text-3xl font-bold text-red-500">{kpis.retidos}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase">Total na Turma</p>
                  <h3 className="text-3xl font-bold text-indigo-600">{kpis.totalAlunos}</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-700 mb-6 flex items-center gap-2"><TrendingUp size={20} className="text-indigo-500"/> Distribuição de Alunos por Nível</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dataFaixas}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '8px'}}/>
                                <Bar dataKey="alunos" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={60} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                    <h3 className="font-bold text-gray-700 mb-2">Status da Turma</h3>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={dataStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                                    {dataStatus.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS_PIE[index]} />))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-3">Maiores Desempenhos</p>
                        <div className="space-y-3">
                            {topAlunos.map((aluno, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <span className="text-gray-700 truncate max-w-[150px]">{aluno.nomeAluno}</span>
                                    <span className="font-bold text-indigo-600">Nível {aluno.nivelAlcancado}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
      )}
    </div>
  );
}