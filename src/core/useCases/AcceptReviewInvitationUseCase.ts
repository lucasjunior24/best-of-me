import type { IReviewSharingRepository } from '../ports/IReviewSharingRepository';
import type { IReviewRepository } from '../ports/IReviewRepository';
import type { IToastService } from '../ports/IToastService';
import { ValidationError, NotFoundError } from '../../shared/errorHandler';

export class AcceptReviewInvitationUseCase {
  constructor(
    private readonly sharingRepository: IReviewSharingRepository,
    private readonly reviewRepository: IReviewRepository,
    private readonly toastService: IToastService,
  ) {}

  async execute(sharedId: string, email: string, userId: string): Promise<void> {
    // Buscar o convite para validar
    const invitations = await this.sharingRepository.getPendingInvitations(email);
    const invitation = invitations.find((inv) => inv.id === sharedId);

    if (!invitation) {
      throw new NotFoundError('SharedReview', sharedId);
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

    // Atualizar a review adicionando o userId do convidado ao array sharedWith
    const review = await this.reviewRepository
      .getReviewsByUser(invitation.ownerUserId)
      .then((reviews) => reviews.find((r) => r.id === invitation.reviewId));

    if (review) {
      const currentSharedWith = review.sharedWith ?? [];
      if (!currentSharedWith.includes(userId)) {
        const updateInput: import('../entities/Review').UpdateReviewInput = {
          sharedWith: [...currentSharedWith, userId],
        };
        await this.reviewRepository.updateReview(review.id, updateInput);
      }
    }

    this.toastService.success('Convite aceito! A revisão foi adicionada à sua lista. 🎉');
  }
}
