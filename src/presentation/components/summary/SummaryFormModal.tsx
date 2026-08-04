import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { TagInput } from './TagInput';
import type {
  Summary,
  CreateSummaryInput,
  UpdateSummaryInput,
} from '../../../core/entities/Summary';

interface SummaryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateSummaryInput) => Promise<Summary | null>;
  onUpdate: (summaryId: string, input: UpdateSummaryInput) => Promise<Summary | null>;
  editingSummary?: Summary | null;
}

interface FormErrors {
  title?: string;
  content?: string;
  tags?: string;
}

export function SummaryFormModal({
  isOpen,
  onClose,
  onSubmit,
  onUpdate,
  editingSummary = null,
}: SummaryFormModalProps) {
  const isEditing = !!editingSummary;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (isOpen) {
      if (editingSummary) {
        setTitle(editingSummary.title);
        setContent(editingSummary.content);
        setTags([...editingSummary.tags]);
      } else {
        setTitle('');
        setContent('');
        setTags([]);
      }
      setErrors({});
      setSubmitting(false);
    }
  }, [isOpen, editingSummary]);

  const validate = useCallback((): FormErrors => {
    const errs: FormErrors = {};

    if (!title || title.trim().length < 2) {
      errs.title = 'O título deve ter pelo menos 2 caracteres.';
    } else if (title.trim().length > 200) {
      errs.title = 'O título deve ter no máximo 200 caracteres.';
    }

    if (!content || content.trim().length === 0) {
      errs.content = 'O conteúdo não pode estar vazio.';
    }

    if (tags.length > 20) {
      errs.tags = 'Máximo de 20 tags permitidas.';
    } else {
      for (const tag of tags) {
        if (tag.trim().length === 0) {
          errs.tags = 'As tags não podem estar vazias.';
          break;
        }
        if (tag.length > 50) {
          errs.tags = `A tag "${tag}" excede 50 caracteres.`;
          break;
        }
      }
    }

    return errs;
  }, [title, content, tags]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);

    if (isEditing && editingSummary) {
      await onUpdate(editingSummary.id, {
        title: title.trim(),
        content: content.trim(),
        tags,
      });
    } else {
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        tags,
      });
    }

    setSubmitting(false);
    onClose();
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Resumo' : 'Novo Resumo'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" loading={submitting} onClick={handleSubmit}>
            {isEditing ? 'Salvar' : 'Criar Resumo'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <Input
          label="Título do Resumo"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
          }}
          error={errors.title}
          placeholder="Ex: Entendendo React Hooks..."
          autoFocus
        />

        {/* Content */}
        <div>
          <label
            htmlFor="summary-content"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Conteúdo (Markdown)
          </label>
          <textarea
            id="summary-content"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (errors.content) setErrors((prev) => ({ ...prev, content: undefined }));
            }}
            placeholder="Escreva seu resumo em Markdown..."
            rows={10}
            className={`
              block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 transition-colors
              placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0
              dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500
              ${
                errors.content
                  ? 'border-red-400 focus:ring-red-400 dark:border-red-500'
                  : 'border-gray-300 focus:border-brand-500 focus:ring-brand-500 dark:border-gray-700 dark:focus:border-brand-400 dark:focus:ring-brand-400'
              }
            `}
            style={{ minHeight: '200px', resize: 'vertical' }}
            aria-invalid={!!errors.content}
            aria-describedby={errors.content ? 'content-error' : undefined}
          />
          {errors.content && (
            <p
              id="content-error"
              className="mt-1.5 text-xs text-red-500 dark:text-red-400"
              role="alert"
            >
              {errors.content}
            </p>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tags
          </label>
          <TagInput
            tags={tags}
            onChange={(newTags) => {
              setTags(newTags);
              if (errors.tags) setErrors((prev) => ({ ...prev, tags: undefined }));
            }}
            error={errors.tags}
            disabled={submitting}
          />
        </div>
      </form>
    </Modal>
  );
}
