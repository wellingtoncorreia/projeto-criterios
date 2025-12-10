'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, ArrowLeft, Save } from "lucide-react";
import Link from 'next/link';
import api from '@/app/services/api';
import Swal from "sweetalert2";
import { Usuario, Disciplina } from '@/app/types';

interface FormDataState {
  nome: string;
  anoSemestre: string;
  termoAtual: number;
  disciplinaTemplateId: number | null; // NOVO: ID da Disciplina Template
}

export default function NovaTurmaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [professores, setProfessores] = useState<Usuario[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  
  // Estados do Formulário
  const [formData, setFormData] = useState<FormDataState>({ nome: "", anoSemestre: "", termoAtual: 1, disciplinaTemplateId: null });
  const [prof1, setProf1] = useState<string>(""); // ID do prof 1
  const [prof2, setProf2] = useState<string>(""); // ID do prof 2

  useEffect(() => {
    Promise.all([
        api.get<Usuario[]>('/admin/professores'),
        api.get<Disciplina[]>('/disciplinas') // Lista de Disciplinas Template
    ]).then(([resProfs, resDiscs]) => {
        setProfessores(resProfs.data);
        setDisciplinas(resDiscs.data);
        // Pré-seleciona a primeira disciplina, se houver
        if (resDiscs.data.length > 0) {
            setFormData(prev => ({ ...prev, disciplinaTemplateId: resDiscs.data[0].id }));
        }
        setLoading(false);
    }).catch(err => {
        console.error(err);
        Swal.fire('Erro', 'Falha ao carregar dados iniciais.', 'error');
        setLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.disciplinaTemplateId === null) {
        return Swal.fire('Atenção', 'Selecione uma Disciplina Template.', 'warning');
    }

    const profsSelecionados = [prof1, prof2].filter(p => p !== "");
    
    if (profsSelecionados.length < 1) { 
        return Swal.fire('Atenção', 'Selecione no mínimo 1 professor responsável.', 'warning');
    }
    if (prof1 === prof2 && profsSelecionados.length === 2) {
      return Swal.fire('Erro', 'O professor responsável e o co-responsável não podem ser a mesma pessoa.', 'error');
    }
    
    setLoading(true);

    try {
        const payload = {
            ...formData,
            professoresIds: profsSelecionados.map(p => Number(p))
        }

        await api.post('/turmas', payload);
        
        await Swal.fire({
            icon: 'success',
            title: 'Turma Criada!',
            text: 'A nova turma e sua estrutura de avaliação foram criadas com sucesso.',
            showConfirmButton: false,
            timer: 1500
        });

        router.push('/gestao/turmas');
    } catch (err: any) {
        const msg = err.response?.data || 'Erro ao salvar.';
        Swal.fire('Erro', typeof msg === 'string' ? msg : 'Falha na comunicação com o servidor.', 'error');
    } finally {
        setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando dados...</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
        
        <Link href="/gestao/turmas" className="text-gray-500 hover:text-gray-700 flex items-center gap-2 mb-6">
            <ArrowLeft size={20} /> Voltar para Gestão de Turmas
        </Link>

        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                    <Plus size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Nova Turma</h1>
                    <p className="text-sm text-gray-500">Crie uma nova turma e vincule a uma disciplina template.</p>
                </div>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Seleção de Disciplina Template */}
                <div className="bg-red-50 p-4 rounded-md border border-red-200">
                    <label className="block text-sm font-bold text-red-700 mb-1">Disciplina Base (Template)</label>
                    <select 
                        required
                        value={formData.disciplinaTemplateId || ''}
                        onChange={e => setFormData({...formData, disciplinaTemplateId: Number(e.target.value)})}
                        className="w-full p-3 border rounded bg-white text-gray-800 focus:ring-2 focus:ring-red-500 outline-none"
                    >
                        <option value="">Selecione a Disciplina Template</option>
                        {disciplinas.map(d => (
                            <option key={d.id} value={d.id}>{d.nome} ({d.sigla})</option>
                        ))}
                    </select>
                    <p className="text-xs text-red-600 mt-2">
                        * A estrutura de Capacidades e Critérios dessa disciplina será COPIADA (Snapshot) para essa nova turma. Alterações futuras no template NÃO afetarão o histórico desta turma.
                    </p>
                </div>
                
                {/* Dados Básicos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Turma</label>
                        <input 
                            required 
                            name="nome"
                            value={formData.nome}
                            onChange={e => setFormData({...formData, nome: e.target.value})}
                            placeholder="Ex: Desenv. Sistemas - Manhã" 
                            className="w-full p-3 border rounded text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" 
                        />
                    </div>
                
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ano/Semestre</label>
                        <input 
                            required 
                            name="anoSemestre"
                            value={formData.anoSemestre}
                            onChange={e => setFormData({...formData, anoSemestre: e.target.value})}
                            placeholder="Ex: 2025/1" 
                            className="w-full p-3 border rounded text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Termo Atual</label>
                        <select 
                            name="termoAtual"
                            value={formData.termoAtual}
                            onChange={e => setFormData({...formData, termoAtual: Number(e.target.value)})}
                            className="w-full p-3 border rounded bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="1">1º Termo</option>
                            <option value="2">2º Termo</option>
                            <option value="3">3º Termo</option>
                            <option value="4">4º Termo</option>
                        </select>
                    </div>
                </div>

                {/* Seleção de Professores */}
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Atribuição de Professores</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Professor Responsável (Min. 1)</label>
                            <select 
                                required
                                value={prof1}
                                onChange={e => setProf1(e.target.value)}
                                className="w-full p-2.5 border rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="">Selecione o Professor</option>
                                {professores.map(p => (
                                    <option key={p.id} value={p.id}>{p.nome}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Professor Co-Responsável (Max. 2)</label>
                            <select 
                                value={prof2}
                                onChange={e => setProf2(e.target.value)}
                                className="w-full p-2.5 border rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="">Nenhum (Opcional)</option>
                                {professores.map(p => (
                                    <option key={p.id} value={p.id}>{p.nome}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <button type="submit" disabled={loading || formData.disciplinaTemplateId === null} className="mt-2 bg-blue-600 text-white p-3 rounded hover:bg-blue-700 flex justify-center items-center gap-2 font-semibold disabled:opacity-50 transition shadow-sm">
                    {loading ? 'Criando Turma...' : <><Save size={20} /> Criar Turma</>}
                </button>
            </form>
        </div>
    </div>
  );
}