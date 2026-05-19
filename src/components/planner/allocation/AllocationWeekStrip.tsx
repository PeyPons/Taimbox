import { Button } from '@/components/ui/button';
import {
  AllocationWeekMetricsDisplay,
  resolveDisplayStatus,
  WeekStripItemSummary,
} from '@/components/planner/allocation/allocationWeekMetrics';
import { cn } from '@/lib/utils';
import { LoadStatus } from '@/types';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface WeekInfo {
  weekStart: Date;
  effectiveStart?: Date;
  effectiveEnd?: Date;
}

export type { WeekStripItemSummary };

interface AllocationWeekStripProps {
  weeks: WeekInfo[];
  weekSummaries: WeekStripItemSummary[];
  activeWeekIndex: number;
  currentWeekIndex: number | null;
  onSelectWeek: (index: number) => void;
  isMobile?: boolean;
  /** En vista mes: resalta semana al pasar el ratón, sin estado activo fijo */
  overviewMode?: boolean;
  /** full = métricas; compact = solo S + fechas; hidden = no renderizar */
  variant?: 'full' | 'compact' | 'hidden';
}

export function AllocationWeekStrip({
  weeks,
  weekSummaries,
  activeWeekIndex,
  currentWeekIndex,
  onSelectWeek,
  isMobile,
  overviewMode,
  variant = 'full',
}: AllocationWeekStripProps) {
  if (weeks.length === 0 || variant === 'hidden') return null;

  const isCompact = variant === 'compact';
  const colCount = weeks.length;

  return (
    <div
      className="grid gap-1.5 w-full min-w-0 py-0.5"
      style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
      role="tablist"
      aria-label={overviewMode ? 'Resumen semanal del mes' : 'Semanas del mes'}
      data-tour="planner-week-nav"
    >
      {weeks.map((week, idx) => {
        const start = week.effectiveStart || week.weekStart;
        const end = week.effectiveEnd || addDays(week.weekStart, 6);
        const isActive = !overviewMode && idx === activeWeekIndex;
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
        const displayStatus = resolveDisplayStatus(summary);

        return (
          <Button
            key={week.weekStart.toISOString()}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            role="tab"
            aria-selected={isActive}
            title={overviewMode ? `Desplazar a la semana ${idx + 1}` : undefined}
            className={cn(
              isCompact
                ? 'h-9 sm:h-10 flex-row items-center justify-between gap-2 px-2.5 py-1 rounded-lg w-full min-w-0'
                : 'h-[4.75rem] sm:h-[5rem] flex-col items-stretch gap-1 px-2 py-1.5 rounded-lg w-full min-w-0',
              isMobile && !isCompact && 'min-h-[4.75rem]',
              !isActive && 'bg-white/80 text-slate-600 border-slate-200 hover:bg-white',
              !isActive && !isCompact && displayStatus === 'overload' && 'border-red-200 bg-red-50/60 hover:bg-red-50',
              !isActive && !isCompact && displayStatus === 'warning' && 'border-amber-200 bg-amber-50/50 hover:bg-amber-50',
              !isActive && !isCompact && displayStatus === 'healthy' && 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70',
              isActive && 'shadow-sm',
              isCurrent && !isActive && 'ring-1 ring-indigo-300/60',
              overviewMode && 'cursor-pointer hover:border-indigo-300 hover:shadow-sm',
              isCompact && !isActive && displayStatus === 'overload' && 'border-red-300',
              isCompact && !isActive && displayStatus === 'warning' && 'border-amber-300',
              isCompact && !isActive && displayStatus === 'healthy' && 'border-emerald-300'
            )}
            onClick={() => onSelectWeek(idx)}
          >
            <div
              className={cn(
                'flex items-baseline justify-between w-full gap-1 min-w-0',
                !isCompact && 'pb-1 border-b border-current/10 shrink-0'
              )}
            >
              <span className={cn('font-semibold leading-none shrink-0', isCompact ? 'text-xs' : 'text-[11px] sm:text-xs')}>
                S{idx + 1}
              </span>
              <span
                className={cn(
                  'leading-none tabular-nums truncate text-right min-w-0',
                  isCompact ? 'text-[10px] sm:text-xs' : 'text-[9px] sm:text-[10px]',
                  isActive ? (isCompact ? 'text-primary-foreground/90' : 'text-primary-foreground/75') : 'text-slate-400'
                )}
              >
                {dateLabel}
              </span>
            </div>
            {!isCompact && (
              <AllocationWeekMetricsDisplay summary={summary} isActive={isActive} className="flex-1 justify-center" />
            )}
          </Button>
        );
      })}
    </div>
  );
}
