import type { ISharingRepository } from '../ports/ISharingRepository';
import type { IStudyRepository } from '../ports/IStudyRepository';
import type { SharedTopic } from '../entities/SharedTopic';
import type { StudyTopic } from '../entities/StudyTopic';

export type PendingInvitation = SharedTopic & {
  topic: StudyTopic | null;
  ownerEmail: string;
};

export class GetPendingInvitationsUseCase {
  constructor(
    private readonly sharingRepository: ISharingRepository,
    private readonly studyRepository: IStudyRepository,
  ) {}

  async execute(email: string): Promise<PendingInvitation[]> {
    const invitations = await this.sharingRepository.getPendingInvitations(email);

    // Buscar os tópicos relacionados aos convites
    const invitationsWithTopics = await Promise.all(
      invitations.map(async (invite) => {
        // Buscar o tópico pelo ownerUserId (dono original)
        const ownerTopics = await this.studyRepository.getTopicsByUser(invite.ownerUserId);
        const topic = ownerTopics.find((t) => t.id === invite.topicId) ?? null;

        return {
          ...invite,
          topic,
          // Usar ownerEmail do documento (salvo no Firestore pelo ShareTopicUseCase)
          ownerEmail: invite.ownerEmail ?? invite.sharedWithEmail ?? 'Usuário',
        } satisfies PendingInvitation;
      }),
    );

    return invitationsWithTopics;
  }
}
