// Tipos de Entidades Base

export type TipoUsuario = 'GESTOR' | 'PROFESSOR';
export type TipoCriterio = 'CRITICO' | 'DESEJAVEL';
export type TipoCapacidade = 'TECNICA' | 'SOCIOEMOCIONAL';

export interface Usuario {
    id: number;
    nome: string;
    email: string;
    tipo: TipoUsuario;
}

export interface Disciplina {
    id: number;
    nome: string;
    sigla: string;
    periodicidade: 'ANUAL' | 'SEMESTRAL';
    termo: number;
}

export interface Capacidade {
    id: number;
    descricao: string;
    tipo: TipoCapacidade;
    // O backend não retorna o objeto disciplina, mas sim o vínculo.
    // Para edição, precisamos dos critérios aninhados.
    criterios?: Criterio[]; 
}

export interface Criterio {
    id: number;
    descricao: string;
    tipo: TipoCriterio;
    capacidade: Capacidade;
    // O backend retorna getDisciplinaId(), mas vamos usar a EstruturaDisciplina
}

export interface Avaliacao {
    id: number;
    atendeu: boolean;
    observacao: string;
    criterio: Criterio;
    // ... outros campos
}

// DTOs

export interface Turma {
    id: number;
    nome: string;
    anoSemestre: string;
    termoAtual: number;
    professores: Usuario[];
    totalAlunos: number;
    // [NOVO VERSIONAMENTO] Campos do Snapshot (EstruturaDisciplina)
    disciplinaId: number; // ID da Disciplina TEMPLATE
    estruturaSnapshotId: number; // ID da Estrutura Imutável (Snapshot) <-- ADICIONADO
    nomeDisciplina: string; // Nome da Disciplina TEMPLATE (para exibição)
     estruturaDisciplina?: {
    id: number;
  };
}

export interface Aluno {
    id: number;
    nome: string;
    turma: Turma;
    avaliacoes: Avaliacao[];
}

export interface ResultadoBoletim {
  nomeAluno: string;
  nomeDisciplina: string;
  qtdCriticosAtendidos: number;
  qtdDesejaveisAtendidos: number;
  totalCriticosDisciplina: number;
  totalDesejaveisDisciplina: number;
  nivelAlcancado: number;
  percentualConclusao: number;
}