'use client'; // Client Component para usar interatividade

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import api from '@/app/services/api';
import { Disciplina } from '@/app/types';
import Swal from 'sweetalert2';

export default function DisciplinasPage() {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [loading, setLoading] = useState(true);

  // Função para carregar
  async function carregarDisciplinas() {
    try {
        const res = await api.get('/disciplinas');
        setDisciplinas(res.data);
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  }

  useEffect(() => {
    carregarDisciplinas();
  }, []);

  // Função de Excluir com SweetAlert2
  async function handleDelete(id: number, nome: string) {
    const result = await Swal.fire({
        title: 'Excluir Disciplina?',
        text: `Você está prestes a apagar "${nome}". Isso excluirá também todas as capacidades, critérios e notas lançadas para ela.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sim, excluir tudo',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            await api.delete(`/disciplinas/${id}`);
            
            await Swal.fire(
                'Excluída!',
                'A disciplina e seus dados foram removidos.',
                'success'
            );
            
            // Atualiza a lista localmente
            carregarDisciplinas();
        } catch (error) {
            console.error(error);
            Swal.fire('Erro', 'Não foi possível excluir a disciplina.', 'error');
        }
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando disciplinas...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestão de Disciplinas</h1>
        <Link 
          href="/gestao/disciplinas/nova" 
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 shadow-sm font-medium"
        >
          <Plus size={20} />
          Nova Disciplina
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-gray-700 uppercase text-sm font-semibold">
            <tr>
              <th className="p-4 border-b w-20">ID</th>
              <th className="p-4 border-b">Nome</th>
              <th className="p-4 border-b w-24">Sigla</th>
              <th className="p-4 border-b w-24 text-center">Termo</th>
              <th className="p-4 border-b w-40 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {disciplinas.length > 0 ? (
              disciplinas.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors border-b last:border-b-0">
                  <td className="p-4 text-gray-600">#{d.id}</td>
                  <td className="p-4 font-medium text-gray-800">
                    {d.nome}
                    <div className="text-xs text-gray-400 font-normal mt-0.5">{d.periodicidade}</div>
                  </td>
                  <td className="p-4">
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold">
                      {d.sigla || 'N/A'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-bold border border-indigo-100">
                      {d.termo}º
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-3">
                      <Link href={`/gestao/disciplinas/${d.id}`} title="Ver Detalhes/Capacidades">
                        <Eye className="text-blue-500 hover:text-blue-700 cursor-pointer" size={20} />
                      </Link>
                      
                      {/* Botão de Excluir */}
                      <button 
                        onClick={() => handleDelete(d.id, d.nome)} 
                        title="Excluir" 
                        className="text-red-500 hover:text-red-700 transition"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-12 text-center text-gray-500 bg-gray-50">
                  Nenhuma disciplina encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}