import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../../hooks/useAuth';
import { useReviews } from '../../hooks/useReviews';
import { Button } from '../../components/ui/Button';
import { generateReviewDates } from '../../../core/entities/Review';
import type { Review, CreateReviewInput, UpdateReviewInput } from '../../../core/entities/Review';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatLongDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('pt-BR', {
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
      <svg
        className="mb-6 h-32 w-32 text-gray-300 dark:text-gray-600"
        viewBox="0 0 128 128"
        fill="none"
      >
        <rect x="16" y="20" width="96" height="80" rx="12" stroke="currentColor" strokeWidth="3" />
        <line
          x1="24"
          y1="42"
          x2="104"
          y2="42"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="24"
          y1="56"
          x2="80"
          y2="56"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="24"
          y1="70"
          x2="64"
          y2="70"
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
        Nenhuma revisão cadastrada
      </h3>
      <p className="mb-6 max-w-sm text-sm text-gray-500 dark:text-gray-400">
        Crie seu primeiro ciclo de revisão espaçada e acompanhe seu desempenho.
      </p>
      <Button onClick={onCreate}>Criar primeira revisão</Button>
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
        Erro ao carregar revisões
      </h3>
      <p className="mb-6 max-w-sm text-sm text-gray-500 dark:text-gray-400">{message}</p>
      <Button variant="outline" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ReviewFormModal (T14.5)
// ---------------------------------------------------------------------------

function ReviewFormModal({
  isOpen,
  onClose,
  onSubmit,
  onUpdate,
  editingReview,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateReviewInput) => Promise<Review | null>;
  onUpdate: (id: string, data: UpdateReviewInput) => Promise<Review | null>;
  editingReview: Review | null;
}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [startDate, setStartDate] = useState('');
  const [intervalDays, setIntervalDays] = useState(5);
  const [totalReviews, setTotalReviews] = useState(3);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!editingReview;

  useEffect(() => {
    if (editingReview) {
      setName(editingReview.name);
      setColor(editingReview.color);
      setStartDate(editingReview.startDate);
      setIntervalDays(editingReview.intervalDays);
      setTotalReviews(editingReview.totalReviews);
    } else {
      setName('');
      setColor('#6366f1');
      setStartDate('');
      setIntervalDays(5);
      setTotalReviews(3);
    }
    setErrors({});
  }, [editingReview, isOpen]);

  const previewDates = useMemo(() => {
    if (!startDate) return [];
    try {
      return generateReviewDates(startDate, intervalDays, totalReviews);
    } catch {
      return [];
    }
  }, [startDate, intervalDays, totalReviews]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres.';
    }
    if (!startDate) {
      newErrors.startDate = 'Data de início é obrigatória.';
    } else {
      const parsed = new Date(startDate + 'T00:00:00');
      if (isNaN(parsed.getTime())) {
        newErrors.startDate = 'Data inválida.';
      }
    }
    if (!intervalDays || intervalDays < 1) {
      newErrors.intervalDays = 'Intervalo deve ser pelo menos 1 dia.';
    }
    if (!totalReviews || totalReviews < 1 || totalReviews > 365) {
      newErrors.totalReviews = 'Quantidade deve ser entre 1 e 365.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);

    const input: CreateReviewInput = {
      name: name.trim(),
      color,
      startDate,
      intervalDays,
      totalReviews,
    };

    if (isEditing && editingReview) {
      await onUpdate(editingReview.id, input);
    } else {
      await onSubmit(input);
    }

    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {isEditing ? 'Editar Revisão' : 'Nova Revisão'}
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
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome da revisão *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Prova da AWS"
              className={twMerge(
                'w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                'focus:outline-none focus:ring-2 focus:ring-brand-500',
                errors.name
                  ? 'border-red-300 dark:border-red-700'
                  : 'border-gray-300 dark:border-gray-600',
              )}
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Cor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cor
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-14 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">{color}</span>
            </div>
          </div>

          {/* Data de início */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data de início *
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={twMerge(
                'w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                'focus:outline-none focus:ring-2 focus:ring-brand-500',
                errors.startDate
                  ? 'border-red-300 dark:border-red-700'
                  : 'border-gray-300 dark:border-gray-600',
              )}
            />
            {errors.startDate && <p className="mt-1 text-xs text-red-500">{errors.startDate}</p>}
          </div>

          {/* Intervalo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Repetir a cada X dias
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={intervalDays}
                onChange={(e) => setIntervalDays(parseInt(e.target.value) || 1)}
                className={twMerge(
                  'w-24 rounded-lg border px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                  'focus:outline-none focus:ring-2 focus:ring-brand-500',
                  errors.intervalDays
                    ? 'border-red-300 dark:border-red-700'
                    : 'border-gray-300 dark:border-gray-600',
                )}
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">dias</span>
            </div>
            {errors.intervalDays && (
              <p className="mt-1 text-xs text-red-500">{errors.intervalDays}</p>
            )}
          </div>

          {/* Quantidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quantidade de revisões
            </label>
            <input
              type="number"
              min={1}
              max={365}
              value={totalReviews}
              onChange={(e) => setTotalReviews(parseInt(e.target.value) || 1)}
              className={twMerge(
                'w-24 rounded-lg border px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                'focus:outline-none focus:ring-2 focus:ring-brand-500',
                errors.totalReviews
                  ? 'border-red-300 dark:border-red-700'
                  : 'border-gray-300 dark:border-gray-600',
              )}
            />
            {errors.totalReviews && (
              <p className="mt-1 text-xs text-red-500">{errors.totalReviews}</p>
            )}
          </div>

          {/* Preview */}
          {previewDates.length > 0 && (
            <div className="rounded-lg bg-brand-50 dark:bg-brand-900/20 p-3">
              <p className="text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">
                Datas geradas ({previewDates.length}):
              </p>
              <p className="text-sm text-brand-600 dark:text-brand-400">
                {previewDates.map(formatShortDate).join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {isEditing ? 'Salvar' : 'Criar Revisão'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ConfirmDeleteModal
// ---------------------------------------------------------------------------

function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  reviewName,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  reviewName: string;
  loading: boolean;
}) {
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
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Excluir revisão
          </h3>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Tem certeza que deseja excluir <strong>"{reviewName}"</strong>? Todos os questionários
            associados também serão removidos. Esta ação não pode ser desfeita.
          </p>
        </div>
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            Excluir
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ReviewListPage
// ---------------------------------------------------------------------------

export function ReviewListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { reviews, loading, error, loadReviews, createReview, updateReview, deleteReview } =
    useReviews();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchReviews = useCallback(() => {
    if (user) {
      loadReviews(user.id);
    }
  }, [user, loadReviews]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleOpenCreate = () => {
    setEditingReview(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (review: Review) => {
    setEditingReview(review);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (review: Review) => {
    setDeletingReview(review);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingReview) return;
    setDeleteLoading(true);
    await deleteReview(deletingReview.id);
    setDeleteLoading(false);
    setDeletingReview(null);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Revisões</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gerencie seus ciclos de revisão espaçada
          </p>
        </div>
        <Button onClick={handleOpenCreate}>Nova Revisão</Button>
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
      {!loading && error && <ErrorState message={error} onRetry={fetchReviews} />}

      {/* Empty State */}
      {!loading && !error && reviews.length === 0 && <EmptyState onCreate={handleOpenCreate} />}

      {/* Review Cards Grid */}
      {!loading && !error && reviews.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => {
            const allDates = generateReviewDates(
              review.startDate,
              review.intervalDays,
              review.totalReviews,
            );
            const today = new Date().toISOString().split('T')[0];
            const futureDates = allDates.filter((d) => d >= today);
            const pastDates = allDates.filter((d) => d < today);

            return (
              <div
                key={review.id}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              >
                {/* Color bar */}
                <div
                  className="absolute left-0 top-0 h-full w-1.5"
                  style={{ backgroundColor: review.color }}
                />

                <div className="ml-2">
                  {/* Nome */}
                  <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {review.name}
                  </h3>

                  {/* Data de início */}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Início: {formatLongDate(review.startDate)}
                  </p>

                  {/* Badge */}
                  <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                    A cada {review.intervalDays} {review.intervalDays === 1 ? 'dia' : 'dias'} ·{' '}
                    {review.totalReviews} revis{review.totalReviews === 1 ? 'ão' : 'ões'}
                  </span>

                  {/* Preview próximas datas */}
                  {futureDates.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                        {pastDates.length > 0 ? 'Próximas:' : 'Datas:'}
                      </p>
                      <p className="text-xs text-brand-600 dark:text-brand-400">
                        {futureDates.slice(0, 3).map(formatShortDate).join(', ')}
                        {futureDates.length > 3 && (
                          <span className="text-gray-400 dark:text-gray-500">
                            {' '}
                            +{futureDates.length - 3} mais
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Indicador de progresso */}
                  <div className="mt-3">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Progresso: {pastDates.length}/{allDates.length} períodos passados
                    </p>
                  </div>

                  {/* Link para detalhes */}
                  <div className="mt-3">
                    <Link
                      to={`/review/${review.id}`}
                      className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                    >
                      Ver detalhes →
                    </Link>
                  </div>
                </div>

                {/* Actions (visible on hover) */}
                <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(review)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    aria-label={`Editar ${review.name}`}
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
                    onClick={() => handleDeleteClick(review)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                    aria-label={`Excluir ${review.name}`}
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

                {/* Back navigation */}
                <div className="mt-4 ml-2">
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                  >
                    ← Voltar para início
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <ReviewFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={(input) => createReview(user!.id, input)}
        onUpdate={(id, data) => updateReview(id, data)}
        editingReview={editingReview}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingReview}
        onClose={() => setDeletingReview(null)}
        onConfirm={handleDeleteConfirm}
        reviewName={deletingReview?.name || ''}
        loading={deleteLoading}
      />
    </div>
  );
}
