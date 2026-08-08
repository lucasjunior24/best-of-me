import { useState, useCallback } from 'react';
import type { SharedTopicProgress } from '../../core/useCases/GetSharedStudyProgressUseCase';
import { container } from '../../di/container';
import { handleError } from '../../shared/errorHandler';

interface UseSharedStudyProgressReturn {
  /** Mapa de topicId → SharedTopicProgress (apenas tópicos compartilhados) */
  sharedProgressMap: Map<string, SharedTopicProgress>;
  loading: boolean;
  error: string | null;
  /** Carrega progresso compartilhado para uma lista de tópicos */
  loadSharedProgress: (
    userId: string,
    sharedTopics: Array<{
      id: string;
      isShared?: boolean;
      sharedWith?: string[];
      ownerUserId?: string;
    }>,
  ) => Promise<void>;
  /** Carrega progresso compartilhado para um único tópico */
  loadProgressForTopic: (userId: string, topicId: string) => Promise<SharedTopicProgress | null>;
}

export function useSharedStudyProgress(): UseSharedStudyProgressReturn {
  const [sharedProgressMap, setSharedProgressMap] = useState<Map<string, SharedTopicProgress>>(
    new Map(),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSharedProgress = useCallback(
    async (
      userId: string,
      sharedTopics: Array<{
        id: string;
        isShared?: boolean;
        sharedWith?: string[];
        ownerUserId?: string;
      }>,
    ) => {
      setLoading(true);
      setError(null);
      const map = new Map<string, SharedTopicProgress>();

      try {
        // Filtrar apenas tópicos que são compartilhados
        const trulyShared = sharedTopics.filter(
          (t) => t.isShared || (t.sharedWith && t.sharedWith.length > 0),
        );

        for (const topic of trulyShared) {
          try {
            const progress = await container.useCases.sharedStudyProgress.execute(userId, topic.id);
            map.set(topic.id, progress);
          } catch {
            // Ignorar tópicos que não estão compartilhados ou deram erro
          }
        }

        setSharedProgressMap(map);
      } catch (err) {
        const message = handleError(err);
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const loadProgressForTopic = useCallback(
    async (userId: string, topicId: string): Promise<SharedTopicProgress | null> => {
      try {
        const progress = await container.useCases.sharedStudyProgress.execute(userId, topicId);
        setSharedProgressMap((prev) => {
          const next = new Map(prev);
          next.set(topicId, progress);
          return next;
        });
        return progress;
      } catch (err) {
        const message = handleError(err);
        setError(message);
        return null;
      }
    },
    [],
  );

  return {
    sharedProgressMap,
    loading,
    error,
    loadSharedProgress,
    loadProgressForTopic,
  };
}
