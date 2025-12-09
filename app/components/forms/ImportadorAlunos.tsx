'use client';

import { useState } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '@/app/services/api';
import { useRouter } from 'next/navigation';

interface Props {
  turmaId: number;
}

export default function ImportadorAlunos({ turmaId }: Props) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('turmaId', turmaId.toString());

    try {
      // Endpoint mapeado no seu ArquivoController.java
      const res = await api.post('/arquivos/importar-alunos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Sucesso
      setMessage({ text: res.data || 'Importação concluída com sucesso!', type: 'success' });
      setFile(null);
      router.refresh(); // Atualiza a lista de alunos na página pai

    } catch (error: any) {
      console.error("Erro no upload:", error);

      // --- CORREÇÃO DO ERRO DE OBJETO ---
      const errorData = error.response?.data;
      let msg = 'Erro ao importar arquivo.';

      // Verifica se o erro veio como string simples
      if (typeof errorData === 'string') {
        msg = errorData;
      } 
      // Verifica se é um objeto Spring Boot com campo 'message'
      else if (errorData?.message) {
        msg = errorData.message;
      } 
      // Verifica se é um objeto com campo 'error'
      else if (errorData?.error) {
        msg = errorData.error;
      }

      setMessage({ text: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-8">
      <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
        <UploadCloud size={20} /> Importar Alunos via PDF
      </h3>
      <p className="text-sm text-blue-700 mb-4">
        Faça upload da lista de chamada (PDF) para cadastrar os alunos automaticamente nesta turma.
      </p>

      <div className="flex items-center gap-4">
        <label className="flex-1 cursor-pointer">
          <div className={`border-2 border-dashed rounded-md p-3 flex items-center justify-center gap-2 transition ${file ? 'border-green-400 bg-green-50 text-green-700' : 'border-blue-300 hover:bg-blue-100 text-blue-500'}`}>
            <FileText size={20} />
            <span className="text-sm font-medium truncate">
              {file ? file.name : 'Clique para selecionar o PDF'}
            </span>
            <input 
              type="file" 
              accept="application/pdf" 
              className="hidden" 
              onChange={(e) => setFile(e.target.files?.[0] || null)} 
            />
          </div>
        </label>
        
        <button 
          onClick={handleUpload} 
          disabled={!file || loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Processando...' : 'Enviar'}
        </button>
      </div>

      {message && (
        <div className={`mt-4 p-3 rounded text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          {message.text}
        </div>
      )}
    </div>
  );
}