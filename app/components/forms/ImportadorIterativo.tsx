'use client';

import { UploadCloud, X, Trash2, Plus, Save, Edit2, ChevronDown, ChevronUp, FileSpreadsheet, AlertTriangle, Loader2 } from 'lucide-react';
import { useImportadorIterativo } from '@/app/hooks/useImportadorIterativo';
import { CapacidadeEdicaoDTO } from '@/app/types';

interface Props { 
    disciplinaId: number; 
    nomeDisciplina: string;
    initialData: CapacidadeEdicaoDTO[] | null; 
    onSuccess: () => void; 
    onClose: () => void; 
}

export default function ImportadorIterativo({ disciplinaId, nomeDisciplina, initialData, onSuccess, onClose }: Props) {
  
  // --- A LÓGICA VEM TODA DAQUI ---
  const { 
    step, file, loading, parsedData, expandedCaps, fileInputRef, 
    actions 
  } = useImportadorIterativo(disciplinaId, initialData, onSuccess);

  // Mapeamos 'parsedData' para 'dados' apenas para manter coerência com seu JSX original se quiser, 
  // ou usamos parsedData direto. Vou usar parsedData direto no JSX abaixo.

  // --- Passo 1: Seleção de Arquivo ---
  if (step === 'UPLOAD') {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg border-2 border-dashed border-blue-300 text-center w-full max-w-md">
            <FileSpreadsheet size={48} className="mx-auto text-blue-600 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Importar Estrutura</h2>
            <p className="text-gray-500 mb-6 text-sm">Selecione o arquivo CSV, TXT ou Excel (XLSX). A estrutura será processada no servidor e exibida para revisão.</p>
            
            <label className="bg-blue-600 text-white px-6 py-3 rounded-md cursor-pointer hover:bg-blue-700 transition block relative">
                <UploadCloud size={20} className="inline mr-2"/> Selecionar Arquivo
                <input 
                    type="file" 
                    ref={fileInputRef}
                    accept=".csv, .txt, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                    className="hidden" 
                    onChange={actions.handleFileChange}
                    disabled={loading}
                />
            </label>

            {/* Botão extra para confirmar envio se o arquivo foi selecionado mas não enviado auto (opcional, dependendo da sua UX) */}
            {file && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                    <p className="text-sm font-bold text-gray-700 mb-2">Arquivo: {file.name}</p>
                    <button 
                        onClick={actions.processFile} 
                        disabled={loading}
                        className="w-full bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Processar Agora'}
                    </button>
                </div>
            )}

            <button onClick={onClose} className="mt-4 text-gray-400 hover:text-gray-600 text-sm" disabled={loading}>Cancelar</button>
            
            {loading && !file && (
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
            <p className="text-xs text-gray-500">{parsedData?.length || 0} capacidades encontradas. Edite antes de salvar.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded">Cancelar</button>
            <button 
                onClick={actions.handleSaveAll} 
                disabled={loading || !parsedData || parsedData.length === 0} 
                className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
            >
                {loading ? <><Loader2 size={18} className="animate-spin"/> Salvando...</> : <><Save size={18}/> Salvar Tudo</>}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-4">
          
          {(!parsedData || parsedData.length === 0) && (
            <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                <AlertTriangle size={32} className="text-yellow-500 mx-auto mb-2"/>
                <p className="text-gray-500">Nenhuma estrutura para salvar. Selecione um arquivo válido no passo anterior.</p>
                <button onClick={() => actions.setStep('UPLOAD')} className="mt-4 text-blue-600 hover:underline">Voltar e tentar novamente</button>
            </div>
          )}
          
          {parsedData?.map((cap, capIndex) => {
            // Usamos capIndex como chave estável para edição local
            const isExpanded = expandedCaps.has(capIndex);
            const temCritico = cap.criterios.some(crit => crit.tipo === 'CRITICO');
            
            return (
              <div key={capIndex} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                {/* Header */}
                <div className={`p-4 border-b flex gap-3 items-center cursor-pointer hover:bg-gray-50 ${cap.tipo === 'SOCIOEMOCIONAL' ? 'bg-orange-50' : 'bg-indigo-50'}`} onClick={() => actions.toggleExpanded(capIndex)}>
                  <button className="text-gray-400 hover:text-gray-600">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  <div className="flex-1">
                    <input 
                      value={cap.descricao} 
                      onChange={(e) => actions.updateCapacidade(capIndex, 'descricao', e.target.value)} 
                      onClick={e => e.stopPropagation()}
                      className="w-full font-bold text-gray-800 bg-transparent border-b border-transparent focus:border-gray-300 focus:outline-none"
                    />
                    {!temCritico && <p className="text-red-500 text-xs mt-1 font-medium flex items-center gap-1">
                        <AlertTriangle size={14}/> Falta Critério CRÍTICO
                    </p>}
                  </div>
                  <select 
                    value={cap.tipo} 
                    onChange={(e) => actions.updateCapacidade(capIndex, 'tipo', e.target.value)}
                    onClick={e => e.stopPropagation()}
                    className={`text-xs px-2 py-1 rounded border ${cap.tipo === 'SOCIOEMOCIONAL' ? 'bg-orange-100 border-orange-300 text-orange-700' : 'bg-indigo-100 border-indigo-300 text-indigo-700'}`}
                  >
                    <option value="TECNICA">TÉCNICA</option>
                    <option value="SOCIOEMOCIONAL">SOCIOEMOCIONAL</option>
                  </select>
                  <button 
                    onClick={(e) => { e.stopPropagation(); actions.removeCapacidade(capIndex); }} 
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
                        cap.criterios.map((crit, critIndex) => (
                          <div key={critIndex} className="flex gap-2 items-center bg-gray-50 p-2 rounded border border-gray-200">
                            <span className="text-xs text-gray-400 min-w-5">{critIndex + 1}.</span>
                            <input 
                              value={crit.descricao}
                              onChange={(e) => actions.updateCriterio(capIndex, critIndex, 'descricao', e.target.value)}
                              placeholder="Descrição do critério..."
                              className="flex-1 text-sm p-2 border rounded bg-white focus:ring-1 focus:ring-blue-300 outline-none"
                            />
                            <select 
                              value={crit.tipo}
                              onChange={(e) => actions.updateCriterio(capIndex, critIndex, 'tipo', e.target.value)}
                              className={`text-xs p-1 rounded border ${crit.tipo === 'CRITICO' ? 'text-red-700 bg-red-100 border-red-300' : 'text-blue-700 bg-blue-100 border-blue-300'}`}
                            >
                              <option value="CRITICO">CRÍTICO</option>
                              <option value="DESEJAVEL">DESEJÁVEL</option>
                            </select>
                            <button 
                              onClick={() => actions.removeCriterio(capIndex, critIndex)}
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
                      onClick={() => actions.addCriterio(capIndex)}
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