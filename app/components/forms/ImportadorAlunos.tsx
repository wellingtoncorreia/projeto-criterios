'use client';

import { useState } from 'react';
import { UploadCloud, X, Loader2 } from 'lucide-react';
import api from '@/app/services/api';
import Swal from 'sweetalert2';

// [CORRIGIDO] Interface de Props definida para resolver o erro de tipagem no page.tsx
interface Props {
    turmaId: number;
    onClose: () => void;
    onSuccess: () => Promise<void>;
}

export default function ImportadorAlunos({ turmaId, onClose, onSuccess }: Props) {
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
            const res = await api.post('/arquivos/importar-alunos', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setMessage({ text: res.data, type: 'success' });
            setFile(null);
            await onSuccess(); // Chamada para atualizar a lista de alunos
        } catch (error: any) {
            console.error(error);
            const errorData = error.response?.data;
            let msg = 'Erro ao importar. Verifique se o arquivo PDF é válido e contém a matrícula e nome.';
            if (typeof errorData === 'string') msg = errorData;
            else if (errorData?.message) msg = errorData.message;
            setMessage({ text: msg, type: 'error' });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95">
                <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                        <UploadCloud size={24} className="text-blue-600"/> Importar Alunos
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
                </div>
                
                <div className="border-t border-gray-100 pt-4 mt-4">
                    <p className="text-sm text-gray-500 mb-6">
                        Suba um arquivo PDF de listagem de alunos (Ex: Lista de chamada). O sistema tentará extrair a matrícula e o nome.
                    </p>

                    <div className="flex flex-col items-center gap-4">
                        <label className="cursor-pointer w-full">
                        <div className={`px-6 py-3 rounded-md border flex items-center justify-center gap-2 transition ${file ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-50 border-gray-300 hover:bg-gray-100'}`}>
                            <UploadCloud size={20} />
                            <span className="font-medium truncate">{file ? file.name : 'Selecionar Arquivo PDF'}</span>
                            <input 
                                type="file" 
                                accept="application/pdf" 
                                className="hidden" 
                                onChange={(e) => setFile(e.target.files?.[0] || null)} 
                                disabled={loading}
                            />
                        </div>
                        </label>
                        
                        {file && (
                            <button 
                            onClick={handleUpload} 
                            disabled={loading}
                            className="w-full bg-blue-600 text-white px-8 py-2 rounded-md font-bold hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
                            >
                            {loading ? <Loader2 size={20} className="animate-spin mx-auto"/> : 'Iniciar Importação'}
                            </button>
                        )}
                    </div>
                </div>

                {message && (
                    <div className={`mt-4 p-3 rounded text-sm inline-flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {message.text}
                    </div>
                )}
            </div>
        </div>
    );
}