import { useState, useCallback, useRef } from 'react';
import type {
  StudyTopic,
  CreateStudyTopicInput,
  UpdateStudyTopicInput,
} from '../../core/entities/StudyTopic';
import type { TopicProgress } from '../../core/entities/ProgressData';
import { container } from '../../di/container';
import { handleError } from '../../shared/errorHandler';

/**
 * Progresso de outro usuário em um tópico compartilhado (Sprint 26 — T26.4)
 */
export interface OtherUserProgress {
  /** ID do outro usuário */
  userId: string;
  /** Email do outro usuário (resolvido via ISharingRepository) */
  email: string;
  /** Dias concluídos pelo outro usuário neste tópico */
  completedSessions: number;
  /** Total de dias planejados */
  totalSessions: number;
  /** Porcentagem de conclusão */
  percentage: number;
}

interface UseStudyTopicsReturn {
  topics: StudyTopic[];
  loading: boolean;
  error: string | null;
  topicProgressMap: Map<string, TopicProgress>;
  /** Mapa de topicId → progresso do outro usuário (apenas tópicos compartilhados) */
  otherUserProgressMap: Map<string, OtherUserProgress[]>;
  loadTopics: (userId: string) => Promise<void>;
  createTopic: (userId: string, input: CreateStudyTopicInput) => Promise<StudyTopic | null>;
  updateTopic: (topicId: string, data: UpdateStudyTopicInput) => Promise<StudyTopic | null>;
  deleteTopic: (topicId: string, isShared?: boolean) => Promise<boolean>;
}

export function useStudyTopics(): UseStudyTopicsReturn {
  const [topics, setTopics] = useState<StudyTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topicProgressMap, setTopicProgressMap] = useState<Map<string, TopicProgress>>(new Map());
  const [otherUserProgressMap, setOtherUserProgressMap] = useState<
    Map<string, OtherUserProgress[]>
  >(new Map());
  const userIdRef = useRef<string | null>(null);

  const loadTopics = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      userIdRef.current = userId;

      const [result, progressData] = await Promise.all([
        container.useCases.getStudyTopics.execute(userId),
        container.useCases.getStudyProgress.execute(userId),
      ]);

      setTopics(result);

      // Build progress map
      const map = new Map<string, TopicProgress>();
      for (const tp of progressData.byTopic) {
        map.set(tp.topicId, tp);
      }
      setTopicProgressMap(map);

      // ---- T26.4: Buscar progresso do outro usuário para tópicos compartilhados ----
      const otherMap = new Map<string, OtherUserProgress[]>();

      // Para tópicos recebidos (isShared=true), buscar progresso do owner
      const sharedTopics = result.filter((t) => t.isShared && t.ownerUserId);
      for (const topic of sharedTopics) {
        const ownerId = topic.ownerUserId!;
        try {
          const ownerProgress = await container.useCases.getStudyProgress.execute(ownerId, [
            topic.id,
          ]);
          const ownerTp = ownerProgress.byTopic.find((tp) => tp.topicId === topic.id);
          if (ownerTp) {
            let email = ownerId;
            try {
              const resolved = await container.sharingRepository.getUserEmail(ownerId);
              if (resolved) email = resolved;
            } catch {
              // usar userId como fallback
            }
            otherMap.set(topic.id, [
              {
                userId: ownerId,
                email,
                completedSessions: ownerTp.completedSessions,
                totalSessions: ownerTp.totalSessions,
                percentage: ownerTp.percentage,
              },
            ]);
          }
        } catch {
          // Ignorar erros ao buscar progresso de outro usuário
        }
      }

      // Para tópicos próprios compartilhados, buscar progresso dos convidados
      const ownedSharedTopics = result.filter(
        (t) => !t.isShared && t.sharedWith && t.sharedWith.length > 0,
      );
      for (const topic of ownedSharedTopics) {
        const invitedProgress: OtherUserProgress[] = [];
        for (const invitedId of topic.sharedWith!) {
          try {
            const invitedProg = await container.useCases.getStudyProgress.execute(invitedId, [
              topic.id,
            ]);
            const tp = invitedProg.byTopic.find((p) => p.topicId === topic.id);
            if (tp) {
              let email = invitedId;
              try {
                const resolved = await container.sharingRepository.getUserEmail(invitedId);
                if (resolved) email = resolved;
              } catch {
                // usar userId como fallback
              }
              invitedProgress.push({
                userId: invitedId,
                email,
                completedSessions: tp.completedSessions,
                totalSessions: tp.totalSessions,
                percentage: tp.percentage,
              });
            }
          } catch {
            // Ignorar
          }
        }
        if (invitedProgress.length > 0) {
          otherMap.set(topic.id, invitedProgress);
        }
      }

      setOtherUserProgressMap(otherMap);
    } catch (err) {
      const message = handleError(err);
      setError(message);
      container.toastService.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTopic = useCallback(
    async (userId: string, input: CreateStudyTopicInput): Promise<StudyTopic | null> => {
      setError(null);
      try {
        const created = await container.useCases.createStudyTopic.execute(userId, input);
        setTopics((prev) => [created, ...prev]);
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

  const updateTopic = useCallback(
    async (topicId: string, data: UpdateStudyTopicInput): Promise<StudyTopic | null> => {
      setError(null);
      try {
        const updated = await container.useCases.updateStudyTopic.execute(topicId, data);
        setTopics((prev) => prev.map((t) => (t.id === topicId ? updated : t)));
        container.toastService.success('Tema atualizado!');
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

  const deleteTopic = useCallback(async (topicId: string, isShared?: boolean): Promise<boolean> => {
    setError(null);
    try {
      await container.useCases.deleteStudyTopic.execute(topicId, userIdRef.current ?? '', isShared);
      setTopics((prev) => prev.filter((t) => t.id !== topicId));
      return true;
    } catch (err) {
      const message = handleError(err);
      setError(message);
      container.toastService.error(message);
      return false;
    }
  }, []);

  return {
    topics,
    loading,
    error,
    topicProgressMap,
    otherUserProgressMap,
    loadTopics,
    createTopic,
    updateTopic,
    deleteTopic,
  };
}
