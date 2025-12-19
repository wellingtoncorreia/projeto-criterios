'use client';
import { Plus, ChevronDown, ChevronUp, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { useGerenciadorCapacidades } from '@/app/hooks/useGerenciadorCapacidades';
import { Capacidade } from '@/app/types';

interface Props { disciplinaId: number; capacidadesIniciais: Capacidade[]; onEstruturaChange: () => void; }

export default function GerenciadorCapacidades({ capacidadesIniciais, onEstruturaChange }: Props) {
  const { capacidades, expandedCapacities, loading, novoCrit, actions } = useGerenciadorCapacidades(capacidadesIniciais, onEstruturaChange);

  if (capacidades.length === 0) return (<div className="p-12 text-center bg-gray-50 rounded-lg border border-dashed text-gray-500"><AlertTriangle size={32} className="mx-auto mb-2"/><p>Nenhuma Capacidade cadastrada.</p></div>);

  return (
    <div className="space-y-4 mt-6">
      <h2 className="text-2xl font-bold text-gray-700">Estrutura de Avaliação (Template)</h2>
      {capacidades.map(cap => (
        <div key={cap.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className={`p-4 flex justify-between items-center cursor-pointer ${cap.tipo === 'SOCIOEMOCIONAL' ? 'bg-orange-50 hover:bg-orange-100' : 'bg-indigo-50 hover:bg-indigo-100'}`} onClick={() => actions.toggleExpand(cap.id)}>
            <div className="flex items-center gap-3"><span className="text-gray-600">{expandedCapacities.has(cap.id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</span><h3 className="font-bold text-gray-800">{cap.descricao}</h3></div>
            <div className="flex items-center gap-3"><span className={`px-3 py-1 text-xs font-bold rounded-full ${cap.tipo === 'SOCIOEMOCIONAL' ? 'bg-orange-200 text-orange-800' : 'bg-indigo-200 text-indigo-800'}`}>{cap.tipo}</span><button onClick={(e) => { e.stopPropagation(); actions.toggleForm(cap.id); }} className="p-1 bg-white rounded-full text-blue-600 hover:text-blue-800"><Plus size={18} /></button></div>
          </div>
          {expandedCapacities.has(cap.id) && (
            <div className="p-4 border-t bg-gray-50 space-y-3">
              <h4 className="text-sm font-bold text-gray-700 mb-3">Critérios ({cap.criterios?.length || 0})</h4>
              {cap.criterios?.map(crit => (
                  <div key={crit.id} className="flex justify-between items-center p-3 border rounded bg-white shadow-sm hover:border-blue-300">
                    <div className="flex-1"><p className="text-sm text-gray-800">{crit.descricao}</p><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${crit.tipo === 'CRITICO' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>{crit.tipo}</span></div>
                    <button onClick={() => actions.deleteCriterio(crit.id)} className="text-red-500 hover:text-red-700 p-1 ml-4" disabled={loading}><Trash2 size={16} /></button>
                  </div>
              ))}
              {novoCrit?.capacidadeId === cap.id && (
                  <div className="mt-4 p-4 border-t bg-white rounded-lg flex flex-col gap-2">
                      <input type="text" value={novoCrit.descricao} onChange={e => actions.setNovoCrit({...novoCrit, descricao: e.target.value})} placeholder="Descrição..." className="w-full p-2 border rounded text-sm"/>
                      <div className="flex justify-between items-center">
                          <select value={novoCrit.tipo} onChange={e => actions.setNovoCrit({...novoCrit, tipo: e.target.value as any})} className="p-2 border rounded text-sm"><option value="CRITICO">CRÍTICO</option><option value="DESEJAVEL">DESEJÁVEL</option></select>
                          <div className="flex gap-2"><button onClick={() => actions.toggleForm(null)} className="text-gray-500 text-sm">Cancelar</button><button onClick={() => actions.createCriterio(cap.id)} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded text-sm flex items-center gap-2">{loading ? <Loader2 size={16} className="animate-spin"/> : <Plus size={16}/>} Adicionar</button></div>
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