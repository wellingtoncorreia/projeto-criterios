import { useState, useRef } from 'react';
import Swal from 'sweetalert2';

// Ajuste a URL base conforme seu ambiente
const BASE_URL = 'http://localhost:8080/api';

export function useImportadorAlunos(turmaId: number, onSuccess: () => void, onClose: () => void) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      // ROTA CORRIGIDA PARA O SEU CONTROLLER
      const response = await fetch(`${BASE_URL}/arquivos/importar-alunos?turmaId=${turmaId}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
      });

      if (!response.ok) {
          const msg = await response.text();
          throw new Error(msg || "Erro ao enviar arquivo.");
      }
      
      Swal.fire('Sucesso!', 'Alunos importados com sucesso.', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      Swal.fire('Erro', err.message, 'error');
    } finally { setLoading(false); }
  };

  return { file, loading, fileInputRef, handleFileChange, handleUpload };
}