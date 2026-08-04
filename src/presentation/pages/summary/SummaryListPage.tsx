import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../../hooks/useAuth';
import { useSummaries } from '../../hooks/useSummaries';
import { Button } from '../../components/ui/Button';
import { TagBadge } from '../../components/summary/TagBadge';
import { SummaryFormModal } from '../../components/summary/SummaryFormModal';
import type { Summary } from '../../../core/entities/Summary';

// ---------------------------------------------------------------------------
// Skeleton Card
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-3 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="mb-2 h-3 w-full rounded bg-gray-100 dark:bg-gray-700" />
      <div className="mb-2 h-3 w-5/6 rounded bg-gray-100 dark:bg-gray-700" />
      <div className="mb-3 h-3 w-2/3 rounded bg-gray-100 dark:bg-gray-700" />
      <div className="flex gap-2">
        <div className="h-5 w-14 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
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
        <rect x="24" y="20" width="80" height="88" rx="12" stroke="currentColor" strokeWidth="3" />
        <line
          x1="44"
          y1="44"
          x2="84"
          y2="44"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="44"
          y1="58"
          x2="84"
          y2="58"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="44"
          y1="72"
          x2="70"
          y2="72"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="44"
          y1="86"
          x2="64"
          y2="86"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="104" cy="92" r="16" fill="currentColor" opacity="0.15" />
        <text
          x="104"
          y="97"
          textAnchor="middle"
          fontSize="16"
          fill="currentColor"
          fontWeight="bold"
        >
          +
        </text>
      </svg>
      <h3 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300">
        Nenhum resumo criado
      </h3>
      <p className="mb-6 max-w-sm text-sm text-gray-500 dark:text-gray-400">
        Crie seu primeiro resumo para consolidar conhecimento com Markdown e organizar por tags.
      </p>
      <Button onClick={onCreate}>Criar primeiro resumo</Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty Filter State
// ---------------------------------------------------------------------------

function EmptyFilterState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg
        className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        />
      </svg>
      <h3 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300">
        Nenhum resultado encontrado
      </h3>
      <p className="mb-6 max-w-sm text-sm text-gray-500 dark:text-gray-400">
        Nenhum resumo corresponde aos filtros aplicados. Tente limpar ou ajustar os filtros.
      </p>
      <Button variant="outline" onClick={onClear}>
        Limpar filtros
      </Button>
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
        Erro ao carregar resumos
      </h3>
      <p className="mb-6 max-w-sm text-sm text-gray-500 dark:text-gray-400">{message}</p>
      <Button variant="outline" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete Confirmation Modal
// ---------------------------------------------------------------------------

function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  summaryTitle,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  summaryTitle: string;
  loading: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <svg
              className="h-5 w-5 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Excluir resumo</h2>
        </div>
        <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
          Tem certeza que deseja excluir este resumo?
        </p>
        <p className="mb-6 text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
          &ldquo;{summaryTitle}&rdquo;
        </p>
        <p className="mb-4 text-xs text-red-500 dark:text-red-400">
          Esta ação não pode ser desfeita.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
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
// SummaryListPage
// ---------------------------------------------------------------------------

export function SummaryListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    summaries,
    loading,
    error,
    selectedTags,
    searchQuery,
    setSelectedTags,
    setSearchQuery,
    loadSummaries,
    createSummary,
    updateSummary,
    deleteSummary,
  } = useSummaries();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSummary, setEditingSummary] = useState<Summary | null>(null);
  const [deletingSummary, setDeletingSummary] = useState<Summary | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ---- Sync query params → local state on mount ----
  useEffect(() => {
    const tagsParam = searchParams.get('tags');
    const searchParam = searchParams.get('search');

    if (tagsParam) {
      const tagsFromUrl = tagsParam
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      if (tagsFromUrl.length > 0) {
        setSelectedTags(tagsFromUrl);
      }
    }

    if (searchParam) {
      setSearchQuery(searchParam.trim());
    }
    // Run only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Sync local state → query params ----
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedTags.length > 0) {
      params.set('tags', selectedTags.join(','));
    }
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim());
    }
    setSearchParams(params, { replace: true });
  }, [selectedTags, searchQuery, setSearchParams]);

  const fetchSummaries = useCallback(() => {
    if (user) {
      loadSummaries(user.id);
    }
  }, [user, loadSummaries]);

  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  // ---- Derived: Tag counts for filter chips ----
  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const summary of summaries) {
      for (const tag of summary.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    // Sort alphabetically
    return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [summaries]);

  // ---- Handlers ----

  const handleOpenCreate = () => {
    setEditingSummary(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (summary: Summary) => {
    setEditingSummary(summary);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (summary: Summary) => {
    setDeletingSummary(summary);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSummary || !user) return;
    setDeleteLoading(true);
    await deleteSummary(deletingSummary.id, user.id);
    setDeleteLoading(false);
    setDeletingSummary(null);
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(
      selectedTags.includes(tag) ? selectedTags.filter((t) => t !== tag) : [...selectedTags, tag],
    );
  };

  const handleClearFilters = () => {
    setSelectedTags([]);
    setSearchQuery('');
  };

  const hasActiveFilters = selectedTags.length > 0 || searchQuery.trim().length > 0;

  // ---- Format helpers ----

  const formatDate = (date: Date): string => {
    try {
      return format(date, "dd 'de' MMM 'de' yyyy", { locale: ptBR });
    } catch {
      return '';
    }
  };

  const previewContent = (content: string, maxLen = 150): string => {
    const plain = content
      .replace(/[#*`>[\]()!\-_~]/g, '')
      .replace(/\n+/g, ' ')
      .trim();
    if (plain.length <= maxLen) return plain;
    return plain.slice(0, maxLen) + '...';
  };

  // ---- Render ----

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">📝 Meus Resumos</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Crie e organize resumos com Markdown e tags
          </p>
        </div>
        <Button onClick={handleOpenCreate}>Novo Resumo</Button>
      </div>

      {/* Search + Filter bar */}
      <div className="mb-6 space-y-3">
        {/* Search input */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar resumos por título ou conteúdo..."
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-brand-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Limpar busca"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Tag filter chips */}
        {tagCounts.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {/* "All" chip */}
            <button
              type="button"
              onClick={() => setSelectedTags([])}
              className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedTags.length === 0
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              Todos
              <span className="ml-1 opacity-70">{summaries.length}</span>
            </button>
            {tagCounts.map(([tag, count]) => (
              <TagBadge
                key={tag}
                tag={tag}
                size="sm"
                selected={selectedTags.includes(tag)}
                count={count}
                onClick={handleTagToggle}
              />
            ))}
          </div>
        )}

        {/* Active filters indicator */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>
              {summaries.length} {summaries.length === 1 ? 'resultado' : 'resultados'} encontrados
            </span>
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 underline"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && <ErrorState message={error} onRetry={fetchSummaries} />}

      {/* Empty State (no summaries at all) */}
      {!loading && !error && summaries.length === 0 && !hasActiveFilters && (
        <EmptyState onCreate={handleOpenCreate} />
      )}

      {/* Empty Filter State (has summaries but filters removed all) */}
      {!loading && !error && summaries.length === 0 && hasActiveFilters && (
        <EmptyFilterState onClear={handleClearFilters} />
      )}

      {/* Summary Cards Grid */}
      {!loading && !error && summaries.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {summaries.map((summary) => (
            <div
              key={summary.id}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800 cursor-pointer"
              onClick={() => navigate(`/summary/${summary.id}`)}
            >
              {/* Title (max 2 lines) */}
              <h3 className="mb-2 line-clamp-2 text-base font-semibold text-gray-900 dark:text-gray-100">
                {summary.title}
              </h3>

              {/* Content preview */}
              <p className="mb-3 line-clamp-3 text-sm text-gray-500 dark:text-gray-400">
                {previewContent(summary.content)}
              </p>

              {/* Tags */}
              {summary.tags.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1">
                  {summary.tags.slice(0, 4).map((tag) => (
                    <TagBadge key={tag} tag={tag} size="sm" />
                  ))}
                  {summary.tags.length > 4 && (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                      +{summary.tags.length - 4}
                    </span>
                  )}
                </div>
              )}

              {/* Dates */}
              <div className="flex items-center gap-3 text-[11px] text-gray-400 dark:text-gray-500">
                <span>Criado em {formatDate(summary.createdAt)}</span>
                {summary.updatedAt !== summary.createdAt && (
                  <span>· Editado em {formatDate(summary.updatedAt)}</span>
                )}
              </div>

              {/* Actions (visible on hover) */}
              <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEdit(summary);
                  }}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  aria-label={`Editar ${summary.title}`}
                  title="Editar"
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(summary);
                  }}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                  aria-label={`Excluir ${summary.title}`}
                  title="Excluir"
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
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {user && (
        <SummaryFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={(input) => createSummary(user.id, input)}
          onUpdate={(summaryId, input) => updateSummary(summaryId, user.id, input)}
          editingSummary={editingSummary}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingSummary}
        onClose={() => setDeletingSummary(null)}
        onConfirm={handleDeleteConfirm}
        summaryTitle={deletingSummary?.title ?? ''}
        loading={deleteLoading}
      />
    </div>
  );
}
