import { useState, useCallback } from 'react';
import type { CalendarDay } from '../../core/entities/ProgressData';
import type { StudyTopic } from '../../core/entities/StudyTopic';
import { container } from '../../di/container';
import { handleError } from '../../shared/errorHandler';

interface UseCalendarSessionsReturn {
  calendarDays: CalendarDay[];
  topics: StudyTopic[];
  loading: boolean;
  error: string | null;
  currentMonth: { year: number; month: number };
  selectedTopicIds: string[];
  navigateMonth: (direction: 'prev' | 'next') => void;
  goToToday: () => void;
  filterByTopics: (topicIds: string[]) => void;
  toggleSession: (sessionId: string) => Promise<void>;
  loadMonth: (year: number, month: number) => Promise<void>;
}

export function useCalendarSessions(): UseCalendarSessionsReturn {
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [topics, setTopics] = useState<StudyTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
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

  const toggleSession = useCallback(
    async (sessionId: string) => {
      // Update otimista
      const previousDays = calendarDays;
      setCalendarDays((prev) =>
        prev.map((day) => ({
          ...day,
          sessions: day.sessions.map((s) => {
            if (s.sessionId !== sessionId) return s;
            const toggled = !s.completed;
            return {
              ...s,
              completed: toggled,
              completedAt: toggled ? new Date() : undefined,
            };
          }),
          allCompleted: day.sessions.every(
            (s) => s.completed || (s.sessionId === sessionId ? !s.completed : false),
          ),
          anyCompleted: day.sessions.some((s) => s.completed || s.sessionId === sessionId),
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

  return {
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
  };
}
