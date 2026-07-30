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

    // Atualizar o tópico adicionando o usuário ao array sharedWith
    const topic = await this.studyRepository
      .getTopicsByUser(invitation.ownerUserId)
      .then((topics) => topics.find((t) => t.id === invitation.topicId));

    if (topic) {
      const currentSharedWith = topic.sharedWith ?? [];
      if (!currentSharedWith.includes(email)) {
        await this.studyRepository.updateTopic(topic.id, {
          sharedWith: [...currentSharedWith, email],
        });
      }
    }

    this.toastService.success('Convite aceito! O tema foi adicionado à sua lista. 🎉');
  }
}
