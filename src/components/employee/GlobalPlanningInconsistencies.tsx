import { useMemo, memo, useState, useEffect, useRef } from 'react';
import { useAppAllocations, useAppEmployees, useAppProjects } from '@/contexts/AppContext';
import { useAgency } from '@/contexts/AgencyContext';
import { useDepartmentView } from '@/contexts/DepartmentViewContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandItem, CommandList, CommandInput, CommandEmpty } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle, CheckCircle2, Users, TrendingUp, TrendingDown,
  Info, ChevronDown, ChevronUp, Filter, Check, Search,
  Ban, CircleDashed, Clock, AlertOctagon, LayoutGrid, ListTodo, Pencil
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CONSTANTS } from '@/config/constants';
import { useProjectAliasing } from '@/hooks/useProjectAliasing';
import type { Allocation, Deadline } from '@/types';
import { fetchDeadlinesForMonth } from '@/utils/deadlineUtils';
import { format, parseISO, endOfWeek, isSameMonth, type Locale } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { normalizeDepartments, employeeBelongsToDepartment } from '@/utils/departmentUtils';
import { SensitiveText } from '@/components/privacy/SensitiveText';
import { usePrivacyDemo } from '@/contexts/PrivacyDemoContext';
import { computeGlobalPlanningInconsistencies, filterInconsistenciesBySearch, type Inconsistency } from '@/utils/planningInconsistencies';
import { round2 } from '@/utils/numbers';
import type { ProjectRowItem, ProjectStatusType } from '@/hooks/useOperationsRadarData';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { usePermissions } from '@/hooks/usePermissions';
import { CoherenceAllocationEditDialog } from '@/components/employee/CoherenceAllocationEditDialog';

const WEEK_START_MONDAY = { weekStartsOn: 1 as const };

/** Rango calendario de la semana de la tarea (lun–dom), p. ej. "7–13 abr" o "31 mar – 6 abr". */
function formatTaskWeekCalendarSpan(weekStartIso: string, locale: Locale): string {
  const start = parseISO(weekStartIso);
  const end = endOfWeek(start, WEEK_START_MONDAY);
  if (isSameMonth(start, end)) {
    return `${format(start, 'd', { locale })}–${format(end, 'd MMM', { locale })}`;
  }
  return `${format(start, 'd MMM', { locale })} – ${format(end, 'd MMM', { locale })}`;
}

export interface GlobalPlanningOperationsRadarBridge {
  rowsWithStatus: ProjectRowItem[];
  statusFilter: 'all' | ProjectStatusType;
  onStatusFilterChange: (v: 'all' | ProjectStatusType) => void;
  filterCounts: {
    all: number;
    'no-activity': number;
    'needs-planning': number;
    'behind-schedule': number;
    'over-budget': number;
    'in-rule': number;
  };
  projectDetailsByProjectId: Map<string, { pendingTasks: Allocation[]; completedTasks: Allocation[] }>;
}

interface GlobalPlanningInconsistenciesProps {
  viewDate: Date;
  /** Texto de búsqueda (proyecto/cliente). En Seguimiento operativo suele ir con `onSearchQueryChange` en la misma fila que el empleado. */
  searchQuery?: string | null;
  onSearchQueryChange?: (value: string) => void;
  /** Si true (Seguimiento operativo), no se muestra el dropdown de proyecto; búsqueda + empleado en la misma fila si hay `onSearchQueryChange`. */
  hideProjectSearch?: boolean;
  /** En Seguimiento operativo: etiquetas de estado, filtros predefinidos y detalle de tareas del radar */
  operationsRadar?: GlobalPlanningOperationsRadarBridge;
}

export const GlobalPlanningInconsistencies = memo(function GlobalPlanningInconsistencies({
  viewDate,
  searchQuery: searchQueryProp = null,
  onSearchQueryChange,
  hideProjectSearch = false,
  operationsRadar,
}: GlobalPlanningInconsistenciesProps) {
  const { allocations } = useAppAllocations();
  const { employees, currentUser } = useAppEmployees();
  const { hasPermission } = usePermissions();
  const canAssignTasksToOthers = hasPermission('can_assign_tasks_to_others');
  const { projects, clients } = useAppProjects();
  const { currentAgency } = useAgency();
  const preference = currentAgency?.settings?.hoursTrackingPreference;
  const { selectedDepartmentId } = useDepartmentView();
  const { t, i18n } = useAppTranslation();
  const dateLocale = i18n.language?.toLowerCase().startsWith('en') ? enUS : es;
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [openFilterEmployee, setOpenFilterEmployee] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [openFilterProject, setOpenFilterProject] = useState(false);
  const [coherenceSearchQuery, setCoherenceSearchQuery] = useState('');
  const [tasksModalProjectId, setTasksModalProjectId] = useState<string | null>(null);
  const [coherenceEditTask, setCoherenceEditTask] = useState<Allocation | null>(null);
  const listTopRef = useRef<HTMLDivElement>(null);
  const { formatName: formatProjectName } = useProjectAliasing();
  const { isActive: isPrivacyDemo, anonymizer: privacyAnonymizer } = usePrivacyDemo();

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

  const departmentNameForView = useMemo(() => {
    if (!selectedDepartmentId) return null;
    const d = departments.find(x => x.id === selectedDepartmentId || x.name === selectedDepartmentId);
    return d?.name ?? null;
  }, [selectedDepartmentId, departments]);

  const radarRowByProjectId = useMemo(() => {
    const map = new Map<string, ProjectRowItem>();
    (operationsRadar?.rowsWithStatus ?? []).forEach(row => map.set(row.projectId, row));
    return map;
  }, [operationsRadar?.rowsWithStatus]);

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

  const inconsistencies = useMemo(() => {
    if (isLoading) return [];

    return computeGlobalPlanningInconsistencies({
      deadlines,
      allocations,
      projects,
      employees,
      viewDate,
      allowedEmployeeIds,
      selectedEmployeeId,
      selectedProjectId,
      hideProjectSearch,
      hoursTrackingPreference: preference,
    });
  }, [
    deadlines,
    allocations,
    projects,
    employees,
    viewDate,
    isLoading,
    selectedEmployeeId,
    selectedProjectId,
    hideProjectSearch,
    allowedEmployeeIds,
    preference,
  ]);

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
    return filterInconsistenciesBySearch({
      inconsistencies,
      query: q,
      projects,
      clients: clients || [],
      formatProjectName,
    });
  }, [inconsistencies, hideProjectSearch, searchQueryProp, coherenceSearchQuery, projects, clients, formatProjectName]);

  const filteredCoherence = useMemo(() => {
    if (!operationsRadar || operationsRadar.statusFilter === 'all') return filteredBySearch;
    return filteredBySearch.filter(inc => {
      const row = radarRowByProjectId.get(inc.projectId);
      const st = row?.status ?? 'in-rule';
      return st === operationsRadar.statusFilter;
    });
  }, [filteredBySearch, operationsRadar, radarRowByProjectId]);

  const expandAll = () => setExpandedProjects(new Set(filteredCoherence.map(inc => inc.projectId)));
  const collapseAll = () => setExpandedProjects(new Set());
  const allExpanded = filteredCoherence.length > 0 && filteredCoherence.every(inc => expandedProjects.has(inc.projectId));
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
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <CardTitle className="text-base flex items-center gap-2 shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <span className="leading-snug">Coherencia de planificación global</span>
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
            <div className="flex w-full min-w-0 flex-1 flex-col gap-2">
              {showLocalProjectSearch && (
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="text-xs text-slate-600">Filtros y búsqueda</span>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3">
                {showLocalProjectSearch && (
                  <>
                    <div className="relative min-w-[200px] flex-1 sm:flex-initial sm:min-w-[200px] max-w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
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
                        <Button variant="outline" className="min-w-[220px] h-10 text-sm justify-between font-normal w-full sm:w-auto">
                          <span className="truncate">
                            {selectedProjectId === 'all'
                              ? 'Todos los proyectos'
                              : (
                                  <SensitiveText kind="project" id={selectedProjectId}>
                                    {formatProjectName(projects.find(p => p.id === selectedProjectId)?.name ?? '')}
                                  </SensitiveText>
                                )}
                          </span>
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
                                  <span className="truncate">
                                    <SensitiveText kind="project" id={proj.id}>{formatProjectName(proj.name)}</SensitiveText>
                                  </span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </>
                )}
                {hideProjectSearch && onSearchQueryChange && (
                  <div className="relative min-w-[200px] flex-1 sm:flex-initial sm:min-w-[220px] max-w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder={t('operationsRadar.searchPlaceholder')}
                      value={searchQueryProp ?? ''}
                      onChange={(e) => onSearchQueryChange(e.target.value)}
                      className="pl-9 h-10"
                      aria-label={t('operationsRadar.searchAria')}
                    />
                  </div>
                )}
                <Popover open={openFilterEmployee} onOpenChange={setOpenFilterEmployee}>
                  <PopoverTrigger asChild>
                    <div
                      className="relative min-w-[220px] flex-1 sm:flex-initial max-w-full cursor-pointer"
                      role="button"
                      tabIndex={0}
                      onClick={() => setOpenFilterEmployee(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setOpenFilterEmployee(true);
                        }
                      }}
                    >
                      <Input
                        readOnly
                        value={selectedEmployeeId === 'all' ? '' : (isPrivacyDemo ? privacyAnonymizer.employee(selectedEmployeeId) : (employees.find(e => e.id === selectedEmployeeId)?.name ?? ''))}
                        placeholder={t('operationsRadar.coherenceEmployeeFilterPlaceholder', 'Filtrar por empleado...')}
                        className="pr-9 h-10 cursor-pointer bg-background"
                        aria-label={t('operationsRadar.coherenceEmployeeFilterAria', 'Filtrar por empleado')}
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
                              <SensitiveText kind="employee" id={emp.id}>{emp.name}</SensitiveText>
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
          {hideProjectSearch && departmentNameForView && (
            <CardDescription className="pt-1 text-xs">
              <span className="text-amber-700 font-medium">
                {t('operationsRadar.filteredView', { department: departmentNameForView, defaultValue: 'Vista filtrada por departamento: {{department}}' })}
              </span>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-3" ref={listTopRef}>
          <p className="text-sm text-slate-600">
            Se han detectado <strong>{filteredCoherence.length}</strong> proyecto{filteredCoherence.length !== 1 ? 's' : ''}
            {' '}con variaciones en {format(viewDate, 'MMMM yyyy', { locale: es })}
            {(coherenceSearchQuery.trim() || (searchQueryProp ?? '').trim()) && inconsistencies.length !== filteredBySearch.length && ' (filtrado por búsqueda)'}
            {operationsRadar && operationsRadar.statusFilter !== 'all' && filteredBySearch.length !== filteredCoherence.length && ` (${t('operationsRadar.coherenceStatusFilterNote', 'filtrado por estado operativo')})`}.
          </p>

          {operationsRadar && (
            <div className="flex flex-col gap-2">
              <span className="text-xs text-slate-600">{t('operationsRadar.coherenceStatusFiltersLabel', 'Estado operativo del mes')}</span>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant={operationsRadar.statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => operationsRadar.onStatusFilterChange('all')}
                  className={cn('h-8 text-xs gap-1.5', operationsRadar.statusFilter === 'all' ? 'bg-slate-900' : 'bg-white')}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  {t('operationsRadar.filterAll', 'Todos')}
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                    {operationsRadar.filterCounts.all}
                  </Badge>
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={operationsRadar.statusFilter === 'no-activity' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => operationsRadar.onStatusFilterChange('no-activity')}
                      className={cn(
                        'h-8 text-xs gap-1.5',
                        operationsRadar.statusFilter === 'no-activity' ? 'bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      <Ban className="h-3.5 w-3.5" />
                      {t('operationsRadar.filterNoActivity', 'Sin actividad')}
                      {operationsRadar.filterCounts['no-activity'] > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px] bg-slate-200">
                          {operationsRadar.filterCounts['no-activity']}
                        </Badge>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[200px] text-center">
                    <p className="text-xs">{t('operationsRadar.tooltipNoActivity')}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={operationsRadar.statusFilter === 'needs-planning' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => operationsRadar.onStatusFilterChange('needs-planning')}
                      className={cn(
                        'h-8 text-xs gap-1.5',
                        operationsRadar.statusFilter === 'needs-planning' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-white border-amber-200 text-amber-700 hover:bg-amber-50'
                      )}
                    >
                      <CircleDashed className="h-3.5 w-3.5" />
                      {t('operationsRadar.filterNeedsPlanning', 'Falta planificar')}
                      {operationsRadar.filterCounts['needs-planning'] > 0 && (
                        <Badge
                          className={cn(
                            'ml-1 h-5 px-1.5 text-[10px]',
                            operationsRadar.statusFilter === 'needs-planning' ? 'bg-amber-700' : 'bg-amber-100 text-amber-700'
                          )}
                        >
                          {operationsRadar.filterCounts['needs-planning']}
                        </Badge>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[200px] text-center">
                    <p className="text-xs">{t('operationsRadar.tooltipNeedsPlanning')}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={operationsRadar.statusFilter === 'behind-schedule' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => operationsRadar.onStatusFilterChange('behind-schedule')}
                      className={cn(
                        'h-8 text-xs gap-1.5',
                        operationsRadar.statusFilter === 'behind-schedule' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-white border-orange-200 text-orange-700 hover:bg-orange-50'
                      )}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      {t('operationsRadar.filterBehindSchedule', 'Retrasados')}
                      {operationsRadar.filterCounts['behind-schedule'] > 0 && (
                        <Badge
                          className={cn(
                            'ml-1 h-5 px-1.5 text-[10px]',
                            operationsRadar.statusFilter === 'behind-schedule' ? 'bg-orange-700' : 'bg-orange-100 text-orange-700'
                          )}
                        >
                          {operationsRadar.filterCounts['behind-schedule']}
                        </Badge>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[220px] text-center">
                    <p className="text-xs">{t('operationsRadar.tooltipBehindSchedule')}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={operationsRadar.statusFilter === 'over-budget' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => operationsRadar.onStatusFilterChange('over-budget')}
                      className={cn(
                        'h-8 text-xs gap-1.5',
                        operationsRadar.statusFilter === 'over-budget' ? 'bg-red-600 hover:bg-red-700' : 'bg-white border-red-200 text-red-700 hover:bg-red-50'
                      )}
                    >
                      <AlertOctagon className="h-3.5 w-3.5" />
                      {t('operationsRadar.filterOverBudget', 'Exceso horas')}
                      {operationsRadar.filterCounts['over-budget'] > 0 && (
                        <Badge
                          className={cn(
                            'ml-1 h-5 px-1.5 text-[10px]',
                            operationsRadar.statusFilter === 'over-budget' ? 'bg-red-700' : 'bg-red-100 text-red-700'
                          )}
                        >
                          {operationsRadar.filterCounts['over-budget']}
                        </Badge>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[200px] text-center">
                    <p className="text-xs">{t('operationsRadar.tooltipOverBudget')}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={operationsRadar.statusFilter === 'in-rule' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => operationsRadar.onStatusFilterChange('in-rule')}
                      className={cn(
                        'h-8 text-xs gap-1.5',
                        operationsRadar.statusFilter === 'in-rule' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                      )}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {t('operationsRadar.filterInRule', 'En regla')}
                      {operationsRadar.filterCounts['in-rule'] > 0 && (
                        <Badge
                          className={cn(
                            'ml-1 h-5 px-1.5 text-[10px]',
                            operationsRadar.statusFilter === 'in-rule' ? 'bg-emerald-700' : 'bg-emerald-100 text-emerald-700'
                          )}
                        >
                          {operationsRadar.filterCounts['in-rule']}
                        </Badge>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[220px] text-center">
                    <p className="text-xs">{t('operationsRadar.tooltipInRule')}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          )}

          {filteredBySearch.length === 0 && inconsistencies.length > 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">Ningún resultado con la búsqueda actual.</p>
          ) : null}

          {filteredCoherence.length === 0 && filteredBySearch.length > 0 && operationsRadar && operationsRadar.statusFilter !== 'all' ? (
            <div className="text-center py-4 space-y-2 border rounded-lg bg-slate-50 border-dashed">
              <p className="text-sm text-slate-600">{t('operationsRadar.noResults')}</p>
              <Button variant="outline" size="sm" onClick={() => operationsRadar.onStatusFilterChange('all')}>
                {t('operationsRadar.showAll', 'Ver todos')}
              </Button>
            </div>
          ) : null}

          {filteredCoherence.length > 0 && (
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
            {filteredCoherence.map(inc => {
              const isExpanded = expandedProjects.has(inc.projectId);
              const hasEmployees = inc.employees.length > 0;
              const isPositive = inc.totalDifference > 0;
              const radarRow = radarRowByProjectId.get(inc.projectId);
              const opStatus = radarRow?.status ?? 'in-rule';
              const hoursToCompute =
                radarRow && radarRow.budget > 0 ? round2(Math.max(0, radarRow.budget - radarRow.computed)) : null;
              const statusLabel =
                opStatus === 'over-budget'
                  ? t('operationsRadar.filterOverBudget', 'Exceso horas')
                  : opStatus === 'behind-schedule'
                    ? t('operationsRadar.filterBehindSchedule', 'Retrasados')
                    : opStatus === 'needs-planning'
                      ? t('operationsRadar.filterNeedsPlanning', 'Falta planificar')
                      : opStatus === 'no-activity'
                        ? t('operationsRadar.filterNoActivity', 'Sin actividad')
                        : t('operationsRadar.filterInRule', 'En regla');

              return (
                <div
                  key={`proj-${inc.projectId}`}
                  className={cn(
                    "border rounded-lg p-3 transition-colors min-w-0 overflow-hidden",
                    isPositive ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={cn(
                        'flex-1 min-w-0',
                        hasEmployees && [
                          'cursor-pointer rounded-md -m-1 p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50',
                          isPositive ? 'hover:bg-amber-100/45' : 'hover:bg-blue-100/45',
                        ]
                      )}
                      role={hasEmployees ? 'button' : undefined}
                      tabIndex={hasEmployees ? 0 : undefined}
                      aria-expanded={hasEmployees ? isExpanded : undefined}
                      aria-label={
                        hasEmployees
                          ? isExpanded
                            ? t('operationsRadar.coherenceCollapseEmployees', 'Colapsar detalle por empleado')
                            : t('operationsRadar.coherenceExpandEmployees', 'Desplegar detalle por empleado')
                          : undefined
                      }
                      onClick={hasEmployees ? () => toggleProject(inc.projectId) : undefined}
                      onKeyDown={
                        hasEmployees
                          ? (e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                toggleProject(inc.projectId);
                              }
                            }
                          : undefined
                      }
                    >
                      <div className="flex flex-wrap items-center gap-2 gap-y-1">
                        <div className="font-semibold text-sm text-slate-800 truncate min-w-0">
                          <SensitiveText kind="project" id={inc.projectId}>
                            {formatProjectName(inc.projectName)}
                          </SensitiveText>
                        </div>
                        {operationsRadar && (
                          <Badge
                            variant="outline"
                            className={cn(
                              'shrink-0 text-[10px]',
                              opStatus === 'over-budget' && 'bg-red-100 text-red-800 border-red-200',
                              opStatus === 'behind-schedule' && 'bg-orange-100 text-orange-800 border-orange-200',
                              opStatus === 'needs-planning' && 'bg-amber-100 text-amber-800 border-amber-200',
                              opStatus === 'no-activity' && 'bg-slate-100 text-slate-700 border-slate-200',
                              opStatus === 'in-rule' && 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            )}
                          >
                            {statusLabel}
                          </Badge>
                        )}
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
                      {inc.totalDeadlineHours === 0 && (
                        <div className="mt-1.5 text-[11px] text-amber-800 font-medium px-2 py-1 rounded border border-amber-200 bg-amber-50/80">
                          {t(
                            'operationsRadar.coherenceNoDeadlineBanner',
                            'Este proyecto no figura en el deadline del mes; la fila de abajo resume planificación y computo del equipo.'
                          )}
                        </div>
                      )}
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
                            {hoursToCompute !== null && operationsRadar && (
                              <>
                                <span className="text-slate-300">→</span>
                                <div className="flex items-center gap-1 text-blue-600">
                                  <span className="text-slate-500">{t('operationsRadar.toCompute', 'Por computar')}</span>
                                  <span className="font-mono font-medium">{hoursToCompute}h</span>
                                </div>
                              </>
                            )}
                            <span className="text-slate-300">→</span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 font-bold text-amber-700 cursor-help border-b border-dotted border-amber-400/50">
                                  <TrendingUp className="h-3 w-3" />
                                  +{inc.totalDifference}h
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="max-w-[260px] text-xs">
                                {t(
                                  'operationsRadar.coherenceNoDeadlineSumTooltip',
                                  'No hay deadline de referencia este mes: este valor es la suma de planificado + computado del equipo (aparece como alerta porque no se puede contrastar con un objetivo en Deadlines).'
                                )}
                              </TooltipContent>
                            </Tooltip>
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
                            {hoursToCompute !== null && operationsRadar && (
                              <>
                                <span className="text-slate-300">→</span>
                                <div className="flex items-center gap-1 text-blue-600">
                                  <span className="text-slate-500">{t('operationsRadar.toCompute', 'Por computar')}</span>
                                  <span className="font-mono font-medium">{hoursToCompute}h</span>
                                </div>
                              </>
                            )}
                            <span className="text-slate-300">→</span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn(
                                    'flex items-center gap-1 font-bold cursor-help border-b border-dotted',
                                    isPositive ? 'text-amber-700 border-amber-500/40' : 'text-blue-700 border-blue-500/40'
                                  )}
                                >
                                  {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                  {isPositive ? '+' : ''}
                                  {inc.totalDifference}h
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="max-w-[260px] text-xs">
                                {t(
                                  'operationsRadar.coherenceDeadlineDeltaTooltip',
                                  'Plan + computado del mes, menos el total del deadline. Negativo: aún queda margen respecto al deadline; positivo: por encima del acuerdo reflejado en el deadline.'
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-1 shrink-0">
                      {operationsRadar && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs shrink-0"
                          onClick={() => setTasksModalProjectId(inc.projectId)}
                        >
                          <ListTodo className="h-3.5 w-3.5 mr-1 shrink-0" />
                          {t('operationsRadar.coherenceTasksButton', 'Tareas')}
                        </Button>
                      )}
                      {hasEmployees && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleProject(inc.projectId);
                          }}
                          className="text-slate-400 hover:text-slate-600 transition-colors p-1 shrink-0"
                          aria-expanded={isExpanded}
                          aria-label={
                            isExpanded
                              ? t('operationsRadar.coherenceCollapseEmployees', 'Colapsar detalle por empleado')
                              : t('operationsRadar.coherenceExpandEmployees', 'Desplegar detalle por empleado')
                          }
                          tabIndex={-1}
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
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
                                <div className="font-medium text-slate-700 truncate">
                                  <SensitiveText kind="employee" id={emp.employeeId}>{emp.employeeName}</SensitiveText>
                                </div>
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

      <Dialog
        open={tasksModalProjectId !== null}
        onOpenChange={open => {
          if (!open) setTasksModalProjectId(null);
        }}
      >
        <DialogContent className="flex max-h-[90vh] max-w-lg flex-col gap-0 overflow-hidden sm:max-w-lg">
          <DialogHeader className="shrink-0 space-y-1 pr-8 pb-3 text-left">
            <DialogTitle className="leading-snug">
              {tasksModalProjectId ? (
                <SensitiveText kind="project" id={tasksModalProjectId}>
                  {formatProjectName(projects.find(p => p.id === tasksModalProjectId)?.name ?? '')}
                </SensitiveText>
              ) : null}
            </DialogTitle>
            <p className="text-sm font-normal text-slate-500">
              {t('operationsRadar.coherenceTasksDialogSubtitle', 'Tareas del mes en este proyecto')}
            </p>
          </DialogHeader>
          {tasksModalProjectId && operationsRadar ? (
            <div
              className="max-h-[min(520px,calc(90vh-7.5rem))] overflow-y-auto overflow-x-hidden overscroll-y-contain pr-2 [-webkit-overflow-scrolling:touch]"
              role="region"
              aria-label={t('operationsRadar.coherenceTasksScrollRegion', 'Lista de tareas')}
            >
              {(() => {
                const detail = operationsRadar.projectDetailsByProjectId.get(tasksModalProjectId);
                const pending = detail?.pendingTasks ?? [];
                const completed = detail?.completedTasks ?? [];
                return (
                  <Tabs defaultValue="pending" className="w-full pb-2">
                    <TabsList className="sticky top-0 z-[1] grid w-full grid-cols-2 bg-background pb-0 pt-0">
                      <TabsTrigger value="pending" className="text-xs">
                        {t('operationsRadar.coherenceTasksTabPending', 'Pendientes')}
                        {pending.length > 0 ? ` (${pending.length})` : ''}
                      </TabsTrigger>
                      <TabsTrigger value="completed" className="text-xs">
                        {t('operationsRadar.coherenceTasksTabCompleted', 'Cerradas')}
                        {completed.length > 0 ? ` (${completed.length})` : ''}
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="pending" className="mt-3 space-y-1.5">
                      {pending.length > 0 ? (
                        pending.map(task => {
                          const emp = employees?.find(e => e.id === task.employeeId);
                          const weekSpan = formatTaskWeekCalendarSpan(task.weekStartDate, dateLocale);
                          const canEditThisTask =
                            canAssignTasksToOthers || task.employeeId === currentUser?.id;
                          return (
                            <div
                              key={task.id}
                              className="flex w-full min-w-0 items-start gap-2 border bg-white py-2 pl-2 pr-2 rounded-md text-xs"
                            >
                              <div className="flex min-w-0 flex-1 items-start gap-2 overflow-hidden">
                                <Avatar className="mt-0.5 h-6 w-6 shrink-0 border">
                                  <AvatarImage src={emp?.avatarUrl} />
                                  <AvatarFallback className="bg-slate-100 text-slate-600 text-[9px] font-bold">
                                    {emp?.name?.substring(0, 2).toUpperCase() ?? '??'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1 overflow-hidden">
                                  <p className="line-clamp-2 min-w-0 break-words font-medium text-slate-800 sm:line-clamp-3">
                                    <SensitiveText kind="task" id={task.id}>
                                      {task.taskName || t('operationsRadar.unnamedTask', 'Tarea sin nombre')}
                                    </SensitiveText>
                                  </p>
                                  <p className="mt-0.5 min-w-0 truncate text-[10px] text-slate-400" title={`${emp?.name ?? ''} · ${weekSpan}`}>
                                    <SensitiveText kind="employee" id={task.employeeId}>{emp?.name ?? '—'}</SensitiveText>
                                    <span className="text-slate-300"> · </span>
                                    <span className="text-slate-500">{weekSpan}</span>
                                  </p>
                                </div>
                              </div>
                              {canEditThisTask && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 shrink-0 text-slate-500 hover:text-slate-800"
                                  onClick={() => setCoherenceEditTask(task)}
                                  aria-label={t('operationsRadar.coherenceTasksEditAria', 'Editar tarea')}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <div className="flex min-w-[3.5rem] shrink-0 flex-col items-end justify-start gap-0.5 pl-1 text-right tabular-nums">
                                <span className="whitespace-nowrap font-mono text-sm font-bold leading-tight text-slate-800">
                                  {task.hoursAssigned ?? 0}h
                                </span>
                                <span className="whitespace-nowrap text-[10px] leading-tight text-slate-400">
                                  {t('operationsRadar.estimated', 'estimadas')}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-slate-500 text-center py-6 border border-dashed rounded-md bg-slate-50">
                          {t('operationsRadar.coherenceNoPendingTasks', 'Sin tareas pendientes este mes')}
                        </p>
                      )}
                    </TabsContent>
                    <TabsContent value="completed" className="mt-3 space-y-1.5">
                      {completed.length > 0 ? (
                        completed.map(task => {
                          const emp = employees?.find(e => e.id === task.employeeId);
                          const weekSpan = formatTaskWeekCalendarSpan(task.weekStartDate, dateLocale);
                          const canEditThisTask =
                            canAssignTasksToOthers || task.employeeId === currentUser?.id;
                          return (
                            <div
                              key={task.id}
                              className="flex w-full min-w-0 items-start gap-2 border bg-slate-50/80 py-2 pl-2 pr-2 rounded-md text-xs"
                            >
                              <div className="flex min-w-0 flex-1 items-start gap-2 overflow-hidden">
                                <Avatar className="mt-0.5 h-6 w-6 shrink-0 border">
                                  <AvatarImage src={emp?.avatarUrl} />
                                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-[9px] font-bold">
                                    {emp?.name?.substring(0, 2).toUpperCase() ?? '??'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1 overflow-hidden">
                                  <p className="line-clamp-2 min-w-0 break-words font-medium text-slate-800 sm:line-clamp-3">
                                    <SensitiveText kind="task" id={task.id}>
                                      {task.taskName || t('operationsRadar.unnamedTask', 'Tarea sin nombre')}
                                    </SensitiveText>
                                  </p>
                                  <p className="mt-0.5 min-w-0 truncate text-[10px] text-slate-400" title={`${emp?.name ?? ''} · ${weekSpan}`}>
                                    <SensitiveText kind="employee" id={task.employeeId}>{emp?.name ?? '—'}</SensitiveText>
                                    <span className="text-slate-300"> · </span>
                                    <span className="text-slate-500">{weekSpan}</span>
                                  </p>
                                </div>
                              </div>
                              {canEditThisTask && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 shrink-0 text-slate-500 hover:text-slate-800"
                                  onClick={() => setCoherenceEditTask(task)}
                                  aria-label={t('operationsRadar.coherenceTasksEditAria', 'Editar tarea')}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <div className="flex min-w-[7.25rem] shrink-0 flex-col items-end justify-start gap-0.5 text-right tabular-nums">
                                <span className="max-w-full whitespace-nowrap font-mono text-[10px] leading-tight text-slate-600">
                                  {t('operationsRadar.taskEstShort', 'Est')}: {task.hoursAssigned ?? 0}h
                                </span>
                                <span className="max-w-full whitespace-nowrap font-mono text-[10px] leading-tight text-blue-600">
                                  {t('operationsRadar.actualLabel', 'Real')}: {task.hoursActual ?? task.hoursAssigned ?? 0}h
                                </span>
                                <span className="max-w-full whitespace-nowrap font-mono text-[10px] leading-tight text-emerald-600">
                                  {t('operationsRadar.computedLabel', 'Computado')}: {task.hoursComputed ?? task.hoursAssigned ?? 0}h
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-slate-500 text-center py-6 border border-dashed rounded-md bg-slate-50">
                          {t('operationsRadar.coherenceNoCompletedTasks', 'Sin tareas cerradas este mes')}
                        </p>
                      )}
                    </TabsContent>
                  </Tabs>
                );
              })()}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {coherenceEditTask ? (
        <CoherenceAllocationEditDialog
          key={coherenceEditTask.id}
          allocation={coherenceEditTask}
          viewDate={viewDate}
          deadlines={deadlines}
          onDismiss={() => setCoherenceEditTask(null)}
        />
      ) : null}
    </TooltipProvider>
  );
});
