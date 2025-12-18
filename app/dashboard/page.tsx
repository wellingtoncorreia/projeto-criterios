'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; 
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { TrendingUp, Filter, AlertTriangle } from 'lucide-react';
import api from '@/app/services/api';
import Swal from 'sweetalert2'; 
import { Turma } from '@/app/types';

interface Boletim { 
  nomeAluno: string; 
  nivelAlcancado: number; 
}

const COLORS_PIE = ['#10b981', '#ef4444']; 

export default function DashboardPage() {
  const router = useRouter(); 

  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [selectedTurmaId, setSelectedTurmaId] = useState<number | string>("");
  const [boletins, setBoletins] = useState<Boletim[]>([]);
  const [loadingDados, setLoadingDados] = useState(false);
  const [loadingFiltros, setLoadingFiltros] = useState(true);

  const selectedTurma = turmas.find(t => t.id === Number(selectedTurmaId));
  const estruturaSnapshotId = selectedTurma?.estruturaSnapshotId;
  const nomeDisciplinaAtual = selectedTurma?.nomeDisciplina || "...";
  
  // Função auxiliar robusta para pegar o token
  const getToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  // 1. Carregar Turmas e Validar Sessão
  useEffect(() => {
    const token = getToken();

    // Se não tiver token em lugar nenhum, redireciona
    if (!token) {
        router.push('/login');
        return; 
    }
      
    // Configuração manual do Header para garantir o envio
    const authConfig = {
        headers: { Authorization: `Bearer ${token}` }
    };

    api.get<Turma[]>('/turmas', authConfig)
    .then(res => {
        setTurmas(res.data);
        if (res.data.length > 0) setSelectedTurmaId(res.data[0].id);
    }).catch(err => {
        console.error("Erro ao carregar turmas:", err);
        
        // Se a API recusar o token (expirado/inválido), limpa e redireciona
        if (err.response?.status === 401 || err.response?.status === 403) {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            router.push('/login');
        } else {
            Swal.fire('Erro', 'Não foi possível carregar a lista de turmas.', 'error'); 
        }
    }).finally(() => setLoadingFiltros(false));
  }, [router]);
  
  // 2. Carregar Dados do Boletim
  useEffect(() => {
    const token = getToken();

    // Se faltar dados essenciais ou token, não faz a requisição
    if (!selectedTurmaId || !estruturaSnapshotId || !token) { 
        setBoletins([]);
        return;
    }
      
    setLoadingDados(true);
    
    const authConfig = {
        headers: { Authorization: `Bearer ${token}` },
        params: { estruturaDisciplinaId: estruturaSnapshotId } 
    };

    api.get<Boletim[]>(`/avaliacoes/boletim/turma/${selectedTurmaId}`, authConfig)
    .then(res => setBoletins(res.data))
    .catch(err => {
        console.error(err);
        setBoletins([]);
    })
    .finally(() => setLoadingDados(false));

  }, [selectedTurmaId, estruturaSnapshotId]);

  // --- Cálculos e Renderização ---
  const totalAlunos = boletins.length;
  const mediaGeral = totalAlunos > 0 ? (boletins.reduce((acc, b) => acc + b.nivelAlcancado, 0) / totalAlunos).toFixed(1) : "0";
  const aprovados = boletins.filter(b => b.nivelAlcancado > 0).length;
  const retidos = totalAlunos - aprovados;

  const dataStatus = [
    { name: 'Com Nível (>0)', value: aprovados },
    { name: 'Sem Nível (0)', value: retidos },
  ];

  const faixas = { 'Nível 0': 0, 'Nível 1': 0, 'Nível 2': 0, 'Nível 3+': 0 };
  boletins.forEach(b => {
    if (b.nivelAlcancado === 0) faixas['Nível 0']++;
    else if (b.nivelAlcancado === 1) faixas['Nível 1']++;
    else if (b.nivelAlcancado === 2) faixas['Nível 2']++;
    else faixas['Nível 3+']++;
  });

  const dataFaixas = Object.keys(faixas).map(key => ({ 
    name: key, 
    alunos: faixas[key as keyof typeof faixas] 
  }));

  const topAlunos = [...boletins].sort((a, b) => b.nivelAlcancado - a.nivelAlcancado).slice(0, 3);

  if (loadingFiltros) return <div className="flex h-screen items-center justify-center text-indigo-600 font-medium">Carregando sistema...</div>;

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-gray-50">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard Analítico</h1>
        <p className="text-gray-500">Indicadores baseados no Snapshot imutável da Turma.</p>
      </div>

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
                ) : (
                    <option value="">Nenhuma Turma Encontrada</option>
                )}
            </select>
        </div>
        
        <div className="flex-1 text-sm font-medium text-gray-700 bg-gray-100 p-2 rounded-lg border border-gray-300">
            Disciplina: <span className="font-bold text-indigo-700">{nomeDisciplinaAtual}</span>
            {estruturaSnapshotId && (
              <span className="text-[10px] bg-indigo-200 text-indigo-800 px-2 py-1 rounded ml-2">
                SNAPSHOT ACTIVE: #{estruturaSnapshotId}
              </span>
            )}
        </div>
      </div>

      {loadingDados ? (
        <div className="text-center py-20 text-gray-400">Processando indicadores de desempenho...</div>
      ) : totalAlunos === 0 ? (
        !estruturaSnapshotId ? (
              <div className="text-center py-20 bg-white rounded-xl border border-dashed border-red-300 text-red-500">
                <AlertTriangle size={32} className="mx-auto mb-2"/>
                <p>A Turma selecionada não possui uma estrutura de avaliação (Snapshot) gerada.</p>
                <p className="text-sm mt-2 text-red-400">Vá em "Gestão de Turmas" e crie o Snapshot para iniciar as avaliações.</p>
            </div>
        ) : (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
              Nenhum aluno ou avaliação encontrada para esta estrutura.
            </div>
        )
      ) : (
        <>
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase">Nível Médio</p>
                  <h3 className="text-3xl font-bold text-blue-800">{mediaGeral}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase">Alunos com Nível</p>
                  <h3 className="text-3xl font-bold text-emerald-600">{aprovados}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase">Sem Nível Alcançado</p>
                  <h3 className="text-3xl font-bold text-red-500">{retidos}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase">Total na Turma</p>
                  <h3 className="text-3xl font-bold text-indigo-600">{totalAlunos}</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Gráfico de Barras */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-700 mb-6 flex items-center gap-2">
                      <TrendingUp size={20} className="text-indigo-500"/> Distribuição de Alunos por Nível
                    </h3>
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

                {/* Gráfico de Rosca e Destaques */}
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