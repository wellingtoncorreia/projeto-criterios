// app/types/index.ts
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

export interface Criterio {
    id: number; // Garante que o ID existe para o mapeamento de avaliação
    descricao: string;
    tipo: TipoCriterio;
    // Removendo a referência circular 'capacidade: Capacidade;'
}

export interface Capacidade {
    id: number;
    descricao: string;
    tipo: TipoCapacidade;
    // O backend precisa retornar critérios aninhados para o front-end
    criterios?: Criterio[]; 
}

export interface Avaliacao {
    id: number;
    atendeu: boolean;
    observacao: string;
    criterio: Criterio;
    // ... outros campos
}

// DTOs

// Renomeado de TurmaResponseDTO para Turma, para consistência, mas é o DTO de Resposta do Backend
export interface Turma {
  id: number;
  nome: string;
  anoSemestre: string;
  termoAtual: number;
  disciplinaId: number; // Referência ao Template
  estruturaSnapshotId: number; // [NOVO] Referência à "foto" imutável
  nomeDisciplina: string;
  professores: Usuario[];
  totalAlunos: number;
}

// [CORREÇÃO] Exportando o tipo de resposta do DTO (o mesmo de Turma)
export type TurmaResponseDTO = Turma; 

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

// Tipos auxiliares para ImportadorIterativo e comunicação entre componentes
export interface CritItemDTO { 
    id: string | number; // ID pode ser string (temp) ou number (final)
    descricao: string; 
    tipo: TipoCriterio; 
}
export interface CapItemDTO { 
    id: string | number; 
    descricao: string; 
    tipo: TipoCapacidade; 
    criterios: CritItemDTO[]; 
}