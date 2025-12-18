'use client';

import { useState, useEffect } from 'react';
import { Plus, ChevronDown, ChevronUp, Edit, Trash2, Loader2, AlertTriangle, UserCheck } from 'lucide-react';
import { Capacidade, Criterio, TipoCapacidade, TipoCriterio } from '@/app/types';
import apiService from '@/app/services/api'; // [CORRIGIDO] Renomeado de 'api' para 'apiService' para evitar duplicidade.
import Swal from 'sweetalert2';

interface Props {
  disciplinaId: number;
  capacidadesIniciais: Capacidade[];
  onEstruturaChange: () => void; // Callback para recarregar dados do pai
}

// Interface auxiliar para novos critérios
interface NovoCriterio {
    id: string; // ID temporário
    descricao: string;
    tipo: TipoCriterio;
    capacidadeId: number;
}

export default function GerenciadorCapacidades({ disciplinaId, capacidadesIniciais, onEstruturaChange }: Props) {
  
  // O estado interno armazena as capacidades e seus critérios.
  const [capacidades, setCapacidades] = useState<Capacidade[]>(capacidadesIniciais);
  const [expandedCapacities, setExpandedCapacities] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [novoCrit, setNovoCrit] = useState<NovoCriterio | null>(null);

  // Sincroniza o estado interno com o prop 'capacidadesIniciais'
  useEffect(() => {
    setCapacidades(capacidadesIniciais);
  }, [capacidadesIniciais]);
  
  // --- Funções de Ação ---

  const toggleExpand = (id: number) => {
    setExpandedCapacities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleCreateCriterio = async (capacidadeId: number) => {
    if (!novoCrit || novoCrit.descricao.trim() === "") {
        Swal.fire('Atenção', 'A descrição do critério não pode ser vazia.', 'warning');
        return;
    }
    
    setLoading(true);
    try {
        const payload = {
            capacidadeId: capacidadeId,
            descricao: novoCrit.descricao,
            tipo: novoCrit.tipo,
        };

        // [CORRIGIDO] Removido o prefixo '/api' duplicado e usando apiService
        await apiService.post('/gestao/criterios', payload);
        
        Swal.fire('Sucesso!', 'Critério adicionado.', 'success');
        
        setNovoCrit(null); // Limpa o formulário de novo critério
        onEstruturaChange(); // Força a recarga completa para atualizar a lista
        
    } catch (error: any) {
        Swal.fire('Erro', error.response?.data || 'Falha ao adicionar critério.', 'error');
    } finally {
        setLoading(false);
    }
  };
  
  const handleDeleteCriterio = async (critId: number, critDesc: string) => {
    const result = await Swal.fire({
      title: 'Excluir Critério?',
      text: `Tem certeza que deseja excluir o critério: "${critDesc}"? Avaliações vinculadas a ele serão perdidas.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, excluir'
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        await apiService.delete(`/criterios/${critId}`); // [CORRIGIDO] Usando apiService
        Swal.fire('Excluído!', 'Critério removido com sucesso.', 'success');
        onEstruturaChange(); // Força a recarga completa para atualizar a lista
      } catch (error) {
        Swal.fire('Erro', 'Não foi possível excluir o critério.', 'error');
      } finally {
        setLoading(false);
      }
    }
  };
  
  const handleToggleNovoCrit = (capId: number | null, tipoInicial: TipoCriterio = 'CRITICO') => {
    if (capId === null) {
        setNovoCrit(null);
    } else {
        setNovoCrit({ id: `new-${Date.now()}`, descricao: '', tipo: tipoInicial, capacidadeId: capId });
    }
  };

  // --- Renderização ---

  if (capacidades.length === 0) {
    return (
        <div className="p-12 text-center bg-gray-50 rounded-lg border border-dashed text-gray-500">
            <AlertTriangle size={32} className="mx-auto mb-2"/>
            <p>Nenhuma Capacidade cadastrada. Importe uma planilha ou adicione manualmente.</p>
        </div>
    );
  }

  return (
    <div className="space-y-4 mt-6">
      <h2 className="text-2xl font-bold text-gray-700">Estrutura de Avaliação (Template)</h2>
      <p className="text-gray-500 text-sm mb-4">Esta estrutura é o **Template** que será copiado para turmas novas.</p>

      {capacidades.map(cap => (
        <div key={cap.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
          {/* Cabeçalho da Capacidade */}
          <div 
            className={`p-4 flex justify-between items-center cursor-pointer ${cap.tipo === 'SOCIOEMOCIONAL' ? 'bg-orange-50 hover:bg-orange-100' : 'bg-indigo-50 hover:bg-indigo-100'}`}
            onClick={() => toggleExpand(cap.id)}
          >
            <div className="flex items-center gap-3">
              <span className="text-gray-600">
                {expandedCapacities.has(cap.id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </span>
              <h3 className="font-bold text-gray-800">
                {cap.descricao}
              </h3>
            </div>
            
            <div className="flex items-center gap-3">
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${cap.tipo === 'SOCIOEMOCIONAL' ? 'bg-orange-200 text-orange-800' : 'bg-indigo-200 text-indigo-800'}`}>
                    {cap.tipo}
                </span>
                <button 
                    onClick={(e) => { e.stopPropagation(); handleToggleNovoCrit(cap.id); }} 
                    className="p-1 bg-white rounded-full text-blue-600 hover:text-blue-800"
                    title="Adicionar Critério"
                >
                    <Plus size={18} />
                </button>
            </div>
          </div>
          
          {/* Conteúdo (Critérios) */}
          {expandedCapacities.has(cap.id) && (
            <div className="p-4 border-t bg-gray-50 space-y-3">
              <h4 className="text-sm font-bold text-gray-700 mb-3">Critérios Vinculados ({cap.criterios?.length || 0})</h4>
              
              {/* Lista de Critérios */}
              {cap.criterios?.length ? (
                cap.criterios.map(crit => (
                  <div key={crit.id} className="flex justify-between items-center p-3 border rounded bg-white shadow-sm hover:border-blue-300">
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">{crit.descricao}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${crit.tipo === 'CRITICO' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        {crit.tipo}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleDeleteCriterio(crit.id, crit.descricao)}
                      className="text-red-500 hover:text-red-700 p-1 ml-4"
                      disabled={loading}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">Nenhum critério cadastrado para esta capacidade.</p>
              )}

              {/* Formulário Novo Critério */}
              {novoCrit?.capacidadeId === cap.id && (
                  <div className="mt-4 p-4 border-t border-gray-200 bg-white rounded-lg shadow-inner flex flex-col gap-2">
                      <h5 className="font-semibold text-gray-700">Novo Critério Manual</h5>
                      <input
                          type="text"
                          value={novoCrit.descricao}
                          onChange={e => setNovoCrit({...novoCrit, descricao: e.target.value})}
                          placeholder="Descrição do novo critério..."
                          className="w-full p-2 border rounded text-sm"
                          disabled={loading}
                      />
                      <div className="flex justify-between items-center">
                          <select
                              value={novoCrit.tipo}
                              onChange={e => setNovoCrit({...novoCrit, tipo: e.target.value as TipoCriterio})}
                              className="p-2 border rounded text-sm"
                              disabled={loading}
                          >
                              <option value="CRITICO">CRÍTICO</option>
                              <option value="DESEJAVEL">DESEJÁVEL</option>
                          </select>
                          <div className="flex gap-2">
                            <button 
                                type="button"
                                onClick={() => handleToggleNovoCrit(null)}
                                className="text-gray-500 hover:text-gray-700 text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={() => handleCreateCriterio(cap.id)}
                                disabled={loading || novoCrit.descricao.trim() === ""}
                                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading ? <Loader2 size={16} className="animate-spin"/> : <Plus size={16}/>} Adicionar
                            </button>
                          </div>
                      </div>
                  </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}