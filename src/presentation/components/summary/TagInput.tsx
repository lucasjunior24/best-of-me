import { useState, useRef, type KeyboardEvent } from 'react';
import { TagBadge } from './TagBadge';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}

const MAX_TAGS_DEFAULT = 20;

export function TagInput({
  tags,
  onChange,
  maxTags = MAX_TAGS_DEFAULT,
  error,
  disabled = false,
  placeholder = 'Digite uma tag e pressione Enter...',
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (raw: string) => {
    const trimmed = raw.trim().toLowerCase();
    if (!trimmed) return;
    if (trimmed.length > 50) return;
    if (tags.length >= maxTags) return;

    // Case-insensitive duplicate check
    if (tags.some((t) => t.toLowerCase() === trimmed)) return;

    onChange([...tags, trimmed]);
    setInputValue('');
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      // Remove last tag on backspace when input is empty
      const lastTag = tags[tags.length - 1];
      removeTag(lastTag);
    } else if (e.key === ',') {
      e.preventDefault();
      addTag(inputValue.replace(',', ''));
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    // Split by comma, space, or newline
    const parts = pasted
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const part of parts) {
      addTag(part);
    }
  };

  return (
    <div>
      <div
        className={`
          flex flex-wrap items-center gap-1.5 rounded-lg border bg-white px-3 py-2 transition-colors
          dark:bg-gray-900
          ${
            error
              ? 'border-red-400 dark:border-red-500'
              : 'border-gray-300 dark:border-gray-700 focus-within:border-brand-500 dark:focus-within:border-brand-400'
          }
          ${disabled ? 'cursor-not-allowed opacity-60' : ''}
        `}
        onClick={() => {
          if (!disabled) inputRef.current?.focus();
        }}
      >
        {tags.map((tag) => (
          <span key={tag} className="flex items-center gap-0.5">
            <TagBadge tag={tag} size="sm" />
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
                className="rounded-full p-0.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                aria-label={`Remover tag ${tag}`}
              >
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          disabled={disabled}
          placeholder={
            tags.length === 0 ? placeholder : tags.length < maxTags ? 'Adicionar tag...' : ''
          }
          className="min-w-[100px] flex-1 border-none bg-transparent px-1 py-0.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500"
          aria-label="Adicionar tag"
        />
      </div>

      {/* Helper info */}
      <div className="mt-1.5 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
        <span>Pressione Enter ou vírgula para adicionar</span>
        <span>
          {tags.length}/{maxTags}
        </span>
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-500 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
