import type { IStudyRepository } from '../ports/IStudyRepository';
import type { CalendarDay } from '../entities/ProgressData';
import type { StudyTopic } from '../entities/StudyTopic';

export class GetCalendarSessionsUseCase {
  constructor(private readonly studyRepository: IStudyRepository) {}

  async execute(
    userId: string,
    startDate: string,
    endDate: string,
    topicIds?: string[],
  ): Promise<CalendarDay[]> {
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

    const sessionsByDate = new Map<string, CalendarDay>();

    for (const session of sessions) {
      const topic = topicMap.get(session.topicId);
      if (!topic) continue;

      if (!sessionsByDate.has(session.date)) {
        sessionsByDate.set(session.date, {
          date: session.date,
          sessions: [],
          allCompleted: true,
          anyCompleted: false,
        });
      }

      const calendarDay = sessionsByDate.get(session.date)!;

      calendarDay.sessions.push({
        sessionId: session.id,
        topicId: session.topicId,
        topicName: topic.name,
        topicColor: topic.color,
        completed: session.completed,
        completedAt: session.completedAt,
        hoursPerDay: topic.hoursPerDay,
      });

      if (session.completed) {
        calendarDay.anyCompleted = true;
      } else {
        calendarDay.allCompleted = false;
      }
    }

    return Array.from(sessionsByDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  }
}
