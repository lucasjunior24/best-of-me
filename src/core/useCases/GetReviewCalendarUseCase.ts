import type { IReviewRepository } from '../ports/IReviewRepository';
import type { ReviewSessionCalendarData } from '../entities/ProgressData';

export class GetReviewCalendarUseCase {
  constructor(private readonly reviewRepository: IReviewRepository) {}

  async execute(
    userId: string,
    startDate: string,
    endDate: string,
    reviewIds?: string[],
  ): Promise<ReviewSessionCalendarData[]> {
    return this.reviewRepository.getReviewSessionsByDateRange(
      userId,
      startDate,
      endDate,
      reviewIds,
    );
  }
}
