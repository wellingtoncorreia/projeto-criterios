'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, User, Trash2, Plus, Save, X, FileBarChart } from 'lucide-react';
import api from '@/app/services/api';
import ImportadorAlunos from '@/app/components/forms/ImportadorAlunos';
import Swal from 'sweetalert2'; // [NOVO]

interface Aluno { id: number; nome: string; }
interface Turma { id: number; nome: string; anoSemestre: string; }

export default function DetalhesTurmaPage() {
  const params = useParams();
  const id = params?.id as string;
  
  const [turma, setTurma] = useState<Turma | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [novoAlunoNome, setNovoAlunoNome] = useState("");

  async function carregarDados() {
    if (!id) return;
    try {
        const [resTurmas, resAlunos] = await Promise.all([
            api.get('/turmas'),
            api.get(`/turmas/${id}/alunos`)
        ]);
        const turmaAtual = resTurmas.data.find((t: Turma) => t.id === Number(id));
        setTurma(turmaAtual);
        setAlunos(resAlunos.data);
    } catch (error) {
        console.error(error);
        Swal.fire('Erro', 'Erro ao carregar dados da turma.', 'error');
    } finally {
        setLoading(false);
    }
  }

  useEffect(() => { carregarDados(); }, [id]);

  async function adicionarAluno() {
    if (!novoAlunoNome.trim()) return;
    try {
        await api.post('/alunos', {
            nome: novoAlunoNome.toUpperCase(),
            turma: { id: Number(id) }
        });
        setNovoAlunoNome("");
        setShowAddForm(false);
        carregarDados();
        // Toast discreto de sucesso
        Swal.fire({
            icon: 'success',
            title: 'Aluno adicionado!',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000
        });
    } catch (error) {
        Swal.fire('Erro', 'Não foi possível adicionar o aluno.', 'error');
    }
  }

  async function removerAluno(alunoId: number) {
    // [NOVO] Confirmação estilizada
    const result = await Swal.fire({
        title: 'Tem certeza?',
        text: "O aluno e todo o histórico de avaliações dele serão apagados.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sim, remover',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            await api.delete(`/alunos/${alunoId}`);
            carregarDados();
            Swal.fire('Removido!', 'O aluno foi removido da turma.', 'success');
        } catch (error) {
            Swal.fire('Erro', 'Não foi possível remover o aluno.', 'error');
        }
    }
  }

  if (loading) return <div className="p-8 text-gray-500">Carregando dados...</div>;
  if (!turma) return <div className="p-8 text-red-500">Turma não encontrada.</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <Link href="/gestao/turmas" className="text-gray-500 hover:text-gray-700 flex items-center gap-2 text-sm">
            <ArrowLeft size={20} /> Voltar para Lista
        </Link>
        <Link href={`/gestao/turmas/${id}/relatorio`} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2 shadow-sm font-medium transition">
            <FileBarChart size={18} /> Ver Relatório de Notas
        </Link>
      </div>

      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800">{turma.nome}</h1>
        <p className="text-gray-500 text-lg">{turma.anoSemestre} • Total de Alunos: {alunos.length}</p>
      </div>

      <ImportadorAlunos turmaId={Number(id)} />

      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200 mt-8">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-sm font-bold text-gray-700 uppercase">Lista de Chamada</h2>
          <button onClick={() => setShowAddForm(true)} className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded flex items-center gap-1 hover:bg-blue-700 transition shadow-sm">
            <Plus size={16} /> Novo Aluno
          </button>
        </div>

        {showAddForm && (
            <div className="p-4 bg-blue-50 border-b border-blue-100 flex gap-2 animate-in slide-in-from-top-2 items-center">
                <User size={18} className="text-blue-400" />
                <input autoFocus placeholder="Nome do Aluno..." className="flex-1 p-2 border rounded text-sm focus:ring-2 focus:ring-blue-300 outline-none" value={novoAlunoNome} onChange={e => setNovoAlunoNome(e.target.value)} onKeyDown={e => e.key === 'Enter' && adicionarAluno()}/>
                <button onClick={adicionarAluno} className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 flex items-center gap-1"><Save size={16} /> Salvar</button>
                <button onClick={() => setShowAddForm(false)} className="bg-gray-200 text-gray-600 px-3 py-2 rounded text-sm hover:bg-gray-300"><X size={16} /></button>
            </div>
        )}
        
        {alunos.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {alunos.map((aluno) => (
              <li key={aluno.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 group transition">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-xs font-bold">{aluno.nome.charAt(0)}</div>
                    <span className="font-medium text-gray-800">{aluno.nome}</span>
                </div>
                <button onClick={() => removerAluno(aluno.id)} className="text-gray-300 hover:text-red-500 p-2 rounded hover:bg-red-50 transition opacity-0 group-hover:opacity-100" title="Remover Aluno"><Trash2 size={18} /></button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <User size={48} className="text-gray-300 mb-2" />
            <p>Nenhum aluno nesta turma.</p>
          </div>
        )}
      </div>
    </div>
  );
}