import type { IReviewRepository } from '../ports/IReviewRepository';
import type { IReviewSharingRepository } from '../ports/IReviewSharingRepository';
import type { Review } from '../entities/Review';
import { NotFoundError } from '../../shared/errorHandler';

export interface SharedReviewStats {
  reviewId: string;
  reviewName: string;
  reviewColor: string;
  myStats: {
    completedReviews: number;
    totalReviews: number;
    averageAccuracy: number;
    percentage: number;
  };
  partnerStats: {
    userId: string;
    email: string;
    completedReviews: number;
    totalReviews: number;
    averageAccuracy: number;
    percentage: number;
  };
  combinedStats: {
    completedReviews: number;
    totalReviews: number;
    averageAccuracy: number;
    percentage: number;
  };
}

export class GetSharedReviewStatsUseCase {
  constructor(
    private readonly reviewRepository: IReviewRepository,
    private readonly reviewSharingRepository: IReviewSharingRepository,
  ) {}

  async execute(userId: string, reviewId: string): Promise<SharedReviewStats> {
    // 1. Buscar a revisão (pode ser do usuário ou de uma compartilhada)
    let review: Review | null = null;

    try {
      review = await this.reviewRepository.getReviewById(reviewId);
    } catch {
      // Tenta buscar nas revisões compartilhadas
    }

    if (!review) {
      // Buscar nas revisões compartilhadas
      const sharedReviews = await this.reviewSharingRepository.getSharedReviews(userId);
      review = sharedReviews.find((r) => r.id === reviewId) ?? null;
    }

    if (!review) {
      throw new NotFoundError('Review', reviewId);
    }

    // 2. Verificar se é compartilhada e identificar o parceiro
    const partnerUserId = this.resolvePartnerUserId(userId, review);
    if (!partnerUserId) {
      throw new Error('Esta revisão não está compartilhada com outro usuário.');
    }

    // 3. Buscar email do parceiro
    const partnerEmail = await this.reviewSharingRepository.getUserEmail(partnerUserId);

    // 4. Buscar questionários do usuário logado
    const myQuestionnaires = await this.reviewRepository.getQuestionnairesByReview(reviewId);
    const myUserIdQuestionnaires = myQuestionnaires.filter((q) => q.userId === userId);

    // 5. Buscar questionários do parceiro
    const partnerQuestionnaires = await this.reviewRepository.getQuestionnairesByReview(reviewId);
    const partnerUserIdQuestionnaires = partnerQuestionnaires.filter(
      (q) => q.userId === partnerUserId,
    );

    // 6. Calcular estatísticas individuais
    const myTotal = review.scheduledDates.length;
    const myCompleted = myUserIdQuestionnaires.length;
    const myPercentage = myTotal > 0 ? Math.round((myCompleted / myTotal) * 100) : 0;
    const myAccuracy =
      myUserIdQuestionnaires.length > 0
        ? Math.round(
            (myUserIdQuestionnaires.reduce((sum, q) => sum + q.correctAnswers, 0) /
              myUserIdQuestionnaires.reduce((sum, q) => sum + q.totalQuestions, 0)) *
              100,
          )
        : 0;

    const partnerTotal = review.scheduledDates.length;
    const partnerCompleted = partnerUserIdQuestionnaires.length;
    const partnerPercentage =
      partnerTotal > 0 ? Math.round((partnerCompleted / partnerTotal) * 100) : 0;
    const partnerAccuracy =
      partnerUserIdQuestionnaires.length > 0
        ? Math.round(
            (partnerUserIdQuestionnaires.reduce((sum, q) => sum + q.correctAnswers, 0) /
              partnerUserIdQuestionnaires.reduce((sum, q) => sum + q.totalQuestions, 0)) *
              100,
          )
        : 0;

    // 7. Calcular combinado (datas únicas com questionário de qualquer usuário)
    const completedDates = new Set<string>();
    for (const q of myUserIdQuestionnaires) {
      completedDates.add(q.date);
    }
    for (const q of partnerUserIdQuestionnaires) {
      completedDates.add(q.date);
    }

    const combinedTotal = review.scheduledDates.length;
    const combinedCompleted = completedDates.size;
    const combinedPercentage =
      combinedTotal > 0 ? Math.round((combinedCompleted / combinedTotal) * 100) : 0;

    // Acuracidade combinada: média das duas acurácias
    const combinedAccuracy =
      myCompleted > 0 || partnerCompleted > 0
        ? Math.round(
            (myAccuracy * myCompleted + partnerAccuracy * partnerCompleted) /
              Math.max(myCompleted + partnerCompleted, 1),
          )
        : 0;

    return {
      reviewId: review.id,
      reviewName: review.name,
      reviewColor: review.color,
      myStats: {
        completedReviews: myCompleted,
        totalReviews: myTotal,
        averageAccuracy: myAccuracy,
        percentage: myPercentage,
      },
      partnerStats: {
        userId: partnerUserId,
        email: partnerEmail ?? partnerUserId,
        completedReviews: partnerCompleted,
        totalReviews: partnerTotal,
        averageAccuracy: partnerAccuracy,
        percentage: partnerPercentage,
      },
      combinedStats: {
        completedReviews: combinedCompleted,
        totalReviews: combinedTotal,
        averageAccuracy: combinedAccuracy,
        percentage: combinedPercentage,
      },
    };
  }

  private resolvePartnerUserId(currentUserId: string, review: Review): string | undefined {
    // Se a revisão pertence a outro usuário e foi compartilhada com o usuário atual
    if (review.ownerUserId && review.ownerUserId !== currentUserId) {
      return review.ownerUserId;
    }

    // Se a revisão pertence ao usuário atual e foi compartilhada com outro
    if (review.sharedWith && review.sharedWith.length > 0) {
      return review.sharedWith[0]; // Pega o primeiro convidado
    }

    return undefined;
  }
}
