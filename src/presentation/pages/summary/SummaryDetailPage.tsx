import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { useAuth } from '../../hooks/useAuth';
import { useSummaries } from '../../hooks/useSummaries';
import { Button } from '../../components/ui/Button';
import { TagBadge } from '../../components/summary/TagBadge';
import { TagInput } from '../../components/summary/TagInput';
import type { Summary, UpdateSummaryInput } from '../../../core/entities/Summary';
import { container } from '../../../di/container';
import { handleError } from '../../../shared/errorHandler';

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
// Skeleton
// ---------------------------------------------------------------------------

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 h-5 w-24 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="mb-4 h-8 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="mb-4 flex gap-2">
        <div className="h-5 w-14 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="mb-2 h-3 w-48 rounded bg-gray-100 dark:bg-gray-700" />
      <div className="mt-8 space-y-3">
        <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-700" />
        <div className="h-4 w-5/6 rounded bg-gray-100 dark:bg-gray-700" />
        <div className="h-4 w-4/6 rounded bg-gray-100 dark:bg-gray-700" />
        <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-700" />
        <div className="h-4 w-3/4 rounded bg-gray-100 dark:bg-gray-700" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Not Found
// ---------------------------------------------------------------------------

function NotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
        <svg
          className="h-8 w-8 text-gray-400"
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
        Resumo não encontrado
      </h3>
      <p className="mb-6 max-w-sm text-sm text-gray-500 dark:text-gray-400">
        O resumo que você procura pode ter sido excluído ou o link está incorreto.
      </p>
      <Button variant="outline" onClick={onBack}>
        ← Voltar para resumos
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
        Erro ao carregar resumo
      </h3>
      <p className="mb-6 max-w-sm text-sm text-gray-500 dark:text-gray-400">{message}</p>
      <Button variant="outline" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Markdown Styles Import
// ---------------------------------------------------------------------------

import 'highlight.js/styles/github-dark.css';

// inline colour palette for light/dark code background
const markdownStyles = `
  .markdown-body {
    font-size: 1rem;
    line-height: 1.75;
    color: #374151;
  }
  .dark .markdown-body {
    color: #e5e7eb;
  }
  .markdown-body h1,
  .markdown-body h2,
  .markdown-body h3,
  .markdown-body h4,
  .markdown-body h5,
  .markdown-body h6 {
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    font-weight: 600;
    line-height: 1.3;
    color: #111827;
  }
  .dark .markdown-body h1,
  .dark .markdown-body h2,
  .dark .markdown-body h3,
  .dark .markdown-body h4,
  .dark .markdown-body h5,
  .dark .markdown-body h6 {
    color: #f9fafb;
  }
  .markdown-body h1 { font-size: 1.75rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.3em; }
  .dark .markdown-body h1 { border-bottom-color: #374151; }
  .markdown-body h2 { font-size: 1.5rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.25em; }
  .dark .markdown-body h2 { border-bottom-color: #374151; }
  .markdown-body h3 { font-size: 1.25rem; }
  .markdown-body p { margin-bottom: 1em; }
  .markdown-body ul,
  .markdown-body ol {
    margin-bottom: 1em;
    padding-left: 1.5em;
  }
  .markdown-body li { margin-bottom: 0.25em; }
  .markdown-body ul { list-style-type: disc; }
  .markdown-body ol { list-style-type: decimal; }
  .markdown-body blockquote {
    border-left: 4px solid #d1d5db;
    padding-left: 1em;
    margin-bottom: 1em;
    color: #6b7280;
  }
  .dark .markdown-body blockquote {
    border-left-color: #4b5563;
    color: #9ca3af;
  }
  .markdown-body code {
    background: #f3f4f6;
    padding: 0.15em 0.4em;
    border-radius: 4px;
    font-size: 0.875em;
    font-family: 'Fira Code', 'Consolas', monospace;
  }
  .dark .markdown-body code {
    background: #1f2937;
  }
  .markdown-body pre {
    background: #0d1117;
    border-radius: 8px;
    padding: 1em;
    overflow-x: auto;
    margin-bottom: 1em;
  }
  .markdown-body pre code {
    background: transparent;
    padding: 0;
    font-size: 0.875em;
    color: #e6edf3;
  }
  .dark .markdown-body pre {
    background: #161b22;
  }
  .markdown-body a {
    color: #6366f1;
    text-decoration: underline;
  }
  .dark .markdown-body a {
    color: #818cf8;
  }
  .markdown-body img {
    max-width: 100%;
    border-radius: 8px;
  }
  .markdown-body table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1em;
  }
  .markdown-body th,
  .markdown-body td {
    border: 1px solid #d1d5db;
    padding: 0.5em 0.75em;
    text-align: left;
  }
  .dark .markdown-body th,
  .dark .markdown-body td {
    border-color: #374151;
  }
  .markdown-body th {
    background: #f9fafb;
    font-weight: 600;
  }
  .dark .markdown-body th {
    background: #111827;
  }
  .markdown-body hr {
    border: none;
    border-top: 1px solid #e5e7eb;
    margin: 1.5em 0;
  }
  .dark .markdown-body hr {
    border-top-color: #374151;
  }
`;

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function SummaryDetailPage() {
  const { summaryId } = useParams<{ summaryId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { deleteSummary } = useSummaries();

  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [previewMarkdown, setPreviewMarkdown] = useState(false);
  const [formErrors, setFormErrors] = useState<{ title?: string; content?: string }>({});

  // Delete state
  const [showDelete, setShowDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ---- Fetch summary ----
  const fetchSummary = useCallback(async () => {
    if (!summaryId || !user) return;
    setLoading(true);
    setError(null);
    try {
      const result = await container.useCases.getSummaryById.execute(user.id, summaryId);
      setSummary(result);
    } catch (err) {
      const message = handleError(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [summaryId, user]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // ---- Enter / Exit edit mode ----
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Place cursor at end
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [isEditing]);

  const handleEnterEdit = () => {
    if (!summary) return;
    setEditTitle(summary.title);
    setEditContent(summary.content);
    setEditTags([...summary.tags]);
    setFormErrors({});
    setPreviewMarkdown(false);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setPreviewMarkdown(false);
    setFormErrors({});
  };

  // ---- Validate edit form ----
  const validateEditForm = (): { title?: string; content?: string } => {
    const errs: { title?: string; content?: string } = {};
    if (!editTitle || editTitle.trim().length < 2) {
      errs.title = 'O título deve ter pelo menos 2 caracteres.';
    } else if (editTitle.trim().length > 200) {
      errs.title = 'O título deve ter no máximo 200 caracteres.';
    }
    if (!editContent || editContent.trim().length === 0) {
      errs.content = 'O conteúdo não pode estar vazio.';
    }
    return errs;
  };

  // ---- Save edit ----
  const handleSave = async () => {
    const errs = validateEditForm();
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (!summaryId || !user) return;
    setSaving(true);
    try {
      const input: UpdateSummaryInput = {
        title: editTitle.trim(),
        content: editContent.trim(),
        tags: editTags,
      };
      const updated = await container.useCases.updateSummary.execute(user.id, summaryId, input);
      setSummary(updated);
      container.toastService.success('Resumo atualizado! 📝');
      setIsEditing(false);
      setPreviewMarkdown(false);
    } catch (err) {
      const message = handleError(err);
      container.toastService.error(message);
    } finally {
      setSaving(false);
    }
  };

  // ---- Delete ----
  const handleDeleteConfirm = async () => {
    if (!summaryId || !user) return;
    setDeleteLoading(true);
    const success = await deleteSummary(summaryId, user.id);
    setDeleteLoading(false);
    if (success) {
      navigate('/summary');
    }
  };

  // ---- Tag click → navigate to list with filter ----
  const handleTagClick = (tag: string) => {
    navigate(`/summary?tags=${encodeURIComponent(tag)}`);
  };

  // ---- Format helpers ----
  const formatDateTime = (date: Date): string => {
    try {
      return format(date, "dd 'de' MMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return '';
    }
  };

  // ---- Navigate back ----
  const handleBack = () => {
    navigate('/summary');
  };

  // ---- Keyboard shortcuts for edit mode ----
  useEffect(() => {
    if (!isEditing) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape') {
        handleCancelEdit();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, editTitle, editContent, editTags]);

  // ---- Render ----
  if (loading) return <DetailSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchSummary} />;
  if (!summary) return <NotFound onBack={handleBack} />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back button */}
      <button
        type="button"
        onClick={handleBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Voltar para resumos
      </button>

      {/* === VIEW MODE === */}
      {!isEditing && (
        <>
          {/* Header */}
          <div className="mb-6">
            <h1 className="mb-3 text-2xl font-bold leading-tight text-gray-900 dark:text-gray-100 sm:text-3xl">
              {summary.title}
            </h1>

            {/* Tags */}
            {summary.tags.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {summary.tags.map((tag) => (
                  <TagBadge key={tag} tag={tag} size="md" onClick={handleTagClick} />
                ))}
              </div>
            )}

            {/* Dates */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
              <span>Criado em {formatDateTime(summary.createdAt)}</span>
              {summary.updatedAt !== summary.createdAt && (
                <span>· Atualizado em {formatDateTime(summary.updatedAt)}</span>
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-4 flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleEnterEdit}>
                <svg
                  className="mr-1 h-4 w-4"
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
                Editar
              </Button>
              <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>
                <svg
                  className="mr-1 h-4 w-4"
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
                Excluir
              </Button>
            </div>
          </div>

          {/* Separator */}
          <div className="mb-8 border-t border-gray-200 dark:border-gray-700" />

          {/* Markdown content */}
          <div className="markdown-body">
            <style>{markdownStyles}</style>
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
              {summary.content}
            </ReactMarkdown>
          </div>
        </>
      )}

      {/* === EDIT MODE === */}
      {isEditing && (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Editar Resumo</h2>
          </div>

          <div className="space-y-5">
            {/* Title field */}
            <div>
              <label
                htmlFor="edit-title"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Título do Resumo
              </label>
              <input
                id="edit-title"
                type="text"
                value={editTitle}
                onChange={(e) => {
                  setEditTitle(e.target.value);
                  if (formErrors.title) setFormErrors((prev) => ({ ...prev, title: undefined }));
                }}
                className={`block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 ${
                  formErrors.title
                    ? 'border-red-400 focus:ring-red-400 dark:border-red-500'
                    : 'border-gray-300 focus:border-brand-500 focus:ring-brand-500 dark:border-gray-700 dark:focus:border-brand-400 dark:focus:ring-brand-400'
                }`}
                placeholder="Ex: Entendendo React Hooks..."
                autoFocus
              />
              {formErrors.title && (
                <p className="mt-1.5 text-xs text-red-500 dark:text-red-400" role="alert">
                  {formErrors.title}
                </p>
              )}
            </div>

            {/* Content field + Preview toggle */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Conteúdo (Markdown)
                </label>
                <button
                  type="button"
                  onClick={() => setPreviewMarkdown(!previewMarkdown)}
                  className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
                >
                  {previewMarkdown ? 'Editar Markdown' : 'Visualizar Preview'}
                </button>
              </div>

              {previewMarkdown ? (
                <div className="min-h-[300px] rounded-lg border border-gray-300 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 markdown-body">
                  <style>{markdownStyles}</style>
                  {editContent.trim() ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                      {editContent}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      Nada para visualizar. Escreva algo no editor...
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <textarea
                    ref={textareaRef}
                    id="edit-content"
                    value={editContent}
                    onChange={(e) => {
                      setEditContent(e.target.value);
                      if (formErrors.content)
                        setFormErrors((prev) => ({ ...prev, content: undefined }));
                    }}
                    placeholder="Escreva seu resumo em Markdown..."
                    rows={14}
                    className={`block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 ${
                      formErrors.content
                        ? 'border-red-400 focus:ring-red-400 dark:border-red-500'
                        : 'border-gray-300 focus:border-brand-500 focus:ring-brand-500 dark:border-gray-700 dark:focus:border-brand-400 dark:focus:ring-brand-400'
                    }`}
                    style={{ minHeight: '350px', resize: 'vertical' }}
                    aria-invalid={!!formErrors.content}
                    aria-describedby={formErrors.content ? 'edit-content-error' : undefined}
                  />
                  {formErrors.content && (
                    <p
                      id="edit-content-error"
                      className="mt-1.5 text-xs text-red-500 dark:text-red-400"
                      role="alert"
                    >
                      {formErrors.content}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tags
              </label>
              <TagInput tags={editTags} onChange={setEditTags} disabled={saving} />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Ctrl+S para salvar · Esc para cancelar
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleCancelEdit} disabled={saving}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} loading={saving}>
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDeleteConfirm}
        summaryTitle={summary.title}
        loading={deleteLoading}
      />
    </div>
  );
}
