import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LoadStatus } from '@/types';

export interface WeekStripItemSummary {
  planHours: number;
  loadHours: number;
  capacity: number;
  status: LoadStatus;
  weekReal: number;
  weekComp: number;
  showComp: boolean;
}

export function planValueTone(status: LoadStatus, isActive: boolean) {
  if (isActive) return 'text-primary-foreground';
  switch (status) {
    case 'overload':
      return 'text-red-700';
    case 'warning':
      return 'text-amber-700';
    case 'healthy':
      return 'text-emerald-700';
    default:
      return 'text-slate-700';
  }
}

export function resolveDisplayStatus(summary: WeekStripItemSummary) {
  const isZeroCapacityOverload = summary.loadHours > 0 && summary.capacity === 0;
  return isZeroCapacityOverload ? 'overload' : summary.status;
}

export function loadPercentageTone(displayStatus: LoadStatus) {
  switch (displayStatus) {
    case 'overload':
      return { text: 'text-red-600', bar: 'bg-red-500' };
    case 'warning':
      return { text: 'text-amber-700', bar: 'bg-amber-400' };
    case 'healthy':
      return { text: 'text-emerald-700', bar: 'bg-emerald-500' };
    default:
      return { text: 'text-slate-500', bar: 'bg-slate-300' };
  }
}

export function MetricLine({
  label,
  children,
  isActive,
  valueClassName,
  size = 'sm',
}: {
  label: string;
  children: ReactNode;
  isActive: boolean;
  valueClassName?: string;
  size?: 'sm' | 'xs';
}) {
  return (
    <div
      className={cn(
        'flex items-baseline gap-1 w-full leading-none tabular-nums shrink-0',
        size === 'xs' ? 'text-[11px] min-h-[14px]' : 'text-[11px] sm:text-[12px] min-h-[15px]'
      )}
    >
      <span
        className={cn(
          'shrink-0',
          size === 'xs' ? 'w-[2rem]' : 'w-[2.1rem]',
          isActive ? 'text-primary-foreground/70' : 'text-slate-500'
        )}
      >
        {label}:
      </span>
      <span className={cn('font-bold truncate min-w-0', valueClassName)}>{children}</span>
    </div>
  );
}

export function AllocationWeekMetricsDisplay({
  summary,
  isActive = false,
  size = 'sm',
  className,
}: {
  summary: WeekStripItemSummary;
  isActive?: boolean;
  size?: 'sm' | 'xs';
  className?: string;
}) {
  const displayStatus = resolveDisplayStatus(summary);
  const showReal = summary.weekReal > 0;
  const showCompValue = summary.showComp && summary.weekComp > 0;

  return (
    <div className={cn('flex flex-col gap-0.5 w-full min-w-0', className)}>
      <MetricLine label="Plan" isActive={isActive} size={size}>
        <span className={planValueTone(displayStatus, isActive)}>{summary.planHours}h</span>
        <span className={cn(isActive ? 'text-primary-foreground/60 font-normal' : 'text-slate-400 font-normal')}>
          /
        </span>
        <span className={cn(isActive ? 'text-primary-foreground/85 font-semibold' : 'text-slate-500 font-semibold')}>
          {summary.capacity}h
        </span>
      </MetricLine>

      <MetricLine
        label="Real"
        isActive={isActive}
        size={size}
        valueClassName={
          showReal
            ? isActive
              ? 'text-primary-foreground/90'
              : 'text-blue-700'
            : isActive
              ? 'text-primary-foreground/40 font-normal'
              : 'text-slate-300 font-normal'
        }
      >
        {showReal ? `${summary.weekReal}h` : '—'}
      </MetricLine>

      {summary.showComp && (
        <MetricLine
          label="Comp"
          isActive={isActive}
          size={size}
          valueClassName={
            showCompValue
              ? isActive
                ? 'text-primary-foreground/90'
                : 'text-emerald-700'
              : isActive
                ? 'text-primary-foreground/40 font-normal'
                : 'text-slate-300 font-normal'
          }
        >
          {showCompValue ? `${summary.weekComp}h` : '—'}
        </MetricLine>
      )}
    </div>
  );
}

export function weekCellSurfaceClass(displayStatus: LoadStatus, isCurrentWeek?: boolean) {
  if (isCurrentWeek) return 'border-indigo-300 bg-indigo-50/30 ring-1 ring-indigo-200/80';
  switch (displayStatus) {
    case 'overload':
      return 'border-red-200 bg-red-50/60';
    case 'warning':
      return 'border-amber-200 bg-amber-50/40';
    case 'healthy':
      return 'border-emerald-200 bg-emerald-50/35';
    default:
      return 'border-slate-200 bg-slate-50/40';
  }
}

export function weekCardSurfaceClass(displayStatus: LoadStatus, isActive?: boolean) {
  if (isActive) return 'border-indigo-400 bg-indigo-50/40 ring-1 ring-indigo-200';
  switch (displayStatus) {
    case 'overload':
      return 'border-red-200 bg-red-50/50';
    case 'warning':
      return 'border-amber-200 bg-amber-50/40';
    case 'healthy':
      return 'border-emerald-200 bg-emerald-50/30';
    default:
      return 'border-slate-200 bg-white';
  }
}
