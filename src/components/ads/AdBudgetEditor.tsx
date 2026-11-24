import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

function localeTag(language: string): string {
  return language.toLowerCase().startsWith('en') ? 'en' : 'es';
}

function monthLabel(key: string, locale: string, style: 'short' | 'long'): string {
  const [yearText, monthText] = key.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const date = new Date(year, month - 1, 1);
  const name = new Intl.DateTimeFormat(locale, { month: style }).format(date).replace('.', '');
  const titled = name.charAt(0).toUpperCase() + name.slice(1);
  return style === 'long' ? `${titled} ${year}` : titled;
}

function quarterKeys(now = new Date()): [string, string] {
  const year = now.getFullYear();
  const startMonth = Math.floor(now.getMonth() / 3) * 3 + 1;
  const start = `${year}-${String(startMonth).padStart(2, '0')}`;
  return [start, addMonths(start, 2)];
}

function MonthRangeField({
  fromKey,
  toKey,
  onChange,
}: {
  fromKey: string;
  toKey: string;
  onChange: (from: string, to: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const locale = localeTag(i18n.language);
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(() => Number(fromKey.slice(0, 4)) || new Date().getFullYear());
  const [anchor, setAnchor] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const previewStart = anchor && hover ? (anchor < hover ? anchor : hover) : anchor;
  const previewEnd = anchor && hover ? (anchor < hover ? hover : anchor) : anchor;
  const todayKey = currentMonthKey();

  const apply = (start: string, end: string) => {
    const from = start <= end ? start : end;
    const to = start <= end ? end : start;
    onChange(from, to);
    setAnchor(null);
    setHover(null);
    setOpen(false);
  };

  const pick = (key: string) => {
    if (!anchor) {
      setAnchor(key);
      setHover(key);
      return;
    }
    apply(anchor, key);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setYear(Number(fromKey.slice(0, 4)) || new Date().getFullYear());
          setAnchor(null);
          setHover(null);
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 text-left text-sm text-slate-800 hover:border-slate-300"
        >
          <span className="truncate">
            {monthLabel(fromKey, locale, 'long')}
            <span className="px-1.5 text-slate-400">–</span>
            {monthLabel(toKey, locale, 'long')}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[17.5rem] p-3">
        <p className="mb-2 text-xs text-slate-500">
          {anchor
            ? t('ads.pacing.periodPickEnd', 'Ahora el mes de fin')
            : t('ads.pacing.periodPickStart', 'Pulsa el mes de inicio y después el de fin')}
        </p>
        <div className="mb-3 grid grid-cols-3 gap-1">
          <PresetButton
            label={t('ads.pacing.periodPresetThree', '3 meses')}
            onClick={() => {
              const start = currentMonthKey();
              apply(start, addMonths(start, 2));
            }}
          />
          <PresetButton
            label={t('ads.pacing.periodPresetQuarter', 'Trimestre')}
            onClick={() => {
              const [start, end] = quarterKeys();
              apply(start, end);
            }}
          />
          <PresetButton
            label={t('ads.pacing.periodPresetYear', 'Año')}
            onClick={() => {
              const y = new Date().getFullYear();
              apply(`${y}-01`, `${y}-12`);
            }}
          />
        </div>
        <div className="mb-2 flex items-center justify-between">
          <button type="button" className="rounded p-1 text-slate-500 hover:bg-slate-100" onClick={() => setYear((value) => value - 1)} aria-label={t('ads.pacing.periodPrevYear', 'Año anterior')}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-slate-800">{year}</span>
          <button type="button" className="rounded p-1 text-slate-500 hover:bg-slate-100" onClick={() => setYear((value) => value + 1)} aria-label={t('ads.pacing.periodNextYear', 'Año siguiente')}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 12 }, (_, index) => {
            const key = `${year}-${String(index + 1).padStart(2, '0')}`;
            const inRange = Boolean(previewStart && previewEnd && key >= previewStart && key <= previewEnd);
            const isEdge = key === previewStart || key === previewEnd;
            const isToday = key === todayKey;
            return (
              <button
                key={key}
                type="button"
                className={cn(
                  'h-9 rounded-md text-xs font-medium',
                  isEdge && 'bg-slate-900 text-white',
                  inRange && !isEdge && 'bg-slate-100 text-slate-900',
                  !inRange && 'text-slate-700 hover:bg-slate-50',
                  isToday && !isEdge && 'ring-1 ring-slate-300',
                )}
                onMouseEnter={() => anchor && setHover(key)}
                onClick={() => pick(key)}
              >
                {monthLabel(key, locale, 'short')}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function PresetButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="h-7 rounded-md border border-slate-200 bg-slate-50 px-1 text-[11px] font-medium text-slate-700 hover:bg-white"
      onClick={onClick}
    >
      {label}
    </button>
  );
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

  const setRange = (from: string, to: string) => {
    const start = monthKeyToRange(from);
    const end = monthKeyToRange(to);
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
        <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5">
          <button
            type="button"
            className={cn(
              'rounded px-2 py-1 text-[11px]',
              mode === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500',
            )}
            onClick={() => setMode('month')}
          >
            {t('ads.pacing.modeMonth', 'Este mes')}
          </button>
          <button
            type="button"
            className={cn(
              'rounded px-2 py-1 text-[11px]',
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
        <MonthRangeField fromKey={fromKey} toKey={toKey} onChange={setRange} />
      )}
    </div>
  );
}
