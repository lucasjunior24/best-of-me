import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../../hooks/useAuth';
import { useCalendarSessions } from '../../hooks/useCalendarSessions';
import { Button } from '../../components/ui/Button';
import type { CalendarDay } from '../../../core/entities/ProgressData';

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function StudyCalendarPage() {
  const { user } = useAuth();
  const {
    calendarDays,
    topics,
    loading,
    error,
    currentMonth,
    selectedTopicIds,
    navigateMonth,
    goToToday,
    filterByTopics,
    toggleSession,
    loadMonth,
  } = useCalendarSessions();

  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const firstDayOffset = useMemo(() => {
    const firstDay = new Date(currentMonth.year, currentMonth.month - 1, 1);
    return firstDay.getDay();
  }, [currentMonth]);

  const loadData = useCallback(() => {
    if (user) {
      loadMonth(currentMonth.year, currentMonth.month);
    }
  }, [user, currentMonth, loadMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDayClick = (day: CalendarDay) => {
    if (day.sessions.length > 0) {
      setSelectedDay(day);
    }
  };

  const handleTopicFilter = (topicId: string) => {
    if (topicId === 'all') {
      filterByTopics([]);
    } else {
      const newSelection = selectedTopicIds.includes(topicId)
        ? selectedTopicIds.filter((id) => id !== topicId)
        : [...selectedTopicIds, topicId];
      filterByTopics(newSelection);
    }
  };

  // ---- Loading State ----
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-gray-100 dark:bg-gray-800 rounded animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // ---- Error State ----
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Erro ao carregar calendário
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <Button onClick={loadData} variant="outline">
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com navegação */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Mês anterior"
          >
            <svg
              className="w-5 h-5 text-gray-600 dark:text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 min-w-[180px] text-center">
            {MONTHS[currentMonth.month - 1]} de {currentMonth.year}
          </h2>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Próximo mês"
          >
            <svg
              className="w-5 h-5 text-gray-600 dark:text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="flex gap-2">
          <Button onClick={goToToday} variant="outline" size="sm">
            Hoje
          </Button>
          <Link to="/study/topics">
            <Button variant="primary" size="sm">
              Gerenciar Temas
            </Button>
          </Link>
        </div>
      </div>

      {/* Filtro por temas */}
      {topics.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleTopicFilter('all')}
            className={twMerge(
              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              selectedTopicIds.length === 0
                ? 'bg-brand-600 text-white dark:bg-brand-500'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
            )}
          >
            Todos
          </button>
          {topics.map((topic) => (
            <button
              key={topic.id}
              type="button"
              onClick={() => handleTopicFilter(topic.id)}
              className={twMerge(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                selectedTopicIds.includes(topic.id)
                  ? 'text-white'
                  : 'border border-gray-300 bg-transparent text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800',
              )}
              style={
                selectedTopicIds.includes(topic.id) ? { backgroundColor: topic.color } : undefined
              }
            >
              {topic.name}
            </button>
          ))}
        </div>
      )}

      {/* Empty state: sem temas */}
      {topics.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 dark:border-gray-700">
          <span className="text-4xl">📅</span>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Nenhum tema cadastrado</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Cadastre temas de estudo para vê-los no calendário.
          </p>
          <Link to="/study/topics" className="mt-4">
            <Button variant="primary" size="sm">
              Gerenciar Temas
            </Button>
          </Link>
        </div>
      )}

      {/* Empty state: mês sem sessões */}
      {topics.length > 0 && calendarDays.every((d) => d.sessions.length === 0) && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 dark:border-gray-700">
          <span className="text-4xl">📭</span>
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            Nenhum estudo agendado para este mês
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Agende estudos nos seus temas para vê-los aqui.
          </p>
        </div>
      )}

      {/* Grid do Calendário */}
      {topics.length > 0 && !calendarDays.every((d) => d.sessions.length === 0) && (
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
          {/* Cabeçalho dias da semana */}
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Dias do mês */}
          <div className="grid grid-cols-7">
            {/* Células vazias antes do primeiro dia */}
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="aspect-square border-b border-r border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30"
              />
            ))}

            {calendarDays.map((day) => {
              const dayNumber = parseInt(day.date.split('-')[2], 10);
              const isToday = day.date === today;
              const hasSessions = day.sessions.length > 0;

              return (
                <button
                  key={day.date}
                  onClick={() => handleDayClick(day)}
                  disabled={!hasSessions}
                  className={twMerge(
                    'aspect-square border-b border-r border-gray-100 dark:border-gray-800',
                    'flex flex-col items-center justify-start p-1.5 gap-1',
                    'transition-colors relative',
                    hasSessions && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50',
                    !hasSessions && 'cursor-default bg-gray-50/30 dark:bg-gray-900/30',
                    day.allCompleted && hasSessions && 'bg-green-50 dark:bg-green-900/20',
                    day.anyCompleted &&
                      !day.allCompleted &&
                      hasSessions &&
                      'bg-amber-50 dark:bg-amber-900/20',
                  )}
                >
                  <span
                    className={twMerge(
                      'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                      isToday && 'bg-brand-600 text-white dark:bg-brand-500',
                      !isToday && 'text-gray-700 dark:text-gray-300',
                    )}
                  >
                    {dayNumber}
                  </span>

                  {/* Dots coloridos */}
                  {hasSessions && (
                    <div className="flex flex-wrap gap-0.5 justify-center max-w-[80%]">
                      {day.sessions.slice(0, 4).map((session, idx) => (
                        <span
                          key={idx}
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: session.topicColor }}
                        />
                      ))}
                      {day.sessions.length > 4 && (
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-none">
                          +{day.sessions.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Indicador de conclusão */}
                  {day.allCompleted && hasSessions && (
                    <span className="text-[10px] text-green-600 dark:text-green-400">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de detalhes do dia */}
      {selectedDay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatLongDate(selectedDay.date)}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Fechar"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Lista de sessões */}
            <div className="p-4 space-y-4">
              {selectedDay.sessions.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  Nenhum estudo agendado para este dia.
                </p>
              )}
              {selectedDay.sessions.map((session) => (
                <div
                  key={session.sessionId}
                  className={twMerge(
                    'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                    session.completed
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
                  )}
                >
                  {/* Indicador de cor do tema */}
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: session.topicColor }}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {session.topicName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {session.hoursPerDay}h por dia
                    </p>
                    {session.completed && session.completedAt && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                        Concluído em {formatDateTime(session.completedAt)}
                      </p>
                    )}
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={() => toggleSession(session.sessionId)}
                    className={twMerge(
                      'relative inline-flex h-6 w-11 items-center rounded-full flex-shrink-0',
                      'transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
                      session.completed ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600',
                    )}
                    role="switch"
                    aria-checked={session.completed}
                    aria-label={`Marcar ${session.topicName} como ${session.completed ? 'não concluído' : 'concluído'}`}
                  >
                    <span
                      className={twMerge(
                        'inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform',
                        session.completed ? 'translate-x-6' : 'translate-x-1',
                      )}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Formata "2026-07-24" → "Quinta-feira, 24 de Julho de 2026" */
function formatLongDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Formata timestamp para hora legível */
function formatDateTime(date: Date): string {
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
