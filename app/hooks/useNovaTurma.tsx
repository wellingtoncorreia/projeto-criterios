import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from '@/app/services/api';
import Swal from "sweetalert2";
import { Usuario, Disciplina } from '@/app/types';

export function useNovaTurma() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [professores, setProfessores] = useState<Usuario[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  
  // Form State
  const [formData, setFormData] = useState({ nome: "", anoSemestre: "", termoAtual: 1, disciplinaTemplateId: null as number | null });
  const [prof1, setProf1] = useState<string>("");
  const [prof2, setProf2] = useState<string>("");

  useEffect(() => {
    Promise.all([
        api.get<Usuario[]>('/admin/professores'),
        api.get<Disciplina[]>('/disciplinas')
    ]).then(([resProfs, resDiscs]) => {
        setProfessores(resProfs.data);
        setDisciplinas(resDiscs.data);
        if (resDiscs.data.length > 0) {
            setFormData(prev => ({ ...prev, disciplinaTemplateId: resDiscs.data[0].id }));
        }
        setLoading(false);
    }).catch(err => {
        console.error(err);
        Swal.fire('Erro', 'Falha ao carregar dados iniciais.', 'error');
        setLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.disciplinaTemplateId === null) return Swal.fire('Atenção', 'Selecione uma Disciplina Template.', 'warning');

    const profs = [prof1, prof2].filter(p => p !== "");
    if (profs.length < 1) return Swal.fire('Atenção', 'Selecione no mínimo 1 professor.', 'warning');
    if (prof1 === prof2 && profs.length === 2) return Swal.fire('Erro', 'Professores iguais.', 'error');
    
    setLoading(true);
    try {
        await api.post('/turmas', { ...formData, professoresIds: profs.map(Number) });
        await Swal.fire({ icon: 'success', title: 'Turma Criada!', showConfirmButton: false, timer: 1500 });
        router.push('/gestao/turmas');
    } catch (err: any) {
        Swal.fire('Erro', err.response?.data || 'Erro ao salvar.', 'error');
    } finally { setLoading(false); }
  };

  return { loading, professores, disciplinas, formData, setFormData, prof1, setProf1, prof2, setProf2, handleSubmit };
}