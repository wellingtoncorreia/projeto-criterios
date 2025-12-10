'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft } from 'lucide-react';
import api from '@/app/services/api';
import Link from 'next/link';
import Swal from 'sweetalert2';

export default function NovaDisciplinaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      nome: formData.get('nome'),
      sigla: formData.get('sigla'),
      periodicidade: formData.get('periodicidade'),
      termo: Number(formData.get('termo')),
    };

    try {
      await api.post('/disciplinas', data);
      Swal.fire('Sucesso!', 'Disciplina criada com sucesso!', 'success');
      router.push('/gestao/disciplinas');
      router.refresh(); 
    } catch (error) {
      Swal.fire('Erro', 'Erro ao criar disciplina.', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/gestao/disciplinas" className="text-gray-500 hover:text-gray-700 flex items-center gap-2 mb-6">
        <ArrowLeft size={20} /> Voltar
      </Link>

      <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Nova Disciplina</h1>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Disciplina</label>
            <input name="nome" required placeholder="Ex: Banco de Dados" className="w-full p-3 border rounded-md" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sigla</label>
                <input name="sigla" required placeholder="Ex: BDD" className="w-full p-3 border rounded-md" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Termo (Semestre)</label>
                <select name="termo" className="w-full p-3 border rounded-md bg-white">
                    <option value="1">1º Termo</option>
                    <option value="2">2º Termo</option>
                    <option value="3">3º Termo</option>
                    <option value="4">4º Termo</option>
                </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Periodicidade</label>
            <select name="periodicidade" className="w-full p-3 border rounded-md bg-white">
                <option value="SEMESTRAL">Semestral</option>
                <option value="ANUAL">Anual</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="mt-4 bg-green-600 text-white p-3 rounded-md hover:bg-green-700 flex justify-center items-center gap-2 font-semibold">
            {loading ? 'Salvando...' : <><Save size={20} /> Salvar Disciplina</>}
          </button>
        </form>
      </div>
    </div>
  );
}