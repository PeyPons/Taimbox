import { Allocation, LoadStatus } from '@/types';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, AlertCircle, AlertTriangle, Palmtree, CalendarOff, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
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
}

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

export function WeekCell({ allocations, hours, capacity, isCurrentWeek, breakdown, onClick }: WeekCellProps) {

  const totalEst = round2(allocations.reduce((sum, a) => sum + (a.hoursAssigned || 0), 0));

  const completedTasks = allocations.filter(a => a.status === 'completed');
  const pendingTasks = allocations.filter(a => a.status !== 'completed');
  const totalReal = round2(completedTasks.reduce((sum, a) => sum + (a.hoursActual || 0), 0));
  const totalComp = round2(completedTasks.reduce((sum, a) => sum + (a.hoursComputed || 0), 0));

  const balance = round2(totalComp - totalReal);
  const hasActivity = allocations.length > 0;
  const hasCompleted = completedTasks.length > 0;

  // Lógica Semáforo (90-110%)
  const ratio = capacity > 0 ? (hours / capacity) : 0;
  const isOverload = ratio > 1.1;
  const isUnderload = ratio < 0.9 && capacity > 0;
  const isHealthy = ratio >= 0.9 && ratio <= 1.1 && capacity > 0;

  const hasReductions = breakdown && breakdown.length > 0;

  // Porcentaje de ejecución (tareas completadas vs total)
  const executionPercent = allocations.length > 0
    ? Math.round((completedTasks.length / allocations.length) * 100)
    : 0;

  return (
    <TooltipProvider>
      <div onClick={onClick} className={cn(
        "h-full min-h-[140px] p-2 transition-all cursor-pointer border rounded-lg relative flex flex-col group tabular-nums",
        // HEATMAP DE FONDO
        isOverload ? "bg-red-50/80 border-red-200 hover:bg-red-50 hover:border-red-300" :
        isUnderload ? "bg-amber-50/50 border-amber-200 hover:bg-amber-50 hover:border-amber-300" :
        isHealthy ? "bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300" :
        isCurrentWeek ? "bg-white border-indigo-300 shadow-sm" : "bg-slate-50/50 border-slate-200 hover:bg-white hover:border-slate-300",

        !hasActivity && !hasReductions && "opacity-50 hover:opacity-100"
      )}>

        {/* SECCIÓN PRINCIPAL */}
        {hasActivity ? (
          <div className="flex flex-col gap-1 flex-1">

            {/* BARRA DE PROGRESO DE EJECUCIÓN */}
            {allocations.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-1">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        executionPercent === 100 ? "bg-emerald-500" :
                        executionPercent > 0 ? "bg-blue-500" : "bg-slate-300"
                      )}
                      style={{ width: `${executionPercent}%` }}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p>{completedTasks.length}/{allocations.length} tareas completadas ({executionPercent}%)</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* MÉTRICAS EN FORMATO TABLA CLARA */}
            <div className="space-y-0.5">
              {/* ESTIMADO - Siempre visible */}
              <div className={cn(
                "flex justify-between items-center text-[11px] py-0.5 px-1 rounded",
                hasCompleted ? "text-slate-400" : "text-slate-700 bg-slate-100/50 font-medium"
              )}>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Est.
                </span>
                <span className="font-mono font-semibold">{totalEst}h</span>
              </div>

              {/* REAL y COMPUTADO - Solo si hay completadas */}
              {hasCompleted && (
                <>
                  {/* FLUJO: Real → Comp */}
                  <div className="flex items-center gap-0.5 text-[11px] py-0.5 px-1 rounded bg-blue-50/70">
                    <div className="flex items-center gap-1 text-blue-700 flex-1">
                      <span className="font-medium">Real</span>
                      <span className="font-mono font-bold">{totalReal}h</span>
                    </div>
                    <ArrowRight className="h-3 w-3 text-slate-400" />
                    <div className="flex items-center gap-1 text-emerald-700 flex-1 justify-end">
                      <span className="font-medium">Comp.</span>
                      <span className="font-mono font-bold">{totalComp}h</span>
                    </div>
                  </div>

                  {/* BALANCE - Destacado */}
                  {Math.abs(balance) > 0.01 && (
                    <div className={cn(
                      "flex justify-between items-center text-[11px] px-2 py-1 rounded-md font-medium",
                      balance >= 0
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-red-100 text-red-800 border border-red-300"
                    )}>
                      <span className="flex items-center gap-1">
                        {balance >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                        {balance >= 0 ? "Ganancia" : "Pérdida"}
                      </span>
                      <span className="font-mono font-bold text-[12px]">
                        {balance > 0 ? '+' : ''}{balance}h
                      </span>
                    </div>
                  )}

                  {/* Balance neutro */}
                  {Math.abs(balance) <= 0.01 && (
                    <div className="flex justify-center items-center text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      <span>En tiempo</span>
                    </div>
                  )}
                </>
              )}

              {/* Indicador de tareas pendientes */}
              {pendingTasks.length > 0 && hasCompleted && (
                <div className="text-[9px] text-slate-400 text-center mt-0.5">
                  +{pendingTasks.length} pendiente{pendingTasks.length > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            {!hasReductions && (
              <span className="text-[11px] text-slate-300 uppercase tracking-wider font-medium">
                Libre
              </span>
            )}
          </div>
        )}

        {/* SECCIÓN REDUCCIONES (Vacaciones, eventos) */}
        {hasReductions && (
          <div className={cn("space-y-1", hasActivity && "mt-1 pt-1 border-t border-slate-200")}>
            {breakdown.map((item, idx) => (
              <Tooltip key={idx}>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "flex justify-between items-center text-[10px] px-1.5 py-1 rounded-md",
                    item.type === 'absence'
                      ? "bg-amber-100 text-amber-800 border border-amber-300"
                      : "bg-blue-100 text-blue-800 border border-blue-300"
                  )}>
                    <span className="flex items-center gap-1 truncate max-w-[85px]">
                      {item.type === 'absence' ? <Palmtree className="h-3 w-3 flex-shrink-0" /> : <CalendarOff className="h-3 w-3 flex-shrink-0" />}
                      <span className="truncate font-medium">
                        {item.reason.replace('Ausencia: ', '').replace('Evento: ', '')}
                      </span>
                    </span>
                    <span className="font-mono font-bold whitespace-nowrap">-{item.hours}h</span>
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

        {/* FOOTER - CARGA TOTAL */}
        <div className="mt-auto pt-2 border-t border-slate-200/50">
          <div className={cn(
            "flex items-center justify-between text-[11px] font-bold",
            isOverload ? "text-red-600" :
            isUnderload ? "text-amber-600" :
            isHealthy ? "text-emerald-600" :
            "text-slate-400"
          )}>
            <span className="flex items-center gap-1">
              {isOverload && <AlertCircle className="h-3.5 w-3.5" />}
              {isUnderload && <AlertTriangle className="h-3.5 w-3.5" />}
              {isHealthy && <CheckCircle2 className="h-3.5 w-3.5" />}
            </span>
            <span className="font-mono">{hours}/{capacity}h</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
