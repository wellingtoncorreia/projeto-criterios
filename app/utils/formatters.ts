import { Turma } from '@/app/types';

/**
 * Formata os metadados de uma turma (Ano/Semestre, Termo Atual) em uma string coesa.
 * Ex: "2025/1 | 1º Termo"
 * @param turma O objeto Turma completo ou parcial.
 * @returns String formatada.
 */
export function formatTurmaNome(turma: Pick<Turma, 'anoSemestre' | 'termoAtual'>): string {
    const anoSemestre = turma.anoSemestre || 'N/A';
    const termo = turma.termoAtual ? `${turma.termoAtual}º Termo` : 'N/A';
    
    return `${anoSemestre} | ${termo}`;
}

/**
 * Formata um número de telefone no padrão brasileiro (XX) XXXX-XXXX ou (XX) XXXXX-XXXX.
 * @param phone O número de telefone.
 * @returns String formatada.
 */
export function formatPhoneNumber(phone: string): string {
    const cleaned = ('' + phone).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
}

/**
 * Formata um número como porcentagem com uma casa decimal.
 * @param percentage O valor percentual (0 a 100).
 * @returns String formatada com "%".
 */
export function formatPercentual(percentage: number): string {
    if (typeof percentage !== 'number') return 'N/A';
    return `${percentage.toFixed(1)}%`;
}