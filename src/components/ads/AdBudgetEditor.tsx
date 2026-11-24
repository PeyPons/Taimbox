import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { addMonths, monthKeyToRange, type BudgetMode } from '@/utils/adBudgetWindow';

export interface AdBudgetDraft {
  amount: number;
  mode: BudgetMode;
  periodStart: string | null;
  periodEnd: string | null;
}

interface AdBudgetEditorProps {
  amount: number;
  mode: BudgetMode;
  periodStart: string | null;
  periodEnd: string | null;
  currencySymbol: string;
  onCommit: (next: AdBudgetDraft) => void;
}

function monthKey(value: string | null): string {
  return value ? value.slice(0, 7) : '';
}

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function AdBudgetEditor({
  amount,
  mode,
  periodStart,
  periodEnd,
  currencySymbol,
  onCommit,
}: AdBudgetEditorProps) {
  const { t } = useTranslation();
  const [draftAmount, setDraftAmount] = useState(amount > 0 ? String(amount) : '');
  const fromKey = monthKey(periodStart) || currentMonthKey();
  const toKey = monthKey(periodEnd) || addMonths(fromKey, 2);

  const commit = (next: AdBudgetDraft) => {
    if (next.mode === 'period' && (!next.periodStart || !next.periodEnd || next.periodStart > next.periodEnd)) return;
    onCommit(next);
  };

  const parsedAmount = () => {
    const value = parseFloat(draftAmount);
    return Number.isFinite(value) ? value : 0;
  };

  const setMode = (nextMode: BudgetMode) => {
    if (nextMode === mode && nextMode === 'month') return;
    if (nextMode === 'month') {
      commit({ amount: parsedAmount(), mode: 'month', periodStart: null, periodEnd: null });
      return;
    }
    const start = monthKeyToRange(fromKey);
    const end = monthKeyToRange(toKey);
    commit({
      amount: parsedAmount(),
      mode: 'period',
      periodStart: start?.start ?? null,
      periodEnd: end?.end ?? null,
    });
  };

  const setMonth = (which: 'from' | 'to', value: string) => {
    const startKey = which === 'from' ? value : fromKey;
    const endKey = which === 'to' ? value : toKey;
    const start = monthKeyToRange(startKey);
    const end = monthKeyToRange(endKey);
    commit({
      amount: parsedAmount(),
      mode: 'period',
      periodStart: start?.start ?? null,
      periodEnd: end?.end ?? null,
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-md border border-slate-200 p-0.5 bg-slate-50">
          <button
            type="button"
            className={cn(
              'px-2 py-1 text-[11px] rounded',
              mode === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500',
            )}
            onClick={() => setMode('month')}
          >
            {t('ads.pacing.modeMonth', 'Este mes')}
          </button>
          <button
            type="button"
            className={cn(
              'px-2 py-1 text-[11px] rounded',
              mode === 'period' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500',
            )}
            onClick={() => setMode('period')}
          >
            {t('ads.pacing.modePeriod', 'Varios meses')}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">{currencySymbol}</span>
          <Input
            type="number"
            value={draftAmount}
            onChange={(e) => setDraftAmount(e.target.value)}
            onBlur={() => commit({
              amount: parsedAmount(),
              mode,
              periodStart: mode === 'period' ? (monthKeyToRange(fromKey)?.start ?? null) : null,
              periodEnd: mode === 'period' ? (monthKeyToRange(toKey)?.end ?? null) : null,
            })}
            className="h-8 w-28 text-right"
            placeholder={t('ads.pacing.noTarget', 'Sin objetivo')}
          />
        </div>
      </div>
      {mode === 'period' && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <label className="flex items-center gap-1">
            {t('ads.pacing.periodFrom', 'Desde')}
            <Input
              type="month"
              value={fromKey}
              onChange={(e) => setMonth('from', e.target.value)}
              className="h-8 w-[9.5rem]"
            />
          </label>
          <label className="flex items-center gap-1">
            {t('ads.pacing.periodTo', 'Hasta')}
            <Input
              type="month"
              value={toKey}
              onChange={(e) => setMonth('to', e.target.value)}
              className="h-8 w-[9.5rem]"
            />
          </label>
        </div>
      )}
    </div>
  );
}
