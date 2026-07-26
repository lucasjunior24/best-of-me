import { useMemo } from 'react';
import type { CalendarDayFull } from '../../core/entities/ProgressData';

export interface UseCalendarGridReturn {
  /** Grid completo de 7 colunas (múltiplo de 7 — normalmente 35 ou 42 células) */
  gridDays: CalendarDayFull[];
  /** Dias do mês anterior que preenchem a primeira semana */
  paddingBefore: CalendarDayFull[];
  /** Dias do mês seguinte que preenchem a última semana */
  paddingAfter: CalendarDayFull[];
}

/**
 * Hook responsável por gerar o grid 7 colunas completo a partir dos dias do mês,
 * incluindo dias de meses adjacentes para preencher a primeira e última semana.
 */
export function useCalendarGrid(
  calendarDays: CalendarDayFull[],
  currentMonth: { year: number; month: number },
): UseCalendarGridReturn {
  return useMemo(() => {
    if (calendarDays.length === 0) {
      return { gridDays: [], paddingBefore: [], paddingAfter: [] };
    }

    const firstDay = calendarDays[0];
    const firstDate = new Date(currentMonth.year, currentMonth.month - 1, firstDay.dayNumber);
    const firstDayOfWeek = firstDate.getDay(); // 0 = Dom, 6 = Sáb

    // Dias do mês anterior para preencher
    const paddingBefore: CalendarDayFull[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      const prevDate = new Date(currentMonth.year, currentMonth.month - 1, -i);
      const dateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(prevDate.getDate()).padStart(2, '0')}`;

      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      paddingBefore.push({
        date: dateStr,
        dayNumber: prevDate.getDate(),
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        studySessions: [],
        reviewSessions: [],
        allCompleted: false,
        anyCompleted: false,
        hasActivities: false,
      });
    }
    paddingBefore.reverse();

    // Dias do mês seguinte para preencher até múltiplo de 7
    const totalCells = paddingBefore.length + calendarDays.length;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);

    const paddingAfter: CalendarDayFull[] = [];
    const lastDay = calendarDays[calendarDays.length - 1];
    for (let i = 1; i <= remainingCells; i++) {
      const nextDate = new Date(currentMonth.year, currentMonth.month - 1, lastDay.dayNumber + i);
      const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;

      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      paddingAfter.push({
        date: dateStr,
        dayNumber: nextDate.getDate(),
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        studySessions: [],
        reviewSessions: [],
        allCompleted: false,
        anyCompleted: false,
        hasActivities: false,
      });
    }

    const gridDays = [...paddingBefore, ...calendarDays, ...paddingAfter];

    return { gridDays, paddingBefore, paddingAfter };
  }, [calendarDays, currentMonth]);
}
