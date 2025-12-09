'use client';

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, UserCheck } from "lucide-react";
import api from '@/app/services/api';
import Swal from "sweetalert2";

export default function EditarTurmaPage() {
  const params = useParams();
  const [id, setId] = useState<string | null>(null);
  const [paramsLoaded, setParamsLoaded] = useState(false);

  // Sincroniza id quando params mudar
  useEffect(() => {
    if (params?.id) {
      setId(params.id as string);
      setParamsLoaded(true);
    }
  }, [params]);

  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Estados
  const [formData, setFormData] = useState({ nome: "", anoSemestre: "", termoAtual: 1 });
  const [professores, setProfessores] = useState<any[]>([]);
  const [prof1, setProf1] = useState("");
  const [prof2, setProf2] = useState("");

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    
    Promise.all([
        api.get(`/turmas/${id}`),       // Dados da Turma
        api.get('/admin/professores')   // Lista de Professores
    ]).then(([resTurma, resProfs]) => {
        const t = resTurma.data;
        setFormData({ nome: t.nome, anoSemestre: t.anoSemestre, termoAtual: t.termoAtual });
        setProfessores(resProfs.data);

        // Preenche os selects com os professores atuais
        if (t.professores && t.professores.length > 0) setProf1(t.professores[0].id);
        if (t.professores && t.professores.length > 1) setProf2(t.professores[1].id);

        setLoading(false);
    }).catch(err => {
        console.error(err);
        Swal.fire('Erro', 'Falha ao carregar dados.', 'error');
    });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prof1 || !prof2) return Swal.fire('Atenção', 'Selecione 2 professores.', 'warning');
    if (prof1 === prof2) return Swal.fire('Erro', 'Os professores devem ser diferentes.', 'error');

    try {
        await api.put(`/turmas/${id}`, {
            ...formData,
            professoresIds: [Number(prof1), Number(prof2)]
        });
        Swal.fire('Sucesso', 'Turma atualizada!', 'success');
        router.push('/gestao/turmas');
    } catch (err) {
        Swal.fire('Erro', 'Erro ao salvar.', 'error');
    }
  };

  if (!paramsLoaded) return <div className="p-8 text-center text-gray-400">Carregando...</div>;
  if (loading) return <div className="p-8 text-center">Carregando dados da turma...</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
        {/* ... (Header e Botão Voltar igual ao Nova Turma) ... */}
        
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow border border-gray-200 space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 border-b pb-4">Editar Turma</h1>
            
            {/* Campos Nome, Ano, Termo (Igual Nova Turma) */}
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="text-sm font-bold text-gray-600">Nome</label>
                    <input className="w-full p-2 border rounded" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
                </div>
                {/* ... outros inputs ... */}
            </div>

            {/* Professores */}
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h3 className="font-bold text-gray-700 mb-3 flex gap-2"><UserCheck size={18}/> Professores</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs uppercase font-bold text-gray-500">Titular</label>
                        <select className="w-full p-2 border rounded" value={prof1} onChange={e => setProf1(e.target.value)}>
                            {professores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs uppercase font-bold text-gray-500">Substituto</label>
                        <select className="w-full p-2 border rounded" value={prof2} onChange={e => setProf2(e.target.value)}>
                            {professores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <button className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700">Salvar Alterações</button>
        </form>
    </div>
  );
}