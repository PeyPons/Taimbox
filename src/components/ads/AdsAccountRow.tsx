import type { MouseEvent, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type AdsPaceStatus = 'ok' | 'risk' | 'over' | 'under';

const AVATAR_TONES = [
  'bg-sky-100 text-sky-800',
  'bg-indigo-100 text-indigo-800',
  'bg-violet-100 text-violet-800',
  'bg-emerald-100 text-emerald-800',
  'bg-amber-100 text-amber-900',
  'bg-rose-100 text-rose-800',
];

function avatarTone(seed: string): string {
  let hash = 0;
  for (const char of seed) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

function initialsFrom(label: string): string {
  const parts = label.trim().split(/\s+/).filter((part) => part.length > 0);
  if (parts.length === 0) return '·';
  const first = parts[0].replace(/[^0-9A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '');
  const second = parts.length > 1 ? parts[1].replace(/[^0-9A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '') : '';
  if (second) return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase();
  return first.slice(0, 2).toUpperCase() || '·';
}

function barClass(status: AdsPaceStatus): string {
  if (status === 'over') return 'bg-red-500';
  if (status === 'risk') return 'bg-amber-500';
  if (status === 'under') return 'bg-slate-400';
  return 'bg-emerald-500';
}

function pillClass(status: AdsPaceStatus): string {
  if (status === 'over') return 'bg-red-50 text-red-700';
  if (status === 'risk') return 'bg-amber-50 text-amber-800';
  if (status === 'under') return 'bg-slate-100 text-slate-600';
  return 'bg-emerald-50 text-emerald-800';
}

interface AdsAccountRowProps {
  mark: string;
  seed: string;
  name: ReactNode;
  detail?: ReactNode;
  status?: AdsPaceStatus;
  statusLabel?: string;
  progress?: { percent: number; caption: string } | null;
  spentCaption: string;
  spent: string;
  budgetLine?: string;
  valueCaption?: string;
  value?: string;
  actions?: ReactNode;
}

export function AdsAccountRow({
  mark,
  seed,
  name,
  detail,
  status,
  statusLabel,
  progress,
  spentCaption,
  spent,
  budgetLine,
  valueCaption,
  value,
  actions,
}: AdsAccountRowProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3 pr-2 sm:flex-row sm:items-center sm:gap-6">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span
          className={cn(
            'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[13px] font-semibold',
            avatarTone(seed),
          )}
          aria-hidden
        >
          {initialsFrom(mark)}
        </span>
        <div className="min-w-0 flex-1 text-left">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <div className="min-w-0 truncate text-base font-semibold tracking-tight text-slate-950">{name}</div>
            {status && statusLabel && (
              <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', pillClass(status))}>
                {statusLabel}
              </span>
            )}
          </div>
          {detail && <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-left text-[13px] text-slate-500">{detail}</div>}
          {progress && (
            <div className="mt-2.5 max-w-md">
              <div className="mb-1 text-[12px] text-slate-500">{progress.caption}</div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn('h-full rounded-full', status ? barClass(status) : 'bg-slate-900')}
                  style={{ width: `${Math.min(Math.max(progress.percent, 0), 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 pl-[3.25rem] sm:justify-end sm:pl-0">
        {value && (
          <div className="hidden text-right md:block">
            <div className="text-[11px] text-slate-500">{valueCaption}</div>
            <div className="text-base font-medium tabular-nums text-slate-700">{value}</div>
          </div>
        )}
        <div className="text-left sm:min-w-[7.5rem] sm:text-right">
          <div className="text-[11px] text-slate-500">{spentCaption}</div>
          <div className="text-lg font-semibold tabular-nums tracking-tight text-slate-950">{spent}</div>
          {budgetLine && <div className="text-[12px] text-slate-500">{budgetLine}</div>}
        </div>
        {actions && (
          <div
            className="flex items-center gap-0.5 border-l border-slate-200 pl-2"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export function adsAccountCardClass(hidden: boolean, status?: AdsPaceStatus, hasBudget = false): string {
  return cn(
    'overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm',
    'data-[state=open]:border-slate-300 data-[state=open]:shadow-md',
    hasBudget && status === 'over' && 'border-l-4 border-l-red-500',
    hasBudget && status === 'risk' && 'border-l-4 border-l-amber-400',
    hasBudget && status === 'under' && 'border-l-4 border-l-slate-300',
    hasBudget && (status === 'ok' || !status) && 'border-l-4 border-l-emerald-400',
    !hasBudget && 'border-l-4 border-l-slate-200',
    hidden && 'opacity-60',
  );
}

export function AdsIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: (event: MouseEvent<HTMLElement>) => void;
  children: ReactNode;
}) {
  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={label}
      title={label}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick(event as unknown as MouseEvent<HTMLElement>);
        }
      }}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800"
    >
      {children}
    </span>
  );
}
