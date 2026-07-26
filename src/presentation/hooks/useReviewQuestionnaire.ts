import { useState, useCallback } from 'react';
import type {
  ReviewQuestionnaire,
  CreateQuestionnaireInput,
} from '../../core/entities/ReviewQuestionnaire';
import { container } from '../../di/container';
import { handleError } from '../../shared/errorHandler';

interface UseReviewQuestionnaireReturn {
  questionnaires: ReviewQuestionnaire[];
  loading: boolean;
  error: string | null;
  loadQuestionnaires: (userId: string, reviewId: string) => Promise<void>;
  saveQuestionnaire: (
    userId: string,
    input: CreateQuestionnaireInput,
  ) => Promise<ReviewQuestionnaire | null>;
  getQuestionnaireForDate: (reviewId: string, date: string) => Promise<ReviewQuestionnaire | null>;
}

export function useReviewQuestionnaire(): UseReviewQuestionnaireReturn {
  const [questionnaires, setQuestionnaires] = useState<ReviewQuestionnaire[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQuestionnaires = useCallback(async (_userId: string, reviewId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await container.reviewRepository.getQuestionnairesByReview(reviewId);
      setQuestionnaires(result);
    } catch (err) {
      const message = handleError(err);
      setError(message);
      container.toastService.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveQuestionnaire = useCallback(
    async (
      userId: string,
      input: CreateQuestionnaireInput,
    ): Promise<ReviewQuestionnaire | null> => {
      setError(null);
      try {
        const result = await container.useCases.createOrUpdateQuestionnaire.execute(userId, input);
        setQuestionnaires((prev) => {
          const existing = prev.findIndex(
            (q) => q.reviewId === input.reviewId && q.date === input.date,
          );
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = result;
            return updated;
          }
          return [...prev, result];
        });
        container.toastService.success('Questionário registrado! 🎉');
        return result;
      } catch (err) {
        const message = handleError(err);
        setError(message);
        container.toastService.error(message);
        return null;
      }
    },
    [],
  );

  const getQuestionnaireForDate = useCallback(
    async (reviewId: string, date: string): Promise<ReviewQuestionnaire | null> => {
      try {
        return await container.reviewRepository.getQuestionnaireByDate(reviewId, date);
      } catch (err) {
        const message = handleError(err);
        setError(message);
        container.toastService.error(message);
        return null;
      }
    },
    [],
  );

  return {
    questionnaires,
    loading,
    error,
    loadQuestionnaires,
    saveQuestionnaire,
    getQuestionnaireForDate,
  };
}
