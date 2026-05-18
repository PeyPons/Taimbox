import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { TimelineSheet } from '@/components/shared/TimelineSheet';
import { WeeklyReportDialog } from '@/components/employee/WeeklyReportDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAppAllocationActions, useAppAllocations, useAppEmployees, useAppProjects, useAppWeeklyFeedback } from '@/contexts/AppContext';
import { useAgency } from '@/contexts/AgencyContext';
import { Allocation, Project } from '@/types';
import { CalendarDays, X, ChevronLeft, ChevronRight, MoreHorizontal, ArrowRightCircle, Search, TrendingUp, TrendingDown, CheckCircle2, Users, ChevronDown, Palmtree, Zap, Clock, LayoutGrid, Calendar, FoldVertical, UnfoldVertical, ArrowUpDown, SortAsc, SortDesc, GanttChart, Filter, SlidersHorizontal, ArrowRightLeft, Lock, Check, Plus, Link as LinkIcon, AlertTriangle, AlertOctagon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getWeeksForMonth, getStorageKey, isAllocationInEffectiveMonth, getWeekEndDate } from '@/utils/dateUtils';
import { useWeeklyCloseDay } from '@/hooks/useWeeklyCloseDay';
import { format, addMonths, subMonths, isSameMonth, parseISO, addDays, isBefore, startOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/lib/notify';
import { PlannerTour } from './PlannerTour';
import { WeekNavigation } from './WeekNavigation';
import { ProjectImpactSummary } from './ProjectImpactSummary';
import { useAllocationSheet, ProjectBudgetStatus } from '@/hooks/useAllocationSheet';
import { useAllocationActions } from '@/hooks/useAllocationActions';
import { AllocationProjectHeader } from '@/components/planner/allocation/AllocationProjectHeader';
import { AllocationTaskRow } from '@/components/planner/allocation/AllocationTaskRow';
import { PlannerTaskContextMenu } from '@/components/planner/allocation/PlannerTaskContextMenu';
import { AllocationMonthNavigation } from '@/components/planner/allocation/AllocationMonthNavigation';
import { AllocationToolbarControls } from '@/components/planner/allocation/AllocationToolbarControls';
import { TaskTimer } from '@/components/employee/TaskTimer';
import { BatchTaskRow } from '@/components/planner/BatchTaskRow';
import { AllocationFormDialog } from '@/components/planner/allocation/AllocationFormDialog';
import { useTasksImpact } from '@/hooks/useTasksImpact';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePermissions } from '@/hooks/usePermissions';
import { NewTaskRow } from '@/types';
import { supabase } from '@/lib/supabase';
import { TransferRequestDialog } from '@/components/transfers/TaskTransferComponents';
import { useTaskTransfers } from '@/hooks/useTaskTransfers';
import { useProjectAliasing } from '@/hooks/useProjectAliasing';
import { useIntegration } from '@/hooks/useIntegration';
import { getEffectiveCompletedHours, getPlanningDeltaHours } from '@/utils/hoursTracking';
import { formatDecimalHoursAsHm } from '@/utils/timerDisplay';
import { SensitiveText } from '@/components/privacy/SensitiveText';
import { useAllocationSheetMonthData } from '@/hooks/useAllocationSheetMonthData';
import { round2 } from '@/utils/numbers';

interface AllocationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  weekStart: string;
  viewDateContext?: Date;
  initialAutoAdd?: boolean;
}

type SortOption = 'budget_desc' | 'budget_asc' | 'my_hours_desc' | 'my_hours_asc' | 'name_asc' | 'name_desc';

export function AllocationSheet({ open, onOpenChange, employeeId, weekStart, viewDateContext }: AllocationSheetProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { employees, currentUser } = useAppEmployees();
  const { projects, clients, getProjectById } = useAppProjects();
  const { allocations, getEmployeeAllocationsForWeek, getEmployeeLoadForWeek, loadDataForMonth } = useAppAllocations();
  const { addAllocation, updateAllocation, deleteAllocation, isLoading: isGlobalLoading } = useAppAllocationActions();
  const { weeklyFeedback } = useAppWeeklyFeedback();

  const { currentAgency } = useAgency();
  const { outgoingTransfers } = useTaskTransfers();

  const { hasPermission } = usePermissions();
  const canAssignToOthers = hasPermission('can_assign_tasks_to_others');
  const weeklyCloseDay = useWeeklyCloseDay();
  const { formatName: formatProjectName } = useProjectAliasing();
  const isWeeklyEnabled = useIntegration('weekly_feedback');
  const isTimeTrackerEnabled = (currentAgency?.settings?.modules?.timeTracker ?? false) && currentUser?.id === employeeId && currentUser?.user_id != null;
  const preference = currentAgency?.settings?.hoursTrackingPreference;

  // Estados para los sheets de Timeline y Weekly
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [weeklyOpen, setWeeklyOpen] = useState(false);
  const [weeklyFocusAllocationId, setWeeklyFocusAllocationId] = useState<string | null>(null);

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
  const autoAddTriggeredRef = useRef(false);

  const [timeEntrySumsByAllocationId, setTimeEntrySumsByAllocationId] = useState<Record<string, number>>({});

  const refreshTimeEntrySums = useCallback(async () => {
    if (!isTimeTrackerEnabled || !employeeId) {
      setTimeEntrySumsByAllocationId({});
      return;
    }
    const { data, error } = await supabase
      .from('time_entries')
      .select('allocation_id, hours')
      .eq('employee_id', employeeId);
    if (error) return;
    const next: Record<string, number> = {};
    for (const row of data ?? []) {
      const aid = row.allocation_id as string | null;
      if (!aid) continue;
      next[aid] = round2((next[aid] ?? 0) + Number(row?.hours ?? 0));
    }
    setTimeEntrySumsByAllocationId(next);
  }, [isTimeTrackerEnabled, employeeId]);

  const handleTimeLogged = useCallback(
    (_allocationId: string, _hoursLogged: number) => {
      void loadDataForMonth(viewDate);
      void refreshTimeEntrySums();
    },
    [loadDataForMonth, viewDate, refreshTimeEntrySums]
  );

  useEffect(() => {
    if (open) void refreshTimeEntrySums();
  }, [open, refreshTimeEntrySums]);

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

  const [searchTerm, setSearchTerm] = useState('');
  const inlineInputRef = useRef<HTMLInputElement>(null);

  const [openComboboxId, setOpenComboboxId] = useState<string | null>(null);
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [showAllWeeks, setShowAllWeeks] = useState(false);

  // Estado para el dialog de transferencia
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferTask, setTransferTask] = useState<Allocation | null>(null);

  const isMobile = useIsMobile();
  const effectiveShowAllWeeks = showAllWeeks; // Permitir vista mensual en móvil si el usuario lo activa
  const sortMenuLabel = effectiveShowAllWeeks ? 'Vistas' : 'Ordenar';

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

  const sortOptionLabels: Record<SortOption, string> = {
    budget_desc: 'Horas contratadas (Mayor)',
    budget_asc: 'Horas contratadas (Menor)',
    my_hours_desc: 'Mis horas (Mayor)',
    my_hours_asc: 'Mis horas (Menor)',
    name_asc: 'Nombre (A-Z)',
    name_desc: 'Nombre (Z-A)',
  };
  const sortButtonLabel = effectiveShowAllWeeks ? sortMenuLabel : `${sortMenuLabel}: ${sortOptionLabels[sortOption]}`;

  // Proyecto seleccionado para mostrar detalles en panel lateral
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Filtro: solo proyectos donde tengo tareas esta semana
  const [showOnlyMyProjects, setShowOnlyMyProjects] = useState(true);

  const { isLoadingTasks, deadlines } = useAllocationSheetMonthData({
    open,
    isFormOpen: open,
    viewDate,
    currentAgencyId: currentAgency?.id,
    allocations,
    isGlobalLoading,
    loadDataForMonth,
  });

  // Usar hook personalizado para lógica de negocio
  const {
    employee,
    weeks,
    currentWeekIndex: hookCurrentWeekIndex,
    activeProjects,
    monthlyProjectSummary,
    getProjectBudgetStatus,
  } = useAllocationSheet(employeeId, viewDate, deadlines);

  const {
    newTasks, inlineEditingId, inlineNameValue, setInlineNameValue,
    editingAllocation, isFormOpen, setIsFormOpen, isSaving, showDeleteConfirm, setShowDeleteConfirm,
    editProjectId, setEditProjectId, editTaskName, setEditTaskName, editHours, setEditHours,
    editDescription, setEditDescription, editWeek, setEditWeek, editDependencyId, setEditDependencyId,
    addTaskRow, removeTaskRow, updateTaskRow, handleSave, startEditFull, handleDeleteClick,
    confirmDelete, toggleTaskCompletion, startInlineEdit, saveInlineEdit, updateInlineHours, moveTaskToWeek,
    closeForm, recentlyToggled, cancelInlineEdit, clearNewTasks,
    canSubmitBatchAdd, batchAddHint, batchPreviewContext
  } = useAllocationActions(employeeId, weeks, canAssignToOthers, isWeeklyEnabled, {
    batchPreview: {
      allocations,
      viewDate,
      weeks,
      getProjectBudgetStatus,
      getEmployeeLoadForWeek,
    },
  });

  const toggleTaskCompletionWithSums = useCallback(
    async (allocation: Parameters<typeof toggleTaskCompletion>[0]) => {
      await toggleTaskCompletion(allocation);
      void refreshTimeEntrySums();
    },
    [toggleTaskCompletion, refreshTimeEntrySums]
  );

  const { getWeekExceedStatus } = useTasksImpact({
    newTasks,
    projects,
    weeks,
    employeeId,
    getEmployeeLoadForWeek,
    getProjectBudgetStatus,
    viewMonth: viewDate,
    batchPreview: batchPreviewContext,
  });

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

  // FIX: Ajustar índice de semana si el mes cambia y tiene menos semanas (ej. de Enero sem 5 a Febrero sem 4)
  useEffect(() => {
    if (weeks.length > 0 && selectedWeekIndex !== null && selectedWeekIndex >= weeks.length) {
      setSelectedWeekIndex(weeks.length - 1);
    }
  }, [weeks.length, selectedWeekIndex]);

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

  const toolbarContextLine = useMemo(() => {
    if (effectiveShowAllWeeks) return `Viendo todo el mes · ${weeks.length} semanas`;
    if (weeks.length === 0 || activeWeekIndex < 0 || activeWeekIndex >= weeks.length) return null;
    const w = weeks[activeWeekIndex];
    const start = w.effectiveStart || w.weekStart;
    const end = w.effectiveEnd || addDays(w.weekStart, 6);
    return `Viendo la semana del ${format(start, 'd', { locale: es })} al ${format(end, 'd MMM', { locale: es })}`;
  }, [effectiveShowAllWeeks, weeks, activeWeekIndex]);

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
      a.status !== 'completed' &&
      isAllocationInEffectiveMonth(a.weekStartDate, viewDate) // Filter by current month
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

  const startAdd = (weekStartReal: Date) => {
    // Usar la fecha PROPORCIONADA por weeks (puede ser Jueves 1 Enero)
    const weekStartDate = format(weekStartReal, 'yyyy-MM-dd');
    closeForm();
    clearNewTasks();
    setTimeout(() => {
      addTaskRow(weekStartDate);
      setIsFormOpen(true);
    }, 0);
  };


  if (!employee) return null;

  // Mover el renderizado de loading dentro del return principal en lugar de retorno temprano
  // if (isLoadingTasks) { ... } <- ELIMINADO


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

  // Contenido reutilizable: desglose del proyecto (panel lateral y Sheet móvil)
  const renderProjectDetail = (projectId: string, onClose: () => void) => {
    const project = getProjectById(projectId);
    const budgetStatus = getProjectBudgetStatus(projectId);
    const { totalComputed, totalPlanned, budgetMax, budgetMin, percentage, status, breakdown = [] } = budgetStatus || {};
    const myData = (breakdown || []).find(b => b.employeeId === employeeId);
    const exceededBy = totalComputed > budgetMax ? totalComputed - budgetMax : 0;
    const isExact100 = budgetMax > 0 && Math.abs(totalComputed - budgetMax) < 0.1;
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
        <div className="bg-primary/10 border-b px-4 py-3 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800 truncate flex-1" title={project?.name}>
            <SensitiveText kind="project" id={projectId}>
              {formatProjectName(project?.name || 'Proyecto')}
            </SensitiveText>
          </h3>
          <Button variant="ghost" size="sm" className="h-9 w-9 min-h-[44px] min-w-[44px] p-0 hover:bg-indigo-100 shrink-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto max-h-[70vh]">
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
              <div className="mt-3">
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full", isExact100 || isAtMinimum ? "bg-emerald-500" : config.color)}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className={cn("text-[10px] font-medium", isExact100 || isAtMinimum ? "text-emerald-700" : config.textColor)}>
                    {Math.round(percentage)}% usado
                  </span>
                  {exceededBy > 0 && (
                    <span className="text-[10px] font-bold text-red-600">+{exceededBy.toFixed(1)}h exceso</span>
                  )}
                </div>
              </div>
              {(() => {
                const projection = totalPlanned + totalComputed;
                return (
                  <>
                    {status === 'overload' && (
                      <div className="bg-red-50 text-red-700 text-[11px] p-2 rounded border border-red-200 flex items-center gap-2">
                        <AlertOctagon className="w-4 h-4 flex-shrink-0" />
                        <span>Se han excedido las horas contratadas máximas</span>
                      </div>
                    )}
                    {status === 'warning' && (
                      <div className="bg-amber-50 text-amber-700 text-[11px] p-2 rounded border border-amber-200 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        {projection > budgetMax ? (
                          <span>Cuidado: La proyección total ({projection.toFixed(1)}h) ya supera el límite</span>
                        ) : (
                          <span>Quedan {(budgetMax - totalComputed).toFixed(1)}h disponibles</span>
                        )}
                      </div>
                    )}
                    {projection > budgetMax && status !== 'overload' && status !== 'warning' && (
                      <div className="bg-orange-50 text-orange-700 text-[11px] p-2 rounded border border-orange-200 flex items-center gap-2 mt-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>La proyección ({projection.toFixed(1)}h) supera contratadas</span>
                      </div>
                    )}
                  </>
                );
              })()}
              {breakdown.length > 1 && (
                <div className="border-t pt-3">
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 uppercase mb-2">
                    <Users className="w-3 h-3" /> Equipo ({breakdown.length})
                  </div>
                  <div className="space-y-1.5">
                    {breakdown.map(({ employeeId: empId, employeeName, computed, planned }) => {
                      const isMe = empId === employeeId;
                      const emp = (employees || []).find(e => e.id === empId);
                      return (
                        <div key={empId} className={cn(
                          "text-xs px-2 py-1.5 rounded flex items-center gap-2",
                          isMe ? "bg-primary/10 border border-indigo-100" : "bg-slate-50"
                        )}>
                          <Avatar className="h-6 w-6 border border-slate-200">
                            <AvatarImage src={emp?.avatarUrl} />
                            <AvatarFallback className="text-[10px] bg-slate-100">
                              {employeeName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className={cn("font-medium truncate", isMe ? "text-indigo-700" : "text-slate-600")}>
                              <SensitiveText kind="employee" id={empId}>{employeeName}</SensitiveText> {isMe && "(tú)"}
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
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          className="w-full sm:max-w-[95vw] overflow-y-auto overflow-x-hidden px-3 sm:px-6 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-xl border-l shadow-2xl pt-10"
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
              <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 relative">

                {/* 1. SECCIÓN IZQUIERDA: INFO EMPLEADO */}
                <div className="flex items-center gap-4 z-10">
                  {employee.avatarUrl ? (
                    <Avatar className="h-12 w-12 border-2 border-indigo-200 shadow-sm">
                      <AvatarImage src={employee.avatarUrl} alt={employee.name} />
                      <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold text-lg">
                        {employee.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg shadow-sm border border-indigo-200">
                      {employee.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <SheetTitle className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                      <SensitiveText kind="employee" id={employee.id} asBlock>
                        {employee.name}
                      </SensitiveText>
                      <Badge variant="outline" className="ml-2 font-normal text-slate-500 bg-slate-50 hidden sm:inline-flex">
                        Planificación
                      </Badge>
                    </SheetTitle>
                    <SheetDescription className="text-sm flex items-center gap-2 mt-0.5">
                      <span className="capitalize text-slate-500">{format(viewDate, 'MMMM yyyy', { locale: es })}</span>
                    </SheetDescription>
                  </div>
                </div>

                {/* 2. SECCIÓN CENTRAL: NAVEGACIÓN (Absoluta en desktop para centrado perfecto) */}
                <AllocationMonthNavigation
                  isMobile={isMobile}
                  monthLabel={monthLabel}
                  showAllWeeks={showAllWeeks}
                  onPrevMonth={handlePrevMonth}
                  onNextMonth={handleNextMonth}
                  onScrollWeeksLeft={() => scrollContainerRef.current?.scrollBy({ left: -420, behavior: 'smooth' })}
                  onScrollWeeksRight={() => scrollContainerRef.current?.scrollBy({ left: 420, behavior: 'smooth' })}
                />

                {/* 3. SECCIÓN DERECHA: HERRAMIENTAS */}
                <AllocationToolbarControls
                  isMobile={isMobile}
                  searchTerm={searchTerm}
                  onSearchTermChange={setSearchTerm}
                  effectiveShowAllWeeks={effectiveShowAllWeeks}
                  showAllWeeks={showAllWeeks}
                  onToggleShowAllWeeks={() => setShowAllWeeks(!showAllWeeks)}
                  onOpenTimeline={() => setTimelineOpen(true)}
                  onOpenWeekly={() => {
                    setWeeklyFocusAllocationId(null);
                    setWeeklyOpen(true);
                  }}
                  sortButtonLabel={sortButtonLabel}
                  autoExpand={autoExpand}
                  onToggleAutoExpand={() => setAutoExpand(!autoExpand)}
                  sortOption={sortOption}
                  onSetSortOption={setSortOption}
                />
              </div>
              {toolbarContextLine && (
                <p className="text-xs text-slate-500 mt-1 px-0.5" aria-live="polite">
                  {toolbarContextLine}
                </p>
              )}
            </SheetHeader>
          </TooltipProvider>

          {isLoadingTasks ? (
            <div className="min-h-[400px] flex items-center justify-center">
              <div className="text-slate-400 flex flex-col items-center gap-2">
                <div className="h-8 w-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                <span>Cargando tareas...</span>
              </div>
            </div>
          ) : (
            <TooltipProvider delayDuration={300}>
              {/* Contenedor relativo para posicionar flechas de navegación */}
              <div className="relative group">
                <div
                  ref={scrollContainerRef}
                  className={cn(
                    "gap-4 pb-20",
                    showAllWeeks
                      ? "flex overflow-x-auto gap-5 pb-8 snap-x snap-mandatory scroll-smooth px-2 sm:px-4 no-scrollbar pr-4 sm:pr-[250px]"
                      : "flex gap-6 min-w-0 overflow-x-hidden"
                  )}
                >
                  {/* Contenido principal de semanas */}
                  <div className={cn(
                    showAllWeeks ? "contents" : "flex-1 flex justify-center min-w-0 w-full"
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

                      // Calcular Est, Real, Comp para el header (Real/Comp incluyen también horas del cronómetro en tareas pendientes)
                      const weekEst = round2(weekAllocations.reduce((sum, a) => sum + (a.hoursAssigned || 0), 0));
                      const completedTasks = weekAllocations.filter(a => a.status === 'completed');
                      const weekReal = round2(weekAllocations.reduce((sum, a) => sum + (a.hoursActual || 0), 0));
                      const weekComp = round2(weekAllocations.reduce((sum, a) => sum + (a.status === 'completed' ? getEffectiveCompletedHours(a, preference) : 0), 0));
                      /** Suma de deltas por tarea completada (comp−real o est−real según agencia); no mezcla pendientes con cronómetro. */
                      const weekPlanDelta = round2(
                        completedTasks.reduce((sum, a) => sum + (getPlanningDeltaHours(a, preference) ?? 0), 0)
                      );

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
                      if (!effectiveShowAllWeeks) {
                        const nextWeekNavStart =
                          activeWeekIndex < weeks.length - 1
                            ? weeks[activeWeekIndex + 1].weekStart
                            : undefined;
                        return (
                          <div key={weekStr} className="flex-1 min-w-0 overflow-x-hidden w-full max-w-full">
                            {/* Header compacto de la semana */}
                            <div className="flex flex-col gap-4 mb-4 pb-3 border-b">
                              <div className="flex items-center justify-between w-full" data-tour="planner-week-nav">
                                <div className="flex items-center gap-2 xs:gap-3">
                                  <Button variant="outline" size="sm" className={cn("h-8 w-8 p-0", isMobile && "h-11 w-11 min-h-[44px]")} onClick={goToPrevWeek} disabled={activeWeekIndex === 0}>
                                    <ChevronLeft className="h-4 w-4" />
                                  </Button>
                                  <div>
                                    <div className="font-bold text-base xs:text-lg text-foreground truncate max-w-[140px] xs:max-w-none">Semana {activeWeekIndex + 1}</div>
                                    <div className="text-xs text-slate-500">{weekDateLabel}</div>
                                  </div>
                                  <Button variant="outline" size="sm" className={cn("h-8 w-8 p-0", isMobile && "h-11 w-11 min-h-[44px]")} onClick={goToNextWeek} disabled={activeWeekIndex === weeks.length - 1}>
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                </div>

                                <Button variant="outline" size="sm" className={cn("gap-2 h-8", isMobile && "h-11 min-h-[44px]")} onClick={() => startAdd(week.weekStart)} data-tour="planner-add-task">
                                  <Plus className="h-4 w-4" /> <span className="hidden xs:inline">Añadir</span>
                                </Button>
                              </div>

                              {/* Resumen de la semana - Stacking en móvil */}
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded shrink-0">
                                  <span className="text-slate-500">Plan:</span>
                                  <span className="font-bold">{weekEst}h</span>
                                  <span className="text-slate-400">/</span>
                                  <span className="text-slate-500 font-medium">{load.capacity}h</span>
                                </div>

                                {(weekReal > 0 || weekComp > 0 || completedTasks.length > 0) && (
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded shrink-0">
                                      <span className="text-blue-600">Real:</span>
                                      <span className="font-bold text-blue-700">{weekReal}h</span>
                                    </div>
                                    {preference !== 'actual' && (
                                      <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded shrink-0">
                                        <span className="text-emerald-600">Comp:</span>
                                        <span className="font-bold text-emerald-700">{weekComp}h</span>
                                      </div>
                                    )}
                                    {weekPlanDelta !== 0 && (
                                      <div className={cn(
                                        "flex items-center gap-1 px-2 py-1 rounded font-bold shrink-0",
                                        weekPlanDelta >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                      )}>
                                        {weekPlanDelta >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                        {weekPlanDelta >= 0 ? '+' : ''}{weekPlanDelta}h
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Tabla de proyectos y tareas */}
                            <div className="space-y-4 max-h-[70vh] overflow-y-auto overflow-x-hidden min-w-0 pr-2" data-tour="planner-projects">
                              {sortedGroups.map(([projId, projAllocations]) => {
                                const project = getProjectById(projId);
                                const budgetStatus = getProjectBudgetStatus(projId);
                                const allCompleted = projAllocations.every(a => a.status === 'completed') && !projAllocations.some(a => recentlyToggled.has(a.id));
                                const isSelected = selectedProjectId === projId;
                                const sortedTasks = sortTasks(projAllocations);

                                // Totales del proyecto esta semana (Real/Comp incluyen cronómetro en pendientes)
                                const projEst = round2(projAllocations.reduce((s, a) => s + (a.hoursAssigned || 0), 0));
                                const projReal = round2(projAllocations.reduce((s, a) => s + (a.hoursActual || 0), 0));
                                const projComp = round2(projAllocations.reduce((s, a) => s + (a.status === 'completed' ? getEffectiveCompletedHours(a, preference) : 0), 0));
                                const hasAllocations = projAllocations.length > 0;

                                return (
                                  <div
                                    key={projId}
                                    className={cn(
                                      "bg-white rounded-lg border shadow-sm overflow-hidden transition-all min-w-0",
                                      isSelected && "ring-2 ring-indigo-400",
                                      allCompleted && "opacity-80"
                                    )}
                                  >
                                    {/* Header del proyecto - clickeable para seleccionar */}
                                    <div
                                      className={cn(
                                        "px-3 sm:px-4 py-2.5 cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-4 min-w-0",
                                        budgetStatus.status === 'overload' ? "bg-red-500 text-white" :
                                          budgetStatus.status === 'warning' ? "bg-amber-500 text-white" :
                                            allCompleted ? "bg-slate-200 text-slate-700" : "bg-primary/100 text-white"
                                      )}
                                      onClick={() => setSelectedProjectId(isSelected ? null : projId)}
                                    >
                                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                        {allCompleted && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                                        <span className="font-bold truncate">
                                          <SensitiveText kind="project" id={projId}>
                                            {formatProjectName(project?.name || 'Proyecto')}
                                          </SensitiveText>
                                        </span>
                                        <span className="text-[10px] opacity-80 shrink-0">({projAllocations.length})</span>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs sm:text-sm shrink-0 min-w-0">
                                        <span className="opacity-80">{projEst}h est</span>
                                        {projReal > 0 && <span>{projReal}h real</span>}
                                        {preference !== 'actual' && projComp > 0 && <span className="font-bold">{projComp}h comp</span>}
                                      </div>
                                    </div>

                                    {/* Tabla de tareas */}
                                    {isMobile ? (
                                      <div className="flex flex-col divide-y divide-slate-100 min-w-0">
                                        {sortedTasks.map((alloc) => {
                                          const isCompleted = alloc.status === 'completed';
                                          const taskDelta = getPlanningDeltaHours(alloc, preference);
                                          const pendingTransferMobile = (outgoingTransfers || []).find(t => t.allocationId === alloc.id && t.status === 'pending');

                                          // Limpieza de nombre simplificada para móvil
                                          let cleanName = alloc.taskName || 'Tarea';
                                          cleanName = cleanName.replace(/\s*\(transferida de .+?(?:, original: .+?)?\)/g, '').trim();

                                          return (
                                            <div key={alloc.id} className={cn("group flex flex-col gap-2 p-3 bg-white touch-manipulation", isCompleted && "bg-slate-50/50")}>
                                              <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                                  <Checkbox
                                                    checked={isCompleted}
                                                    onCheckedChange={() => toggleTaskCompletionWithSums(alloc)}
                                                    disabled={!!pendingTransferMobile}
                                                    className={cn("mt-1 shrink-0", isCompleted && "data-[state=checked]:bg-emerald-600", pendingTransferMobile && "opacity-50")}
                                                  />
                                                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                                                    <span
                                                      className={cn("font-medium text-sm leading-tight break-words cursor-pointer", isCompleted && "line-through text-slate-400", pendingTransferMobile && "cursor-not-allowed opacity-70")}
                                                      onClick={() => {
                                                        if (pendingTransferMobile) return;
                                                        startEditFull(alloc);
                                                      }}
                                                    >
                                                      <SensitiveText kind="task" id={alloc.id}>
                                                        {formatProjectName(cleanName)}
                                                      </SensitiveText>
                                                    </span>
                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
                                                      <span className="shrink-0 font-mono text-base">{alloc.hoursAssigned}h</span>
                                                      <span className="shrink-0 text-slate-400">est</span>
                                                      {isTimeTrackerEnabled && !isCompleted && (
                                                        <TaskTimer
                                                          employeeId={alloc.employeeId}
                                                          allocationId={alloc.id}
                                                          onTimeLogged={handleTimeLogged}
                                                        />
                                                      )}
                                                      {isCompleted && (
                                                        <>
                                                          <span className="shrink-0">·</span>
                                                          <span className="shrink-0 font-mono text-base">{alloc.hoursActual ?? 0}h real</span>
                                                          {taskDelta !== null && taskDelta !== 0 && (
                                                            <span className={cn("font-mono text-base font-bold shrink-0", taskDelta < 0 ? "text-red-600" : "text-emerald-600")}>
                                                              {taskDelta > 0 ? '+' : ''}{taskDelta}h
                                                            </span>
                                                          )}
                                                          {taskDelta === 0 && (
                                                            <span className="shrink-0 text-slate-400 text-xs font-medium">Exacto</span>
                                                          )}
                                                        </>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>
                                                <PlannerTaskContextMenu
                                                  alloc={alloc}
                                                  pendingTransfer={!!pendingTransferMobile}
                                                  isWeeklyEnabled={isWeeklyEnabled}
                                                  weeklyCloseDay={weeklyCloseDay}
                                                  nextWeekStart={nextWeekNavStart}
                                                  onStartEditFull={() => {
                                                    if (pendingTransferMobile) return;
                                                    startEditFull(alloc);
                                                  }}
                                                  onTransfer={() => {
                                                    setTransferTask(alloc);
                                                    setTransferDialogOpen(true);
                                                  }}
                                                  onMoveTask={(target) => moveTaskToWeek(alloc, target)}
                                                  onOpenWeeklyForTask={
                                                    isWeeklyEnabled
                                                      ? (a) => {
                                                          setWeeklyFocusAllocationId(a.id);
                                                          setWeeklyOpen(true);
                                                        }
                                                      : undefined
                                                  }
                                                  menuTriggerMode="always"
                                                  triggerClassName="h-11 w-11 min-h-[44px] min-w-[44px]"
                                                  iconClassName="h-4 w-4"
                                                />
                                              </div>
                                            </div>
                                          );
                                        })}
                                        {sortedTasks.length === 0 && (
                                          <div className="p-4 text-center text-sm text-slate-500 italic">No hay tareas</div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="min-w-0 overflow-x-auto overflow-y-visible">
                                        <table className="w-full text-sm min-w-[320px]">
                                          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                                            <tr>
                                              <th className="py-2 px-3 text-left font-medium w-8"></th>
                                              <th className="py-2 px-3 text-left font-medium">Tarea</th>
                                              <th className="py-2 px-3 text-center font-medium w-20">Horas</th>
                                              {isTimeTrackerEnabled && <th className="py-2 px-2 text-center font-medium w-28">Cronómetro</th>}
                                              <th className="py-2 px-3 text-center font-medium w-24">Real</th>
                                              {preference !== 'actual' && <th className="py-2 px-3 text-center font-medium w-24">Comp</th>}
                                              <th className="py-2 px-3 text-center font-medium w-20">Balance</th>
                                              <th className="py-2 px-3 text-center font-medium w-12"></th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100">
                                            {sortedTasks.map((alloc, taskIndex) => {
                                              const isCompleted = alloc.status === 'completed';
                                              const sumTe = timeEntrySumsByAllocationId[alloc.id];
                                              const trackedFromTimer =
                                                isTimeTrackerEnabled && sumTe !== undefined ? round2(sumTe) : null;
                                              const taskDelta = getPlanningDeltaHours(alloc, preference);
                                              const depTask = alloc.dependencyId ? (allocations || []).find(a => a.id === alloc.dependencyId) : null;
                                              const depOwner = depTask ? (employees || []).find(e => e.id === depTask.employeeId) : null;
                                              const isDepReady = depTask?.status === 'completed';
                                              const blockingTasks = (allocations || []).filter(a => a.dependencyId === alloc.id && a.status !== 'completed');
                                              const isFirstTask = taskIndex === 0;

                                              // Verificar si hay transferencia pendiente (Bloqueo de edición)
                                              const pendingTransfer = (outgoingTransfers || []).find(t => t.allocationId === alloc.id && t.status === 'pending');

                                              return (
                                                <tr
                                                  key={alloc.id}
                                                  className={cn(
                                                    "group hover:bg-slate-50 transition-colors",
                                                    isCompleted && "bg-slate-50/50",
                                                    !isCompleted && depTask && !isDepReady && "bg-amber-50/50"
                                                  )}
                                                  {...(isFirstTask && { 'data-tour': 'planner-task' })}
                                                >
                                                  <td className="py-2 px-3" {...(isFirstTask && { 'data-tour': 'planner-checkbox' })}>
                                                    <Checkbox
                                                      checked={isCompleted}
                                                      onCheckedChange={() => toggleTaskCompletionWithSums(alloc)}
                                                      disabled={!!pendingTransfer}
                                                      className={cn(
                                                        isCompleted && "data-[state=checked]:bg-emerald-600",
                                                        pendingTransfer && "opacity-50 cursor-not-allowed"
                                                      )}
                                                    />
                                                  </td>
                                                  <td className="py-2 px-3">
                                                    <div className="space-y-1">
                                                      <div className="flex items-center gap-1.5">
                                                        <div
                                                          className={cn(
                                                            "font-medium rounded px-1 -mx-1",
                                                            isCompleted && "line-through text-slate-400",
                                                            pendingTransfer ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:bg-slate-100"
                                                          )}
                                                          onDoubleClick={() => !pendingTransfer && startInlineEdit(alloc)}
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
                                                                if (e.key === 'Escape') cancelInlineEdit();
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
                                                          const isTransferred = alloc.transferSourceEmployeeId || alloc.taskName?.includes('(transferida de') || alloc.transferredFromAllocationId;
                                                          const isDistributed = alloc.distributionSourceAllocationId;
                                                          const hasWeeklyFeedback = weeklyFeedback.some(fb => fb.allocationId === alloc.id);
                                                          const wasAdjustedViaWeekly = hasWeeklyFeedback || isTransferred || isDistributed ||
                                                            (alloc.hoursAssigned === 0 && alloc.hoursActual === 0 && alloc.hoursComputed === 0 && alloc.status === 'completed');

                                                          if (!wasAdjustedViaWeekly) return null;

                                                          // Extraer información de transferencia/distribución para el tooltip
                                                          let transferInfo: string | null = null;

                                                          // Caso 0: Nuevas columnas (Tracking Robusto)
                                                          if (alloc.transferSourceEmployeeId) {
                                                            const sourceEmployee = (employees || []).find(e => e.id === alloc.transferSourceEmployeeId);
                                                            const originalName = alloc.originalTransferredTaskName || alloc.taskName || 'Tarea';
                                                            if (isDistributed) {
                                                              transferInfo = `Distribuida (origen genérico)\nFuente original: ${sourceEmployee?.name || 'compañero'}\nTarea original: ${originalName}`;
                                                            } else {
                                                              transferInfo = `Transferida de ${sourceEmployee?.name || 'compañero'}\nTarea original: ${originalName}`;
                                                            }
                                                          }
                                                          // Caso 1: Tarea distribuida desde una transferencia (Legacy)
                                                          else if (isDistributed && alloc.distributionSourceAllocationId) {
                                                            const sourceTask = (allocations || []).find(a => a.id === alloc.distributionSourceAllocationId);
                                                            if (sourceTask) {
                                                              const sourceEmployee = (employees || []).find(e => e.id === sourceTask.employeeId);
                                                              // Buscar la tarea original de la que proviene la transferencia
                                                              if (sourceTask.transferredFromAllocationId) {
                                                                const originalTask = sourceTask.transferredFromAllocationId
                                                                  ? (allocations || []).find(a => a.id === sourceTask.transferredFromAllocationId)
                                                                  : null;
                                                                const originalEmployee = originalTask ? (employees || []).find(e => e.id === originalTask.employeeId) : null;
                                                                // Limpiar el nombre original (sin el sufijo de transferencia)
                                                                const cleanOriginalName = originalTask?.taskName?.replace(/\(transferida de .+?\)/g, '').trim() || originalTask?.taskName || 'Sin nombre';
                                                                transferInfo = `Distribuida desde transferencia de ${sourceEmployee?.name || 'compañero'}\nTarea original: ${cleanOriginalName} (de ${originalEmployee?.name || 'compañero'})`;
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
                                                              const originalTask = alloc.transferredFromAllocationId
                                                                ? (allocations || []).find(a => a.id === alloc.transferredFromAllocationId)
                                                                : null;
                                                              const fromEmployee = originalTask ? (employees || []).find(e => e.id === originalTask.employeeId) : null;
                                                              // Limpiar el nombre original (sin el sufijo de transferencia)
                                                              const cleanOriginalName = originalTask?.taskName?.replace(/\(transferida de .+?\)/g, '').trim() || originalTask?.taskName || 'Sin nombre';
                                                              transferInfo = `Transferida de ${fromEmployee?.name || 'compañero'}\nTarea original: ${cleanOriginalName}`;
                                                            }
                                                          }

                                                          return (
                                                            <Tooltip>
                                                              <TooltipTrigger asChild>
                                                                <Badge variant="outline" className="h-4 px-1.5 text-[9px] bg-primary/10 text-indigo-700 border-indigo-200 cursor-help">
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
                                                            const blockedUser = (employees || []).find(e => e.id === bt.employeeId);
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
                                                          <Badge variant="outline" className="h-3.5 px-1 text-[8px] bg-primary/10 text-indigo-700 border-indigo-200">
                                                            Weekly
                                                          </Badge>
                                                        ) : null;
                                                      })()}
                                                    </div>
                                                  </td>
                                                  {isTimeTrackerEnabled && (
                                                    <td className="py-2 px-2 text-center">
                                                      {!isCompleted && (
                                                        <TaskTimer
                                                          employeeId={alloc.employeeId}
                                                          allocationId={alloc.id}
                                                          onTimeLogged={handleTimeLogged}
                                                        />
                                                      )}
                                                      {isCompleted &&
                                                        (trackedFromTimer !== null && trackedFromTimer > 0 ? (
                                                          <div
                                                            key={`${alloc.id}-timer-readonly-${trackedFromTimer}`}
                                                            className={cn(
                                                              'inline-flex items-center justify-center mx-auto px-2.5 py-0.5 rounded-full border font-mono text-xs font-medium tabular-nums max-w-full',
                                                              'bg-slate-50 border-slate-200 text-slate-600'
                                                            )}
                                                            title="Tiempo imputado con el cronómetro (registros). Puede diferir del Real si ajustas horas a mano. La tarea completada no reanuda el cronómetro."
                                                            role="status"
                                                          >
                                                            {formatDecimalHoursAsHm(trackedFromTimer)}
                                                          </div>
                                                        ) : (
                                                          <span className="text-slate-300 text-xs">—</span>
                                                        ))}
                                                    </td>
                                                  )}
                                                  <td className="py-2 px-3 text-center">
                                                    {isCompleted ? (
                                                      <input
                                                        key={`${alloc.id}-hoursActual-${alloc.hoursActual ?? 0}`}
                                                        type="number"
                                                        step="0.25"
                                                        min="0"
                                                        disabled={!!pendingTransfer}
                                                        defaultValue={alloc.hoursActual || 0}
                                                        onBlur={(e) => updateInlineHours(alloc, 'hoursActual', e.target.value)}
                                                        className={cn(
                                                          "w-12 px-1 py-0.5 text-[10px] text-center border rounded font-mono",
                                                          pendingTransfer ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-blue-50 text-blue-700"
                                                        )}
                                                      />
                                                    ) : (
                                                      <span className="text-slate-300 text-xs">-</span>
                                                    )}
                                                  </td>
                                                  {preference !== 'actual' && (
                                                    <td className="py-2 px-3 text-center" {...(isFirstTask && { 'data-tour': 'planner-hours' })}>
                                                      {isCompleted ? (
                                                        <input
                                                          type="number"
                                                          step="0.25"
                                                          min="0"
                                                          disabled={!!pendingTransfer}
                                                          defaultValue={alloc.hoursComputed || 0}
                                                          onBlur={(e) => updateInlineHours(alloc, 'hoursComputed', e.target.value)}
                                                          className={cn(
                                                            "w-12 px-1 py-0.5 text-[10px] text-center border rounded font-mono",
                                                            pendingTransfer ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-emerald-50 text-emerald-700"
                                                          )}
                                                        />
                                                      ) : (
                                                        <span className="text-slate-300 text-xs">-</span>
                                                      )}
                                                    </td>
                                                  )}
                                                  <td className="py-2 px-3 text-center">
                                                    {isCompleted && taskDelta !== null && taskDelta !== 0 ? (
                                                      taskDelta > 0 ? (
                                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-100 shadow-sm">
                                                          <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                                                          <span className="text-xs font-semibold text-emerald-700">+{taskDelta}h</span>
                                                        </div>
                                                      ) : (
                                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-100 shadow-sm">
                                                          <TrendingDown className="h-3.5 w-3.5 text-amber-600" />
                                                          <span className="text-xs font-semibold text-amber-700">{taskDelta}h</span>
                                                        </div>
                                                      )
                                                    ) : isCompleted ? (
                                                      <span className="text-slate-300 text-xs font-medium">Exacto</span>
                                                    ) : (
                                                      <span className="text-slate-200 text-xs">-</span>
                                                    )}
                                                  </td>
                                                  <td className="py-2 px-3 text-center">
                                                    <div className="flex justify-center">
                                                      <PlannerTaskContextMenu
                                                        alloc={alloc}
                                                        pendingTransfer={!!pendingTransfer}
                                                        isWeeklyEnabled={isWeeklyEnabled}
                                                        weeklyCloseDay={weeklyCloseDay}
                                                        nextWeekStart={nextWeekNavStart}
                                                        onStartEditFull={() => {
                                                          if (pendingTransfer) return;
                                                          startEditFull(alloc);
                                                        }}
                                                        onTransfer={() => {
                                                          setTransferTask(alloc);
                                                          setTransferDialogOpen(true);
                                                        }}
                                                        onMoveTask={(target) => moveTaskToWeek(alloc, target)}
                                                        onOpenWeeklyForTask={
                                                          isWeeklyEnabled
                                                            ? (a) => {
                                                                setWeeklyFocusAllocationId(a.id);
                                                                setWeeklyOpen(true);
                                                              }
                                                            : undefined
                                                        }
                                                        triggerClassName="h-7 w-7"
                                                      />
                                                    </div>
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
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
                                      <div className="bg-primary/100 text-white px-4 py-2.5 flex items-center justify-between">
                                        <span className="font-bold text-sm">Retainer mensual [Cliente ejemplo]</span>
                                        <span className="text-xs opacity-80">(3 tareas)</span>
                                      </div>
                                      <table className="w-full text-sm">
                                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                                          <tr>
                                            <th className="py-2 px-3 text-left font-medium w-8"></th>
                                            <th className="py-2 px-3 text-left font-medium">Tarea</th>
                                            <th className="py-2 px-2 text-center font-medium w-12">Horas</th>
                                            {preference !== 'actual' && <th className="py-2 px-2 text-center font-medium w-12">Comp</th>}
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                          <tr className="hover:bg-slate-50" data-tour="planner-task">
                                            <td className="py-2 px-3" data-tour="planner-checkbox">
                                              <Checkbox checked={false} />
                                            </td>
                                            <td className="py-2 px-3" data-tour="planner-task-name">
                                              <span className="font-medium">Brief de campaña</span>
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
                                              <span className="font-medium">Creatividades y adaptaciones</span>
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
                          <div key={weekStr} className="flex flex-col gap-3 p-5 rounded-2xl border bg-gradient-to-br from-white to-slate-50/80 min-h-[400px] min-w-0 sm:min-w-[340px] max-w-full sm:max-w-[380px] w-[85vw] sm:w-auto flex-shrink-0 snap-center shadow-sm">
                            <div className="text-center py-12 text-slate-400">
                              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50 animate-pulse" />
                              <p className="text-sm font-medium mb-1">Cargando tareas...</p>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={weekStr} className="flex flex-col gap-3 p-3 sm:p-5 rounded-2xl border bg-gradient-to-br from-white to-slate-50/80 min-h-[400px] min-w-0 sm:min-w-[340px] max-w-full sm:max-w-[380px] w-[85vw] sm:w-auto flex-shrink-0 snap-center shadow-sm hover:shadow-md transition-shadow duration-300">
                          {/* HEADER SEMANA MEJORADO */}
                          <div className="flex flex-col gap-3 pb-3 border-b border-slate-100">
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
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-lg shadow-sm">
                                    {index + 1}
                                  </div>
                                  <div>
                                    <span className="font-bold text-base text-slate-800">Semana {index + 1}</span>
                                    <div className="text-xs text-slate-500">{weekDateLabel}</div>
                                  </div>
                                </div>
                              )}
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-indigo-100 hover:text-indigo-700 rounded-full transition-colors" onClick={() => startAdd(week.weekStart)}>
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Barra de carga con marca de capacidad - Rediseñada */}
                            <div className="relative mt-1">
                              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                <div
                                  className={cn(
                                    "h-full transition-all duration-700 ease-out rounded-full",
                                    load.percentage > 110 ? "bg-gradient-to-r from-red-400 to-red-500" :
                                      load.percentage < 90 ? "bg-gradient-to-r from-amber-400 to-amber-500" :
                                        "bg-gradient-to-r from-emerald-400 to-emerald-500"
                                  )}
                                  style={{ width: `${Math.min(load.percentage, 100)}%` }}
                                />
                              </div>
                              {/* Porcentaje a la derecha (leyenda: verde 90-110%, amarillo <90%, rojo >110%) */}
                              <div className={cn(
                                "absolute right-0 -top-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                                load.percentage > 110
                                  ? "text-white bg-red-500"
                                  : load.percentage < 90
                                    ? "text-amber-900 bg-amber-400"
                                    : "text-white bg-emerald-500"
                              )}>
                                {Math.round(load.percentage)}%
                              </div>
                            </div>

                            {/* Planificación: Est vs Capacidad */}
                            <div className="flex items-center justify-between text-xs mt-2">
                              <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg">
                                <span className="text-slate-500">Plan:</span>
                                <span className="font-bold tabular-nums text-slate-700">{weekEst}h</span>
                                <span className="text-slate-400">/</span>
                                <span className="text-slate-500 font-medium">{load.capacity}h</span>
                              </div>
                              {weekEst !== load.capacity && (
                                <div className={cn(
                                  "font-bold tabular-nums px-2 py-1 rounded-lg text-xs",
                                  weekEst > load.capacity
                                    ? "text-red-700 bg-red-50 border border-red-100"
                                    : "text-emerald-700 bg-emerald-50 border border-emerald-100"
                                )}>
                                  {weekEst > load.capacity ? '+' : ''}{round2(weekEst - load.capacity)}h
                                </div>
                              )}
                            </div>

                            {/* Ejecución: Real (+ Comp si aplica). Delta = suma por tareas completadas (no mezcla cronómetro pendiente). */}
                            {(weekReal > 0 || weekComp > 0 || completedTasks.length > 0) && (
                              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-dashed">
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-600 tabular-nums">
                                    <span className="text-slate-400 text-[10px]">Real</span> {weekReal}h
                                  </span>
                                  {preference !== 'actual' && (
                                    <>
                                      <span className="text-slate-300">→</span>
                                      <span className="text-emerald-600 tabular-nums">
                                        <span className="text-slate-400 text-[10px]">Comp</span> {weekComp}h
                                      </span>
                                    </>
                                  )}
                                </div>
                                {weekPlanDelta !== 0 ? (
                                  <div className={cn(
                                    "flex items-center gap-1 font-bold tabular-nums px-1.5 py-0.5 rounded text-[10px]",
                                    weekPlanDelta >= 0 ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50"
                                  )}>
                                    {weekPlanDelta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {weekPlanDelta >= 0 ? '+' : ''}{weekPlanDelta}h
                                  </div>
                                ) : (
                                  completedTasks.length > 0 && (
                                    <span className="text-slate-400 text-[10px] font-medium tabular-nums">Exacto</span>
                                  )
                                )}
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
                          <div className={cn("flex-1 overflow-y-auto max-h-[50vh] space-y-2 custom-scrollbar", isMobile ? "pr-3" : "pr-1")}>
                            {sortedGroups.length === 0 ? (
                              <div className="text-center py-8 text-slate-400">
                                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm font-medium">Sin tareas</p>
                                <p className="text-xs mt-1">Haz click en + para añadir</p>
                              </div>
                            ) : sortedGroups.map(([projId, projAllocations]) => {
                              const project = getProjectById(projId);
                              const budgetStatus = getProjectBudgetStatus(projId);
                              const allCompleted = projAllocations.every(a => a.status === 'completed') && !projAllocations.some(a => recentlyToggled.has(a.id));
                              const isCollapsed = autoExpand ? collapsedProjects.has(projId) : !collapsedProjects.has(projId);
                              const sortedTasks = sortTasks(projAllocations);

                              // Calcular horas del empleado actual en este proyecto
                              const completedCount = projAllocations.filter(a => a.status === 'completed').length;
                              const totalCount = projAllocations.length;
                              const myHoursInProject = {
                                estimated: round2(projAllocations.reduce((sum, a) => sum + (a.hoursAssigned || 0), 0)),
                                completed: completedCount,
                                computed: round2(projAllocations.filter(a => a.status === 'completed').reduce((sum, a) => sum + getEffectiveCompletedHours(a, preference), 0))
                              };

                              const isSelected = selectedProjectId === projId;
                              const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                              return (
                                <Collapsible key={projId} open={!isCollapsed} onOpenChange={() => {
                                  toggleProjectCollapse(projId);
                                  // Al hacer clic en el proyecto, seleccionar para mostrar desglose (semanal y mensual)
                                  setSelectedProjectId(projId);
                                }}>
                                  <div className={cn(
                                    "bg-white border rounded-xl shadow-sm overflow-hidden transition-all duration-200",
                                    allCompleted && "opacity-70 hover:opacity-100",
                                    isSelected && "ring-2 ring-indigo-400 border-indigo-300",
                                    !isCollapsed && "shadow-md"
                                  )}>
                                    <CollapsibleTrigger asChild>
                                      <div className="cursor-pointer relative group">
                                        {/* Header compacto para vista mensual */}
                                        {showAllWeeks ? (
                                          <div className={cn(
                                            "px-3 py-2.5 flex items-center gap-2 transition-colors",
                                            allCompleted ? "bg-emerald-50" : "hover:bg-slate-50"
                                          )}>
                                            {/* Indicador de estado */}
                                            <div className={cn(
                                              "flex-shrink-0 w-2 h-2 rounded-full",
                                              allCompleted ? "bg-emerald-500" :
                                                completedCount > 0 ? "bg-amber-400" : "bg-slate-300"
                                            )} />
                                            {/* Nombre del proyecto */}
                                            <div className="flex-1 min-w-0">
                                              <div className={cn(
                                                "font-medium text-sm truncate",
                                                allCompleted ? "text-emerald-700" : "text-slate-700"
                                              )}>
                                                <SensitiveText kind="project" id={projId}>
                                                  {formatProjectName(project?.name || 'Proyecto')}
                                                </SensitiveText>
                                              </div>
                                              <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                                <span className="flex items-center gap-0.5">
                                                  {allCompleted ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : null}
                                                  {completedCount}/{totalCount} tareas
                                                </span>
                                                <span>•</span>
                                                <span className="font-medium">{myHoursInProject.estimated}h</span>
                                              </div>
                                            </div>
                                            {/* Mini barra de progreso */}
                                            <div className="flex-shrink-0 w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                              <div
                                                className={cn(
                                                  "h-full rounded-full transition-all",
                                                  progressPercent === 100 ? "bg-emerald-500" : "bg-indigo-400"
                                                )}
                                                style={{ width: `${progressPercent}%` }}
                                              />
                                            </div>
                                            <ChevronDown className={cn(
                                              "w-4 h-4 text-slate-400 transition-transform flex-shrink-0",
                                              !isCollapsed && "rotate-180"
                                            )} />
                                          </div>
                                        ) : (
                                          <>
                                            <AllocationProjectHeader
                                              project={project}
                                              budgetStatus={budgetStatus}
                                              allCompleted={allCompleted}
                                              taskCount={projAllocations.length}
                                              myHoursInProject={myHoursInProject}
                                              currentEmployeeId={employeeId}
                                            />
                                            <ChevronDown className={cn(
                                              "w-4 h-4 text-slate-400 transition-transform absolute right-3 top-1/2 -translate-y-1/2",
                                              !isCollapsed && "rotate-180"
                                            )} />
                                          </>
                                        )}
                                      </div>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                      <div className="divide-y divide-slate-100 border-t">
                                        {sortedTasks.map(alloc => (
                                          <AllocationTaskRow
                                            key={alloc.id}
                                            alloc={alloc}
                                            weekIndex={index}
                                            isInlineEditing={inlineEditingId === alloc.id}
                                            inlineNameValue={inlineNameValue}
                                            onInlineNameChange={setInlineNameValue}
                                            onSaveInline={() => saveInlineEdit(alloc)}
                                            onStartInlineEdit={() => startInlineEdit(alloc)}
                                            onToggleCompletion={() => toggleTaskCompletionWithSums(alloc)}
                                            onUpdateInlineHours={(field, value) => updateInlineHours(alloc, field, value)}
                                            onStartEditFull={() => startEditFull(alloc)}
                                            onMoveTask={(targetWeekStart) => moveTaskToWeek(alloc, targetWeekStart)}
                                            nextWeekStart={weeks[(index + 1) % weeks.length].weekStart}
                                            employees={employees}
                                            allocations={allocations}
                                            outgoingTransfers={outgoingTransfers}
                                            weeklyFeedback={weeklyFeedback}
                                            showAllWeeks={showAllWeeks}
                                            setTransferTask={setTransferTask}
                                            setTransferDialogOpen={setTransferDialogOpen}
                                            isWeeklyEnabled={isWeeklyEnabled}
                                            isMobile={isMobile}
                                            showTaskTimer={isTimeTrackerEnabled}
                                            onTimeLogged={handleTimeLogged}
                                            timeEntriesSum={timeEntrySumsByAllocationId[alloc.id]}
                                            onOpenWeeklyForTask={
                                              isWeeklyEnabled
                                                ? (a) => {
                                                    setWeeklyFocusAllocationId(a.id);
                                                    setWeeklyOpen(true);
                                                  }
                                                : undefined
                                            }
                                          />
                                        ))}
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

                  {/* Panel lateral derecho - Detalles del proyecto seleccionado (vista semanal y mensual, solo desktop) */}
                  {selectedProjectId && !isMobile && (
                    <div className="w-80 flex-shrink-0">
                      <div className="sticky top-4 space-y-3">
                        {/* Contenido dinámico: proyecto seleccionado o resumen */}
                        {selectedProjectId ? (
                          renderProjectDetail(selectedProjectId, () => setSelectedProjectId(null))
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
                                          className="w-full text-left p-2.5 bg-slate-50 hover:bg-primary/10 rounded-lg border border-slate-100 hover:border-indigo-200 transition-colors"
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="font-medium text-xs text-slate-700 truncate">
                                              <SensitiveText kind="project" id={projId}>
                                                {formatProjectName(project?.name || '')}
                                              </SensitiveText>
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
                                                  className={cn("h-full transition-all duration-300", progress === 100 ? "bg-emerald-500" : "bg-primary/100")}
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
              </div>
            </TooltipProvider>
          )}

          {/* Cierre del bloque !isLoadingTasks */}
        </SheetContent>
      </Sheet>

      {/* Sheet móvil: desglose del proyecto al hacer clic (vista semanal o mensual) */}
      {isMobile && (
        <Sheet open={!!selectedProjectId} onOpenChange={(open) => !open && setSelectedProjectId(null)}>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl pt-6 pb-8 px-4">
            {selectedProjectId && renderProjectDetail(selectedProjectId, () => setSelectedProjectId(null))}
          </SheetContent>
        </Sheet>
      )}

      <AllocationFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingAllocation={editingAllocation}
        newTasks={newTasks}
        editProjectId={editProjectId}
        editTaskName={editTaskName}
        editHours={editHours}
        editWeek={editWeek}
        editDependencyId={editDependencyId}
        isSaving={isSaving}
        showDeleteConfirm={showDeleteConfirm}
        onClose={closeForm}
        onSave={handleSave}
        onDelete={handleDeleteClick}
        onConfirmDelete={confirmDelete}
        setEditProjectId={setEditProjectId}
        setEditTaskName={setEditTaskName}
        setEditHours={setEditHours}
        setEditWeek={setEditWeek}
        setEditDependencyId={setEditDependencyId}
        setShowDeleteConfirm={setShowDeleteConfirm}
        addTaskRow={addTaskRow}
        updateTaskRow={updateTaskRow}
        removeTaskRow={removeTaskRow}
        activeProjects={activeProjects}
        clients={clients}
        employees={employees}
        weeks={weeks}
        allocations={allocations}
        deadlines={deadlines}
        currentEmployeeId={employeeId}
        canAssignToOthers={canAssignToOthers}
        viewDate={viewDate}
        getProjectBudgetStatus={getProjectBudgetStatus}
        getAvailableDependencies={getAvailableDependencies}
        getWeekExceedStatus={getWeekExceedStatus}
        getEmployeeLoadForWeek={getEmployeeLoadForWeek}
        formatProjectName={formatProjectName}
        canSubmitBatchAdd={canSubmitBatchAdd}
        batchAddHint={batchAddHint}
        batchPreview={batchPreviewContext}
      />

      {/* Tour interactivo del planificador */}
      {open && <PlannerTour onVisibilityChange={setIsTourActive} />}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la tarea "{editingAllocation?.taskName}" y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar tarea
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sheets de Timeline y Weekly */}
      <TimelineSheet
        open={timelineOpen}
        onOpenChange={setTimelineOpen}
        initialViewDate={viewDate}
      />
      <WeeklyReportDialog
        open={weeklyOpen}
        onOpenChange={(o) => {
          setWeeklyOpen(o);
          if (!o) setWeeklyFocusAllocationId(null);
        }}
        employeeId={employeeId}
        viewDate={viewDate}
        focusAllocationId={weeklyFocusAllocationId}
      />

      {/* Dialog de Transferencia de Tareas */}
      {transferTask && (
        <TransferRequestDialog
          open={transferDialogOpen}
          onOpenChange={setTransferDialogOpen}
          allocationId={transferTask.id}
          taskName={transferTask.taskName || ''}
          currentHours={transferTask.hoursAssigned}
          allocationWeekStartDate={transferTask.weekStartDate}
        />
      )}
    </>
  );

  // Función auxiliar para renderizar una tarea

}

// Componente ProjectImpactSummary movido a archivo separado: ProjectImpactSummary.tsx
