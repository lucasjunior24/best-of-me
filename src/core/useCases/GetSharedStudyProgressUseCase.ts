import type { IStudyRepository } from '../ports/IStudyRepository';
import type { ISharingRepository } from '../ports/ISharingRepository';
import type { StudyTopic } from '../entities/StudyTopic';
import { NotFoundError } from '../../shared/errorHandler';

export interface SharedTopicProgress {
  topicId: string;
  topicName: string;
  topicColor: string;
  myProgress: {
    completedSessions: number;
    totalSessions: number;
    percentage: number;
  };
  partnerProgress: {
    userId: string;
    email: string;
    completedSessions: number;
    totalSessions: number;
    percentage: number;
  };
  combinedProgress: {
    completedSessions: number;
    totalSessions: number;
    percentage: number;
  };
}

export class GetSharedStudyProgressUseCase {
  constructor(
    private readonly studyRepository: IStudyRepository,
    private readonly sharingRepository: ISharingRepository,
  ) {}

  async execute(userId: string, topicId: string): Promise<SharedTopicProgress> {
    // 1. Buscar os tópicos do usuário (próprios + compartilhados)
    const ownTopics = await this.studyRepository.getTopicsByUser(userId);
    const sharedTopics = await this.sharingRepository.getSharedTopics(userId);

    // Combinar para encontrar o tópico
    const allTopics = [...ownTopics, ...sharedTopics];
    const topic = allTopics.find((t) => t.id === topicId);

    if (!topic) {
      throw new NotFoundError('StudyTopic', topicId);
    }

    // 2. Verificar se é compartilhado e identificar o parceiro
    const partnerUserId = this.resolvePartnerUserId(userId, topic);
    if (!partnerUserId) {
      throw new Error('Este tópico não está compartilhado com outro usuário.');
    }

    // 3. Buscar email do parceiro
    const partnerEmail = await this.sharingRepository.getUserEmail(partnerUserId);

    // 4. Buscar sessions do usuário logado para este tópico
    const mySessions = await this.studyRepository.getSessionsByDateRange(
      userId,
      '2024-01-01',
      '2099-12-31',
      [topicId],
    );

    // 5. Buscar sessions do parceiro para este mesmo tópico
    const partnerSessions = await this.studyRepository.getSessionsByDateRange(
      partnerUserId,
      '2024-01-01',
      '2099-12-31',
      [topicId],
    );

    // 6. Calcular progresso individual
    const myCompleted = mySessions.filter((s) => s.completed).length;
    const myTotal = mySessions.length;
    const myPercentage = myTotal > 0 ? Math.round((myCompleted / myTotal) * 100) : 0;

    const partnerCompleted = partnerSessions.filter((s) => s.completed).length;
    const partnerTotal = partnerSessions.length;
    const partnerPercentage =
      partnerTotal > 0 ? Math.round((partnerCompleted / partnerTotal) * 100) : 0;

    // 7. Calcular progresso combinado (sessions únicas por data)
    const uniqueDates = new Set<string>();
    const completedDates = new Set<string>();

    for (const s of mySessions) {
      uniqueDates.add(s.date);
      if (s.completed) completedDates.add(s.date);
    }
    for (const s of partnerSessions) {
      uniqueDates.add(s.date);
      if (s.completed) completedDates.add(s.date);
    }

    const combinedTotal = uniqueDates.size;
    const combinedCompleted = completedDates.size;
    const combinedPercentage =
      combinedTotal > 0 ? Math.round((combinedCompleted / combinedTotal) * 100) : 0;

    return {
      topicId: topic.id,
      topicName: topic.name,
      topicColor: topic.color,
      myProgress: {
        completedSessions: myCompleted,
        totalSessions: myTotal,
        percentage: myPercentage,
      },
      partnerProgress: {
        userId: partnerUserId,
        email: partnerEmail ?? partnerUserId,
        completedSessions: partnerCompleted,
        totalSessions: partnerTotal,
        percentage: partnerPercentage,
      },
      combinedProgress: {
        completedSessions: combinedCompleted,
        totalSessions: combinedTotal,
        percentage: combinedPercentage,
      },
    };
  }

  private resolvePartnerUserId(currentUserId: string, topic: StudyTopic): string | undefined {
    // Se o tópico pertence a outro usuário e foi compartilhado com o usuário atual
    if (topic.ownerUserId && topic.ownerUserId !== currentUserId) {
      return topic.ownerUserId;
    }

    // Se o tópico pertence ao usuário atual e foi compartilhado com outro
    if (topic.sharedWith && topic.sharedWith.length > 0) {
      return topic.sharedWith[0]; // Pega o primeiro convidado
    }

    return undefined;
  }
}
