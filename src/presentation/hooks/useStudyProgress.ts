import { useState, useCallback } from 'react';
import type { ProgressData } from '../../core/entities/ProgressData';
import type { StudyTopic } from '../../core/entities/StudyTopic';
import { container } from '../../di/container';
import { handleError } from '../../shared/errorHandler';

interface UseStudyProgressReturn {
  progress: ProgressData | null;
  topics: StudyTopic[];
  loading: boolean;
  error: string | null;
  loadProgress: (userId: string, topicIds?: string[]) => Promise<void>;
}

export function useStudyProgress(): UseStudyProgressReturn {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [topics, setTopics] = useState<StudyTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProgress = useCallback(async (userId: string, topicIds?: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const [progressData, topicsData] = await Promise.all([
        container.useCases.getStudyProgress.execute(userId, topicIds),
        container.useCases.getStudyTopics.execute(userId),
      ]);
      setProgress(progressData);
      setTopics(topicsData);
    } catch (err) {
      const message = handleError(err);
      setError(message);
      container.toastService.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    progress,
    topics,
    loading,
    error,
    loadProgress,
  };
}
