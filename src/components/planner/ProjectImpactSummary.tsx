import { useMemo } from 'react';
import { cn, formatProjectName } from '@/lib/utils';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Project, Allocation } from '@/types';
import { ProjectBudgetStatus } from '@/hooks/useAllocationSheet';

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

interface NewTaskRow {
  id: string;
  projectId: string;
  taskName: string;
  hours: string;
  weekDate: string;
  description: string;
  dependencyId?: string;
}

interface ProjectImpactSummaryProps {
  newTasks: NewTaskRow[];
  projects: Project[];
  allocations: Allocation[];
  viewDate: Date;
  getProjectBudgetStatus: (projectId: string) => ProjectBudgetStatus;
  getEmployeeLoadForWeek: (employeeId: string, weekStart: string, effectiveStart?: Date, effectiveEnd?: Date) => { hours: number; capacity: number; percentage: number };
  employeeId: string;
  weeks: { weekStart: Date; effectiveStart?: Date; effectiveEnd?: Date }[];
}

export function ProjectImpactSummary({
  newTasks,
  projects,
  allocations,
  viewDate,
  getProjectBudgetStatus,
  getEmployeeLoadForWeek,
  employeeId,
  weeks
}: ProjectImpactSummaryProps) {
  // Agrupar horas por proyecto
  const projectImpact = useMemo(() => {
    const impact: Record<string, { name: string; adding: number; current: ProjectBudgetStatus }> = {};
    
    newTasks.forEach(task => {
      if (task.projectId && task.hours) {
        const hours = parseFloat(task.hours) || 0;
        if (hours > 0) {
          if (!impact[task.projectId]) {
            const project = projects.find(p => p.id === task.projectId);
            impact[task.projectId] = {
              name: project?.name || 'Desconocido',
              adding: 0,
              current: getProjectBudgetStatus(task.projectId)
            };
          }
          impact[task.projectId].adding += hours;
        }
      }
    });
    
    return Object.entries(impact).map(([id, data]) => ({
      id,
      ...data,
      newTotal: data.current.totalComputed + data.current.totalPlanned + data.adding,
      exceeds: data.current.budgetMax > 0 && (data.current.totalComputed + data.current.totalPlanned + data.adding) > data.current.budgetMax,
      excessAmount: data.current.budgetMax > 0 
        ? round2((data.current.totalComputed + data.current.totalPlanned + data.adding) - data.current.budgetMax)
        : 0
    }));
  }, [newTasks, projects, getProjectBudgetStatus]);

  // Agrupar horas por semana para verificar capacidad
  const weekImpact = useMemo(() => {
    const impact: Record<string, { weekIndex: number; adding: number; weekData: { weekStart: Date; effectiveStart?: Date; effectiveEnd?: Date } }> = {};
    
    newTasks.forEach(task => {
      if (task.weekDate && task.hours) {
        const hours = parseFloat(task.hours) || 0;
        if (hours > 0) {
          if (!impact[task.weekDate]) {
            const weekIndex = weeks.findIndex(w => {
              const storageKey = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-W${String(weeks.indexOf(w) + 1).padStart(2, '0')}`;
              return storageKey === task.weekDate || w.weekStart.toISOString().split('T')[0] === task.weekDate;
            });
            const weekData = weeks[weekIndex] || weeks[0];
            impact[task.weekDate] = {
              weekIndex: weekIndex >= 0 ? weekIndex : 0,
              adding: 0,
              weekData
            };
          }
          impact[task.weekDate].adding += hours;
        }
      }
    });
    
    return Object.entries(impact).map(([weekDate, data]) => {
      const currentLoad = getEmployeeLoadForWeek(
        employeeId, 
        weekDate, 
        data.weekData.effectiveStart, 
        data.weekData.effectiveEnd
      );
      const newTotal = round2(currentLoad.hours + data.adding);
      const exceeds = newTotal > currentLoad.capacity;
      
      return {
        weekDate,
        weekIndex: data.weekIndex,
        adding: data.adding,
        currentHours: currentLoad.hours,
        capacity: currentLoad.capacity,
        newTotal,
        exceeds,
        excessAmount: exceeds ? round2(newTotal - currentLoad.capacity) : 0
      };
    }).sort((a, b) => a.weekIndex - b.weekIndex);
  }, [newTasks, weeks, viewDate, getEmployeeLoadForWeek, employeeId]);

  const hasProjectExcesses = projectImpact.some(p => p.exceeds);
  const hasWeekExcesses = weekImpact.some(w => w.exceeds);
  const hasAnyExcess = hasProjectExcesses || hasWeekExcesses;

  if (projectImpact.length === 0 && weekImpact.length === 0) return null;

  return (
    <div className={cn(
      "flex items-center gap-3 text-xs px-3 py-2 rounded-lg w-full flex-wrap",
      hasAnyExcess ? "bg-amber-50 border border-amber-200" : "bg-emerald-50 border border-emerald-200"
    )}>
      {/* Impacto en proyectos */}
      {projectImpact.map((p, idx) => (
        <div key={p.id} className="flex items-center gap-1.5">
          {idx > 0 && <span className="text-slate-300">│</span>}
          {p.exceeds ? (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          )}
          <span className={cn("font-medium truncate max-w-[120px]", p.exceeds ? "text-amber-700" : "text-emerald-700")}>
            {formatProjectName(p.name)}
          </span>
          <span className={cn("tabular-nums", p.exceeds ? "text-amber-600" : "text-emerald-600")}>
            +{p.adding}h
          </span>
          {p.exceeds && p.current.budgetMax > 0 && (
            <span className="text-amber-600 font-semibold text-[10px]">
              ({p.newTotal}/{p.current.budgetMax}h)
            </span>
          )}
        </div>
      ))}
      
      {/* Separador si hay ambos */}
      {projectImpact.length > 0 && weekImpact.length > 0 && (
        <span className="text-slate-300">║</span>
      )}
      
      {/* Impacto en capacidad por semana */}
      {weekImpact.map((w, idx) => (
        <div key={w.weekDate} className="flex items-center gap-1.5">
          {idx > 0 && <span className="text-slate-300">│</span>}
          {w.exceeds ? (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          )}
          <span className={cn("font-medium", w.exceeds ? "text-amber-700" : "text-emerald-700")}>
            S{w.weekIndex + 1}
          </span>
          <span className={cn("tabular-nums text-[10px]", w.exceeds ? "text-amber-600" : "text-emerald-600")}>
            {w.newTotal}h/{w.capacity}h
          </span>
          {w.exceeds && (
            <span className="text-amber-600 font-semibold text-[10px]">
              (+{w.excessAmount}h)
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
