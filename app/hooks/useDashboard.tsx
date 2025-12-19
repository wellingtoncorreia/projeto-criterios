import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/app/services/api';
import Swal from 'sweetalert2';
import { Turma, Boletim, DashboardKPIs, ChartDataFaixa, ChartDataStatus } from '@/app/types';

export function useDashboard() {
  const router = useRouter();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [selectedTurmaId, setSelectedTurmaId] = useState<number | string>("");
  const [boletins, setBoletins] = useState<Boletim[]>([]);
  const [loadingDados, setLoadingDados] = useState(false);
  const [loadingFiltros, setLoadingFiltros] = useState(true);

  // Computed Values
  const selectedTurma = turmas.find(t => t.id === Number(selectedTurmaId));
  const estruturaSnapshotId = selectedTurma?.estruturaSnapshotId;
  const nomeDisciplinaAtual = selectedTurma?.nomeDisciplina || "...";

  // Helpers
  const getToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  // 1. Carregar Turmas
  useEffect(() => {
    const token = getToken();
    if (!token) {
        router.push('/login');
        return; 
    }
    
    api.get<Turma[]>('/turmas', { headers: { Authorization: `Bearer ${token}` } })
    .then(res => {
        setTurmas(res.data);
        if (res.data.length > 0) setSelectedTurmaId(res.data[0].id);
    }).catch(err => {
        console.error(err);
        if (err.response?.status === 401 || err.response?.status === 403) {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            router.push('/login');
        } else {
            Swal.fire('Erro', 'Não foi possível carregar a lista de turmas.', 'error'); 
        }
    }).finally(() => setLoadingFiltros(false));
  }, [router]);

  // 2. Carregar Boletins
  useEffect(() => {
    const token = getToken();
    if (!selectedTurmaId || !estruturaSnapshotId || !token) { 
        setBoletins([]);
        return;
    }
    setLoadingDados(true);
    
    api.get<Boletim[]>(`/avaliacoes/boletim/turma/${selectedTurmaId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { estruturaDisciplinaId: estruturaSnapshotId } 
    })
    .then(res => setBoletins(res.data))
    .catch(err => {
        console.error(err);
        setBoletins([]);
    })
    .finally(() => setLoadingDados(false));
  }, [selectedTurmaId, estruturaSnapshotId]);

  // 3. Cálculos (KPIs e Gráficos)
  const totalAlunos = boletins.length;
  const kpis: DashboardKPIs = {
    totalAlunos,
    mediaGeral: totalAlunos > 0 ? (boletins.reduce((acc, b) => acc + b.nivelAlcancado, 0) / totalAlunos).toFixed(1) : "0",
    aprovados: boletins.filter(b => b.nivelAlcancado > 0).length,
    retidos: totalAlunos - boletins.filter(b => b.nivelAlcancado > 0).length
  };

  const dataStatus: ChartDataStatus[] = [
    { name: 'Com Nível (>0)', value: kpis.aprovados },
    { name: 'Sem Nível (0)', value: kpis.retidos },
  ];

  const faixas = { 'Nível 0': 0, 'Nível 1': 0, 'Nível 2': 0, 'Nível 3+': 0 };
  boletins.forEach(b => {
    if (b.nivelAlcancado === 0) faixas['Nível 0']++;
    else if (b.nivelAlcancado === 1) faixas['Nível 1']++;
    else if (b.nivelAlcancado === 2) faixas['Nível 2']++;
    else faixas['Nível 3+']++;
  });

  const dataFaixas: ChartDataFaixa[] = Object.keys(faixas).map(key => ({ 
    name: key, 
    alunos: faixas[key as keyof typeof faixas] 
  }));

  const topAlunos = [...boletins].sort((a, b) => b.nivelAlcancado - a.nivelAlcancado).slice(0, 3);

  return {
    // State & Setters necessários
    turmas,
    selectedTurmaId,
    setSelectedTurmaId,
    loadingDados,
    loadingFiltros,
    // Computed Data
    nomeDisciplinaAtual,
    estruturaSnapshotId,
    totalAlunos,
    kpis,
    dataStatus,
    dataFaixas,
    topAlunos
  };
}