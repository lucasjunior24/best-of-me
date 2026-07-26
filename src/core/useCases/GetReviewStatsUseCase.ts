import type { IReviewRepository } from '../ports/IReviewRepository';
import type { ReviewStatsData } from '../entities/ProgressData';

export class GetReviewStatsUseCase {
  constructor(private readonly reviewRepository: IReviewRepository) {}

  async execute(userId: string, reviewIds?: string[]): Promise<ReviewStatsData> {
    return this.reviewRepository.getReviewStats(userId, reviewIds);
  }
}
