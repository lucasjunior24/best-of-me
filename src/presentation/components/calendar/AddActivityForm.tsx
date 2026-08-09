import { useEffect, useState, useCallback, useMemo } from 'react';
import { twMerge } from 'tailwind-merge';
import { container } from '../../../di/container';
import { handleError } from '../../../shared/errorHandler';
import type { StudyTopic } from '../../../core/entities/StudyTopic';
import type { Review } from '../../../core/entities/Review';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AddActivityFormProps {
  date: string;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

/** Formata "2026-07-24" → "24 de Julho de 2026" */
function formatDateShort(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// AddActivityForm
// ---------------------------------------------------------------------------

export function AddActivityForm({ date, userId, onClose, onSuccess }: AddActivityFormProps) {
  const [activityType, setActivityType] = useState<'study' | 'review'>('study');
  const [topics, setTopics] = useState<StudyTopic[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Carregar tópicos e revisões do usuário
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoadingData(true);
      try {
        const [topicsData, reviewsData] = await Promise.all([
          container.useCases.getStudyTopics.execute(userId),
          container.reviewRepository.getReviewsByUser(userId),
        ]);
        if (!cancelled) {
          setTopics(topicsData);
          setReviews(reviewsData);
        }
      } catch {
        // Ignorar erros — o usuário pode não ter topics ou reviews ainda
        if (!cancelled) {
          setTopics([]);
          setReviews([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingData(false);
        }
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Filtrar itens pelo tipo selecionado
  const availableItems = useMemo(() => {
    if (activityType === 'study') {
      return topics.map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color,
        type: 'study' as const,
      }));
    }
    return reviews.map((r) => ({
      id: r.id,
      name: r.name,
      color: r.color,
      type: 'review' as const,
    }));
  }, [activityType, topics, reviews]);

  // Resetar seleção ao trocar de tipo
  const handleTypeChange = useCallback((type: 'study' | 'review') => {
    setActivityType(type);
    setSelectedIds(new Set());
  }, []);

  const toggleItem = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (selectedIds.size === 0) return;

    setSubmitting(true);
    try {
      const ids = [...selectedIds];

      if (activityType === 'study') {
        // Adicionar um dia de estudo para cada tópico selecionado
        await Promise.all(
          ids.map((topicId) => container.useCases.addStudyDay.execute(userId, topicId, [date])),
        );
      } else {
        // Adicionar um dia de revisão para cada revisão selecionada
        await Promise.all(
          ids.map((reviewId) => container.useCases.addReviewDay.execute(userId, reviewId, [date])),
        );
      }

      onSuccess();
    } catch (err) {
      const message = handleError(err);
      container.toastService.error(message);
    } finally {
      setSubmitting(false);
    }
  }, [selectedIds, activityType, userId, date, onSuccess]);

  const isEmpty = availableItems.length === 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            ➕ Adicionar Atividade
          </h3>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            aria-label="Fechar"
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-4 space-y-4">
          {/* Data alvo */}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Data selecionada:{' '}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {formatDateShort(date)}
            </span>
          </p>

          {/* Toggle tipo de atividade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de atividade
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('study')}
                disabled={submitting}
                className={twMerge(
                  'flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                  activityType === 'study'
                    ? 'bg-blue-600 text-white dark:bg-blue-500 shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
                )}
              >
                📚 Estudo
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('review')}
                disabled={submitting}
                className={twMerge(
                  'flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                  activityType === 'review'
                    ? 'bg-purple-600 text-white dark:bg-purple-500 shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
                )}
              >
                📝 Revisão
              </button>
            </div>
          </div>

          {/* Lista de itens */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {activityType === 'study' ? 'Temas de estudo' : 'Revisões'}
            </label>

            {loadingData && (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            )}

            {!loadingData && isEmpty && (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <span className="text-3xl">{activityType === 'study' ? '📚' : '📝'}</span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {activityType === 'study'
                    ? 'Nenhum tema de estudo cadastrado.'
                    : 'Nenhuma revisão cadastrada.'}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {activityType === 'study'
                    ? 'Cadastre temas na página de Temas de Estudo.'
                    : 'Cadastre revisões na página de Revisões.'}
                </p>
              </div>
            )}

            {!loadingData && !isEmpty && (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {availableItems.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    disabled={submitting}
                    className={twMerge(
                      'w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors',
                      selectedIds.has(item.id)
                        ? 'border-brand-300 bg-brand-50 dark:border-brand-700 dark:bg-brand-900/20'
                        : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-750',
                    )}
                  >
                    {/* Checkbox customizado */}
                    <div
                      className={twMerge(
                        'flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                        selectedIds.has(item.id)
                          ? 'bg-brand-600 border-brand-600 dark:bg-brand-500 dark:border-brand-500'
                          : 'border-gray-300 dark:border-gray-600',
                      )}
                    >
                      {selectedIds.has(item.id) && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>

                    {/* Indicador de cor */}
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />

                    {/* Nome */}
                    <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {item.name}
                    </span>

                    {/* Tipo (ícone) */}
                    <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                      {item.type === 'study' ? '📚' : '📝'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botão de confirmação */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || selectedIds.size === 0 || loadingData || isEmpty}
            className={twMerge(
              'w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors',
              'bg-brand-600 text-white hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'shadow-sm',
            )}
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Adicionando...
              </span>
            ) : (
              `Adicionar ao dia ${date.split('-')[2]}/${date.split('-')[1]}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
