import { useMemo, memo, useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  AlertTriangle, CheckCircle2, Users, TrendingUp, TrendingDown,
  Info, ChevronDown, ChevronUp
} from 'lucide-react';
import { cn, formatProjectName } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Deadline } from '@/types';
import { format, isSameMonth, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

interface PlanningInconsistenciesCardProps {
  employeeId: string;
  viewDate: Date;
}

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

export const PlanningInconsistenciesCard = memo(function PlanningInconsistenciesCard({ 
  employeeId, 
  viewDate 
}: PlanningInconsistenciesCardProps) {
  const { allocations, projects, employees } = useApp();
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  const monthKey = format(viewDate, 'yyyy-MM');

  // Cargar deadlines del mes
  useEffect(() => {
    const loadDeadlines = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('deadlines')
          .select('*')
          .eq('month', monthKey)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          setDeadlines(data.map((d: any) => ({
            id: d.id,
            projectId: d.project_id,
            month: d.month,
            notes: d.notes,
            employeeHours: d.employee_hours || {},
            isHidden: d.is_hidden || false
          })));
        }
      } catch (error: any) {
        console.error('Error cargando deadlines:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDeadlines();
  }, [monthKey]);

  // Calcular incoherencias
  const inconsistencies = useMemo(() => {
    if (isLoading) return [];

    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);

    // Obtener allocations del mes para este empleado
    const monthAllocations = allocations.filter(a => 
      a.employeeId === employeeId &&
      isSameMonth(parseISO(a.weekStartDate), viewDate)
    );

    // Agrupar allocations por proyecto
    const allocationsByProject: Record<string, {
      planned: number; // horas planificadas (no completadas)
      computed: number; // horas computadas (completadas)
    }> = {};

    monthAllocations.forEach(a => {
      if (!allocationsByProject[a.projectId]) {
        allocationsByProject[a.projectId] = { planned: 0, computed: 0 };
      }
      if (a.status === 'completed') {
        allocationsByProject[a.projectId].computed += a.hoursComputed || 0;
      } else {
        allocationsByProject[a.projectId].planned += a.hoursAssigned || 0;
      }
    });

    // Comparar con deadlines
    const results: Array<{
      projectId: string;
      projectName: string;
      deadlineHours: number;
      plannedHours: number;
      computedHours: number;
      difference: number;
      teammates: Array<{
        employeeId: string;
        employeeName: string;
        plannedHours: number;
        computedHours: number;
        difference: number;
      }>;
    }> = [];

    deadlines.forEach(deadline => {
      const deadlineHours = deadline.employeeHours[employeeId] || 0;
      const projectAllocs = allocationsByProject[deadline.projectId] || { planned: 0, computed: 0 };
      // El deadline planifica según lo que se estima computar, así que comparamos con lo computado + planificado
      // (porque lo planificado aún no computado también cuenta)
      const totalPlanned = projectAllocs.planned + projectAllocs.computed;
      const difference = round2(totalPlanned - deadlineHours);

      // Solo mostrar si hay diferencia significativa (> 0.5h)
      if (Math.abs(difference) > 0.5) {
        const project = projects.find(p => p.id === deadline.projectId);
        
        // Buscar compañeros que también tienen horas en este proyecto para detectar intercambios
        const teammates: Array<{
          employeeId: string;
          employeeName: string;
          plannedHours: number;
          computedHours: number;
          difference: number;
        }> = [];

        // Obtener allocations del proyecto de todos los empleados
        const allProjectAllocations = allocations.filter(a => 
          a.projectId === deadline.projectId &&
          isSameMonth(parseISO(a.weekStartDate), viewDate)
        );

        // Agrupar por empleado
        const allocationsByEmployee: Record<string, {
          planned: number;
          computed: number;
        }> = {};

        allProjectAllocations.forEach(a => {
          if (!allocationsByEmployee[a.employeeId]) {
            allocationsByEmployee[a.employeeId] = { planned: 0, computed: 0 };
          }
          if (a.status === 'completed') {
            allocationsByEmployee[a.employeeId].computed += a.hoursComputed || 0;
          } else {
            allocationsByEmployee[a.employeeId].planned += a.hoursAssigned || 0;
          }
        });

        // Comparar con deadlines de cada empleado
        Object.entries(deadline.employeeHours).forEach(([empId, deadlineHrs]) => {
          if (empId !== employeeId) {
            const empAllocs = allocationsByEmployee[empId] || { planned: 0, computed: 0 };
            const empTotal = empAllocs.planned + empAllocs.computed;
            const empDiff = round2(empTotal - deadlineHrs);
            
            // Si este compañero también tiene diferencia, podría ser un intercambio
            if (Math.abs(empDiff) > 0.5) {
              const emp = employees.find(e => e.id === empId);
              teammates.push({
                employeeId: empId,
                employeeName: emp?.name || 'Desconocido',
                plannedHours: round2(empAllocs.planned),
                computedHours: round2(empAllocs.computed),
                difference: empDiff
              });
            }
          }
        });

        results.push({
          projectId: deadline.projectId,
          projectName: project?.name || 'Proyecto desconocido',
          deadlineHours,
          plannedHours: round2(projectAllocs.planned),
          computedHours: round2(projectAllocs.computed),
          difference,
          teammates
        });
      }
    });

    return results.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
  }, [deadlines, allocations, projects, employees, employeeId, viewDate, isLoading]);

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <span>Coherencia de planificación</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  if (inconsistencies.length === 0) {
    return (
      <Card className="border-l-4 border-l-emerald-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span>Coherencia de planificación</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            ✅ Todas tus tareas coinciden con lo planificado en el deadline.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className="border-l-4 border-l-amber-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <span>Coherencia de planificación</span>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-slate-400" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p className="text-xs">
                  Detecta diferencias entre lo planificado en el deadline y lo realmente planificado en tus tareas. 
                  Útil para detectar intercambios con compañeros o cambios de planificación.
                </p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">
            Se han detectado <strong>{inconsistencies.length}</strong> variación{inconsistencies.length !== 1 ? 'es' : ''} 
            {' '}en {format(viewDate, 'MMMM yyyy', { locale: es })}.
          </p>

          <div className="space-y-2">
            {inconsistencies.map(inc => {
              const isExpanded = expandedProjects.has(inc.projectId);
              const hasMore = inc.teammates.length > 0;
              const isPositive = inc.difference > 0;

              return (
                <div
                  key={inc.projectId}
                  className={cn(
                    "border rounded-lg p-3 transition-colors",
                    isPositive ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-slate-800 truncate">
                        {formatProjectName(inc.projectName)}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs">
                        <div>
                          <span className="text-slate-500">Deadline:</span>{' '}
                          <span className="font-medium">{inc.deadlineHours}h</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Planificado:</span>{' '}
                          <span className="font-medium">{round2(inc.plannedHours + inc.computedHours)}h</span>
                        </div>
                        <div className={cn("flex items-center gap-1 font-bold", isPositive ? "text-amber-700" : "text-blue-700")}>
                          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {isPositive ? '+' : ''}{inc.difference}h
                        </div>
                      </div>
                    </div>
                    {hasMore && (
                      <button
                        onClick={() => toggleProject(inc.projectId)}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    )}
                  </div>

                  {isExpanded && hasMore && (
                    <div className="mt-3 pt-3 border-t border-amber-300">
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 uppercase mb-2">
                        <Users className="h-3 w-3" />
                        Posibles intercambios con compañeros
                      </div>
                      <div className="space-y-1.5">
                        {inc.teammates.map(tm => {
                          const tmIsPositive = tm.difference > 0;
                          return (
                            <div
                              key={tm.employeeId}
                              className="text-xs bg-white rounded p-2 border border-slate-200"
                            >
                              <div className="font-medium text-slate-700">{tm.employeeName}</div>
                              <div className="flex items-center gap-3 mt-1 text-[10px]">
                                <span className="text-slate-500">
                                  Planificado: <span className="font-medium">{round2(tm.plannedHours + tm.computedHours)}h</span>
                                </span>
                                <span className={cn("font-bold", tmIsPositive ? "text-amber-600" : "text-blue-600")}>
                                  {tmIsPositive ? '+' : ''}{tm.difference}h
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
});

