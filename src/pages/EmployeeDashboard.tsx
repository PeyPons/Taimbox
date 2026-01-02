import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { MyWeekView } from '@/components/employee/MyWeekView';
import { MyDayView } from '@/components/employee/MyDayView';
import { WeeklyReportDialog } from '@/components/employee/WeeklyReportDialog';
import { PriorityInsights, ProjectTeamPulse } from '@/components/employee/DashboardWidgets';
import { ReliabilityIndexCard } from '@/components/employee/ReliabilityIndexCard';
import { PlanningInconsistenciesCard } from '@/components/employee/PlanningInconsistenciesCard';
import { CollaborationCards } from '@/components/employee/CollaborationCards';
import { MonthlyBalanceCard } from '@/components/employee/MonthlyBalanceCard';
import { WelcomeTour, useWelcomeTour } from '@/components/employee/WelcomeTour';
import { EmployeeSettings } from '@/components/employee/EmployeeSettings';
import { LoadIndicator } from '@/components/shared/LoadIndicator';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmployeeRow } from '@/components/planner/EmployeeRow';
import { AllocationSheet } from '@/components/planner/AllocationSheet';
import { AbsencesSheet } from '@/components/team/AbsencesSheet';
import { ProfessionalGoalsSheet } from '@/components/team/ProfessionalGoalsSheet';
import { getWeeksForMonth, getMonthName, getStorageKey, isAllocationInEffectiveMonth, normalizeWeekStart } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { supabase } from '@/lib/supabase';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, CalendarDays, TrendingUp, Calendar, Clock, CheckCircle2, Plus, X, Check, ListPlus, AlertTriangle, HelpCircle, RotateCcw, FileDown, CheckSquare, AlertCircle, Trash2 } from 'lucide-react';
import { startOfMonth, endOfMonth, max, min, format, startOfWeek, isSameMonth, parseISO, addDays, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';
import { Employee } from '@/types';
import { toast } from 'sonner';
import { cn, formatProjectName } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import { useIsMobile } from '@/hooks/use-mobile';
import { Monitor } from 'lucide-react';

const INTERNAL_CLIENT_NAME = 'Interno';
const INTERNAL_PROJECT_NAME = 'Gestiones internas';

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

interface NewTaskRow {
  id: string;
  projectId: string;
  taskName: string;
  hoursAssigned: string;
  weekDate: string;
  dependencyId?: string; // Nuevo campo para dependencia
}

interface ProjectBudgetStatus {
  totalComputed: number;
  totalPlanned: number;
  budgetMax: number;
  percentage: number;
}

export default function EmployeeDashboard() {
  const {
    employees, allocations, absences, teamEvents, projects, clients,
    addAllocation, isLoading: isGlobalLoading, getEmployeeMonthlyLoad, getEmployeeLoadForWeek,
    currentUser: appCurrentUser, loadDataForMonth, weeklyFeedback
  } = useApp();

  // Usar el currentUser del AppContext directamente (ya está vinculado)
  const myEmployeeProfile = appCurrentUser || null;
  const isLoadingProfile = isGlobalLoading;

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isLoadingMonth, setIsLoadingMonth] = useState(false);
  const loadedMonthsRef = useRef<Set<string>>(new Set());
  const [selectedCell, setSelectedCell] = useState<{ employeeId: string; weekStart: Date } | null>(null);

  const [showGoals, setShowGoals] = useState(false);
  const [showAbsences, setShowAbsences] = useState(false);
  const [isAddingExtra, setIsAddingExtra] = useState(false);
  const [isAddingTasks, setIsAddingTasks] = useState(false);

  const [extraTaskName, setExtraTaskName] = useState('');
  const [extraHours, setExtraHours] = useState('1');
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const [newTasks, setNewTasks] = useState<NewTaskRow[]>([]);
  const [openComboboxId, setOpenComboboxId] = useState<string | null>(null);
  const [showWeeklyDialog, setShowWeeklyDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('dependencies');

  const { showTour, resetTour } = useWelcomeTour();
  const { canAccess, hasPermission } = usePermissions();
  const isMobile = useIsMobile();

  // Detectar si hay tareas pendientes para Weekly (semanas pasadas, actual O transferidas)
  // Excluir tareas que ya han sido gestionadas (distribuidas, movidas, mantenidas)
  const hasPendingWeeklyTasks = useMemo(() => {
    if (!myEmployeeProfile) return false;
    const today = new Date();

    // Obtener IDs de tareas ya gestionadas desde weeklyFeedback
    const processedTaskIds = new Set(
      weeklyFeedback
        .filter(fb => fb.allocationId && (
          fb.comments?.includes('Tarea mantenida tal cual') ||
          fb.comments?.includes('Tarea movida a semana futura') ||
          fb.comments?.includes('Tarea transferida a') ||
          fb.comments?.includes('Distribuidas en')
        ))
        .map(fb => fb.allocationId!)
    );

    // Obtener IDs de tareas distribuidas desde transferencias
    // Estas ya fueron procesadas y no deben aparecer como alertas
    const distributedFromTransferIds = new Set(
      weeklyFeedback
        .filter(fb => fb.allocationId && fb.comments?.includes('Tarea distribuida desde transferencia'))
        .map(fb => fb.allocationId!)
    );

    // Buscar tareas en semanas pasadas o actual que no estén completadas Y no hayan sido procesadas
    const hasOpenTasks = allocations.some(a => {
      if (a.employeeId !== myEmployeeProfile.id) return false;
      if (a.status === 'completed') return false;
      if (processedTaskIds.has(a.id)) return false; // Excluir tareas ya procesadas
      if (distributedFromTransferIds.has(a.id)) return false; // EXCLUIR tareas distribuidas desde transferencias

      try {
        const taskWeekDate = parseISO(a.weekStartDate);
        const taskWeekEnd = addDays(taskWeekDate, 4); // Viernes de esa semana
        // Incluir si la semana ya pasó (viernes ya pasó) o es la actual
        return taskWeekEnd <= today && isSameMonth(taskWeekDate, currentMonth);
      } catch {
        return false;
      }
    });

    // También buscar tareas transferidas (aunque estén en semanas futuras)
    // PERO excluir si ya tienen feedback de "keep" o si ya fueron distribuidas
    const hasTransferredTasks = allocations.some(a => {
      if (a.employeeId !== myEmployeeProfile.id) return false;
      if (a.status === 'completed') return false;
      if (processedTaskIds.has(a.id)) return false; // Excluir tareas ya procesadas
      if (distributedFromTransferIds.has(a.id)) return false; // EXCLUIR tareas distribuidas desde transferencias

      // Usar campo de BD si está disponible, sino fallback al formato de texto
      const isTransferred = a.transferredFromAllocationId !== undefined && a.transferredFromAllocationId !== null
        || a.taskName?.includes('(transferida de');
      if (!isTransferred) return false;

      try {
        const taskWeekDate = parseISO(a.weekStartDate);
        return isSameMonth(taskWeekDate, currentMonth);
      } catch {
        return false;
      }
    });

    return hasOpenTasks || hasTransferredTasks;
  }, [allocations, myEmployeeProfile, currentMonth, weeklyFeedback]);

  const weeks = useMemo(() => getWeeksForMonth(currentMonth), [currentMonth]);
  const internalClient = useMemo(() => clients.find(c => c.name === INTERNAL_CLIENT_NAME), [clients]);
  const internalProject = useMemo(() => projects.find(p => p.name === INTERNAL_PROJECT_NAME && p.clientId === internalClient?.id), [projects, internalClient]);

  const activeProjects = useMemo(() => {
    return projects
      .filter(p => p.status === 'active')
      .sort((a, b) => {
        const clientA = clients.find(c => c.id === a.clientId)?.name || '';
        const clientB = clients.find(c => c.id === b.clientId)?.name || '';
        return clientA.localeCompare(clientB) || a.name.localeCompare(b.name);
      });
  }, [projects, clients]);

  // Memoizado: mapa de proyectos para acceso O(1)
  const projectsMap = useMemo(() => {
    const map = new Map<string, typeof projects[0]>();
    projects.forEach(p => map.set(p.id, p));
    return map;
  }, [projects]);

  // Memoizado: mapa de clientes para acceso O(1)
  const clientsMap = useMemo(() => {
    const map = new Map<string, typeof clients[0]>();
    clients.forEach(c => map.set(c.id, c));
    return map;
  }, [clients]);



  // Memoizado: allocations del mes actual indexadas por projectId
  const monthlyAllocationsByProject = useMemo(() => {
    const map = new Map<string, typeof allocations>();
    allocations.forEach(a => {
      try {
        if (isAllocationInEffectiveMonth(a.weekStartDate, currentMonth)) {
          if (!map.has(a.projectId)) {
            map.set(a.projectId, []);
          }
          map.get(a.projectId)!.push(a);
        }
      } catch { /* ignore invalid dates */ }
    });
    return map;
  }, [allocations, currentMonth]);

  const getProjectBudgetStatus = useCallback((projectId: string): ProjectBudgetStatus => {
    const project = projectsMap.get(projectId);
    if (!project) return { totalComputed: 0, totalPlanned: 0, budgetMax: 0, percentage: 0 };

    const monthAllocations = monthlyAllocationsByProject.get(projectId) || [];

    const totalComputed = round2(monthAllocations.filter(a => a.status === 'completed').reduce((sum, a) => sum + (a.hoursComputed || 0), 0));
    const totalPlanned = round2(monthAllocations.filter(a => a.status !== 'completed').reduce((sum, a) => sum + a.hoursAssigned, 0));
    const budgetMax = project.budgetHours || 0;
    const percentage = budgetMax > 0 ? (totalComputed / budgetMax) * 100 : 0;

    return { totalComputed, totalPlanned, budgetMax, percentage };
  }, [projectsMap, monthlyAllocationsByProject]);

  const getOrCreateInternalProject = async (): Promise<string | null> => {
    if (internalProject) return internalProject.id;

    setIsCreatingProject(true);
    try {
      let clientId = internalClient?.id;

      if (!clientId) {
        const { data: clientData, error: clientError } = await supabase
          .from('clients').insert({ name: INTERNAL_CLIENT_NAME, color: '#6b7280' }).select().single();
        if (clientError) throw clientError;
        clientId = clientData.id;
        toast.success(`Cliente "${INTERNAL_CLIENT_NAME}" creado`);
      }

      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert({ name: INTERNAL_PROJECT_NAME, client_id: clientId, status: 'active', budget_hours: 9999, minimum_hours: 0 })
        .select().single();

      if (projectError) throw projectError;
      toast.success(`Proyecto "${INTERNAL_PROJECT_NAME}" creado`);
      return projectData.id;

    } catch (error) {
      console.error('Error creando proyecto interno:', error);
      const errorMessage = (error as Error)?.message || 'Error al crear proyecto interno';
      toast.error(errorMessage);
      return null;
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleAddExtraTask = async () => {
    if (!myEmployeeProfile) return;
    if (!extraTaskName.trim()) { toast.error("Escribe un nombre para la tarea"); return; }

    const hours = Number(extraHours);
    if (isNaN(hours) || hours <= 0) { toast.error("Las horas deben ser mayores a 0"); return; }

    try {
      const projectId = await getOrCreateInternalProject();
      if (!projectId) { toast.error("No se pudo obtener el proyecto interno"); return; }

      const today = new Date();
      // Usar normalizeWeekStart para manejar correctamente semanas partidas (Effective Month)
      const formattedDate = normalizeWeekStart(today, startOfMonth(today));

      await addAllocation({
        projectId, employeeId: myEmployeeProfile.id, weekStartDate: formattedDate,
        hoursAssigned: hours, hoursActual: hours, hoursComputed: hours,
        taskName: extraTaskName, status: 'completed'
      });

      toast.success(`"${extraTaskName}" registrada (${hours}h)`);
      setExtraTaskName('');
      setExtraHours('1');
      setIsAddingExtra(false);
    } catch (error) {
      console.error('Error añadiendo tarea interna:', error);
      const errorMessage = (error as Error)?.message || 'Error al registrar la tarea';
      toast.error(errorMessage);
    }
  };

  const openAddTasksDialog = () => {
    // Usar siempre la fecha real de la semana (lunes) para guardar tareas
    const defaultWeek = weeks[0]?.weekStart ? format(weeks[0].weekStart, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
    setNewTasks([{ id: crypto.randomUUID(), projectId: '', taskName: '', hoursAssigned: '', weekDate: defaultWeek, dependencyId: 'none' }]);
    setIsAddingTasks(true);
  };

  const addTaskRow = () => {
    const lastTask = newTasks[newTasks.length - 1];
    // Usar siempre la fecha real de la semana (lunes) para guardar tareas
    const defaultWeek = lastTask?.weekDate || (weeks[0]?.weekStart ? format(weeks[0].weekStart, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
    setNewTasks(prev => [...prev, { id: crypto.randomUUID(), projectId: lastTask?.projectId || '', taskName: '', hoursAssigned: '', weekDate: defaultWeek, dependencyId: 'none' }]);
  };

  const removeTaskRow = (id: string) => {
    if (newTasks.length === 1) return;
    setNewTasks(prev => prev.filter(t => t.id !== id));
  };

  const updateTaskRow = (id: string, field: keyof NewTaskRow, value: string) => {
    setNewTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleSaveTasks = async () => {
    if (!myEmployeeProfile) return;

    const validTasks = newTasks.filter(t => t.projectId && t.taskName.trim() && parseFloat(t.hoursAssigned) > 0);
    if (validTasks.length === 0) { toast.error("Añade al menos una tarea válida"); return; }

    try {
      for (const task of validTasks) {
        await addAllocation({
          projectId: task.projectId, employeeId: myEmployeeProfile.id,
          weekStartDate: task.weekDate, hoursAssigned: parseFloat(task.hoursAssigned),
          taskName: task.taskName, status: 'planned'
        });
      }
      toast.success(`${validTasks.length} tarea(s) añadida(s)`);
      setIsAddingTasks(false);
      setNewTasks([]);
    } catch (error) {
      console.error('Error guardando tareas:', error);
      toast.error('Error al guardar las tareas');
    }
  };

  const handleExportCRM = () => {
    if (!myEmployeeProfile?.crmUserId) { toast.error("Configura tu ID de CRM en el perfil"); return; }

    const monthAllocations = allocations.filter(a =>
      a.employeeId === myEmployeeProfile.id &&
      isAllocationInEffectiveMonth(a.weekStartDate, currentMonth) &&
      a.status !== 'completed'
    );

    if (monthAllocations.length === 0) { toast.warning("No hay tareas pendientes para exportar"); return; }

    // Formato CSV según especificación:
    // 1. Nombre de tarea entre comillas dobles (escapar comillas internas)
    // 2. ID de usuario CRM
    // 3. Tipo: 'project', 'customer', o 'lead'
    // 4. ID del elemento (project externalId)
    // 5. Horas computables (con punto decimal, o vacío si no hay)
    const csvRows: string[] = [];

    monthAllocations.forEach(alloc => {
      const project = projects.find(p => p.id === alloc.projectId);

      // Escapar comillas dobles en el nombre de la tarea (reemplazar " por "")
      const taskName = (alloc.taskName || 'Tarea').replace(/"/g, '""');

      // Formatear horas: usar punto decimal y convertir a string
      const hoursStr = alloc.hoursAssigned ? alloc.hoursAssigned.toString() : '';

      // Construir la línea CSV: nombre entre comillas, luego campos separados por comas
      const csvLine = [
        `"${taskName}"`,                    // Nombre tarea entre comillas dobles
        myEmployeeProfile.crmUserId,        // user_id
        'project',                          // Tipo: 'project' (por ahora solo proyectos)
        project?.externalId || '',          // project_id
        hoursStr                            // horas computables (con punto decimal o vacío)
      ].join(',');

      csvRows.push(csvLine);
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tareas_crm_${format(currentMonth, 'yyyy-MM')}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success(`${monthAllocations.length} tareas exportadas para el CRM`);
  };

  const tasksImpact = useMemo(() => {
    if (!myEmployeeProfile) return { projects: [], weeks: [] };

    const projectImpact: Record<string, { name: string; adding: number; status: ProjectBudgetStatus }> = {};

    newTasks.forEach(task => {
      if (task.projectId && task.hoursAssigned) {
        const hours = parseFloat(task.hoursAssigned) || 0;
        if (hours > 0) {
          if (!projectImpact[task.projectId]) {
            const project = projects.find(p => p.id === task.projectId);
            projectImpact[task.projectId] = { name: project?.name || 'Desconocido', adding: 0, status: getProjectBudgetStatus(task.projectId) };
          }
          projectImpact[task.projectId].adding += hours;
        }
      }
    });

    const projectsResult = Object.entries(projectImpact).map(([id, data]) => {
      const newTotal = data.status.totalComputed + data.status.totalPlanned + data.adding;
      const exceeds = data.status.budgetMax > 0 && newTotal > data.status.budgetMax;
      return { id, ...data, newTotal, exceeds };
    });

    const weekImpact: Record<string, { weekIndex: number; adding: number }> = {};

    newTasks.forEach(task => {
      if (task.weekDate && task.hoursAssigned) {
        const hours = parseFloat(task.hoursAssigned) || 0;
        if (hours > 0) {
          if (!weekImpact[task.weekDate]) {
            // Usar siempre la fecha real de la semana (lunes) para buscar
            const weekIndex = weeks.findIndex((w) => format(w.weekStart, 'yyyy-MM-dd') === task.weekDate);
            weekImpact[task.weekDate] = { weekIndex: weekIndex >= 0 ? weekIndex : 0, adding: 0 };
          }
          weekImpact[task.weekDate].adding += hours;
        }
      }
    });

    const weeksResult = Object.entries(weekImpact).map(([weekDate, data]) => {
      const weekData = (data.weekIndex >= 0 && data.weekIndex < weeks.length) ? weeks[data.weekIndex] : undefined;
      const currentLoad = weekData ? getEmployeeLoadForWeek(
        myEmployeeProfile.id, weekDate, weekData.effectiveStart, weekData.effectiveEnd, currentMonth
      ) : { hours: 0, capacity: 40 };

      const newTotal = round2(currentLoad.hours + data.adding);
      const exceeds = newTotal > currentLoad.capacity;

      return { weekDate, weekIndex: data.weekIndex, adding: data.adding, currentHours: currentLoad.hours, capacity: currentLoad.capacity, newTotal, exceeds };
    }).sort((a, b) => a.weekIndex - b.weekIndex);

    return { projects: projectsResult, weeks: weeksResult };
  }, [newTasks, projects, weeks, currentMonth, myEmployeeProfile, getEmployeeLoadForWeek]);

  const getProjectExceedStatus = (projectId: string): boolean => tasksImpact.projects.find(p => p.id === projectId)?.exceeds || false;
  const getWeekExceedStatus = (weekDate: string): boolean => tasksImpact.weeks.find(w => w.weekDate === weekDate)?.exceeds || false;

  const handlePrevMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth(prev => {
    // Bloquear futuro +2 meses (opcional, pero buena práctica)
    return new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
  });
  const handleToday = () => setCurrentMonth(new Date());

  // Helper para obtener dependencias disponibles (tareas del mismo proyecto, mes actual, no completadas)
  const getAvailableDependencies = (projectId: string, currentTaskId?: string) => {
    if (!projectId) return [];
    return allocations.filter(a =>
      a.projectId === projectId &&
      a.id !== currentTaskId &&
      a.status !== 'completed' &&
      isAllocationInEffectiveMonth(a.weekStartDate, currentMonth) // Solo del mes actual
    );
  };

  // Cargar datos del mes cuando cambia el mes visible (igual que DeadlinesPage)
  useEffect(() => {
    if (!isGlobalLoading && !isLoadingProfile) {
      const monthKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;

      // Si ya se cargó este mes según el ref, no hacer nada (evita loops)
      if (loadedMonthsRef.current.has(monthKey)) {
        setIsLoadingMonth(false);
        return;
      }

      // Verificar si REALMENTE tenemos datos para este mes en el contexto
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const hasDataInContext = allocations.some(a => {
        try {
          const allocDate = new Date(a.weekStartDate);
          return allocDate >= monthStart && allocDate <= monthEnd;
        } catch {
          return false;
        }
      });

      // Si hay datos, marcar como cargado y salir
      if (hasDataInContext) {
        loadedMonthsRef.current.add(monthKey);
        setIsLoadingMonth(false);
        return;
      }

      // Si no hay datos, cargarlos
      setIsLoadingMonth(true);
      loadDataForMonth(currentMonth)
        .then(() => {
          // Solo marcamos como cargado si terminó con éxito
          loadedMonthsRef.current.add(monthKey);
        })
        .finally(() => {
          setIsLoadingMonth(false);
        });
    }
  }, [currentMonth, isGlobalLoading, isLoadingProfile, loadDataForMonth]); // REMOVIDO allocations para evitar loops

  // Mostrar loader mientras carga global o el perfil
  if (isGlobalLoading || isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin opacity-60" />
        </div>
      </div>
    );
  }

  // Mostrar loading del mes igual que DeadlinesPage (retorno temprano)
  if (isLoadingMonth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400">Cargando tareas...</div>
      </div>
    );
  }

  // Solo mostrar error después de que termine de cargar
  if (!myEmployeeProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-semibold text-slate-700">No se encontró tu perfil de empleado</h2>
          <p className="text-slate-500">Contacta con un administrador para vincular tu cuenta de usuario con un perfil de empleado.</p>
        </div>
      </div>
    );
  }

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const gridTemplate = `${isMobile ? '100px' : '180px'} repeat(${weeks.length}, minmax(0, 1fr)) 90px`;
  const monthlyLoad = getEmployeeMonthlyLoad(myEmployeeProfile.id, currentMonth.getFullYear(), currentMonth.getMonth());

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Fondo con gradiente animado */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-primary/5 via-white to-primary/5 opacity-50" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_50%,rgba(var(--primary-rgb),0.1),transparent_50%)]" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_80%_80%,rgba(var(--primary-rgb),0.1),transparent_50%)]" />

      {/* 1. CABECERA + ACCIONES */}
      {/* 1. CABECERA + ACCIONES */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Botón Weekly siempre visible */}
        <Button
          onClick={() => setShowWeeklyDialog(true)}
          className={cn(
            "gap-2 shadow-sm transition-all flex-1 sm:flex-initial",
            hasPendingWeeklyTasks
              ? "bg-amber-600 text-white hover:bg-amber-700 animate-pulse shadow-lg shadow-amber-500/50"
              : "bg-primary text-white hover:bg-primary/90"
          )}
          data-tour="weekly-button"
        >
          {hasPendingWeeklyTasks ? (
            <>
              <AlertCircle className="h-4 w-4 animate-bounce" /> Weekly
            </>
          ) : (
            <>
              <CheckSquare className="h-4 w-4" /> Weekly
            </>
          )}
        </Button>

        {/* Añadir tareas siempre visible */}
        <Button onClick={openAddTasksDialog} className="gap-2 bg-primary text-white hover:bg-primary/90 shadow-sm flex-1 sm:flex-initial" data-tour="add-tasks">
          <ListPlus className="h-4 w-4" /> <span className="hidden xs:inline">Añadir tareas</span><span className="xs:hidden">Tareas</span>
        </Button>

        <div className="h-9 w-px bg-slate-200 mx-1 hidden lg:block"></div>

        {/* Acciones Secundarias: Agrupadas en mobile, visibles en desktop */}
        {isMobile ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 border-slate-300 hover:bg-slate-50 flex-1 sm:flex-initial">
                <Plus className="h-4 w-4" /> <span className="hidden xs:inline">Más</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleExportCRM} disabled={!myEmployeeProfile?.crmUserId} className="gap-2 text-purple-700">
                <FileDown className="h-4 w-4" /> Tareas CRM
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsAddingExtra(true)} className="gap-2 text-slate-700">
                <Clock className="h-4 w-4" /> Gestión interna
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowGoals(true)} className="gap-2 text-emerald-700">
                <TrendingUp className="h-4 w-4" /> Objetivos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowAbsences(true)} className="gap-2 text-amber-700">
                <Calendar className="h-4 w-4" /> Ausencias
              </DropdownMenuItem>
              <DropdownMenuItem onClick={resetTour} className="gap-2">
                <RotateCcw className="h-4 w-4" /> Ver tour
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <Button onClick={handleExportCRM} variant="outline" className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
              disabled={!myEmployeeProfile?.crmUserId} title={!myEmployeeProfile?.crmUserId ? "Configura tu ID de CRM en el perfil" : "Exportar tareas al CRM"} data-tour="crm-export">
              <FileDown className="h-4 w-4" /> Tareas CRM
            </Button>

            <Dialog open={isAddingExtra} onOpenChange={setIsAddingExtra}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-slate-300 hover:bg-slate-50" data-tour="internal-tasks">
                  <Clock className="h-4 w-4" /> Gestión interna
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md" aria-describedby="internal-tasks-description">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-slate-600" />Registrar gestión interna</DialogTitle>
                  <DialogDescription id="internal-tasks-description">Reuniones, formaciones, deadlines u otras tareas no asociadas a clientes.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nombre de la tarea</Label>
                    <Input placeholder="Ej: Reunión de equipo" value={extraTaskName} onChange={e => setExtraTaskName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Horas</Label>
                    <Input type="number" min="0.5" step="0.5" value={extraHours} onChange={e => setExtraHours(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddingExtra(false)}>Cancelar</Button>
                  <Button onClick={handleAddExtraTask} disabled={isCreatingProject}>{isCreatingProject ? 'Creando...' : 'Registrar'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={() => setShowGoals(true)} className="gap-2 text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100" data-tour="goals">
              <TrendingUp className="h-4 w-4" /> Objetivos
            </Button>

            <Button variant="outline" onClick={() => setShowAbsences(true)} className="gap-2 text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100" data-tour="absences">
              <Calendar className="h-4 w-4" /> Ausencias
            </Button>
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          <EmployeeSettings employeeId={myEmployeeProfile.id} />
          {!isMobile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-slate-600">
                  <HelpCircle className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={resetTour} className="gap-2">
                  <RotateCcw className="h-4 w-4" />Ver tour de bienvenida
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* 2. CONTROL MES */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 bg-gradient-to-r from-indigo-50 to-purple-50 p-3 sm:p-4 rounded-xl border border-indigo-200/50 shadow-md backdrop-blur-sm">
        <h2 className="text-base sm:text-lg font-bold capitalize bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent flex items-center gap-2 sm:min-w-[180px]">
          {getMonthName(currentMonth)} <Badge variant="outline" className="text-xs font-normal bg-white/80">{currentMonth.getFullYear()}</Badge>
        </h2>
        <div className="hidden sm:block h-6 w-px bg-indigo-200 mx-2" />
        <div className="flex items-center gap-1 w-full sm:w-auto">
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-7 sm:w-7 hover:bg-indigo-100" onClick={handlePrevMonth}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={handleToday} className="h-8 sm:h-7 text-xs px-3 sm:px-2 hover:bg-indigo-100 flex-1 sm:flex-initial"><CalendarDays className="h-3.5 w-3.5 mr-1.5" />Mes actual</Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-7 sm:w-7 hover:bg-indigo-100" onClick={handleNextMonth}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* 3. CALENDARIO */}
      <Card className="border-indigo-200/50 shadow-xl bg-white/90 backdrop-blur-sm relative overflow-hidden max-w-full" data-tour="calendar">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 -z-10" />
        <div className="overflow-x-auto custom-scrollbar w-full">
          <div className="px-0">
            <div className="grid bg-slate-50 border-b" style={{ gridTemplateColumns: gridTemplate }}>
              <div className="px-4 py-3 font-bold text-sm text-slate-700 flex items-center border-r sticky left-0 z-20 bg-slate-50">Mi calendario</div>
              {weeks.map((week, index) => {
                // Calcular solo días laborables (lun-vie) en el rango efectivo (igual que en AllocationSheet)
                const effectiveStart = week.effectiveStart || week.weekStart;
                const effectiveEnd = week.effectiveEnd || addDays(week.weekStart, 6);

                const workingDays = [];
                let currentDay = new Date(effectiveStart);
                while (currentDay <= effectiveEnd) {
                  const dayOfWeek = currentDay.getDay();
                  // 1 = lunes, 5 = viernes (0 = domingo, 6 = sábado)
                  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                    workingDays.push(new Date(currentDay));
                  }
                  currentDay = addDays(currentDay, 1);
                }

                // Formatear solo el primer y último día laborable
                const firstWorkingDay = workingDays[0];
                const lastWorkingDay = workingDays[workingDays.length - 1];
                const weekDateLabel = firstWorkingDay && lastWorkingDay
                  ? `${format(firstWorkingDay, 'd', { locale: es })}-${format(lastWorkingDay, 'd MMM', { locale: es })}`
                  : `${format(effectiveStart, 'd', { locale: es })}-${format(effectiveEnd, 'd MMM', { locale: es })}`;

                return (
                  <div key={week.weekStart.toISOString()} className="text-center px-1 py-2 border-r flex flex-col justify-center">
                    <span className="text-xs font-bold uppercase text-slate-500">S{index + 1}</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {weekDateLabel}
                    </span>
                  </div>
                );
              })}
              <div className="px-2 py-3 font-bold text-xs text-center flex items-center justify-center">TOTAL MES</div>
            </div>

            <div className="grid bg-white" style={{ gridTemplateColumns: gridTemplate }}>
              <EmployeeRow employee={myEmployeeProfile} weeks={weeks} projects={projects} allocations={allocations} absences={absences} teamEvents={teamEvents} viewDate={currentMonth} onOpenSheet={(empId, date) => setSelectedCell({ employeeId: empId, weekStart: date })} />
              <div className="flex items-center justify-center border-l p-2 bg-slate-50/30">
                <LoadIndicator
                  hours={monthlyLoad.hours}
                  capacity={monthlyLoad.capacity}
                  percentage={monthlyLoad.percentage}
                  size="md"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>


      {/* 4. VISTA ORGANIZADA POR PESTAÑAS - PRIORIDAD DE MAYOR A MENOR */}
      <Card className="border-indigo-200/50 shadow-xl bg-white/90 backdrop-blur-sm relative overflow-hidden max-w-full" data-tour="projects-summary">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 to-purple-50/30 -z-10" />
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-full">
          <TabsList className="w-full justify-start h-auto p-1 bg-gradient-to-r from-indigo-50 to-purple-50 flex-nowrap overflow-x-auto custom-scrollbar border-b border-indigo-100/50 gap-2 max-w-full">
            <TabsTrigger value="dependencies" className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-indigo-200 transition-all shrink-0 px-2 sm:px-4 text-xs sm:text-sm">
              Dependencias
            </TabsTrigger>
            <TabsTrigger value="coherence" className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-indigo-200 transition-all shrink-0 px-2 sm:px-4 text-xs sm:text-sm">
              Coherencia
            </TabsTrigger>
            <TabsTrigger value="teammates" className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-indigo-200 transition-all shrink-0 px-2 sm:px-4 text-xs sm:text-sm">
              Compañeros
            </TabsTrigger>
            <TabsTrigger value="projects" className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-indigo-200 transition-all shrink-0 px-2 sm:px-4 text-xs sm:text-sm">
              Proyectos
            </TabsTrigger>
            <TabsTrigger value="metrics" className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-indigo-200 transition-all shrink-0 px-2 sm:px-4 text-xs sm:text-sm">
              Métricas
            </TabsTrigger>
          </TabsList>

          {/* 1. DEPENDENCIAS - MÁS IMPORTANTE */}
          <TabsContent value="dependencies" className="mt-4 space-y-6 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div data-tour="priority-widget">
                <PriorityInsights employeeId={myEmployeeProfile.id} viewDate={currentMonth} />
              </div>
              <div data-tour="dependencies-widget">
                <ProjectTeamPulse employeeId={myEmployeeProfile.id} viewDate={currentMonth} />
              </div>
            </div>
          </TabsContent>

          {/* 2. COHERENCIA DE PLANIFICACIÓN */}
          <TabsContent value="coherence" className="mt-4 p-6">
            <div data-tour="planning-inconsistencies">
              <PlanningInconsistenciesCard employeeId={myEmployeeProfile.id} viewDate={currentMonth} />
            </div>
          </TabsContent>

          {/* 3. COMPAÑEROS */}
          <TabsContent value="teammates" className="mt-4 p-6">
            <div data-tour="collaboration-cards">
              <CollaborationCards employeeId={myEmployeeProfile.id} viewDate={currentMonth} />
            </div>
          </TabsContent>

          {/* 4. PROYECTOS DEL MES */}
          <TabsContent value="projects" className="mt-4 p-6">
            <MyWeekView employeeId={myEmployeeProfile.id} viewDate={currentMonth} />
          </TabsContent>

          {/* 5. MÉTRICAS Y ANÁLISIS */}
          <TabsContent value="metrics" className="mt-4 space-y-6 p-6">
            {/* BALANCE MOTIVACIONAL */}
            <div data-tour="monthly-balance">
              <MonthlyBalanceCard employeeId={myEmployeeProfile.id} viewDate={currentMonth} />
            </div>

            {/* PRECISIÓN DE PLANIFICACIÓN */}
            <div data-tour="reliability-index">
              <ReliabilityIndexCard employeeId={myEmployeeProfile.id} viewDate={currentMonth} />
            </div>
          </TabsContent>
        </Tabs>
      </Card >

      {/* MODALES */}
      {
        selectedCell && (
          <AllocationSheet open={!!selectedCell} onOpenChange={(open) => !open && setSelectedCell(null)} employeeId={selectedCell.employeeId} weekStart={selectedCell.weekStart.toISOString()} viewDateContext={currentMonth} />
        )
      }

      <Dialog open={isAddingTasks} onOpenChange={setIsAddingTasks}>
        <DialogContent className="sm:max-w-[900px]" aria-describedby="add-tasks-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ListPlus className="h-5 w-5 text-primary" />Añadir tareas</DialogTitle>
            <DialogDescription id="add-tasks-description">Añade múltiples tareas a tu planificación de {getMonthName(currentMonth)}.</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="hidden sm:flex text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-2">
              <div className="flex-1 pl-1">Proyecto</div>
              <div className="flex-1 pl-1">Tarea</div>
              <div className="w-40 px-2">Dependencia</div>
              <div className="w-24 text-center">Horas</div>
              <div className="w-32">Semana</div>
              <div className="w-8"></div>
            </div>

            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 -mr-2">
              {newTasks.map((task) => {
                const projectExceeds = task.projectId && getProjectExceedStatus(task.projectId);
                const weekExceeds = task.weekDate && getWeekExceedStatus(task.weekDate);

                return (
                  <div key={task.id} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-slate-50/50 sm:bg-transparent p-2 sm:p-0 rounded-lg border sm:border-0 border-slate-200">
                    <div className="flex-1 min-w-0">
                      <Popover open={openComboboxId === task.id} onOpenChange={(isOpen) => setOpenComboboxId(isOpen ? task.id : null)}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" role="combobox" className={cn("w-full justify-between h-9 text-xs truncate", projectExceeds && "border-amber-400 bg-amber-50")}>
                            <span className="truncate">{task.projectId ? formatProjectName(activeProjects.find(p => p.id === task.projectId)?.name || '') : "Seleccionar..."}</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] sm:w-[400px] p-0">
                          <Command>
                            <CommandInput placeholder="Buscar proyecto..." />
                            <CommandList>
                              <CommandEmpty>No hay proyectos</CommandEmpty>
                              <CommandGroup>
                                {activeProjects.map(p => {
                                  const client = clients.find(c => c.id === p.clientId);
                                  // Calcular presupuesto restante
                                  const budgetStatus = getProjectBudgetStatus(p.id);
                                  const remaining = budgetStatus.budgetMax > 0 ? budgetStatus.budgetMax - budgetStatus.totalComputed : null;

                                  return (
                                    <CommandItem
                                      key={p.id}
                                      value={p.name}
                                      onSelect={() => { updateTaskRow(task.id, 'projectId', p.id); setOpenComboboxId(null); }}
                                    >
                                      <Check className={cn("mr-2 h-4 w-4", task.projectId === p.id ? "opacity-100" : "opacity-0")} />
                                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: client?.color || '#6b7280' }} />
                                          <span className="truncate font-medium">{formatProjectName(p.name)}</span>
                                          <span className="text-xs text-muted-foreground truncate">({client?.name})</span>
                                        </div>
                                        {/* Información de presupuesto inmediata */}
                                        <div className="text-[10px] pl-4 text-slate-500 flex gap-2">
                                          <span>Plan: {budgetStatus.totalPlanned}h</span>
                                          <span>Comp: {budgetStatus.totalComputed}h</span>
                                          {remaining !== null && (
                                            <span className={cn(remaining < 0 ? "text-red-500 font-bold" : "text-emerald-600")}>
                                              Disp: {remaining.toFixed(1)}h
                                            </span>
                                          )}
                                        </div>
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

                    <div className="flex-1">
                      <Input placeholder="Nombre de la tarea" className="h-9 text-xs" value={task.taskName} onChange={e => updateTaskRow(task.id, 'taskName', e.target.value)} />
                    </div>

                    <div className="w-full sm:w-40">
                      <Select value={task.dependencyId || 'none'} onValueChange={(v) => updateTaskRow(task.id, 'dependencyId', v)} disabled={!task.projectId}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Sin dep." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">-- Ninguna --</SelectItem>
                          {getAvailableDependencies(task.projectId, undefined).map(dep => {
                            const owner = employees.find(e => e.id === dep.employeeId);
                            return <SelectItem key={dep.id} value={dep.id} className="text-xs">{dep.taskName} ({owner?.name})</SelectItem>;
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="w-full sm:w-24">
                        <Input type="number" step="0.5" className="h-9 text-xs text-center" value={task.hoursAssigned || ''} onChange={e => updateTaskRow(task.id, 'hoursAssigned', e.target.value)} />
                      </div>
                      <div className="w-full sm:w-32">
                        <Select value={task.weekDate || ''} onValueChange={(v) => updateTaskRow(task.id, 'weekDate', v)}>
                          <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Semana..." /></SelectTrigger>
                          <SelectContent>
                            {weeks.map((w, idx) => (
                              <SelectItem key={idx} value={format(w.weekStart, 'yyyy-MM-dd')}>
                                S{idx + 1} ({format(w.weekStart, 'd/M')})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 shrink-0" onClick={() => removeTaskRow(task.id)} disabled={newTasks.length <= 1}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button variant="outline" size="sm" onClick={() => {
              const lastTask = newTasks.length > 0 ? newTasks[newTasks.length - 1] : null;
              const defaultKey = weeks.length > 0 ? format(weeks[0].weekStart, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
              setNewTasks(prev => [...prev, {
                id: crypto.randomUUID(),
                projectId: lastTask ? lastTask.projectId : '',
                taskName: '',
                hoursAssigned: '',
                weekDate: lastTask ? lastTask.weekDate : defaultKey,
                dependencyId: 'none'
              }]);
            }} className="w-full mt-4 border-dashed">
              <Plus className="h-4 w-4 mr-2" /> Añadir otra fila
            </Button>
          </div>

          <DialogFooter className="flex flex-col gap-2">
            {(tasksImpact.projects.length > 0 || tasksImpact.weeks.length > 0) && (
              <div className="w-full flex items-center gap-2 text-xs p-2 bg-slate-50 rounded-lg flex-wrap">
                {tasksImpact.projects.map((p) => (
                  <div key={p.id} className="flex items-center gap-1.5">
                    {p.exceeds ? <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    <span className={cn("font-medium truncate max-w-[100px]", p.exceeds ? "text-amber-700" : "text-emerald-700")}>{formatProjectName(p.name)}</span>
                    <span className={cn("tabular-nums", p.exceeds ? "text-amber-600" : "text-emerald-600")}>+{p.adding}h</span>
                  </div>
                ))}
                {tasksImpact.projects.length > 0 && tasksImpact.weeks.length > 0 && <span className="text-slate-300">│</span>}
                {tasksImpact.weeks.map((w) => (
                  <div key={w.weekDate} className="flex items-center gap-1.5">
                    {w.exceeds ? <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    <span className={cn("font-medium", w.exceeds ? "text-amber-700" : "text-emerald-700")}>S{w.weekIndex + 1}</span>
                    <span className={cn("tabular-nums text-[10px]", w.exceeds ? "text-amber-600" : "text-emerald-600")}>{w.newTotal}h/{w.capacity}h</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 w-full">
              <Button variant="outline" onClick={() => setIsAddingTasks(false)}>Cancelar</Button>
              <Button onClick={handleSaveTasks} className="bg-primary hover:bg-primary/90">Guardar tareas</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showGoals && <ProfessionalGoalsSheet open={showGoals} onOpenChange={setShowGoals} employeeId={myEmployeeProfile.id} />}
      {showAbsences && <AbsencesSheet open={showAbsences} onOpenChange={setShowAbsences} employeeId={myEmployeeProfile.id} />}

      {
        myEmployeeProfile && (
          <>
            <WeeklyReportDialog
              open={showWeeklyDialog}
              onOpenChange={setShowWeeklyDialog}
              employeeId={myEmployeeProfile.id}
              viewDate={currentMonth}
            />
          </>
        )
      }

      <WelcomeTour forceShow={showTour} onTabChange={setActiveTab} />

      {/* Mi Día View - Focus semanal/diario */}
      <MyDayView />
    </div>
  );
}
