import { useState, useMemo, useCallback, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAgency } from '@/contexts/AgencyContext';
import { MyWeekView } from '@/components/employee/MyWeekView';
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
import { ProjectImpactSummary } from '@/components/planner/ProjectImpactSummary';
import { BatchTaskRow } from '@/components/planner/BatchTaskRow';
import { useAllocationSheet, ProjectBudgetStatus } from '@/hooks/useAllocationSheet';
import { useTasksImpact } from '@/hooks/useTasksImpact';
import { AbsencesSheet } from '@/components/team/AbsencesSheet';
import { ProfessionalGoalsSheet } from '@/components/team/ProfessionalGoalsSheet';
import { getWeeksForMonth, getMonthName, isAllocationInEffectiveMonth, normalizeWeekStart, getWeekEndDate } from '@/utils/dateUtils';
import { useWeeklyCloseDay } from '@/hooks/useWeeklyCloseDay';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { supabase } from '@/lib/supabase';
import { fetchDeadlinesForMonth } from '@/utils/deadlineUtils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter }
  from "@/components/ui/dialog";
import { NewTaskRow, Deadline } from '@/types';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, CalendarDays, TrendingUp, Calendar, Clock, CheckCircle2, Plus, X, Check, ListPlus, AlertTriangle, HelpCircle, RotateCcw, FileDown, CheckSquare, AlertCircle, Trash2, MoreHorizontal } from 'lucide-react';
import { startOfMonth, endOfMonth, format, isSameMonth, parseISO, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import { useIsMobile } from '@/hooks/use-mobile';
import { useIntegration } from '@/hooks/useIntegration';
import { useDashboardView } from '@/hooks/useDashboardView';
import { ViewToggle, ViewModeIndicator } from '@/components/employee/ViewToggle';
import { DailyZenDashboard } from '@/components/employee/DailyZenDashboard';
import { PendingTransfersPanel } from '@/components/transfers/TaskTransferComponents';
import { useProjectAliasing } from '@/hooks/useProjectAliasing';

const INTERNAL_CLIENT_NAME = 'Interno';
const INTERNAL_PROJECT_NAME = 'Gestiones internas';

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;


export default function EmployeeDashboard() {
  const { employees, projects, clients, allocations, absences, teamEvents, getEmployeeAllocationsForWeek, getEmployeeLoadForWeek, addAllocation, updateAllocation, deleteAllocation, isLoading: isGlobalLoading, ensureMonthLoaded, weeklyFeedback, getEmployeeMonthlyLoad, currentUser: appCurrentUser } = useApp();

  const { currentAgency } = useAgency();
  const myEmployeeProfile = appCurrentUser || null;
  const isLoadingProfile = isGlobalLoading;
  const { canAccess } = usePermissions();
  const isManager = canAccess('/planner') || canAccess('/reports');

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isLoadingMonth, setIsLoadingMonth] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ employeeId: string; weekStart: Date } | null>(null);

  const [showGoals, setShowGoals] = useState(false);
  const [showAbsences, setShowAbsences] = useState(false);
  const [isAddingExtra, setIsAddingExtra] = useState(false);
  const [isAddingTasks, setIsAddingTasks] = useState(false);
  const [isSavingTasks, setIsSavingTasks] = useState(false);

  const [extraTaskName, setExtraTaskName] = useState('');
  const [extraHours, setExtraHours] = useState('1');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isSavingExtraTask, setIsSavingExtraTask] = useState(false);

  const [newTasks, setNewTasks] = useState<NewTaskRow[]>([]);
  const [openComboboxId, setOpenComboboxId] = useState<string | null>(null);
  const [showWeeklyDialog, setShowWeeklyDialog] = useState(false);
  // Default to "dependencies" (Prioridades) for better focus
  const [activeTab, setActiveTab] = useState('dependencies');
  const [actionsDropdownOpen, setActionsDropdownOpen] = useState(false);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [dialogDeadlines, setDialogDeadlines] = useState<Deadline[]>([]);

  const { showTour, resetTour } = useWelcomeTour();
  const isMobile = useIsMobile();
  const isWeeklyFeedbackEnabled = useIntegration('weekly_feedback');
  const isCrmExportEnabled = useIntegration('crm_export');
  const { hasPermission } = usePermissions();
  const canAssignToOthers = hasPermission('can_assign_tasks_to_others');

  // View mode hook for weekly vs daily zen view
  const { activeView, showToggle, setView, isStrict, departmentDefaultView, isLoading: isLoadingViewConfig } = useDashboardView();

  // Get configurable weekly close day from agency settings
  const weeklyCloseDay = useWeeklyCloseDay();

  const hasPendingWeeklyTasks = useMemo(() => {
    if (!myEmployeeProfile) return false;
    const today = new Date();

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

    const distributedFromTransferIds = new Set(
      weeklyFeedback
        .filter(fb => fb.allocationId && fb.comments?.includes('Tarea distribuida desde transferencia'))
        .map(fb => fb.allocationId!)
    );

    // Find open tasks (past week tasks not processed)
    const openTasks = allocations.filter(a => {
      if (a.employeeId !== myEmployeeProfile.id) return false;
      if (a.status === 'completed') return false;
      if (processedTaskIds.has(a.id)) return false;
      if (distributedFromTransferIds.has(a.id)) return false;

      // IMPORTANT: Exclude distribution child tasks - they are the result of transfer acceptance
      // and don't need Weekly review (they're new tasks, not past tasks needing action)
      if (a.transferredFromAllocationId) return false;

      try {
        const taskWeekDate = parseISO(a.weekStartDate);
        const taskWeekEnd = getWeekEndDate(taskWeekDate, weeklyCloseDay);
        return taskWeekEnd <= today && isSameMonth(taskWeekDate, currentMonth);
      } catch {
        return false;
      }
    });

    // Find transferred tasks not yet processed
    // NOTE: Tasks with `transferredFromAllocationId` are the RESULT of a distribution/transfer acceptance
    // and should NOT trigger the weekly badge. They are new tasks, not pending actions.
    // Only legacy transfers with '(transferida de' in the name need processing.
    const transferredTasks = allocations.filter(a => {
      if (a.employeeId !== myEmployeeProfile.id) return false;
      if (a.status === 'completed') return false;
      if (processedTaskIds.has(a.id)) return false;
      if (distributedFromTransferIds.has(a.id)) return false;

      // IMPORTANT: Exclude tasks that are the result of distribution (these are already "processed")
      // They have transferredFromAllocationId set because they came from a distribution
      if (a.transferredFromAllocationId) return false;

      // Only legacy transfers with '(transferida de' in name need Weekly review
      const isLegacyTransfer = a.taskName?.includes('(transferida de');
      if (!isLegacyTransfer) return false;

      try {
        const taskWeekDate = parseISO(a.weekStartDate);
        return isSameMonth(taskWeekDate, currentMonth);
      } catch {
        return false;
      }
    });

    const hasOpenTasks = openTasks.length > 0;
    const hasTransferredTasks = transferredTasks.length > 0;

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

  const { getProjectBudgetStatus } = useAllocationSheet(myEmployeeProfile?.id || '', currentMonth);

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
    // Prevenir múltiples ejecuciones simultáneas
    if (isSavingExtraTask || isCreatingProject) return;

    if (!myEmployeeProfile) return;
    if (!extraTaskName.trim()) { toast.error("Escribe un nombre para la tarea"); return; }
    const hours = Number(extraHours);
    if (isNaN(hours) || hours <= 0) { toast.error("Las horas deben ser mayores a 0"); return; }

    setIsSavingExtraTask(true);
    try {
      const projectId = await getOrCreateInternalProject();
      if (!projectId) { toast.error("No se pudo obtener el proyecto interno"); return; }
      const today = new Date();
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
      toast.error((error as Error)?.message || 'Error al registrar la tarea');
    } finally {
      setIsSavingExtraTask(false);
    }
  };

  const openAddTasksDialog = () => {
    const defaultWeek = weeks[0]?.weekStart ? format(weeks[0].weekStart, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
    setNewTasks([{
      id: crypto.randomUUID(),
      projectId: '',
      taskName: '',
      hours: '',
      weekDate: defaultWeek,
      dependencyId: 'none',
      employeeId: canAssignToOthers ? undefined : myEmployeeProfile?.id // Si no puede asignar a otros, usar su propio ID
    }]);
    setIsAddingTasks(true);
  };

  const addTaskRow = () => {
    const lastTask = newTasks[newTasks.length - 1];
    const defaultWeek = lastTask?.weekDate || (weeks[0]?.weekStart ? format(weeks[0].weekStart, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
    setNewTasks(prev => [...prev, {
      id: crypto.randomUUID(),
      projectId: lastTask?.projectId || '',
      taskName: '',
      hours: '',
      weekDate: defaultWeek,
      dependencyId: 'none',
      employeeId: canAssignToOthers ? undefined : myEmployeeProfile?.id // Si no puede asignar a otros, usar su propio ID
    }]);
  };

  const removeTaskRow = (id: string) => {
    if (newTasks.length === 1) return;
    setNewTasks(prev => prev.filter(t => t.id !== id));
  };

  const updateTaskRow = (id: string, field: keyof NewTaskRow, value: string) => {
    setNewTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleSaveTasks = async () => {
    // Prevenir múltiples ejecuciones simultáneas
    if (isSavingTasks) return;

    if (!myEmployeeProfile) return;
    const validTasks = newTasks.filter(t => t.projectId && t.taskName.trim() && parseFloat(t.hours) > 0);
    if (validTasks.length === 0) { toast.error("Añade al menos una tarea válida"); return; }

    setIsSavingTasks(true);
    try {
      for (const task of validTasks) {
        // Usar el employeeId de la tarea si existe, sino usar el del empleado actual
        const targetEmployeeId = task.employeeId || myEmployeeProfile.id;
        await addAllocation({
          projectId: task.projectId,
          employeeId: targetEmployeeId,
          weekStartDate: task.weekDate,
          hoursAssigned: parseFloat(task.hours),
          taskName: task.taskName,
          status: 'planned'
        });
      }
      toast.success(`${validTasks.length} tarea(s) añadida(s)`);
      setIsAddingTasks(false);
      setNewTasks([]);
    } catch (error) {
      console.error('Error guardando tareas:', error);
      toast.error('Error al guardar las tareas');
    } finally {
      setIsSavingTasks(false);
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

    const csvRows: string[] = [];
    monthAllocations.forEach(alloc => {
      const project = projects.find(p => p.id === alloc.projectId);
      const taskName = (alloc.taskName || 'Tarea').replace(/"/g, '""');
      const hoursStr = alloc.hoursAssigned ? alloc.hoursAssigned.toString() : '';
      const csvLine = [
        `"${taskName}"`,
        myEmployeeProfile.crmUserId,
        'project',
        project?.externalId || '',
        hoursStr
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

  const handlePrevMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  const handleToday = () => setCurrentMonth(new Date());

  const getAvailableDependencies = (projectId: string, currentTaskId?: string) => {
    if (!projectId) return [];
    return allocations.filter(a =>
      a.projectId === projectId &&
      a.id !== currentTaskId &&
      a.status !== 'completed' &&
      isAllocationInEffectiveMonth(a.weekStartDate, currentMonth)
    );
  };

  const { tasksImpact, getWeekExceedStatus, getProjectExceedStatus } = useTasksImpact({
    newTasks,
    projects,
    weeks,
    employeeId: myEmployeeProfile?.id || '',
    getEmployeeLoadForWeek,
    getProjectBudgetStatus,
    viewMonth: currentMonth
  });

  // Cargar deadlines del mes (filtrados por agencia)
  const loadDeadlinesForMonth = useCallback(async (month: Date) => {
    const monthKey = format(startOfMonth(month), 'yyyy-MM');
    try {
      const { data, error } = await fetchDeadlinesForMonth(monthKey, currentAgency?.id);
      if (error) throw error;
      setDeadlines(data ?? []);
    } catch (error) {
      console.error('Error cargando deadlines:', error);
      setDeadlines([]);
    }
  }, [currentAgency?.id]);

  useEffect(() => {
    loadDeadlinesForMonth(currentMonth);
  }, [currentMonth, loadDeadlinesForMonth]);

  // Cargar deadlines cuando se abre el diálogo de añadir tareas y sincronizar
  useEffect(() => {
    if (isAddingTasks) {
      loadDeadlinesForMonth(currentMonth);
    }
  }, [isAddingTasks, currentMonth, loadDeadlinesForMonth]);

  // Sincronizar deadlines del diálogo cuando se actualizan
  useEffect(() => {
    if (isAddingTasks) {
      setDialogDeadlines(deadlines);
    } else {
      setDialogDeadlines([]);
    }
  }, [isAddingTasks, deadlines]);

  // Load data for current month using centralized ensureMonthLoaded
  useEffect(() => {
    if (!isGlobalLoading && !isLoadingProfile) {
      setIsLoadingMonth(true);
      ensureMonthLoaded(currentMonth)
        .finally(() => setIsLoadingMonth(false));
    }
  }, [currentMonth, isGlobalLoading, isLoadingProfile, ensureMonthLoaded]);

  if (isGlobalLoading || isLoadingProfile || isLoadingViewConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin opacity-60" />
        </div>
      </div>
    );
  }

  if (isLoadingMonth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400">Cargando tareas...</div>
      </div>
    );
  }

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

  const gridTemplate = `${isMobile ? '100px' : '180px'} repeat(${weeks.length}, minmax(0, 1fr)) 90px`;
  const monthlyLoad = getEmployeeMonthlyLoad(myEmployeeProfile.id, currentMonth.getFullYear(), currentMonth.getMonth());

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-primary/5 via-white to-primary/5 opacity-50" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_50%,rgba(var(--primary-rgb),0.1),transparent_50%)]" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_80%_80%,rgba(var(--primary-rgb),0.1),transparent_50%)]" />

      {/* 0. PANEL DE TRANSFERENCIAS PENDIENTES */}
      <PendingTransfersPanel />

      {/* 1. CABECERA UNIFICADA DE ACCIONES */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex gap-2 flex-wrap flex-1">
          {/* Action: WEEKLY */}
          {isWeeklyFeedbackEnabled && (
            <Button
              onClick={() => setShowWeeklyDialog(true)}
              className={cn(
                "gap-2 shadow-sm transition-all",
                hasPendingWeeklyTasks
                  ? "bg-amber-600 text-white hover:bg-amber-700 animate-pulse shadow-lg shadow-amber-500/50"
                  : "bg-primary text-white hover:bg-primary/90"
              )}
              data-tour="weekly-button"
            >
              {hasPendingWeeklyTasks ? <AlertCircle className="h-4 w-4 animate-bounce" /> : <CheckSquare className="h-4 w-4" />}
              Weekly
            </Button>
          )}

          {/* Action: AÑADIR TAREAS */}
          <Button onClick={openAddTasksDialog} className="gap-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm" data-tour="add-tasks">
            <ListPlus className="h-4 w-4 text-primary" /> Añadir tareas
          </Button>

          {/* Action: INTERNAL TASK */}
          <Button onClick={() => setIsAddingExtra(true)} className="gap-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm" data-tour="internal-tasks">
            <Clock className="h-4 w-4 text-slate-600" /> Tarea interna
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle or Indicator */}
          {showToggle ? (
            <ViewToggle
              value={activeView}
              onChange={setView}
            />
          ) : (
            <ViewModeIndicator
              isStrict={isStrict}
              departmentView={departmentDefaultView}
            />
          )}

          {/* Dropdown de Acciones Secundarias */}
          <DropdownMenu open={actionsDropdownOpen} onOpenChange={setActionsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 border-slate-200" data-tour="actions-dropdown">
                <MoreHorizontal className="h-4 w-4" /> <span className="hidden sm:inline">Acciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {isCrmExportEnabled && (
                <DropdownMenuItem onClick={handleExportCRM} disabled={!myEmployeeProfile?.crmUserId} className="gap-2" data-tour="crm-export">
                  <FileDown className="h-4 w-4 text-purple-600" /> Exportar a CRM
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowGoals(true)} className="gap-2" data-tour="goals">
                <TrendingUp className="h-4 w-4 text-emerald-600" /> Mis Objetivos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowAbsences(true)} className="gap-2" data-tour="absences">
                <Calendar className="h-4 w-4 text-amber-600" /> Mis Ausencias
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={resetTour} className="gap-2">
                <RotateCcw className="h-4 w-4" /> Repetir Tour
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <EmployeeSettings employeeId={myEmployeeProfile.id} />
        </div>
      </div>

      {/* CONTENT BASED ON VIEW MODE */}
      {activeView === 'daily' ? (
        /* DAILY ZEN MODE - Minimalist focused view */
        <DailyZenDashboard employeeId={myEmployeeProfile.id} viewDate={currentMonth} />
      ) : (
        /* WEEKLY MODE - Full planning view */
        <>
          {/* 2. CONTROL MES */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/60 p-3 rounded-lg border border-slate-200 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold capitalize text-slate-800 flex items-center gap-2">
                {getMonthName(currentMonth)}
                <Badge variant="secondary" className="font-normal text-slate-500 bg-slate-100">{currentMonth.getFullYear()}</Badge>
              </h2>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrevMonth}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" onClick={handleToday} className="h-7 text-xs px-2">Hoy</Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNextMonth}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>

          {/* 3. CALENDARIO - VISUAL RESUMEN */}
          <Card className="border-indigo-100 shadow-sm overflow-hidden" data-tour="calendar">
            <div className="overflow-x-auto custom-scrollbar w-full">
              <div className="grid bg-slate-50/50 border-b" style={{ gridTemplateColumns: gridTemplate }}>
                <div className="px-4 py-3 font-bold text-sm text-slate-700 flex items-center border-r sticky left-0 z-20 bg-slate-50">Calendario</div>
                {weeks.map((week, index) => {
                  const effectiveStart = week.effectiveStart || week.weekStart;
                  const effectiveEnd = week.effectiveEnd || addDays(week.weekStart, 6);
                  const workingDays = [];
                  let currentDay = new Date(effectiveStart);
                  while (currentDay <= effectiveEnd) {
                    const dayOfWeek = currentDay.getDay();
                    if (dayOfWeek >= 1 && dayOfWeek <= 5) workingDays.push(new Date(currentDay));
                    currentDay = addDays(currentDay, 1);
                  }
                  const firstWorkingDay = workingDays[0];
                  const lastWorkingDay = workingDays[workingDays.length - 1];
                  const weekDateLabel = firstWorkingDay && lastWorkingDay
                    ? `${format(firstWorkingDay, 'd', { locale: es })}-${format(lastWorkingDay, 'd MMM', { locale: es })}`
                    : `${format(effectiveStart, 'd', { locale: es })}-${format(effectiveEnd, 'd MMM', { locale: es })}`;

                  return (
                    <div key={week.weekStart.toISOString()} className="text-center px-1 py-2 border-r flex flex-col justify-center">
                      <span className="text-xs font-bold uppercase text-slate-500">S{index + 1}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{weekDateLabel}</span>
                    </div>
                  );
                })}
                <div className="px-2 py-3 font-bold text-xs text-center flex items-center justify-center">TOTAL</div>
              </div>

              <div className="grid bg-white" style={{ gridTemplateColumns: gridTemplate }}>
                <EmployeeRow employee={myEmployeeProfile} weeks={weeks} projects={projects} allocations={allocations} absences={absences} teamEvents={teamEvents} viewDate={currentMonth} onOpenSheet={(empId, date) => setSelectedCell({ employeeId: empId, weekStart: date })} />
                <div className="flex items-center justify-center border-l p-2 bg-white">
                  <div className="flex flex-col items-center">
                    <span className="text-lg font-bold text-slate-800">{monthlyLoad.hours}h</span>
                    <span className="text-[10px] text-slate-400 font-medium">/ {monthlyLoad.capacity}h</span>
                    <span className={cn(
                      "text-[10px] font-bold mt-1 px-1.5 rounded-full",
                      monthlyLoad.status === 'overload' ? "text-red-600 bg-red-50" :
                        monthlyLoad.status === 'warning' ? "text-amber-600 bg-amber-50" :
                          monthlyLoad.status === 'healthy' ? "text-emerald-600 bg-emerald-50" :
                            "text-slate-400 bg-slate-50"
                    )}>{monthlyLoad.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 4. VISTA DETALLADA POR PESTAÑAS */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start h-auto p-1 bg-white border border-slate-200 flex-nowrap overflow-x-auto custom-scrollbar gap-2">
              <TabsTrigger value="dependencies" className="px-4 py-2 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700">
                <AlertCircle className="h-4 w-4 mr-2" /> Prioridades
              </TabsTrigger>
              <TabsTrigger value="projects" className="px-4 py-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                <ListPlus className="h-4 w-4 mr-2" /> Mis proyectos
              </TabsTrigger>
              <TabsTrigger value="coherence" className="px-4 py-2 data-[state=active]:bg-red-50 data-[state=active]:text-red-700">
                <CheckCircle2 className="h-4 w-4 mr-2" /> Control de planificación
              </TabsTrigger>
              <TabsTrigger value="teammates" className="px-4 py-2">
                <div className="flex items-center gap-2">Compañeros</div>
              </TabsTrigger>
              <TabsTrigger value="metrics" className="px-4 py-2">
                <div className="flex items-center gap-2">Mis métricas</div>
              </TabsTrigger>
            </TabsList>

            <div className="mt-4">
              <TabsContent value="dependencies" className="space-y-6 focus-visible:outline-none">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <PriorityInsights employeeId={myEmployeeProfile.id} viewDate={currentMonth} />
                  <ProjectTeamPulse employeeId={myEmployeeProfile.id} viewDate={currentMonth} />
                </div>
              </TabsContent>

              <TabsContent value="projects" className="space-y-4 focus-visible:outline-none">
                <MyWeekView employeeId={myEmployeeProfile.id} viewDate={currentMonth} />
              </TabsContent>

              <TabsContent value="coherence" className="focus-visible:outline-none">
                <PlanningInconsistenciesCard employeeId={myEmployeeProfile.id} viewDate={currentMonth} isManager={isManager} />
              </TabsContent>

              <TabsContent value="teammates" className="focus-visible:outline-none">
                <CollaborationCards employeeId={myEmployeeProfile.id} viewDate={currentMonth} />
              </TabsContent>

              <TabsContent value="metrics" className="space-y-6 focus-visible:outline-none">
                <MonthlyBalanceCard employeeId={myEmployeeProfile.id} viewDate={currentMonth} />
                <ReliabilityIndexCard employeeId={myEmployeeProfile.id} viewDate={currentMonth} />
              </TabsContent>
            </div>
          </Tabs>
        </>
      )}

      {/* MODALES Y DIÁLOGOS (Hidden UI) */}
      {selectedCell && (
        <AllocationSheet
          open={!!selectedCell}
          onOpenChange={(open) => !open && setSelectedCell(null)}
          employeeId={selectedCell.employeeId}
          weekStart={selectedCell.weekStart.toISOString()}
          viewDateContext={currentMonth}
        />
      )}

      {/* Dialogo Gestión Interna */}
      <Dialog open={isAddingExtra} onOpenChange={setIsAddingExtra}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-slate-600" />Registrar gestión interna</DialogTitle>
            <DialogDescription>Reuniones, formaciones, deadlines u otras tareas.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input placeholder="Ej: Reunión de equipo" value={extraTaskName} onChange={e => setExtraTaskName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Horas</Label>
              <Input type="number" min="0.5" step="0.5" value={extraHours} onChange={e => setExtraHours(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingExtra(false)}>Cancelar</Button>
            <Button onClick={handleAddExtraTask} disabled={isCreatingProject || isSavingExtraTask}>
              {(isCreatingProject || isSavingExtraTask) ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Guardando...
                </>
              ) : (
                'Registrar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo Añadir Tareas (Bulk) */}
      <Dialog open={isAddingTasks} onOpenChange={setIsAddingTasks}>
        <DialogContent className="sm:max-w-[1100px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2"><ListPlus className="h-5 w-5 text-primary" />Añadir tareas</DialogTitle>
            <DialogDescription>Planifica múltiples tareas para {getMonthName(currentMonth)}.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-1 overflow-hidden">
            {/* Left: Task Inputs */}
            <div className="flex-1 flex flex-col p-6 overflow-hidden border-r bg-white w-2/3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-sm text-slate-700">Listado de tareas</h3>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-3 pb-8">
                  {newTasks.map((task, idx) => (
                    <BatchTaskRow
                      key={task.id}
                      task={task}
                      otherTasks={newTasks}
                      updateTaskRow={updateTaskRow}
                      removeTaskRow={removeTaskRow}
                      canRemove={newTasks.length > 1}
                      activeProjects={activeProjects}
                      weeks={weeks}
                      employees={employees}
                      clients={clients}
                      getProjectBudgetStatus={getProjectBudgetStatus}
                      getAvailableDependencies={getAvailableDependencies}
                      getWeekExceedStatus={getWeekExceedStatus}
                      canAssignToOthers={canAssignToOthers}
                      currentEmployeeId={myEmployeeProfile?.id}
                      deadlines={deadlines}
                      allocations={allocations}
                      viewDate={currentMonth}
                    />
                  ))}
                  <div id="task-list-end" />
                  <Button variant="outline" size="sm" onClick={() => {
                    addTaskRow();
                    setTimeout(() => {
                      const el = document.getElementById('task-list-end');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }} className="w-full border-dashed h-9 text-slate-500 hover:text-primary hover:border-primary/50">
                    <Plus className="h-4 w-4 mr-2" /> Añadir otra fila
                  </Button>
                </div>
              </div>
            </div>

            {/* Right: Impact Summary (Fixed Sidebar) */}
            <div className="w-1/3 bg-slate-50 border-l p-6 overflow-y-auto custom-scrollbar">
              <ProjectImpactSummary
                variant="vertical"
                newTasks={newTasks}
                projects={projects}
                allocations={allocations}
                viewDate={currentMonth}
                getProjectBudgetStatus={getProjectBudgetStatus}
                getEmployeeLoadForWeek={getEmployeeLoadForWeek}
                employeeId={myEmployeeProfile?.id || ''}
                weeks={weeks}
                deadlines={dialogDeadlines}
                employees={employees}
              />
            </div>
          </div>

          <DialogFooter className="py-4 px-6 border-t bg-slate-50/50 shrink-0">
            <div className="flex items-center gap-2 text-xs text-slate-500 mr-auto">
              {newTasks.filter(t => !t.projectId || !t.taskName || !t.hours).length > 0 && (
                <span className="text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Completa los campos obligatorios
                </span>
              )}
            </div>
            <Button variant="outline" onClick={() => setIsAddingTasks(false)} disabled={isSavingTasks}>Cancelar</Button>
            <Button onClick={handleSaveTasks} disabled={isSavingTasks}>
              {isSavingTasks ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Guardando...
                </>
              ) : (
                'Guardar tareas'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showGoals && <ProfessionalGoalsSheet open={showGoals} onOpenChange={setShowGoals} employeeId={myEmployeeProfile.id} />}
      {showAbsences && <AbsencesSheet open={showAbsences} onOpenChange={setShowAbsences} employeeId={myEmployeeProfile.id} />}
      {myEmployeeProfile && isWeeklyFeedbackEnabled && (
        <WeeklyReportDialog open={showWeeklyDialog} onOpenChange={setShowWeeklyDialog} employeeId={myEmployeeProfile.id} viewDate={currentMonth} />
      )}
      <WelcomeTour
        forceShow={showTour}
        onTabChange={setActiveTab}
        onDropdownOpen={(dropdownId, isOpen) => {
          if (dropdownId === 'actions-dropdown') {
            setActionsDropdownOpen(isOpen);
          }
        }}
      />
    </div >
  );
}
