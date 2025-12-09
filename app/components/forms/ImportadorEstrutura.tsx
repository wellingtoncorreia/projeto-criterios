'use client';

import { useState } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertTriangle, X } from 'lucide-react';
import api from '@/app/services/api';
import { useRouter } from 'next/navigation';

interface Props {
  disciplinaId: number;
  onSuccess?: () => void;
  onClose: () => void;
}

export default function ImportadorEstrutura({ disciplinaId, onSuccess, onClose }: Props) {
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
    formData.append('disciplinaId', disciplinaId.toString());

    try {
      const res = await api.post('/arquivos/importar-estrutura-completa', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessage({ text: res.data, type: 'success' });
      setFile(null);
      if (onSuccess) onSuccess();
      router.refresh(); 
    } catch (error: any) {
      console.error(error);
      const errorData = error.response?.data;
      let msg = 'Erro ao importar.';
      if (typeof errorData === 'string') msg = errorData;
      else if (errorData?.message) msg = errorData.message;
      setMessage({ text: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border-2 border-dashed border-blue-200 rounded-xl p-6 mb-8 text-center animate-in fade-in zoom-in-95">
      <div className="flex justify-end">
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X /></button>
      </div>
      
      <div className="flex justify-center mb-4">
        <div className="bg-blue-100 p-3 rounded-full text-blue-600">
            <FileSpreadsheet size={32} />
        </div>
      </div>

      <h3 className="text-lg font-bold text-gray-800 mb-2">Importar Planilha Mestre</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
        Suba um arquivo CSV com duas colunas: <strong>Capacidade</strong> e <strong>Critério</strong>. 
        O sistema criará toda a estrutura automaticamente.
      </p>

      <div className="flex flex-col items-center gap-4">
        <label className="cursor-pointer">
          <div className={`px-6 py-3 rounded-md border flex items-center gap-2 transition ${file ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-50 border-gray-300 hover:bg-gray-100'}`}>
            <UploadCloud size={20} />
            <span className="font-medium">{file ? file.name : 'Selecionar CSV'}</span>
            <input type="file" accept=".csv" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
        </label>
        
        {file && (
            <button 
            onClick={handleUpload} 
            disabled={loading}
            className="bg-blue-600 text-white px-8 py-2 rounded-md font-bold hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
            >
            {loading ? 'Processando...' : 'Iniciar Importação'}
            </button>
        )}
      </div>

      {message && (
        <div className={`mt-4 p-3 rounded text-sm inline-flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          {message.text}
        </div>
      )}
    </div>
  );
}