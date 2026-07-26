import type { IReviewRepository } from '../ports/IReviewRepository';
import { NotFoundError } from '../../shared/errorHandler';

export class DeleteReviewUseCase {
  constructor(private readonly reviewRepository: IReviewRepository) {}

  async execute(reviewId: string): Promise<void> {
    const existing = await this.reviewRepository.getReviewById(reviewId);
    if (!existing) {
      throw new NotFoundError('Review', reviewId);
    }

    await this.reviewRepository.deleteReview(reviewId);
  }
}
