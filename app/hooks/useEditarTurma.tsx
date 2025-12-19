import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import api from '@/app/services/api';
import Swal from "sweetalert2";
import { Usuario } from '@/app/types';

interface TurmaData {
  id: number;
  nome: string;
  anoSemestre: string;
  termoAtual: number;
  professores: Usuario[];
}

export interface FormDataState {
  nome: string;
  anoSemestre: string;
  termoAtual: number;
}

export function useEditarTurma() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  // Estados
  const [loading, setLoading] = useState(true);
  const [professores, setProfessores] = useState<Usuario[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Estados do Formulário
  const [formData, setFormData] = useState<FormDataState>({ nome: "", anoSemestre: "", termoAtual: 1 });
  const [prof1, setProf1] = useState<string>("");
  const [prof2, setProf2] = useState<string>("");

  // 1. Carregar Dados e Permissões
  useEffect(() => {
    if (typeof window !== 'undefined') {
        setUserRole(localStorage.getItem('role') || sessionStorage.getItem('role'));
    }

    if (!id) {
      setLoading(false);
      return;
    }
    
    Promise.all([
        api.get<TurmaData>(`/turmas/${id}`),
        api.get<Usuario[]>('/admin/professores')
    ]).then(([resTurma, resProfs]) => {
        const t = resTurma.data;
        setFormData({ nome: t.nome, anoSemestre: t.anoSemestre, termoAtual: t.termoAtual });
        setProfessores(resProfs.data);

        if (t.professores && t.professores.length > 0) setProf1(t.professores[0].id.toString());
        if (t.professores && t.professores.length > 1) setProf2(t.professores[1].id.toString());

        setLoading(false);
    }).catch(err => {
        console.error(err);
        Swal.fire('Erro', 'Falha ao carregar dados da turma.', 'error');
        setLoading(false);
    });
  }, [id]);

  // 2. Salvar
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const profsSelecionados = [prof1, prof2].filter(p => p !== "");
    
    if (profsSelecionados.length < 1) { 
        return Swal.fire('Atenção', 'Selecione no mínimo 1 professor para a turma.', 'warning');
    }
    if (profsSelecionados.length > 2) {
        return Swal.fire('Erro', 'A turma pode ter no máximo 2 professores.', 'error');
    }
    if (prof1 === prof2 && profsSelecionados.length === 2) {
      return Swal.fire('Erro', 'O professor responsável e o co-responsável não podem ser a mesma pessoa.', 'error');
    }
    
    setLoading(true);

    try {
        await api.put(`/turmas/${id}`, {
            ...formData,
            professoresIds: profsSelecionados.map(p => Number(p))
        });
        
        await Swal.fire({
            icon: 'success',
            title: 'Turma Atualizada!',
            text: 'Os dados foram atualizados com sucesso.',
            showConfirmButton: false,
            timer: 1500
        });

        router.push('/gestao/turmas');
    } catch (err: any) {
        const msg = err.response?.data || 'Erro ao salvar.';
        Swal.fire('Erro', typeof msg === 'string' ? msg : 'Falha na comunicação com o servidor.', 'error');
    } finally {
        setLoading(false);
    }
  };

  return {
    id,
    loading,
    professores,
    formData, setFormData,
    prof1, setProf1,
    prof2, setProf2,
    handleSubmit,
    isGestor: userRole === 'GESTOR'
  };
}