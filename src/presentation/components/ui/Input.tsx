import { twMerge } from 'tailwind-merge';
import { type InputHTMLAttributes, forwardRef, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id: externalId, ...props }, ref) => {
    const generatedId = useId();
    const inputId = externalId || generatedId;
    const errorId = `${inputId}-error`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={twMerge(
            'block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-offset-0 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500',
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-200 dark:border-red-500 dark:focus:ring-red-800'
              : 'border-gray-300 focus:border-brand-500 focus:ring-brand-200 dark:border-gray-600 dark:focus:border-brand-400 dark:focus:ring-brand-800',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-900',
            className,
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1.5 text-xs text-red-500 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
