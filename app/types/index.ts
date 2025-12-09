// Enums baseados nos seus arquivos Java
export type TipoCapacidade = 'TECNICA' | 'SOCIOEMOCIONAL';
export type TipoCriterio = 'CRITICO' | 'DESEJAVEL';

export type Periodicidade = 'ANUAL' | 'SEMESTRAL';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  tipo: 'GESTOR' | 'PROFESSOR';
}

export interface Disciplina {
  id: number;
  nome: string;
  sigla?: string;
  periodicidade: Periodicidade;
  termo: number; // 1, 2, 3, 4
  capacidades?: Capacidade[];
  niveis?: NivelAvaliacao[];
}

export interface Turma {
  id: number;
  nome: string;
  anoSemestre: string;
  termoAtual: number;
  // [ATUALIZADO] Agora é uma lista de professores
  professores: Usuario[]; 
  alunos?: Aluno[];
}

export interface CriarTurmaPayload {
  nome: string;
  anoSemestre: string;
  termoAtual: number;
  professorIds: number[]; // Lista de IDs (ex: [1, 5])
}

// Entidade: Capacidade
export interface Capacidade {
  id: number;
  descricao: string;
  tipo: TipoCapacidade;
  disciplinaId: number; // Mapeando o ID da relação
  criterios?: Criterio[];
}

// Entidade: Critério
export interface Criterio {
  id: number;
  descricao: string;
  tipo: TipoCriterio;
  capacidadeId: number;
}

// Entidade: Nível de Avaliação (Regra de Negócio)
export interface NivelAvaliacao {
  id: number;
  nivel: number;          // 5, 10... 100
  minCriticos: number;    // Ex: 5
  minDesejaveis: number;  // Ex: 1
  disciplinaId: number;
}


// Entidade: Aluno
export interface Aluno {
  id: number;
  nome: string;
  turmaId: number;
}

// Entidade: Avaliação (O registro do 'Atendeu' ou 'Não Atendeu')
export interface Avaliacao {
  id: number;
  atendeu: boolean | null; // Null se ainda não foi avaliado
  observacao?: string;
  dataAvaliacao?: string;
  alunoId: number;
  criterioId: number;
  // O backend retorna o objeto Criterio completo em alguns endpoints (fetch EAGER)
  criterio?: Criterio; 
}

// DTOs para comunicação com a API (Payloads de envio)

export interface CriarCriterioPayload {
  capacidadeId: number;
  descricao: string;
  tipo: TipoCriterio;
}

export interface RegistrarAvaliacaoPayload {
  alunoId: number;
  criterioId: number;
  atendeu: boolean;
  observacao?: string;
}

// DTO de Resposta do Boletim (ResultadoBoletimDTO.java)
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