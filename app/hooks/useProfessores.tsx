import { useState, useEffect } from 'react';
import api from '@/app/services/api';
import Swal from 'sweetalert2';
import { Usuario } from '@/app/types';

export function useProfessores() {
  const [professores, setProfessores] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [formData, setFormData] = useState({ nome: '', email: '', senha: '' });

  const carregarProfessores = async () => {
    try {
        const res = await api.get('/admin/professores');
        setProfessores(res.data);
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { carregarProfessores(); }, []);

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        await api.post('/admin/usuarios', { ...formData, tipo: 'PROFESSOR' });
        Swal.fire('Sucesso', 'Professor cadastrado com sucesso!', 'success');
        setFormData({ nome: '', email: '', senha: '' });
        carregarProfessores();
    } catch (error: any) {
        Swal.fire('Erro', error.response?.data || 'Falha ao cadastrar.', 'error');
    }
  };

  return { professores, loading, formData, setFormData, handleCadastro };
}