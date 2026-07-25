import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../../hooks/useAuth';
import { useStudyProgress } from '../../hooks/useStudyProgress';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';

export function StudyOverviewPage() {
  const { user } = useAuth();
  const { progress, topics, loading, error, loadProgress } = useStudyProgress();
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);

  const loadData = useCallback(() => {
    if (user) {
      loadProgress(user.id, selectedTopicIds.length > 0 ? selectedTopicIds : undefined);
    }
  }, [user, selectedTopicIds, loadProgress]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleTopicFilter = (topicId: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId],
    );
  };

  const clearFilters = () => setSelectedTopicIds([]);

  const filteredByTopic = useMemo(() => {
    if (!progress) return [];
    if (selectedTopicIds.length === 0) return progress.byTopic;
    return progress.byTopic.filter((tp) => selectedTopicIds.includes(tp.topicId));
  }, [progress, selectedTopicIds]);

  // ---- Loading State ----
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Carregando dados...</p>
      </div>
    );
  }

  // ---- Error State ----
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <svg
            className="h-8 w-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <p className="mb-4 text-gray-500 dark:text-gray-400">{error}</p>
        <Button variant="outline" onClick={loadData}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  const hasData = topics.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Dashboard de Estudos
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Acompanhe seu progresso geral
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/study/topics">
            <Button variant="outline" size="sm">
              Gerenciar Temas
            </Button>
          </Link>
          <Link to="/study/calendar">
            <Button variant="primary" size="sm">
              Ver Calendário
            </Button>
          </Link>
        </div>
      </div>

      {/* Indicadores gerais */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Planejado</p>
          <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {progress?.totalPlannedSessions ?? 0}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">sessões</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Concluído</p>
          <p className="mt-1 text-3xl font-bold text-green-600 dark:text-green-400">
            {progress?.totalCompletedSessions ?? 0}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">sessões</p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <ProgressBar
            value={progress?.completionPercentage ?? 0}
            variant="circular"
            color="#22c55e"
            size="md"
          />
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">conclusão geral</p>
        </div>
      </div>

      {/* Empty state — no topics */}
      {!hasData ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16 dark:border-gray-700 dark:bg-gray-900">
          <span className="text-4xl">📚</span>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Nenhum tema cadastrado ainda</p>
          <Link to="/study/topics" className="mt-4">
            <Button variant="primary" size="sm">
              Criar primeiro tema
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Topic Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={clearFilters}
              className={twMerge(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                selectedTopicIds.length === 0
                  ? 'bg-brand-600 text-white dark:bg-brand-500'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
              )}
            >
              Todos
            </button>
            {topics.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => toggleTopicFilter(topic.id)}
                className={twMerge(
                  'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  selectedTopicIds.includes(topic.id)
                    ? 'text-white'
                    : 'border border-gray-300 bg-transparent text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800',
                )}
                style={
                  selectedTopicIds.includes(topic.id) ? { backgroundColor: topic.color } : undefined
                }
              >
                {topic.name}
              </button>
            ))}
          </div>

          {/* Progresso por Tema */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Progresso por Tema
            </h2>

            {filteredByTopic.length === 0 ? (
              <p className="mt-6 text-center text-sm text-gray-400 dark:text-gray-500">
                Nenhum tema selecionado.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {filteredByTopic.map((topicProgress) => (
                  <div
                    key={topicProgress.topicId}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-800"
                  >
                    <span
                      className="h-3 w-3 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: topicProgress.topicColor }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {topicProgress.topicName}
                      </p>
                      <ProgressBar
                        value={topicProgress.percentage}
                        color={topicProgress.topicColor}
                        className="mt-1"
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums flex-shrink-0">
                      {topicProgress.completedSessions}/{topicProgress.totalSessions}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
