import { Gauge } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SuggestionPercentField } from '@/components/deadlines/suggestions/SuggestionPercentField';

/** Límites de carga siempre visibles en el paso Reglas (no colapsados). */
export function SuggestionLoadLimitsCard({
  minSenderLoadPct,
  minSenderLoadPctInput,
  setMinSenderLoadPct,
  setMinSenderLoadPctInput,
  maxReceiverLoadPct,
  maxReceiverLoadPctInput,
  setMaxReceiverLoadPct,
  setMaxReceiverLoadPctInput,
}: {
  minSenderLoadPct: number;
  minSenderLoadPctInput: string;
  setMinSenderLoadPct: (n: number) => void;
  setMinSenderLoadPctInput: (s: string) => void;
  maxReceiverLoadPct: number;
  maxReceiverLoadPctInput: string;
  setMaxReceiverLoadPct: (n: number) => void;
  setMaxReceiverLoadPctInput: (s: string) => void;
}) {
  const { t } = useTranslation('app');

  return (
    <section
      className="rounded-xl border border-primary/20 bg-gradient-to-b from-primary/[0.06] to-white p-4 space-y-3 shadow-sm"
      aria-labelledby="load-limits-heading"
    >
      <div className="flex items-start gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Gauge className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h3 id="load-limits-heading" className="text-sm font-semibold text-slate-900">
            {t('deadlines.suggestions.loadLimitsTitle', 'Límites de carga')}
          </h3>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
            {t('deadlines.suggestions.loadLimitsDescription', 'Define quién puede ceder horas y el máximo % que puede tener quien recibe. Pulsa Enter o sal del campo para aplicar (p. ej. escribe 80 completo).')}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        <SuggestionPercentField
          id="min-sender-load-pct"
          label={t('deadlines.suggestions.minSenderLabel', 'Mínimo para poder ceder (%)')}
          value={minSenderLoadPct}
          inputValue={minSenderLoadPctInput}
          onInputChange={setMinSenderLoadPctInput}
          onCommit={setMinSenderLoadPct}
          min={0}
          max={100}
        />
        <SuggestionPercentField
          id="max-receiver-load-pct"
          label={t('deadlines.suggestions.maxReceiverLabel', 'Máximo quien recibe (%)')}
          value={maxReceiverLoadPct}
          inputValue={maxReceiverLoadPctInput}
          onInputChange={setMaxReceiverLoadPctInput}
          onCommit={setMaxReceiverLoadPct}
          min={1}
          max={100}
        />
      </div>
    </section>
  );
}
