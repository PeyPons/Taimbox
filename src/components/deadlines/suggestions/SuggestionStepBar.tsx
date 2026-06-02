import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export function SuggestionStepBar({
  step,
  labels,
}: {
  step: number;
  labels?: readonly string[];
}) {
  const { t } = useTranslation('app');
  const defaultLabels = [
    t('deadlines.suggestions.stepPerson', 'Persona'),
    t('deadlines.suggestions.stepOrigin', 'Origen'),
    t('deadlines.suggestions.stepReview', 'Revisar'),
  ] as const;
  const resolvedLabels = labels ?? defaultLabels;

  return (
    <div
      className="flex items-center gap-1 mb-4"
      aria-label={t('deadlines.suggestions.stepBarAria', 'Paso {{step}} de {{total}}', {
        step,
        total: resolvedLabels.length,
      })}
    >
      {resolvedLabels.map((label, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <div key={label} className="flex items-center gap-1 flex-1 min-w-0">
            <div
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                active && 'bg-primary text-primary-foreground',
                done && 'bg-primary/20 text-primary',
                !active && !done && 'bg-slate-100 text-slate-400'
              )}
            >
              {n}
            </div>
            <span
              className={cn(
                'text-[11px] truncate hidden sm:inline',
                active ? 'font-semibold text-slate-800' : 'text-slate-500'
              )}
            >
              {label}
            </span>
            {i < resolvedLabels.length - 1 && <div className="h-px flex-1 bg-slate-200 min-w-2" />}
          </div>
        );
      })}
    </div>
  );
}
