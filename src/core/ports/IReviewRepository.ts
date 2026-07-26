import type { Review, UpdateReviewInput } from '../entities/Review';
import type {
  ReviewQuestionnaire,
  CreateQuestionnaireInput,
} from '../entities/ReviewQuestionnaire';
import type { ReviewSessionCalendarData, ReviewStatsData } from '../entities/ProgressData';

export interface IReviewRepository {
  // CRUD Review
  createReview(review: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>): Promise<Review>;
  updateReview(id: string, data: UpdateReviewInput): Promise<Review>;
  deleteReview(id: string): Promise<void>;
  getReviewsByUser(userId: string): Promise<Review[]>;
  getReviewById(id: string): Promise<Review | null>;

  // Questionnaires
  createOrUpdateQuestionnaire(
    input: CreateQuestionnaireInput & { userId: string },
  ): Promise<ReviewQuestionnaire>;
  getQuestionnairesByReview(reviewId: string): Promise<ReviewQuestionnaire[]>;
  getQuestionnaireByDate(reviewId: string, date: string): Promise<ReviewQuestionnaire | null>;

  // Calendário
  getReviewSessionsByDateRange(
    userId: string,
    startDate: string,
    endDate: string,
    reviewIds?: string[],
  ): Promise<ReviewSessionCalendarData[]>;

  // Métricas
  getReviewStats(userId: string, reviewIds?: string[]): Promise<ReviewStatsData>;
}
