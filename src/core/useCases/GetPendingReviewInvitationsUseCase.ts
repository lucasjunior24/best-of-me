import type { IReviewSharingRepository } from '../ports/IReviewSharingRepository';
import type { IReviewRepository } from '../ports/IReviewRepository';
import type { SharedReview } from '../entities/SharedReview';
import type { Review } from '../entities/Review';

export type PendingReviewInvitation = SharedReview & {
  review: Review | null;
  ownerEmail: string;
};

export class GetPendingReviewInvitationsUseCase {
  constructor(
    private readonly sharingRepository: IReviewSharingRepository,
    private readonly reviewRepository: IReviewRepository,
  ) {}

  async execute(email: string): Promise<PendingReviewInvitation[]> {
    const invitations = await this.sharingRepository.getPendingInvitations(email);

    // Buscar as reviews relacionadas aos convites
    const invitationsWithReviews = await Promise.all(
      invitations.map(async (invite) => {
        // Buscar a review pelo ownerUserId (dono original)
        const ownerReviews = await this.reviewRepository.getReviewsByUser(invite.ownerUserId);
        const review = ownerReviews.find((r) => r.id === invite.reviewId) ?? null;

        return {
          ...invite,
          review,
          ownerEmail: invite.ownerEmail ?? invite.sharedWithEmail ?? 'Usuário',
        } satisfies PendingReviewInvitation;
      }),
    );

    return invitationsWithReviews;
  }
}
