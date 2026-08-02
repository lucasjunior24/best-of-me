import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../../hooks/useAuth';
import { useReviewQuestionnaire } from '../../hooks/useReviewQuestionnaire';
import { Button } from '../../components/ui/Button';
import { container } from '../../../di/container';
import type { Review } from '../../../core/entities/Review';
import type { ReviewQuestionnaire } from '../../../core/entities/ReviewQuestionnaire';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatLongDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatShortDate(dateStr: string): string {
  const [, month, day] = dateStr.split('-');
  return `${day}/${month}`;
}

// ---------------------------------------------------------------------------
// QuestionnaireFormModal (T14.7) - inline on this page
// ---------------------------------------------------------------------------

function QuestionnaireFormModal({
  isOpen,
  onClose,
  onSave,
  existingQuestionnaire,
  reviewDate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (totalQuestions: number, correctAnswers: number) => Promise<void>;
  existingQuestionnaire: ReviewQuestionnaire | null;
  reviewDate: string;
}) {
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [correctAnswers, setCorrectAnswers] = useState(7);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!existingQuestionnaire;

  useEffect(() => {
    if (existingQuestionnaire) {
      setTotalQuestions(existingQuestionnaire.totalQuestions);
      setCorrectAnswers(existingQuestionnaire.correctAnswers);
    } else {
      setTotalQuestions(10);
      setCorrectAnswers(7);
    }
    setErrors({});
  }, [existingQuestionnaire, isOpen]);

  const accuracy = useMemo(() => {
    if (totalQuestions <= 0) return 0;
    return Math.round((correctAnswers / totalQuestions) * 100);
  }, [totalQuestions, correctAnswers]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!totalQuestions || totalQuestions < 1) {
      newErrors.totalQuestions = 'Total de questões deve ser pelo menos 1.';
    }
    if (correctAnswers < 0) {
      newErrors.correctAnswers = 'Número de acertos não pode ser negativo.';
    }
    if (correctAnswers > totalQuestions) {
      newErrors.correctAnswers = `Acertos (${correctAnswers}) não podem exceder o total (${totalQuestions}).`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    await onSave(totalQuestions, correctAnswers);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {isEditing ? 'Editar Questionário' : 'Registrar Questionário'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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

        {/* Form */}
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Data: {formatShortDate(reviewDate)}
          </p>

          {/* Total de questões */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Total de questões *
            </label>
            <input
              type="number"
              min={1}
              value={totalQuestions}
              onChange={(e) => setTotalQuestions(parseInt(e.target.value) || 0)}
              className={twMerge(
                'w-24 rounded-lg border px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                'focus:outline-none focus:ring-2 focus:ring-brand-500',
                errors.totalQuestions
                  ? 'border-red-300 dark:border-red-700'
                  : 'border-gray-300 dark:border-gray-600',
              )}
            />
            {errors.totalQuestions && (
              <p className="mt-1 text-xs text-red-500">{errors.totalQuestions}</p>
            )}
          </div>

          {/* Acertos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Acertos
            </label>
            <input
              type="number"
              min={0}
              max={totalQuestions}
              value={correctAnswers}
              onChange={(e) => setCorrectAnswers(parseInt(e.target.value) || 0)}
              className={twMerge(
                'w-24 rounded-lg border px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                'focus:outline-none focus:ring-2 focus:ring-brand-500',
                errors.correctAnswers
                  ? 'border-red-300 dark:border-red-700'
                  : 'border-gray-300 dark:border-gray-600',
              )}
            />
            {errors.correctAnswers && (
              <p className="mt-1 text-xs text-red-500">{errors.correctAnswers}</p>
            )}
          </div>

          {/* Preview em tempo real */}
          <div className="rounded-lg bg-brand-50 dark:bg-brand-900/20 p-3 text-center">
            <p className="text-sm text-brand-700 dark:text-brand-300">
              Acertos: {correctAnswers}/{totalQuestions}
            </p>
            <p className="text-lg font-bold text-brand-600 dark:text-brand-400">
              {accuracy}% de aproveitamento
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {isEditing ? 'Atualizar' : 'Registrar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ReviewDetailPage
// ---------------------------------------------------------------------------

export function ReviewDetailPage() {
  const { reviewId } = useParams<{ reviewId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { questionnaires, loadQuestionnaires, saveQuestionnaire } = useReviewQuestionnaire();

  const [review, setReview] = useState<Review | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // Questionnaire modal state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<ReviewQuestionnaire | null>(
    null,
  );

  // T26.5 — Questionários do outro usuário em revisões compartilhadas
  const [otherUserQuestionnaires, setOtherUserQuestionnaires] = useState<{
    email: string;
    questionnaires: ReviewQuestionnaire[];
  } | null>(null);

  const fetchReview = useCallback(async () => {
    if (!reviewId || !user) return;
    setPageLoading(true);
    setPageError(null);
    try {
      const result = await container.reviewRepository.getReviewById(reviewId);
      if (!result) {
        setPageError('Revisão não encontrada.');
      } else {
        setReview(result);
        await loadQuestionnaires(user.id, reviewId);

        // T26.5 — Buscar questionários do outro usuário em revisões compartilhadas
        if (result.isShared) {
          const otherUserId =
            result.ownerUserId && result.ownerUserId !== user.id
              ? result.ownerUserId
              : result.sharedWith?.find((id) => id !== user.id);

          if (otherUserId) {
            try {
              const otherQuestionnaires =
                await container.reviewRepository.getQuestionnairesByReview(reviewId);
              // Filtrar apenas questionários do outro usuário
              const otherQs = otherQuestionnaires.filter((q) => q.userId === otherUserId);
              if (otherQs.length > 0) {
                let email = otherUserId;
                try {
                  const resolved = await container.sharingRepository.getUserEmail(otherUserId);
                  if (resolved) email = resolved;
                } catch {
                  // usar userId como fallback
                }
                setOtherUserQuestionnaires({ email, questionnaires: otherQs });
              }
            } catch {
              // Ignorar erro
            }
          }
        }
      }
    } catch (err) {
      setPageError('Erro ao carregar dados da revisão.');
    } finally {
      setPageLoading(false);
    }
  }, [reviewId, user, loadQuestionnaires]);

  useEffect(() => {
    fetchReview();
  }, [fetchReview]);

  // Usar scheduledDates diretamente (fonte da verdade)
  const reviewDates = useMemo(() => {
    if (!review) return [];
    return review.scheduledDates;
  }, [review]);

  const questionnaireMap = useMemo(() => {
    const map = new Map<string, ReviewQuestionnaire>();
    for (const q of questionnaires) {
      map.set(q.date, q);
    }
    return map;
  }, [questionnaires]);

  // T26.5 — Mapa de questionários do outro usuário por data
  const otherQuestionnaireMap = useMemo(() => {
    const map = new Map<string, ReviewQuestionnaire>();
    if (otherUserQuestionnaires) {
      for (const q of otherUserQuestionnaires.questionnaires) {
        map.set(q.date, q);
      }
    }
    return map;
  }, [otherUserQuestionnaires]);

  const completedCount = questionnaires.length;
  const totalCount = reviewDates.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleOpenQuestionnaire = (date: string) => {
    const existing = questionnaireMap.get(date) || null;
    setSelectedQuestionnaire(existing);
    setSelectedDate(date);
  };

  const handleSaveQuestionnaire = async (totalQuestions: number, correctAnswers: number) => {
    if (!reviewId || !user || !selectedDate) return;
    await saveQuestionnaire(user.id, {
      reviewId,
      date: selectedDate,
      totalQuestions,
      correctAnswers,
    });
    setSelectedDate(null);
    setSelectedQuestionnaire(null);
  };

  // ---- Loading State ----
  if (pageLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // ---- Error State ----
  if (pageError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">{pageError}</h2>
        <Button onClick={() => navigate('/review')} variant="outline">
          Voltar para revisões
        </Button>
      </div>
    );
  }

  if (!review) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <button
          type="button"
          onClick={() => navigate('/review')}
          className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 mb-4"
        >
          ← Voltar para revisões
        </button>
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: review.color }}
          />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{review.name}</h1>
          {review.isShared && (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-800/50 px-2 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-300">
              👥 Compartilhado
            </span>
          )}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
          {reviewDates.length > 0 && <p>Início: {formatLongDate(reviewDates[0])}</p>}
          {review.intervalDays !== undefined && review.totalReviews !== undefined ? (
            <p>
              A cada {review.intervalDays} {review.intervalDays === 1 ? 'dia' : 'dias'} ·{' '}
              {review.totalReviews} revis{review.totalReviews === 1 ? 'ão' : 'ões'}
            </p>
          ) : (
            <p>
              {reviewDates.length} revis{reviewDates.length === 1 ? 'ão' : 'ões'} manuais
            </p>
          )}
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progresso</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {completedCount}/{totalCount} concluídas ({completionPercentage}%)
          </span>
        </div>
        <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${completionPercentage}%`,
              backgroundColor: review.color,
            }}
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Datas de Revisão
        </h2>
        <div className="relative pl-6 border-l-2 border-gray-200 dark:border-gray-700 space-y-6">
          {reviewDates.map((date, index) => {
            const questionnaire = questionnaireMap.get(date);
            const isToday = date === new Date().toISOString().split('T')[0];

            return (
              <div key={date} className="relative">
                {/* Timeline dot */}
                <div
                  className={twMerge(
                    'absolute -left-[25px] w-3 h-3 rounded-full border-2 border-white dark:border-gray-900',
                    questionnaire
                      ? 'bg-green-500 border-green-300'
                      : 'bg-gray-300 dark:bg-gray-600 border-gray-200 dark:border-gray-700',
                  )}
                  style={questionnaire ? { backgroundColor: review.color } : undefined}
                />

                {/* Card */}
                <div
                  className={twMerge(
                    'rounded-lg border p-4',
                    isToday && 'ring-2 ring-brand-500 ring-offset-2',
                    questionnaire
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatLongDate(date)}
                      </span>
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                        {index + 1}ª revisão
                      </span>
                    </div>
                    {isToday && (
                      <span className="inline-flex items-center rounded-full bg-brand-100 dark:bg-brand-900/50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:text-brand-300">
                        Hoje
                      </span>
                    )}
                  </div>

                  {questionnaire ? (
                    <div>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        ✅ {questionnaire.correctAnswers}/{questionnaire.totalQuestions} acertos ·{' '}
                        {Math.round(
                          (questionnaire.correctAnswers / questionnaire.totalQuestions) * 100,
                        )}
                        %
                      </p>
                      <button
                        type="button"
                        onClick={() => handleOpenQuestionnaire(date)}
                        className="mt-2 text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                      >
                        Editar questionário
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Questionário não registrado
                      </p>
                      <button
                        type="button"
                        onClick={() => handleOpenQuestionnaire(date)}
                        className="mt-2 text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                      >
                        Registrar questionário
                      </button>
                    </div>
                  )}

                  {/* T26.5 — Desempenho do outro usuário na mesma data */}
                  {(() => {
                    const otherQ = otherQuestionnaireMap.get(date);
                    if (!otherQ || !otherUserQuestionnaires) return null;
                    return (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                          👤 {otherUserQuestionnaires.email}
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-0.5">
                          {otherQ.correctAnswers}/{otherQ.totalQuestions} acertos ·{' '}
                          {Math.round((otherQ.correctAnswers / otherQ.totalQuestions) * 100)}%
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Questionnaire Modal */}
      <QuestionnaireFormModal
        isOpen={!!selectedDate}
        onClose={() => {
          setSelectedDate(null);
          setSelectedQuestionnaire(null);
        }}
        onSave={handleSaveQuestionnaire}
        existingQuestionnaire={selectedQuestionnaire}
        reviewDate={selectedDate || ''}
      />
    </div>
  );
}
