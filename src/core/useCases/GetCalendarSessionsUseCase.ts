import type { IStudyRepository } from '../ports/IStudyRepository';
import type { IReviewRepository } from '../ports/IReviewRepository';
import type { ISharingRepository } from '../ports/ISharingRepository';
import type { CalendarDayFull, ReviewSessionCalendarData } from '../entities/ProgressData';
import type { StudyTopic } from '../entities/StudyTopic';

export class GetCalendarSessionsUseCase {
  constructor(
    private readonly studyRepository: IStudyRepository,
    private readonly reviewRepository?: IReviewRepository,
    private readonly sharingRepository?: ISharingRepository,
  ) {}

  async execute(
    userId: string,
    startDate: string,
    endDate: string,
    topicIds?: string[],
  ): Promise<CalendarDayFull[]> {
    // Buscar tópicos próprios + compartilhados para o mapa de nomes/cores
    const ownTopics = await this.studyRepository.getTopicsByUser(userId);
    const sharedTopics = this.sharingRepository
      ? await this.sharingRepository.getSharedTopics(userId)
      : [];

    // Marcar tópicos compartilhados para referência visual
    const markedSharedTopics = sharedTopics.map((t) => ({
      ...t,
      isShared: true,
      ownerUserId: t.ownerUserId ?? t.userId,
    }));

    // Combinar evitando duplicatas
    const ownTopicIds = new Set(ownTopics.map((t) => t.id));
    const uniqueSharedTopics = markedSharedTopics.filter((t) => !ownTopicIds.has(t.id));
    const allTopics = [...ownTopics, ...uniqueSharedTopics];

    const topicMap = new Map<string, StudyTopic>();
    for (const topic of allTopics) {
      topicMap.set(topic.id, topic);
    }

    // Sincronizar sessions de tópicos compartilhados (owner → invited user)
    // Isso garante que novas sessions adicionadas pelo owner após o aceite
    // apareçam no calendário do usuário convidado
    if (this.sharingRepository && uniqueSharedTopics.length > 0) {
      for (const sharedTopic of uniqueSharedTopics) {
        const ownerUserId = sharedTopic.ownerUserId;
        if (!ownerUserId || ownerUserId === userId) continue;

        try {
          // Buscar sessions do owner para este tópico
          const ownerSessions = await this.studyRepository.getSessionsByDateRange(
            ownerUserId,
            '2024-01-01',
            '2099-12-31',
            [sharedTopic.id],
          );

          if (ownerSessions.length > 0) {
            // Espelhar apenas sessions que ainda não existem no usuário
            const mirroredSessions = ownerSessions.map((session) => ({
              userId,
              topicId: session.topicId,
              date: session.date,
              duration: session.duration,
              createdBy: session.userId,
            }));
            await this.studyRepository.scheduleSessions(mirroredSessions);
          }
        } catch {
          // Se o owner não existir mais ou o tópico tiver sido deletado, ignorar
        }
      }
    }

    // Buscar sessões de estudo (inclui sessions espelhadas de temas compartilhados)
    const sessions = await this.studyRepository.getSessionsByDateRange(
      userId,
      startDate,
      endDate,
      topicIds,
    );

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
        notes: session.notes,
      });
    }

    // Buscar sessões de revisão (se o repository estiver disponível)
    const reviewSessionsByDate = new Map<string, ReviewSessionCalendarData[]>();
    if (this.reviewRepository) {
      const reviewSessions = await this.reviewRepository.getReviewSessionsByDateRange(
        userId,
        startDate,
        endDate,
      );

      for (const rs of reviewSessions) {
        const list = reviewSessionsByDate.get(rs.date) ?? [];
        list.push(rs);
        reviewSessionsByDate.set(rs.date, list);
      }
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
      const reviewSessions = reviewSessionsByDate.get(date) ?? [];

      // allCompleted: todas as atividades do dia (estudos + revisões) concluídas
      const allStudyCompleted = studySessions.every((s) => s.completed);
      const allReviewCompleted = reviewSessions.every((r) => r.completed);
      const totalActivities = studySessions.length + reviewSessions.length;
      const allCompleted = totalActivities > 0 && allStudyCompleted && allReviewCompleted;

      const anyCompleted =
        studySessions.some((s) => s.completed) || reviewSessions.some((r) => r.completed);

      allDays.push({
        date,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: date === todayStr,
        studySessions,
        reviewSessions,
        allCompleted,
        anyCompleted,
        hasActivities: totalActivities > 0,
      });
    }

    return allDays;
  }
}
