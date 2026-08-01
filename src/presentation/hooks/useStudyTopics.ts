import { useState, useCallback, useRef } from 'react';
import type {
  StudyTopic,
  CreateStudyTopicInput,
  UpdateStudyTopicInput,
} from '../../core/entities/StudyTopic';
import type { TopicProgress } from '../../core/entities/ProgressData';
import { container } from '../../di/container';
import { handleError } from '../../shared/errorHandler';

interface UseStudyTopicsReturn {
  topics: StudyTopic[];
  loading: boolean;
  error: string | null;
  topicProgressMap: Map<string, TopicProgress>;
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
    loadTopics,
    createTopic,
    updateTopic,
    deleteTopic,
  };
}
