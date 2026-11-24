import type { MouseEvent, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type AdsPaceStatus = 'ok' | 'risk' | 'over' | 'under';

function barClass(status: AdsPaceStatus): string {
  if (status === 'over') return 'bg-red-500';
  if (status === 'risk') return 'bg-amber-500';
  return 'bg-slate-900';
}

function dotClass(status: AdsPaceStatus): string {
  if (status === 'over') return 'bg-red-500';
  if (status === 'risk') return 'bg-amber-500';
  if (status === 'under') return 'bg-slate-300';
  return 'bg-emerald-500';
}

interface AdsAccountRowProps {
  name: ReactNode;
  detail?: ReactNode;
  status?: AdsPaceStatus;
  progress?: { percent: number; caption: string } | null;
  spentCaption: string;
  spent: string;
  valueCaption?: string;
  value?: string;
  actions?: ReactNode;
}

export function AdsAccountRow({
  name,
  detail,
  status,
  progress,
  spentCaption,
  spent,
  valueCaption,
  value,
  actions,
}: AdsAccountRowProps) {
  return (
    <div className="grid min-w-0 flex-1 grid-cols-1 items-center gap-3 pr-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(10rem,0.9fr)_auto] sm:gap-8">
      <div className="min-w-0 text-left">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', status ? dotClass(status) : 'bg-slate-300')} />
          <div className="min-w-0 truncate text-[15px] font-medium tracking-tight text-slate-900">{name}</div>
        </div>
        {detail && <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 pl-3.5 text-left">{detail}</div>}
      </div>

      <div className="hidden min-w-0 sm:block">
        {progress ? (
          <div>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[11px] text-slate-500">
              <span className="tabular-nums">{Math.round(progress.percent)}%</span>
              <span className="truncate">{progress.caption}</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-slate-200/80">
              <div
                className={cn('h-full rounded-full', status ? barClass(status) : 'bg-slate-900')}
                style={{ width: `${Math.min(Math.max(progress.percent, 0), 100)}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-5 sm:justify-end">
        {value && (
          <div className="hidden text-right md:block">
            <div className="text-[11px] text-slate-500">{valueCaption}</div>
            <div className="text-[15px] font-medium tabular-nums text-slate-700">{value}</div>
          </div>
        )}
        <div className="text-left sm:text-right">
          <div className="text-[11px] text-slate-500">{spentCaption}</div>
          <div className="text-[15px] font-semibold tabular-nums tracking-tight text-slate-900">{spent}</div>
        </div>
        {actions && (
          <div className="flex items-center" onClick={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()}>
            {actions}
          </div>
        )}
      </div>
    </div>
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
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800"
    >
      {children}
    </span>
  );
}
