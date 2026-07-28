import { useState, useEffect, useCallback, type ChangeEvent } from 'react';
import { twMerge } from 'tailwind-merge';
import { useId } from 'react';

// ---------------------------------------------------------------------------
// Utility functions (exported for reuse)
// ---------------------------------------------------------------------------

/**
 * Converte horas decimais (ex: 1.5) para string HH:MM (ex: "01:30")
 */
export function hoursToTimeString(hours: number): string {
  if (!isFinite(hours) || hours < 0) return '00:00';

  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Converte string HH:MM (ex: "01:30") para horas decimais (ex: 1.5)
 * Aceita formatos parciais durante digitação: "1", "1:", "1:3", "01:30"
 * Retorna null se a string não for um horário válido
 */
export function timeStringToHours(time: string): number | null {
  // Remove espaços
  const cleaned = time.trim();

  // Padrão completo HH:MM ou H:MM
  const fullMatch = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (fullMatch) {
    const h = parseInt(fullMatch[1], 10);
    const m = parseInt(fullMatch[2], 10);
    if (h >= 0 && m >= 0 && m <= 59) {
      return h + m / 60;
    }
    return null;
  }

  // Padrão parcial: apenas horas (ex: "1" ou "01")
  const partialHoursMatch = cleaned.match(/^(\d{1,2})$/);
  if (partialHoursMatch) {
    const h = parseInt(partialHoursMatch[1], 10);
    if (h >= 0) {
      return h;
    }
    return null;
  }

  return null;
}

/**
 * Formata horas decimais para exibição amigável (ex: 2.5 → "2h30min", 1 → "1h")
 */
export function formatHours(hours: number): string {
  if (!isFinite(hours) || hours < 0) return '0min';

  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m}min`;
}

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

/**
 * Aplica máscara enquanto o usuário digita.
 * Regras:
 * - Só permite dígitos
 * - Insere ":" automaticamente após 2 dígitos de hora
 * - Limita a 5 caracteres (HH:MM)
 * - Minutos máximos: 59
 */
function applyTimeMask(raw: string): string {
  // Remove qualquer caractere que não seja dígito
  let digits = raw.replace(/\D/g, '');

  // Limita a 4 dígitos
  if (digits.length > 4) {
    digits = digits.slice(0, 4);
  }

  // Se tiver 3 ou 4 dígitos: formata como HH:MM
  if (digits.length >= 3) {
    const hh = digits.slice(0, 2);
    let mm = digits.slice(2, 4);

    // Corrigir minutos > 59
    const mmNum = parseInt(mm, 10);
    if (mmNum > 59) {
      mm = '59';
    }

    return `${hh}:${mm}`;
  }

  // Se tiver 2 dígitos: insere ":" automaticamente se próximo dígito iniciar minutos
  // Mas durante digitação, retornamos só os dígitos e o cursor se ajusta
  if (digits.length === 2) {
    return `${digits}`;
  }

  return digits;
}

interface TimeInputProps {
  value: number; // horas decimais (ex: 1.5)
  onChange: (value: number) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function TimeInput({
  value,
  onChange,
  label,
  error,
  disabled = false,
  className,
  placeholder = '00:00',
}: TimeInputProps) {
  const generatedId = useId();
  const inputId = `time-input-${generatedId}`;
  const errorId = `${inputId}-error`;

  // Estado local: string exibida no input
  const [displayValue, setDisplayValue] = useState(() => hoursToTimeString(value));
  const [focused, setFocused] = useState(false);

  // Sincroniza com prop externa (quando não está focado/digitando)
  useEffect(() => {
    if (!focused) {
      setDisplayValue(hoursToTimeString(value));
    }
  }, [value, focused]);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const masked = applyTimeMask(raw);
    setDisplayValue(masked);
  }, []);

  const handleBlur = useCallback(() => {
    setFocused(false);

    // Ao perder o foco, tenta interpretar o valor
    const parsed = timeStringToHours(displayValue);
    if (parsed !== null && parsed !== value) {
      onChange(parsed);
    } else if (parsed === null) {
      // Se inválido, restaura o valor anterior
      setDisplayValue(hoursToTimeString(value));
    } else {
      // Valor igual, só normaliza formato
      setDisplayValue(hoursToTimeString(value));
    }
  }, [displayValue, value, onChange]);

  const handleFocus = useCallback(() => {
    setFocused(true);
    // Ao focar, seleciona todo o conteúdo para facilitar sobrescrita
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Ao pressionar Enter, faz o blur para confirmar o valor
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  }, []);

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
        id={inputId}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={5}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={twMerge(
          'block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors font-mono tracking-wider',
          'focus:outline-none focus:ring-2 focus:ring-offset-0 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500',
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-200 dark:border-red-500 dark:focus:ring-red-800'
            : 'border-gray-300 focus:border-brand-500 focus:ring-brand-200 dark:border-gray-600 dark:focus:border-brand-400 dark:focus:ring-brand-800',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-900',
          className,
        )}
      />
      {error && (
        <p id={errorId} className="mt-1.5 text-xs text-red-500 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
