import { twMerge } from 'tailwind-merge';

interface ProgressBarProps {
  value: number; // 0-100
  variant?: 'horizontal' | 'circular';
  color?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: { stroke: 2, radius: 20, dimension: 48, fontSize: 'text-xs' },
  md: { stroke: 3, radius: 32, dimension: 72, fontSize: 'text-sm' },
  lg: { stroke: 4, radius: 48, dimension: 108, fontSize: 'text-lg' },
};

export function ProgressBar({
  value,
  variant = 'horizontal',
  color = '#3b82f6',
  showLabel = true,
  size = 'md',
  className,
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  if (variant === 'circular') {
    const { stroke, radius, dimension, fontSize } = sizeMap[size];
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (clampedValue / 100) * circumference;

    return (
      <div
        className={twMerge('relative inline-flex items-center justify-center', className)}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <svg width={dimension} height={dimension} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        {showLabel && (
          <span
            className={twMerge('absolute font-semibold text-gray-900 dark:text-gray-100', fontSize)}
          >
            {Math.round(clampedValue)}%
          </span>
        )}
      </div>
    );
  }

  // Horizontal variant
  return (
    <div className={twMerge('w-full', className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full rounded-full transition-[width] duration-700 ease-out"
            style={{ width: `${clampedValue}%`, backgroundColor: color }}
          />
        </div>
        {showLabel && (
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 tabular-nums">
            {Math.round(clampedValue)}%
          </span>
        )}
      </div>
    </div>
  );
}
