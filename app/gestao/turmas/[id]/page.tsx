'use client';

import { useState, useEffect, use } from 'react';
import { ArrowLeft, UserPlus, Users, BarChart, Send, Download, Trash2, Settings } from 'lucide-react';
import Link from 'next/link';
import api from '@/app/services/api';
import Swal from 'sweetalert2';
import { Turma, Aluno } from '@/app/types';
import ImportadorAlunos from '@/app/components/forms/ImportadorAlunos'; 

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DetalhesTurmaPage({ params }: PageProps) {
  const { id } = use(params); // Next.js 15 unwrap
  
  const [turma, setTurma] = useState<Turma | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportador, setShowImportador] = useState(false);

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

  // Exclusão de aluno
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
        // Certifique-se que o endpoint DELETE /alunos/{id} existe no AlunoController
        await api.delete(`/alunos/${alunoId}`);
        await Swal.fire('Excluído!', 'O aluno foi removido.', 'success');
        carregarDados(); // Atualiza a lista
      } catch (error) {
        Swal.fire('Erro', 'Não foi possível excluir o aluno.', 'error');
      }
    }
  }

  useEffect(() => {
    carregarDados();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando dados da turma...</div>;
  if (!turma) return <div className="p-8 text-center text-red-500">Turma não encontrada.</div>;

  // Verifica se existe uma estrutura de avaliação (Snapshot) vinculada
  const isStructureReady = turma.estruturaSnapshotId !== undefined && turma.estruturaSnapshotId !== null;

  return (
    <div className="p-8 max-w-6xl mx-auto">
       
       {/* Cabeçalho de Navegação */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
         <Link 
          href="/gestao/turmas" 
          className="text-gray-500 hover:text-gray-700 flex items-center gap-2"
        >
          <ArrowLeft size={20} /> Voltar para Turmas
        </Link>
        
        <div className="flex flex-wrap gap-3">
            {/* Botão de Configurações (Edição) */}
            <Link 
                href={`/gestao/turmas/${id}/editar`}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 flex items-center gap-2 text-sm font-medium transition"
                title="Editar professores, nome ou redefinir disciplina"
            >
                <Settings size={18} /> Configurações
            </Link>

            {/* Botão de Avaliação (Só aparece se tiver Snapshot) */}
            {isStructureReady ? (
                <Link 
                    href={`/gestao/turmas/${id}/avaliacao?estruturaId=${turma.estruturaSnapshotId}`}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2 text-sm font-medium transition shadow-sm"
                >
                    <Send size={18} /> Avaliar Turma
                </Link>
            ) : (
                <button disabled className="bg-gray-300 text-gray-500 px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium cursor-not-allowed" title="Vincule uma disciplina nas configurações para avaliar">
                    <Send size={18} /> Avaliar (Indisponível)
                </button>
            )}

            {/* Botão de Relatório */}
            {isStructureReady ? (
                <Link 
                    href={`/gestao/turmas/${id}/relatorio?estruturaId=${turma.estruturaSnapshotId}`}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium transition shadow-sm"
                >
                    <BarChart size={18} /> Relatório/Boletim
                </Link>
            ) : null}

            {/* Botão Importar Alunos */}
            <button 
                onClick={() => setShowImportador(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 text-sm font-medium transition shadow-sm"
            >
                <Download size={18} /> Importar Alunos
            </button>
        </div>
       </div>

      {/* Info da Turma */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{turma.nome}</h1>
        <div className="flex flex-col md:flex-row md:items-center gap-4 text-gray-600">
            <span className="font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded border border-blue-100">
                {turma.nomeDisciplina || "Sem Disciplina Vinculada"}
            </span>
            <span>|</span>
            <span>{turma.anoSemestre}</span>
            <span>|</span>
            <span>{turma.termoAtual}º Termo</span>
            
            {/* Indicador de Status do Snapshot */}
            <div className={`ml-auto px-3 py-1 rounded text-sm font-bold border ${isStructureReady ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                {isStructureReady ? 'Avaliação Ativa' : 'Estrutura Pendente'}
            </div>
        </div>
        
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
            <Users size={16} />
            <span>{alunos.length} Alunos matriculados</span>
        </div>
      </div>
      
      {/* Lista de Alunos */}
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
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {aluno.nome}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                    onClick={() => handleDeleteAluno(aluno.id, aluno.nome)}
                                    className="text-red-500 hover:text-red-700 transition flex items-center gap-1 justify-end ml-auto"
                                    title="Excluir Aluno"
                                >
                                    <Trash2 size={16} /> <span className="hidden sm:inline">Excluir</span>
                                </button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      )}

      {/* Modal Importador */}
      {showImportador && (
        <ImportadorAlunos 
            turmaId={Number(id)}
            onClose={() => setShowImportador(false)}
            onSuccess={carregarDados} 
        />
      )}
    </div>
  );
}