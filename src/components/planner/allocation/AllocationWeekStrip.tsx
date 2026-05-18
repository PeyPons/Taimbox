import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LoadStatus } from '@/types';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface WeekInfo {
  weekStart: Date;
  effectiveStart?: Date;
  effectiveEnd?: Date;
}

export interface WeekStripItemSummary {
  planHours: number;
  loadHours: number;
  capacity: number;
  status: LoadStatus;
  weekReal: number;
  weekComp: number;
  showComp: boolean;
}

interface AllocationWeekStripProps {
  weeks: WeekInfo[];
  weekSummaries: WeekStripItemSummary[];
  activeWeekIndex: number;
  currentWeekIndex: number | null;
  onSelectWeek: (index: number) => void;
  isMobile?: boolean;
}

function planValueTone(status: LoadStatus, isActive: boolean) {
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

function MetricLine({
  label,
  children,
  isActive,
  valueClassName,
}: {
  label: string;
  children: ReactNode;
  isActive: boolean;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-baseline gap-1 w-full text-[10px] sm:text-[11px] leading-tight tabular-nums h-[14px]">
      <span className={cn('shrink-0 w-[2.1rem]', isActive ? 'text-primary-foreground/70' : 'text-slate-500')}>
        {label}:
      </span>
      <span className={cn('font-bold truncate min-w-0', valueClassName)}>{children}</span>
    </div>
  );
}

export function AllocationWeekStrip({
  weeks,
  weekSummaries,
  activeWeekIndex,
  currentWeekIndex,
  onSelectWeek,
  isMobile,
}: AllocationWeekStripProps) {
  if (weeks.length === 0) return null;

  const colCount = weeks.length;

  return (
    <div
      className="grid gap-1.5 w-full min-w-0 py-0.5"
      style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
      role="tablist"
      aria-label="Semanas del mes"
      data-tour="planner-week-nav"
    >
      {weeks.map((week, idx) => {
        const start = week.effectiveStart || week.weekStart;
        const end = week.effectiveEnd || addDays(week.weekStart, 6);
        const isActive = idx === activeWeekIndex;
        const isCurrent = idx === currentWeekIndex;
        const dateLabel = `${format(start, 'd', { locale: es })}–${format(end, 'd MMM', { locale: es })}`;
        const summary = weekSummaries[idx] ?? {
          planHours: 0,
          loadHours: 0,
          capacity: 0,
          status: 'empty' as LoadStatus,
          weekReal: 0,
          weekComp: 0,
          showComp: false,
        };
        const isZeroCapacityOverload = summary.loadHours > 0 && summary.capacity === 0;
        const displayStatus = isZeroCapacityOverload ? 'overload' : summary.status;
        const showReal = summary.weekReal > 0;
        const showCompValue = summary.showComp && summary.weekComp > 0;

        return (
          <Button
            key={week.weekStart.toISOString()}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            role="tab"
            aria-selected={isActive}
            aria-label={`Semana ${idx + 1}, ${dateLabel}, Plan ${summary.planHours} de ${summary.capacity} horas${showReal ? `, Real ${summary.weekReal}` : ''}${showCompValue ? `, Comp ${summary.weekComp}` : ''}`}
            className={cn(
              'h-[4.75rem] sm:h-[5rem] flex-col items-stretch gap-1 px-2 py-1.5 rounded-lg w-full min-w-0',
              isMobile && 'min-h-[4.75rem]',
              !isActive && 'bg-white/80 text-slate-600 border-slate-200 hover:bg-white',
              !isActive && displayStatus === 'overload' && 'border-red-200 bg-red-50/60 hover:bg-red-50',
              !isActive && displayStatus === 'warning' && 'border-amber-200 bg-amber-50/50 hover:bg-amber-50',
              !isActive && displayStatus === 'healthy' && 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70',
              isActive && 'shadow-sm',
              isCurrent && !isActive && 'ring-1 ring-indigo-300/60'
            )}
            onClick={() => onSelectWeek(idx)}
          >
            <div className="flex items-baseline justify-between w-full gap-1 min-w-0 pb-1 border-b border-current/10 shrink-0">
              <span className="text-[11px] sm:text-xs font-semibold leading-none shrink-0">S{idx + 1}</span>
              <span
                className={cn(
                  'text-[9px] sm:text-[10px] leading-none tabular-nums truncate text-right min-w-0',
                  isActive ? 'text-primary-foreground/75' : 'text-slate-400'
                )}
              >
                {dateLabel}
              </span>
            </div>

            <div className="flex flex-col gap-0.5 w-full min-w-0 flex-1 justify-center">
              <MetricLine label="Plan" isActive={isActive}>
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
          </Button>
        );
      })}
    </div>
  );
}
