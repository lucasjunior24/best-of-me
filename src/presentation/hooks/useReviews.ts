import { useState, useCallback } from 'react';
import type { Review, CreateReviewInput, UpdateReviewInput } from '../../core/entities/Review';
import { container } from '../../di/container';
import { handleError } from '../../shared/errorHandler';

interface UseReviewsReturn {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  loadReviews: (userId: string) => Promise<void>;
  createReview: (userId: string, input: CreateReviewInput) => Promise<Review | null>;
  updateReview: (id: string, data: UpdateReviewInput) => Promise<Review | null>;
  deleteReview: (id: string) => Promise<boolean>;
}

export function useReviews(): UseReviewsReturn {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReviews = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await container.reviewRepository.getReviewsByUser(userId);
      setReviews(result);
    } catch (err) {
      const message = handleError(err);
      setError(message);
      container.toastService.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createReview = useCallback(
    async (userId: string, input: CreateReviewInput): Promise<Review | null> => {
      setError(null);
      try {
        const created = await container.useCases.createReview.execute(userId, input);
        setReviews((prev) => [created, ...prev]);
        container.toastService.success('Revisão criada! 🎉');
        return created;
      } catch (err) {
        const message = handleError(err);
        setError(message);
        container.toastService.error(message);
        return null;
      }
    },
    [],
  );

  const updateReview = useCallback(
    async (id: string, data: UpdateReviewInput): Promise<Review | null> => {
      setError(null);
      try {
        const updated = await container.useCases.updateReview.execute(id, data);
        setReviews((prev) => prev.map((r) => (r.id === id ? updated : r)));
        container.toastService.success('Revisão atualizada!');
        return updated;
      } catch (err) {
        const message = handleError(err);
        setError(message);
        container.toastService.error(message);
        return null;
      }
    },
    [],
  );

  const deleteReview = useCallback(async (id: string): Promise<boolean> => {
    setError(null);
    try {
      await container.useCases.deleteReview.execute(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      container.toastService.success('Revisão excluída!');
      return true;
    } catch (err) {
      const message = handleError(err);
      setError(message);
      container.toastService.error(message);
      return false;
    }
  }, []);

  return {
    reviews,
    loading,
    error,
    loadReviews,
    createReview,
    updateReview,
    deleteReview,
  };
}
