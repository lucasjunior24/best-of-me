import type { SharedReview, CreateSharedReviewInput } from '../entities/SharedReview';
import type { Review } from '../entities/Review';

export interface IReviewSharingRepository {
  shareReview(input: CreateSharedReviewInput): Promise<SharedReview>;
  getPendingInvitations(email: string): Promise<SharedReview[]>;
  acceptInvitation(sharedId: string, userId: string): Promise<void>;
  rejectInvitation(sharedId: string): Promise<void>;
  getSharedReviews(userId: string): Promise<Review[]>;
  removeShare(sharedId: string): Promise<void>;
  /** Busca um SharedReview pelo ID da review e usuário destino (para evitar duplicatas) */
  findExistingShare(reviewId: string, sharedWithUserId: string): Promise<SharedReview | null>;
  /** Remove o vínculo de compartilhamento pelo reviewId e userId do convidado */
  removeShareForReview(reviewId: string, sharedWithUserId: string): Promise<void>;
  /** Retorna todos os compartilhamentos de uma review específica */
  getSharesForReview(reviewId: string): Promise<SharedReview[]>;
  /** Busca o email de um usuário pelo ID (para enriquecer convites) */
  getUserEmail(userId: string): Promise<string | null>;
}
