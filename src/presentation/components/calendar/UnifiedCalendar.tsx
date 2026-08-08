import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../../hooks/useAuth';
import { useCalendarSessions } from '../../hooks/useCalendarSessions';
import { useCalendarGrid } from '../../hooks/useCalendarGrid';
import { Button } from '../ui/Button';
import { formatHours } from '../ui/TimeInput';
import { container } from '../../../di/container';
import type { CalendarDayFull } from '../../../core/entities/ProgressData';

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

// ---------------------------------------------------------------------------
// NotesEditor — componente inline para anotações de uma sessão
// ---------------------------------------------------------------------------

function NotesEditor({
  sessionId,
  initialNotes,
  topicName,
  onSave,
}: {
  sessionId: string;
  initialNotes: string;
  topicName: string;
  onSave: (sessionId: string, notes: string) => Promise<void>;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const hasNotes = initialNotes.trim().length > 0;

  const handleSave = async () => {
    setSaving(true);
    await onSave(sessionId, notes);
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setNotes(initialNotes);
    setEditing(false);
  };

  if (!editing && !hasNotes) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="mt-1 text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
      >
        + Adicionar anotação
      </button>
    );
  }

  if (!editing && hasNotes) {
    return (
      <div className="mt-1.5">
        <p className="text-xs text-gray-600 dark:text-gray-400 italic bg-gray-100 dark:bg-gray-800 rounded-md px-2 py-1 line-clamp-2">
          "{initialNotes}"
        </p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-0.5 text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
        >
          Editar anotação
        </button>
      </div>
    );
  }

  return (
    <div className="mt-1.5">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={`Anotações sobre ${topicName}...`}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500 resize-none"
        rows={2}
        autoFocus
      />
      <div className="mt-1.5 flex gap-2 justify-end">
        <button
          type="button"
          onClick={handleCancel}
          disabled={saving}
          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
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

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface UnifiedCalendarProps {
  /** Se true, exibe header compacto com saudação (HomePage) */
  compact?: boolean;
  /** Se true, não exibe o botão "Gerenciar Temas" (HomePage já tem atalhos abaixo) */
  hideManageButton?: boolean;
  /** Se true, não exibe o link/empty state de "Gerenciar Temas" (pois a Home já tem atalho) */
  showEmptyManageLink?: boolean;
}

// ---------------------------------------------------------------------------
// UnifiedCalendar
// ---------------------------------------------------------------------------

export function UnifiedCalendar({
  compact = false,
  hideManageButton = false,
  showEmptyManageLink = true,
}: UnifiedCalendarProps) {
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
    moduleFilter,
    toggleSession,
    updateSessionNotes,
    loadMonth,
    setModuleFilter,
  } = useCalendarSessions();

  const { gridDays, paddingBefore, paddingAfter } = useCalendarGrid(calendarDays, currentMonth);
  const paddingBeforeSet = useMemo(
    () => new Set(paddingBefore.map((d) => d.date)),
    [paddingBefore],
  );
  const paddingAfterSet = useMemo(() => new Set(paddingAfter.map((d) => d.date)), [paddingAfter]);

  const [selectedDay, setSelectedDay] = useState<CalendarDayFull | null>(null);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  // ---- T33.1/T33.2: Cache de resolução de emails para completedBy/userId ----
  const emailCache = useRef<Map<string, string>>(new Map());

  const resolveEmail = useCallback(async (uid: string): Promise<string> => {
    if (emailCache.current.has(uid)) {
      return emailCache.current.get(uid)!;
    }
    try {
      const email = await container.sharingRepository.getUserEmail(uid);
      const resolved = email ?? uid;
      emailCache.current.set(uid, resolved);
      return resolved;
    } catch {
      emailCache.current.set(uid, uid);
      return uid;
    }
  }, []);

  // Estado para emails resolvidos das sessions no modal
  const [resolvedEmails, setResolvedEmails] = useState<Map<string, string>>(new Map());

  // Resolver emails quando selectedDay mudar
  useEffect(() => {
    if (!selectedDay) return;
    const uids = new Set<string>();
    for (const s of selectedDay.studySessions) {
      if (s.completedBy && s.completedBy !== user?.id) uids.add(s.completedBy);
      if (s.userId && s.userId !== user?.id) uids.add(s.userId);
    }
    for (const r of selectedDay.reviewSessions) {
      if (r.userId && r.userId !== user?.id) uids.add(r.userId);
    }
    if (uids.size === 0) return;
    Promise.all([...uids].map((uid) => resolveEmail(uid))).then((emails) => {
      const map = new Map<string, string>();
      [...uids].forEach((uid, i) => map.set(uid, emails[i]));
      setResolvedEmails(map);
    });
  }, [selectedDay, user?.id, resolveEmail]);

  const loadData = useCallback(() => {
    if (user) {
      loadMonth(currentMonth.year, currentMonth.month, user.id);
    }
  }, [user, currentMonth, loadMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // T19.2 — Mantém selectedDay sincronizado com calendarDays após toggle otimista
  useEffect(() => {
    if (selectedDay) {
      const updated = calendarDays.find((d) => d.date === selectedDay.date);
      if (updated) {
        setSelectedDay(updated);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarDays]);

  const handleDayClick = (day: CalendarDayFull) => {
    if (!day.isCurrentMonth) return;
    if (day.hasActivities) {
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

  const headerClasses = compact
    ? 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'
    : 'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between';

  return (
    <div className="space-y-4">
      {/* Header com navegação */}
      <div className={headerClasses}>
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
          <h2
            className={twMerge(
              'font-bold text-gray-900 dark:text-gray-100 min-w-[180px] text-center',
              compact ? 'text-base' : 'text-lg',
            )}
          >
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
          {!hideManageButton && (
            <>
              <Link to="/study/topics">
                <Button variant="primary" size="sm">
                  Gerenciar Temas
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Filtro por módulo */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setModuleFilter('all')}
          className={twMerge(
            'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
            moduleFilter === 'all'
              ? 'bg-brand-600 text-white dark:bg-brand-500'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
          )}
        >
          Todos
        </button>
        <button
          type="button"
          onClick={() => setModuleFilter('study')}
          className={twMerge(
            'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
            moduleFilter === 'study'
              ? 'bg-blue-600 text-white dark:bg-blue-500'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
          )}
        >
          📚 Estudos
        </button>
        <button
          type="button"
          onClick={() => setModuleFilter('review')}
          className={twMerge(
            'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
            moduleFilter === 'review'
              ? 'bg-purple-600 text-white dark:bg-purple-500'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
          )}
        >
          📝 Revisões
        </button>
      </div>

      {/* Filtro por temas (apenas quando módulo "Todos" ou "Estudos" está ativo) */}
      {topics.length > 0 && moduleFilter !== 'review' && (
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
          {showEmptyManageLink && (
            <Link to="/study/topics" className="mt-4">
              <Button variant="primary" size="sm">
                Gerenciar Temas
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Grid do Calendário — SEMPRE renderiza (inclusive meses vazios) */}
      {topics.length > 0 && (
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
            {gridDays.map((day) => {
              const isPadding = paddingBeforeSet.has(day.date) || paddingAfterSet.has(day.date);
              const hasSessions = day.studySessions.length > 0;

              // ---- T33.8: Separar sessões próprias vs parceiro para indicadores visuais ----
              const ownSessions = day.studySessions.filter(
                (s) => !s.userId || s.userId === user?.id,
              );
              const partnerSessions = day.studySessions.filter(
                (s) => s.userId && s.userId !== user?.id,
              );

              const ownCompleted = ownSessions.filter((s) => s.completed).length;
              const partnerCompleted = partnerSessions.filter((s) => s.completed).length;
              const allOwnDone = ownSessions.length > 0 && ownCompleted === ownSessions.length;
              const allPartnerDone =
                partnerSessions.length > 0 && partnerCompleted === partnerSessions.length;
              const bothCompleted = allOwnDone && allPartnerDone;
              const onlyPartnerDone = allPartnerDone && !allOwnDone && ownSessions.length > 0;

              const totalActivities = day.studySessions.length + day.reviewSessions.length;
              const intensity = totalActivities;

              const cellClass = twMerge(
                'aspect-square border-b border-r border-gray-100 dark:border-gray-800',
                'flex flex-col items-center justify-start p-1.5 gap-1',
                'transition-colors relative',
                isPadding && 'opacity-40 bg-gray-50 dark:bg-gray-800/50 cursor-default',
                !isPadding &&
                  hasSessions &&
                  'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50',
                !isPadding && !hasSessions && 'cursor-default',
                // Ambos concluíram: verde intenso
                !isPadding && hasSessions && bothCompleted && 'bg-green-100 dark:bg-green-900/30',
                // Todos concluídos (só usuário logado tem sessões): verde claro
                !isPadding &&
                  hasSessions &&
                  day.allCompleted &&
                  !bothCompleted &&
                  partnerSessions.length === 0 &&
                  'bg-green-50 dark:bg-green-900/20',
                // Só parceiro concluiu: azul claro
                !isPadding && hasSessions && onlyPartnerDone && 'bg-blue-50 dark:bg-blue-900/20',
                // Parcial (ambos têm sessões mas nem todos concluíram): âmbar
                !isPadding &&
                  hasSessions &&
                  day.anyCompleted &&
                  !day.allCompleted &&
                  !onlyPartnerDone &&
                  'bg-amber-50 dark:bg-amber-900/20',
                // Nenhum concluído: brand (comportamento atual)
                !isPadding &&
                  hasSessions &&
                  !day.anyCompleted &&
                  !onlyPartnerDone &&
                  'bg-brand-50 dark:bg-brand-900/10',
                !isPadding &&
                  intensity >= 6 &&
                  'shadow-sm ring-2 ring-brand-200 dark:ring-brand-800',
                !isPadding &&
                  intensity >= 3 &&
                  intensity <= 5 &&
                  'ring-1 ring-gray-300 dark:ring-gray-600',
              );

              return (
                <button
                  key={day.date}
                  onClick={() => handleDayClick(day)}
                  onMouseEnter={() => setHoveredDay(day.date)}
                  onMouseLeave={() => setHoveredDay(null)}
                  disabled={isPadding || !day.hasActivities}
                  className={cellClass}
                  aria-label={`Dia ${day.dayNumber}${isPadding ? ' (mês adjacente)' : ''}`}
                >
                  <span
                    className={twMerge(
                      'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                      day.isToday &&
                        'bg-brand-600 text-white dark:bg-brand-500 ring-2 ring-brand-500 ring-offset-1',
                      !day.isToday && 'text-gray-700 dark:text-gray-300',
                      isPadding && 'text-gray-400 dark:text-gray-600',
                    )}
                  >
                    {day.dayNumber}
                  </span>

                  {day.hasActivities && (
                    <div className="flex flex-wrap gap-0.5 justify-center max-w-[80%]">
                      {/* T33.2: Dots de sessões próprias (preenchidos) e parceiro (borda tracejada) */}
                      {ownSessions.slice(0, 2).map((session, idx) => (
                        <span
                          key={`own-${idx}`}
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: session.topicColor }}
                          title={`Estudo: ${session.topicName} (você)`}
                        />
                      ))}
                      {partnerSessions.slice(0, 2).map((session, idx) => (
                        <span
                          key={`partner-${idx}`}
                          className="w-2 h-2 rounded-full border-2 border-dashed flex-shrink-0"
                          style={{
                            borderColor: session.topicColor,
                            backgroundColor: session.completed ? session.topicColor : 'transparent',
                          }}
                          title={`Estudo: ${session.topicName} (parceiro)`}
                        />
                      ))}
                      {day.reviewSessions.slice(0, 3).map((review, idx) => (
                        <span
                          key={`review-${idx}`}
                          className="w-2 h-2 flex-shrink-0 rotate-45 rounded-sm border border-current"
                          style={{
                            backgroundColor: review.completed ? review.reviewColor : 'transparent',
                            color: review.reviewColor,
                            borderColor: review.reviewColor,
                          }}
                          title={`Revisão: ${review.reviewName}`}
                        />
                      ))}
                      {day.studySessions.length + day.reviewSessions.length > 6 && (
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-none">
                          +{day.studySessions.length + day.reviewSessions.length - 6}
                        </span>
                      )}
                    </div>
                  )}

                  {/* T33.8: Indicadores por célula */}
                  {!isPadding && bothCompleted && (
                    <span className="text-[10px] text-green-600 dark:text-green-400">🤝</span>
                  )}
                  {!isPadding &&
                    day.allCompleted &&
                    !bothCompleted &&
                    partnerSessions.length === 0 &&
                    hasSessions && (
                      <span className="text-[10px] text-green-600 dark:text-green-400">✓</span>
                    )}
                  {!isPadding && onlyPartnerDone && (
                    <span className="text-[10px] text-blue-600 dark:text-blue-400">👤✓</span>
                  )}

                  {hoveredDay === day.date && !isPadding && day.hasActivities && (
                    <div
                      className={twMerge(
                        'absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-10',
                        'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900',
                        'text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg',
                        'opacity-100 translate-y-0 transition-all duration-150',
                        'pointer-events-none',
                      )}
                    >
                      <p>
                        📚 {day.studySessions.length} estudo
                        {day.studySessions.length !== 1 ? 's' : ''}
                        {day.reviewSessions.length > 0 && (
                          <>
                            {' '}
                            | 📝 {day.reviewSessions.length} revisão
                            {day.reviewSessions.length !== 1 ? 'ões' : ''}
                          </>
                        )}
                      </p>
                      <p>
                        {day.studySessions.filter((s) => s.completed).length}/
                        {day.studySessions.length} concluídos
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Legenda (T16.2) */}
      {topics.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-500 dark:text-gray-400 px-1">
          <span className="flex items-center gap-1.5 font-medium text-gray-600 dark:text-gray-400">
            ⬤ Estudo
          </span>
          <span className="flex items-center gap-1.5 font-medium text-gray-600 dark:text-gray-400">
            <span className="w-2.5 h-2.5 flex-shrink-0 rotate-45 rounded-sm border border-current opacity-70" />
            Revisão
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-100 dark:bg-green-900/40 border border-green-300" />
            ✓ Concluído
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-100 dark:bg-amber-900/40 border border-amber-300" />
            ◌ Parcial
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-brand-50 dark:bg-brand-900/20 border border-brand-200" />
            Pendente
          </span>
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

            {/* Conteúdo */}
            <div className="p-4 space-y-4">
              {/* Seção Estudos */}
              {selectedDay.studySessions.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    📚 Estudos
                  </h4>
                  <div className="space-y-2">
                    {selectedDay.studySessions.map((session) => {
                      const isOwnSession = !session.userId || session.userId === user?.id;
                      const completedByEmail =
                        session.completed && session.completedBy && session.completedBy !== user?.id
                          ? (resolvedEmails.get(session.completedBy) ?? session.completedBy)
                          : null;
                      const ownerEmail =
                        !isOwnSession && session.userId
                          ? (resolvedEmails.get(session.userId) ?? session.userId)
                          : null;
                      return (
                        <div
                          key={`${session.sessionId}-${session.userId ?? user?.id}`}
                          className={twMerge(
                            'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                            session.completed
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
                          )}
                        >
                          <div
                            className={twMerge(
                              'flex-shrink-0 mt-1.5',
                              isOwnSession
                                ? 'w-3 h-3 rounded-full'
                                : 'w-3 h-3 rounded-full border-2 border-dashed',
                            )}
                            style={
                              isOwnSession
                                ? { backgroundColor: session.topicColor }
                                : {
                                    borderColor: session.topicColor,
                                    backgroundColor: 'transparent',
                                  }
                            }
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {session.topicName}
                              </p>
                              {!isOwnSession && ownerEmail && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300">
                                  👤 {ownerEmail}
                                </span>
                              )}
                              {!isOwnSession && !ownerEmail && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300">
                                  👤 Outro
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatHours(session.hoursPerDay)}/dia
                            </p>
                            {session.completed && isOwnSession && session.completedAt && (
                              <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                                ✅ Você concluiu em {formatDateTime(session.completedAt)}
                              </p>
                            )}
                            {session.completed && completedByEmail && (
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                                ✅ Concluído por {completedByEmail}
                              </p>
                            )}
                            {!session.completed && !isOwnSession && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                ⏳ Pendente — {ownerEmail ?? 'outro'}
                              </p>
                            )}
                            {isOwnSession && (
                              <NotesEditor
                                sessionId={session.sessionId}
                                initialNotes={session.notes ?? ''}
                                topicName={session.topicName}
                                onSave={updateSessionNotes}
                              />
                            )}
                          </div>
                          {isOwnSession ? (
                            <button
                              onClick={() => toggleSession(session.sessionId)}
                              className={twMerge(
                                'relative inline-flex h-6 w-11 items-center rounded-full flex-shrink-0 mt-1',
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
                          ) : (
                            <span
                              className={twMerge(
                                'inline-flex items-center justify-center h-6 w-11 rounded-full flex-shrink-0 mt-1 text-xs font-medium',
                                session.completed
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                                  : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
                              )}
                            >
                              {session.completed ? '✓' : '—'}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Seção Revisões */}
              {selectedDay.reviewSessions.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    📝 Revisões
                  </h4>
                  <div className="space-y-2">
                    {selectedDay.reviewSessions.map((review) => {
                      const isOwnReview = !review.userId || review.userId === user?.id;
                      return (
                        <div
                          key={`${review.reviewId}-${review.date}-${review.userId ?? user?.id}`}
                          className={twMerge(
                            'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                            review.completed
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
                          )}
                        >
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: review.reviewColor }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {review.reviewName}
                              </p>
                              {!isOwnReview && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300">
                                  👤 Outro
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {review.reviewNumber}ª revisão
                            </p>
                            {review.questionnaire && (
                              <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                                {review.questionnaire.userEmail
                                  ? `${review.questionnaire.userEmail}: `
                                  : ''}
                                {review.questionnaire.correctAnswers}/
                                {review.questionnaire.totalQuestions} acertos (
                                {review.questionnaire.accuracy}%)
                              </p>
                            )}
                            {!review.completed && !isOwnReview && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                Pendente
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedDay.studySessions.length === 0 &&
                selectedDay.reviewSessions.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    Nenhuma atividade para este dia.
                  </p>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
