'use client';
import Link from 'next/link';
import { Plus, Users, GraduationCap, UserCheck, Edit, Trash2 } from 'lucide-react'; // Adicionado Trash2
import { Turma } from '@/app/types';

import { useEffect, useState } from 'react';
import api from '@/app/services/api';
import Swal from 'sweetalert2'; // Importado Swal

export default function TurmasPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);

  // Função para recarregar as turmas
  async function carregarTurmas() {
    try {
      const res = await api.get('/turmas');
      setTurmas(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire('Erro', 'Não foi possível carregar a lista de turmas.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarTurmas();
  }, []);

  // [NOVA FUNÇÃO] Manipulador de Exclusão
  async function handleDelete(id: number, nome: string) {
    const result = await Swal.fire({
      title: 'Excluir Turma?',
      text: `Você está prestes a apagar a turma "${nome}". Isso EXCLUIRÁ PERMANENTEMENTE a turma, todos os alunos e todo o histórico de avaliações vinculados.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, excluir permanentemente',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/turmas/${id}`);
        
        await Swal.fire(
          'Excluída!',
          'A turma foi removida com sucesso.',
          'success'
        );
        
        // Atualiza a lista
        carregarTurmas();
      } catch (error) {
        console.error(error);
        Swal.fire('Erro', 'Não foi possível excluir a turma.', 'error');
      }
    }
  }

  if(loading) return <div className="p-8 text-center text-gray-500">Carregando turmas...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-bold text-gray-800">Gestão de Turmas</h1>
            <p className="text-gray-500">Visualize turmas e seus professores responsáveis.</p>
        </div>
        <Link 
          href="/gestao/turmas/nova" 
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 shadow-sm"
        >
          <Plus size={20} />
          Nova Turma
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {turmas.length > 0 ? (
          turmas.map((t) => (
            <div key={t.id} className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{t.nome}</h3>
                    <div className="flex gap-2 mt-1">
                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {t.anoSemestre}
                        </span>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                        {t.termoAtual}º Termo
                        </span>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-2 rounded-full text-blue-600">
                    <Users size={24} />
                  </div>
                </div>

                {/* Lista de Professores */}
                <div className="mb-4">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                        <UserCheck size={14}/> Docentes
                    </p>
                    <div className="flex flex-col gap-1">
                        {t.professores && t.professores.length > 0 ? (
                            t.professores.map(prof => (
                                <div key={prof.id} className="text-sm text-gray-700 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                                        {prof.nome.charAt(0)}
                                    </div>
                                    <span className="truncate">{prof.nome}</span>
                                </div>
                            ))
                        ) : (
                            <span className="text-sm text-red-400 italic">Sem professores</span>
                        )}
                    </div>
                </div>
              </div>
              
              {/* Seção de Ações: Agora com 4 colunas (Editar, Excluir, Alunos, Avaliar) */}
              <div className="border-t pt-4 mt-2 grid grid-cols-4 gap-2">
                
                {/* Botão de Editar */}
                <Link 
                    href={`/gestao/turmas/${t.id}/editar`}
                    className="flex items-center justify-center gap-1 text-center bg-yellow-50 text-yellow-700 font-semibold py-2 rounded border border-yellow-200 hover:bg-yellow-100 hover:border-yellow-300 transition text-xs"
                    title="Editar Turma"
                >
                    <Edit size={14} /> Editar
                </Link>

                {/* Botão de Excluir */}
                <button
                    onClick={() => handleDelete(t.id, t.nome)}
                    className="flex items-center justify-center gap-1 text-center bg-red-50 text-red-700 font-semibold py-2 rounded border border-red-200 hover:bg-red-100 hover:border-red-300 transition text-xs"
                    title="Excluir Turma e Dados"
                >
                    <Trash2 size={14} /> Excluir
                </button>

                {/* Link para Alunos */}
                <Link 
                  href={`/gestao/turmas/${t.id}`}
                  className="flex items-center justify-center gap-1 text-center bg-gray-50 text-blue-600 font-semibold py-2 rounded border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition text-xs"
                  title="Gerenciar Alunos"
                >
                  <Users size={14} /> Alunos
                </Link>

                {/* Link para Avaliação */}
                <Link 
                  href={`/gestao/turmas/${t.id}/avaliacao`}
                  className="flex items-center justify-center gap-1 text-center bg-green-50 text-green-700 font-semibold py-2 rounded border border-green-200 hover:bg-green-100 hover:border-green-300 transition text-xs"
                  title="Lançar Notas"
                >
                  <GraduationCap size={14} /> Avaliar
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded border border-dashed text-gray-500">
            Nenhuma turma cadastrada ou encontrada para seu usuário.
          </div>
        )}
      </div>
    </div>
  );
}