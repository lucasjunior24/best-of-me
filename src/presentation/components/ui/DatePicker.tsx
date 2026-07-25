import { useState, useCallback, useMemo } from 'react';
import { twMerge } from 'tailwind-merge';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isWeekend,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DatePickerProps {
  selectedDates: string[];
  onChange: (dates: string[]) => void;
  highlightColor?: string;
  className?: string;
}

export function DatePicker({
  selectedDates,
  onChange,
  highlightColor = '#3b82f6',
  className,
}: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));

  const selectedSet = useMemo(() => new Set(selectedDates), [selectedDates]);

  const navigateMonth = useCallback((direction: 1 | -1) => {
    setCurrentMonth((prev) => (direction === 1 ? addMonths(prev, 1) : subMonths(prev, 1)));
  }, []);

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const toggleDate = useCallback(
    (dateStr: string) => {
      if (selectedSet.has(dateStr)) {
        onChange(selectedDates.filter((d) => d !== dateStr));
      } else {
        onChange([...selectedDates, dateStr]);
      }
    },
    [selectedDates, selectedSet, onChange],
  );

  const weekDays = useMemo(() => {
    // Start from Sunday
    const base = startOfWeek(new Date(2024, 0, 1), { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(base);
      day.setDate(base.getDate() + i);
      return format(day, 'EEEEEE', { locale: ptBR });
    });
  }, []);

  return (
    <div className={twMerge('space-y-3', className)}>
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigateMonth(-1)}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          aria-label="Mês anterior"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h3>

        <button
          type="button"
          onClick={() => navigateMonth(1)}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          aria-label="Próximo mês"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* Weekdays header */}
      <div className="grid grid-cols-7 gap-0.5">
        {weekDays.map((day) => (
          <div
            key={day}
            className="flex items-center justify-center py-1 text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isSelected = selectedSet.has(dateStr);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());
          const isWeekendDay = isWeekend(day);

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => isCurrentMonth && toggleDate(dateStr)}
              disabled={!isCurrentMonth}
              className={twMerge(
                'flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                !isCurrentMonth && 'pointer-events-none opacity-0',
                isSelected && 'font-semibold text-white',
                isSelected && !isWeekendDay && 'shadow-sm',
                !isSelected &&
                  isCurrentMonth &&
                  'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700',
                isWeekendDay && !isSelected && 'text-gray-400 dark:text-gray-500 opacity-60',
                isToday && !isSelected && 'ring-1 ring-brand-400 dark:ring-brand-500',
                isToday && isSelected && 'ring-2 ring-white',
              )}
              style={isSelected ? { backgroundColor: highlightColor } : undefined}
              aria-label={`${format(day, 'dd/MM/yyyy')}${isSelected ? ' — selecionado' : ''}`}
              aria-pressed={isSelected}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>

      {/* Selection count */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {selectedDates.length}{' '}
        {selectedDates.length === 1 ? 'dia selecionado' : 'dias selecionados'}
      </p>
    </div>
  );
}
