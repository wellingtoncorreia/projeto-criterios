'use client';

import { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { Users, BookOpen, GraduationCap, TrendingUp, AlertTriangle, Filter, CheckCircle } from 'lucide-react';
import api from '@/app/services/api';
import Swal from 'sweetalert2'; // [NOVO]

// --- Tipagens ---
interface Turma { id: number; nome: string; anoSemestre: string; }
interface Disciplina { id: number; nome: string; }
interface Boletim { nomeAluno: string; nivelAlcancado: number; }

const COLORS_PIE = ['#10b981', '#ef4444']; 

export default function DashboardPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [selectedTurma, setSelectedTurma] = useState<number | string>("");
  const [selectedDisciplina, setSelectedDisciplina] = useState<number | string>("");
  const [boletins, setBoletins] = useState<Boletim[]>([]);
  const [loadingDados, setLoadingDados] = useState(false);
  const [loadingFiltros, setLoadingFiltros] = useState(true);

  const nomeTurmaAtual = turmas.find(t => t.id === Number(selectedTurma))?.nome || "Selecione...";
  const nomeDisciplinaAtual = disciplinas.find(d => d.id === Number(selectedDisciplina))?.nome || "...";

  useEffect(() => {
    api.get('/turmas').then(res => {
        setTurmas(res.data);
        if (res.data.length > 0) setSelectedTurma(res.data[0].id);
    }).catch(err => {
        console.error(err);
        Swal.fire('Erro', 'Não foi possível carregar as turmas.', 'error'); // [NOVO]
    }).finally(() => setLoadingFiltros(false));
  }, []);

  useEffect(() => {
    if (!selectedTurma) return;
    api.get(`/turmas/${selectedTurma}/disciplinas`)
        .then(res => {
            setDisciplinas(res.data);
            if (res.data.length > 0) {
                setSelectedDisciplina(res.data[0].id);
            } else {
                setSelectedDisciplina("");
                setBoletins([]);
            }
        })
        .catch(err => console.error(err));
  }, [selectedTurma]);

  useEffect(() => {
    if (!selectedTurma || !selectedDisciplina) return;

    setLoadingDados(true);
    api.get(`/avaliacoes/boletim/turma/${selectedTurma}`, {
        params: { disciplinaId: selectedDisciplina }
    })
    .then(res => setBoletins(res.data))
    .catch(err => {
        console.error(err);
        Swal.fire({
            icon: 'error',
            title: 'Erro ao carregar dados',
            text: 'Não foi possível buscar os dados do dashboard.',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
    })
    .finally(() => setLoadingDados(false));

  }, [selectedTurma, selectedDisciplina]);

  // Cálculos
  const totalAlunos = boletins.length;
  const mediaGeral = totalAlunos > 0 ? (boletins.reduce((acc, b) => acc + b.nivelAlcancado, 0) / totalAlunos).toFixed(1) : "0";
  const aprovados = boletins.filter(b => b.nivelAlcancado >= 50).length;
  const retidos = totalAlunos - aprovados;
  const taxaAprovacao = totalAlunos > 0 ? ((aprovados / totalAlunos) * 100).toFixed(1) : "0";

  const dataStatus = [
    { name: 'Aprovados (>=50)', value: aprovados },
    { name: 'Retidos (<50)', value: retidos },
  ];

  const faixas = { '0-30': 0, '35-45': 0, '50-75': 0, '80-100': 0 };
  boletins.forEach(b => {
    if (b.nivelAlcancado < 35) faixas['0-30']++;
    else if (b.nivelAlcancado < 50) faixas['35-45']++;
    else if (b.nivelAlcancado < 80) faixas['50-75']++;
    else faixas['80-100']++;
  });
  const dataFaixas = Object.keys(faixas).map(key => ({ name: key, alunos: faixas[key as keyof typeof faixas] }));
  const topAlunos = [...boletins].sort((a, b) => b.nivelAlcancado - a.nivelAlcancado).slice(0, 3);

  if (loadingFiltros) return <div className="flex h-screen items-center justify-center text-indigo-600 font-medium">Carregando sistema...</div>;

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-gray-50">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard Analítico</h1>
        <p className="text-gray-500">Acompanhamento detalhado por Turma e Disciplina.</p>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center gap-2 text-indigo-600 font-semibold px-2 border-r pr-4 border-gray-200"><Filter size={20} /> Filtros:</div>
        <div className="flex-1">
            <select className="w-full p-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg" value={selectedTurma} onChange={(e) => setSelectedTurma(e.target.value)}>
                {turmas.map(t => <option key={t.id} value={t.id}>{t.nome} ({t.anoSemestre})</option>)}
            </select>
        </div>
        <div className="flex-1">
            <select className="w-full p-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg" value={selectedDisciplina} onChange={(e) => setSelectedDisciplina(e.target.value)} disabled={!selectedTurma}>
                {disciplinas.length === 0 && <option>Nenhuma disciplina para este termo</option>}
                {disciplinas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
            </select>
        </div>
      </div>

      {/* KPIs & Gráficos */}
      {loadingDados ? (
        <div className="text-center py-20 text-gray-400">Carregando dados...</div>
      ) : totalAlunos === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">Nenhum dado encontrado.</div>
      ) : (
        <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"><p className="text-xs font-bold text-gray-400">Média Geral</p><h3 className="text-3xl font-bold text-blue-800">{mediaGeral}</h3></div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"><p className="text-xs font-bold text-gray-400">Aprovados</p><h3 className="text-3xl font-bold text-emerald-600">{aprovados}</h3></div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"><p className="text-xs font-bold text-gray-400">Retidos</p><h3 className="text-3xl font-bold text-red-500">{retidos}</h3></div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"><p className="text-xs font-bold text-gray-400">Total Alunos</p><h3 className="text-3xl font-bold text-indigo-600">{totalAlunos}</h3></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-700 mb-6 flex items-center gap-2"><TrendingUp size={20} className="text-indigo-500"/> Distribuição por Nível</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dataFaixas}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{fontSize: 12}} />
                                <YAxis />
                                <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '8px'}}/>
                                <Bar dataKey="alunos" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                    <h3 className="font-bold text-gray-700 mb-2">Status</h3>
                    <div className="h-[200px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={dataStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                                    {dataStatus.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS_PIE[index]} />))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex-1">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-3">Destaques</p>
                        <div className="space-y-3">
                            {topAlunos.map((aluno, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <span className="text-gray-700 truncate max-w-[150px]">{aluno.nomeAluno}</span>
                                    <span className="font-bold text-indigo-600">{aluno.nivelAlcancado}</span>
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