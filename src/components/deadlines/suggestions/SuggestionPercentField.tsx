import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/** Evita aplicar el % en cada tecla (p. ej. «8» antes de «80» vacía el asistente). */
export function SuggestionPercentField({
  id,
  label,
  value,
  inputValue,
  onInputChange,
  onCommit,
  min = 0,
  max = 100,
  size = 'default',
}: {
  id: string;
  label: string;
  value: number;
  inputValue: string;
  onInputChange: (s: string) => void;
  onCommit: (n: number) => void;
  min?: number;
  max?: number;
  size?: 'default' | 'compact';
}) {
  const compact = size === 'compact';
  const [local, setLocal] = useState(inputValue);

  useEffect(() => {
    setLocal(inputValue);
  }, [inputValue]);

  const commit = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed === '') {
      onInputChange(String(value));
      setLocal(String(value));
      return;
    }
    const parsed = parseInt(trimmed, 10);
    if (!Number.isFinite(parsed)) {
      onInputChange(String(value));
      setLocal(String(value));
      return;
    }
    const clamped = Math.min(max, Math.max(min, parsed));
    onCommit(clamped);
    onInputChange(String(clamped));
    setLocal(String(clamped));
  };

  return (
    <div>
      <Label
        htmlFor={id}
        className={cn(
          compact ? 'text-[11px] font-medium text-slate-600 leading-tight' : 'text-xs font-medium text-slate-700'
        )}
      >
        {label}
      </Label>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        className={cn('font-mono', compact ? 'h-8 text-xs mt-1' : 'h-10 text-sm mt-1.5')}
        value={local}
        onChange={(e) => {
          const next = e.target.value.replace(/[^\d]/g, '');
          setLocal(next);
        }}
        onBlur={() => commit(local)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit(local);
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
    </div>
  );
}
