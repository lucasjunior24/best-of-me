import { twMerge } from 'tailwind-merge';

interface TagBadgeProps {
  tag: string;
  size?: 'sm' | 'md';
  onClick?: (tag: string) => void;
  selected?: boolean;
  count?: number;
}

/**
 * Derive a deterministic color from a string tag using a simple hash.
 */
function stringToColor(str: string): { bg: string; text: string; bgSelected: string } {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Use a palette of softer colors for dark mode compatibility
  const palette = [
    {
      bg: 'bg-blue-100 dark:bg-blue-900/40',
      text: 'text-blue-700 dark:text-blue-300',
      bgSelected: 'bg-blue-500 text-white dark:bg-blue-600',
    },
    {
      bg: 'bg-emerald-100 dark:bg-emerald-900/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      bgSelected: 'bg-emerald-500 text-white dark:bg-emerald-600',
    },
    {
      bg: 'bg-purple-100 dark:bg-purple-900/40',
      text: 'text-purple-700 dark:text-purple-300',
      bgSelected: 'bg-purple-500 text-white dark:bg-purple-600',
    },
    {
      bg: 'bg-amber-100 dark:bg-amber-900/40',
      text: 'text-amber-700 dark:text-amber-300',
      bgSelected: 'bg-amber-500 text-white dark:bg-amber-600',
    },
    {
      bg: 'bg-rose-100 dark:bg-rose-900/40',
      text: 'text-rose-700 dark:text-rose-300',
      bgSelected: 'bg-rose-500 text-white dark:bg-rose-600',
    },
    {
      bg: 'bg-cyan-100 dark:bg-cyan-900/40',
      text: 'text-cyan-700 dark:text-cyan-300',
      bgSelected: 'bg-cyan-500 text-white dark:bg-cyan-600',
    },
    {
      bg: 'bg-indigo-100 dark:bg-indigo-900/40',
      text: 'text-indigo-700 dark:text-indigo-300',
      bgSelected: 'bg-indigo-500 text-white dark:bg-indigo-600',
    },
    {
      bg: 'bg-teal-100 dark:bg-teal-900/40',
      text: 'text-teal-700 dark:text-teal-300',
      bgSelected: 'bg-teal-500 text-white dark:bg-teal-600',
    },
    {
      bg: 'bg-orange-100 dark:bg-orange-900/40',
      text: 'text-orange-700 dark:text-orange-300',
      bgSelected: 'bg-orange-500 text-white dark:bg-orange-600',
    },
    {
      bg: 'bg-pink-100 dark:bg-pink-900/40',
      text: 'text-pink-700 dark:text-pink-300',
      bgSelected: 'bg-pink-500 text-white dark:bg-pink-600',
    },
  ];

  const index = Math.abs(hash) % palette.length;
  return palette[index];
}

const sizeClasses: Record<'sm' | 'md', string> = {
  sm: 'px-1.5 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-xs',
};

export function TagBadge({ tag, size = 'md', onClick, selected = false, count }: TagBadgeProps) {
  const colors = stringToColor(tag);

  const badge = (
    <span
      className={twMerge(
        'inline-flex items-center gap-1 rounded-full font-medium transition-colors',
        sizeClasses[size],
        selected ? colors.bgSelected : twMerge(colors.bg, colors.text),
        onClick && 'cursor-pointer hover:opacity-80',
      )}
      role={onClick ? 'button' : undefined}
      aria-pressed={onClick ? selected : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(tag);
              }
            }
          : undefined
      }
    >
      {tag}
      {count !== undefined && (
        <span
          className={twMerge(
            'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
            selected ? 'bg-white/25' : 'bg-black/10 dark:bg-white/15',
          )}
        >
          {count}
        </span>
      )}
    </span>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={() => onClick(tag)}
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 rounded-full"
      >
        {badge}
      </button>
    );
  }

  return badge;
}
