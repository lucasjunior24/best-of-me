import { useState, useCallback } from 'react';
import type { ReviewStatsData } from '../../core/entities/ProgressData';
import { container } from '../../di/container';
import { handleError } from '../../shared/errorHandler';

interface UseReviewStatsReturn {
  stats: ReviewStatsData | null;
  loading: boolean;
  error: string | null;
  loadStats: (userId: string) => Promise<void>;
  filterByReview: (userId: string, reviewIds: string[]) => Promise<void>;
}

export function useReviewStats(): UseReviewStatsReturn {
  const [stats, setStats] = useState<ReviewStatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await container.useCases.getReviewStats.execute(userId);
      setStats(result);
    } catch (err) {
      const message = handleError(err);
      setError(message);
      container.toastService.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const filterByReview = useCallback(async (userId: string, reviewIds: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const result = await container.useCases.getReviewStats.execute(
        userId,
        reviewIds.length > 0 ? reviewIds : undefined,
      );
      setStats(result);
    } catch (err) {
      const message = handleError(err);
      setError(message);
      container.toastService.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    stats,
    loading,
    error,
    loadStats,
    filterByReview,
  };
}
