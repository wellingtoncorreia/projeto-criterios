'use client';

import { useState, useEffect } from 'react';
import { UploadCloud, X, Trash2, Plus, Save, Edit2, ChevronDown, ChevronUp, FileSpreadsheet, AlertTriangle, Loader2 } from 'lucide-react';
import api from '@/app/services/api';
import Swal from 'sweetalert2'; 
import { TipoCapacidade, TipoCriterio } from '@/app/types';

// Tipos adaptados do EstruturaImportacaoDTO.java
interface CritItemDTO { descricao: string; tipo: TipoCriterio; id: string; }
interface CapItemDTO { descricao: string; tipo: TipoCapacidade; criterios: CritItemDTO[]; id: string; }
interface EstruturaImportacaoDTO { nomeDisciplina: string; disciplinaId: number; capacidades: CapItemDTO[]; }

interface Props { 
    disciplinaId: number; 
    nomeDisciplina: string;
    initialData: CapItemDTO[] | null; // Novo: Dados iniciais para edição
    onSuccess: () => void; 
    onClose: () => void; 
}

export default function ImportadorIterativo({ disciplinaId, nomeDisciplina, initialData, onSuccess, onClose }: Props) {
  
  // Determina o passo inicial: 1 (Upload) se não houver dados, 2 (Revisão) se houver dados iniciais.
  const [step, setStep] = useState<1 | 2>(initialData ? 2 : 1);
  
  // Se houver dados iniciais, usa-os; caso contrário, array vazio.
  const [dados, setDados] = useState<CapItemDTO[]>(initialData || []);
  
  const [loading, setLoading] = useState(false);
  const [expandedCaps, setExpandedCaps] = useState<Set<string>>(new Set());
  
  // Efeito para expandir todas as capacidades quando os dados iniciais são carregados
  useEffect(() => {
    if (initialData && initialData.length > 0) {
        setExpandedCaps(new Set(initialData.map(c => c.id)));
    }
  }, [initialData]);
  

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    
    // 1. Enviar o arquivo para o backend para pré-processamento (funciona para CSV e XLSX)
    const formData = new FormData();
    formData.append('file', file);
    formData.append('disciplinaId', disciplinaId.toString());

    api.post<EstruturaImportacaoDTO>('/arquivos/importar-estrutura-completa', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => {
        // 2. Receber o JSON pré-processado e prepará-lo para a edição
        const dadosComIds = res.data.capacidades.map((cap, capIndex) => ({
            ...cap,
            // Adiciona ID temporário para o React controlar a edição
            id: `cap-${capIndex}-${Date.now()}`,
            criterios: cap.criterios.map((crit, critIndex) => ({
                ...crit,
                // Garantir que todos tenham ID e tipo correto (CRITICO é o default do backend)
                id: `crit-${capIndex}-${critIndex}-${Date.now()}`,
                tipo: crit.tipo || 'CRITICO' as TipoCriterio
            }))
        }));

        if (dadosComIds.length === 0) {
            Swal.fire('Atenção', 'O arquivo não contém dados válidos de Capacidades/Critérios.', 'warning');
            setLoading(false);
            return;
        }

        // Sobrescreve os dados para o modo de revisão
        setDados(dadosComIds);
        setExpandedCaps(new Set(dadosComIds.map(c => c.id)));
        setStep(2); // Vai para o passo de revisão/edição

    }).catch((error: any) => {
        const msg = error.response?.data || 'Erro ao processar o arquivo. Verifique o console.';
        Swal.fire('Erro', typeof msg === 'string' ? msg : 'Erro ao processar o arquivo.', 'error');
        console.error(error);
    }).finally(() => {
        setLoading(false);
    });
  };


  const salvarTudo = async () => {
    if (dados.length === 0) return;
    setLoading(true);

    // Validação de Critérios Críticos Mínimos (Regra de Negócio)
    const capSemCritico = dados.find(cap => cap.criterios.length === 0 || !cap.criterios.some(crit => crit.tipo === 'CRITICO'));
    if (capSemCritico) {
        Swal.fire('Atenção', `A capacidade "${capSemCritico.descricao}" precisa de pelo menos um critério CRÍTICO para ser considerada completa.`, 'warning');
        setLoading(false);
        return;
    }

    // 3. Mapear o DTO de volta para o formato de importação (CapacidadeImportDTO)
    // OBS: No modo edição, estamos enviando a estrutura COMPLETA, o backend 
    // fará a re-inserção de todos os itens.
    const payload = dados.map(d => ({
        descricao: d.descricao,
        tipo: d.tipo,
        criterios: d.criterios.map(c => ({ descricao: c.descricao, tipo: c.tipo }))
    }));

    try {
      // Endpoint de salvamento em lote no GestaoController (Recebe List<CapacidadeImportDTO>)
      await api.post(`/gestao/disciplinas/${disciplinaId}/importar-lote`, payload);
      
      // 4. Gerar Níveis Automáticos (CRUCIAL após qualquer alteração estrutural)
      try {
        await api.post(`/gestao/disciplinas/${disciplinaId}/gerar-niveis`);
      } catch (err) {
        console.error("Aviso: Falha ao gerar níveis automáticos após importação/edição.", err);
      }
      
      Swal.fire('Sucesso!', 'Estrutura atualizada e Níveis recalculados corretamente.', 'success');
      onSuccess();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data || 'Falha ao salvar importação/edição.';
      Swal.fire('Erro', typeof msg === 'string' ? msg : 'Erro ao salvar estrutura.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- Funções de Edição Direta no Estado ---
  const updateCapacidade = (id: string, field: 'descricao' | 'tipo', value: string) => {
    setDados(prev => prev.map(cap => cap.id === id ? { ...cap, [field]: value as TipoCapacidade } : cap));
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
        ? { ...cap, criterios: cap.criterios.map(crit => crit.id === critId ? { ...crit, [field]: value as TipoCriterio } : crit) }
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
  
  // --- Passo 1: Seleção de Arquivo ---
  if (step === 1) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg border-2 border-dashed border-blue-300 text-center w-full max-w-md">
            <FileSpreadsheet size={48} className="mx-auto text-blue-600 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Importar Estrutura</h2>
            <p className="text-gray-500 mb-6 text-sm">Selecione o arquivo CSV, TXT ou Excel (XLSX). A estrutura será processada no servidor e exibida para revisão.</p>
            <label className="bg-blue-600 text-white px-6 py-3 rounded-md cursor-pointer hover:bg-blue-700 transition block">
            <UploadCloud size={20} className="inline mr-2"/> Selecionar Arquivo
            <input 
                type="file" 
                accept=".csv, .txt, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                className="hidden" 
                onChange={handleFile}
                disabled={loading}
            />
            </label>
            <button onClick={onClose} className="mt-4 text-gray-400 hover:text-gray-600 text-sm" disabled={loading}>Cancelar</button>
            
            {loading && (
                <div className="mt-4 p-3 bg-indigo-50 text-indigo-700 rounded text-sm flex items-center justify-center gap-2 font-medium">
                    <Loader2 size={16} className="animate-spin" /> Processando arquivo no servidor...
                </div>
            )}
        </div>
      </div>
    );
  }
  
  // --- Passo 2: Revisão e Edição ---
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="bg-gray-100 p-4 border-b flex justify-between items-center">
          <div>
            <h2 className="font-bold text-lg text-gray-800">Revisar e Editar (Disciplina: {nomeDisciplina})</h2>
            <p className="text-xs text-gray-500">{dados.length} capacidades encontradas. Edite antes de salvar.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded">Cancelar</button>
            <button onClick={salvarTudo} disabled={loading || dados.length === 0} className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 flex items-center gap-2 disabled:opacity-50">
                {loading ? <><Loader2 size={18} className="animate-spin"/> Salvando...</> : <><Save size={18}/> Salvar {dados.length} Itens</>}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-4">
          
          {dados.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                <AlertTriangle size={32} className="text-yellow-500 mx-auto mb-2"/>
                <p className="text-gray-500">Nenhuma estrutura para salvar. Selecione um arquivo válido no passo anterior.</p>
            </div>
          )}
          
          {dados.map((cap) => {
            const isExpanded = expandedCaps.has(cap.id);
            const temCritico = cap.criterios.some(crit => crit.tipo === 'CRITICO');
            
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
                    {!temCritico && <p className="text-red-500 text-xs mt-1 font-medium flex items-center gap-1">
                        <AlertTriangle size={14}/> Falta Critério CRÍTICO
                    </p>}
                  </div>
                  <select 
                    value={cap.tipo} 
                    onChange={(e) => updateCapacidade(cap.id, 'tipo', e.target.value)}
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
                          <div key={crit.id} className="flex gap-2 items-center bg-gray-50 p-2 rounded border border-gray-200">
                            <span className="text-xs text-gray-400 min-w-5">{idx + 1}.</span>
                            <input 
                              value={crit.descricao}
                              onChange={(e) => updateCriterio(cap.id, crit.id, 'descricao', e.target.value)}
                              placeholder="Descrição do critério..."
                              className="flex-1 text-sm p-2 border rounded bg-white focus:ring-1 focus:ring-blue-300 outline-none"
                            />
                            <select 
                              value={crit.tipo}
                              onChange={(e) => updateCriterio(cap.id, crit.id, 'tipo', e.target.value)}
                              className={`text-xs p-1 rounded border ${crit.tipo === 'CRITICO' ? 'text-red-700 bg-red-100 border-red-300' : 'text-blue-700 bg-blue-100 border-blue-300'}`}
                            >
                              <option value="CRITICO">CRÍTICO</option>
                              <option value="DESEJAVEL">DESEJÁVEL</option>
                            </select>
                            <button 
                              onClick={() => removeCriterio(cap.id, crit.id)}
                              className="text-red-400 hover:text-red-600 p-2"
                              title="Remover critério"
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
                      <Plus size={14} /> Adicionar Critério Manualmente
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