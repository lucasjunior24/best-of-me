import { twMerge } from 'tailwind-merge';
import { Input } from './Input';

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#64748b', // slate
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  return (
    <div className={twMerge('space-y-3', className)}>
      {/* Preset grid */}
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-6">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            aria-label={`Cor ${color}`}
            aria-pressed={value === color}
            className={twMerge(
              'h-9 w-9 rounded-lg border-2 transition-all',
              value === color
                ? 'border-gray-900 ring-2 ring-gray-300 scale-110 dark:border-white dark:ring-gray-600'
                : 'border-transparent hover:scale-105',
            )}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      {/* Custom hex input */}
      <Input
        label="Cor personalizada (hex)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#FF5733"
        maxLength={7}
        className="font-mono text-xs"
      />
    </div>
  );
}
