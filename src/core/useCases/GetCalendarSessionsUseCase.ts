import type { IStudyRepository } from '../ports/IStudyRepository';
import type { CalendarDayFull, ReviewSessionCalendarData } from '../entities/ProgressData';
import type { StudyTopic } from '../entities/StudyTopic';

export class GetCalendarSessionsUseCase {
  constructor(private readonly studyRepository: IStudyRepository) {}

  async execute(
    userId: string,
    startDate: string,
    endDate: string,
    topicIds?: string[],
  ): Promise<CalendarDayFull[]> {
    const sessions = await this.studyRepository.getSessionsByDateRange(
      userId,
      startDate,
      endDate,
      topicIds,
    );

    const topics = await this.studyRepository.getTopicsByUser(userId);

    const topicMap = new Map<string, StudyTopic>();
    for (const topic of topics) {
      topicMap.set(topic.id, topic);
    }

    // Agrupar sessões por data
    const sessionsByDate = new Map<string, CalendarDayFull['studySessions']>();

    for (const session of sessions) {
      const topic = topicMap.get(session.topicId);
      if (!topic) continue;

      if (!sessionsByDate.has(session.date)) {
        sessionsByDate.set(session.date, []);
      }

      sessionsByDate.get(session.date)!.push({
        sessionId: session.id,
        topicId: session.topicId,
        topicName: topic.name,
        topicColor: topic.color,
        completed: session.completed,
        completedAt: session.completedAt,
        hoursPerDay: topic.hoursPerDay,
      });
    }

    // Gerar lista completa de dias do mês
    const [yearStr, monthStr] = startDate.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const lastDay = new Date(year, month, 0).getDate();

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const allDays: CalendarDayFull[] = [];

    for (let day = 1; day <= lastDay; day++) {
      const date = `${yearStr}-${monthStr}-${String(day).padStart(2, '0')}`;
      const studySessions = sessionsByDate.get(date) ?? [];
      const reviewSessions: ReviewSessionCalendarData[] = []; // Será preenchido na Sprint 14

      const allCompleted = studySessions.length > 0 && studySessions.every((s) => s.completed);
      const anyCompleted = studySessions.some((s) => s.completed);

      allDays.push({
        date,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: date === todayStr,
        studySessions,
        reviewSessions,
        allCompleted,
        anyCompleted,
        hasActivities: studySessions.length > 0,
      });
    }

    return allDays;
  }
}
