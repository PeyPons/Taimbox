/**
 * Card de disponibilidad del equipo (horas asignadas vs disponibles por empleado).
 * Usado en el sidebar desktop (con tooltip de ausencias/eventos) y en el Sheet móvil (vista compacta).
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface CapacityData {
  total: number;
  absenceHours: number;
  eventHours: number;
  available: number;
  absenceDetails: { type: string; hours: number }[];
  eventDetails: { name: string; hours: number }[];
}

export interface EmployeeItem {
  id: string;
  name: string;
  first_name?: string;
  avatarUrl?: string;
}

export interface DeadlinesAvailabilityCardProps {
  employees: EmployeeItem[];
  getMonthlyCapacity: (employeeId: string) => CapacityData;
  getEmployeeAssignedHours: (employeeId: string) => number;
  /** Si true, vista compacta sin tooltip (móvil). Si false, tooltip con ausencias/eventos (desktop). */
  compact?: boolean;
  /** Clase opcional para el contenedor de la card (ej. data-tour) */
  className?: string;
}

export function DeadlinesAvailabilityCard({
  employees,
  getMonthlyCapacity,
  getEmployeeAssignedHours,
  compact = false,
  className,
}: DeadlinesAvailabilityCardProps) {
  return (
    <div
      className={cn('bg-white rounded-xl border shadow-sm p-3', compact && 'bg-slate-50', className)}
      data-tour={compact ? undefined : 'availability-panel'}
    >
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
        Disponibilidad
      </h3>
      <div className="space-y-2">
        {employees.map((emp) => {
          const capacityData = getMonthlyCapacity(emp.id);
          const assigned = getEmployeeAssignedHours(emp.id);
          const available = capacityData.available;
          const percentage = available > 0 ? Math.round((assigned / available) * 100) : 0;
          const remaining = available - assigned;
          const status = percentage > 100 ? 'overload' : percentage > 85 ? 'warning' : 'healthy';
          const displayName = emp.first_name || emp.name;
          const hasReductions = capacityData.absenceHours > 0 || capacityData.eventHours > 0;

          const row = (
            <div className={cn('flex items-center gap-2', !compact && 'cursor-help')}>
              <Avatar className="h-6 w-6 flex-shrink-0">
                <AvatarImage src={emp.avatarUrl} alt={emp.name} />
                <AvatarFallback className="bg-primary/100 text-white text-[9px]">
                  {displayName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate font-medium text-slate-700">
                    {displayName}
                    {!compact && hasReductions && <span className="text-orange-400 ml-1">*</span>}
                  </span>
                  <span
                    className={cn(
                      'font-mono font-bold',
                      status === 'overload' && 'text-red-600',
                      status === 'warning' && 'text-orange-600',
                      status === 'healthy' && 'text-emerald-600'
                    )}
                  >
                    {percentage}%
                  </span>
                </div>
                {compact ? (
                  <>
                    <Progress value={Math.min(percentage, 100)} className="h-1.5" />
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Disponible: {remaining.toFixed(0)}h
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Progress
                      value={Math.min(percentage, 100)}
                      className={cn(
                        'h-1 flex-1',
                        status === 'overload' && '[&>div]:bg-red-500',
                        status === 'warning' && '[&>div]:bg-orange-500',
                        status === 'healthy' && '[&>div]:bg-emerald-500'
                      )}
                    />
                    <span
                      className={cn(
                        'text-[10px] font-mono w-10 text-right',
                        remaining < 0 ? 'text-red-500' : 'text-slate-400'
                      )}
                    >
                      {remaining.toFixed(0)}h
                    </span>
                  </div>
                )}
              </div>
            </div>
          );

          if (compact) {
            return <div key={emp.id}>{row}</div>;
          }

          return (
            <TooltipProvider key={emp.id}>
              <Tooltip>
                <TooltipTrigger asChild>{row}</TooltipTrigger>
                <TooltipContent
                  side="left"
                  className="text-xs max-w-[280px] bg-white border border-slate-200 shadow-xl"
                >
                  <div className="space-y-2 text-slate-700">
                    <div className="font-semibold text-slate-900 text-sm">{displayName}</div>
                    <div className="text-slate-600">
                      Base mensual: <span className="font-medium">{capacityData.total.toFixed(1)}h</span>
                    </div>
                    {capacityData.absenceDetails.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-red-600 font-semibold text-xs">Ausencias:</div>
                        {capacityData.absenceDetails.map((a, i) => (
                          <div key={i} className="text-red-700 pl-3 text-xs">
                            •{' '}
                            {a.type === 'vacation'
                              ? 'Vacaciones'
                              : a.type === 'sick_leave'
                                ? 'Baja médica'
                                : a.type === 'personal'
                                  ? 'Personal'
                                  : a.type}
                            : <span className="font-medium">-{a.hours.toFixed(1)}h</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {capacityData.eventDetails.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-orange-600 font-semibold text-xs">Eventos:</div>
                        {capacityData.eventDetails.map((e, i) => (
                          <div key={i} className="text-orange-700 pl-3 text-xs">
                            • {e.name}: <span className="font-medium">-{e.hours.toFixed(1)}h</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="border-t border-slate-200 pt-2 mt-2">
                      <span className="text-slate-600">Disponible: </span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {available.toFixed(1)}h
                      </span>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
      {!compact && employees.some((emp) => (getMonthlyCapacity(emp.id).absenceHours > 0 || getMonthlyCapacity(emp.id).eventHours > 0)) && (
        <p className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
          * Ausencias o eventos este mes (no indica rol ni administrador).
        </p>
      )}
    </div>
  );
}
