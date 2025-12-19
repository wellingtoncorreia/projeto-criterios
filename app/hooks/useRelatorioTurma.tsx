import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/app/services/api";
import { Turma, Disciplina, BoletimRelatorio, NivelRegra, DisciplinaComSnapshot } from "@/app/types";

export function useRelatorioTurma(turmaId: string) {
  const searchParams = useSearchParams();
  const origem = searchParams.get('origem');
  const initialEstId = searchParams.get('estruturaId');

  const [turma, setTurma] = useState<Turma | null>(null);
  const [disciplinas, setDisciplinas] = useState<DisciplinaComSnapshot[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(initialEstId);
  const [boletins, setBoletins] = useState<BoletimRelatorio[]>([]);
  const [niveisRegra, setNiveisRegra] = useState<NivelRegra[]>([]);
  const [loadingDados, setLoadingDados] = useState(true);
  const [loadingRelatorio, setLoadingRelatorio] = useState(false);

  const carregarContexto = useCallback(async () => {
    setLoadingDados(true);
    try {
      const [resTurma, resDiscs] = await Promise.all([
        api.get<Turma>(`/turmas/${turmaId}`),
        api.get<Disciplina[]>(`/turmas/${turmaId}/disciplinas`)
      ]);
      setTurma(resTurma.data);

      const resolved = await Promise.all(resDiscs.data.map(async (d) => {
        let snapId = (d.id === resTurma.data.disciplinaId && resTurma.data.estruturaSnapshotId) 
            ? resTurma.data.estruturaSnapshotId 
            : null;
        if (!snapId) {
            try { const r = await api.get<number>(`/disciplinas/${d.id}/snapshot-status`); snapId = r.data; } catch {}
        }
        return { ...d, isPrincipal: d.id === resTurma.data.disciplinaId, snapshotId: snapId } as DisciplinaComSnapshot;
      }));
      setDisciplinas(resolved);

      if (!selectedSnapshotId) {
        const def = resolved.find(d => d.isPrincipal && d.snapshotId) || resolved.find(d => d.snapshotId);
        if (def) setSelectedSnapshotId(def.snapshotId!.toString());
      }
    } catch (err) { console.error(err); } 
    finally { setLoadingDados(false); }
  }, [turmaId, selectedSnapshotId]);

  useEffect(() => { carregarContexto(); }, [carregarContexto]);

  useEffect(() => {
    if (!selectedSnapshotId) { setBoletins([]); return; }
    setLoadingRelatorio(true);
    
    // Atualiza URL sem reload
    const params = new URLSearchParams();
    params.set('estruturaId', selectedSnapshotId);
    if (origem) params.set('origem', origem);
    window.history.replaceState(null, '', `/gestao/turmas/${turmaId}/relatorio?${params.toString()}`);

    Promise.all([
      api.get<BoletimRelatorio[]>(`/avaliacoes/boletim/turma/${turmaId}`, { params: { estruturaDisciplinaId: selectedSnapshotId } }),
      api.get<NivelRegra[]>(`/disciplinas/niveis/snapshot/${selectedSnapshotId}`)
    ]).then(([resBol, resNiveis]) => {
        setBoletins((resBol.data || []).sort((a, b) => a.nomeAluno.localeCompare(b.nomeAluno)));
        setNiveisRegra(resNiveis.data || []);
    }).finally(() => setLoadingRelatorio(false));
  }, [turmaId, selectedSnapshotId, origem]);

  return { 
    turma, disciplines: disciplinas, boletins, niveisRegra, 
    loadingDados, loadingRelatorio, 
    selectedSnapshotId, setSelectedSnapshotId,
    origem, disciplinaAtiva: disciplinas.find(d => d.snapshotId?.toString() === selectedSnapshotId)
  };
}