import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useStudyTopics } from '../../hooks/useStudyTopics';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { TopicFormModal } from '../../components/study/TopicFormModal';
import { ConfirmDeleteModal } from '../../components/study/ConfirmDeleteModal';
import { container } from '../../../di/container';
import type { StudyTopic } from '../../../core/entities/StudyTopic';

// ---------------------------------------------------------------------------
// Skeleton Card
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-3 h-2 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
      <div className="mb-2 h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="flex gap-4">
        <div className="h-4 w-20 rounded bg-gray-100 dark:bg-gray-700" />
        <div className="h-4 w-20 rounded bg-gray-100 dark:bg-gray-700" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {/* Simple SVG illustration */}
      <svg
        className="mb-6 h-32 w-32 text-gray-300 dark:text-gray-600"
        viewBox="0 0 128 128"
        fill="none"
      >
        <rect x="20" y="24" width="88" height="72" rx="12" stroke="currentColor" strokeWidth="3" />
        <line
          x1="28"
          y1="44"
          x2="100"
          y2="44"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="28"
          y1="58"
          x2="80"
          y2="58"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="28"
          y1="72"
          x2="60"
          y2="72"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="104" cy="84" r="16" fill="currentColor" opacity="0.15" />
        <text
          x="104"
          y="89"
          textAnchor="middle"
          fontSize="16"
          fill="currentColor"
          fontWeight="bold"
        >
          +
        </text>
      </svg>
      <h3 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300">
        Nenhum tema cadastrado
      </h3>
      <p className="mb-6 max-w-sm text-sm text-gray-500 dark:text-gray-400">
        Crie seu primeiro tema de estudo e organize suas sessões no calendário.
      </p>
      <Button onClick={onCreate}>Criar primeiro tema</Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error State
// ---------------------------------------------------------------------------

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
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
      <h3 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300">
        Erro ao carregar temas
      </h3>
      <p className="mb-6 max-w-sm text-sm text-gray-500 dark:text-gray-400">{message}</p>
      <Button variant="outline" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StudyTopicsPage
// ---------------------------------------------------------------------------

export function StudyTopicsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    topics,
    loading,
    error,
    topicProgressMap,
    loadTopics,
    createTopic,
    updateTopic,
    deleteTopic,
  } = useStudyTopics();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<StudyTopic | null>(null);
  const [editingDates, setEditingDates] = useState<string[]>([]);
  const [deletingTopic, setDeletingTopic] = useState<StudyTopic | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchTopics = useCallback(() => {
    if (user) {
      loadTopics(user.id);
    }
  }, [user, loadTopics]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  // ---- Handlers ------------------------------------------------------------

  const handleOpenCreate = () => {
    setEditingTopic(null);
    setEditingDates([]);
    setIsFormOpen(true);
  };

  const handleOpenEdit = async (topic: StudyTopic) => {
    // Buscar datas agendadas para o tópico
    try {
      const now = new Date();
      const startDate = '2024-01-01';
      const endDate = `${now.getFullYear()}-12-31`;
      const sessions = await container.useCases.getCalendarSessions.execute(
        user!.id,
        startDate,
        endDate,
        [topic.id],
      );
      const dates = sessions.map((day) => day.date);
      setEditingDates(dates);
    } catch {
      setEditingDates([]);
    }

    setEditingTopic(topic);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (topic: StudyTopic) => {
    setDeletingTopic(topic);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTopic) return;
    setDeleteLoading(true);
    await deleteTopic(deletingTopic.id);
    setDeleteLoading(false);
    setDeletingTopic(null);
  };

  // ---- Render --------------------------------------------------------------

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Temas de Estudo</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gerencie os temas que você está estudando
          </p>
        </div>
        <Button onClick={handleOpenCreate}>Novo Tema</Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && <ErrorState message={error} onRetry={fetchTopics} />}

      {/* Empty State */}
      {!loading && !error && topics.length === 0 && <EmptyState onCreate={handleOpenCreate} />}

      {/* Topic Cards Grid */}
      {!loading && !error && topics.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => {
            const progress = topicProgressMap.get(topic.id);
            const completedDays = progress?.completedSessions ?? 0;
            const totalDays = topic.totalDays;
            const percentage = progress?.percentage ?? 0;
            const totalHoursPlanned = totalDays * topic.hoursPerDay;
            const completedHours = completedDays * topic.hoursPerDay;

            return (
              <div
                key={topic.id}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              >
                {/* Color bar */}
                <div
                  className="absolute left-0 top-0 h-full w-1.5"
                  style={{ backgroundColor: topic.color }}
                />

                <div className="ml-2">
                  <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {topic.name}
                  </h3>

                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                        />
                      </svg>
                      {totalDays} {totalDays === 1 ? 'dia' : 'dias'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {topic.hoursPerDay}h/dia
                    </span>
                  </div>

                  {/* Progress section */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        {totalHoursPlanned}h totais · {completedHours}h concluídas
                      </span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {completedDays}/{totalDays} dias
                      </span>
                    </div>
                    <ProgressBar
                      value={percentage}
                      color={topic.color}
                      variant="horizontal"
                      size="sm"
                    />
                  </div>
                </div>

                {/* Actions (visible on hover) */}
                <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(topic)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    aria-label={`Editar ${topic.name}`}
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(topic)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                    aria-label={`Excluir ${topic.name}`}
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                      />
                    </svg>
                  </button>
                </div>

                {/* Back button for study overview */}
                <div className="mt-4 ml-2">
                  <button
                    type="button"
                    onClick={() => navigate('/study')}
                    className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                  >
                    ← Voltar para visão geral
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <TopicFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={(input) => createTopic(user!.id, input)}
        onUpdate={(topicId, data) => updateTopic(topicId, data)}
        editingTopic={editingTopic}
        editingDates={editingDates}
      />

      {/* Delete Confirmation Modal */}
      {deletingTopic && (
        <ConfirmDeleteModal
          isOpen={!!deletingTopic}
          onClose={() => setDeletingTopic(null)}
          onConfirm={handleDeleteConfirm}
          topicName={deletingTopic.name}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
