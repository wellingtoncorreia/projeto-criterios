'use client';

import { useState } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertTriangle, X } from 'lucide-react';
import api from '@/app/services/api'; // Ajuste conforme seu caminho de API
import { useRouter } from 'next/navigation';

interface Props {
  capacidadeId: number;
  onSuccess?: () => void;
  onCancel: () => void;
}

export default function ImportadorCriterios({ capacidadeId, onSuccess, onCancel }: Props) {
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
    formData.append('capacidadeId', capacidadeId.toString());

    try {
      const res = await api.post('/arquivos/importar-criterios', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessage({ text: res.data || 'Critérios importados!', type: 'success' });
      setFile(null);
      if (onSuccess) onSuccess();
      router.refresh(); 
    } catch (error: any) {
      console.error(error);
      const errorData = error.response?.data;
      let msg = 'Erro ao importar.';
      
      if (typeof errorData === 'string') {
        msg = errorData;
      } else if (errorData?.message) {
        msg = errorData.message;
      } else if (errorData?.error) {
        msg = errorData.error;
      }
      
      setMessage({ text: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mt-2 mb-4 animate-in fade-in slide-in-from-top-2 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div>
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <UploadCloud size={16} /> Importar Critérios em Lote
            </h3>
            <p className="text-xs text-gray-500 mt-1">
                Suporta arquivo .txt ou .csv. Um critério por linha.<br/>
                Para desejáveis, use o formato: <code>Descrição do critério;DESEJAVEL</code>
            </p>
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
      </div>

      <div className="flex items-center gap-2">
        <label className="flex-1 cursor-pointer">
          <div className={`border border-dashed rounded px-3 py-2 flex items-center gap-2 text-xs transition ${file ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-300 hover:bg-white text-gray-500'}`}>
            <FileText size={14} />
            <span className="truncate">{file ? file.name : 'Clique para selecionar arquivo...'}</span>
            <input type="file" accept=".txt,.csv" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
        </label>
        
        <button 
          onClick={handleUpload} 
          disabled={!file || loading}
          className="bg-blue-600 text-white px-4 py-2 rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Enviando...' : 'Enviar'}
        </button>
      </div>

      {message && (
        <div className={`mt-3 p-2 rounded text-xs flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.type === 'success' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
          {message.text}
        </div>
      )}
    </div>
  );
}