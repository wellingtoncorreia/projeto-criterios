'use client';

import { useState } from 'react';
import { Capacidade, TipoCapacidade, TipoCriterio } from '@/app/types';
import { Plus, Trash2, CheckCircle, AlertCircle, UploadCloud } from 'lucide-react';
import api from '@/app/services/api';
import ImportadorCriterios from '@/app/components/forms/ImportadorCriterios';

interface Props {
    disciplinaId: number;
    capacidadesIniciais: Capacidade[];
}

export default function GerenciadorCapacidades({ disciplinaId, capacidadesIniciais }: Props) {
    const [capacidades, setCapacidades] = useState<Capacidade[]>(capacidadesIniciais);
    const [loading, setLoading] = useState(false);

    // Estados para nova Capacidade
    const [novaCapDesc, setNovaCapDesc] = useState('');
    const [novaCapTipo, setNovaCapTipo] = useState<TipoCapacidade>('TECNICA');

    // Estados para novo Critério
    const [addCriterioEm, setAddCriterioEm] = useState<number | null>(null);
    const [novoCritDesc, setNovoCritDesc] = useState('');
    const [novoCritTipo, setNovoCritTipo] = useState<TipoCriterio>('CRITICO');

    // [NOVO] Estado para controle de importação
    const [importandoEm, setImportandoEm] = useState<number | null>(null);

    // --- AÇÕES DE CAPACIDADE ---
    async function adicionarCapacidade() {
        if (!novaCapDesc.trim()) return;
        setLoading(true);
        try {
            const res = await api.post('/capacidades', {
                descricao: novaCapDesc,
                tipo: novaCapTipo,
                disciplina: { id: disciplinaId }
            });
            setCapacidades([...capacidades, { ...res.data, criterios: [] }]);
            setNovaCapDesc('');
        } catch (error) {
            alert('Erro ao adicionar capacidade. Verifique o backend.');
        } finally {
            setLoading(false);
        }
    }

    // --- AÇÕES DE CRITÉRIO ---
    async function adicionarCriterio(capacidadeId: number) {
        if (!novoCritDesc.trim()) return;

        try {
            const params = new URLSearchParams();
            params.append('capacidadeId', capacidadeId.toString());
            params.append('descricao', novoCritDesc);
            params.append('tipo', novoCritTipo);

            const res = await api.post(`/gestao/criterios?${params.toString()}`);

            setCapacidades(prev => prev.map(cap => {
                if (cap.id === capacidadeId) {
                    return {
                        ...cap,
                        criterios: [...(cap.criterios || []), res.data]
                    };
                }
                return cap;
            }));

            setNovoCritDesc('');
            setAddCriterioEm(null);
        } catch (error) {
            alert('Erro ao adicionar critério.');
            console.error(error);
        }
    }

    return (
        <div className="space-y-8">

            {/* Formulário de Nova Capacidade */}
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                    <Plus size={20} /> Adicionar Nova Capacidade
                </h3>
                <div className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="text-sm text-blue-700">Descrição da Capacidade</label>
                        <input
                            value={novaCapDesc}
                            onChange={e => setNovaCapDesc(e.target.value)}
                            className="w-full p-2 border rounded mt-1 bg-white"
                            placeholder="Ex: Identificar a sequência lógica..."
                        />
                    </div>
                    <div className="w-48">
                        <label className="text-sm text-blue-700">Tipo</label>
                        <select
                            value={novaCapTipo}
                            onChange={e => setNovaCapTipo(e.target.value as TipoCapacidade)}
                            className="w-full p-2 border rounded mt-1 bg-white"
                        >
                            <option value="TECNICA">Técnica</option>
                            <option value="SOCIOEMOCIONAL">Socioemocional</option>
                        </select>
                    </div>
                    <button
                        onClick={adicionarCapacidade}
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 h-10 font-medium"
                    >
                        Adicionar
                    </button>
                </div>
            </div>

            {/* Lista de Capacidades Existentes */}
            <div className="space-y-6">
                {capacidades.map(cap => (
                    <div key={cap.id} className="bg-white border rounded-lg shadow-sm overflow-hidden">
                        {/* Cabeçalho da Capacidade */}
                        <div className="bg-gray-50 p-4 border-b flex justify-between items-start">
                            <div>
                                <span className={`text-xs font-bold px-2 py-1 rounded uppercase mb-2 inline-block ${cap.tipo === 'TECNICA' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'
                                    }`}>
                                    {cap.tipo}
                                </span>
                                <p className="text-lg font-medium text-gray-800">{cap.descricao}</p>
                            </div>
                            <button className="text-red-400 hover:text-red-600" title="Excluir Capacidade">
                                <Trash2 size={18} />
                            </button>
                        </div>

                        {/* Lista de Critérios */}
                        <div className="p-4 bg-white">
                            <h4 className="text-sm font-bold text-gray-500 uppercase mb-3">Critérios de Avaliação</h4>

                            <ul className="space-y-2 mb-4">
                                {cap.criterios && cap.criterios.length > 0 ? (
                                    cap.criterios.map(crit => (
                                        <li key={crit.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded border border-transparent hover:border-gray-100">
                                            {crit.tipo === 'CRITICO' ? (
                                                <div title="Crítico" className="shrink-0 cursor-help">
                                                    <AlertCircle size={18} className="text-red-500" />
                                                </div>
                                            ) : (
                                                <div title="Desejável" className="shrink-0 cursor-help">
                                                    <CheckCircle size={18} className="text-gray-400" />
                                                </div>
                                            )}
                                            <span className={`flex-1 text-sm ${crit.tipo === 'CRITICO' ? 'text-red-700 font-medium' : 'text-gray-600'}`}>
                                                {crit.descricao}
                                            </span>
                                            <span className="text-xs text-gray-400 border px-1 rounded">{crit.tipo}</span>
                                        </li>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-400 italic">Nenhum critério cadastrado ainda.</p>
                                )}
                            </ul>

                            {/* BARRA DE BOTÕES DE AÇÃO */}
                            {addCriterioEm !== cap.id && importandoEm !== cap.id ? (
                                <div className="flex gap-4 mt-2 pt-2 border-t border-gray-100">
                                    <button
                                        onClick={() => setAddCriterioEm(cap.id)}
                                        className="text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded flex items-center gap-1 transition"
                                    >
                                        <Plus size={16} /> Novo Critério
                                    </button>

                                    <button
                                        onClick={() => setImportandoEm(cap.id)}
                                        className="text-sm text-green-600 hover:text-green-800 hover:bg-green-50 px-2 py-1 rounded flex items-center gap-1 transition"
                                    >
                                        <UploadCloud size={16} /> Importar Lista
                                    </button>
                                </div>
                            ) : null}

                            {/* Formulário Manual */}
                            {addCriterioEm === cap.id && (
                                <div className="bg-gray-50 p-3 rounded border border-gray-200 mt-2 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            placeholder="Descrição do critério..."
                                            className="flex-1 text-sm p-2 border rounded"
                                            value={novoCritDesc}
                                            onChange={e => setNovoCritDesc(e.target.value)}
                                            autoFocus
                                        />
                                        <select
                                            className="text-sm p-2 border rounded w-32"
                                            value={novoCritTipo}
                                            onChange={e => setNovoCritTipo(e.target.value as TipoCriterio)}
                                        >
                                            <option value="CRITICO">Crítico</option>
                                            <option value="DESEJAVEL">Desejável</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => adicionarCriterio(cap.id)}
                                            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                        >
                                            Salvar Critério
                                        </button>
                                        <button
                                            onClick={() => setAddCriterioEm(null)}
                                            className="text-xs text-gray-500 px-3 py-1 hover:text-gray-700"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Formulário de Importação (NOVO) */}
                            {importandoEm === cap.id && (
                                <ImportadorCriterios
                                    capacidadeId={cap.id}
                                    onCancel={() => setImportandoEm(null)}
                                    onSuccess={() => {
                                        // Recarrega a página para atualizar os dados
                                        window.location.reload();
                                    }}
                                />
                            )}
                        </div>
                    </div>
                ))}

                {capacidades.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-500">
                        Nenhuma capacidade cadastrada para esta disciplina.
                    </div>
                )}
            </div>
        </div>
    );
}