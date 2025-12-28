import { useMemo, memo, useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertTriangle, CheckCircle2, Users, TrendingUp, TrendingDown,
  Info, ChevronDown, ChevronUp, Filter
} from 'lucide-react';
import { cn, formatProjectName } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Deadline } from '@/types';
import { format, isSameMonth, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

interface GlobalPlanningInconsistenciesProps {
  viewDate: Date;
}

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

interface Inconsistency {
  projectId: string;
  projectName: string;
  employees: Array<{
    employeeId: string;
    employeeName: string;
    avatarUrl?: string;
    deadlineHours: number;
    plannedHours: number;
    computedHours: number;
    difference: number;
    hasDeadline: boolean;
  }>;
  totalDeadlineHours: number;
  totalPlannedHours: number;
  totalComputedHours: number;
  totalDifference: number;
  budgetHours: number;
  minimumHours: number;
}

export const GlobalPlanningInconsistencies = memo(function GlobalPlanningInconsistencies({ 
  viewDate 
}: GlobalPlanningInconsistenciesProps) {
  const { allocations, projects, employees } = useApp();
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');

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

  // Calcular incoherencias globales agrupadas por proyecto
  const inconsistencies = useMemo(() => {
    if (isLoading) return [];

    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);

    // Obtener allocations del mes para todos los empleados
    const monthAllocations = allocations.filter(a => 
      isSameMonth(parseISO(a.weekStartDate), viewDate)
    );

    // Agrupar allocations por proyecto y empleado
    const allocationsByProjectAndEmployee: Record<string, Record<string, {
      planned: number;
      computed: number;
    }>> = {};

    monthAllocations.forEach(a => {
      if (!allocationsByProjectAndEmployee[a.projectId]) {
        allocationsByProjectAndEmployee[a.projectId] = {};
      }
      if (!allocationsByProjectAndEmployee[a.projectId][a.employeeId]) {
        allocationsByProjectAndEmployee[a.projectId][a.employeeId] = { planned: 0, computed: 0 };
      }
      if (a.status === 'completed') {
        allocationsByProjectAndEmployee[a.projectId][a.employeeId].computed += a.hoursComputed || 0;
      } else {
        allocationsByProjectAndEmployee[a.projectId][a.employeeId].planned += a.hoursAssigned || 0;
      }
    });

    // Agrupar por proyecto para evitar duplicidades
    const projectInconsistencies: Record<string, Inconsistency> = {};

    // Primero procesar proyectos con deadlines
    deadlines.forEach(deadline => {
      if (deadline.isHidden) return;
      
      const projectId = deadline.projectId;
      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      const employeeInconsistencies: Inconsistency['employees'] = [];
      let totalDeadline = 0;
      let totalPlanned = 0;
      let totalComputed = 0;

      // Procesar cada empleado en el deadline
      Object.entries(deadline.employeeHours).forEach(([empId, deadlineHrs]) => {
        const empAllocs = allocationsByProjectAndEmployee[projectId]?.[empId] || { planned: 0, computed: 0 };
        const total = empAllocs.planned + empAllocs.computed;
        const diff = round2(total - deadlineHrs);

        // Solo incluir si hay diferencia significativa (> 0.5h)
        if (Math.abs(diff) > 0.5) {
          const emp = employees.find(e => e.id === empId);
          employeeInconsistencies.push({
            employeeId: empId,
            employeeName: emp?.name || 'Desconocido',
            avatarUrl: emp?.avatarUrl,
            deadlineHours: deadlineHrs,
            plannedHours: round2(empAllocs.planned),
            computedHours: round2(empAllocs.computed),
            difference: diff,
            hasDeadline: true
          });
        }

        totalDeadline += deadlineHrs;
        totalPlanned += empAllocs.planned;
        totalComputed += empAllocs.computed;
      });

      // También incluir empleados con horas pero sin deadline en este proyecto
      Object.entries(allocationsByProjectAndEmployee[projectId] || {}).forEach(([empId, allocs]) => {
        if (!deadline.employeeHours[empId] && (allocs.planned > 0 || allocs.computed > 0)) {
          const emp = employees.find(e => e.id === empId);
          const total = allocs.planned + allocs.computed;
          employeeInconsistencies.push({
            employeeId: empId,
            employeeName: emp?.name || 'Desconocido',
            avatarUrl: emp?.avatarUrl,
            deadlineHours: 0,
            plannedHours: round2(allocs.planned),
            computedHours: round2(allocs.computed),
            difference: round2(total),
            hasDeadline: false
          });
          totalPlanned += allocs.planned;
          totalComputed += allocs.computed;
        }
      });

      if (employeeInconsistencies.length > 0) {
        projectInconsistencies[projectId] = {
          projectId,
          projectName: project.name,
          employees: employeeInconsistencies,
          totalDeadlineHours: totalDeadline,
          totalPlannedHours: round2(totalPlanned),
          totalComputedHours: round2(totalComputed),
          totalDifference: round2((totalPlanned + totalComputed) - totalDeadline),
          budgetHours: project.budgetHours || 0,
          minimumHours: project.minimumHours || 0
        };
      }
    });

    // Procesar proyectos sin deadline pero con horas
    Object.entries(allocationsByProjectAndEmployee).forEach(([projectId, empAllocs]) => {
      // Solo si no está ya en projectInconsistencies
      if (projectInconsistencies[projectId]) return;

      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      const employeeInconsistencies: Inconsistency['employees'] = [];
      let totalPlanned = 0;
      let totalComputed = 0;

      Object.entries(empAllocs).forEach(([empId, allocs]) => {
        const total = allocs.planned + allocs.computed;
        if (total > 0) {
          const emp = employees.find(e => e.id === empId);
          employeeInconsistencies.push({
            employeeId: empId,
            employeeName: emp?.name || 'Desconocido',
            avatarUrl: emp?.avatarUrl,
            deadlineHours: 0,
            plannedHours: round2(allocs.planned),
            computedHours: round2(allocs.computed),
            difference: round2(total),
            hasDeadline: false
          });
          totalPlanned += allocs.planned;
          totalComputed += allocs.computed;
        }
      });

      if (employeeInconsistencies.length > 0) {
        projectInconsistencies[projectId] = {
          projectId,
          projectName: project.name,
          employees: employeeInconsistencies,
          totalDeadlineHours: 0,
          totalPlannedHours: round2(totalPlanned),
          totalComputedHours: round2(totalComputed),
          totalDifference: round2(totalPlanned + totalComputed),
          budgetHours: project.budgetHours || 0,
          minimumHours: project.minimumHours || 0
        };
      }
    });

    // Filtrar por empleado si está seleccionado
    let filtered = Object.values(projectInconsistencies);
    if (selectedEmployeeId !== 'all') {
      filtered = filtered.map(proj => ({
        ...proj,
        employees: proj.employees.filter(emp => emp.employeeId === selectedEmployeeId)
      })).filter(proj => proj.employees.length > 0);
    }

    return filtered.sort((a, b) => Math.abs(b.totalDifference) - Math.abs(a.totalDifference));
  }, [deadlines, allocations, projects, employees, viewDate, isLoading, selectedEmployeeId]);

  // Expandir todos los proyectos por defecto cuando cambian las inconsistencias
  useEffect(() => {
    if (inconsistencies.length > 0) {
      setExpandedProjects(new Set(inconsistencies.map(inc => inc.projectId)));
    }
  }, [inconsistencies]);

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
            <span>Coherencia de planificación global</span>
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
            <span>Coherencia de planificación global</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            ✅ Todas las tareas del equipo coinciden con lo planificado en los deadlines.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className="border-l-4 border-l-amber-500">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <span>Coherencia de planificación global</span>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-slate-400" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px]">
                  <p className="text-xs">
                    Vista global de diferencias entre lo planificado en deadlines y lo realmente ejecutado. 
                    Agrupado por proyecto para evitar duplicidades.
                  </p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue placeholder="Filtrar empleado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los empleados</SelectItem>
                  {employees.filter(e => e.isActive).map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">
            Se han detectado <strong>{inconsistencies.length}</strong> proyecto{inconsistencies.length !== 1 ? 's' : ''} 
            {' '}con variaciones en {format(viewDate, 'MMMM yyyy', { locale: es })}.
          </p>

          <div className="space-y-2">
            {inconsistencies.map(inc => {
              const isExpanded = expandedProjects.has(inc.projectId);
              const hasEmployees = inc.employees.length > 0;
              const isPositive = inc.totalDifference > 0;

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
                      {(inc.budgetHours > 0 || inc.minimumHours > 0) && (
                        <div className="mt-1 text-[10px] text-slate-500">
                          {inc.budgetHours > 0 && (
                            <span>Asignadas: <strong>{inc.budgetHours}h</strong></span>
                          )}
                          {inc.budgetHours > 0 && inc.minimumHours > 0 && <span> • </span>}
                          {inc.minimumHours > 0 && (
                            <span>Mínimo: <strong>{inc.minimumHours}h</strong></span>
                          )}
                        </div>
                      )}
                      <div className="mt-1.5 text-[11px] text-slate-600 bg-white/50 rounded px-2 py-1 border border-slate-200">
                        {inc.totalDeadlineHours === 0 ? (
                          <div className="text-amber-700 font-semibold">
                            ⚠️ Este proyecto <strong>no está en el deadline</strong> pero tiene horas asignadas.
                            {' '}Total del equipo: <strong>{round2(inc.totalPlannedHours + inc.totalComputedHours)}h</strong> 
                            {' '}({inc.totalComputedHours.toFixed(1)}h computadas + {inc.totalPlannedHours.toFixed(1)}h planificadas).
                          </div>
                        ) : (
                          <div>
                            Total del equipo: <strong>{round2(inc.totalPlannedHours + inc.totalComputedHours)}h</strong> 
                            {' '}({inc.totalComputedHours.toFixed(1)}h computadas + {inc.totalPlannedHours.toFixed(1)}h planificadas).
                            {' '}Deadline total: <strong>{inc.totalDeadlineHours}h</strong>.
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs">
                        {inc.totalDeadlineHours === 0 ? (
                          <>
                            <div className="text-slate-500 italic">Sin deadline</div>
                            <span className="text-slate-300">→</span>
                            <div className="flex items-center gap-2">
                              <span className="text-blue-600">
                                Plan: <span className="font-medium">{inc.totalPlannedHours}h</span>
                              </span>
                              <span className="text-emerald-600">
                                Comp: <span className="font-medium">{inc.totalComputedHours}h</span>
                              </span>
                            </div>
                            <span className="text-slate-300">→</span>
                            <div className="flex items-center gap-1 font-bold text-amber-700">
                              <TrendingUp className="h-3 w-3" />
                              +{inc.totalDifference}h
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <span className="text-slate-500">Deadline:</span>{' '}
                              <span className="font-medium">{inc.totalDeadlineHours}h</span>
                            </div>
                            <span className="text-slate-300">→</span>
                            <div className="flex items-center gap-2">
                              <span className="text-blue-600">
                                Plan: <span className="font-medium">{inc.totalPlannedHours}h</span>
                              </span>
                              <span className="text-emerald-600">
                                Comp: <span className="font-medium">{inc.totalComputedHours}h</span>
                              </span>
                            </div>
                            <span className="text-slate-300">→</span>
                            <div className={cn("flex items-center gap-1 font-bold", isPositive ? "text-amber-700" : "text-blue-700")}>
                              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {isPositive ? '+' : ''}{inc.totalDifference}h
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    {hasEmployees && (
                      <button
                        onClick={() => toggleProject(inc.projectId)}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    )}
                  </div>

                  {isExpanded && hasEmployees && (
                    <div className="mt-3 pt-3 border-t border-amber-300">
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 uppercase mb-2">
                        <Users className="h-3 w-3" />
                        Empleados afectados ({inc.employees.length})
                      </div>
                      <div className="space-y-1.5">
                        {inc.employees.map(emp => {
                          const empIsPositive = emp.difference > 0;
                          return (
                            <div
                              key={emp.employeeId}
                              className="text-xs bg-white rounded p-2 border border-slate-200 flex items-center gap-2"
                            >
                              <Avatar className="h-6 w-6 border border-slate-200">
                                <AvatarImage src={emp.avatarUrl} />
                                <AvatarFallback className="text-[10px] bg-slate-100">
                                  {emp.employeeName.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-slate-700 truncate">{emp.employeeName}</div>
                                <div className="flex flex-col gap-0.5 mt-1 text-[10px]">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {emp.hasDeadline ? (
                                      <>
                                        <span className="text-slate-500">
                                          Deadline: <span className="font-medium">{emp.deadlineHours}h</span>
                                        </span>
                                        <span className="text-slate-400">→</span>
                                      </>
                                    ) : (
                                      <span className="text-slate-500 italic">Sin deadline</span>
                                    )}
                                    <span className="text-blue-600">
                                      Plan: <span className="font-medium">{emp.plannedHours}h</span>
                                    </span>
                                    <span className="text-emerald-600">
                                      Comp: <span className="font-medium">{emp.computedHours}h</span>
                                    </span>
                                    <span className="text-slate-400">→</span>
                                    <span className={cn("font-bold", empIsPositive ? "text-amber-600" : "text-blue-600")}>
                                      {empIsPositive ? '+' : ''}{emp.difference}h
                                    </span>
                                  </div>
                                </div>
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
