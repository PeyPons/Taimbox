import { useState, useMemo, useEffect } from 'react';
import { useAppAbsencesAndEvents, useAppAllocationActions, useAppAllocations, useAppEmployees, useAppProjects, useAppWeeklyFeedback } from '@/contexts/AppContext';
import { useAgency } from '@/contexts/AgencyContext';
import { useDepartmentView } from '@/contexts/DepartmentViewContext';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { normalizeDepartments } from '@/utils/departmentUtils';
import { useProjectFilters } from '@/hooks/useProjectFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { format, startOfMonth, endOfMonth, isSameMonth, parseISO, addDays, startOfWeek, subMonths, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertCircle, TrendingUp, TrendingDown, CheckCircle2, Users, Plus, ArrowRight, ChevronLeft, ChevronRight, CalendarDays, Check, ChevronDown, ArrowUpDown, Search, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStorageKey, getWeeksForMonth, getMonthlyCapacity, isAllocationInEffectiveMonth } from '@/utils/dateUtils';
import { useWeeklyCloseDay } from '@/hooks/useWeeklyCloseDay';
import { getAbsenceHoursInRange } from '@/utils/absenceUtils';
import { getTeamEventHoursInRange } from '@/utils/teamEventUtils';
import { ActivityLogSection } from '@/components/shared/ActivityLogSection';
import { useProjectAliasing } from '@/hooks/useProjectAliasing';
import { useWeeklyForecastMonthData } from '@/hooks/useWeeklyForecastMonthData';
import { useWeeklyForecastFilters } from '@/hooks/useWeeklyForecastFilters';
import { useWeeklyForecastProjectForecast } from '@/hooks/useWeeklyForecastProjectForecast';
import { useWeeklyForecastTransfers } from '@/hooks/useWeeklyForecastTransfers';
import { useWeeklyForecastRedistribution } from '@/hooks/useWeeklyForecastRedistribution';
import { WeeklyForecastTransfersFilters } from '@/components/weekly-forecast/WeeklyForecastTransfersFilters';

export default function WeeklyForecastPage() {
  const { projects, clients } = useAppProjects();
  const { allocations, getEmployeeLoadForWeek, ensureMonthLoaded } = useAppAllocations();
  const { employees, currentUser } = useAppEmployees();
  const { absences, teamEvents } = useAppAbsencesAndEvents();
  const { weeklyFeedback } = useAppWeeklyFeedback();
  const { addAllocation, updateAllocation, isLoading: isGlobalLoading } = useAppAllocationActions();
  const { currentAgency } = useAgency();
  const { selectedDepartmentId } = useDepartmentView();
  const { isPlatformAdmin } = usePlatformAdmin();
  const agencyIdForData = currentUser?.agencyId ?? (isPlatformAdmin ? currentAgency?.id : undefined);

  const departments = useMemo(() => normalizeDepartments(currentAgency?.settings?.departments), [currentAgency?.settings?.departments]);

  const {
    currentMonth,
    dbTransfers,
    monthDeadlines,
    handlePrevMonth,
    handleNextMonth,
    handleToday,
  } = useWeeklyForecastMonthData({
    agencyIdForData,
    currentAgencyId: currentAgency?.id,
    ensureMonthLoaded,
    isGlobalLoading,
  });

  const { employeesForView, filteredProjectsForView } = useWeeklyForecastFilters({
    selectedDepartmentId,
    departments,
    employees: employees ?? [],
    projects: projects ?? [],
    allocations: allocations ?? [],
    currentMonth,
  });

  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [redistributeSelectedTasks, setRedistributeSelectedTasks] = useState<Set<string>>(new Set());
  const [redistributeToEmployee, setRedistributeToEmployee] = useState('');
  const [redistributeWeek, setRedistributeWeek] = useState('');
  const [filterFeedbackEmployee, setFilterFeedbackEmployee] = useState<string>('all');
  const [filterFeedbackProject, setFilterFeedbackProject] = useState<string>('all');
  const [filterTransferStatus, setFilterTransferStatus] = useState<'all' | 'pending' | 'kept' | 'distributed'>('all');
  const [filterProjectStatus, setFilterProjectStatus] = useState<string>('all'); // all, red, yellow, green
  const [filterClient, setFilterClient] = useState<string>('all');
  const { activeFilters, filterProject } = useProjectFilters();
  const weeklyCloseDay = useWeeklyCloseDay();
  const [filterId, setFilterId] = useState<string>('all');
  const [openFilterType, setOpenFilterType] = useState(false);
  const [openRedistributeEmployee, setOpenRedistributeEmployee] = useState(false);
  const [openRedistributeWeek, setOpenRedistributeWeek] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'difference' | 'contracted'>('status');
  const { formatName: formatProjectName } = useProjectAliasing();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const weeks = getWeeksForMonth(currentMonth);
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Helper para obtener el índice de la semana relativo al mes (Semana 1, 2, 3...)
  const getWeekIndex = (dateStr: string) => {
    if (!dateStr) return -1;
    // Buscamos la semana que coincida con la fecha de inicio
    const index = weeks.findIndex(w => {
      const key = getStorageKey(w.weekStart, currentMonth);
      return key === dateStr || w.weekStart.toISOString().split('T')[0] === dateStr;
    });
    return index !== -1 ? index + 1 : -1;
  };

  // Sección A: Semáforo de proyectos (month-end forecast) con filtros
  const projectForecast = useWeeklyForecastProjectForecast({
    projects: projects ?? [],
    filteredProjectsForView,
    selectedDepartmentId,
    allocations: allocations ?? [],
    clients: clients ?? [],
    monthDeadlines,
    currentMonth,
    employeesForView,
    filterClient,
    filterProjectStatus,
    filterId,
    sortBy,
    filterProject,
    hoursTrackingPreference: currentAgency?.settings?.hoursTrackingPreference,
  });

  // Sección B: Transferencias de horas (rediseñado) - muestra quién le pasó a quién
  const transfers = useWeeklyForecastTransfers({
    weeklyFeedback,
    allocations,
    employees,
    projects,
    currentMonth,
    filterFeedbackEmployee,
    filterFeedbackProject,
    filterTransferStatus,
    dbTransfers,
    selectedDepartmentId,
    employeesForView,
  });

  // Semanas futuras para el selector de redistribución
  const futureWeeks = useMemo(() => {
    const today = new Date();
    return weeks.filter(week => {
      try {
        const weekDate = parseISO(getStorageKey(week.weekStart, currentMonth));
        // Incluir semana actual si aún no ha terminado (viernes)
        const weekEnd = addDays(weekDate, 4); // Viernes
        return weekEnd >= today;
      } catch {
        return false;
      }
    });
  }, [weeks, currentMonth]);

  const { delayedTasksByEmployee, handleRedistribute } = useWeeklyForecastRedistribution({
    selectedProject,
    allocations,
    currentMonth,
    employees,
    selectedDepartmentId,
    employeesForView,
    weeklyCloseDay,
    redistributeToEmployee,
    redistributeWeek,
    redistributeSelectedTasks,
    addAllocation,
    updateAllocation,
    setRedistributeSelectedTasks,
    setRedistributeToEmployee,
    setRedistributeWeek,
    setSelectedProject,
  });

  // Carga de trabajo eliminada para evitar redundancia con TeamCapacityPage
  const employeeWorkloads = useMemo(() => [], []);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Previsión mensual</h1>
        <p className="text-slate-500 mt-1">Seguimiento de horas contratadas y redistribución de carga</p>
      </div>

      {/* Control de mes */}
      <div className="flex items-center gap-4 bg-white p-2 rounded-lg border shadow-sm w-fit">
        <h2 className="text-lg font-bold capitalize text-slate-900 flex items-center gap-2 ml-2">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h2>
        <div className="h-6 w-px bg-slate-200 mx-2" />
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleToday} className="h-7 text-xs px-2">
            <CalendarDays className="h-3.5 w-3.5 mr-1.5" />Mes actual
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* TABS */}
      <Tabs defaultValue="traffic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="traffic" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Semáforo
          </TabsTrigger>
          <TabsTrigger value="transfers" className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Transferencias
          </TabsTrigger>
          <TabsTrigger value="blockers" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Bloqueos
          </TabsTrigger>
          <TabsTrigger value="redistribute" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Redistribución
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Semáforo de proyectos */}
        <TabsContent value="traffic" className="space-y-4">
          {/* Filtros estilo Deadlines/Planner */}
          <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border shadow-sm p-3">
            <div className="flex-1 min-w-0 sm:min-w-[200px]">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full h-8 text-xs justify-between bg-white">
                    <span className="truncate">
                      {filterClient === 'all' ? 'Todos los clientes' : clients.find(c => c.id === filterClient)?.name || 'Cliente'}
                    </span>
                    <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] max-w-[calc(100vw-2rem)] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar cliente..." />
                    <CommandList>
                      <CommandEmpty>No hay clientes</CommandEmpty>
                      <CommandGroup>
                        <CommandItem onSelect={() => setFilterClient('all')}>
                          <Check className={cn("mr-2 h-4 w-4", filterClient === 'all' ? "opacity-100" : "opacity-0")} />
                          Todos los clientes
                        </CommandItem>
                        {clients.map(cli => (
                          <CommandItem key={cli.id} value={cli.name} onSelect={() => setFilterClient(cli.id)}>
                            <Check className={cn("mr-2 h-4 w-4", filterClient === cli.id ? "opacity-100" : "opacity-0")} />
                            {cli.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <Popover open={openFilterType} onOpenChange={setOpenFilterType}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-[140px] h-8 text-xs justify-between font-normal">
                    <span className="truncate">{filterId === 'all' ? 'Todos' : activeFilters.find(f => f.id === filterId)?.displayName ?? 'Tipo'}</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandList className="max-h-[280px]">
                      <CommandEmpty>No hay opciones.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem value="Todos" onSelect={() => { setFilterId('all'); setOpenFilterType(false); }}>
                          <Check className={cn('mr-2 h-4 w-4 shrink-0', filterId === 'all' ? 'opacity-100' : 'opacity-0')} />
                          Todos
                        </CommandItem>
                        {activeFilters.map(filter => (
                          <CommandItem key={filter.id} value={filter.displayName} onSelect={() => { setFilterId(filter.id); setOpenFilterType(false); }}>
                            <Check className={cn('mr-2 h-4 w-4 shrink-0', filterId === filter.id ? 'opacity-100' : 'opacity-0')} />
                            {filter.displayName}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={filterProjectStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterProjectStatus('all')}
                className="h-8 text-xs"
              >
                Todos
              </Button>
              <Button
                variant={filterProjectStatus === 'red' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterProjectStatus('red')}
                className={cn("h-8 text-xs", filterProjectStatus === 'red' && "bg-red-600 hover:bg-red-700")}
              >
                ⚠️ En riesgo
              </Button>
              <Button
                variant={filterProjectStatus === 'yellow' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterProjectStatus('yellow')}
                className={cn("h-8 text-xs", filterProjectStatus === 'yellow' && "bg-amber-600 hover:bg-amber-700")}
              >
                ⏳ Pendiente
              </Button>
              <Button
                variant={filterProjectStatus === 'green' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterProjectStatus('green')}
                className={cn("h-8 text-xs", filterProjectStatus === 'green' && "bg-emerald-600 hover:bg-emerald-700")}
              >
                ✅ On Track
              </Button>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                  <ArrowUpDown className="h-3 w-3" />
                  Ordenar
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] max-w-[calc(100vw-2rem)] p-0">
                <Command>
                  <CommandList>
                    <CommandGroup>
                      <CommandItem onSelect={() => setSortBy('status')}>
                        <Check className={cn("mr-2 h-4 w-4", sortBy === 'status' ? "opacity-100" : "opacity-0")} />
                        Por estado
                      </CommandItem>
                      <CommandItem onSelect={() => setSortBy('name')}>
                        <Check className={cn("mr-2 h-4 w-4", sortBy === 'name' ? "opacity-100" : "opacity-0")} />
                        Por nombre
                      </CommandItem>
                      <CommandItem onSelect={() => setSortBy('difference')}>
                        <Check className={cn("mr-2 h-4 w-4", sortBy === 'difference' ? "opacity-100" : "opacity-0")} />
                        Por diferencia
                      </CommandItem>
                      <CommandItem onSelect={() => setSortBy('contracted')}>
                        <Check className={cn("mr-2 h-4 w-4", sortBy === 'contracted' ? "opacity-100" : "opacity-0")} />
                        Por horas contratadas
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Semáforo de proyectos (month-end forecast)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(!projectForecast || projectForecast.length === 0) ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay proyectos activos este mes
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projectForecast.map(proj => (
                    <Card
                      key={proj.projectId}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        proj.status === 'red' && "ring-2 ring-red-200 bg-red-50/50",
                        proj.status === 'yellow' && "ring-2 ring-amber-200 bg-amber-50/50",
                        proj.status === 'green' && "ring-2 ring-emerald-200 bg-emerald-50/50"
                      )}
                      onClick={() => setSelectedProject(proj.projectId)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-sm font-bold truncate">
                              {formatProjectName(proj.projectName)}
                            </CardTitle>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: proj.clientColor }} />
                              <span className="text-xs text-muted-foreground truncate">{proj.clientName}</span>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "shrink-0",
                              proj.status === 'red' && "bg-red-100 text-red-700 border-red-300",
                              proj.status === 'yellow' && "bg-amber-100 text-amber-700 border-amber-300",
                              proj.status === 'green' && "bg-emerald-100 text-emerald-700 border-emerald-300"
                            )}
                          >
                            {proj.status === 'red' && <TrendingDown className="h-3 w-3 mr-1" />}
                            {proj.status === 'yellow' && <AlertCircle className="h-3 w-3 mr-1" />}
                            {proj.status === 'green' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                            {proj.status === 'red' && `+${Math.abs(proj.difference)}h`}
                            {proj.status === 'yellow' && `-${proj.difference}h`}
                            {proj.status === 'green' && 'On Track'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-xs border-b border-slate-100 pb-2">
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Contratado</span>
                              <span className="font-bold text-sm block">{proj.contracted}h</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Total est.</span>
                              <span className="font-bold text-sm block">{proj.realized}h</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground block text-[10px]">Planificado</span>
                              <span className="font-semibold text-blue-600 block">{proj.plannedHours}h</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[10px]">Computado</span>
                              <span className="font-semibold text-emerald-600 block">{proj.completedHours}h</span>
                            </div>
                          </div>
                        </div>
                        {proj.status === 'red' && (
                          <p className="text-xs text-red-600 mt-2 font-medium">
                            Nos pasamos por {Math.abs(proj.difference)} horas
                          </p>
                        )}
                        {proj.status === 'yellow' && (
                          <p className="text-xs text-amber-600 mt-2 font-medium">
                            Faltan {proj.difference} horas por asignar
                          </p>
                        )}
                        {proj.status === 'green' && (
                          <p className="text-xs text-emerald-600 mt-2 font-medium">
                            En línea con el contrato
                            {proj.contracted === 0 && proj.realized === 0 && (
                              <span className="text-muted-foreground ml-1">(Sin horas planificadas aún)</span>
                            )}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Transferencias de horas */}
        <TabsContent value="transfers" className="space-y-4">
          <WeeklyForecastTransfersFilters
            filterTransferStatus={filterTransferStatus}
            onFilterTransferStatusChange={setFilterTransferStatus}
            selectedDepartmentId={selectedDepartmentId}
            filterFeedbackEmployee={filterFeedbackEmployee}
            onFilterFeedbackEmployeeChange={setFilterFeedbackEmployee}
            filterFeedbackProject={filterFeedbackProject}
            onFilterFeedbackProjectChange={setFilterFeedbackProject}
            employees={employees ?? []}
            employeesForView={employeesForView}
            projects={projects ?? []}
            filteredProjectsForView={filteredProjectsForView}
            clients={clients ?? []}
            formatProjectName={formatProjectName}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5 text-primary" />
                Transferencias de horas ({format(currentMonth, 'MMMM', { locale: es })})
                {transfers && transfers.length > 0 && (
                  <Badge variant="secondary" className="ml-2 font-normal">
                    {transfers.length}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Historial de tareas reasignadas durante todo el mes de {format(currentMonth, 'MMMM', { locale: es })}
              </p>
            </CardHeader>
            <CardContent>
              {(!transfers || transfers.length === 0) ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay transferencias de horas esta semana
                </div>
              ) : (
                (() => {
                  // Agrupar transferencias por proyecto
                  const groupedByProject = transfers.reduce((acc, transfer) => {
                    const projectId = transfer.projectId || 'sin-proyecto';
                    if (!acc[projectId]) {
                      acc[projectId] = [];
                    }
                    acc[projectId].push(transfer);
                    return acc;
                  }, {} as Record<string, typeof transfers>);

                  return (
                    <div className="space-y-4">
                      {Object.entries(groupedByProject).map(([projectId, projectTransfers]) => {
                        const project = projects.find(p => p.id === projectId);
                        const client = clients.find(c => c.id === project?.clientId);

                        return (
                          <div key={projectId} className="space-y-2">
                            {/* Header del proyecto */}
                            <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: client?.color || '#94a3b8' }} />
                              <span className="text-sm font-semibold text-slate-700">
                                {project ? formatProjectName(project.name) : 'Sin proyecto'}
                              </span>
                              <Badge variant="outline" className="ml-auto bg-slate-100 text-slate-600 border-slate-300 text-[10px]">
                                {projectTransfers.length} {projectTransfers.length === 1 ? 'transferencia' : 'transferencias'}
                              </Badge>
                            </div>

                            {/* Transferencias del proyecto */}
                            <div className="space-y-2 pl-4">
                              {projectTransfers.map((transfer, idx) => (
                                <div
                                  key={transfer.uniqueId || idx}
                                  className={cn(
                                    "p-3 rounded-lg border transition-all",
                                    transfer.status === 'pending' && "bg-amber-50/30 border-amber-100",
                                    transfer.status === 'kept' && "bg-blue-50/30 border-blue-100",
                                    transfer.status === 'distributed' && "bg-purple-50/30 border-purple-100",
                                    transfer.status === 'rejected' && "bg-red-50/30 border-red-100"
                                  )}
                                >
                                  <div className="flex items-center gap-4">
                                    {/* Sección izquierda: Transferencia (Avatar → Horas → Avatar) */}
                                    <div className="flex items-center gap-2 shrink-0 pr-3 border-r border-slate-200">
                                      {/* Avatar origen con nombre */}
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <Avatar className="h-9 w-9 border-2 border-slate-200 shrink-0">
                                          <AvatarImage src={transfer.fromEmployeeAvatar} alt={transfer.fromEmployeeName} />
                                          <AvatarFallback className="bg-primary/100 text-white text-xs font-bold">
                                            {transfer.fromEmployeeName.substring(0, 2).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="font-semibold text-sm text-slate-900 whitespace-nowrap min-w-0 max-w-[120px] truncate">
                                          {transfer.fromEmployeeName}
                                        </span>
                                      </div>

                                      {/* Flecha y horas (vertical) */}
                                      <div className="flex flex-col items-center justify-center gap-0.5 shrink-0">
                                        <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                                        <Badge variant="outline" className="bg-primary/10 text-indigo-700 border-indigo-200 font-bold text-[10px] px-1.5 py-0 shrink-0">
                                          {transfer.hours}h
                                        </Badge>
                                      </div>

                                      {/* Avatar destino con nombre */}
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <Avatar className="h-9 w-9 border-2 border-slate-200 shrink-0">
                                          <AvatarImage src={transfer.toEmployeeAvatar} alt={transfer.toEmployeeName} />
                                          <AvatarFallback className="bg-purple-500 text-white text-xs font-bold">
                                            {transfer.toEmployeeName.substring(0, 2).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="font-semibold text-sm text-slate-900 whitespace-nowrap min-w-0 max-w-[120px] truncate">
                                          {transfer.toEmployeeName}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Sección derecha: Información de la tarea */}
                                    <div className="flex-1 min-w-0">
                                      {/* Proyecto y tarea en línea compacta */}
                                      <div className="flex items-center gap-1.5 mb-1">
                                        {project && (
                                          <>
                                            <span className="text-slate-400 text-xs">•</span>
                                            <span className="text-xs font-medium text-slate-600">{formatProjectName(transfer.projectName)}</span>
                                          </>
                                        )}
                                      </div>

                                      {/* Tarea original */}
                                      <div className="mb-1.5">
                                        <p className="text-xs text-slate-500 mb-0.5">Tarea original:</p>
                                        <div className="flex items-center flex-wrap gap-2">
                                          <p className="text-sm font-medium text-slate-900 leading-tight">{transfer.taskName}</p>
                                          <div className="flex items-center gap-1.5">
                                            {transfer.originalWeek && (
                                              <Badge variant="outline" className="text-[10px] h-4 px-1 bg-slate-50 text-slate-400 font-normal border-slate-200">
                                                Semana {getWeekIndex(transfer.originalWeek) !== -1 ? getWeekIndex(transfer.originalWeek) : '?'}
                                              </Badge>
                                            )}
                                            {transfer.targetWeek && transfer.targetWeek !== transfer.originalWeek && (
                                              <>
                                                <ArrowRight className="h-3 w-3 text-slate-300" />
                                                <Badge variant="outline" className="text-[10px] h-4 px-1 bg-primary/10 text-indigo-500 font-normal border-indigo-100">
                                                  Semana {getWeekIndex(transfer.targetWeek) !== -1 ? getWeekIndex(transfer.targetWeek) : '?'}
                                                </Badge>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Si está distribuida, mostrar tareas distribuidas */}
                                      {transfer.status === 'distributed' && transfer.distributedTasks && transfer.distributedTasks.length > 0 && (
                                        <div className="mb-1.5 p-2 bg-purple-50/50 rounded border border-purple-200">
                                          <p className="text-xs text-slate-600 mb-1.5 font-medium">
                                            Distribuida en {transfer.distributedTasks.length} tarea{transfer.distributedTasks.length > 1 ? 's' : ''}:
                                          </p>
                                          <div className="space-y-1">
                                            {transfer.distributedTasks.map((task, taskIdx) => {
                                              const weekNum = task.weekDate ? Math.ceil(new Date(task.weekDate).getDate() / 7) : 0;
                                              return (
                                                <div key={taskIdx} className="flex items-center gap-2 text-xs bg-white rounded px-2 py-1 border border-purple-100">
                                                  <span className="font-medium text-slate-800">{task.employeeName || 'Empleado'}</span>
                                                  <span className="text-slate-400">→</span>
                                                  <span className="text-slate-600">{task.name}</span>
                                                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 text-[10px] px-1.5 py-0">
                                                    {task.hours}h · S{weekNum}
                                                  </Badge>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}

                                      {/* Notas si existen */}
                                      {transfer.notes && (
                                        <div className="mb-1.5 p-1.5 bg-slate-50 rounded border border-slate-200">
                                          <p className="text-xs text-slate-500 mb-0.5">Notas:</p>
                                          <p className="text-xs text-slate-700 leading-relaxed">{transfer.notes}</p>
                                        </div>
                                      )}

                                      {/* Estado */}
                                      <div className="flex items-center gap-2 flex-wrap">
                                        {transfer.status === 'pending' && (
                                          <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 text-[10px]">
                                            <AlertCircle className="h-2.5 w-2.5 mr-1" />
                                            Pendiente de aceptación
                                          </Badge>
                                        )}
                                        {transfer.status === 'kept' && (
                                          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 text-[10px]">
                                            <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                                            Mantenida tal cual
                                          </Badge>
                                        )}
                                        {transfer.status === 'distributed' && (
                                          <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300 text-[10px]">
                                            <Users className="h-2.5 w-2.5 mr-1" />
                                            Redistribuida
                                          </Badge>
                                        )}
                                        {transfer.status === 'rejected' && (
                                          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 text-[10px]">
                                            <AlertCircle className="h-2.5 w-2.5 mr-1" />
                                            Rechazada
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Bloqueos - Quién bloquea a quién */}
        <TabsContent value="blockers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Bloqueos entre tareas
                <Badge variant="outline" className="ml-2">
                  {(() => {
                    // Find tasks that have dependencyId pointing to an uncompleted task
                    const blockedTasks = allocations.filter(a => {
                      if (!a.dependencyId || a.status === 'completed') return false;
                      if (!isAllocationInEffectiveMonth(a.weekStartDate, currentMonth)) return false;
                      const blockingTask = allocations.find(b => b.id === a.dependencyId);
                      return blockingTask && blockingTask.status !== 'completed';
                    });
                    return blockedTasks.length;
                  })()}
                </Badge>
              </CardTitle>
              <p className="text-sm text-slate-500">
                Tareas que dependen de otras para avanzar. Ayuda a identificar cuellos de botella.
              </p>
            </CardHeader>
            <CardContent>
              {(() => {
                // Find tasks that have dependencyId pointing to an uncompleted task
                let blockedTasks = allocations.filter(a => {
                  if (!a.dependencyId || a.status === 'completed') return false;
                  if (!isAllocationInEffectiveMonth(a.weekStartDate, currentMonth)) return false;
                  const blockingTask = allocations.find(b => b.id === a.dependencyId);
                  return blockingTask && blockingTask.status !== 'completed';
                });

                if (selectedDepartmentId && employeesForView.length > 0) {
                  const deptIds = new Set(employeesForView.map(e => e.id));
                  blockedTasks = blockedTasks.filter(a => {
                    const blockingTask = allocations.find(b => b.id === a.dependencyId);
                    return blockingTask && deptIds.has(a.employeeId) && deptIds.has(blockingTask.employeeId);
                  });
                }

                if (blockedTasks.length === 0) {
                  return (
                    <div className="text-center py-8 text-slate-500">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                      <p className="font-medium">Sin bloqueos activos</p>
                      <p className="text-xs">No hay tareas esperando a que otras terminen</p>
                    </div>
                  );
                }

                // Group by blocking employee
                const blockingGroups = new Map<string, {
                  blockerName: string;
                  blockerAvatar?: string;
                  blockingTasks: Array<{
                    blockingTaskName: string;
                    blockedTaskName: string;
                    blockedEmployee: string;
                    blockedEmployeeAvatar?: string;
                    projectName: string;
                    weekNum: number;
                  }>;
                }>();

                blockedTasks.forEach(blocked => {
                  const blockingTask = allocations.find(a => a.id === blocked.dependencyId);
                  if (!blockingTask) return;

                  const blockerEmployee = employees.find(e => e.id === blockingTask.employeeId);
                  if (!blockerEmployee) return;

                  const key = blockerEmployee.id;
                  if (!blockingGroups.has(key)) {
                    blockingGroups.set(key, {
                      blockerName: blockerEmployee.name,
                      blockerAvatar: blockerEmployee.avatarUrl,
                      blockingTasks: []
                    });
                  }

                  const blockedEmployee = employees.find(e => e.id === blocked.employeeId);
                  const project = projects.find(p => p.id === blocked.projectId);
                  const weekNum = Math.ceil(new Date(blocked.weekStartDate).getDate() / 7);

                  blockingGroups.get(key)!.blockingTasks.push({
                    blockingTaskName: blockingTask.taskName || 'Tarea bloqueadora',
                    blockedTaskName: blocked.taskName || 'Tarea bloqueada',
                    blockedEmployee: blockedEmployee?.name || 'Empleado',
                    blockedEmployeeAvatar: blockedEmployee?.avatarUrl,
                    projectName: project?.name || 'Proyecto',
                    weekNum
                  });
                });

                const groupsArray = Array.from(blockingGroups.entries())
                  .sort((a, b) => b[1].blockingTasks.length - a[1].blockingTasks.length);

                return (
                  <div className="space-y-3">
                    {groupsArray.map(([employeeId, group]) => (
                      <div key={employeeId} className="border rounded-lg p-3 bg-red-50/30">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={group.blockerAvatar} />
                            <AvatarFallback className="bg-red-500 text-white text-xs">
                              {group.blockerName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{group.blockerName}</p>
                            <p className="text-xs text-slate-500">
                              Bloquea {group.blockingTasks.length} tarea{group.blockingTasks.length > 1 ? 's' : ''}
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                            {group.blockingTasks.length} bloqueo{group.blockingTasks.length > 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <div className="space-y-1 ml-11">
                          {group.blockingTasks.map((task, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs bg-white rounded px-2 py-1.5 border flex-wrap">
                              <span className="text-slate-600 font-medium">
                                "{task.blockingTaskName}"
                              </span>
                              <ArrowRight className="h-3 w-3 text-red-400 shrink-0" />
                              <span className="text-slate-500">bloquea</span>
                              <Avatar className="h-4 w-4 shrink-0">
                                <AvatarImage src={task.blockedEmployeeAvatar} />
                                <AvatarFallback className="text-[8px] bg-slate-500 text-white">
                                  {task.blockedEmployee.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{task.blockedEmployee}</span>
                              <span className="text-slate-400">en</span>
                              <span className="text-slate-600">"{task.blockedTaskName}"</span>
                              <Badge variant="outline" className="text-[9px] shrink-0">
                                {task.projectName} · S{task.weekNum}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: Redistribución - Formulario directo */}
        <TabsContent value="redistribute" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Redistribución de horas
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Selecciona un proyecto y redistribuye horas entre compañeros
              </p>
            </CardHeader>
            <CardContent>
              {/* Selector de proyecto */}
              <div className="mb-6">
                <Label className="text-sm font-medium mb-2 block">Proyecto</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full h-10 justify-between">
                      <span className="truncate">
                        {selectedProject
                          ? formatProjectName(projects.find(p => p.id === selectedProject)?.name || '')
                          : 'Seleccionar proyecto...'}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] max-w-[calc(100vw-2rem)] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar proyecto..." />
                      <CommandList>
                        <CommandEmpty>No hay proyectos</CommandEmpty>
                        <CommandGroup>
                          {projectForecast.map(proj => {
                            const client = clients.find(c => c.id === projects.find(p => p.id === proj.projectId)?.clientId);
                            return (
                              <CommandItem
                                key={proj.projectId}
                                value={`${client?.name || ''} ${proj.projectName}`}
                                onSelect={() => setSelectedProject(proj.projectId)}
                              >
                                <Check className={cn("mr-2 h-4 w-4", selectedProject === proj.projectId ? "opacity-100" : "opacity-0")} />
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: proj.clientColor }} />
                                  <span className="truncate">{client?.name} - {formatProjectName(proj.projectName)}</span>
                                </div>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Formulario de redistribución (solo si hay proyecto seleccionado) */}
              {selectedProject && (
                <div className="space-y-6 pt-4 border-t">
                  {/* Mostrar el contenido del Sheet aquí directamente */}
                  {delayedTasksByEmployee.length > 0 ? (
                    <div className="space-y-4">
                      <Label className="text-sm font-medium">Tareas retrasadas</Label>
                      <div className="space-y-3 max-h-[400px] overflow-y-auto border rounded-lg p-3">
                        {delayedTasksByEmployee.map(group => (
                          <div key={group.employeeId} className="space-y-2">
                            {/* Header del empleado */}
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={group.employeeAvatar} alt={group.employeeName} />
                                <AvatarFallback className="bg-primary/100 text-white text-[10px]">
                                  {group.employeeName.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-semibold text-sm text-slate-900">{group.employeeName}</span>
                              <Badge variant="outline" className="ml-auto text-xs bg-slate-50">
                                {group.tasks?.length || 0} tarea(s)
                              </Badge>
                            </div>

                            {/* Tareas del empleado */}
                            <div className="space-y-2 pl-8">
                              {(group.tasks || []).map(task => {
                                const remainingHours = task.hoursAssigned - (task.hoursActual || 0);
                                const isSelected = redistributeSelectedTasks.has(task.id);

                                return (
                                  <div
                                    key={task.id}
                                    className={cn(
                                      "flex items-center gap-3 p-2 rounded border cursor-pointer transition-colors",
                                      isSelected ? "bg-primary/10 border-indigo-300" : "bg-white border-slate-200 hover:bg-slate-50"
                                    )}
                                    onClick={() => {
                                      setRedistributeSelectedTasks(prev => {
                                        const newSet = new Set(prev);
                                        if (newSet.has(task.id)) {
                                          newSet.delete(task.id);
                                        } else {
                                          newSet.add(task.id);
                                        }
                                        return newSet;
                                      });
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => { }}
                                      className="h-4 w-4"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{task.taskName || 'Sin nombre'}</p>
                                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                        <span>Asignadas: {task.hoursAssigned}h</span>
                                        <span>Realizadas: {task.hoursActual || 0}h</span>
                                        {remainingHours > 0 && (
                                          <span className="text-amber-600 font-medium">Restantes: {remainingHours}h</span>
                                        )}
                                      </div>
                                    </div>
                                    {remainingHours > 0 && (
                                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                        {remainingHours}h
                                      </Badge>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Compañero destino */}
                      {redistributeSelectedTasks.size > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Compañero destino</Label>
                          <Popover open={openRedistributeEmployee} onOpenChange={setOpenRedistributeEmployee}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-between font-normal">
                                <span className="truncate">{redistributeToEmployee ? (employees.find(e => e.id === redistributeToEmployee)?.name ?? 'Seleccionar') : 'seleccionar compañero destino'}</span>
                                <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                              <Command>
                                <CommandList className="max-h-[280px]">
                                  {employeesForView.filter(e => e.isActive).map(emp => (
                                    <CommandItem key={emp.id} value={emp.name || ''} onSelect={() => { setRedistributeToEmployee(emp.id); setOpenRedistributeEmployee(false); }}>
                                      <Check className={cn('mr-2 h-4 w-4 shrink-0', redistributeToEmployee === emp.id ? 'opacity-100' : 'opacity-0')} />
                                      {emp.name}
                                    </CommandItem>
                                  ))}
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}

                      {/* Semana destino */}
                      {redistributeToEmployee && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Semana destino</Label>
                          <Popover open={openRedistributeWeek} onOpenChange={setOpenRedistributeWeek}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-between font-normal">
                                <span className="truncate">{redistributeWeek ? (() => { const idx = (futureWeeks || []).findIndex(w => getStorageKey(w.weekStart, currentMonth) === redistributeWeek); return idx >= 0 ? `Sem ${idx + 1} (${format((futureWeeks || [])[idx].weekStart, 'd MMM', { locale: es })})` : 'Seleccionar semana'; })() : 'seleccionar semana'}</span>
                                <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                              <Command>
                                <CommandList className="max-h-[280px]">
                                  {(futureWeeks || []).map((week, idx) => {
                                    const storageKey = getStorageKey(week.weekStart, currentMonth);
                                    return (
                                      <CommandItem key={storageKey} value={storageKey} onSelect={() => { setRedistributeWeek(storageKey); setOpenRedistributeWeek(false); }}>
                                        <Check className={cn('mr-2 h-4 w-4 shrink-0', redistributeWeek === storageKey ? 'opacity-100' : 'opacity-0')} />
                                        Sem {idx + 1} ({format(week.weekStart, 'd MMM', { locale: es })})
                                      </CommandItem>
                                    );
                                  })}
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}

                      {/* Resumen y carga */}
                      {redistributeToEmployee && redistributeWeek && (() => {
                        const allDelayedTasks = (delayedTasksByEmployee || []).flatMap(g => g.tasks || []);
                        const selectedTasks = allDelayedTasks.filter(t => redistributeSelectedTasks.has(t.id));
                        let totalTransfer = 0;
                        selectedTasks.forEach(task => {
                          const remainingHours = task.hoursAssigned - (task.hoursActual || 0);
                          if (remainingHours > 0) {
                            totalTransfer += remainingHours;
                          }
                        });

                        // Calcular carga usando getEmployeeLoadForWeek
                        const weekData = (futureWeeks || []).find(w => {
                          const storageKey = getStorageKey(w.weekStart, currentMonth);
                          return storageKey === redistributeWeek;
                        });

                        if (weekData) {
                          const weekLoad = getEmployeeLoadForWeek(
                            redistributeToEmployee,
                            redistributeWeek,
                            weekData.effectiveStart,
                            weekData.effectiveEnd
                          );

                          const newTotal = weekLoad.hours + totalTransfer;
                          const exceeds = newTotal > weekLoad.capacity;

                          return (
                            <div className="space-y-3 p-3 bg-slate-50 rounded-lg">
                              <Label className="text-sm font-medium">Carga del compañero destino</Label>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between p-2 bg-white rounded text-xs">
                                  <span>Semana {format(weekData.weekStart, 'd MMM', { locale: es })}</span>
                                  <span className={cn(
                                    "font-semibold",
                                    weekLoad.percentage > 110 ? "text-red-600" : weekLoad.percentage > 100 ? "text-amber-600" : "text-emerald-600"
                                  )}>
                                    {weekLoad.hours}h / {weekLoad.capacity}h ({weekLoad.percentage}%)
                                  </span>
                                </div>
                                {totalTransfer > 0 && (
                                  <div className={cn(
                                    "p-3 rounded border",
                                    exceeds ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"
                                  )}>
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="font-medium">Total a transferir:</span>
                                      <span className="font-bold">{totalTransfer.toFixed(1)}h</span>
                                    </div>
                                    <div className="mt-2 text-xs">
                                      <div className="flex items-center justify-between">
                                        <span>Carga actual:</span>
                                        <span>{weekLoad.hours}h / {weekLoad.capacity}h</span>
                                      </div>
                                      <div className={cn(
                                        "flex items-center justify-between mt-1 font-medium",
                                        exceeds ? "text-red-600" : "text-emerald-600"
                                      )}>
                                        <span>Nueva carga:</span>
                                        <span>
                                          {newTotal.toFixed(1)}h / {weekLoad.capacity}h
                                          {exceeds && ` (+${(newTotal - weekLoad.capacity).toFixed(1)}h exceso)`}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* Botón de redistribuir */}
                      <Button
                        onClick={handleRedistribute}
                        className="w-full bg-primary hover:bg-primary/90"
                        disabled={redistributeSelectedTasks.size === 0 || !redistributeToEmployee || !redistributeWeek}
                      >
                        Redistribuir Horas
                      </Button>
                    </div>
                  ) : selectedProject ? (
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-sm text-amber-700">
                        No hay tareas retrasadas en este proyecto.
                      </p>
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: Historial de Cambios */}
        <TabsContent value="activity" className="space-y-4">
          <ActivityLogSection currentMonth={currentMonth} />
        </TabsContent>
      </Tabs >
    </div >
  );
}

