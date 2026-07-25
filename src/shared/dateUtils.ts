import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatDate(date: string | Date, pattern = 'dd/MM/yyyy'): string {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '';
  return format(parsed, pattern);
}

export function formatDateLong(date: string | Date): string {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '';
  return format(parsed, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function getMonthRange(year: number, month: number): { startDate: string; endDate: string } {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  return {
    startDate: toISODate(startDate),
    endDate: toISODate(endDate),
  };
}
