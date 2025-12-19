'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, UserPlus, Users, BarChart, Send, Download, Trash2, Settings,
  X, Loader2, CheckCircle2, AlertCircle, GraduationCap, Zap // Adicionei 'Zap'
} from 'lucide-react';
import Link from 'next/link';
import api from '@/app/services/api';
import Swal from 'sweetalert2';
import { Turma, Aluno, Disciplina } from '@/app/types';
import ImportadorAlunos from '@/app/components/forms/ImportadorAlunos'; 

interface PageProps {
  params: Promise<{ id: string }>;
}

// Interface auxiliar para o Modal
interface DisciplinaOpcao extends Disciplina {
  snapshotId: number | null;
  status: 'PRONTO' | 'SEM_SNAPSHOT' | 'CARREGANDO';
}

export default function DetalhesTurmaPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  
  const [turma, setTurma] = useState<Turma | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportador, setShowImportador] = useState(false);

  // --- Estados do Modal de Avaliação ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [disciplinasModal, setDisciplinasModal] = useState<DisciplinaOpcao[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);

  // Carrega dados da turma e dos alunos
  async function carregarDados() {
    setLoading(true);
    try {
      const [resTurma, resAlunos] = await Promise.all([
        api.get<Turma>(`/turmas/${id}`),
        api.get<Aluno[]>(`/turmas/${id}/alunos`) 
      ]);
      setTurma(resTurma.data);
      setAlunos(resAlunos.data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      Swal.fire('Erro', 'Não foi possível carregar os dados da turma.', 'error');
    } finally {
      setLoading(false);
    }
  }

  // --- Lógica do Modal de Avaliação ---
  const abrirModalAvaliacao = async () => {
    if (!turma) return;
    
    setIsModalOpen(true);
    setLoadingModal(true);
    setDisciplinasModal([]);

    try {
        const resDiscs = await api.get<Disciplina[]>(`/turmas/${turma.id}/disciplinas`);
        const disciplinasBasicas = resDiscs.data;

        const disciplinasVerificadas = await Promise.all(disciplinasBasicas.map(async (d) => {
            let snapId: number | null = null;
            if (d.id === turma.disciplinaId && turma.estruturaSnapshotId) {
                snapId = turma.estruturaSnapshotId;
            } else {
                try {
                    const resSnap = await api.get<number>(`/disciplinas/${d.id}/snapshot-status`);
                    snapId = resSnap.data;
                } catch {
                    snapId = null;
                }
            }
            return {
                ...d,
                snapshotId: snapId,
                status: snapId ? 'PRONTO' : 'SEM_SNAPSHOT'
            } as DisciplinaOpcao;
        }));

        setDisciplinasModal(disciplinasVerificadas);

    } catch (err) {
        console.error("Erro ao carregar disciplinas", err);
        Swal.fire('Erro', 'Não foi possível buscar as disciplinas.', 'error');
        setIsModalOpen(false);
    } finally {
        setLoadingModal(false);
    }
  };

  // --- NOVA FUNÇÃO LOCAL: CRIAR SNAPSHOT ---
  const handleCriarSnapshot = async (discId: number) => {
    if (!turma) return;
    setLoadingModal(true);
    try {
        const res = await api.post(`/turmas/${turma.id}/snapshot/${discId}`);
        const novoSnapshotId = res.data?.estruturaSnapshotId;

        if (novoSnapshotId) {
            setDisciplinasModal(prev => prev.map(d => 
                d.id === discId ? { ...d, snapshotId: novoSnapshotId, status: 'PRONTO' } : d
            ));
            Swal.fire({
                icon: 'success',
                title: 'Snapshot Criado!',
                text: 'Avaliação iniciada com sucesso.',
                timer: 1500,
                showConfirmButton: false
            });
        }
    } catch (err) {
        console.error(err);
        Swal.fire('Erro', 'Erro ao criar Snapshot.', 'error');
    } finally {
        setLoadingModal(false);
    }
  };

  const handleNavegarAvaliacao = (snapshotId: number, discId: number) => {
      setIsModalOpen(false);
      router.push(`/gestao/turmas/${id}/avaliacao?estruturaId=${snapshotId}&discId=${discId}`);
  };

  async function handleDeleteAluno(alunoId: number, nomeAluno: string) {
    const result = await Swal.fire({
      title: 'Excluir Aluno?',
      text: `Tem certeza que deseja apagar "${nomeAluno}"? Isso excluirá todas as notas lançadas para ele.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, excluir'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/alunos/${alunoId}`);
        await Swal.fire('Excluído!', 'O aluno foi removido.', 'success');
        carregarDados(); 
      } catch (error) {
        Swal.fire('Erro', 'Não foi possível excluir o aluno.', 'error');
      }
    }
  }

  useEffect(() => {
    carregarDados();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500 flex flex-col items-center"><Loader2 className="animate-spin mb-2"/> Carregando dados da turma...</div>;
  if (!turma) return <div className="p-8 text-center text-red-500">Turma não encontrada.</div>;

  const isStructureReady = turma.estruturaSnapshotId !== undefined && turma.estruturaSnapshotId !== null;

  return (
    <div className="p-8 max-w-6xl mx-auto">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
         <Link href="/gestao/turmas" className="text-gray-500 hover:text-gray-700 flex items-center gap-2">
          <ArrowLeft size={20} /> Voltar para Turmas
        </Link>
        
        <div className="flex flex-wrap gap-3">
            <button onClick={abrirModalAvaliacao} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2 text-sm font-medium transition shadow-sm">
                <Send size={18} /> Avaliar Turma
            </button>

            {isStructureReady && (
                <Link href={`/gestao/turmas/${id}/relatorio?estruturaId=${turma.estruturaSnapshotId}&origem=detalhes`} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium transition shadow-sm">
                    <BarChart size={18} /> Relatório/Boletim
                </Link>
            )}

            <button onClick={() => setShowImportador(true)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 text-sm font-medium transition shadow-sm">
                <Download size={18} /> Importar Alunos
            </button>
        </div>
       </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{turma.nome}</h1>
        <div className="flex flex-col md:flex-row md:items-center gap-4 text-gray-600">
            <span className="font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded border border-blue-100">{turma.nomeDisciplina || "Sem Disciplina Vinculada"}</span>
            <span>|</span>
            <span>{turma.anoSemestre}</span>
            <span>|</span>
            <span>{turma.termoAtual}º Termo</span>
            
            <div className={`ml-auto px-3 py-1 rounded text-sm font-bold border ${isStructureReady ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                {isStructureReady ? 'Avaliação Ativa (Principal)' : 'Estrutura Pendente'}
            </div>
        </div>
        
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
            <Users size={16} />
            <span>{alunos.length} Alunos matriculados</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-700">Alunos Matriculados</h2>
      </div>
      
      {alunos.length === 0 ? (
          <div className="p-12 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-gray-500">
              <UserPlus size={48} className="mx-auto mb-4 text-gray-400"/>
              <p className="text-lg font-medium">Nenhum aluno nesta turma.</p>
              <p className="text-sm">Use o botão "Importar Alunos" para carregar a lista via PDF ou Excel.</p>
          </div>
      ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                      <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nome do Aluno</th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
                      </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                      {alunos.map((aluno, index) => (
                          <tr key={aluno.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{aluno.nome}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button onClick={() => handleDeleteAluno(aluno.id, aluno.nome)} className="text-red-500 hover:text-red-700 transition flex items-center gap-1 justify-end ml-auto" title="Excluir Aluno">
                                    <Trash2 size={16} /> <span className="hidden sm:inline">Excluir</span>
                                </button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      )}

      {showImportador && (
        <ImportadorAlunos turmaId={Number(id)} onClose={() => setShowImportador(false)} onSuccess={carregarDados} />
      )}

      {/* --- MODAL DE SELEÇÃO DE DISCIPLINA --- */}
      {isModalOpen && turma && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                
                <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Avaliar Turma</h3>
                        <p className="text-sm text-gray-500">{turma.nome}</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-1 rounded-full transition"><X size={20} /></button>
                </div>

                <div className="p-6">
                    <p className="text-sm text-gray-600 mb-4">Selecione a disciplina que deseja avaliar:</p>
                    
                    {loadingModal ? (
                        <div className="py-8 flex flex-col items-center text-gray-400">
                            <Loader2 className="animate-spin mb-2" size={32}/>
                            <p className="text-xs">Buscando avaliações disponíveis...</p>
                        </div>
                    ) : disciplinasModal.length === 0 ? (
                        <div className="text-center py-6 bg-yellow-50 rounded-lg text-yellow-700 border border-yellow-200">
                            <AlertCircle className="mx-auto mb-2" />
                            Nenhuma disciplina encontrada.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {disciplinasModal.map((disc) => (
                                <div key={disc.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition group">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${disc.snapshotId ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                            <GraduationCap size={20} />
                                        </div>
                                        <div>
                                            <h4 className={`font-semibold ${disc.snapshotId ? 'text-gray-800' : 'text-gray-400'}`}>{disc.nome}</h4>
                                            <span className="text-xs text-gray-500">
                                                {disc.snapshotId 
                                                    ? <span className="text-green-600 flex items-center gap-1"><CheckCircle2 size={10}/> Avaliação Ativa</span> 
                                                    : 'Avaliação não iniciada'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* AQUI A LÓGICA LOCAL DO BOTÃO CRIAR */}
                                    <div className="flex items-center gap-2">
                                        {!disc.snapshotId && (
                                            <button 
                                                onClick={() => handleCriarSnapshot(disc.id)}
                                                className="px-3 py-2 rounded text-sm font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition flex items-center gap-1 shadow-sm"
                                                title="Criar Snapshot"
                                            >
                                                <Zap size={14} /> Criar
                                            </button>
                                        )}

                                        <button
                                            onClick={() => disc.snapshotId && handleNavegarAvaliacao(disc.snapshotId, disc.id)}
                                            disabled={!disc.snapshotId}
                                            className={`px-4 py-2 rounded text-sm font-medium transition
                                                ${disc.snapshotId 
                                                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' 
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                        >
                                            Avaliar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-gray-50 px-6 py-3 border-t text-center">
                    <button onClick={() => setIsModalOpen(false)} className="text-sm text-gray-500 hover:text-gray-800 underline">Cancelar</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}