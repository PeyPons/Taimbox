import { useState, useMemo, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useApp } from '@/contexts/AppContext';
import { Allocation, Project } from '@/types';
import { Plus, Pencil, CalendarDays, X, ChevronLeft, ChevronRight, MoreHorizontal, ArrowRightCircle, Search, Check, TrendingUp, TrendingDown, Trash2, Link as LinkIcon, AlertOctagon, CheckCircle2, AlertTriangle, Users, ChevronDown, Palmtree, Zap, Clock, LayoutGrid, Calendar, FoldVertical, UnfoldVertical, ArrowUpDown, SortAsc, SortDesc } from 'lucide-react';
import { cn, formatProjectName } from '@/lib/utils';
import { getWeeksForMonth, getStorageKey, isAllocationInEffectiveMonth } from '@/utils/dateUtils';
import { format, addMonths, subMonths, isSameMonth, parseISO, addDays, isBefore, startOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { PlannerTour } from './PlannerTour';
import { WeekNavigation } from './WeekNavigation';
import { ProjectImpactSummary } from './ProjectImpactSummary';
import { useAllocationSheet } from '@/hooks/useAllocationSheet';

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

interface AllocationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  weekStart: string;
  viewDateContext?: Date;
}

interface NewTaskRow {
  id: string;
  projectId: string;
  taskName: string;
  hours: string;
  weekDate: string;
  description: string;
  dependencyId?: string;
}

interface ProjectBudgetStatus {
  totalComputed: number;
  totalPlanned: number;
  budgetMax: number;
  budgetMin: number;
  percentage: number;
  status: 'healthy' | 'warning' | 'overload' | 'under';
  breakdown: { employeeId: string; employeeName: string; computed: number; planned: number }[];
}

type SortOption = 'budget_desc' | 'budget_asc' | 'my_hours_desc' | 'my_hours_asc' | 'name_asc' | 'name_desc';

export function AllocationSheet({ open, onOpenChange, employeeId, weekStart, viewDateContext }: AllocationSheetProps) {
  const {
    employees, projects, allocations, getEmployeeAllocationsForWeek, getEmployeeLoadForWeek, getProjectById,
    addAllocation, updateAllocation, deleteAllocation, isLoading: isGlobalLoading, loadDataForMonth, weeklyFeedback
  } = useApp();

  // Inicializar con la semana actual si no se especifica otra
  const getInitialViewDate = () => {
    if (viewDateContext) return viewDateContext;
    const today = new Date();
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    // Si weekStart es válido y está en el mes actual, usarlo; sino usar semana actual
    if (weekStart) {
      try {
        const weekStartDate = parseISO(weekStart);
        if (isSameMonth(weekStartDate, today)) {
          return weekStartDate;
        }
      } catch {
        // Si hay error parseando, usar semana actual
      }
    }
    // Siempre usar el mes actual para asegurar que currentWeekIndex funcione correctamente
    return currentWeekStart;
  };

  const [viewDate, setViewDate] = useState(() => getInitialViewDate());
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());
  const [isTourActive, setIsTourActive] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const loadedMonthsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      // Prioridad: weekStart proporcionado > viewDateContext > semana actual
      let targetDate: Date;
      const targetWeekIndex: number | null = null;

      // Si se proporciona weekStart, usarlo para encontrar la semana específica
      if (weekStart) {
        try {
          const weekStartDate = parseISO(weekStart);

          // CORRECCIÓN: Si tenemos un contexto de fecha (ej. venimos del dashboard de Enero)
          // y la semana pertenece a ese mes (aunque empiece en el anterior), respetar el contexto.
          if (viewDateContext && isAllocationInEffectiveMonth(weekStartDate, viewDateContext)) {
            targetDate = viewDateContext;
          } else {
            // Si no hay contexto o la semana no pertenece, usar el mes de inicio de la semana
            targetDate = new Date(weekStartDate.getFullYear(), weekStartDate.getMonth(), 1);
          }

          // Calcular el índice de la semana dentro del mes
          // Esto se hará después de que weeks esté disponible, pero preparamos la fecha
        } catch {
          // Si hay error parseando, usar viewDateContext o mes actual
          targetDate = viewDateContext || new Date();
        }
      } else if (viewDateContext) {
        targetDate = viewDateContext;
      } else {
        const today = new Date();
        const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
        targetDate = new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), 1);
      }

      setViewDate(targetDate);

      // Si tenemos weekStart, encontrar su índice después de que weeks esté disponible
      if (weekStart) {
        try {
          const weekStartDate = parseISO(weekStart);
          // Usaremos un efecto separado para encontrar el índice una vez que weeks esté disponible
          setSelectedWeekIndex(null); // Temporal, se actualizará después
        } catch {
          setSelectedWeekIndex(null);
        }
      } else {
        setSelectedWeekIndex(null);
      }
    }
  }, [open, weekStart, viewDateContext]);

  // Cargar datos del mes cuando cambia el mes visible
  useEffect(() => {
    if (open && !isGlobalLoading) {
      const monthKey = `${viewDate.getFullYear()}-${viewDate.getMonth()}`;

      // Si ya se cargó este mes según el ref, no hacer nada (evita loops)
      if (loadedMonthsRef.current.has(monthKey)) {
        setIsLoadingTasks(false);
        return;
      }

      // Verificar si REALMENTE tenemos datos para este mes en el contexto
      const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
      const monthEnd = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);

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
        setIsLoadingTasks(false);
        return;
      }

      // Si no hay datos, cargarlos
      setIsLoadingTasks(true);
      loadDataForMonth(viewDate)
        .then(() => {
          // Solo marcamos como cargado si terminó con éxito
          loadedMonthsRef.current.add(monthKey);
        })
        .finally(() => {
          setIsLoadingTasks(false);
        });
    }
  }, [viewDate, open, isGlobalLoading, loadDataForMonth]); // REMOVIDO allocations para evitar loops

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<Allocation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [recentlyToggled, setRecentlyToggled] = useState<Set<string>>(new Set());

  const [newTasks, setNewTasks] = useState<NewTaskRow[]>([]);
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineNameValue, setInlineNameValue] = useState('');
  const inlineInputRef = useRef<HTMLInputElement>(null);

  const [editProjectId, setEditProjectId] = useState('');
  const [editTaskName, setEditTaskName] = useState('');
  const [editHours, setEditHours] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editWeek, setEditWeek] = useState('');
  const [editDependencyId, setEditDependencyId] = useState<string>('none');

  const [openComboboxId, setOpenComboboxId] = useState<string | null>(null);
  const [showAllWeeks, setShowAllWeeks] = useState(false);
  // Inicializar selectedWeekIndex como null para que use currentWeekIndex del hook por defecto
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number | null>(null);

  // Preferencia de visualización: auto-expandir o colapsar proyectos
  const [autoExpand, setAutoExpand] = useState<boolean>(() => {
    const saved = localStorage.getItem('planner_autoExpand');
    return saved !== null ? JSON.parse(saved) : true; // Por defecto expandido
  });

  // Opción de ordenación
  const [sortOption, setSortOption] = useState<SortOption>(() => {
    const saved = localStorage.getItem('planner_sortOption');
    return (saved as SortOption) || 'budget_desc';
  });

  // Proyecto seleccionado para mostrar detalles en panel lateral
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Filtro: solo proyectos donde tengo tareas esta semana
  const [showOnlyMyProjects, setShowOnlyMyProjects] = useState(true);

  // Usar hook personalizado para lógica de negocio
  const {
    employee,
    weeks,
    currentWeekIndex: hookCurrentWeekIndex,
    activeProjects,
    monthlyProjectSummary,
    getProjectBudgetStatus,
  } = useAllocationSheet(employeeId, viewDate);

  // Encontrar el índice de la semana clicada cuando weeks esté disponible
  useEffect(() => {
    if (open && weekStart && weeks.length > 0 && selectedWeekIndex === null) {
      try {
        const weekStartDate = parseISO(weekStart);
        const weekIndex = weeks.findIndex(w => {
          const wStart = new Date(w.weekStart);
          return wStart.getTime() === weekStartDate.getTime();
        });
        if (weekIndex >= 0) {
          setSelectedWeekIndex(weekIndex);
        }
      } catch {
        // Si hay error, usar semana actual
        setSelectedWeekIndex(null);
      }
    }
  }, [open, weekStart, weeks, selectedWeekIndex]);

  // Índice de semana activo (seleccionado por usuario o actual)
  // Usar useMemo para asegurar que el cálculo se haga después de que todo esté inicializado
  const activeWeekIndex = useMemo(() => {
    if (selectedWeekIndex !== null) return selectedWeekIndex;
    // hookCurrentWeekIndex siempre debería estar disponible, pero usamos 0 como fallback
    return hookCurrentWeekIndex ?? 0;
  }, [selectedWeekIndex, hookCurrentWeekIndex]);

  // Semanas a mostrar según el modo
  const visibleWeeks = useMemo(() => {
    if (showAllWeeks) return weeks;
    if (weeks.length === 0 || activeWeekIndex < 0 || activeWeekIndex >= weeks.length) return [];
    return [weeks[activeWeekIndex]];
  }, [weeks, showAllWeeks, activeWeekIndex]);

  // Navegación entre semanas
  const goToPrevWeek = () => {
    if (activeWeekIndex > 0) {
      setSelectedWeekIndex(activeWeekIndex - 1);
    }
  };

  const goToNextWeek = () => {
    if (activeWeekIndex < weeks.length - 1) {
      setSelectedWeekIndex(activeWeekIndex + 1);
    }
  };

  const monthName = format(viewDate, 'MMMM', { locale: es });
  const monthLabel = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} - ${format(viewDate, 'yyyy')}`;

  const getAvailableDependencies = (projectId: string, currentTaskId?: string) => {
    if (!projectId) return [];
    return allocations.filter(a =>
      a.projectId === projectId &&
      a.id !== currentTaskId &&
      a.status !== 'completed'
    );
  };

  useEffect(() => {
    if (inlineEditingId && inlineInputRef.current) inlineInputRef.current.focus();
  }, [inlineEditingId]);

  // Persistir preferencias en localStorage
  useEffect(() => {
    localStorage.setItem('planner_autoExpand', JSON.stringify(autoExpand));
    // Limpiar toggles manuales cuando cambia la preferencia
    setCollapsedProjects(new Set());
  }, [autoExpand]);

  useEffect(() => {
    localStorage.setItem('planner_sortOption', sortOption);
  }, [sortOption]);

  if (!employee) return null;

  // Mostrar loading igual que DeadlinesPage (retorno temprano)
  if (isLoadingTasks) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-4xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{employee.name} - Planificación</SheetTitle>
          </SheetHeader>
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="text-slate-400">Cargando tareas...</div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const handlePrevMonth = () => setViewDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setViewDate(prev => addMonths(prev, 1));

  const toggleProjectCollapse = (projectId: string) => {
    setCollapsedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const startAdd = (weekStartReal: Date) => {
    // Usar siempre la fecha real de la semana (lunes) para guardar tareas
    // No usar getStorageKey porque normaliza según el mes visible
    const weekStartDate = format(weekStartReal, 'yyyy-MM-dd');
    setEditingAllocation(null);
    setNewTasks([{
      id: crypto.randomUUID(), projectId: '', taskName: '', hours: '', weekDate: weekStartDate, description: '', dependencyId: 'none'
    }]);
    setIsFormOpen(true);
  };

  const addTaskRow = () => {
    const lastTask = newTasks.length > 0 ? newTasks[newTasks.length - 1] : null;
    // Usar siempre la fecha real de la semana (lunes) para guardar tareas
    const defaultKey = weeks.length > 0 ? format(weeks[0].weekStart, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
    setNewTasks(prev => [...prev, {
      id: crypto.randomUUID(),
      projectId: lastTask ? lastTask.projectId : '',
      taskName: '', hours: '', weekDate: lastTask ? lastTask.weekDate : defaultKey, description: '', dependencyId: 'none'
    }]);
  };

  const removeTaskRow = (id: string) => {
    if (newTasks.length === 1) return;
    setNewTasks(prev => prev.filter(t => t.id !== id));
  };

  const updateTaskRow = (id: string, field: keyof NewTaskRow, value: string) => {
    setNewTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleSave = () => {
    if (editingAllocation) {
      if (!editProjectId || !editHours) return;
      updateAllocation({
        ...editingAllocation,
        projectId: editProjectId,
        taskName: editTaskName,
        weekStartDate: editWeek,
        hoursAssigned: parseFloat(editHours),
        description: editDescription,
        dependencyId: editDependencyId === 'none' ? undefined : editDependencyId
      });
    } else {
      newTasks.forEach(task => {
        if (task.projectId && task.hours) {
          addAllocation({
            employeeId,
            projectId: task.projectId,
            taskName: task.taskName,
            weekStartDate: task.weekDate,
            hoursAssigned: parseFloat(task.hours),
            status: 'planned',
            description: task.description,
            dependencyId: task.dependencyId === 'none' ? undefined : task.dependencyId
          });
        }
      });
    }
    setIsFormOpen(false);
  };

  const handleDeleteAllocation = () => {
    if (!editingAllocation) return;
    if (confirm('¿Seguro que quieres eliminar esta tarea?')) {
      deleteAllocation(editingAllocation.id);
      setIsFormOpen(false);
    }
  };

  const toggleTaskCompletion = (allocation: Allocation) => {
    const isCompleting = allocation.status !== 'completed';
    setRecentlyToggled(prev => { const newSet = new Set(prev); newSet.add(allocation.id); return newSet; });
    updateAllocation({
      ...allocation,
      status: isCompleting ? 'completed' : 'planned',
      hoursActual: isCompleting ? allocation.hoursAssigned : 0,
      hoursComputed: isCompleting ? allocation.hoursAssigned : 0
    });
    setTimeout(() => { setRecentlyToggled(prev => { const newSet = new Set(prev); newSet.delete(allocation.id); return newSet; }); }, 120000); // 2 minutos para dar tiempo a poner horas reales y computadas
  };

  const updateInlineHours = (allocation: Allocation, field: 'hoursActual' | 'hoursComputed', value: string) => {
    const numValue = parseFloat(value) || 0;
    if (allocation[field] !== numValue) {
      updateAllocation({ ...allocation, [field]: numValue });
    }
  };

  const startEditFull = (allocation: Allocation) => {
    // BLOQUEO: No permitir editar tareas de semanas pasadas
    try {
      const taskWeekDate = parseISO(allocation.weekStartDate);
      const taskWeekEnd = addDays(taskWeekDate, 4); // Viernes de esa semana
      const today = new Date();

      if (taskWeekEnd < today) {
        toast.error('No puedes editar tareas de semanas pasadas. Usa el botón "Weekly" para gestionarlas.');
        return;
      }
    } catch {
      // Si hay error parseando la fecha, permitir editar (por seguridad)
    }

    setEditingAllocation(allocation);
    setEditProjectId(allocation.projectId);
    setEditTaskName(allocation.taskName || '');
    setEditHours(allocation.hoursAssigned.toString());
    setEditDescription(allocation.description || '');
    setEditWeek(allocation.weekStartDate);
    setEditDependencyId(allocation.dependencyId || 'none');
    setIsFormOpen(true);
  };

  const startInlineEdit = (allocation: Allocation) => {
    // BLOQUEO: No permitir editar inline tareas de semanas pasadas
    try {
      const taskWeekDate = parseISO(allocation.weekStartDate);
      const taskWeekEnd = addDays(taskWeekDate, 4);
      const today = new Date();

      if (taskWeekEnd < today) {
        toast.error('No puedes editar tareas de semanas pasadas. Usa el botón "Weekly" para gestionarlas.');
        return;
      }
    } catch {
      // Si hay error parseando la fecha, permitir editar (por seguridad)
    }

    setInlineEditingId(allocation.id);
    setInlineNameValue(allocation.taskName || '');
  };
  const saveInlineEdit = (allocation: Allocation) => { if (inlineNameValue.trim() !== allocation.taskName) { updateAllocation({ ...allocation, taskName: inlineNameValue }); } setInlineEditingId(null); };
  const moveTaskToWeek = (allocation: Allocation, targetWeekStartReal: Date) => {
    // Usar siempre la fecha real de la semana (lunes) para guardar tareas
    const targetKey = format(targetWeekStartReal, 'yyyy-MM-dd');
    updateAllocation({ ...allocation, weekStartDate: targetKey });
  };

  // Ordenar proyectos según la opción seleccionada
  const sortProjectGroups = (groups: Record<string, Allocation[]>) => {
    return Object.entries(groups).sort(([projIdA, allocsA], [projIdB, allocsB]) => {
      const projA = getProjectById(projIdA);
      const projB = getProjectById(projIdB);

      const allCompletedA = allocsA.every(a => a.status === 'completed') && !allocsA.some(a => recentlyToggled.has(a.id));
      const allCompletedB = allocsB.every(a => a.status === 'completed') && !allocsB.some(a => recentlyToggled.has(a.id));

      // Proyectos completados siempre al final
      if (allCompletedA && !allCompletedB) return 1;
      if (!allCompletedA && allCompletedB) return -1;

      // Calcular horas del empleado actual en cada proyecto
      const myHoursA = allocsA.reduce((sum, a) => sum + (a.hoursAssigned || 0), 0);
      const myHoursB = allocsB.reduce((sum, a) => sum + (a.hoursAssigned || 0), 0);

      // Ordenar según opción seleccionada
      switch (sortOption) {
        case 'budget_desc':
          return (projB?.budgetHours || 0) - (projA?.budgetHours || 0);
        case 'budget_asc':
          return (projA?.budgetHours || 0) - (projB?.budgetHours || 0);
        case 'my_hours_desc':
          return myHoursB - myHoursA;
        case 'my_hours_asc':
          return myHoursA - myHoursB;
        case 'name_asc':
          return (projA?.name || '').localeCompare(projB?.name || '');
        case 'name_desc':
          return (projB?.name || '').localeCompare(projA?.name || '');
        default:
          return (projB?.budgetHours || 0) - (projA?.budgetHours || 0);
      }
    });
  };

  // Ordenar tareas: pendientes primero, completadas (no recientes) al final
  const sortTasks = (tasks: Allocation[]) => {
    return [...tasks].sort((a, b) => {
      const aCompleted = a.status === 'completed' && !recentlyToggled.has(a.id);
      const bCompleted = b.status === 'completed' && !recentlyToggled.has(b.id);

      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;
      return 0;
    });
  };

  const renderProjectHeader = (project: Project | undefined, budgetStatus: ProjectBudgetStatus, allCompleted: boolean, taskCount: number, myHoursInProject: { estimated: number; completed: number; computed: number }) => {
    if (!project) return <span className="font-bold text-xs truncate">Desc.</span>;

    const { totalComputed, totalPlanned, budgetMax, budgetMin, percentage, status, breakdown } = budgetStatus;

    const statusConfig = {
      healthy: { color: 'bg-emerald-500', bgLight: 'bg-emerald-50', textColor: 'text-emerald-700', icon: null },
      warning: { color: 'bg-amber-500', bgLight: 'bg-amber-50', textColor: 'text-amber-700', icon: <AlertTriangle className="w-3 h-3" /> },
      overload: { color: 'bg-red-500', bgLight: 'bg-red-50', textColor: 'text-red-700', icon: <AlertOctagon className="w-3 h-3" /> },
      under: { color: 'bg-blue-500', bgLight: 'bg-blue-50', textColor: 'text-blue-700', icon: null }
    };

    const config = statusConfig[status];
    const exceededBy = totalComputed > budgetMax ? totalComputed - budgetMax : 0;
    const projection = totalComputed + totalPlanned;

    // Calcular progreso del empleado
    const myProgress = myHoursInProject.estimated > 0
      ? Math.round((myHoursInProject.computed / myHoursInProject.estimated) * 100)
      : 0;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "px-3 py-2 border-b cursor-help transition-colors",
            allCompleted ? "bg-slate-100" : config.bgLight
          )}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {allCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                <span className={cn("font-bold text-xs truncate", allCompleted && "text-slate-500")}>{formatProjectName(project.name)}</span>
                {allCompleted && <span className="text-[9px] text-slate-400">({taskCount})</span>}
              </div>
              {/* Mostrar horas del empleado en lugar del % global */}
              <div className={cn("flex items-center gap-1.5 text-[10px]", allCompleted ? "text-slate-400" : "text-slate-600")}>
                <span className="font-medium">{myHoursInProject.estimated}h</span>
                {myHoursInProject.computed > 0 && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="text-emerald-600 font-semibold">{myHoursInProject.computed}h comp</span>
                  </>
                )}
              </div>
            </div>

            {/* Barra de progreso del empleado */}
            {!allCompleted && myHoursInProject.estimated > 0 && (
              <div className="mt-1.5">
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full transition-all duration-300", myProgress >= 100 ? "bg-emerald-500" : "bg-indigo-500")}
                    style={{ width: `${Math.min(myProgress, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[9px] text-slate-500">
                    {myHoursInProject.completed}/{taskCount} tareas
                  </span>
                  <span className={cn("text-[9px] font-medium", myProgress >= 100 ? "text-emerald-600" : "text-indigo-600")}>
                    {myProgress}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs p-0 z-50">
          <div className="p-3 space-y-2">
            <div className="font-bold text-sm border-b pb-2">{project.name}</div>

            {/* Horas del empleado actual */}
            <div className="bg-indigo-50 rounded p-2 border border-indigo-100">
              <div className="text-[10px] font-semibold text-indigo-600 uppercase mb-1">Tus horas</div>
              <div className="flex gap-3 text-xs">
                <span className="text-blue-600">Plan: <strong>{myHoursInProject.estimated}h</strong></span>
                <span className="text-emerald-600">Comp: <strong>{myHoursInProject.computed}h</strong></span>
              </div>
            </div>

            {/* Horas globales del cliente */}
            {budgetMax > 0 && (
              <div className="text-xs space-y-1 border-t pt-2">
                <div className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Total cliente</div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Asignadas:</span>
                  <span className="font-medium">{budgetMin > 0 ? `${budgetMin}-` : ''}{budgetMax}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Planificado:</span>
                  <span className="text-blue-600">{totalPlanned.toFixed(1)}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Computado (todos):</span>
                  <span className={cn("font-bold", status === 'overload' ? 'text-red-600' : 'text-emerald-600')}>{totalComputed.toFixed(1)}h</span>
                </div>

                {/* Barra de progreso global */}
                <div className="mt-2">
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className={cn("h-full", config.color)} style={{ width: `${Math.min(percentage, 100)}%` }} />
                  </div>
                  <div className="flex justify-between items-center mt-0.5">
                    <span className="text-[9px] text-slate-400">{Math.round(percentage)}% usado</span>
                    {exceededBy > 0 && <span className="text-[9px] font-bold text-red-600">+{exceededBy.toFixed(1)}h exceso</span>}
                  </div>
                </div>
              </div>
            )}

            {breakdown.length > 1 && (
              <div className="border-t pt-2 mt-2">
                <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 uppercase mb-1">
                  <Users className="w-3 h-3" /> Equipo
                </div>
                <div className="space-y-1">
                  {breakdown.map(({ employeeId: empId, employeeName, computed, planned }) => {
                    const isCurrentEmployee = empId === employeeId;
                    return (
                      <div key={empId} className={cn("text-xs px-1.5 py-1 rounded", isCurrentEmployee ? "bg-indigo-50" : "")}>
                        <div className={cn("font-medium", isCurrentEmployee ? "text-indigo-700" : "text-slate-600")}>
                          {employeeName} {isCurrentEmployee && "(tú)"}
                        </div>
                        <div className="flex gap-3 text-[10px] mt-0.5">
                          <span className="text-blue-600">Plan: {planned.toFixed(1)}h</span>
                          <span className="text-emerald-600">Comp: {computed.toFixed(1)}h</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {status === 'overload' && (
              <div className="bg-red-50 text-red-700 text-[10px] p-2 rounded border border-red-200 mt-2">
                ⚠️ Se han excedido las horas contratadas máximas. Revisar horas computadas.
              </div>
            )}
            {status === 'warning' && (
              <div className="bg-amber-50 text-amber-700 text-[10px] p-2 rounded border border-amber-200 mt-2">
                ⚡ Cerca del límite. Quedan {(budgetMax - totalComputed).toFixed(1)}h disponibles.
              </div>
            )}
            {projection > budgetMax && status !== 'overload' && (
              <div className="bg-orange-50 text-orange-700 text-[10px] p-2 rounded border border-orange-200 mt-2">
                📊 La proyección ({projection.toFixed(1)}h) supera las horas contratadas.
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          className="w-full sm:max-w-[95vw] overflow-y-auto px-6 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-xl border-l shadow-2xl pt-10"
          onInteractOutside={(e) => {
            // Prevenir cierre del Sheet cuando el tour está activo
            if (isTourActive) {
              e.preventDefault();
            }
          }}
          onPointerDownOutside={(e) => {
            // Prevenir cierre del Sheet cuando el tour está activo
            if (isTourActive) {
              e.preventDefault();
            }
          }}
        >
          <TooltipProvider delayDuration={200}>
            <SheetHeader className="pb-6 border-b mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {employee.avatarUrl ? (
                    <Avatar className="h-14 w-14 border-2 border-indigo-200 shadow-sm">
                      <AvatarImage src={employee.avatarUrl} alt={employee.name} />
                      <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold text-2xl">
                        {employee.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-2xl shadow-sm border border-indigo-200">
                      {employee.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <SheetTitle className="text-3xl font-bold tracking-tight text-foreground">{employee.name}</SheetTitle>
                    <SheetDescription className="text-base flex items-center gap-2 mt-1">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      Planificación Mensual
                    </SheetDescription>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative w-48 hidden sm:block">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Buscar tarea..." className="pl-8 h-9 text-xs bg-background/50" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>

                  {/* Botón toggle expansión de proyectos */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAutoExpand(!autoExpand)}
                        className="h-9 px-3 gap-2"
                        data-tour="planner-collapse"
                      >
                        {autoExpand ? <FoldVertical className="h-4 w-4" /> : <UnfoldVertical className="h-4 w-4" />}
                        <span className="hidden lg:inline text-xs">{autoExpand ? "Colapsar" : "Expandir"}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {autoExpand ? "Ver proyectos colapsados por defecto" : "Ver proyectos expandidos por defecto"}
                    </TooltipContent>
                  </Tooltip>

                  {/* Selector de ordenación */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9 px-3 gap-2" data-tour="planner-sort">
                        <ArrowUpDown className="h-4 w-4" />
                        <span className="hidden lg:inline text-xs">Ordenar</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setSortOption('budget_desc')} className={cn(sortOption === 'budget_desc' && "bg-accent")}>
                        <SortDesc className="mr-2 h-4 w-4" /> Horas contratadas (mayor)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortOption('budget_asc')} className={cn(sortOption === 'budget_asc' && "bg-accent")}>
                        <SortAsc className="mr-2 h-4 w-4" /> Horas contratadas (menor)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortOption('my_hours_desc')} className={cn(sortOption === 'my_hours_desc' && "bg-accent")}>
                        <SortDesc className="mr-2 h-4 w-4" /> Mis horas (mayor)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortOption('my_hours_asc')} className={cn(sortOption === 'my_hours_asc' && "bg-accent")}>
                        <SortAsc className="mr-2 h-4 w-4" /> Mis horas (menor)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortOption('name_asc')} className={cn(sortOption === 'name_asc' && "bg-accent")}>
                        <SortAsc className="mr-2 h-4 w-4" /> Nombre (A-Z)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortOption('name_desc')} className={cn(sortOption === 'name_desc' && "bg-accent")}>
                        <SortDesc className="mr-2 h-4 w-4" /> Nombre (Z-A)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Botón toggle vista semana/mes */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={showAllWeeks ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowAllWeeks(!showAllWeeks)}
                        className={cn(
                          "h-9 px-3 gap-2",
                          showAllWeeks && "bg-indigo-600 hover:bg-indigo-700"
                        )}
                        data-tour="planner-view-toggle"
                      >
                        {showAllWeeks ? <Calendar className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                        <span className="hidden sm:inline text-xs">{showAllWeeks ? "Semana actual" : "Ver todo el mes"}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {showAllWeeks ? "Ver solo la semana actual" : "Ver todas las semanas del mes"}
                    </TooltipContent>
                  </Tooltip>

                  <div className="flex items-center gap-2 bg-background/50 p-1.5 rounded-lg border shadow-sm" data-tour="planner-month-nav">
                    <Button variant="ghost" size="icon" onClick={handlePrevMonth}><ChevronLeft className="h-5 w-5" /></Button>
                    <span className="text-lg font-bold capitalize w-40 text-center select-none">{monthLabel}</span>
                    <Button variant="ghost" size="icon" onClick={handleNextMonth}><ChevronRight className="h-5 w-5" /></Button>
                  </div>
                </div>
              </div>

            </SheetHeader>
          </TooltipProvider>

          <TooltipProvider delayDuration={300}>
            <div className={cn(
              "gap-4 pb-20",
              showAllWeeks
                ? "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5"
                : "flex gap-6"
            )}>
              {/* Contenido principal de semanas */}
              <div className={cn(
                showAllWeeks ? "contents" : "flex-1 flex justify-center"
              )}>
                {visibleWeeks.map((week, idx) => {
                  const index = showAllWeeks ? idx : activeWeekIndex;
                  // Usar el weekStartDate real para buscar allocations (las allocations se guardan con el lunes completo)
                  const weekStartDate = format(week.weekStart, 'yyyy-MM-dd');
                  const weekStr = weekStartDate; // Alias para usar como key en JSX

                  // Buscar allocations por el weekStartDate real, pero filtrar por mes efectivo
                  let weekAllocations = getEmployeeAllocationsForWeek(employeeId, weekStartDate);

                  // Filtrar por mes efectivo: solo mostrar allocations que tienen días en el mes visible
                  weekAllocations = weekAllocations.filter(a => isAllocationInEffectiveMonth(a.weekStartDate, viewDate));

                  // Eliminar duplicados por ID (por si acaso hay duplicados en la base de datos)
                  const seenIds = new Set<string>();
                  weekAllocations = weekAllocations.filter(a => {
                    if (seenIds.has(a.id)) {
                      return false;
                    }
                    seenIds.add(a.id);
                    return true;
                  });

                  if (searchTerm) {
                    weekAllocations = weekAllocations.filter(a => {
                      const proj = getProjectById(a.projectId);
                      const matchText = (a.taskName + (proj?.name || '')).toLowerCase();
                      return matchText.includes(searchTerm.toLowerCase());
                    });
                  }

                  const load = getEmployeeLoadForWeek(employeeId, weekStartDate, week.effectiveStart, week.effectiveEnd, viewDate);

                  // Calcular Est, Real, Comp para el header
                  const weekEst = round2(weekAllocations.reduce((sum, a) => sum + (a.hoursAssigned || 0), 0));
                  const completedTasks = weekAllocations.filter(a => a.status === 'completed');
                  const weekReal = round2(completedTasks.reduce((sum, a) => sum + (a.hoursActual || 0), 0));
                  const weekComp = round2(completedTasks.reduce((sum, a) => sum + (a.hoursComputed || 0), 0));
                  const weekBalance = round2(weekComp - weekReal);

                  // Fechas de la semana (solo días laborables efectivos del mes: lun-vie, excluyendo fines de semana)
                  const effectiveStart = week.effectiveStart || week.weekStart;
                  const effectiveEnd = week.effectiveEnd || addDays(week.weekStart, 4);

                  // Calcular solo días laborables (lun-vie) en el rango efectivo
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

                  // Agrupar y ordenar
                  const grouped = weekAllocations.reduce((acc, a) => ({ ...acc, [a.projectId]: [...(acc[a.projectId] || []), a] }), {} as Record<string, Allocation[]>);
                  const sortedGroups = sortProjectGroups(grouped);

                  // VISTA TABULAR para semana individual
                  if (!showAllWeeks) {
                    return (
                      <div key={weekStr} className="flex-1 min-w-0">
                        {/* Header compacto de la semana */}
                        <div className="flex items-center justify-between mb-4 pb-3 border-b">
                          <div className="flex items-center gap-3">
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={goToPrevWeek} disabled={activeWeekIndex === 0}>
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div>
                              <div className="font-bold text-lg text-foreground">Semana {activeWeekIndex + 1}</div>
                              <div className="text-xs text-slate-500">{weekDateLabel}</div>
                            </div>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={goToNextWeek} disabled={activeWeekIndex === weeks.length - 1}>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* Resumen de la semana */}
                            <div className="flex items-center gap-3 text-sm">
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded">
                                <span className="text-slate-500">Plan:</span>
                                <span className="font-bold">{weekEst}h</span>
                                <span className="text-slate-400">/</span>
                                <span className="text-slate-500">{load.capacity}h</span>
                              </div>
                              {completedTasks.length > 0 && (
                                <>
                                  <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded">
                                    <span className="text-blue-600">Real:</span>
                                    <span className="font-bold text-blue-700">{weekReal}h</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded">
                                    <span className="text-emerald-600">Comp:</span>
                                    <span className="font-bold text-emerald-700">{weekComp}h</span>
                                  </div>
                                  {weekBalance !== 0 && (
                                    <div className={cn(
                                      "flex items-center gap-1 px-2 py-1 rounded font-bold",
                                      weekBalance >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                    )}>
                                      {weekBalance >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                      {weekBalance >= 0 ? '+' : ''}{weekBalance}h
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                            <Button variant="outline" size="sm" className="gap-2" onClick={() => startAdd(week.weekStart)} data-tour="planner-add-task">
                              <Plus className="h-4 w-4" /> Añadir
                            </Button>
                          </div>
                        </div>

                        {/* Tabla de proyectos y tareas */}
                        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2" data-tour="planner-projects">
                          {sortedGroups.map(([projId, projAllocations]) => {
                            const project = getProjectById(projId);
                            const budgetStatus = getProjectBudgetStatus(projId);
                            const allCompleted = projAllocations.every(a => a.status === 'completed') && !projAllocations.some(a => recentlyToggled.has(a.id));
                            const isSelected = selectedProjectId === projId;
                            const sortedTasks = sortTasks(projAllocations);

                            // Totales del proyecto esta semana
                            const projEst = round2(projAllocations.reduce((s, a) => s + (a.hoursAssigned || 0), 0));
                            const projReal = round2(projAllocations.filter(a => a.status === 'completed').reduce((s, a) => s + (a.hoursActual || 0), 0));
                            const projComp = round2(projAllocations.filter(a => a.status === 'completed').reduce((s, a) => s + (a.hoursComputed || 0), 0));

                            return (
                              <div
                                key={projId}
                                className={cn(
                                  "bg-white rounded-lg border shadow-sm overflow-hidden transition-all",
                                  isSelected && "ring-2 ring-indigo-400",
                                  allCompleted && "opacity-80"
                                )}
                              >
                                {/* Header del proyecto - clickeable para seleccionar */}
                                <div
                                  className={cn(
                                    "px-4 py-2.5 cursor-pointer flex items-center justify-between",
                                    budgetStatus.status === 'overload' ? "bg-red-500 text-white" :
                                      budgetStatus.status === 'warning' ? "bg-amber-500 text-white" :
                                        allCompleted ? "bg-slate-200 text-slate-700" : "bg-indigo-500 text-white"
                                  )}
                                  onClick={() => setSelectedProjectId(isSelected ? null : projId)}
                                >
                                  <div className="flex items-center gap-3">
                                    {allCompleted && <CheckCircle2 className="w-4 h-4" />}
                                    <span className="font-bold">{project?.name || 'Proyecto'}</span>
                                    <span className="text-sm opacity-80">({projAllocations.length} tareas)</span>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm">
                                    <span className="opacity-80">{projEst}h est</span>
                                    {projReal > 0 && <span>{projReal}h real</span>}
                                    {projComp > 0 && <span className="font-bold">{projComp}h comp</span>}
                                  </div>
                                </div>

                                {/* Tabla de tareas */}
                                <table className="w-full text-sm">
                                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                                    <tr>
                                      <th className="py-2 px-3 text-left font-medium w-8"></th>
                                      <th className="py-2 px-3 text-left font-medium">Tarea</th>
                                      <th className="py-2 px-3 text-center font-medium w-20">Horas</th>
                                      <th className="py-2 px-3 text-center font-medium w-24">Real</th>
                                      <th className="py-2 px-3 text-center font-medium w-24">Comp</th>
                                      <th className="py-2 px-3 text-center font-medium w-20">Balance</th>
                                      <th className="py-2 px-3 text-center font-medium w-12"></th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {sortedTasks.map((alloc, taskIndex) => {
                                      const isCompleted = alloc.status === 'completed';
                                      const taskBalance = isCompleted ? round2((alloc.hoursComputed || 0) - (alloc.hoursActual || 0)) : 0;
                                      const depTask = alloc.dependencyId ? allocations.find(a => a.id === alloc.dependencyId) : null;
                                      const depOwner = depTask ? employees.find(e => e.id === depTask.employeeId) : null;
                                      const isDepReady = depTask?.status === 'completed';
                                      const blockingTasks = allocations.filter(a => a.dependencyId === alloc.id && a.status !== 'completed');
                                      const isFirstTask = taskIndex === 0;

                                      return (
                                        <tr
                                          key={alloc.id}
                                          className={cn(
                                            "hover:bg-slate-50 transition-colors",
                                            isCompleted && "bg-slate-50/50",
                                            !isCompleted && depTask && !isDepReady && "bg-amber-50/50"
                                          )}
                                          {...(isFirstTask && { 'data-tour': 'planner-task' })}
                                        >
                                          <td className="py-2 px-3" {...(isFirstTask && { 'data-tour': 'planner-checkbox' })}>
                                            <Checkbox
                                              checked={isCompleted}
                                              onCheckedChange={() => toggleTaskCompletion(alloc)}
                                              className={cn(isCompleted && "data-[state=checked]:bg-emerald-600")}
                                            />
                                          </td>
                                          <td className="py-2 px-3">
                                            <div className="space-y-1">
                                              <div className="flex items-center gap-1.5">
                                                <div
                                                  className={cn("font-medium cursor-pointer hover:bg-slate-100 rounded px-1 -mx-1", isCompleted && "line-through text-slate-400")}
                                                  onDoubleClick={() => startInlineEdit(alloc)}
                                                  {...(isFirstTask && { 'data-tour': 'planner-task-name' })}
                                                >
                                                  {inlineEditingId === alloc.id ? (
                                                    <input
                                                      ref={inlineInputRef}
                                                      autoFocus
                                                      value={inlineNameValue}
                                                      onChange={(e) => setInlineNameValue(e.target.value)}
                                                      onBlur={() => saveInlineEdit(alloc)}
                                                      onKeyDown={(e) => {
                                                        if (e.key === 'Enter') saveInlineEdit(alloc);
                                                        if (e.key === 'Escape') setInlineEditingId(null);
                                                      }}
                                                      className="w-full px-1 py-0.5 text-sm border rounded bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    />
                                                  ) : (
                                                    // Limpiar nombre de tarea removiendo información de transferencia
                                                    <div className="flex items-center gap-2">
                                                      <span>
                                                        {(() => {
                                                          let cleanName = alloc.taskName || 'Tarea';
                                                          // Remover "(transferida de X, original: Y)" o "(transferida de X)"
                                                          cleanName = cleanName.replace(/\s*\(transferida de .+?(?:, original: .+?)?\)/g, '').trim();
                                                          return cleanName || 'Tarea';
                                                        })()}
                                                      </span>
                                                    </div>
                                                  )}
                                                </div>
                                                {/* Badge Weekly si la tarea fue ajustada vía Weekly (horas=0 o transferida) */}
                                                {(() => {
                                                  const isTransferred = alloc.taskName?.includes('(transferida de') || alloc.transferredFromAllocationId;
                                                  const isDistributed = alloc.distributionSourceAllocationId;
                                                  const hasWeeklyFeedback = weeklyFeedback.some(fb => fb.allocationId === alloc.id);
                                                  const wasAdjustedViaWeekly = hasWeeklyFeedback || isTransferred || isDistributed ||
                                                    (alloc.hoursAssigned === 0 && alloc.hoursActual === 0 && alloc.hoursComputed === 0 && alloc.status === 'completed');

                                                  if (!wasAdjustedViaWeekly) return null;

                                                  // Extraer información de transferencia/distribución para el tooltip
                                                  let transferInfo: string | null = null;

                                                  // Caso 1: Tarea distribuida desde una transferencia
                                                  if (isDistributed && alloc.distributionSourceAllocationId) {
                                                    const sourceTask = allocations.find(a => a.id === alloc.distributionSourceAllocationId);
                                                    if (sourceTask) {
                                                      const sourceEmployee = employees.find(e => e.id === sourceTask.employeeId);
                                                      // Buscar la tarea original de la que proviene la transferencia
                                                      if (sourceTask.transferredFromAllocationId) {
                                                        const originalTask = allocations.find(a => a.id === sourceTask.transferredFromAllocationId);
                                                        if (originalTask) {
                                                          const originalEmployee = employees.find(e => e.id === originalTask.employeeId);
                                                          // Limpiar el nombre original (sin el sufijo de transferencia)
                                                          const cleanOriginalName = originalTask.taskName?.replace(/\(transferida de .+?\)/g, '').trim() || originalTask.taskName || 'Sin nombre';
                                                          transferInfo = `Distribuida desde transferencia de ${sourceEmployee?.name || 'compañero'}\nTarea original: ${cleanOriginalName} (de ${originalEmployee?.name || 'compañero'})`;
                                                        } else {
                                                          transferInfo = `Distribuida desde transferencia de ${sourceEmployee?.name || 'compañero'}`;
                                                        }
                                                      } else {
                                                        transferInfo = `Distribuida desde tarea de ${sourceEmployee?.name || 'compañero'}`;
                                                      }
                                                    }
                                                  }
                                                  // Caso 2: Tarea transferida directamente
                                                  else if (isTransferred) {
                                                    const transferMatch = alloc.taskName?.match(/\(transferida de (.+?)(?:, original: (.+?))?\)/);
                                                    if (transferMatch) {
                                                      const fromEmployee = transferMatch[1];
                                                      const originalName = transferMatch[2];
                                                      if (originalName) {
                                                        transferInfo = `Transferida de ${fromEmployee}\nTarea original: ${originalName}`;
                                                      } else {
                                                        transferInfo = `Transferida de ${fromEmployee}`;
                                                      }
                                                    } else if (alloc.transferredFromAllocationId) {
                                                      // Si tiene el campo de BD, buscar información
                                                      const originalTask = allocations.find(a => a.id === alloc.transferredFromAllocationId);
                                                      if (originalTask) {
                                                        const fromEmployee = employees.find(e => e.id === originalTask.employeeId);
                                                        // Limpiar el nombre original (sin el sufijo de transferencia)
                                                        const cleanOriginalName = originalTask.taskName?.replace(/\(transferida de .+?\)/g, '').trim() || originalTask.taskName || 'Sin nombre';
                                                        transferInfo = `Transferida de ${fromEmployee?.name || 'compañero'}\nTarea original: ${cleanOriginalName}`;
                                                      }
                                                    }
                                                  }

                                                  return (
                                                    <Tooltip>
                                                      <TooltipTrigger asChild>
                                                        <Badge variant="outline" className="h-4 px-1.5 text-[9px] bg-indigo-50 text-indigo-700 border-indigo-200 cursor-help">
                                                          Weekly
                                                        </Badge>
                                                      </TooltipTrigger>
                                                      <TooltipContent className="max-w-xs z-[9999]" side="top">
                                                        <div className="space-y-1 text-xs">
                                                          {transferInfo ? (
                                                            <div className="whitespace-pre-line">{transferInfo}</div>
                                                          ) : (
                                                            <div>Tarea gestionada vía Weekly</div>
                                                          )}
                                                        </div>
                                                      </TooltipContent>
                                                    </Tooltip>
                                                  );
                                                })()}
                                              </div>
                                              {depTask && !isCompleted && (
                                                <div
                                                  className={cn(
                                                    "flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded w-fit border",
                                                    isDepReady
                                                      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                                                      : "text-amber-700 bg-amber-50 border-amber-200"
                                                  )}
                                                  {...(isFirstTask && { 'data-tour': 'planner-dependency' })}
                                                >
                                                  {isDepReady ? <CheckCircle2 className="w-2.5 h-2.5" /> : <LinkIcon className="w-2.5 h-2.5" />}
                                                  <span className="truncate max-w-[120px]">{isDepReady ? 'Listo:' : 'Dep:'} {depTask.taskName} <strong>({depOwner?.name})</strong></span>
                                                </div>
                                              )}
                                              {blockingTasks.length > 0 && !isCompleted && (
                                                <div className="flex flex-col gap-0.5">
                                                  {blockingTasks.map(bt => {
                                                    const blockedUser = employees.find(e => e.id === bt.employeeId);
                                                    const firstName = blockedUser?.name?.split(' ')[0] || 'Compañero';
                                                    return (
                                                      <div key={bt.id} className="flex items-center gap-1 text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded w-fit border border-amber-200">
                                                        <Users className="w-2.5 h-2.5" />
                                                        <span>💡 <strong>{firstName}</strong> te espera</span>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              )}
                                            </div>
                                          </td>
                                          <td className="py-2 px-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                              <span className="font-mono text-xs">{alloc.hoursAssigned || 0}</span>
                                              {/* Badge Weekly si horas=0 por ajuste de weekly */}
                                              {(() => {
                                                const isTransferred = alloc.taskName?.includes('(transferida de');
                                                const hasWeeklyFeedback = weeklyFeedback.some(fb => fb.allocationId === alloc.id);
                                                const wasAdjustedViaWeekly = hasWeeklyFeedback || isTransferred;
                                                const isZeroDueToWeekly = (alloc.hoursAssigned === 0 && alloc.hoursActual === 0 && alloc.hoursComputed === 0) && wasAdjustedViaWeekly;

                                                return isZeroDueToWeekly ? (
                                                  <Badge variant="outline" className="h-3.5 px-1 text-[8px] bg-indigo-50 text-indigo-700 border-indigo-200">
                                                    Weekly
                                                  </Badge>
                                                ) : null;
                                              })()}
                                            </div>
                                          </td>
                                          <td className="py-2 px-3 text-center">
                                            {isCompleted ? (
                                              <input
                                                type="number"
                                                step="0.25"
                                                min="0"
                                                defaultValue={alloc.hoursActual || 0}
                                                onBlur={(e) => updateInlineHours(alloc, 'hoursActual', e.target.value)}
                                                className="w-12 px-1 py-0.5 text-[10px] text-center border rounded bg-blue-50 text-blue-700 font-mono"
                                              />
                                            ) : (
                                              <span className="text-slate-300 text-xs">-</span>
                                            )}
                                          </td>
                                          <td className="py-2 px-3 text-center" {...(isFirstTask && { 'data-tour': 'planner-hours' })}>
                                            {isCompleted ? (
                                              <input
                                                type="number"
                                                step="0.25"
                                                min="0"
                                                defaultValue={alloc.hoursComputed || 0}
                                                onBlur={(e) => updateInlineHours(alloc, 'hoursComputed', e.target.value)}
                                                className="w-12 px-1 py-0.5 text-[10px] text-center border rounded bg-emerald-50 text-emerald-700 font-mono"
                                              />
                                            ) : (
                                              <span className="text-slate-300 text-xs">-</span>
                                            )}
                                          </td>
                                          <td className="py-2 px-3 text-center">
                                            {isCompleted && taskBalance !== 0 ? (
                                              <span className={cn(
                                                "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold",
                                                taskBalance >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                                              )}>
                                                {taskBalance >= 0 ? '+' : ''}{taskBalance}
                                              </span>
                                            ) : isCompleted ? (
                                              <span className="text-slate-400">0</span>
                                            ) : (
                                              <span className="text-slate-300">-</span>
                                            )}
                                          </td>
                                          <td className="py-2 px-3">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-7 w-7 p-0"
                                              onClick={() => {
                                                // BLOQUEO: No permitir editar tareas de semanas pasadas (también en vista reducida)
                                                try {
                                                  const taskWeekDate = parseISO(alloc.weekStartDate);
                                                  const taskWeekEnd = addDays(taskWeekDate, 4);
                                                  const today = new Date();

                                                  if (taskWeekEnd < today) {
                                                    toast.error('No puedes editar tareas de semanas pasadas. Usa el botón "Weekly" para gestionarlas.');
                                                    return;
                                                  }
                                                } catch {
                                                  // Si hay error parseando la fecha, permitir editar (por seguridad)
                                                }
                                                startEditFull(alloc);
                                              }}
                                            >
                                              <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            );
                          })}

                          {/* Estado de carga */}
                          {(isGlobalLoading || isLoadingTasks) && (
                            <div className="space-y-4" data-tour="planner-loading-state">
                              <div className="text-center py-6 text-slate-400">
                                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50 animate-pulse" />
                                <p className="font-medium mb-1">Cargando tareas...</p>
                                <p className="text-xs">Por favor espera</p>
                              </div>
                            </div>
                          )}

                          {/* Estado vacío - solo mostrar si no está cargando */}
                          {!isGlobalLoading && !isLoadingTasks && sortedGroups.length === 0 && (
                            <div className="space-y-4" data-tour="planner-empty-state">
                              {/* Mensaje principal */}
                              <div className="text-center py-6 text-slate-400">
                                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                <p className="font-medium mb-1">No tienes tareas esta semana</p>
                                <p className="text-xs">Usa el botón "Añadir" para planificar tu trabajo</p>
                              </div>

                              {/* Ejemplo visual de cómo se vería */}
                              <div className="border-t pt-4">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-xs text-slate-400 uppercase tracking-wide">Vista previa de ejemplo</span>
                                  <Badge variant="outline" className="text-[9px] bg-amber-50 border-amber-200 text-amber-700">Ejemplo</Badge>
                                </div>

                                <div className="bg-white rounded-lg border shadow-sm overflow-hidden opacity-60" data-tour="planner-projects">
                                  <div className="bg-indigo-500 text-white px-4 py-2.5 flex items-center justify-between">
                                    <span className="font-bold text-sm">SEO Mensual [Cliente Ejemplo]</span>
                                    <span className="text-xs opacity-80">(3 tareas)</span>
                                  </div>
                                  <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                                      <tr>
                                        <th className="py-2 px-3 text-left font-medium w-8"></th>
                                        <th className="py-2 px-3 text-left font-medium">Tarea</th>
                                        <th className="py-2 px-2 text-center font-medium w-12">Horas</th>
                                        <th className="py-2 px-2 text-center font-medium w-12">Comp</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      <tr className="hover:bg-slate-50" data-tour="planner-task">
                                        <td className="py-2 px-3" data-tour="planner-checkbox">
                                          <Checkbox checked={false} />
                                        </td>
                                        <td className="py-2 px-3" data-tour="planner-task-name">
                                          <span className="font-medium">Análisis de keywords</span>
                                          <div className="mt-1" data-tour="planner-dependency">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px]">
                                              <Users className="h-3 w-3" />
                                              💡 María te espera
                                            </span>
                                          </div>
                                        </td>
                                        <td className="py-2 px-3 text-center font-mono">4h</td>
                                        <td className="py-2 px-3 text-center text-slate-300">-</td>
                                      </tr>
                                      <tr className="hover:bg-slate-50">
                                        <td className="py-2 px-3">
                                          <Checkbox checked={false} />
                                        </td>
                                        <td className="py-2 px-3">
                                          <span className="font-medium">Optimización on-page</span>
                                          <div className="mt-1">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">
                                              <Clock className="h-3 w-3" />
                                              Esperas a: Juan
                                            </span>
                                          </div>
                                        </td>
                                        <td className="py-2 px-3 text-center font-mono">2h</td>
                                        <td className="py-2 px-3 text-center text-slate-300">-</td>
                                      </tr>
                                      <tr className="hover:bg-slate-50 bg-emerald-50/50">
                                        <td className="py-2 px-3">
                                          <Checkbox checked={true} className="data-[state=checked]:bg-emerald-600" />
                                        </td>
                                        <td className="py-2 px-3">
                                          <span className="font-medium line-through text-slate-400">Informe mensual</span>
                                        </td>
                                        <td className="py-2 px-3 text-center font-mono line-through text-slate-400">2h</td>
                                        <td className="py-2 px-3 text-center">
                                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-mono" data-tour="planner-hours">2h</span>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // VISTA COMPACTA para vista mensual (múltiples semanas)
                  // Mostrar loading si está cargando
                  if (isGlobalLoading || isLoadingTasks) {
                    return (
                      <div key={weekStr} className="flex flex-col gap-3 p-4 rounded-xl border bg-card min-h-[300px]">
                        <div className="text-center py-6 text-slate-400">
                          <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50 animate-pulse" />
                          <p className="text-sm font-medium mb-1">Cargando tareas...</p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={weekStr} className="flex flex-col gap-3 p-4 rounded-xl border bg-card min-h-[300px]">
                      {/* HEADER SEMANA MEJORADO */}
                      <div className="flex flex-col gap-2 pb-2 border-b">
                        <div className="flex items-center justify-between">
                          {/* Navegación entre semanas (solo en vista de una semana) */}
                          {!showAllWeeks ? (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={goToPrevWeek}
                                disabled={activeWeekIndex === 0}
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              <div className="text-center min-w-[140px]">
                                <div className="font-bold text-sm text-foreground/80 uppercase tracking-wider">
                                  Semana {activeWeekIndex + 1}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {weekDateLabel} · <span className="text-slate-500">{activeWeekIndex + 1} de {weeks.length}</span>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={goToNextWeek}
                                disabled={activeWeekIndex === weeks.length - 1}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div>
                              <span className="font-bold text-sm text-foreground/80 uppercase tracking-wider">Semana {index + 1}</span>
                              <span className="text-[10px] text-slate-400 ml-2">{weekDateLabel}</span>
                            </div>
                          )}
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-indigo-100 hover:text-indigo-700 rounded-full transition-colors" onClick={() => startAdd(week.weekStart)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Barra de carga con marca de capacidad */}
                        <div className="relative">
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full transition-all duration-500 ease-out",
                                load.percentage > 110 ? "bg-red-500" :
                                  load.percentage > 100 ? "bg-amber-500" :
                                    load.percentage >= 85 ? "bg-emerald-500" : "bg-emerald-400"
                              )}
                              style={{ width: `${Math.min(load.percentage, 150) * 0.67}%` }}
                            />
                          </div>
                          {/* Marca del 100% (capacidad) */}
                          <div
                            className="absolute top-0 h-2 w-0.5 bg-slate-700"
                            style={{ left: '67%' }}
                            title="Capacidad máxima"
                          />
                          {/* Porcentaje - con fondo para mejor legibilidad */}
                          <div className={cn(
                            "absolute -top-0.5 text-[9px] font-bold px-1 rounded",
                            load.percentage > 100
                              ? "text-red-700 bg-red-100"
                              : "text-slate-600 bg-slate-100"
                          )} style={{ left: '72%' }}>
                            {Math.round(load.percentage)}%
                          </div>
                        </div>

                        {/* Planificación: Est vs Capacidad */}
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500">Plan:</span>
                            <span className="font-semibold tabular-nums">{weekEst}h</span>
                            <span className="text-slate-400">/</span>
                            <span className="tabular-nums text-slate-500">{load.capacity}h</span>
                          </div>
                          {weekEst !== load.capacity && (
                            <div className={cn(
                              "font-bold tabular-nums px-1.5 py-0.5 rounded text-[10px]",
                              weekEst > load.capacity
                                ? "text-red-700 bg-red-50"
                                : "text-slate-500 bg-slate-50"
                            )}>
                              {weekEst > load.capacity ? '+' : ''}{round2(weekEst - load.capacity)}h
                            </div>
                          )}
                        </div>

                        {/* Ejecución: Real → Comp (solo si hay completadas) */}
                        {completedTasks.length > 0 && (
                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-dashed">
                            <div className="flex items-center gap-2">
                              <span className="text-blue-600 tabular-nums">
                                <span className="text-slate-400 text-[10px]">Real</span> {weekReal}h
                              </span>
                              <span className="text-slate-300">→</span>
                              <span className="text-emerald-600 tabular-nums">
                                <span className="text-slate-400 text-[10px]">Comp</span> {weekComp}h
                              </span>
                            </div>
                            <div className={cn(
                              "flex items-center gap-1 font-bold tabular-nums px-1.5 py-0.5 rounded text-[10px]",
                              weekBalance >= 0 ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50"
                            )}>
                              {weekBalance >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {weekBalance >= 0 ? '+' : ''}{weekBalance}h
                            </div>
                          </div>
                        )}

                        {/* Ausencias/Eventos (si hay) */}
                        {load.breakdown && load.breakdown.length > 0 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1.5 text-[10px] text-orange-600 bg-orange-50 px-2 py-1 rounded cursor-help border border-orange-100">
                                {load.breakdown.some(b => b.type === 'absence') && <Palmtree className="w-3 h-3" />}
                                {load.breakdown.some(b => b.type === 'event') && <Zap className="w-3 h-3" />}
                                <span className="font-medium">-{round2(load.breakdown.reduce((s, b) => s + b.hours, 0))}h capacidad</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                              {load.breakdown.map((b, i) => (
                                <div key={i}>{b.reason}: -{b.hours}h</div>
                              ))}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>

                      {/* LISTA TAREAS */}
                      <div className="flex-1 overflow-y-auto max-h-[60vh] space-y-3 pr-1 custom-scrollbar">
                        {sortedGroups.map(([projId, projAllocations]) => {
                          const project = getProjectById(projId);
                          const budgetStatus = getProjectBudgetStatus(projId);
                          const allCompleted = projAllocations.every(a => a.status === 'completed') && !projAllocations.some(a => recentlyToggled.has(a.id));
                          // La lógica de colapso depende de autoExpand:
                          // - autoExpand=true: expandido por defecto, collapsedProjects guarda los colapsados manualmente
                          // - autoExpand=false: colapsado por defecto, collapsedProjects guarda los expandidos manualmente
                          const isCollapsed = autoExpand ? collapsedProjects.has(projId) : !collapsedProjects.has(projId);
                          const sortedTasks = sortTasks(projAllocations);

                          // Calcular horas del empleado actual en este proyecto
                          const myHoursInProject = {
                            estimated: round2(projAllocations.reduce((sum, a) => sum + (a.hoursAssigned || 0), 0)),
                            completed: projAllocations.filter(a => a.status === 'completed').length,
                            computed: round2(projAllocations.filter(a => a.status === 'completed').reduce((sum, a) => sum + (a.hoursComputed || 0), 0))
                          };

                          const isSelected = selectedProjectId === projId;

                          return (
                            <Collapsible key={projId} open={!isCollapsed} onOpenChange={() => {
                              toggleProjectCollapse(projId);
                              // En vista semanal, al hacer click también selecciona el proyecto
                              if (!showAllWeeks) {
                                setSelectedProjectId(projId);
                              }
                            }}>
                              <div className={cn(
                                "bg-white border rounded-lg shadow-sm overflow-hidden transition-all",
                                allCompleted && "opacity-75 hover:opacity-100",
                                isSelected && !showAllWeeks && "ring-2 ring-indigo-400 border-indigo-300"
                              )}>
                                <CollapsibleTrigger asChild>
                                  <div className="cursor-pointer relative">
                                    {renderProjectHeader(project, budgetStatus, allCompleted, projAllocations.length, myHoursInProject)}
                                    <ChevronDown className={cn(
                                      "w-4 h-4 text-slate-400 transition-transform absolute right-3 top-1/2 -translate-y-1/2",
                                      !isCollapsed && "rotate-180"
                                    )} />
                                  </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="divide-y divide-slate-100">
                                    {sortedTasks.map(alloc => renderTask(alloc, index))}
                                  </div>
                                </CollapsibleContent>
                              </div>
                            </Collapsible>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Panel lateral derecho - Detalles del proyecto seleccionado (solo en vista semanal) */}
              {!showAllWeeks && (
                <div className="w-80 flex-shrink-0">
                  <div className="sticky top-4 space-y-3">
                    {/* Contenido dinámico: proyecto seleccionado o resumen */}
                    {selectedProjectId ? (
                      // DETALLES DEL PROYECTO SELECCIONADO
                      (() => {
                        const project = getProjectById(selectedProjectId);
                        const budgetStatus = getProjectBudgetStatus(selectedProjectId);
                        const { totalComputed, totalPlanned, budgetMax, budgetMin, percentage, status, breakdown } = budgetStatus;

                        // Buscar datos del empleado actual en breakdown
                        const myData = breakdown.find(b => b.employeeId === employeeId);
                        const myComputed = myData?.computed || 0;
                        const myPlanned = myData?.planned || 0;

                        const exceededBy = totalComputed > budgetMax ? totalComputed - budgetMax : 0;
                        const isExact100 = budgetMax > 0 && Math.abs(totalComputed - budgetMax) < 0.1; // 100% exacto (con tolerancia de 0.1h)
                        const isAtMinimum = budgetMin > 0 && totalComputed >= budgetMin && (budgetMax === 0 || totalComputed <= budgetMax);

                        const statusConfig = {
                          healthy: { color: 'bg-emerald-500', textColor: 'text-emerald-700', label: 'Saludable' },
                          warning: { color: 'bg-amber-500', textColor: 'text-amber-700', label: 'Cerca del límite' },
                          overload: { color: 'bg-red-500', textColor: 'text-red-700', label: 'Excedido' },
                          under: { color: 'bg-blue-500', textColor: 'text-blue-700', label: 'Por debajo' }
                        };
                        const config = statusConfig[status];

                        return (
                          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                            {/* Header con nombre y botón cerrar */}
                            <div className="bg-indigo-50 border-b px-4 py-3 flex items-center justify-between">
                              <h3 className="font-bold text-sm text-slate-800 truncate flex-1" title={project?.name}>
                                {formatProjectName(project?.name || 'Proyecto')}
                              </h3>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-indigo-100"
                                onClick={() => setSelectedProjectId(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="p-4 space-y-4">
                              {/* Total cliente */}
                              {budgetMax > 0 && (
                                <div className="space-y-2">
                                  <div className="text-[10px] font-semibold text-slate-500 uppercase">Total cliente</div>
                                  <div className="space-y-1.5 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Asignadas:</span>
                                      <span className="font-medium">{budgetMin > 0 ? `${budgetMin}-` : ''}{budgetMax}h</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Planificado:</span>
                                      <span className="text-blue-600">{totalPlanned.toFixed(1)}h</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Computado (todos):</span>
                                      <span className={cn("font-bold", status === 'overload' ? 'text-red-600' : 'text-emerald-600')}>
                                        {totalComputed.toFixed(1)}h
                                      </span>
                                    </div>
                                  </div>

                                  {/* Barra de progreso */}
                                  <div className="mt-3">
                                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                      <div
                                        className={cn(
                                          "h-full",
                                          isExact100 || isAtMinimum ? "bg-emerald-500" : config.color
                                        )}
                                        style={{ width: `${Math.min(percentage, 100)}%` }}
                                      />
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                      <span className={cn(
                                        "text-[10px] font-medium",
                                        isExact100 || isAtMinimum ? "text-emerald-700" : config.textColor
                                      )}>
                                        {Math.round(percentage)}% usado
                                      </span>
                                      {exceededBy > 0 && (
                                        <span className="text-[10px] font-bold text-red-600">+{exceededBy.toFixed(1)}h exceso</span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Alertas de estado */}
                                  {status === 'overload' && (
                                    <div className="bg-red-50 text-red-700 text-[11px] p-2 rounded border border-red-200 flex items-center gap-2">
                                      <AlertOctagon className="w-4 h-4 flex-shrink-0" />
                                      <span>Se han excedido las horas contratadas máximas</span>
                                    </div>
                                  )}
                                  {status === 'warning' && (
                                    <div className="bg-amber-50 text-amber-700 text-[11px] p-2 rounded border border-amber-200 flex items-center gap-2">
                                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                      <span>Quedan {(budgetMax - totalComputed).toFixed(1)}h disponibles</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Equipo */}
                              {breakdown.length > 1 && (
                                <div className="border-t pt-3">
                                  <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 uppercase mb-2">
                                    <Users className="w-3 h-3" /> Equipo ({breakdown.length})
                                  </div>
                                  <div className="space-y-1.5">
                                    {breakdown.map(({ employeeId: empId, employeeName, computed, planned }) => {
                                      const isMe = empId === employeeId;
                                      const emp = employees.find(e => e.id === empId);
                                      return (
                                        <div key={empId} className={cn(
                                          "text-xs px-2 py-1.5 rounded flex items-center gap-2",
                                          isMe ? "bg-indigo-50 border border-indigo-100" : "bg-slate-50"
                                        )}>
                                          <Avatar className="h-6 w-6 border border-slate-200">
                                            <AvatarImage src={emp?.avatarUrl} />
                                            <AvatarFallback className="text-[10px] bg-slate-100">
                                              {employeeName.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className="flex-1 min-w-0">
                                            <div className={cn("font-medium truncate", isMe ? "text-indigo-700" : "text-slate-600")}>
                                              {employeeName} {isMe && "(tú)"}
                                            </div>
                                            <div className="flex gap-3 text-[10px] mt-0.5">
                                              <span className="text-blue-600">Plan: {planned.toFixed(1)}h</span>
                                              <span className="text-emerald-600">Comp: {computed.toFixed(1)}h</span>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      // RESUMEN DE LA SEMANA (por defecto)
                      <div className="bg-white border rounded-xl shadow-sm p-4">
                        <h3 className="font-bold text-sm text-slate-700 mb-3 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-indigo-500" />
                          Resumen de la semana
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">
                          Selecciona un proyecto para ver sus detalles
                        </p>

                        {/* Proyectos de esta semana */}
                        {(() => {
                          if (weeks.length === 0 || activeWeekIndex < 0 || activeWeekIndex >= weeks.length) {
                            return <p className="text-sm text-slate-500">No hay semanas disponibles</p>;
                          }
                          // Usar el weekStartDate real para buscar allocations
                          const weekStartDate = format(weeks[activeWeekIndex].weekStart, 'yyyy-MM-dd');
                          const weekAllocs = getEmployeeAllocationsForWeek(employeeId, weekStartDate);

                          // Filtrar por mes efectivo: solo mostrar allocations que tienen días en el mes visible
                          const filteredWeekAllocs = weekAllocs.filter(a => isAllocationInEffectiveMonth(a.weekStartDate, viewDate));
                          const projectIds = [...new Set(filteredWeekAllocs.map(a => a.projectId))];

                          return (
                            <div className="space-y-2">
                              <div className="text-[10px] font-semibold text-slate-500 uppercase">
                                Mis proyectos esta semana ({projectIds.length})
                              </div>
                              <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
                                {projectIds.map(projId => {
                                  const project = getProjectById(projId);
                                  const projAllocs = filteredWeekAllocs.filter(a => a.projectId === projId);
                                  const est = round2(projAllocs.reduce((s, a) => s + (a.hoursAssigned || 0), 0));
                                  const completed = projAllocs.filter(a => a.status === 'completed').length;
                                  const total = projAllocs.length;
                                  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

                                  return (
                                    <button
                                      key={projId}
                                      onClick={() => setSelectedProjectId(projId)}
                                      className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 rounded-lg border border-slate-100 hover:border-indigo-200 transition-colors"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium text-xs text-slate-700 truncate">
                                          {formatProjectName(project?.name || '')}
                                        </span>
                                        <span className="text-[10px] text-slate-500 ml-2">{est}h</span>
                                      </div>
                                      <div className="text-[10px] text-slate-400 mt-0.5 mb-1.5">
                                        {completed}/{total} tareas
                                      </div>
                                      {/* Barra de progreso */}
                                      {total > 0 && (
                                        <div className="mt-1.5">
                                          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                              className={cn("h-full transition-all duration-300", progress === 100 ? "bg-emerald-500" : "bg-indigo-500")}
                                              style={{ width: `${progress}%` }}
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}
                                {projectIds.length === 0 && (
                                  <p className="text-xs text-slate-400 text-center py-4">
                                    No tienes tareas esta semana
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TooltipProvider>
        </SheetContent>
      </Sheet>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className={cn("max-w-[650px] overflow-visible gap-0 p-0", !editingAllocation ? "max-w-[950px]" : "")}>
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>{editingAllocation ? 'Editar tarea' : 'Añadir tareas'}</DialogTitle>
            <DialogDescription>{editingAllocation ? 'Modifica detalles y dependencias.' : 'Añade múltiples tareas rápidamente.'}</DialogDescription>
          </DialogHeader>

          <div className="p-6 pt-2">
            {editingAllocation ? (
              <div className="grid gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Proyecto</Label>
                  <Select value={editProjectId} onValueChange={setEditProjectId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{activeProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="space-y-2"><Label>Tarea</Label><Input value={editTaskName} onChange={e => setEditTaskName(e.target.value)} /></div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs text-slate-500"><LinkIcon className="w-3 h-3" /> Depende de otra tarea</Label>
                  <Select value={editDependencyId} onValueChange={setEditDependencyId} disabled={!editProjectId}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Sin dependencia" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Ninguna --</SelectItem>
                      {getAvailableDependencies(editProjectId, editingAllocation.id).map(dep => {
                        const owner = employees.find(e => e.id === dep.employeeId);
                        return <SelectItem key={dep.id} value={dep.id} className="text-xs">{dep.taskName} ({owner?.name})</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Horas</Label><Input type="number" value={editHours} onChange={e => setEditHours(e.target.value)} step="0.5" /></div>
                  <div className="space-y-2"><Label>Semana</Label><Select value={editWeek} onValueChange={setEditWeek}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{weeks.map((w, i) => <SelectItem key={w.weekStart.toISOString()} value={format(w.weekStart, 'yyyy-MM-dd')}>Sem {i + 1}</SelectItem>)}</SelectContent></Select></div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                <div className="flex text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-2">
                  <div className="flex-1 pl-1">Proyecto</div>
                  <div className="flex-1 pl-1">Tarea</div>
                  <div className="w-40 px-2">Dependencia?</div>
                  <div className="w-20 mx-2 text-center">Horas</div>
                  <div className="w-36">Semana</div>
                  <div className="w-8"></div>
                </div>

                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2 -mr-2">
                  {newTasks.map((task) => {
                    // Calcular si esta tarea excede las horas contratadas
                    const taskProject = task.projectId ? projects.find(p => p.id === task.projectId) : null;
                    const taskHours = parseFloat(task.hours) || 0;

                    // Horas ya planificadas de este proyecto (del formulario actual)
                    const otherTasksHours = newTasks
                      .filter(t => t.id !== task.id && t.projectId === task.projectId)
                      .reduce((sum, t) => sum + (parseFloat(t.hours) || 0), 0);

                    // Horas ya existentes del proyecto este mes
                    const existingStatus = task.projectId ? getProjectBudgetStatus(task.projectId) : null;
                    const currentUsed = existingStatus ? existingStatus.totalComputed + existingStatus.totalPlanned : 0;
                    const budgetMax = taskProject?.budgetHours || 0;

                    // Total proyectado
                    const projectedTotal = currentUsed + otherTasksHours + taskHours;
                    const exceedsBy = budgetMax > 0 ? projectedTotal - budgetMax : 0;
                    const willExceed = exceedsBy > 0 && taskHours > 0;

                    return (
                      <div key={task.id} className="flex flex-col gap-1">
                        <div className="flex gap-2 items-start">
                          <div className="flex-1 min-w-0">
                            <Popover open={openComboboxId === task.id} onOpenChange={(isOpen) => setOpenComboboxId(isOpen ? task.id : null)}>
                              <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" className={cn("w-full justify-between h-10 px-3 text-left font-normal", !task.projectId && "text-muted-foreground", willExceed && "border-amber-300 bg-amber-50")}>
                                  <span className="truncate">{task.projectId ? formatProjectName(activeProjects.find((p) => p.id === task.projectId)?.name || '') : "Buscar..."}</span>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[300px] p-0" align="start">
                                <Command>
                                  <CommandInput placeholder="Buscar..." />
                                  <CommandList>
                                    <CommandEmpty>No hay.</CommandEmpty>
                                    <CommandGroup className="max-h-[200px] overflow-y-auto">
                                      {activeProjects.map((project) => (
                                        <CommandItem key={project.id} value={project.name} onSelect={() => { updateTaskRow(task.id, 'projectId', project.id); setOpenComboboxId(null); }}>
                                          <Check className={cn("mr-2 h-4 w-4", task.projectId === project.id ? "opacity-100" : "opacity-0")} />
                                          {formatProjectName(project.name)}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>

                          <Input className="flex-1 h-10" placeholder="Nombre..." value={task.taskName} onChange={(e) => updateTaskRow(task.id, 'taskName', e.target.value)} />

                          <div className="w-40">
                            <Select value={task.dependencyId} onValueChange={(v) => updateTaskRow(task.id, 'dependencyId', v)} disabled={!task.projectId}>
                              <SelectTrigger className="h-10 text-xs px-2"><SelectValue placeholder="-" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Ninguna</SelectItem>
                                {getAvailableDependencies(task.projectId).map(dep => {
                                  const owner = employees.find(e => e.id === dep.employeeId);
                                  return <SelectItem key={dep.id} value={dep.id} className="text-xs">{dep.taskName} ({owner?.name?.substring(0, 6)}..)</SelectItem>;
                                })}
                              </SelectContent>
                            </Select>
                          </div>

                          <Input type="number" className={cn("w-20 h-10 text-center", willExceed && "border-amber-300 bg-amber-50")} placeholder="0" value={task.hours} onChange={(e) => updateTaskRow(task.id, 'hours', e.target.value)} step="0.5" />

                          <div className="w-36">
                            <Select value={task.weekDate} onValueChange={(v) => updateTaskRow(task.id, 'weekDate', v)}>
                              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                              <SelectContent>{weeks.map((w, i) => (<SelectItem key={w.weekStart.toISOString()} value={format(w.weekStart, 'yyyy-MM-dd')}>Sem {i + 1}</SelectItem>))}</SelectContent>
                            </Select>
                          </div>

                          <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-destructive" onClick={() => removeTaskRow(task.id)} disabled={newTasks.length === 1}><X className="h-4 w-4" /></Button>
                        </div>
                        {/* Badge de exceso inline */}
                        {willExceed && (
                          <div className="flex items-center gap-1 ml-1 text-[10px] text-amber-700">
                            <AlertTriangle className="w-3 h-3" />
                            <span>+{exceedsBy.toFixed(1)}h exceso ({projectedTotal.toFixed(1)}/{budgetMax}h)</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <Button variant="outline" size="sm" onClick={addTaskRow} className="w-full mt-4 border-dashed"><Plus className="h-4 w-4 mr-2" /> Añadir otra fila</Button>
              </div>
            )}
          </div>
          <DialogFooter className="p-6 pt-2 bg-muted/10 border-t flex flex-col gap-2 w-full">
            {/* Resumen compacto de impacto en proyectos y capacidad */}
            {!editingAllocation && newTasks.some(t => t.projectId && t.hours) && (
              <ProjectImpactSummary
                newTasks={newTasks}
                projects={projects}
                allocations={allocations}
                viewDate={viewDate}
                getProjectBudgetStatus={getProjectBudgetStatus}
                getEmployeeLoadForWeek={getEmployeeLoadForWeek}
                employeeId={employeeId}
                weeks={weeks}
              />
            )}
            <div className="flex justify-between items-center w-full">
              {editingAllocation && <Button variant="ghost" size="sm" onClick={handleDeleteAllocation} className="text-red-500"><Trash2 className="w-4 h-4 mr-2" /> Eliminar</Button>}
              <div className="flex gap-2 ml-auto">
                <Button variant="ghost" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave}>Guardar</Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tour interactivo del planificador */}
      {open && <PlannerTour onVisibilityChange={setIsTourActive} />}
    </>
  );

  // Función auxiliar para renderizar una tarea
  function renderTask(alloc: Allocation, weekIndex: number) {
    const isCompleted = alloc.status === 'completed';
    const depTask = alloc.dependencyId ? allocations.find(a => a.id === alloc.dependencyId) : null;
    const depOwner = depTask ? employees.find(e => e.id === depTask.employeeId) : null;
    const isDepReady = depTask?.status === 'completed';
    const blockingTasks = allocations.filter(a => a.dependencyId === alloc.id && a.status !== 'completed');

    // Calcular balance individual de la tarea
    const taskBalance = isCompleted ? round2((alloc.hoursComputed || 0) - (alloc.hoursActual || 0)) : 0;

    return (
      <div key={alloc.id} className={cn(
        "group flex items-start gap-2 p-2.5 transition-all",
        isCompleted
          ? "bg-slate-50/50 hover:bg-slate-100/50"
          : "hover:bg-indigo-50/30"
      )}>
        <Checkbox
          checked={isCompleted}
          onCheckedChange={() => toggleTaskCompletion(alloc)}
          className={cn("mt-1", isCompleted && "data-[state=checked]:bg-emerald-600")}
        />
        <div className="flex-1 min-w-0">
          <div onDoubleClick={() => startInlineEdit(alloc)}>
            {inlineEditingId === alloc.id ? (
              <Input autoFocus value={inlineNameValue} onChange={e => setInlineNameValue(e.target.value)} onBlur={() => saveInlineEdit(alloc)} className="h-6 text-xs" />
            ) : (
              <div className="flex justify-between items-start">
                <div className="flex flex-col w-full">
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "text-xs font-medium leading-tight",
                      isCompleted && "line-through text-slate-400"
                    )}>{alloc.taskName || 'Tarea'}</span>
                    {/* Badge Weekly si la tarea fue actualizada vía Weekly */}
                    {(() => {
                      const isTransferred = alloc.taskName?.includes('(transferida de');
                      const hasWeeklyFeedback = weeklyFeedback.some(fb => fb.allocationId === alloc.id);
                      const wasAdjustedViaWeekly = hasWeeklyFeedback || isTransferred ||
                        (alloc.hoursAssigned === 0 && alloc.hoursActual === 0 && alloc.hoursComputed === 0 && alloc.status === 'completed');

                      return wasAdjustedViaWeekly ? (
                        <Badge variant="outline" className="h-4 px-1.5 text-[9px] bg-indigo-50 text-indigo-700 border-indigo-200">
                          Weekly
                        </Badge>
                      ) : null;
                    })()}
                  </div>

                  {depTask && !isCompleted && (
                    <div className={cn(
                      "flex items-center gap-1 mt-1.5 text-[9px] px-1.5 py-0.5 rounded border",
                      isDepReady
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : "text-amber-700 bg-amber-50 border-amber-200",
                      !showAllWeeks ? "w-fit" : "w-fit"
                    )}>
                      {isDepReady ? <CheckCircle2 className="w-2.5 h-2.5 shrink-0" /> : <LinkIcon className="w-2.5 h-2.5 shrink-0" />}
                      <span className="text-slate-600 shrink-0">{isDepReady ? 'Listo:' : 'Dep:'}</span>
                      {!showAllWeeks ? (
                        // Vista semanal: mostrar todo completo
                        <>
                          <span className={cn("font-medium", isDepReady ? "text-slate-700" : "text-slate-600")}>{depTask.taskName}</span>
                          {depOwner && (
                            <>
                              <Avatar className="h-3 w-3 border border-slate-300 shrink-0">
                                <AvatarImage src={depOwner.avatarUrl} alt={depOwner.name} />
                                <AvatarFallback className="bg-indigo-500 text-white text-[6px] font-bold">
                                  {depOwner.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-semibold text-slate-800">{depOwner.name}</span>
                            </>
                          )}
                        </>
                      ) : (
                        // Vista mensual: layout compacto sin avatar
                        <>
                          <span className={cn("font-medium truncate max-w-[80px]", isDepReady ? "text-slate-700" : "text-slate-600")} title={depTask.taskName}>{depTask.taskName}</span>
                          {depOwner && (
                            <span className="font-semibold text-slate-800 truncate max-w-[60px]" title={depOwner.name}>{depOwner.name.split(' ')[0]}</span>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {blockingTasks.length > 0 && !isCompleted && (
                    <div className="flex flex-col gap-0.5 mt-1.5">
                      {blockingTasks.map(bt => {
                        const blockedUser = employees.find(e => e.id === bt.employeeId);
                        const firstName = blockedUser?.name?.split(' ')[0] || 'Compañero';
                        return (
                          <div key={bt.id} className="flex items-center gap-1 text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded w-fit border border-amber-200">
                            <Users className="w-2.5 h-2.5" />
                            <span>💡 <strong>{firstName}</strong> te espera</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"><MoreHorizontal className="h-3 w-3" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => startEditFull(alloc)}
                      disabled={(() => {
                        try {
                          const taskWeekDate = parseISO(alloc.weekStartDate);
                          const taskWeekEnd = addDays(taskWeekDate, 4);
                          return taskWeekEnd < new Date();
                        } catch {
                          return false;
                        }
                      })()}
                    >
                      <Pencil className="mr-2 h-3.5 w-3.5" /> Editar
                    </DropdownMenuItem>
                    {(() => {
                      try {
                        const taskWeekDate = parseISO(alloc.weekStartDate);
                        const taskWeekEnd = addDays(taskWeekDate, 4);
                        const isPastWeek = taskWeekEnd < new Date();
                        if (isPastWeek) {
                          return (
                            <DropdownMenuItem disabled className="text-xs text-amber-600">
                              <AlertTriangle className="mr-2 h-3.5 w-3.5" /> Usa Weekly para gestionar
                            </DropdownMenuItem>
                          );
                        }
                        return null;
                      } catch {
                        return null;
                      }
                    })()}
                    <DropdownMenuItem onClick={() => moveTaskToWeek(alloc, weeks[(weekIndex + 1) % weeks.length].weekStart)}><ArrowRightCircle className="mr-2 h-3.5 w-3.5" /> Mover sem.</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* MÉTRICAS REDISEÑADAS */}
          <div className="mt-2 space-y-1.5">
            {/* TAREA PENDIENTE: Solo muestra EST */}
            {!isCompleted && (
              <div className="flex items-center">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span className="font-medium">Estimado:</span>
                  <span className="font-bold font-mono">{alloc.hoursAssigned}h</span>
                </div>
              </div>
            )}

            {/* TAREA COMPLETADA: Flujo visual Est → Real → Comp */}
            {isCompleted && (
              <div className="space-y-1.5">
                {/* Fila de métricas: EST → REAL → COMP */}
                <div className="flex items-center gap-1 flex-wrap">
                  {/* EST (atenuado) */}
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    <span>Est:</span>
                    <span className="font-mono">{alloc.hoursAssigned}h</span>
                  </div>

                  <span className="text-slate-300 text-[10px]">→</span>

                  {/* REAL (editable) */}
                  <div className="flex items-center bg-blue-100 text-blue-800 rounded px-1.5 py-0.5 border border-blue-200">
                    <span className="text-[10px] font-medium mr-1">Real:</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      defaultValue={alloc.hoursActual || 0}
                      onBlur={(e) => updateInlineHours(alloc, 'hoursActual', e.target.value)}
                      className="w-10 text-[11px] text-center bg-transparent border-0 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-400 rounded font-bold font-mono"
                    />
                  </div>

                  <span className="text-slate-300 text-[10px]">→</span>

                  {/* COMP (editable) */}
                  <div className="flex items-center bg-emerald-100 text-emerald-800 rounded px-1.5 py-0.5 border border-emerald-200">
                    <span className="text-[10px] font-medium mr-1">Comp:</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      defaultValue={alloc.hoursComputed || 0}
                      onBlur={(e) => updateInlineHours(alloc, 'hoursComputed', e.target.value)}
                      className="w-10 text-[11px] text-center bg-transparent border-0 focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-400 rounded font-bold font-mono"
                    />
                  </div>
                </div>

                {/* BALANCE de la tarea (solo si hay diferencia) */}
                {Math.abs(taskBalance) > 0.01 && (
                  <div className={cn(
                    "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium",
                    taskBalance >= 0
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : "bg-red-100 text-red-700 border border-red-200"
                  )}>
                    {taskBalance >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{taskBalance >= 0 ? 'Ganancia' : 'Pérdida'}:</span>
                    <span className="font-bold font-mono">{taskBalance > 0 ? '+' : ''}{taskBalance}h</span>
                  </div>
                )}

                {/* Badge Weekly si horas=0 por ajuste de weekly */}
                {(() => {
                  const isTransferred = alloc.taskName?.includes('(transferida de');
                  const hasWeeklyFeedback = weeklyFeedback.some(fb => fb.allocationId === alloc.id);
                  const wasAdjustedViaWeekly = hasWeeklyFeedback || isTransferred;
                  const isZeroDueToWeekly = (alloc.hoursAssigned === 0 && alloc.hoursActual === 0 && alloc.hoursComputed === 0) && wasAdjustedViaWeekly;

                  return isZeroDueToWeekly ? (
                    <Badge variant="outline" className="h-3.5 px-1.5 text-[9px] bg-indigo-50 text-indigo-700 border-indigo-200 mt-1">
                      Weekly
                    </Badge>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

// Componente ProjectImpactSummary movido a archivo separado: ProjectImpactSummary.tsx
