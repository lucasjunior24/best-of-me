import type { IStudyRepository } from '../ports/IStudyRepository';
import type { IReviewRepository } from '../ports/IReviewRepository';
import type { ISharingRepository } from '../ports/ISharingRepository';
import type { IReviewSharingRepository } from '../ports/IReviewSharingRepository';
import type { CalendarDayFull, ReviewSessionCalendarData } from '../entities/ProgressData';
import type { StudyTopic } from '../entities/StudyTopic';

export class GetCalendarSessionsUseCase {
  constructor(
    private readonly studyRepository: IStudyRepository,
    private readonly reviewRepository?: IReviewRepository,
    private readonly sharingRepository?: ISharingRepository,
    private readonly reviewSharingRepository?: IReviewSharingRepository,
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

    // Identificar pares (topicId → ownerUserId) para tópicos compartilhados
    // Isso será usado para buscar sessions do owner também
    const sharedTopicOwnerMap = new Map<string, string>(); // topicId → ownerUserId
    const sharedTopicInvitedMap = new Map<string, string[]>(); // topicId → invitedUserIds
    for (const t of uniqueSharedTopics) {
      const ownerId = t.ownerUserId;
      if (ownerId && ownerId !== userId) {
        sharedTopicOwnerMap.set(t.id, ownerId);
      }
    }
    // Também considerar tópicos próprios que foram compartilhados (userId é o owner)
    for (const t of ownTopics) {
      if (t.sharedWith && t.sharedWith.length > 0) {
        sharedTopicInvitedMap.set(t.id, t.sharedWith);
      }
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
              completedBy: session.completedBy,
            }));
            await this.studyRepository.scheduleSessions(mirroredSessions);
          }
        } catch {
          // Se o owner não existir mais ou o tópico tiver sido deletado, ignorar
        }
      }
    }

    // Buscar sessões de estudo do usuário logado
    const sessions = await this.studyRepository.getSessionsByDateRange(
      userId,
      startDate,
      endDate,
      topicIds,
    );

    // ---- T26.1: Buscar sessions de outros usuários para tópicos compartilhados ----
    // Para cada tópico compartilhado, buscar sessions do outro usuário também
    const otherUserSessionsMap = new Map<
      string,
      Array<{
        sessionId: string;
        userId: string;
        completed: boolean;
        completedAt?: Date;
        completedBy?: string;
      }>
    >();
    // dateKey → sessions do outro usuário
    const otherUserSessionsByDate = new Map<
      string,
      Array<{
        sessionId: string;
        userId: string;
        topicId: string;
        completed: boolean;
        completedAt?: Date;
        completedBy?: string;
      }>
    >();

    // Buscar sessions dos owners para tópicos que este usuário recebeu compartilhados
    for (const [topicId, ownerId] of sharedTopicOwnerMap.entries()) {
      try {
        const ownerSessions = await this.studyRepository.getSessionsByDateRange(
          ownerId,
          startDate,
          endDate,
          [topicId],
        );
        for (const s of ownerSessions) {
          const key = `${s.date}|${s.topicId}|${ownerId}`;
          if (!otherUserSessionsMap.has(key)) {
            otherUserSessionsMap.set(key, []);
          }
          otherUserSessionsMap.get(key)!.push({
            sessionId: s.id,
            userId: ownerId,
            completed: s.completed,
            completedAt: s.completedAt,
            completedBy: s.completedBy,
          });

          if (!otherUserSessionsByDate.has(s.date)) {
            otherUserSessionsByDate.set(s.date, []);
          }
          otherUserSessionsByDate.get(s.date)!.push({
            sessionId: s.id,
            userId: ownerId,
            topicId: s.topicId,
            completed: s.completed,
            completedAt: s.completedAt,
            completedBy: s.completedBy,
          });
        }
      } catch {
        // Ignorar erros ao buscar sessions de outros usuários
      }
    }

    // Buscar sessions dos convidados para tópicos que este usuário (owner) compartilhou
    for (const [topicId, invitedUserIds] of sharedTopicInvitedMap.entries()) {
      for (const invitedId of invitedUserIds) {
        try {
          const invitedSessions = await this.studyRepository.getSessionsByDateRange(
            invitedId,
            startDate,
            endDate,
            [topicId],
          );
          for (const s of invitedSessions) {
            const key = `${s.date}|${s.topicId}|${invitedId}`;
            if (!otherUserSessionsMap.has(key)) {
              otherUserSessionsMap.set(key, []);
            }
            otherUserSessionsMap.get(key)!.push({
              sessionId: s.id,
              userId: invitedId,
              completed: s.completed,
              completedAt: s.completedAt,
              completedBy: s.completedBy,
            });

            if (!otherUserSessionsByDate.has(s.date)) {
              otherUserSessionsByDate.set(s.date, []);
            }
            otherUserSessionsByDate.get(s.date)!.push({
              sessionId: s.id,
              userId: invitedId,
              topicId: s.topicId,
              completed: s.completed,
              completedAt: s.completedAt,
              completedBy: s.completedBy,
            });
          }
        } catch {
          // Ignorar erros
        }
      }
    }

    // Resolver emails dos outros usuários para exibição
    const otherUserEmailMap = new Map<string, string>();
    const allOtherUserIds = new Set<string>();
    for (const sessions of otherUserSessionsMap.values()) {
      for (const s of sessions) {
        allOtherUserIds.add(s.userId);
      }
    }
    if (this.sharingRepository) {
      for (const uid of allOtherUserIds) {
        try {
          const email = await this.sharingRepository.getUserEmail(uid);
          if (email) otherUserEmailMap.set(uid, email);
        } catch {
          // Ignorar
        }
      }
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
        notes: session.notes,
        userId: session.userId,
        completedBy: session.completedBy,
      });
    }

    // --- T26.1: Adicionar sessions do outro usuário como linhas separadas ---
    for (const [date, otherSessions] of otherUserSessionsByDate.entries()) {
      if (!sessionsByDate.has(date)) {
        sessionsByDate.set(date, []);
      }

      for (const os of otherSessions) {
        const topic = topicMap.get(os.topicId);
        if (!topic) continue;

        // Verificar se o usuário logado já tem uma session própria para o mesmo topicId+date
        const hasOwnSession = sessionsByDate
          .get(date)!
          .some((s) => s.topicId === os.topicId && s.userId === userId);

        if (!hasOwnSession) {
          // Adicionar a session do outro usuário como linha informativa (não toggleável)
          sessionsByDate.get(date)!.push({
            sessionId: os.sessionId,
            topicId: os.topicId,
            topicName: topic.name,
            topicColor: topic.color,
            completed: os.completed,
            completedAt: os.completedAt,
            hoursPerDay: topic.hoursPerDay,
            userId: os.userId,
            completedBy: os.completedBy,
          });
        }
      }
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
        list.push({ ...rs, userId });
        reviewSessionsByDate.set(rs.date, list);
      }

      // ---- T26.1: Buscar questionários de outros usuários para revisões compartilhadas ----
      if (this.reviewSharingRepository) {
        try {
          const sharedReviews = await this.reviewSharingRepository.getSharedReviews(userId);

          // Para cada revisão compartilhada, buscar questionários do outro usuário
          for (const review of sharedReviews) {
            const otherUserId = review.ownerUserId !== userId ? review.ownerUserId : undefined;
            if (!otherUserId || !review.sharedWith) continue;

            // Encontrar o outro userId (pode ser dono ou convidado)
            let targetUserId: string | undefined;
            if (review.ownerUserId && review.ownerUserId !== userId) {
              targetUserId = review.ownerUserId;
            } else if (review.sharedWith && review.sharedWith.length > 0) {
              targetUserId = review.sharedWith.find((id) => id !== userId);
            }

            if (!targetUserId) continue;

            try {
              const otherReviewSessions = await this.reviewRepository.getReviewSessionsByDateRange(
                targetUserId,
                startDate,
                endDate,
                [review.id],
              );

              for (const ors of otherReviewSessions) {
                const list = reviewSessionsByDate.get(ors.date) ?? [];

                // Verificar se o usuário logado já tem uma session de revisão própria nesta data
                const hasOwnReview = list.some(
                  (r) => r.reviewId === ors.reviewId && r.userId === userId,
                );

                if (!hasOwnReview) {
                  const otherEmail = otherUserEmailMap.get(targetUserId) ?? targetUserId;
                  list.push({
                    ...ors,
                    userId: targetUserId,
                    questionnaire: ors.questionnaire
                      ? {
                          ...ors.questionnaire,
                          userId: targetUserId,
                          userEmail: otherEmail,
                        }
                      : undefined,
                  });
                }
              }
            } catch {
              // Ignorar erro ao buscar questionários de outro usuário
            }
          }
        } catch {
          // Ignorar erros de busca de revisões compartilhadas
        }
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
