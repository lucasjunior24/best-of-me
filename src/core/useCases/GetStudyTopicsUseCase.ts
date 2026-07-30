import type { IStudyRepository } from '../ports/IStudyRepository';
import type { ISharingRepository } from '../ports/ISharingRepository';
import type { StudyTopic } from '../entities/StudyTopic';

export class GetStudyTopicsUseCase {
  constructor(
    private readonly studyRepository: IStudyRepository,
    private readonly sharingRepository?: ISharingRepository,
  ) {}

  async execute(userId: string): Promise<StudyTopic[]> {
    const ownTopics = await this.studyRepository.getTopicsByUser(userId);

    // Buscar temas compartilhados (onde o usuário está no array sharedWith)
    const sharedTopics = this.sharingRepository
      ? await this.sharingRepository.getSharedTopics(userId)
      : [];

    // Marcar temas compartilhados com isShared e ownerUserId
    const markedSharedTopics = sharedTopics.map((topic) => ({
      ...topic,
      isShared: true,
      ownerUserId: topic.ownerUserId ?? topic.userId,
    }));

    // Combinar: temas próprios + temas compartilhados
    // Evitar duplicatas (se um tema já está nos próprios, não duplicar)
    const ownTopicIds = new Set(ownTopics.map((t) => t.id));
    const uniqueSharedTopics = markedSharedTopics.filter((t) => !ownTopicIds.has(t.id));

    return [...ownTopics, ...uniqueSharedTopics];
  }
}
