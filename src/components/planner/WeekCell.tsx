import { Allocation, LoadStatus } from '@/types';
import { cn } from '@/lib/utils';
import {
  resolveDisplayStatus,
  weekCellSurfaceClass,
  type WeekStripItemSummary,
} from '@/components/planner/allocation/allocationWeekMetrics';
import { useAgency } from '@/contexts/AgencyContext';
import {
  AlertCircle,
  AlertTriangle,
  CalendarOff,
  CheckCircle2,
  Clock,
  Palmtree,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface WeekCellProps {
  allocations: Allocation[];
  hours: number;
  capacity: number;
  status: LoadStatus;
  percentage: number;
  isCurrentWeek: boolean;
  baseCapacity: number;
  breakdown: { reason: string; hours: number; type: 'absence' | 'event' }[];
  onClick: () => void;
  touchTarget?: boolean;
  /** compact: planificador de equipo; detailed: Mi espacio (por defecto) */
  variant?: 'compact' | 'detailed';
}

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

function WeekCellTooltipBody({
  summary,
  totalEst,
  totalReal,
  totalComp,
  balance,
  completedCount,
  totalTasks,
  breakdown,
  isZeroCapacityOverload,
}: {
  summary: WeekStripItemSummary;
  totalEst: number;
  totalReal: number;
  totalComp: number;
  balance: number;
  completedCount: number;
  totalTasks: number;
  breakdown: { reason: string; hours: number; type: 'absence' | 'event' }[];
  isZeroCapacityOverload: boolean;
}) {
  return (
    <div className="space-y-1.5 text-xs tabular-nums">
      <div className="font-semibold">
        Plan {summary.planHours}h / {summary.capacity}h
      </div>
      <div className="text-slate-600">
        Est. {totalEst}h · Real {totalReal > 0 ? `${totalReal}h` : '—'}
        {summary.showComp && ` · Comp ${totalComp > 0 ? `${totalComp}h` : '—'}`}
      </div>
      {totalTasks > 0 && (
        <div className="text-slate-500">
          {completedCount}/{totalTasks} tareas completadas
        </div>
      )}
      {Math.abs(balance) > 0.01 && (
        <div className={balance >= 0 ? 'text-emerald-700' : 'text-red-700'}>
          Balance: {balance > 0 ? '+' : ''}{balance}h
        </div>
      )}
      {breakdown.map((item, idx) => (
        <div key={idx} className="text-orange-700">
          {item.reason}: -{item.hours}h
        </div>
      ))}
      {isZeroCapacityOverload && (
        <div className="text-red-700 font-medium">Tareas en semana sin capacidad</div>
      )}
    </div>
  );
}

function WeekCellCompact({
  allocations,
  hours,
  capacity,
  status,
  percentage,
  isCurrentWeek,
  breakdown,
  onClick,
  touchTarget,
}: Omit<WeekCellProps, 'variant' | 'baseCapacity'>) {
  const { currentAgency } = useAgency();
  const showComp = currentAgency?.settings?.hoursTrackingPreference !== 'actual';

  const totalEst = round2(allocations.reduce((sum, a) => sum + (a.hoursAssigned || 0), 0));
  const completedTasks = allocations.filter((a) => a.status === 'completed');
  const totalReal = round2(allocations.reduce((sum, a) => sum + (a.hoursActual || 0), 0));
  const totalComp = round2(allocations.reduce((sum, a) => sum + (a.hoursComputed || 0), 0));
  const balance = round2(totalComp - totalReal);

  const hasActivity = allocations.length > 0;
  const hasReductions = breakdown.length > 0;
  const isZeroCapacityOverload = hours > 0 && capacity === 0;

  const summary: WeekStripItemSummary = {
    planHours: hours,
    loadHours: hours,
    capacity,
    status,
    weekReal: totalReal,
    weekComp: totalComp,
    showComp,
  };
  const displayStatus = resolveDisplayStatus(summary);
  const pct = Math.round(percentage);

  const pctTone =
    pct > 110 ? 'text-red-600' : pct < 90 ? 'text-amber-700' : 'text-emerald-700';
  const barTone =
    pct > 110 ? 'bg-red-500' : pct < 90 ? 'bg-amber-400' : 'bg-emerald-500';

  const reductionHours = round2(breakdown.reduce((s, b) => s + b.hours, 0));

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onClick}
            className={cn(
              'h-full w-full min-w-0 p-2 transition-all cursor-pointer border rounded-lg flex flex-col gap-1.5 tabular-nums touch-manipulation text-left',
              touchTarget ? 'min-h-[44px] min-w-[44px]' : 'min-h-[88px]',
              weekCellSurfaceClass(displayStatus, isCurrentWeek),
              'hover:shadow-sm hover:brightness-[0.98]',
              !hasActivity && !hasReductions && 'opacity-55 hover:opacity-100',
              isCurrentWeek && 'shadow-sm',
              'overflow-hidden'
            )}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="flex-1 h-1.5 bg-white/70 rounded-full overflow-hidden min-w-0">
                <div
                  className={cn('h-full rounded-full transition-all', barTone)}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <span className={cn('text-[10px] font-bold shrink-0 w-8 text-right', pctTone)}>
                {pct}%
              </span>
            </div>

            <div className="min-w-0">
              <div
                className={cn(
                  'text-[11px] font-bold font-mono leading-none truncate',
                  displayStatus === 'overload'
                    ? 'text-red-700'
                    : displayStatus === 'warning'
                      ? 'text-amber-700'
                      : displayStatus === 'healthy'
                        ? 'text-emerald-700'
                        : 'text-slate-500'
                )}
              >
                {hours}/{capacity}h
              </div>
              {hasActivity ? (
                <div className="text-[9px] text-slate-500 mt-0.5 truncate flex items-center gap-0.5">
                  {completedTasks.length === allocations.length && (
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" aria-hidden />
                  )}
                  <span className="truncate">
                    {completedTasks.length}/{allocations.length} tareas
                  </span>
                </div>
              ) : hasReductions ? (
                <div className="text-[9px] text-slate-400 mt-0.5">Libre</div>
              ) : (
                <div className="text-[9px] text-slate-300 mt-0.5 uppercase tracking-wide">Libre</div>
              )}
            </div>

            {(hasReductions || isZeroCapacityOverload) && (
              <div className="flex items-center gap-1 mt-auto min-w-0">
                {hasReductions && breakdown.some((b) => b.type === 'absence') && (
                  <Palmtree className="w-3 h-3 text-orange-600 shrink-0" aria-hidden />
                )}
                {hasReductions && breakdown.some((b) => b.type === 'event') && (
                  <Zap className="w-3 h-3 text-blue-600 shrink-0" aria-hidden />
                )}
                {hasReductions && (
                  <span className="text-[9px] text-orange-700 truncate font-medium">
                    -{reductionHours}h cap.
                  </span>
                )}
                {isZeroCapacityOverload && (
                  <AlertCircle className="w-3 h-3 text-red-600 shrink-0 ml-auto" aria-hidden />
                )}
              </div>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[240px]">
          <WeekCellTooltipBody
            summary={summary}
            totalEst={totalEst}
            totalReal={totalReal}
            totalComp={totalComp}
            balance={balance}
            completedCount={completedTasks.length}
            totalTasks={allocations.length}
            breakdown={breakdown}
            isZeroCapacityOverload={isZeroCapacityOverload}
          />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function WeekCellDetailed({
  allocations,
  hours,
  capacity,
  status,
  isCurrentWeek,
  breakdown,
  onClick,
  touchTarget,
}: Omit<WeekCellProps, 'variant' | 'percentage' | 'baseCapacity'>) {
  const totalEst = round2(allocations.reduce((sum, a) => sum + (a.hoursAssigned || 0), 0));
  const completedTasks = allocations.filter((a) => a.status === 'completed');
  const pendingTasks = allocations.filter((a) => a.status !== 'completed');
  const totalReal = round2(allocations.reduce((sum, a) => sum + (a.hoursActual || 0), 0));
  const totalComp = round2(allocations.reduce((sum, a) => sum + (a.hoursComputed || 0), 0));
  const balance = round2(totalComp - totalReal);
  const hasActivity = allocations.length > 0;
  const hasCompleted = completedTasks.length > 0;
  const hasRealOrComp = totalReal > 0 || totalComp > 0;

  const isZeroCapacityOverload = hours > 0 && capacity === 0;
  const isOverload = status === 'overload' || isZeroCapacityOverload;
  const isWarning = status === 'warning';
  const isHealthy = status === 'healthy';
  const hasReductions = breakdown.length > 0;

  const executionPercent =
    allocations.length > 0 ? Math.round((completedTasks.length / allocations.length) * 100) : 0;

  const loadLabel = `${hours}/${capacity}h`;
  const statusTone = isOverload
    ? 'text-red-600'
    : isWarning
      ? 'text-amber-600'
      : isHealthy
        ? 'text-emerald-600'
        : 'text-slate-400';

  return (
    <TooltipProvider>
      <div
        onClick={onClick}
        className={cn(
          'h-full min-w-0 p-1.5 sm:p-2 transition-all cursor-pointer border rounded-lg relative flex flex-col group tabular-nums touch-manipulation',
          touchTarget ? 'min-h-[44px] min-w-[44px]' : 'min-h-[140px]',
          isOverload
            ? 'bg-red-50/80 border-red-200 hover:bg-red-50 hover:border-red-300'
            : isWarning
              ? 'bg-amber-50/50 border-amber-200 hover:bg-amber-50 hover:border-amber-300'
              : isHealthy
                ? 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300'
                : isCurrentWeek
                  ? 'bg-white border-indigo-300 shadow-sm'
                  : 'bg-slate-50/50 border-slate-200 hover:bg-white hover:border-slate-300',
          !hasActivity && !hasReductions && 'opacity-50 hover:opacity-100'
        )}
      >
        {hasActivity ? (
          <div className="flex flex-col gap-1 flex-1 min-h-0 min-w-0 overflow-hidden">
            {allocations.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-1 shrink-0">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        executionPercent === 100
                          ? 'bg-emerald-500'
                          : executionPercent > 0
                            ? 'bg-blue-500'
                            : 'bg-slate-300'
                      )}
                      style={{ width: `${executionPercent}%` }}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p>
                    {completedTasks.length}/{allocations.length} tareas completadas ({executionPercent}%)
                  </p>
                </TooltipContent>
              </Tooltip>
            )}

            <div className="space-y-0.5 min-w-0 overflow-hidden">
              <div
                className={cn(
                  'flex justify-between items-center gap-1 text-[11px] py-0.5 px-1 rounded min-w-0',
                  hasCompleted ? 'text-slate-400' : 'text-slate-700 bg-slate-100/50 font-medium'
                )}
              >
                <span className="flex items-center gap-1 shrink-0">
                  <Clock className="h-3 w-3" />
                  Est.
                </span>
                <span className="font-mono font-semibold truncate">{totalEst}h</span>
              </div>

              {hasRealOrComp && (
                <>
                  <div className="space-y-0.5 text-[11px] py-0.5 px-1 rounded bg-blue-50/70 min-w-0">
                    <div className="flex items-center justify-between gap-1 text-blue-700 min-w-0">
                      <span className="font-medium shrink-0">Real</span>
                      <span className="font-mono font-bold truncate">{totalReal}h</span>
                    </div>
                    <div className="flex items-center justify-between gap-1 text-emerald-700 min-w-0">
                      <span className="font-medium shrink-0">Comp.</span>
                      <span className="font-mono font-bold truncate">{totalComp}h</span>
                    </div>
                  </div>

                  {Math.abs(balance) > 0.01 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            'flex justify-between items-center gap-1 text-[11px] px-2 py-1 rounded-md font-medium w-full min-w-0',
                            balance >= 0
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-red-100 text-red-800 border border-red-300'
                          )}
                        >
                          <span className="flex items-center gap-1 shrink-0">
                            {balance >= 0 ? (
                              <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                            ) : (
                              <TrendingDown className="h-3.5 w-3.5 shrink-0" />
                            )}
                            <span>{balance >= 0 ? 'Gan.' : 'Pérd.'}</span>
                          </span>
                          <span className="font-mono font-bold text-[12px] truncate">
                            {balance > 0 ? '+' : ''}
                            {balance}h
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        {balance >= 0 ? 'Ganancia' : 'Pérdida'}: {balance > 0 ? '+' : ''}
                        {balance}h
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {Math.abs(balance) <= 0.01 && (
                    <div className="flex justify-center items-center text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                      <CheckCircle2 className="h-3 w-3 mr-1 shrink-0" />
                      <span>En tiempo</span>
                    </div>
                  )}
                </>
              )}

              {pendingTasks.length > 0 && hasCompleted && (
                <div className="text-[9px] text-slate-400 text-center mt-0.5">
                  +{pendingTasks.length} pendiente{pendingTasks.length > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center min-h-0">
            {!hasReductions && (
              <span className="text-[11px] text-slate-300 uppercase tracking-wider font-medium">Libre</span>
            )}
          </div>
        )}

        {hasReductions && (
          <div className={cn('space-y-1 shrink-0', hasActivity && 'mt-1 pt-1 border-t border-slate-200')}>
            {breakdown.map((item, idx) => (
              <Tooltip key={idx}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'flex justify-between items-center gap-1 text-[10px] px-1.5 py-1 rounded-md min-w-0',
                      item.type === 'absence'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-blue-100 text-blue-800 border border-blue-300'
                    )}
                  >
                    <span className="flex items-center gap-1 min-w-0 flex-1">
                      {item.type === 'absence' ? (
                        <Palmtree className="h-3 w-3 flex-shrink-0" />
                      ) : (
                        <CalendarOff className="h-3 w-3 flex-shrink-0" />
                      )}
                      <span className="line-clamp-2 font-medium break-words text-[10px] leading-tight">
                        {item.reason.replace('Ausencia: ', '').replace('Evento: ', '')}
                      </span>
                    </span>
                    <span className="font-mono font-bold shrink-0">-{item.hours}h</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs max-w-[200px]">
                  <p>{item.reason}</p>
                  <p className="text-slate-400">Reduce la capacidad en {item.hours}h</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}

        <div className="pt-1.5 sm:pt-2 border-t border-slate-200/50 mt-auto shrink-0 min-w-0">
          {isZeroCapacityOverload && (
            <div className="flex items-center gap-1 text-[10px] text-red-700 bg-red-100 border border-red-300 rounded px-1.5 py-1 mb-1.5">
              <AlertCircle className="h-3 w-3 flex-shrink-0" />
              <span className="font-medium leading-tight">Tareas en vacaciones</span>
            </div>
          )}
          <div className={cn('flex items-center gap-1 min-w-0 w-full', statusTone, touchTarget && 'text-base')}>
            <span className="flex items-center shrink-0">
              {isOverload && <AlertTriangle className="h-3.5 w-3.5" aria-hidden />}
              {isWarning && <AlertTriangle className="h-3.5 w-3.5" aria-hidden />}
              {isHealthy && <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />}
            </span>
            <span
              className="font-mono text-[13px] sm:text-sm font-bold tabular-nums leading-tight min-w-0 flex-1 text-right"
              title={loadLabel}
            >
              {loadLabel}
            </span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export function WeekCell({ variant = 'detailed', ...props }: WeekCellProps) {
  if (variant === 'compact') {
    return <WeekCellCompact {...props} />;
  }
  return <WeekCellDetailed {...props} />;
}
