import { Employee, Project, Allocation, TeamEvent, Absence } from '@/types';
import { WeekCell } from './WeekCell';
import { useApp } from '@/contexts/AppContext';
import { useAgency } from '@/contexts/AgencyContext';
import { getValidRole } from '@/utils/roleUtils';
import { format, startOfWeek } from 'date-fns';
import { isCurrentWeek, isAllocationInEffectiveMonth } from '@/utils/dateUtils';

interface EmployeeRowProps {
  employee: Employee;
  weeks: { weekStart: Date; weekEnd: Date; effectiveStart?: Date; effectiveEnd?: Date }[];
  projects: Project[];
  allocations: Allocation[];
  teamEvents: TeamEvent[];
  absences: Absence[];
  viewDate: Date;
  onOpenSheet: (employeeId: string, weekStart: Date, autoAdd?: boolean) => void;
}

export function EmployeeRow({
  employee, weeks, allocations, viewDate, onOpenSheet
}: EmployeeRowProps) {

  const { getEmployeeLoadForWeek } = useApp();
  const { currentAgency } = useAgency();

  // Obtener rol válido (nunca vacío)
  const availableRoles = currentAgency?.settings?.roles || [];
  const displayRole = getValidRole(employee, availableRoles);

  return (
    <div className="contents group">
      {/* Columna Empleado */}
      <div className="sticky left-0 z-10 bg-background/95 backdrop-blur border-r p-3 flex items-center group-hover:bg-slate-50/80 transition-colors">
        <div
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity w-full"
          onClick={() => {
            // Buscar la semana actual, si no existe usar la primera
            const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
            const currentWeek = weeks.find(w =>
              w.weekStart.getTime() === currentWeekStart.getTime()
            );
            onOpenSheet(employee.id, currentWeek?.weekStart || weeks[0].weekStart);
          }}
          title="Ver detalle de tareas"
        >
          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm border border-indigo-200 shrink-0">
            {employee.avatarUrl ? (
              <img src={employee.avatarUrl} alt={employee.name} className="h-full w-full rounded-full object-cover" />
            ) : (
              employee.name.substring(0, 2).toUpperCase()
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm text-foreground truncate">{employee.name}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{displayRole}</span>
          </div>
        </div>
      </div>

      {/* Celdas de semanas */}
      {weeks.map((week) => {
        // Usar siempre la fecha real de la semana (lunes) para buscar tareas
        const weekStartDate = format(week.weekStart, 'yyyy-MM-dd');

        // 1. Filtrar tareas para pasar a la celda (Visualización detallada)
        // Filtrar por mes efectivo: solo mostrar allocations que tienen días en el mes visible
        const weekAllocations = allocations.filter(a =>
          a.employeeId === employee.id &&
          a.weekStartDate === weekStartDate &&
          isAllocationInEffectiveMonth(a.weekStartDate, viewDate)
        );

        // 2. Calcular carga total (Footer y Semáforo)
        const load = getEmployeeLoadForWeek(
          employee.id,
          weekStartDate,
          week.effectiveStart,
          week.effectiveEnd,
          viewDate
        );

        return (
          <div key={week.weekStart.toISOString()} className="border-r last:border-r-0">
            <WeekCell
              allocations={weekAllocations}
              hours={load.hours}
              capacity={load.capacity}
              status={load.status}
              percentage={load.percentage}
              isCurrentWeek={false}
              baseCapacity={load.baseCapacity}
              breakdown={load.breakdown}
              onClick={() => onOpenSheet(employee.id, week.weekStart)}
            />
          </div>
        );
      })}
    </div>
  );
}
