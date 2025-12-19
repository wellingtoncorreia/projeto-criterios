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

// Adicione/Atualize estas interfaces no seu arquivo existente

export interface Professor {
  id: number;
  nome: string;
  email: string;
}

export interface Turma {
  id: number;
  nome: string;
  anoSemestre: string;
  termoAtual: number;
  disciplinaId?: number;
  nomeDisciplina?: string; // Para exibição
  estruturaSnapshotId?: number;
  professores?: Professor[];
}

export interface Disciplina {
  id: number;
  nome: string;
}

// Interface que estava solta no Dashboard
export interface Boletim { 
  nomeAluno: string; 
  nivelAlcancado: number; 
}

// Interface que estava solta em Turmas
export interface DisciplinaOpcao extends Disciplina {
  snapshotId: number | null;
  status: 'PRONTO' | 'SEM_SNAPSHOT' | 'CARREGANDO';
}

// Interfaces para Gráficos do Dashboard (opcional, mas bom para tipar o hook)
export interface DashboardKPIs {
  mediaGeral: string;
  aprovados: number;
  retidos: number;
  totalAlunos: number;
}

export interface ChartDataFaixa {
  name: string;
  alunos: number;
}

export interface ChartDataStatus {
  name: string;
  value: number;
}

// --- Mantenha os tipos existentes (Usuario, Disciplina, etc) e ADICIONE/ATUALIZE estes: ---

// Tipos para Importação/Edição
export interface CapacidadeEdicaoDTO {
  id: string;
  descricao: string;
  tipo: 'TECNICA' | 'SOCIOEMOCIONAL';
  criterios: {
    id: string;
    descricao: string;
    tipo: 'CRITICO' | 'DESEJAVEL';
  }[];
}

// Auxiliar para criação de critérios
export interface NovoCriterioDTO {
    id: string;
    descricao: string;
    tipo: TipoCriterio;
    capacidadeId: number;
}

// Tipos para Avaliação
export interface AvaliacaoEstado {
  atendeu: boolean | null;
  obs: string;
  finalizada: boolean | undefined;
}

export interface DisciplinaDisponivel extends Disciplina {
  avaliacaoId: number; 
  isPrincipal: boolean;
}

// Relatórios
export interface BoletimRelatorio {
  nomeAluno: string;
  qtdCriticosAtendidos: number;
  qtdDesejaveisAtendidos: number;
  totalCriticosDisciplina: number;
  totalDesejaveisDisciplina: number;
  nivelAlcancado: number;
  percentualConclusao: number;
}

export interface NivelRegra {
  id: number;
  nivel: number;
  minCriticos: number;
  minDesejaveis: number;
}

export interface DisciplinaComSnapshot extends Disciplina {
  snapshotId: number | null;
  isPrincipal: boolean;
}