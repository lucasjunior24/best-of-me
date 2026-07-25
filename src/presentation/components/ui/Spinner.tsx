import { twMerge } from 'tailwind-merge';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-[3px]',
  lg: 'h-12 w-12 border-4',
};

const colorClasses = {
  primary: 'border-brand-300 dark:border-brand-700 border-t-brand-600 dark:border-t-brand-400',
  white: 'border-white/30 border-t-white',
};

export function Spinner({ size = 'md', color = 'primary', className }: SpinnerProps) {
  return (
    <div
      className={twMerge(
        'animate-spin rounded-full',
        sizeClasses[size],
        colorClasses[color],
        className,
      )}
      role="status"
      aria-label="Carregando"
    />
  );
}
