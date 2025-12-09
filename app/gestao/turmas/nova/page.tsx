'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Users, UserCheck } from 'lucide-react';
import api from '@/app/services/api';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { Usuario } from '@/app/types';

export default function NovaTurmaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [professores, setProfessores] = useState<Usuario[]>([]);

  // Estados do Formulário
  const [nome, setNome] = useState('');
  const [anoSemestre, setAnoSemestre] = useState('');
  const [termoAtual, setTermoAtual] = useState(1);
  const [prof1, setProf1] = useState<string>(''); // ID do prof 1
  const [prof2, setProf2] = useState<string>(''); // ID do prof 2 (opcional ou obrigatório conforme sua regra)

  // Carrega a lista de professores ao entrar na tela
  useEffect(() => {
    // Tenta primeiro /admin/professores (para gestores), se falhar tenta /usuarios
    api.get('/admin/professores') 
      .then(res => setProfessores(res.data))
      .catch(err => {
        console.error("Erro ao carregar professores do /admin/professores", err);
        // Fallback para /usuarios
        api.get('/usuarios')
          .then(res => setProfessores(res.data))
          .catch(err2 => console.error("Erro ao carregar professores do /usuarios", err2));
      });
  }, []);
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // Validação básica
    if (!prof1 || !prof2) {
      Swal.fire('Atenção', 'Selecione dois professores para a turma (Regra de Negócio).', 'warning');
      setLoading(false);
      return;
    }

    if (prof1 === prof2) {
      Swal.fire('Erro', 'O professor responsável e o co-responsável não podem ser a mesma pessoa.', 'error');
      setLoading(false);
      return;
    }

    // Monta o Payload conforme TurmaDTO do backend
    // Backend espera 'professoresIds' como um array de IDs
    const payload = {
      nome,
      anoSemestre,
      termoAtual,
      professoresIds: [parseInt(prof1), parseInt(prof2)]
    };

    try {
      const response = await api.post('/turmas', payload);
      
      await Swal.fire({
        icon: 'success',
        title: 'Turma Criada!',
        text: 'Turma e professores vinculados com sucesso.',
        showConfirmButton: false,
        timer: 1500
      });

      router.push('/gestao/turmas');
      router.refresh(); 
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data || 'Erro ao criar turma.';
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: typeof msg === 'string' ? msg : 'Falha na comunicação com o servidor.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link href="/gestao/turmas" className="text-gray-500 hover:text-gray-700 flex items-center gap-2 mb-6">
        <ArrowLeft size={20} /> Voltar
      </Link>

      <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
        <div className="flex items-center gap-3 mb-6 border-b pb-4">
            <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                <Users size={24} />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Nova Turma</h1>
                <p className="text-sm text-gray-500">Defina os dados e a equipe docente.</p>
            </div>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Dados Básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Turma</label>
                <input 
                    required 
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    placeholder="Ex: Desenv. Sistemas - Manhã" 
                    className="w-full p-3 border rounded text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" 
                />
             </div>
          
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ano/Semestre</label>
                <input 
                    required 
                    value={anoSemestre}
                    onChange={e => setAnoSemestre(e.target.value)}
                    placeholder="Ex: 2025/1" 
                    className="w-full p-3 border rounded text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" 
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Termo Atual</label>
                <select 
                    value={termoAtual}
                    onChange={e => setTermoAtual(Number(e.target.value))}
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
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Professor Responsável</label>
                    <select 
                        required
                        value={prof1}
                        onChange={e => setProf1(e.target.value)}
                        className="w-full p-2.5 border rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="">Selecione...</option>
                        {professores.map(p => (
                            <option key={p.id} value={p.id}>{p.nome}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Professor Co-Responsável</label>
                    <select 
                        value={prof2}
                        onChange={e => setProf2(e.target.value)}
                        className="w-full p-2.5 border rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="">Selecione...</option>
                        {professores.map(p => (
                            <option key={p.id} value={p.id}>{p.nome}</option>
                        ))}
                    </select>
                </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
                * É necessário selecionar dois professores diferentes para compartilhar a turma.
            </p>
          </div>

          <button type="submit" disabled={loading} className="mt-2 bg-green-600 text-white p-3 rounded hover:bg-green-700 flex justify-center items-center gap-2 font-semibold disabled:opacity-50 transition shadow-sm">
            {loading ? 'Salvando...' : <><Save size={20} /> Criar Turma</>}
          </button>
        </form>
      </div>
    </div>
  );
}