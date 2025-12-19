import { useState, useRef, useEffect } from 'react';
import api from '@/app/services/api';
import Swal from 'sweetalert2';
import { CapacidadeEdicaoDTO, TipoCriterio } from '@/app/types';

// Ajuste a URL base se necessário
const BASE_URL = 'http://localhost:8080/api';

export function useImportadorIterativo(disciplinaId: number, initialData: CapacidadeEdicaoDTO[] | null, onSuccess: () => void) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<CapacidadeEdicaoDTO[] | null>(initialData);
  const [step, setStep] = useState<'UPLOAD' | 'REVIEW'>(initialData ? 'REVIEW' : 'UPLOAD');
  const [loading, setLoading] = useState(false);
  const [expandedCaps, setExpandedCaps] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      if (!initialData) {
          setStep('UPLOAD'); setParsedData(null); setFile(null); setExpandedCaps(new Set());
      } else {
          setStep('REVIEW'); setParsedData(initialData); 
          setExpandedCaps(new Set(initialData.map((_, i) => i)));
      }
  }, [initialData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const processFile = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        // Usando fetch nativo para evitar erro de boundary no upload
        const response = await fetch(`${BASE_URL}/arquivos/importar-estrutura-completa?disciplinaId=${disciplinaId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (!response.ok) throw new Error(await response.text() || "Erro ao processar arquivo.");

        const data = await response.json();
        let rawList = data.capacidades || data;

        // --- AQUI ESTÁ A MUDANÇA ---
        // Processamos a lista para garantir IDs únicos e definir o padrão como DESEJÁVEL
        const listaProcessada = rawList.map((cap: any, capIdx: number) => ({
            ...cap,
            id: cap.id || `cap-${Date.now()}-${capIdx}`, // Garante ID temporário se não vier
            criterios: cap.criterios?.map((crit: any, critIdx: number) => ({
                ...crit,
                id: crit.id || `crit-${Date.now()}-${capIdx}-${critIdx}`,
                // REGRA DE NEGÓCIO: Se não vier tipo, assume DESEJAVEL (pois críticos são minoria)
                tipo: crit.tipo || 'DESEJAVEL' 
            })) || []
        }));

        setParsedData(listaProcessada);
        setStep('REVIEW');
        setExpandedCaps(new Set(listaProcessada.map((_: any, i: number) => i))); // Expande tudo para facilitar revisão

    } catch (err: any) {
        console.error(err);
        Swal.fire('Erro', err.message, 'error');
    } finally { setLoading(false); }
  };

  const handleSaveAll = async () => {
      if (!parsedData || parsedData.length === 0) return;
      
      // Validação: Verifica se existe pelo menos 1 crítico em cada capacidade
      // Se a regra for flexível, você pode remover este bloco
      const invalido = parsedData.find(c => !c.criterios.some(crit => crit.tipo === 'CRITICO'));
      if (invalido) {
          return Swal.fire('Atenção', `A capacidade "${invalido.descricao}" precisa de pelo menos um critério CRÍTICO.`, 'warning');
      }

      setLoading(true);
      try {
          await api.post(`/gestao/disciplinas/${disciplinaId}/importar-lote`, parsedData);
          await api.post(`/gestao/disciplinas/${disciplinaId}/gerar-niveis`);
          
          await Swal.fire('Sucesso!', 'Estrutura salva com sucesso.', 'success');
          onSuccess();
      } catch (err: any) {
          Swal.fire('Erro', 'Erro ao salvar estrutura.', 'error');
      } finally { setLoading(false); }
  };

  // --- Manipuladores Locais ---

  const updateCapacidade = (idx: number, field: string, val: string) => {
      if (!parsedData) return;
      const copy = [...parsedData];
      // @ts-ignore
      copy[idx] = { ...copy[idx], [field]: val };
      setParsedData(copy);
  };

  const removeCapacidade = (idx: number) => {
      if (!parsedData) return;
      const copy = [...parsedData];
      copy.splice(idx, 1);
      setParsedData(copy);
  };

  const updateCriterio = (capIdx: number, critIdx: number, field: string, val: string) => {
      if (!parsedData) return;
      const copy = [...parsedData];
      const criterios = [...copy[capIdx].criterios];
      // @ts-ignore
      criterios[critIdx] = { ...criterios[critIdx], [field]: val };
      copy[capIdx].criterios = criterios;
      setParsedData(copy);
  };

  const removeCriterio = (capIdx: number, critIdx: number) => {
      if (!parsedData) return;
      const copy = [...parsedData];
      copy[capIdx].criterios = copy[capIdx].criterios.filter((_, i) => i !== critIdx);
      setParsedData(copy);
  };

  const addCriterio = (capIdx: number) => {
      if (!parsedData) return;
      const copy = [...parsedData];
      const novoId = `temp-${Date.now()}`;
      // REGRA DE NEGÓCIO: Novo critério manual nasce como DESEJAVEL
      copy[capIdx].criterios.push({ id: novoId, descricao: '', tipo: 'DESEJAVEL' });
      setParsedData(copy);
  };

  const toggleExpanded = (idx: number) => {
      setExpandedCaps(prev => {
          const next = new Set(prev);
          if (next.has(idx)) next.delete(idx); else next.add(idx);
          return next;
      });
  };

  return {
    step, file, loading, parsedData, expandedCaps, fileInputRef,
    actions: { 
        setStep, handleFileChange, processFile, handleSaveAll, 
        updateCapacidade, removeCapacidade, 
        updateCriterio, removeCriterio, addCriterio, toggleExpanded 
    }
  };
}