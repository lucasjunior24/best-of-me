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
          ownerEmail: invite.sharedWithEmail, // No contexto de pending, o email está em sharedWithEmail? Não, o sharedWithEmail é do convidado.
          // Vamos usar o campo correto: buscar o email do dono
        } as PendingInvitation;
      }),
    );

    // Corrigir ownerEmail: precisamos buscar o email do dono.
    // Como SharedTopic não tem ownerEmail diretamente, vamos extrair do tópico ou manter um fallback.
    // Na prática, o FirebaseSharingRepository pode enriquecer isso, mas no domínio mantemos simples.
    return invitationsWithTopics.map((invite) => {
      // sharedWithEmail aqui é do convidado. O ownerEmail não está disponível
      // no SharedTopic diretamente. O FirebaseSharingRepository (Sprint 22)
      // terá que enriquecer com o email do dono.
      return {
        ...invite,
        ownerEmail: 'Usuário', // placeholder; será enriquecido pelo repositório na Sprint 22
      };
    });
  }
}
