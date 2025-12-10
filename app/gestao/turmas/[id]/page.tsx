'use client';

import { useState, useEffect, use } from 'react';
import { ArrowLeft, UserPlus, Users, BarChart, Send, Download, Trash2 } from 'lucide-react';
import Link from 'next/link';
import api from '@/app/services/api';
import Swal from 'sweetalert2';
import { Turma, Aluno } from '@/app/types';
import ImportadorAlunos from '@/app/components/forms/ImportadorAlunos'; 

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DetalhesTurmaPage({ params }: PageProps) {
  const { id } = use(params); // ID da Turma
  
  const [turma, setTurma] = useState<Turma | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportador, setShowImportador] = useState(false);

  // Função central de carregamento de dados
  async function carregarDados() {
    setLoading(true);
    try {
      const [resTurma, resAlunos] = await Promise.all([
        api.get<Turma>(`/turmas/${id}`),
        // Rota correta para listar alunos da turma
        api.get<Aluno[]>(`/turmas/${id}/alunos`) 
      ]);
      setTurma(resTurma.data);
      setAlunos(resAlunos.data);
    } catch (error) {
      console.error("Erro ao carregar dados da turma:", error);
      Swal.fire('Erro', 'Não foi possível carregar os dados da turma.', 'error');
    } finally {
      setLoading(false);
    }
  }

  // Manipulador de exclusão de aluno
  async function handleDeleteAluno(alunoId: number, nomeAluno: string) {
    const result = await Swal.fire({
      title: 'Excluir Aluno?',
      text: `Tem certeza que deseja apagar o aluno "${nomeAluno}"? Isso EXCLUIRÁ PERMANENTEMENTE o aluno e todas as suas avaliações.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, excluir'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/alunos/${alunoId}`);
        await Swal.fire('Excluído!', 'O aluno foi removido com sucesso.', 'success');
        carregarDados(); // Recarrega a lista
      } catch (error) {
        Swal.fire('Erro', 'Não foi possível excluir o aluno.', 'error');
      }
    }
  }

  useEffect(() => {
    carregarDados();
  }, [id]);

  if (loading) return <div className="p-8 text-gray-500">Carregando dados da turma...</div>;
  if (!turma) return <div className="p-8 text-red-500">Turma não encontrada.</div>;

  // Verifica se o Snapshot ID está disponível para as ações
  const isStructureReady = turma.estruturaSnapshotId !== undefined && turma.estruturaSnapshotId !== null;

  return (
    <div className="p-8 max-w-6xl mx-auto">
       <div className="flex justify-between items-center mb-6">
         <Link 
          href="/gestao/turmas" 
          className="text-gray-500 hover:text-gray-700 flex items-center gap-2"
        >
          <ArrowLeft size={20} /> Voltar para Turmas
        </Link>
        
        <div className="flex gap-3">
            {/* Botão de Avaliação */}
            <Link 
                href={isStructureReady ? `/gestao/turmas/${id}/avaliacao?estruturaId=${turma.estruturaSnapshotId}` : '#'}
                className={`bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2 text-sm font-medium transition shadow-sm ${!isStructureReady ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isStructureReady ? 'Lançar avaliações por aluno' : 'A estrutura de avaliação não foi definida.'}
            >
                <Send size={18} /> Avaliar Turma
            </Link>

            {/* Botão de Relatório */}
            <Link 
                href={isStructureReady ? `/gestao/turmas/${id}/relatorio?estruturaId=${turma.estruturaSnapshotId}` : '#'}
                className={`bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium transition shadow-sm ${!isStructureReady ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isStructureReady ? 'Gerar boletim e visualizar estatísticas' : 'A estrutura de avaliação não foi definida.'}
            >
                <BarChart size={18} /> Relatório/Boletim
            </Link>

            {/* Botão Importar Alunos */}
            <button 
                onClick={() => setShowImportador(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 text-sm font-medium transition shadow-sm"
            >
                <Download size={18} /> Importar Alunos (PDF)
            </button>
        </div>
       </div>

      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800">Turma: {turma.nome}</h1>
        <p className="text-gray-500 text-lg">Disciplina: {turma.nomeDisciplina} | {turma.anoSemestre} - {turma.termoAtual}º Termo</p>
        
        <div className="mt-4 flex gap-4 text-sm text-gray-600">
            <span className="bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1">
                <Users size={14} className='text-blue-500'/> <strong>{alunos.length}</strong> Alunos
            </span>
            <span className="bg-gray-100 px-3 py-1 rounded-full">
                Snapshot ID: <strong>{turma.estruturaSnapshotId}</strong>
            </span>
        </div>
      </div>
      
      {/* Lista de Alunos */}
      <h2 className="text-2xl font-bold text-gray-700 mb-4">Lista de Alunos</h2>
      
      {alunos.length === 0 ? (
          <div className="p-12 text-center bg-gray-50 rounded-lg border border-dashed text-gray-500">
              <UserPlus size={32} className="mx-auto mb-2"/>
              <p>Nenhum aluno cadastrado. Use a opção "Importar Alunos (PDF)" para carregar a lista.</p>
          </div>
      ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                      <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome do Aluno</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                      </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                      {alunos.map(aluno => (
                          <tr key={aluno.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {aluno.nome}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                    onClick={() => handleDeleteAluno(aluno.id, aluno.nome)}
                                    className="text-red-500 hover:text-red-700 transition"
                                >
                                    <Trash2 size={16} className='inline' /> Excluir
                                </button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      )}

      {/* Renderiza o Importador de Alunos como um modal */}
      {showImportador && (
        <ImportadorAlunos 
            turmaId={Number(id)}
            onClose={() => setShowImportador(false)}
            onSuccess={carregarDados} // Recarrega a lista de alunos
        />
      )}
    </div>
  );
}