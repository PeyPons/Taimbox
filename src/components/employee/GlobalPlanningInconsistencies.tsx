import { useMemo, memo, useState, useEffect, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAgency } from '@/contexts/AgencyContext';
import { useDepartmentView } from '@/contexts/DepartmentViewContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandItem, CommandList, CommandInput, CommandEmpty } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertTriangle, CheckCircle2, Users, TrendingUp, TrendingDown,
  Info, ChevronDown, ChevronUp, Filter, Check, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CONSTANTS } from '@/config/constants';
import { useProjectAliasing } from '@/hooks/useProjectAliasing';
import { Deadline } from '@/types';
import { fetchDeadlinesForMonth } from '@/utils/deadlineUtils';
import { format, isSameMonth, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { isAllocationInEffectiveMonth } from '@/utils/dateUtils';
import { es } from 'date-fns/locale';
import { normalizeDepartments, employeeBelongsToDepartment } from '@/utils/departmentUtils';

interface GlobalPlanningInconsistenciesProps {
  viewDate: Date;
  /** Búsqueda global desde Seguimiento operativo: filtra por proyecto/cliente */
  searchQuery?: string | null;
  /** Si true (Seguimiento operativo), no se muestran búsqueda ni dropdown de proyecto; solo filtro por empleado */
  hideProjectSearch?: boolean;
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
  viewDate,
  searchQuery: searchQueryProp = null,
  hideProjectSearch = false
}: GlobalPlanningInconsistenciesProps) {
  const { allocations, projects, employees, clients } = useApp();
  const { currentAgency } = useAgency();
  const { selectedDepartmentId } = useDepartmentView();
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [openFilterEmployee, setOpenFilterEmployee] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [openFilterProject, setOpenFilterProject] = useState(false);
  const [coherenceSearchQuery, setCoherenceSearchQuery] = useState('');
  const listTopRef = useRef<HTMLDivElement>(null);
  const { formatName: formatProjectName } = useProjectAliasing();

  const showLocalProjectSearch = !hideProjectSearch;

  const coherenceAutoExpandMax = CONSTANTS.LIMITS.COHERENCE_AUTO_EXPAND_MAX;

  const departments = useMemo(
    () => normalizeDepartments(currentAgency?.settings?.departments),
    [currentAgency?.settings?.departments]
  );

  const employeesForView = useMemo(() => {
    if (!selectedDepartmentId || !departments.length) return employees;
    const dept = departments.find(d => d.id === selectedDepartmentId || d.name === selectedDepartmentId);
    if (!dept) return employees;
    return employees.filter(e => employeeBelongsToDepartment(e.department, dept.id, dept.name));
  }, [employees, selectedDepartmentId, departments]);

  const allowedEmployeeIds = useMemo(() => {
    if (!employeesForView || employeesForView.length === 0) return null as Set<string> | null;
    return new Set(employeesForView.map(e => e.id));
  }, [employeesForView]);

  const monthKey = format(viewDate, 'yyyy-MM');

  useEffect(() => {
    const loadDeadlines = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await fetchDeadlinesForMonth(monthKey, currentAgency?.id);
        if (error) throw error;
        setDeadlines(data ?? []);
      } catch (error) {
        console.error('Error cargando deadlines:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadDeadlines();
  }, [monthKey, currentAgency?.id]);

  // Calcular incoherencias globales agrupadas por proyecto
  const inconsistencies = useMemo(() => {
    if (isLoading) return [];

    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);

    // Obtener allocations del mes filtradas por la vista de departamento (si aplica)
    const monthAllocations = allocations.filter(a =>
      isAllocationInEffectiveMonth(a.weekStartDate, viewDate) &&
      (!allowedEmployeeIds || allowedEmployeeIds.has(a.employeeId))
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

      // Un Map por employeeId evita duplicados (un empleado solo aparece una vez por proyecto)
      const employeeMap = new Map<string, Inconsistency['employees'][0]>();
      let totalDeadline = 0;
      let totalPlanned = 0;
      let totalComputed = 0;

      // Procesar cada empleado en el deadline (solo si sigue existiendo en la agencia y pasa el filtro de departamento)
      Object.entries(deadline.employeeHours).forEach(([empId, deadlineHrs]) => {
        const emp = employees.find(e => e.id === empId);
        if (!emp) return; // Omitir empleados eliminados para no mostrar "Desconocido"
        if (allowedEmployeeIds && !allowedEmployeeIds.has(empId)) return;
        const empAllocs = allocationsByProjectAndEmployee[projectId]?.[empId] || { planned: 0, computed: 0 };
        const total = empAllocs.planned + empAllocs.computed;
        const diff = round2(total - deadlineHrs);

        employeeMap.set(empId, {
          employeeId: empId,
          employeeName: emp.name,
          avatarUrl: emp.avatarUrl,
          deadlineHours: deadlineHrs,
          plannedHours: round2(empAllocs.planned),
          computedHours: round2(empAllocs.computed),
          difference: diff,
          hasDeadline: true
        });
        totalDeadline += deadlineHrs;
        totalPlanned += empAllocs.planned;
        totalComputed += empAllocs.computed;
      });

      // También incluir empleados con horas pero sin deadline en este proyecto (sin duplicar)
      Object.entries(allocationsByProjectAndEmployee[projectId] || {}).forEach(([empId, allocs]) => {
        if (employeeMap.has(empId)) return; // Ya está por el deadline
        if (!deadline.employeeHours[empId] && (allocs.planned > 0 || allocs.computed > 0)) {
          const emp = employees.find(e => e.id === empId);
          if (!emp) return; // Omitir empleados eliminados
          if (allowedEmployeeIds && !allowedEmployeeIds.has(empId)) return;
          const total = allocs.planned + allocs.computed;

          employeeMap.set(empId, {
            employeeId: empId,
            employeeName: emp.name,
            avatarUrl: emp.avatarUrl,
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

      const employeeInconsistencies = Array.from(employeeMap.values());

      // SIEMPRE registrar el proyecto si tiene deadline, aunque no haya inconsistencias
      // Esto evita que se procese después como "sin deadline"
      // Solo mostramos la tarjeta si hay inconsistencias reales
      const effectiveBudget = deadline.budgetOverride !== undefined && deadline.budgetOverride !== null
        ? deadline.budgetOverride
        : (project.budgetHours || 0);

      projectInconsistencies[projectId] = {
        projectId,
        projectName: project.name,
        employees: employeeInconsistencies, // Puede estar vacío si todo coincide
        totalDeadlineHours: totalDeadline,
        totalPlannedHours: round2(totalPlanned),
        totalComputedHours: round2(totalComputed),
        totalDifference: round2((totalPlanned + totalComputed) - totalDeadline),
        budgetHours: effectiveBudget,
        minimumHours: project.minimumHours || 0
      };
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
          if (!emp) return; // Omitir empleados eliminados (no mostrar "Desconocido")
          if (allowedEmployeeIds && !allowedEmployeeIds.has(empId)) return;
          employeeInconsistencies.push({
            employeeId: empId,
            employeeName: emp.name,
            avatarUrl: emp.avatarUrl,
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
          budgetHours: project.budgetHours || 0, // No hay deadline, usamos el budget base
          minimumHours: project.minimumHours || 0
        };
      }
    });

    // Filtrar por empleado si está seleccionado
    let filtered = Object.values(projectInconsistencies);

    // Filtro de proyecto solo cuando mostramos el selector local (no en Seguimiento operativo)
    if (!hideProjectSearch && selectedProjectId !== 'all') {
      filtered = filtered.filter(proj => proj.projectId === selectedProjectId);
    }

    if (selectedEmployeeId !== 'all') {
      filtered = filtered.map(proj => ({
        ...proj,
        employees: proj.employees.filter(emp => emp.employeeId === selectedEmployeeId)
      })).filter(proj => proj.employees.length > 0);
    }

    return filtered.sort((a, b) => Math.abs(b.totalDifference) - Math.abs(a.totalDifference));
  }, [deadlines, allocations, projects, employees, viewDate, isLoading, selectedEmployeeId, selectedProjectId, hideProjectSearch, allowedEmployeeIds]);

  // Expandir todos solo si hay pocos; con muchos (ej. 100+) mantener colapsados para rendimiento
  useEffect(() => {
    if (inconsistencies.length > 0 && inconsistencies.length <= coherenceAutoExpandMax) {
      setExpandedProjects(new Set(inconsistencies.map(inc => inc.projectId)));
    } else if (inconsistencies.length > coherenceAutoExpandMax) {
      setExpandedProjects(new Set());
    }
  }, [inconsistencies, coherenceAutoExpandMax]);

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

  const filteredBySearch = useMemo(() => {
    const q = (hideProjectSearch ? (searchQueryProp ?? '').trim() : coherenceSearchQuery.trim()).toLowerCase();
    if (!q) return inconsistencies;
    return inconsistencies.filter(inc => {
      const proj = projects.find(p => p.id === inc.projectId);
      const clientName = proj ? (clients || []).find(c => c.id === proj.clientId)?.name ?? '' : '';
      const projectName = formatProjectName(inc.projectName);
      return projectName.toLowerCase().includes(q) || (clientName && clientName.toLowerCase().includes(q));
    });
  }, [inconsistencies, hideProjectSearch, searchQueryProp, coherenceSearchQuery, projects, clients, formatProjectName]);

  const expandAll = () => setExpandedProjects(new Set(filteredBySearch.map(inc => inc.projectId)));
  const collapseAll = () => setExpandedProjects(new Set());
  const allExpanded = filteredBySearch.length > 0 && filteredBySearch.every(inc => expandedProjects.has(inc.projectId));
  const noneExpanded = expandedProjects.size === 0;

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
      <Card className="border-l-4 border-l-amber-500 overflow-hidden min-w-0">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2 min-w-0">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <span className="truncate">Coherencia de planificación global</span>
              <Tooltip>
                <TooltipTrigger className="shrink-0">
                  <Info className="h-4 w-4 text-slate-400" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[min(300px,calc(100vw-2rem))]">
                  <p className="text-xs">
                    Vista global de diferencias entre lo planificado en deadlines y lo realmente ejecutado.
                    Agrupado por proyecto para evitar duplicidades.
                  </p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <div className="flex flex-col gap-2 w-full sm:w-auto min-w-0">
              {showLocalProjectSearch && (
                <>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="text-xs text-slate-600">Filtros y búsqueda</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative min-w-[200px] w-full sm:w-auto">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por proyecto o cliente..."
                        value={coherenceSearchQuery}
                        onChange={(e) => setCoherenceSearchQuery(e.target.value)}
                        className="pl-9 h-10"
                        aria-label="Buscar en coherencia"
                      />
                    </div>
                    <Popover open={openFilterProject} onOpenChange={setOpenFilterProject}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="min-w-[220px] h-10 text-sm justify-between font-normal">
                          <span className="truncate">{selectedProjectId === 'all' ? 'Todos los proyectos' : formatProjectName(projects.find(p => p.id === selectedProjectId)?.name ?? '')}</span>
                          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="min-w-[300px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Buscar proyecto..." />
                          <CommandList className="max-h-[320px]">
                            <CommandEmpty>No se encontraron proyectos.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem value="Todos los proyectos" className="py-2.5" onSelect={() => { setSelectedProjectId('all'); setOpenFilterProject(false); }}>
                                <Check className={cn('mr-2 h-4 w-4 shrink-0', selectedProjectId === 'all' ? 'opacity-100' : 'opacity-0')} />
                                Todos los proyectos
                              </CommandItem>
                              {projects.map(proj => (
                                <CommandItem key={proj.id} value={formatProjectName(proj.name || '')} className="py-2.5" onSelect={() => { setSelectedProjectId(proj.id); setOpenFilterProject(false); }}>
                                  <Check className={cn('mr-2 h-4 w-4 shrink-0', selectedProjectId === proj.id ? 'opacity-100' : 'opacity-0')} />
                                  <span className="truncate">{formatProjectName(proj.name)}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </>
              )}
              <div className={cn('flex flex-wrap items-center gap-3', !showLocalProjectSearch && 'mt-0')}>
                <Popover open={openFilterEmployee} onOpenChange={setOpenFilterEmployee}>
                  <PopoverTrigger asChild>
                    <div className="relative min-w-[220px] cursor-pointer" role="button" tabIndex={0} onClick={() => setOpenFilterEmployee(true)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenFilterEmployee(true); } }}>
                      <Input
                        readOnly
                        value={selectedEmployeeId === 'all' ? '' : employees.find(e => e.id === selectedEmployeeId)?.name ?? ''}
                        placeholder="Filtrar por empleado..."
                        className="pr-9 h-10 cursor-pointer bg-background"
                        aria-label="Filtrar por empleado"
                      />
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="min-w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar empleado..." />
                      <CommandList className="max-h-[320px]">
                        <CommandEmpty>No se encontraron empleados.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem value="Todos los empleados" className="py-2.5" onSelect={() => { setSelectedEmployeeId('all'); setOpenFilterEmployee(false); }}>
                            <Check className={cn('mr-2 h-4 w-4 shrink-0', selectedEmployeeId === 'all' ? 'opacity-100' : 'opacity-0')} />
                            Todos los empleados
                          </CommandItem>
                          {employees.filter(e => e.isActive).map(emp => (
                            <CommandItem key={emp.id} value={emp.name || ''} className="py-2.5" onSelect={() => { setSelectedEmployeeId(emp.id); setOpenFilterEmployee(false); }}>
                              <Check className={cn('mr-2 h-4 w-4 shrink-0', selectedEmployeeId === emp.id ? 'opacity-100' : 'opacity-0')} />
                              {emp.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3" ref={listTopRef}>
          <p className="text-sm text-slate-600">
            Se han detectado <strong>{filteredBySearch.length}</strong> proyecto{filteredBySearch.length !== 1 ? 's' : ''}
            {' '}con variaciones en {format(viewDate, 'MMMM yyyy', { locale: es })}
            {(coherenceSearchQuery.trim() || (searchQueryProp ?? '').trim()) && inconsistencies.length !== filteredBySearch.length && ' (filtrado por búsqueda)'}.
          </p>

          {filteredBySearch.length === 0 && inconsistencies.length > 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">Ningún resultado con la búsqueda actual.</p>
          ) : null}

          {filteredBySearch.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={expandAll} disabled={allExpanded}>
                <ChevronDown className="h-3.5 w-3.5 mr-1" />
                Expandir todo
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={collapseAll} disabled={noneExpanded}>
                <ChevronUp className="h-3.5 w-3.5 mr-1" />
                Colapsar todo
              </Button>
            </div>
          )}

          <div className="space-y-2">
            {filteredBySearch.map(inc => {
              const isExpanded = expandedProjects.has(inc.projectId);
              const hasEmployees = inc.employees.length > 0;
              const isPositive = inc.totalDifference > 0;

              return (
                <div
                  key={`proj-${inc.projectId}`}
                  className={cn(
                    "border rounded-lg p-3 transition-colors min-w-0 overflow-hidden",
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
                      <div className="flex items-center gap-3 mt-1.5 text-xs flex-wrap gap-y-1">
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
                        {inc.employees.map((emp, empIndex) => {
                          const empIsPositive = emp.difference > 0;
                          return (
                            <div
                              key={`emp-${emp.employeeId}-${empIndex}`}
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
                                      <span className="text-amber-600 italic font-medium">No incluido en deadline</span>
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
