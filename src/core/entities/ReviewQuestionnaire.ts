export interface ReviewQuestionnaire {
  id: string;
  userId: string;
  reviewId: string;
  date: string; // "YYYY-MM-DD"
  totalQuestions: number;
  correctAnswers: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateQuestionnaireInput = {
  reviewId: string;
  date: string;
  totalQuestions: number;
  correctAnswers: number;
};

/**
 * Calcula a acurácia (percentual de acerto) de um questionário.
 */
export function calculateAccuracy(correctAnswers: number, totalQuestions: number): number {
  if (totalQuestions <= 0) return 0;
  return Math.round((correctAnswers / totalQuestions) * 100);
}
