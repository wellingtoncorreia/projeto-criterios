'use client';
import Link from 'next/link';
import { Plus, Users, GraduationCap, UserCheck } from 'lucide-react';
import { Turma } from '@/app/types';

// Função para buscar dados (Server Side - verifique se o endpoint não precisa de autenticação ou use api client side se preferir)
// Nota: Em Next.js App Router Server Components, passar cookies/tokens pode ser chato. 
// Se der erro de auth, transforme em 'use client' e use o useEffect com o api.ts
async function getTurmas(): Promise<Turma[]> {
  try {
    // Atenção: fetch direto no server side precisa da URL completa
    // Se precisar de token, o ideal é fazer client-side ou usar headers()
    const res = await fetch('http://localhost:8080/api/turmas', { 
        cache: 'no-store',
        // headers: { Authorization: ... } // Caso precise de token no server side
    });
    if (!res.ok) return [];
    return res.json();
  } catch (err) {
    return [];
  }
}

// Para facilitar, vamos fazer Client Component para garantir o Token do localStorage
// Se preferir Server Component, precisa configurar a passagem de cookie

import { useEffect, useState } from 'react';
import api from '@/app/services/api';

export default function TurmasPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/turmas')
      .then(res => setTurmas(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

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
              
              <div className="border-t pt-4 mt-2 grid grid-cols-2 gap-2">
                <Link 
                  href={`/gestao/turmas/${t.id}`}
                  className="flex items-center justify-center gap-2 text-center bg-gray-50 text-blue-600 font-semibold py-2 rounded border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition text-sm"
                >
                  <Users size={16} /> Alunos
                </Link>

                <Link 
                  href={`/gestao/turmas/${t.id}/avaliacao`}
                  className="flex items-center justify-center gap-2 text-center bg-green-50 text-green-700 font-semibold py-2 rounded border border-green-200 hover:bg-green-100 hover:border-green-300 transition text-sm"
                >
                  <GraduationCap size={16} /> Avaliar
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