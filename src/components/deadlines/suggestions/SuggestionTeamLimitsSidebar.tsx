import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SuggestionPercentField } from '@/components/deadlines/suggestions/SuggestionPercentField';
import { cn } from '@/lib/utils';

export type SuggestionTeamLimitsSidebarProps = {
  minSenderLoadPct: number;
  minSenderLoadPctInput: string;
  setMinSenderLoadPct: (n: number) => void;
  setMinSenderLoadPctInput: (s: string) => void;
  maxReceiverLoadPct: number;
  maxReceiverLoadPctInput: string;
  setMaxReceiverLoadPct: (n: number) => void;
  setMaxReceiverLoadPctInput: (s: string) => void;
  minSuggestedTransferHours: number;
  minSuggestedTransferHoursInput: string;
  setMinSuggestedTransferHoursInput: (s: string) => void;
  setMinSuggestedTransferHours: (n: number) => void;
  onResetFilters?: () => void;
  condicionantesBlock: ReactNode;
  variant?: 'sidebar' | 'embedded';
};

function TeamLimitsFields({
  idPrefix,
  ...props
}: SuggestionTeamLimitsSidebarProps & { idPrefix: string }) {
  const {
    minSenderLoadPct,
    minSenderLoadPctInput,
    setMinSenderLoadPct,
    setMinSenderLoadPctInput,
    maxReceiverLoadPct,
    maxReceiverLoadPctInput,
    setMaxReceiverLoadPct,
    setMaxReceiverLoadPctInput,
    minSuggestedTransferHours,
    minSuggestedTransferHoursInput,
    setMinSuggestedTransferHoursInput,
    setMinSuggestedTransferHours,
    condicionantesBlock,
  } = props;

  const { t } = useTranslation('app');

  return (
    <div className="space-y-2.5">
      <div className="space-y-2">
        <SuggestionPercentField
          id={`${idPrefix}-min-sender-load-pct`}
          label={t('deadlines.suggestions.minSenderCompact')}
          value={minSenderLoadPct}
          inputValue={minSenderLoadPctInput}
          onInputChange={setMinSenderLoadPctInput}
          onCommit={setMinSenderLoadPct}
          min={0}
          max={100}
          size="compact"
        />
        <SuggestionPercentField
          id={`${idPrefix}-max-receiver-load-pct`}
          label={t('deadlines.suggestions.maxReceiverCompact')}
          value={maxReceiverLoadPct}
          inputValue={maxReceiverLoadPctInput}
          onInputChange={setMaxReceiverLoadPctInput}
          onCommit={setMaxReceiverLoadPct}
          min={1}
          max={100}
          size="compact"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-min-transfer-h`} className="text-[11px] font-medium text-slate-600">
          {t('deadlines.suggestions.minTransferHoursLabel')}
        </Label>
        <Input
          id={`${idPrefix}-min-transfer-h`}
          type="number"
          min={0.5}
          max={8}
          step={0.5}
          value={minSuggestedTransferHoursInput}
          onChange={(e) => setMinSuggestedTransferHoursInput(e.target.value)}
          onBlur={() => {
            const parsed = parseFloat(minSuggestedTransferHoursInput.replace(',', '.'));
            if (Number.isFinite(parsed)) setMinSuggestedTransferHours(parsed);
            else setMinSuggestedTransferHoursInput(String(minSuggestedTransferHours));
          }}
          className="h-8 text-xs font-mono text-center"
        />
      </div>
      <div className="pt-1.5 border-t border-slate-200">{condicionantesBlock}</div>
    </div>
  );
}

/** Panel lateral compacto de límites (modo equipo a pantalla completa). */
export function SuggestionTeamLimitsSidebar({
  variant = 'sidebar',
  onResetFilters,
  ...props
}: SuggestionTeamLimitsSidebarProps) {
  const { t } = useTranslation('app');
  const fields = <TeamLimitsFields {...props} idPrefix={variant === 'embedded' ? 'team-m' : 'team'} />;

  if (variant === 'embedded') {
    return <div className="px-1 py-1">{fields}</div>;
  }

  return (
    <aside className="flex flex-col h-full min-h-0 w-full md:w-[min(240px,20vw)] shrink-0 bg-slate-50 border-r border-slate-200">
      <div className="shrink-0 px-2.5 py-2 border-b border-slate-200 bg-white flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{t('deadlines.suggestions.limitsTitle')}</p>
        {onResetFilters && (
          <Button type="button" variant="ghost" size="sm" className="h-6 text-[10px] px-1.5" onClick={onResetFilters}>
            {t('deadlines.suggestions.restore')}
          </Button>
        )}
      </div>
      <div className={cn('flex-1 min-h-0 overflow-y-auto px-2.5 py-2')}>{fields}</div>
    </aside>
  );
}
