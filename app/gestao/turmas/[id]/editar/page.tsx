'use client';

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Users, UserCheck } from "lucide-react";
import Link from 'next/link';
import api from '@/app/services/api';
import Swal from "sweetalert2";
import { Usuario } from '@/app/types'; // Importando o tipo Usuario

// Interface adaptada da TurmaResponseDTO (do backend)
interface TurmaData {
  id: number;
  nome: string;
  anoSemestre: string;
  termoAtual: number;
  professores: Usuario[];
  totalAlunos: number;
}

interface FormDataState {
  nome: string;
  anoSemestre: string;
  termoAtual: number;
}

export default function EditarTurmaPage() {
  const params = useParams();
  const id = params?.id as string;

  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [professores, setProfessores] = useState<Usuario[]>([]);
  
  // Estados do Formulário
  const [formData, setFormData] = useState<FormDataState>({ nome: "", anoSemestre: "", termoAtual: 1 });
  const [prof1, setProf1] = useState<string>(""); // ID do prof 1
  const [prof2, setProf2] = useState<string>(""); // ID do prof 2

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    
    Promise.all([
        api.get<TurmaData>(`/turmas/${id}`),       // Dados da Turma
        api.get<Usuario[]>('/admin/professores')   // Lista de Professores
    ]).then(([resTurma, resProfs]) => {
        const t = resTurma.data;
        setFormData({ nome: t.nome, anoSemestre: t.anoSemestre, termoAtual: t.termoAtual });
        setProfessores(resProfs.data);

        // Preenche os selects com os professores atuais (usando ID como string)
        if (t.professores && t.professores.length > 0) setProf1(t.professores[0].id.toString());
        if (t.professores && t.professores.length > 1) setProf2(t.professores[1].id.toString());

        setLoading(false);
    }).catch(err => {
        console.error(err);
        Swal.fire('Erro', 'Falha ao carregar dados da turma.', 'error');
        setLoading(false);
    });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const profsSelecionados = [prof1, prof2].filter(p => p !== "");
    
    if (profsSelecionados.length < 1) { // A regra de negócio aceita mínimo 1 (no service está mínimo 1)
        return Swal.fire('Atenção', 'Selecione no mínimo 1 professor para a turma.', 'warning');
    }
    if (profsSelecionados.length > 2) {
        return Swal.fire('Erro', 'A turma pode ter no máximo 2 professores.', 'error');
    }
    if (prof1 === prof2 && profsSelecionados.length === 2) {
      return Swal.fire('Erro', 'O professor responsável e o co-responsável não podem ser a mesma pessoa.', 'error');
    }
    
    setLoading(true);

    try {
        // O backend espera 'professoresIds' como um array de IDs
        await api.put(`/turmas/${id}`, {
            ...formData,
            professoresIds: profsSelecionados.map(p => Number(p))
        });
        
        await Swal.fire({
            icon: 'success',
            title: 'Turma Atualizada!',
            text: 'Os dados e professores foram atualizados com sucesso.',
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

  if (!id) return <div className="p-8 text-center text-gray-400">ID da turma não encontrado.</div>;
  if (loading) return <div className="p-8 text-center text-gray-500">Carregando dados da turma...</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
        
        <Link href={`/gestao/turmas`} className="text-gray-500 hover:text-gray-700 flex items-center gap-2 mb-6">
            <ArrowLeft size={20} /> Voltar
        </Link>

        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                    <Users size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Editar Turma #{id}</h1>
                    <p className="text-sm text-gray-500">Altere os dados e a equipe docente da turma.</p>
                </div>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
                    <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <UserCheck size={18} /> Atribuição de Professores
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Professor Responsável (Min. 1)</label>
                            <select 
                                value={prof1}
                                onChange={e => setProf1(e.target.value)}
                                className="w-full p-2.5 border rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="">Nenhum</option>
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
                                <option value="">Nenhum</option>
                                {professores.map(p => (
                                    <option key={p.id} value={p.id}>{p.nome}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        * A turma deve ter pelo menos um professor e no máximo dois.
                    </p>
                </div>

                <button type="submit" disabled={loading} className="mt-2 bg-blue-600 text-white p-3 rounded hover:bg-blue-700 flex justify-center items-center gap-2 font-semibold disabled:opacity-50 transition shadow-sm">
                    {loading ? 'Salvando...' : <><Save size={20} /> Salvar Alterações</>}
                </button>
            </form>
        </div>
    </div>
  );
}