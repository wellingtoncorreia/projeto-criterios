// app/types/index.ts

// --- Tipos de Entidades Base ---

export type TipoUsuario = 'GESTOR' | 'PROFESSOR';
export type TipoCriterio = 'CRITICO' | 'DESEJAVEL';
export type TipoCapacidade = 'TECNICA' | 'SOCIOEMOCIONAL';

export interface Usuario {
    id: number;
    nome: string;
    email: string;
    tipo: TipoUsuario;
}

export interface Professor {
    id: number;
    nome: string;
    email: string;
}

// Unificado: Mantive a definição mais completa de Disciplina
export interface Disciplina {
    id: number;
    nome: string;
    sigla: string;
    periodicidade: 'ANUAL' | 'SEMESTRAL';
    termo: number;
}

export interface Criterio {
    id: number;
    descricao: string;
    tipo: TipoCriterio;
    // capacidade: Capacidade; // Removido para evitar referência circular
}

export interface Capacidade {
    id: number;
    descricao: string;
    tipo: TipoCapacidade;
    criterios?: Criterio[]; 
}

export interface Avaliacao {
    id: number;
    atendeu: boolean;
    observacao: string;
    criterio: Criterio;
    // ... outros campos
}

// --- DTOs e Tipos Compostos ---

// Unificado: Esta é a definição oficial de Turma (removemos a duplicata lá de baixo)
export interface Turma {
    id: number;
    nome: string;
    anoSemestre: string;
    termoAtual: number;
    
    // Tornamos opcionais (?) para evitar conflitos se o backend não mandar em alguns casos,
    // mas mantivemos a tipagem forte.
    disciplinaId?: number; 
    estruturaSnapshotId?: number;
    nomeDisciplina?: string;
    
    // Unificado: Aceita Usuario[] (mais completo) ou Professor[]
    professores?: Usuario[] | Professor[]; 
    
    totalAlunos?: number;
}

// Alias para manter compatibilidade
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

// --- Tipos Auxiliares para Importador e Componentes ---

export interface CritItemDTO { 
    id: string | number; 
    descricao: string; 
    tipo: TipoCriterio; 
}

export interface CapItemDTO { 
    id: string | number; 
    descricao: string; 
    tipo: TipoCapacidade; 
    criterios: CritItemDTO[]; 
}

// Interface para o Dashboard
export interface Boletim { 
    nomeAluno: string; 
    nivelAlcancado: number; 
}

// Interface para seleção de Turmas
export interface DisciplinaOpcao extends Disciplina {
    snapshotId: number | null;
    status: 'PRONTO' | 'SEM_SNAPSHOT' | 'CARREGANDO';
}

// --- Interfaces para Gráficos do Dashboard ---

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

// Corrigido para evitar erro no Recharts (index signature adicionada)
export interface ChartDataStatus {
    name: string;
    value: number;
    [key: string]: any;
}

// --- Tipos para Importação/Edição ---

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

export interface NovoCriterioDTO {
    id: string;
    descricao: string;
    tipo: TipoCriterio;
    capacidadeId: number;
}

// --- Tipos para Avaliação ---

export interface AvaliacaoEstado {
    atendeu: boolean | null;
    obs: string;
    finalizada: boolean | undefined;
}

export interface DisciplinaDisponivel extends Disciplina {
    avaliacaoId: number; 
    isPrincipal: boolean;
}

// --- Relatórios ---

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