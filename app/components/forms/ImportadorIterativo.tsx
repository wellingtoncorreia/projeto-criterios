'use client';

import { useState } from 'react';
import { UploadCloud, X, Trash2, Plus, Save, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import api from '@/app/services/api';
import Swal from 'sweetalert2'; // [NOVO]
import { TipoCapacidade, TipoCriterio } from '@/app/types';

interface CriterioTemp { id: string; descricao: string; tipo: TipoCriterio; }
interface CapacidadeTemp { id: string; descricao: string; tipo: TipoCapacidade; criterios: CriterioTemp[]; }
interface Props { disciplinaId: number; onSuccess: () => void; onClose: () => void; }

export default function ImportadorInterativo({ disciplinaId, onSuccess, onClose }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [dados, setDados] = useState<CapacidadeTemp[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedCaps, setExpandedCaps] = useState<Set<string>>(new Set());

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => { parseCSV(evt.target?.result as string); };
    reader.readAsText(file);
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.split(/\r?\n/);
    const novasCapacidades: CapacidadeTemp[] = [];
    let ultimaCap: CapacidadeTemp | null = null;

    lines.forEach((line, index) => {
      if (!line.trim()) return;
      
      // Parse CSV corretamente: divide por vírgula ignorando vírgulas dentro de aspas
      const parts = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
      
      const col1 = parts[0]?.replace(/^"|"$/g, '').trim() || ''; 
      const col2 = parts[1]?.replace(/^"|"$/g, '').trim() || ''; 

      // Caso 1: Ambas colunas preenchidas = Nova Capacidade + Critério
      if (col1 && col2) {
        const isSocio = col1.toLowerCase().includes('demonstrar') || 
                       col1.toLowerCase().includes('socio') || 
                       col1.toLowerCase().includes('comport') ||
                       col1.toLowerCase().includes('atitude') ||
                       col1.toLowerCase().includes('autonomia') ||
                       col1.toLowerCase().includes('resiliência') ||
                       col1.toLowerCase().includes('equipe') ||
                       col1.toLowerCase().includes('criatividade') ||
                       col1.toLowerCase().includes('pensamento');
        ultimaCap = {
          id: `cap-${index}`,
          descricao: col1,
          tipo: isSocio ? 'SOCIOEMOCIONAL' : 'TECNICA',
          criterios: []
        };
        novasCapacidades.push(ultimaCap);
        
        ultimaCap.criterios.push({
          id: `crit-${index}`,
          descricao: col2,
          tipo: 'CRITICO'
        });
      }
      // Caso 2: Apenas primeira coluna = Nova Capacidade sem critérios
      else if (col1 && !col2) {
        const isSocio = col1.toLowerCase().includes('demonstrar') || 
                       col1.toLowerCase().includes('socio') || 
                       col1.toLowerCase().includes('comport') ||
                       col1.toLowerCase().includes('atitude') ||
                       col1.toLowerCase().includes('autonomia') ||
                       col1.toLowerCase().includes('resiliência') ||
                       col1.toLowerCase().includes('equipe') ||
                       col1.toLowerCase().includes('criatividade') ||
                       col1.toLowerCase().includes('pensamento');
        ultimaCap = {
          id: `cap-${index}`,
          descricao: col1,
          tipo: isSocio ? 'SOCIOEMOCIONAL' : 'TECNICA',
          criterios: []
        };
        novasCapacidades.push(ultimaCap);
      }
      // Caso 3: Apenas segunda coluna = Critério da última capacidade
      else if (!col1 && col2 && ultimaCap) {
        ultimaCap.criterios.push({
          id: `crit-${index}`,
          descricao: col2,
          tipo: 'CRITICO'
        });
      }
    });
    setDados(novasCapacidades);
    setStep(2);
  };

  const salvarTudo = async () => {
    if (dados.length === 0) return;
    setLoading(true);
    const payload = dados.map(d => ({
        descricao: d.descricao,
        tipo: d.tipo,
        criterios: d.criterios.map(c => ({ descricao: c.descricao, tipo: c.tipo }))
    }));

    try {
      await api.post(`/gestao/disciplinas/${disciplinaId}/importar-lote`, payload);
      Swal.fire('Sucesso!', 'Dados importados corretamente.', 'success');
      onSuccess();
    } catch (error) {
      console.error(error);
      Swal.fire('Erro', 'Falha ao salvar importação.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateCapacidade = (id: string, field: 'descricao' | 'tipo', value: string) => {
    setDados(prev => prev.map(cap => cap.id === id ? { ...cap, [field]: value } : cap));
  };

  const removeCapacidade = (id: string) => {
    Swal.fire({
        title: 'Remover Capacidade?',
        text: "Isso removerá a capacidade e todos os seus critérios da lista de importação.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sim, remover'
    }).then((result) => {
        if(result.isConfirmed) {
            setDados(prev => prev.filter(cap => cap.id !== id));
        }
    });
  };

  const updateCriterio = (capId: string, critId: string, field: 'descricao' | 'tipo', value: string) => {
    setDados(prev => prev.map(cap => 
      cap.id === capId 
        ? { ...cap, criterios: cap.criterios.map(crit => crit.id === critId ? { ...crit, [field]: value } : crit) }
        : cap
    ));
  };

  const removeCriterio = (capId: string, critId: string) => {
    setDados(prev => prev.map(cap => 
      cap.id === capId 
        ? { ...cap, criterios: cap.criterios.filter(crit => crit.id !== critId) }
        : cap
    ));
  };

  const addCriterio = (capId: string) => {
    const novoId = `crit-${Date.now()}`;
    setDados(prev => prev.map(cap => 
      cap.id === capId 
        ? { ...cap, criterios: [...cap.criterios, { id: novoId, descricao: '', tipo: 'CRITICO' }] }
        : cap
    ));
  };

  const toggleExpanded = (capId: string) => {
    const newExpanded = new Set(expandedCaps);
    if (newExpanded.has(capId)) {
      newExpanded.delete(capId);
    } else {
      newExpanded.add(capId);
    }
    setExpandedCaps(newExpanded);
  };

  if (step === 1) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg border-2 border-dashed border-blue-300 text-center w-full max-w-md">
            <UploadCloud size={48} className="mx-auto text-blue-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Importar Planilha</h2>
            <p className="text-gray-500 mb-6 text-sm">Selecione o arquivo CSV.</p>
            <label className="bg-blue-600 text-white px-6 py-3 rounded-md cursor-pointer hover:bg-blue-700 transition block">
            Selecionar Arquivo
            <input type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
            </label>
            <button onClick={onClose} className="mt-4 text-gray-400 hover:text-gray-600 text-sm">Cancelar</button>
        </div>
      </div>
    );
  }

  // Renderização da tabela (passo 2) - Mantida a estrutura, apenas envolta no return
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="bg-gray-100 p-4 border-b flex justify-between items-center">
          <div><h2 className="font-bold text-lg text-gray-800">Revisar Importação</h2><p className="text-xs text-gray-500">{dados.length} capacidades</p></div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded">Cancelar</button>
            <button onClick={salvarTudo} disabled={loading} className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 flex items-center gap-2">
                {loading ? 'Salvando...' : <><Save size={18}/> Salvar</>}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-4">
          {dados.map((cap) => {
            const isExpanded = expandedCaps.has(cap.id);
            return (
              <div key={cap.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                {/* Header */}
                <div className={`p-4 border-b flex gap-3 items-center cursor-pointer hover:bg-gray-50 ${cap.tipo === 'SOCIOEMOCIONAL' ? 'bg-orange-50' : 'bg-indigo-50'}`} onClick={() => toggleExpanded(cap.id)}>
                  <button className="text-gray-400 hover:text-gray-600">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  <div className="flex-1">
                    <input 
                      value={cap.descricao} 
                      onChange={(e) => updateCapacidade(cap.id, 'descricao', e.target.value)} 
                      onClick={e => e.stopPropagation()}
                      className="w-full font-bold text-gray-800 bg-transparent border-b border-transparent focus:border-gray-300 focus:outline-none"
                    />
                  </div>
                  <select 
                    value={cap.tipo} 
                    onChange={(e) => updateCapacidade(cap.id, 'tipo', e.target.value as any)}
                    onClick={e => e.stopPropagation()}
                    className={`text-xs px-2 py-1 rounded border ${cap.tipo === 'SOCIOEMOCIONAL' ? 'bg-orange-100 border-orange-300 text-orange-700' : 'bg-indigo-100 border-indigo-300 text-indigo-700'}`}
                  >
                    <option value="TECNICA">TÉCNICA</option>
                    <option value="SOCIOEMOCIONAL">SOCIOEMOCIONAL</option>
                  </select>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeCapacidade(cap.id); }} 
                    className="text-red-400 hover:text-red-600 p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Critérios - Expandido */}
                {isExpanded && (
                  <div className="p-4 bg-white">
                    <h4 className="text-sm font-bold text-gray-600 mb-3 flex items-center gap-2">
                      <Edit2 size={16} /> Critérios de Avaliação ({cap.criterios.length})
                    </h4>

                    <div className="space-y-2 mb-3">
                      {cap.criterios.length > 0 ? (
                        cap.criterios.map((crit, idx) => (
                          <div key={crit.id} className="flex gap-2 items-start bg-gray-50 p-2 rounded border border-gray-200">
                            <span className="text-xs text-gray-400 pt-2 min-w-5">{idx + 1}.</span>
                            <input 
                              value={crit.descricao}
                              onChange={(e) => updateCriterio(cap.id, crit.id, 'descricao', e.target.value)}
                              placeholder="Descrição do critério..."
                              className="flex-1 text-sm p-2 border rounded bg-white focus:ring-1 focus:ring-blue-300 outline-none"
                            />
                            <select 
                              value={crit.tipo}
                              onChange={(e) => updateCriterio(cap.id, crit.id, 'tipo', e.target.value as any)}
                              className="text-xs p-1 rounded border border-gray-300 bg-white"
                            >
                              <option value="CRITICO">Crítico</option>
                              <option value="DESEJAVEL">Desejável</option>
                            </select>
                            <button 
                              onClick={() => removeCriterio(cap.id, crit.id)}
                              className="text-red-400 hover:text-red-600 p-2"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400 italic py-2">Nenhum critério ainda.</p>
                      )}
                    </div>

                    <button 
                      onClick={() => addCriterio(cap.id)}
                      className="text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1 rounded flex items-center gap-1 transition border border-blue-200"
                    >
                      <Plus size={14} /> Adicionar Critério
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}