'use client';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { useImportadorAlunos } from '@/app/hooks/useImportadorAlunos';

interface Props { turmaId: number; onClose: () => void; onSuccess: () => void; }

export default function ImportadorAlunos({ turmaId, onClose, onSuccess }: Props) {
  const { file, loading, fileInputRef, handleFileChange, handleUpload } = useImportadorAlunos(turmaId, onSuccess, onClose);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
        <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
          <h3 className="font-bold flex items-center gap-2"><Upload size={20} /> Importar Alunos</h3>
          <button onClick={onClose} className="hover:bg-indigo-700 p-1 rounded-full"><X size={20} /></button>
        </div>
        <div className="p-6">
          <div className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${file ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'}`} onClick={() => fileInputRef.current?.click()}>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.xls,.xlsx" className="hidden" />
            {file ? (
              <div className="text-center"><FileText size={48} className="text-indigo-600 mx-auto mb-2" /><p className="font-medium text-gray-800">{file.name}</p><p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p></div>
            ) : (
              <div className="text-center"><Upload size={48} className="text-gray-300 mx-auto mb-2" /><p className="text-gray-600 font-medium">Clique para selecionar</p><p className="text-xs text-gray-400 mt-1">PDF ou Excel</p></div>
            )}
          </div>
          <button onClick={handleUpload} disabled={!file || loading} className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md">
            {loading ? <><Loader2 className="animate-spin" /> Processando...</> : 'Enviar Arquivo'}
          </button>
        </div>
      </div>
    </div>
  );
}