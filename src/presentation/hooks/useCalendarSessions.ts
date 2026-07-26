import { useState, useCallback, useMemo } from 'react';
import type { CalendarDayFull } from '../../core/entities/ProgressData';
import type { StudyTopic } from '../../core/entities/StudyTopic';
import type { CreateQuestionnaireInput } from '../../core/entities/ReviewQuestionnaire';
import { container } from '../../di/container';
import { handleError } from '../../shared/errorHandler';

type ModuleFilter = 'all' | 'study' | 'review';

interface UseCalendarSessionsReturn {
  calendarDays: CalendarDayFull[];
  topics: StudyTopic[];
  loading: boolean;
  error: string | null;
  currentMonth: { year: number; month: number };
  selectedTopicIds: string[];
  moduleFilter: ModuleFilter;
  navigateMonth: (direction: 'prev' | 'next') => void;
  goToToday: () => void;
  filterByTopics: (topicIds: string[]) => void;
  setModuleFilter: (filter: ModuleFilter) => void;
  toggleSession: (sessionId: string) => Promise<void>;
  saveQuestionnaire: (userId: string, input: CreateQuestionnaireInput) => Promise<boolean>;
  loadMonth: (year: number, month: number) => Promise<void>;
  /** True se nenhum dia do mês tem atividades (estudos + revisões) */
  isEmptyMonth: boolean;
}

export function useCalendarSessions(): UseCalendarSessionsReturn {
  const [calendarDays, setCalendarDays] = useState<CalendarDayFull[]>([]);
  const [topics, setTopics] = useState<StudyTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [moduleFilter, setModuleFilter] = useState<ModuleFilter>('all');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  const loadMonth = useCallback(
    async (year: number, month: number) => {
      setLoading(true);
      setError(null);
      try {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        const userId = container.studyRepository['_lastUserId'];
        if (!userId) {
          throw new Error('Usuário não autenticado');
        }

        const [days, topicsData] = await Promise.all([
          container.useCases.getCalendarSessions.execute(
            userId,
            startDate,
            endDate,
            selectedTopicIds.length > 0 ? selectedTopicIds : undefined,
          ),
          container.useCases.getStudyTopics.execute(userId),
        ]);

        setCalendarDays(days);
        setTopics(topicsData);
      } catch (err) {
        const message = handleError(err);
        setError(message);
        container.toastService.error(message);
      } finally {
        setLoading(false);
      }
    },
    [selectedTopicIds],
  );

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      if (direction === 'prev') {
        return prev.month === 1
          ? { year: prev.year - 1, month: 12 }
          : { ...prev, month: prev.month - 1 };
      } else {
        return prev.month === 12
          ? { year: prev.year + 1, month: 1 }
          : { ...prev, month: prev.month + 1 };
      }
    });
  }, []);

  const goToToday = useCallback(() => {
    const now = new Date();
    setCurrentMonth({ year: now.getFullYear(), month: now.getMonth() + 1 });
  }, []);

  const filterByTopics = useCallback((topicIds: string[]) => {
    setSelectedTopicIds(topicIds);
  }, []);

  const saveQuestionnaire = useCallback(
    async (userId: string, input: CreateQuestionnaireInput): Promise<boolean> => {
      try {
        await container.useCases.createOrUpdateQuestionnaire.execute(userId, input);
        container.toastService.success('Questionário registrado! 🎉');
        // Recarregar o mês para refletir a mudança nos dados do calendário
        return true;
      } catch (err) {
        const message = handleError(err);
        container.toastService.error(message);
        return false;
      }
    },
    [],
  );

  const toggleSession = useCallback(
    async (sessionId: string) => {
      // Update otimista
      const previousDays = calendarDays;
      setCalendarDays((prev) =>
        prev.map((day) => ({
          ...day,
          studySessions: day.studySessions.map((s) => {
            if (s.sessionId !== sessionId) return s;
            const toggled = !s.completed;
            return {
              ...s,
              completed: toggled,
              completedAt: toggled ? new Date() : undefined,
            };
          }),
          allCompleted:
            day.studySessions.length > 0 &&
            day.studySessions.every(
              (s) => s.completed || (s.sessionId === sessionId ? !s.completed : false),
            ),
          anyCompleted: day.studySessions.some((s) => s.completed || s.sessionId === sessionId),
        })),
      );

      try {
        const userId = container.studyRepository['_lastUserId'];
        if (!userId) throw new Error('Usuário não autenticado');

        await container.useCases.toggleSessionCompletion.execute(sessionId, userId);
      } catch (err) {
        // Reverter em caso de erro
        setCalendarDays(previousDays);
        const message = handleError(err);
        container.toastService.error(message);
      }
    },
    [calendarDays],
  );

  const isEmptyMonth = useMemo(() => {
    return calendarDays.length > 0 && calendarDays.every((d) => !d.hasActivities);
  }, [calendarDays]);

  // Filtrar calendarDays pelo moduleFilter
  const filteredDays = useMemo(() => {
    if (moduleFilter === 'all') return calendarDays;
    return calendarDays.map((day) => ({
      ...day,
      studySessions: moduleFilter === 'study' ? day.studySessions : [],
      reviewSessions: moduleFilter === 'review' ? day.reviewSessions : [],
      allCompleted:
        moduleFilter === 'study'
          ? day.studySessions.length > 0 && day.studySessions.every((s) => s.completed)
          : moduleFilter === 'review'
            ? day.reviewSessions.length > 0 && day.reviewSessions.every((r) => r.completed)
            : day.allCompleted,
      anyCompleted:
        moduleFilter === 'study'
          ? day.studySessions.some((s) => s.completed)
          : moduleFilter === 'review'
            ? day.reviewSessions.some((r) => r.completed)
            : day.anyCompleted,
      hasActivities:
        moduleFilter === 'study'
          ? day.studySessions.length > 0
          : moduleFilter === 'review'
            ? day.reviewSessions.length > 0
            : day.hasActivities,
    }));
  }, [calendarDays, moduleFilter]);

  return {
    calendarDays: filteredDays,
    topics,
    loading,
    error,
    currentMonth,
    selectedTopicIds,
    moduleFilter,
    navigateMonth,
    goToToday,
    filterByTopics,
    setModuleFilter,
    toggleSession,
    saveQuestionnaire,
    loadMonth,
    isEmptyMonth,
  };
}
