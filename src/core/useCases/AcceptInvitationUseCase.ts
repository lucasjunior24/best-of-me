import type { ISharingRepository } from '../ports/ISharingRepository';
import type { IStudyRepository } from '../ports/IStudyRepository';
import type { IToastService } from '../ports/IToastService';
import { ValidationError, NotFoundError } from '../../shared/errorHandler';

export class AcceptInvitationUseCase {
  constructor(
    private readonly sharingRepository: ISharingRepository,
    private readonly studyRepository: IStudyRepository,
    private readonly toastService: IToastService,
  ) {}

  async execute(sharedId: string, email: string, userId: string): Promise<void> {
    // Buscar o convite para validar
    const invitations = await this.sharingRepository.getPendingInvitations(email);
    const invitation = invitations.find((inv) => inv.id === sharedId);

    if (!invitation) {
      throw new NotFoundError('SharedTopic', sharedId);
    }

    if (invitation.sharedWithEmail !== email) {
      throw new ValidationError('Este convite não pertence a você.');
    }

    if (invitation.status !== 'pending') {
      throw new ValidationError(
        `Este convite já foi ${invitation.status === 'accepted' ? 'aceito' : 'recusado'}.`,
      );
    }

    // Aceitar o convite
    await this.sharingRepository.acceptInvitation(sharedId, userId);

    // Atualizar o tópico adicionando o userId do convidado ao array sharedWith
    const topic = await this.studyRepository
      .getTopicsByUser(invitation.ownerUserId)
      .then((topics) => topics.find((t) => t.id === invitation.topicId));

    if (topic) {
      const currentSharedWith = topic.sharedWith ?? [];
      if (!currentSharedWith.includes(userId)) {
        await this.studyRepository.updateTopic(topic.id, {
          sharedWith: [...currentSharedWith, userId],
        });
      }

      // Espelhar sessions existentes do owner para o usuário convidado
      // para que ele possa ver o progresso no calendário
      const ownerSessions = await this.studyRepository.getSessionsByDateRange(
        invitation.ownerUserId,
        '2024-01-01',
        '2099-12-31',
        [invitation.topicId],
      );

      if (ownerSessions.length > 0) {
        const mirroredSessions = ownerSessions.map((session) => ({
          userId,
          topicId: session.topicId,
          date: session.date,
          duration: session.duration,
          createdBy: session.userId,
        }));
        await this.studyRepository.scheduleSessions(mirroredSessions);
      }
    }

    this.toastService.success('Convite aceito! O tema foi adicionado à sua lista. 🎉');
  }
}
