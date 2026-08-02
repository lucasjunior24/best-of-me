import type { IReviewSharingRepository } from '../ports/IReviewSharingRepository';
import type { IReviewRepository } from '../ports/IReviewRepository';
import type { IAuthRepository } from '../ports/IAuthRepository';
import type { IToastService } from '../ports/IToastService';
import type { SharedReview } from '../entities/SharedReview';
import { ValidationError, NotFoundError } from '../../shared/errorHandler';

export class ShareReviewUseCase {
  constructor(
    private readonly sharingRepository: IReviewSharingRepository,
    private readonly reviewRepository: IReviewRepository,
    private readonly authRepository: IAuthRepository,
    private readonly toastService: IToastService,
  ) {}

  async execute(
    reviewId: string,
    ownerUserId: string,
    targetEmail: string,
    permission: 'edit' | 'view',
  ): Promise<SharedReview> {
    // Validar que o e-mail não é o do próprio dono
    const currentUser = this.authRepository.getCurrentUser();
    if (currentUser && currentUser.email === targetEmail) {
      throw new ValidationError('Você não pode compartilhar uma revisão consigo mesmo.');
    }

    // Verificar se a review existe e pertence ao usuário
    const reviews = await this.reviewRepository.getReviewsByUser(ownerUserId);
    const review = reviews.find((r) => r.id === reviewId);

    if (!review) {
      throw new NotFoundError('Review', reviewId);
    }

    // Buscar usuário destino pelo e-mail
    const targetUser = await this.authRepository.getUserByEmail(targetEmail);
    if (!targetUser) {
      throw new NotFoundError('User', targetEmail);
    }

    // Verificar se já existe compartilhamento pendente ou aceito
    const existing = await this.sharingRepository.findExistingShare(reviewId, targetUser.id);
    if (existing && (existing.status === 'pending' || existing.status === 'accepted')) {
      throw new ValidationError(
        existing.status === 'pending'
          ? 'Já existe um convite pendente para este usuário.'
          : 'Esta revisão já foi compartilhada com este usuário.',
      );
    }

    // Criar compartilhamento
    const sharedReview = await this.sharingRepository.shareReview({
      reviewId,
      ownerUserId,
      ownerEmail: currentUser?.email ?? undefined,
      sharedWithUserId: targetUser.id,
      sharedWithEmail: targetEmail,
      permission,
    });

    this.toastService.success(`Convite enviado para ${targetEmail}! 📨`);

    return sharedReview;
  }
}
