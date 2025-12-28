import { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { format, startOfMonth, endOfMonth, isSameMonth, parseISO, addDays, startOfWeek, subMonths, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertCircle, TrendingUp, TrendingDown, CheckCircle2, Users, Plus, ArrowRight, ChevronLeft, ChevronRight, CalendarDays, Check } from 'lucide-react';
import { cn, formatProjectName } from '@/lib/utils';
import { toast } from 'sonner';
import { getStorageKey, getWeeksForMonth, getMonthlyCapacity } from '@/utils/dateUtils';
import { getAbsenceHoursInRange } from '@/utils/absenceUtils';
import { getTeamEventHoursInRange } from '@/utils/teamEventUtils';

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

export default function WeeklyForecastPage() {
  const { 
    projects, allocations, employees, clients, weeklyFeedback, 
    addAllocation, currentUser, absences, teamEvents
  } = useApp();
  
  const [currentMonth, setCurrentMonth] = useState(() => {
    const saved = localStorage.getItem('forecast_date');
    return saved ? new Date(saved) : new Date();
  });
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [redistributeFromEmployee, setRedistributeFromEmployee] = useState('');
  const [redistributeSelectedTasks, setRedistributeSelectedTasks] = useState<Set<string>>(new Set());
  const [redistributeUseGlobal, setRedistributeUseGlobal] = useState(false);
  const [redistributeGlobalHours, setRedistributeGlobalHours] = useState('');
  const [redistributeToEmployee, setRedistributeToEmployee] = useState('');
  const [redistributeWeek, setRedistributeWeek] = useState('');
  const [filterFeedbackEmployee, setFilterFeedbackEmployee] = useState<string>('all');
  const [filterFeedbackProject, setFilterFeedbackProject] = useState<string>('all');
  const [filterProjectStatus, setFilterProjectStatus] = useState<string>('all'); // all, red, yellow, green
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterProjectType, setFilterProjectType] = useState<string>('all'); // all, SEO, PPC
  
  useEffect(() => {
    localStorage.setItem('forecast_date', currentMonth.toISOString());
  }, [currentMonth]);
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const weeks = getWeeksForMonth(currentMonth);
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
  const handleToday = () => setCurrentMonth(new Date());
  
      // Sección A: Semáforo de Proyectos (Month-End Forecast) con filtros
  const projectForecast = useMemo(() => {
    let filteredProjects = projects.filter(p => p.status === 'active' && !p.isHidden);
    
    // Filtro por cliente
    if (filterClient !== 'all') {
      filteredProjects = filteredProjects.filter(p => p.clientId === filterClient);
    }
    
    // Filtro por tipo de proyecto (SEO/PPC)
    if (filterProjectType !== 'all') {
      filteredProjects = filteredProjects.filter(p => {
        if (filterProjectType === 'SEO') {
          return p.projectType !== 'PPC';
        } else if (filterProjectType === 'PPC') {
          return p.projectType === 'PPC';
        }
        return true;
      });
    }
    
    const today = new Date();
    
    return filteredProjects.map(project => {
      // Total Contratado (Budget/Fee mensual)
      const contracted = project.budgetHours || 0;
      
      // Realizado: Suma de hours_actual de allocations pasadas + hours_assigned de allocations futuras en este mes
      const monthAllocations = (allocations || []).filter(a => {
        try {
          return a.projectId === project.id &&
            isSameMonth(parseISO(a.weekStartDate), currentMonth);
        } catch {
          return false;
        }
      });
      
      // Separar por completadas y planificadas
      const completed = monthAllocations.filter(a => a.status === 'completed');
      const planned = monthAllocations.filter(a => a.status !== 'completed');
      
      // Para tareas completadas: usar hoursActual si existe, sino hoursAssigned
      const completedHours = round2(
        completed.reduce((sum, a) => sum + ((a.hoursActual || 0) > 0 ? (a.hoursActual || 0) : a.hoursAssigned), 0)
      );
      
      // Para tareas planificadas: usar hoursAssigned (son futuras)
      const plannedHours = round2(
        planned.reduce((sum, a) => sum + a.hoursAssigned, 0)
      );
      
      const realized = round2(completedHours + plannedHours);
      const difference = round2(contracted - realized);
      
      let status: 'red' | 'yellow' | 'green';
      // Si no hay horas planificadas pero hay presupuesto, es "yellow" (pendiente)
      if (contracted > 0 && realized === 0 && plannedHours === 0) {
        status = 'yellow'; // Faltan horas por asignar
      } else if (difference < -5) {
        status = 'red'; // Nos pasamos por más de 5 horas
      } else if (difference > 5) {
        status = 'yellow'; // Faltan más de 5 horas
      } else {
        status = 'green'; // On track (±5 horas de margen)
      }
      
      return {
        projectId: project.id,
        projectName: project.name,
        clientName: clients.find(c => c.id === project.clientId)?.name || 'Sin cliente',
        clientColor: clients.find(c => c.id === project.clientId)?.color || '#6b7280',
        contracted,
        realized,
        completedHours,
        plannedHours,
        difference,
        status
      };
    }).filter(proj => {
      // Filtro por estado del semáforo
      if (filterProjectStatus === 'all') return true;
      return proj.status === filterProjectStatus;
    }).sort((a, b) => {
      // Ordenar: rojos primero, luego amarillos, luego verdes
      const statusOrder = { red: 0, yellow: 1, green: 2 };
      return statusOrder[a.status] - statusOrder[b.status] || Math.abs(b.difference) - Math.abs(a.difference);
    });
  }, [projects, allocations, clients, currentMonth, filterClient, filterProjectStatus]);
  
  // Sección B: Feed de Bloqueos (semana en curso) con filtros
  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const currentWeekStr = format(currentWeekStart, 'yyyy-MM-dd');
  
  const currentWeekFeedback = useMemo(() => {
    let filtered = weeklyFeedback
      .filter(fb => fb.weekStartDate === currentWeekStr);
    
    // Filtro por compañero
    if (filterFeedbackEmployee !== 'all') {
      filtered = filtered.filter(fb => fb.employeeId === filterFeedbackEmployee);
    }
    
    // Filtro por proyecto
    if (filterFeedbackProject !== 'all') {
      filtered = filtered.filter(fb => fb.projectId === filterFeedbackProject);
    }
    
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [weeklyFeedback, currentWeekStr, filterFeedbackEmployee, filterFeedbackProject]);
  
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
  
  // Tareas abiertas del compañero de origen para el proyecto seleccionado
  const sourceEmployeeOpenTasks = useMemo(() => {
    if (!selectedProject || !redistributeFromEmployee) return [];
    
    const today = new Date();
    return allocations.filter(a => {
      if (a.employeeId !== redistributeFromEmployee) return false;
      if (a.projectId !== selectedProject) return false;
      if (a.status === 'completed') return false;
      
      try {
        const taskWeekDate = parseISO(a.weekStartDate);
        if (!isSameMonth(taskWeekDate, currentMonth)) return false;
        
        const taskWeekEnd = addDays(taskWeekDate, 4);
        // Solo tareas de semanas pasadas o actual
        return taskWeekEnd <= today;
      } catch {
        return false;
      }
    });
  }, [selectedProject, redistributeFromEmployee, allocations, currentMonth]);
  
  // Sección C: Redistribución Rápida (mejorada)
  const handleRedistribute = async () => {
    if (!selectedProject || !redistributeFromEmployee || !redistributeToEmployee || !redistributeWeek) {
      toast.error('Completa todos los campos');
      return;
    }
    
    let totalHours = 0;
    const tasksToTransfer: typeof allocations = [];
    
    if (redistributeUseGlobal) {
      // Modo global: usar horas especificadas
      const hours = parseFloat(redistributeGlobalHours);
      if (isNaN(hours) || hours <= 0) {
        toast.error('Las horas deben ser un número positivo');
        return;
      }
      totalHours = hours;
    } else {
      // Modo específico: usar tareas seleccionadas
      if (redistributeSelectedTasks.size === 0) {
        toast.error('Selecciona al menos una tarea o usa el modo global');
        return;
      }
      
      sourceEmployeeOpenTasks.forEach(task => {
        if (redistributeSelectedTasks.has(task.id)) {
          const remainingHours = task.hoursAssigned - (task.hoursActual || 0);
          if (remainingHours > 0) {
            totalHours += remainingHours;
            tasksToTransfer.push(task);
          }
        }
      });
      
      if (totalHours <= 0) {
        toast.error('Las tareas seleccionadas no tienen horas restantes');
        return;
      }
    }
    
    try {
      if (redistributeUseGlobal) {
        // Crear asignación genérica
        await addAllocation({
          employeeId: redistributeToEmployee,
          projectId: selectedProject,
          weekStartDate: redistributeWeek,
          hoursAssigned: totalHours,
          taskName: `[Distribuir] ${totalHours}h redistribuidas`,
          description: `Horas redistribuidas desde ${employees.find(e => e.id === redistributeFromEmployee)?.name || 'compañero'}. Distribuye estas horas entre las tareas que necesites.`,
          status: 'planned'
        });
      } else {
        // Transferir tareas específicas
        const fromEmployee = employees.find(e => e.id === redistributeFromEmployee);
        const fromEmployeeName = fromEmployee?.name || 'compañero';
        
        for (const task of tasksToTransfer) {
          const remainingHours = task.hoursAssigned - (task.hoursActual || 0);
          if (remainingHours > 0) {
            // Completar tarea original
            await updateAllocation({
              ...task,
              hoursAssigned: task.hoursActual || 0,
              status: 'completed'
            });
            
            // Crear tarea para el compañero destino
            await addAllocation({
              employeeId: redistributeToEmployee,
              projectId: selectedProject,
              weekStartDate: redistributeWeek,
              hoursAssigned: remainingHours,
              taskName: `${task.taskName || 'Tarea'} (transferida de ${fromEmployeeName})`,
              status: 'planned'
            });
          }
        }
      }
      
      toast.success(`${totalHours.toFixed(1)}h redistribuidas correctamente`);
      setRedistributeFromEmployee('');
      setRedistributeSelectedTasks(new Set());
      setRedistributeUseGlobal(false);
      setRedistributeGlobalHours('');
      setRedistributeToEmployee('');
      setRedistributeWeek('');
      setSelectedProject(null);
    } catch (error) {
      console.error('Error redistribuyendo:', error);
      toast.error('Error al redistribuir horas');
    }
  };
  
  // Carga de trabajo de compañeros para semanas restantes del mes (considerando ausencias y eventos)
  const employeeWorkload = useMemo(() => {
    if (!selectedProject) return [];
    
    const today = new Date();
    const remainingWeeks = weeks.filter(w => {
      try {
        const weekDate = parseISO(getStorageKey(w.weekStart, currentMonth));
        return weekDate >= today;
      } catch {
        return false;
      }
    });
    
    return employees
      .filter(e => e.isActive)
      .map(emp => {
        const employeeAbsences = (absences || []).filter(a => a.employeeId === emp.id);
        
        const weekLoads = remainingWeeks.map(week => {
          const storageKey = getStorageKey(week.weekStart, currentMonth);
          const weekAllocations = (allocations || []).filter(a =>
            a.employeeId === emp.id &&
            a.weekStartDate === storageKey
          );
          
          // Horas asignadas (usando la misma lógica que el resto de la app)
          const assignedHours = round2(
            weekAllocations.reduce((sum, a) => 
              sum + (a.status === 'completed' && (a.hoursActual || 0) > 0 
                ? Number(a.hoursActual) 
                : Number(a.hoursAssigned)), 0
            )
          );
          
          // Capacidad de la semana (considerando ausencias y eventos)
          const weekStartDate = week.effectiveStart || week.weekStart;
          const weekEndDate = week.effectiveEnd || addDays(week.weekStart, 6);
          
          // Capacidad base del horario
          const baseCapacity = emp.defaultWeeklyCapacity;
          
          // Restar ausencias
          const absenceHours = getAbsenceHoursInRange(
            weekStartDate,
            weekEndDate,
            employeeAbsences,
            emp.workSchedule
          );
          
          // Restar eventos del equipo
          const eventHours = getTeamEventHoursInRange(
            weekStartDate,
            weekEndDate,
            emp.id,
            teamEvents || [],
            emp.workSchedule,
            employeeAbsences
          );
          
          const availableCapacity = Math.max(0, round2(baseCapacity - absenceHours - eventHours));
          
          return {
            weekStart: storageKey,
            weekLabel: `Sem ${weeks.findIndex(w => getStorageKey(w.weekStart, currentMonth) === storageKey) + 1}`,
            hours: assignedHours,
            capacity: availableCapacity,
            percentage: availableCapacity > 0 ? round2((assignedHours / availableCapacity) * 100) : (assignedHours > 0 ? 999 : 0)
          };
        });
        
        return {
          employeeId: emp.id,
          employeeName: emp.name,
          weekLoads
        };
      });
  }, [selectedProject, weeks, employees, allocations, currentMonth, absences, teamEvents]);
  
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Previsión Mensual</h1>
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="traffic" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Semáforo de Proyectos
          </TabsTrigger>
          <TabsTrigger value="blockers" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Feed de Bloqueos
          </TabsTrigger>
          <TabsTrigger value="redistribute" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Redistribución
          </TabsTrigger>
        </TabsList>
        
        {/* TAB 1: Semáforo de Proyectos */}
        <TabsContent value="traffic" className="space-y-4">
          <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Semáforo de Proyectos (Month-End Forecast)
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filterClient} onValueChange={setFilterClient}>
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue placeholder="Todos los clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los clientes</SelectItem>
                  {clients.map(cli => (
                    <SelectItem key={cli.id} value={cli.id}>
                      {cli.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterProjectStatus} onValueChange={setFilterProjectStatus}>
                <SelectTrigger className="w-[150px] h-8 text-xs">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="red">⚠️ En riesgo</SelectItem>
                  <SelectItem value="yellow">⏳ Pendiente</SelectItem>
                  <SelectItem value="green">✅ On Track</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterProjectType} onValueChange={setFilterProjectType}>
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="SEO">SEO</SelectItem>
                  <SelectItem value="PPC">PPC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {projectForecast.length === 0 ? (
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
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Contratado:</span>
                        <span className="font-bold ml-1">{proj.contracted}h</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Realizado:</span>
                        <span className="font-bold ml-1">{proj.realized}h</span>
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
        
        {/* TAB 2: Feed de Bloqueos */}
        <TabsContent value="blockers" className="space-y-4">
          <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Feed de Bloqueos
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Semana del <strong>{format(currentWeekStart, "d 'de' MMMM", { locale: es })}</strong>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterFeedbackEmployee} onValueChange={setFilterFeedbackEmployee}>
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue placeholder="Todos los compañeros" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los compañeros</SelectItem>
                  {employees
                    .filter(e => e.isActive)
                    .map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-[180px] h-8 text-xs justify-between">
                    <span className="truncate">
                      {filterFeedbackProject === 'all' 
                        ? 'Todos los proyectos' 
                        : formatProjectName(projects.find(p => p.id === filterFeedbackProject)?.name || '')}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar proyecto..." />
                    <CommandList>
                      <CommandEmpty>No hay proyectos</CommandEmpty>
                      <CommandGroup>
                        <CommandItem 
                          value="all" 
                          onSelect={() => setFilterFeedbackProject('all')}
                        >
                          <Check className={cn("mr-2 h-4 w-4", filterFeedbackProject === 'all' ? "opacity-100" : "opacity-0")} />
                          Todos los proyectos
                        </CommandItem>
                        {projects
                          .filter(p => p.status === 'active' && !p.isHidden)
                          .map(proj => {
                            const client = clients.find(c => c.id === proj.clientId);
                            return (
                              <CommandItem 
                                key={proj.id} 
                                value={`${client?.name || ''} ${proj.name}`}
                                onSelect={() => setFilterFeedbackProject(proj.id)}
                              >
                                <Check className={cn("mr-2 h-4 w-4", filterFeedbackProject === proj.id ? "opacity-100" : "opacity-0")} />
                                <span className="truncate">{client?.name} - {formatProjectName(proj.name)}</span>
                              </CommandItem>
                            );
                          })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {currentWeekFeedback.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay bloqueos reportados esta semana
            </div>
          ) : (
            <div className="space-y-3">
              {currentWeekFeedback.map(feedback => {
                const employee = employees.find(e => e.id === feedback.employeeId);
                const project = projects.find(p => p.id === feedback.projectId);
                
                return (
                  <div key={feedback.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{employee?.name || 'Desconocido'}</span>
                        {project && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">{formatProjectName(project.name)}</span>
                          </>
                        )}
                        {feedback.reason && (
                          <Badge variant="outline" className="text-xs">
                            {feedback.reason === 'technical_issue' && 'Problema técnico'}
                            {feedback.reason === 'client_blocker' && 'Bloqueo cliente'}
                            {feedback.reason === 'bad_estimation' && 'Estimación incorrecta'}
                            {feedback.reason === 'personal_absence' && 'Ausencia personal'}
                            {feedback.reason === 'other' && 'Otro'}
                          </Badge>
                        )}
                      </div>
                      {feedback.comments && (
                        <p className="text-sm text-muted-foreground">{feedback.comments}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(parseISO(feedback.createdAt), "d 'de' MMMM 'a las' HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>
        
        {/* TAB 3: Redistribución */}
        <TabsContent value="redistribute" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Redistribución Rápida
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Selecciona un proyecto para redistribuir horas entre compañeros
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projectForecast.map(proj => (
                  <Card
                    key={proj.projectId}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      selectedProject === proj.projectId && "ring-2 ring-indigo-500"
                    )}
                    onClick={() => setSelectedProject(proj.projectId)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold truncate">
                        {formatProjectName(proj.projectName)}
                      </CardTitle>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: proj.clientColor }} />
                        <span className="text-xs text-muted-foreground truncate">{proj.clientName}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Contratado:</span>
                          <span className="font-bold ml-1">{proj.contracted}h</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Realizado:</span>
                          <span className="font-bold ml-1">{proj.realized}h</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Sheet lateral para Redistribución (se abre desde cualquier tab) */}
      <Sheet open={selectedProject !== null} onOpenChange={(open) => !open && setSelectedProject(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Redistribuir Horas</SheetTitle>
            <SheetDescription>
              Añade horas a un compañero en una semana específica para este proyecto
            </SheetDescription>
          </SheetHeader>
          
          {selectedProject && (
            <div className="space-y-6 mt-6">
              {/* Proyecto seleccionado */}
              <div className="p-3 bg-slate-50 rounded-lg">
                <Label className="text-xs text-muted-foreground mb-1 block">Proyecto</Label>
                <p className="font-semibold">
                  {formatProjectName(projects.find(p => p.id === selectedProject)?.name || '')}
                </p>
              </div>
              
              {/* Formulario de redistribución */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="hours">Horas</Label>
                  <Input
                    id="hours"
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={redistributeHours}
                    onChange={(e) => setRedistributeHours(e.target.value)}
                    placeholder="Ej: 8"
                  />
                </div>
                
                <div>
                  <Label htmlFor="employee">Compañero</Label>
                  <Select value={redistributeEmployee} onValueChange={setRedistributeEmployee}>
                    <SelectTrigger id="employee">
                      <SelectValue placeholder="Seleccionar compañero" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees
                        .filter(e => e.isActive)
                        .map(emp => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="week">Semana</Label>
                  <Select value={redistributeWeek} onValueChange={setRedistributeWeek}>
                    <SelectTrigger id="week">
                      <SelectValue placeholder="Seleccionar semana" />
                    </SelectTrigger>
                    <SelectContent>
                      {futureWeeks.map((week, idx) => {
                        const storageKey = getStorageKey(week.weekStart, currentMonth);
                        const weekIndex = weeks.findIndex(w => getStorageKey(w.weekStart, currentMonth) === storageKey);
                        return (
                          <SelectItem key={storageKey} value={storageKey}>
                            Semana {weekIndex + 1} ({format(week.weekStart, 'd MMM', { locale: es })})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  onClick={handleRedistribute}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  disabled={!redistributeFromEmployee || !redistributeToEmployee || !redistributeWeek || 
                    (!redistributeUseGlobal && redistributeSelectedTasks.size === 0) ||
                    (redistributeUseGlobal && (!redistributeGlobalHours || parseFloat(redistributeGlobalHours) <= 0))}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir Horas
                </Button>
              </div>
              
              {/* Carga de trabajo de compañeros */}
              <div className="mt-8">
                <Label className="text-sm font-semibold mb-3 block">Carga de trabajo (semanas restantes)</Label>
                <div className="space-y-3">
                  {employeeWorkload.map(emp => (
                    <div key={emp.employeeId} className="border rounded-lg p-3">
                      <p className="font-semibold text-sm mb-2">{emp.employeeName}</p>
                      <div className="space-y-2">
                        {emp.weekLoads.map(week => {
                          const isOverload = week.percentage > 100;
                          const isWarning = week.percentage > 85 && week.percentage <= 100;
                          
                          return (
                            <div key={week.weekStart} className="flex items-center justify-between text-xs p-2 rounded bg-slate-50">
                              <span className="text-muted-foreground font-medium">{week.weekLabel}:</span>
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "font-medium",
                                  isOverload && "text-red-600",
                                  isWarning && "text-amber-600",
                                  !isOverload && !isWarning && "text-slate-700"
                                )}>
                                  {week.hours}h
                                </span>
                                <span className="text-muted-foreground">/</span>
                                <span className="text-muted-foreground">{week.capacity}h</span>
                                {week.percentage > 0 && (
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      "text-[10px]",
                                      isOverload && "bg-red-50 text-red-700 border-red-200",
                                      isWarning && "bg-amber-50 text-amber-700 border-amber-200",
                                      !isOverload && !isWarning && "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    )}
                                  >
                                    {week.percentage}%
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
