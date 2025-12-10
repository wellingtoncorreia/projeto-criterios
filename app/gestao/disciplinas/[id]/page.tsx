'use client';

import { useState, useEffect, use } from 'react';
import { ArrowLeft, Edit, Upload, Wand2 } from 'lucide-react';
import Link from 'next/link';
import api from '@/app/services/api';
import Swal from 'sweetalert2';
import { Disciplina, Capacidade } from '@/app/types';
import GerenciadorCapacidades from './GerenciadorCapacidades';
import ImportadorInterativo from '@/app/components/forms/ImportadorIterativo';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Interface auxiliar para tipar os dados que passamos para o modal de edição
interface CapacidadeParaEdicao {
  id: string; // ID temporário para o React
  descricao: string;
  tipo: 'TECNICA' | 'SOCIOEMOCIONAL';
  criterios: {
    id: string;
    descricao: string;
    tipo: 'CRITICO' | 'DESEJAVEL';
  }[];
}

export default function DetalhesDisciplinaPage({ params }: PageProps) {
  const { id } = use(params);
  
  const [disciplina, setDisciplina] = useState<Disciplina | null>(null);
  const [capacidades, setCapacidades] = useState<Capacidade[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Novo estado para controlar se o modal está aberto e o modo de operação
  const [showImportador, setShowImportador] = useState(false);
  const [initialData, setInitialData] = useState<CapacidadeParaEdicao[] | null>(null);
  
  const [gerandoNiveis, setGerandoNiveis] = useState(false);

  async function carregarDados() {
    setLoading(true);
    try {
      const [resDisc, resCap] = await Promise.all([
        api.get(`/disciplinas/${id}`),
        // O backend retorna a estrutura aninhada, o que é perfeito
        api.get(`/disciplinas/${id}/capacidades`) 
      ]);
      setDisciplina(resDisc.data);
      setCapacidades(resCap.data);
    } catch (error) {
      console.error("Erro ao carregar disciplina:", error);
      Swal.fire('Erro', 'Não foi possível carregar os dados da disciplina.', 'error');
    } finally {
      setLoading(false);
    }
  }

  // Função para abrir o modal no modo EDIÇÃO
  function handleOpenEditor(mode: 'import' | 'edit') {
    if (mode === 'import') {
      // Modo Importação: Começa do zero (Passo 1: Upload)
      setInitialData(null);
      setShowImportador(true);
    } else {
      // Modo Edição: Mapeia dados existentes para o formato interno do modal
      const mappedData: CapacidadeParaEdicao[] = capacidades.map(cap => ({
        // Usamos o ID real aqui, mas o modal tratará como ID de controle
        id: cap.id.toString(), 
        descricao: cap.descricao,
        tipo: cap.tipo,
        criterios: cap.criterios?.map(crit => ({
          id: crit.id.toString(),
          descricao: crit.descricao,
          tipo: crit.tipo,
        })) || [],
      }));
      setInitialData(mappedData);
      setShowImportador(true);
    }
  }

  // Função para chamar a geração automática
  async function handleGerarNiveis() {
    const result = await Swal.fire({
      title: 'Gerar Níveis de Avaliação?',
      text: 'Isso apagará os níveis de avaliação atuais e gerará novos baseados nos critérios cadastrados.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sim, gerar',
      cancelButtonText: 'Cancelar'
    });
    
    if (!result.isConfirmed) return;
    
    setGerandoNiveis(true);
    try {
        await api.post(`/gestao/disciplinas/${id}/gerar-niveis`);
        Swal.fire('Sucesso!', 'Níveis gerados com sucesso! A régua de avaliação foi atualizada.', 'success');
    } catch (error) {
        Swal.fire('Erro', 'Erro ao gerar níveis.', 'error');
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
                onClick={() => handleOpenEditor('import')}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium transition shadow-sm"
            >
                <Upload size={18} /> Importar Planilha
            </button>

            {/* Botão Editar (Abre o modal no modo edição) */}
            <button 
                onClick={() => handleOpenEditor('edit')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 text-sm font-medium transition shadow-sm"
            >
                <Edit size={18} /> Editar Estrutura
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

      {/* Renderiza o Importador/Editor Interativo como um modal */}
      {showImportador && (
        <ImportadorInterativo 
            disciplinaId={Number(id)}
            initialData={initialData} // Passa os dados existentes para o modo edição
            nomeDisciplina={disciplina.nome} // Passa o nome para o cabeçalho
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