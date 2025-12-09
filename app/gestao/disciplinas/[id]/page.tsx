'use client';

import { useState, useEffect, use } from 'react';
import { ArrowLeft, Upload, Wand2 } from 'lucide-react';
import Link from 'next/link';
import api from '@/app/services/api';
import { Disciplina, Capacidade } from '@/app/types';
import GerenciadorCapacidades from './GerenciadorCapacidades';
import ImportadorInterativo from '@/app/components/forms/ImportadorIterativo';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DetalhesDisciplinaPage({ params }: PageProps) {
  const { id } = use(params);
  
  const [disciplina, setDisciplina] = useState<Disciplina | null>(null);
  const [capacidades, setCapacidades] = useState<Capacidade[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showImportador, setShowImportador] = useState(false);
  const [gerandoNiveis, setGerandoNiveis] = useState(false);

  async function carregarDados() {
    setLoading(true);
    try {
      const [resDisc, resCap] = await Promise.all([
        api.get(`/disciplinas/${id}`),
        api.get(`/disciplinas/${id}/capacidades`) 
      ]);
      setDisciplina(resDisc.data);
      setCapacidades(resCap.data);
    } catch (error) {
      console.error("Erro ao carregar disciplina:", error);
    } finally {
      setLoading(false);
    }
  }

  // Função para chamar a geração automática
  async function handleGerarNiveis() {
    if (!confirm("Isso apagará os níveis de avaliação atuais e gerará novos baseados nos critérios cadastrados. Continuar?")) return;
    
    setGerandoNiveis(true);
    try {
        await api.post(`/gestao/disciplinas/${id}/gerar-niveis`);
        alert("Níveis gerados com sucesso! A régua de avaliação foi atualizada.");
    } catch (error) {
        alert("Erro ao gerar níveis.");
        console.error(error);
    } finally {
        setGerandoNiveis(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, [id]);

  if (loading) return <div className="p-8 text-gray-500">Carregando dados da disciplina...</div>;
  if (!disciplina) return <div className="p-8 text-red-500">Disciplina não encontrada.</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
       <div className="flex justify-between items-center mb-6">
         <Link 
          href="/gestao/disciplinas" 
          className="text-gray-500 hover:text-gray-700 flex items-center gap-2"
        >
          <ArrowLeft size={20} /> Voltar para Lista
        </Link>

        <div className="flex gap-3">
            {/* Botão Gerar Níveis */}
            <button 
                onClick={handleGerarNiveis}
                disabled={gerandoNiveis}
                className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 flex items-center gap-2 text-sm font-medium transition shadow-sm disabled:opacity-50"
            >
                <Wand2 size={18} /> 
                {gerandoNiveis ? "Gerando..." : "Gerar Níveis Automáticos"}
            </button>

            {/* Botão Importar */}
            <button 
                onClick={() => setShowImportador(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium transition shadow-sm"
            >
                <Upload size={18} /> Importar Planilha
            </button>
        </div>
       </div>

      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800">{disciplina.nome}</h1>
        <p className="text-gray-500 text-lg">Sigla: {disciplina.sigla} | ID: {disciplina.id}</p>
        
        <div className="mt-4 flex gap-4 text-sm text-gray-600">
            <span className="bg-gray-100 px-3 py-1 rounded-full">
                <strong>{capacidades.length}</strong> Capacidades
            </span>
            <span className="bg-gray-100 px-3 py-1 rounded-full">
                <strong>{capacidades.reduce((acc, c) => acc + (c.criterios?.length || 0), 0)}</strong> Critérios
            </span>
        </div>
      </div>

      {showImportador && (
        <ImportadorInterativo 
            disciplinaId={Number(id)}
            onClose={() => setShowImportador(false)}
            onSuccess={() => {
                setShowImportador(false); 
                carregarDados();          
            }}
        />
      )}

      <GerenciadorCapacidades 
        disciplinaId={Number(id)} 
        capacidadesIniciais={capacidades} 
      />
    </div>
  );
}