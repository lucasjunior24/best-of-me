import { useState, useCallback } from 'react';
import type { SharedReviewStats } from '../../core/useCases/GetSharedReviewStatsUseCase';
import { container } from '../../di/container';
import { handleError } from '../../shared/errorHandler';

interface UseSharedReviewStatsReturn {
  /** Mapa de reviewId → SharedReviewStats (apenas revisões compartilhadas) */
  sharedStatsMap: Map<string, SharedReviewStats>;
  loading: boolean;
  error: string | null;
  /** Carrega estatísticas compartilhadas para uma lista de revisões */
  loadSharedStats: (
    userId: string,
    sharedReviews: Array<{
      id: string;
      isShared?: boolean;
      sharedWith?: string[];
      ownerUserId?: string;
    }>,
  ) => Promise<void>;
  /** Carrega estatísticas compartilhadas para uma única revisão */
  loadStatsForReview: (userId: string, reviewId: string) => Promise<SharedReviewStats | null>;
}

export function useSharedReviewStats(): UseSharedReviewStatsReturn {
  const [sharedStatsMap, setSharedStatsMap] = useState<Map<string, SharedReviewStats>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSharedStats = useCallback(
    async (
      userId: string,
      sharedReviews: Array<{
        id: string;
        isShared?: boolean;
        sharedWith?: string[];
        ownerUserId?: string;
      }>,
    ) => {
      setLoading(true);
      setError(null);
      const map = new Map<string, SharedReviewStats>();

      try {
        // Filtrar apenas revisões que são compartilhadas
        const trulyShared = sharedReviews.filter(
          (r) => r.isShared || (r.sharedWith && r.sharedWith.length > 0),
        );

        for (const review of trulyShared) {
          try {
            const stats = await container.useCases.sharedReviewStats.execute(userId, review.id);
            map.set(review.id, stats);
          } catch {
            // Ignorar revisões que não estão compartilhadas ou deram erro
          }
        }

        setSharedStatsMap(map);
      } catch (err) {
        const message = handleError(err);
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const loadStatsForReview = useCallback(
    async (userId: string, reviewId: string): Promise<SharedReviewStats | null> => {
      try {
        const stats = await container.useCases.sharedReviewStats.execute(userId, reviewId);
        setSharedStatsMap((prev) => {
          const next = new Map(prev);
          next.set(reviewId, stats);
          return next;
        });
        return stats;
      } catch (err) {
        const message = handleError(err);
        setError(message);
        return null;
      }
    },
    [],
  );

  return {
    sharedStatsMap,
    loading,
    error,
    loadSharedStats,
    loadStatsForReview,
  };
}
