import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useDateLocale } from '@/hooks/useDateLocale';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

function parseIsoDateSafe(s: string | undefined): Date | undefined {
  const t = s?.trim();
  if (!t) return undefined;
  try {
    const d = parseISO(t);
    return Number.isNaN(d.getTime()) ? undefined : d;
  } catch {
    return undefined;
  }
}

export interface PhaseDatePickerButtonProps {
  value: string;
  onChange: (yyyyMmDd: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** id para accesibilidad / label asociado */
  id?: string;
}

/**
 * Selector de fecha tipo calendario (Popover + DayPicker), coherente con el resto de la UI.
 * Valor y callback en formato `YYYY-MM-DD` o cadena vacía.
 */
export function PhaseDatePickerButton({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  id,
}: PhaseDatePickerButtonProps) {
  const { t } = useTranslation('app');
  const dateLocale = useDateLocale();
  const resolvedPlaceholder = placeholder ?? t('common.selectDate', 'Seleccionar fecha');
  const [open, setOpen] = useState(false);
  const selected = parseIsoDateSafe(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          id={id}
          disabled={disabled}
          className={cn(
            'h-10 w-full justify-start text-left font-normal',
            !selected && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-70" aria-hidden />
          <span className="truncate">
            {selected ? format(selected, 'd MMM yyyy', { locale: dateLocale }) : resolvedPlaceholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(d) => {
            if (d) {
              onChange(format(d, 'yyyy-MM-dd'));
              setOpen(false);
            }
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
