import { useMemo, useState, useCallback, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAgency } from '@/contexts/AgencyContext';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useDateLocale } from '@/hooks/useDateLocale';
import { useProjectAliasing } from '@/hooks/useProjectAliasing';
import { TaskTimer } from '@/components/employee/TaskTimer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, Sun, Calendar, ChevronUp, ChevronDown, Search, X, ArrowRight, Undo2, ListChecks, Pencil } from 'lucide-react';
import { CoherenceAllocationEditDialog } from '@/components/employee/CoherenceAllocationEditDialog';
import { format, isSameWeek, startOfWeek, getDay, startOfDay, startOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Allocation } from '@/types';
import { parseDateStringLocal } from '@/utils/dateUtils';
import { supabase } from '@/lib/supabase';
import { round2 } from '@/utils/numbers';
import { TaskNotesTrigger } from '@/components/planner/allocation/TaskNotesTrigger';
import { useAllocationNoteCounts } from '@/hooks/useAllocationNotes';
import { searchAllocationIdsByNoteBody } from '@/services/allocationNotesService';
import { toast } from '@/lib/notify';

export interface MyDayViewProps {
  employeeId: string;
  /** Mes de contexto para precarga de allocations (además del mes actual). */
  viewDate: Date;
  /** Módulo Weekly activo: acceso al mismo modal que el planificador (posponer, distribuir, etc.). */
  weeklyEnabled?: boolean;
  /** Abre `WeeklyReportDialog` centrado en esta allocation (mismo flujo que «Opciones Weekly…» en el planner). */
  onOpenWeeklyForAllocation?: (allocationId: string) => void;
  /** Vacío en Mi día: ir al planificador, Mi semana o añadir tareas (lo define el dashboard). */
  onOpenPlanning?: () => void;
}

function sortByUserPriority(a: Allocation, b: Allocation): number {
  return (a.userPriority ?? 999) - (b.userPriority ?? 999);
}

/** Tareas de la semana en curso o de semanas anteriores no completadas (mismo criterio que la vista anterior). */
function isInWeeklyOrPastScope(taskWeekStartStr: string, today: Date): boolean {
  const taskDate = parseDateStringLocal(taskWeekStartStr);
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  return isSameWeek(taskDate, today, { weekStartsOn: 1 }) || taskDate < weekStart;
}

export function MyDayView({
  employeeId,
  viewDate,
  weeklyEnabled = false,
  onOpenWeeklyForAllocation,
  onOpenPlanning,
}: MyDayViewProps) {
  const { t } = useAppTranslation();
  const dateLocale = useDateLocale();
  const { projects, clients, updateAllocation, allocations, loadDataForMonth, ensureMonthLoaded, currentUser } = useApp();
  const { currentAgency } = useAgency();
  const { formatName: formatProjectName } = useProjectAliasing();
  const isTimeTrackerEnabled = (currentAgency?.settings?.modules?.timeTracker ?? false) && currentUser?.user_id != null;
  const preference = currentAgency?.settings?.hoursTrackingPreference;
  const [completedToday, setCompletedToday] = useState<string[]>([]);
  const [popoverOpenId, setPopoverOpenId] = useState<string | null>(null);
  const [completionData, setCompletionData] = useState({ actual: 0, computed: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [noteSearchHits, setNoteSearchHits] = useState<Set<string>>(new Set());
  const [editingTask, setEditingTask] = useState<Allocation | null>(null);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const today = useMemo(() => startOfDay(new Date(`${todayKey}T12:00:00`)), [todayKey]);
  const todayStr = todayKey;

  useEffect(() => {
    void ensureMonthLoaded(startOfMonth(viewDate));
    const nowMonth = startOfMonth(new Date());
    if (format(nowMonth, 'yyyy-MM') !== format(startOfMonth(viewDate), 'yyyy-MM')) {
      void ensureMonthLoaded(nowMonth);
    }
  }, [ensureMonthLoaded, viewDate]);

  /** Pool acotado para búsqueda en notas (misma semana / backlog, sin filtro de texto). */
  const candidateAllocationIds = useMemo(
    () =>
      (allocations || [])
        .filter(
          a =>
            a.employeeId === employeeId &&
            a.status !== 'completed' &&
            !completedToday.includes(a.id) &&
            isInWeeklyOrPastScope(a.weekStartDate, today)
        )
        .map(a => a.id),
    [allocations, employeeId, completedToday, today]
  );

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || !currentAgency?.id) {
      setNoteSearchHits(new Set());
      return;
    }
    let cancelled = false;
    void searchAllocationIdsByNoteBody(candidateAllocationIds, q, currentAgency.id).then(hits => {
      if (!cancelled) setNoteSearchHits(hits);
    });
    return () => {
      cancelled = true;
    };
  }, [searchQuery, candidateAllocationIds, currentAgency?.id]);

  const dailyCapacity = useMemo(() => {
    if (currentUser?.workSchedule) {
      const schedule = currentUser.workSchedule;
      const dayIndex = getDay(today);
      const scheduleMap = [
        schedule.sunday,
        schedule.monday,
        schedule.tuesday,
        schedule.wednesday,
        schedule.thursday,
        schedule.friday,
        schedule.saturday,
      ];
      return round2(scheduleMap[dayIndex] || 0);
    }
    if (currentUser?.defaultWeeklyCapacity) {
      const dayIndex = getDay(today);
      if (dayIndex === 0 || dayIndex === 6) return 0;
      return round2(currentUser.defaultWeeklyCapacity / 5);
    }
    return 8;
  }, [currentUser, today]);

  const { focusTasks, backlogTasks, sortedBacklog } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const candidates = (allocations || []).filter(a => {
      if (a.employeeId !== employeeId) return false;
      if (a.status === 'completed') return false;
      if (completedToday.includes(a.id)) return false;
      if (!isInWeeklyOrPastScope(a.weekStartDate, today)) return false;
      if (q) {
        const proj = projects.find(p => p.id === a.projectId);
        const text = `${a.taskName ?? ''} ${formatProjectName(proj?.name ?? '')}`.toLowerCase();
        if (!text.includes(q) && !noteSearchHits.has(a.id)) return false;
      }
      return true;
    });

    const focus = candidates.filter(a => a.focusDate === todayStr).sort(sortByUserPriority);
    const backlog = candidates.filter(a => a.focusDate !== todayStr);
    const sorted = [...backlog].sort(sortByUserPriority);
    return { focusTasks: focus, backlogTasks: backlog, sortedBacklog: sorted };
  }, [allocations, employeeId, today, todayStr, completedToday, searchQuery, projects, formatProjectName, noteSearchHits]);

  const visibleAllocationIds = useMemo(
    () => [...focusTasks, ...sortedBacklog].map(task => task.id),
    [focusTasks, sortedBacklog]
  );
  const { data: noteCounts = {} } = useAllocationNoteCounts(visibleAllocationIds);

  const handleTimeLogged = useCallback(() => {
    void loadDataForMonth(today);
  }, [loadDataForMonth, today]);

  const togglePin = useCallback(
    async (alloc: Allocation) => {
      const next = alloc.focusDate === todayStr ? null : todayStr;
      await updateAllocation({ id: alloc.id, focusDate: next });
    },
    [todayStr, updateAllocation]
  );

  const ensureFocusForTimer = useCallback(
    async (alloc: Allocation) => {
      if (alloc.focusDate === todayStr) return;
      await updateAllocation({ id: alloc.id, focusDate: todayStr });
    },
    [todayStr, updateAllocation]
  );

  const moveInBacklog = useCallback(
    async (alloc: Allocation, direction: 'up' | 'down') => {
      const sorted = sortedBacklog;
      const idx = sorted.findIndex(t => t.id === alloc.id);
      if (idx < 0) return;
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return;
      const other = sorted[swapIdx];
      const pA = alloc.userPriority ?? idx + 1;
      const pB = other.userPriority ?? swapIdx + 1;
      await updateAllocation({ id: alloc.id, userPriority: pB });
      await updateAllocation({ id: other.id, userPriority: pA });
    },
    [sortedBacklog, updateAllocation]
  );

  const handleCompleteSubmit = async (allocation: Allocation) => {
    let flushHappened = false;
    let flushHoursForFallback: number | null = null;

    if (isTimeTrackerEnabled && currentUser?.id === allocation.employeeId) {
      const { data: active } = await supabase
        .from('active_timers')
        .select('started_at, allocation_id')
        .eq('employee_id', allocation.employeeId)
        .maybeSingle();
      if (active?.started_at && active.allocation_id === allocation.id) {
        let secondsToLog = Math.max(0, Math.floor((Date.now() - new Date(active.started_at).getTime()) / 1000));
        if (secondsToLog < 1) secondsToLog = 1;
        const hoursToLog = Number((secondsToLog / 3600).toFixed(6));
        flushHoursForFallback = hoursToLog;
        const pDate = new Date().toISOString().split('T')[0];
        const { error } = await supabase.rpc('log_timer_hours', {
          p_employee_id: allocation.employeeId,
          p_allocation_id: allocation.id,
          p_hours: hoursToLog,
          p_notes: null,
          p_date: pDate,
        });
        if (error) {
          toast.error(t('employeeDashboard.myDay.timerStopError'));
          return;
        }
        flushHappened = true;
        window.dispatchEvent(new CustomEvent('timeboxing_timer_stopped'));
        new BroadcastChannel('timer_sync').postMessage('update');
      }
    }

    const assigned = allocation.hoursAssigned;
    let nextActual = completionData.actual;
    let nextComputed = completionData.computed;

    if (isTimeTrackerEnabled) {
      const { data: fresh } = await supabase
        .from('allocations')
        .select('hours_actual')
        .eq('id', allocation.id)
        .maybeSingle();
      const rawA = fresh?.hours_actual != null ? Number(fresh.hours_actual) : 0;
      const roundedA = round2(rawA);
      const dbActual = rawA > 0 && roundedA === 0 ? rawA : roundedA;
      if (rawA > 0) {
        nextActual = dbActual;
        nextComputed = preference === 'actual' ? nextActual : assigned;
      } else if (flushHappened && flushHoursForFallback != null) {
        nextActual = round2((allocation.hoursActual ?? 0) + flushHoursForFallback);
        nextComputed = preference === 'actual' ? nextActual : assigned;
      } else if (preference === 'actual') {
        nextComputed = nextActual;
      }
      if (flushHappened) void loadDataForMonth(today);
    } else if (preference === 'actual') {
      nextComputed = nextActual;
    }

    setCompletedToday(prev => [...prev, allocation.id]);
    setPopoverOpenId(null);
    await updateAllocation({
      ...allocation,
      status: 'completed',
      hoursActual: nextActual,
      hoursComputed: nextComputed,
    });
  };

  const openCompletion = (allocation: Allocation) => {
    const assigned = allocation.hoursAssigned;
    const hoursActualNum = allocation.hoursActual ?? 0;
    const preserveTracked = isTimeTrackerEnabled && hoursActualNum > 0;
    const actual = preserveTracked ? hoursActualNum : assigned;
    const computed = preference === 'actual' ? actual : assigned;
    setCompletionData({ actual, computed });
    setPopoverOpenId(allocation.id);
  };

  const renderTaskCard = (task: Allocation, options: { showReorder: boolean; isFocus: boolean }) => {
    const project = projects.find(p => p.id === task.projectId);
    const client = clients.find(c => c.id === project?.clientId);
    const isOverdue = parseDateStringLocal(task.weekStartDate) < startOfWeek(today, { weekStartsOn: 1 });
    const idxInBacklog = sortedBacklog.findIndex(t => t.id === task.id);
    const isFocused = task.focusDate === todayStr;

    return (
      <div
        key={task.id}
        className={cn(
          'rounded-xl border shadow-sm hover:shadow-md transition-all group relative',
          isFocused
            ? 'bg-white border-amber-200/60 ring-1 ring-amber-100'
            : 'bg-white/80 backdrop-blur-sm border-slate-200/60'
        )}
      >
        <div className="p-3 pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-sm text-slate-800 truncate" title={task.taskName}>
                {task.taskName || t('employeeDashboard.myDay.unnamedTask')}
              </h4>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: client?.color || '#cbd5e1' }}
                />
                <span className="text-xs text-slate-500 truncate">
                  {formatProjectName(project?.name || '')}
                </span>
                {isOverdue && (
                  <Badge variant="outline" className="h-4 px-1.5 text-[9px] border-red-200 text-red-600 bg-red-50">{t('employeeDashboard.myDay.overdue')}</Badge>
                )}
              </div>
            </div>
            {options.showReorder && (
              <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" disabled={idxInBacklog <= 0} onClick={() => void moveInBacklog(task, 'up')} aria-label={t('employeeDashboard.myDay.moveUpAria')}>
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" disabled={idxInBacklog < 0 || idxInBacklog >= sortedBacklog.length - 1} onClick={() => void moveInBacklog(task, 'down')} aria-label={t('employeeDashboard.myDay.moveDownAria')}>
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100/80 gap-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <div className={cn('flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-medium', isOverdue ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600')}>
              <Clock className="h-3 w-3 shrink-0" />
              <span>{round2(Number(task.hoursAssigned) || 0)}h</span>
            </div>
            {isTimeTrackerEnabled && currentUser && (
              <TaskTimer employeeId={currentUser.id} allocationId={task.id} onTimeLogged={handleTimeLogged} beforeStart={() => ensureFocusForTimer(task)} />
            )}
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              title={t('employeeDashboard.myDay.editTaskTitle', 'Editar tarea')}
              aria-label={t('employeeDashboard.myDay.editTaskAria', 'Editar tarea')}
              onClick={() => setEditingTask(task)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <TaskNotesTrigger allocationId={task.id} noteCount={noteCounts[task.id] ?? 0} />
            {weeklyEnabled && onOpenWeeklyForAllocation && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 rounded-full text-slate-500 hover:bg-indigo-50 hover:text-indigo-700"
                title={t('employeeDashboard.myDay.weeklyOptionsTitle')}
                aria-label={t('employeeDashboard.myDay.weeklyOptionsAria')}
                onClick={() => onOpenWeeklyForAllocation(task.id)}
              >
                <ListChecks className="h-4 w-4" />
              </Button>
            )}
          <Popover open={popoverOpenId === task.id} onOpenChange={open => { if (open) openCompletion(task); else setPopoverOpenId(null); }}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-full hover:bg-emerald-50 hover:text-emerald-600 shrink-0" title={t('employeeDashboard.myDay.completeTitle')}>
                <CheckCircle2 className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="end">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">{t('employeeDashboard.myDay.completeTask')}</h4>
                <div className={cn('grid gap-2', preference === 'actual' ? 'grid-cols-1' : 'grid-cols-2')}>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">{t('employeeDashboard.myDay.actualHours')}</Label>
                    <Input
                      type="number"
                      className="h-7 text-xs"
                      value={completionData.actual}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        setCompletionData(p => ({
                          ...p,
                          actual: val,
                          ...(preference === 'actual' ? { computed: val } : {}),
                        }));
                      }}
                    />
                  </div>
                  {preference !== 'actual' && (
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">{t('employeeDashboard.myDay.computedHours')}</Label>
                      <Input type="number" className="h-7 text-xs" value={completionData.computed} onChange={e => setCompletionData(p => ({ ...p, computed: parseFloat(e.target.value) || 0 }))} />
                    </div>
                  )}
                </div>
                <Button size="sm" className="w-full text-xs h-7" onClick={() => void handleCompleteSubmit(task)}>{t('employeeDashboard.myDay.confirm')}</Button>
              </div>
            </PopoverContent>
          </Popover>
          </div>
        </div>

        {!isFocused && (
          <button
            type="button"
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50/60 hover:bg-amber-100/80 border-t border-amber-100/60 rounded-b-xl transition-colors"
            onClick={() => void togglePin(task)}
          >
            <Sun className="h-3.5 w-3.5" />
            {t('employeeDashboard.myDay.addToMyDay')}
          </button>
        )}
        {isFocused && (
          <button
            type="button"
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] text-slate-400 hover:text-slate-600 hover:bg-slate-50 border-t border-slate-100/60 rounded-b-xl transition-colors"
            onClick={() => void togglePin(task)}
          >
            <Undo2 className="h-3 w-3" />
            {t('employeeDashboard.myDay.returnToBacklog')}
          </button>
        )}
      </div>
    );
  };

  const totalFocusHours = useMemo(
    () => round2(focusTasks.reduce((s, t) => s + (Number(t.hoursAssigned) || 0), 0)),
    [focusTasks]
  );

  const allEmpty = focusTasks.length === 0 && backlogTasks.length === 0 && !searchQuery;

  if (allEmpty) {
    return (
      <Card className="bg-gradient-to-r from-slate-50 to-white border-slate-200 mb-6 shadow-sm overflow-hidden relative">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center relative z-10">
          <div className="bg-amber-100 p-3 rounded-full mb-3">
            <Sun className="h-6 w-6 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">
            {t('team.dashboard.myDayEmptyTitle', 'Sin tareas en tu semana')}
          </h3>
          <p className="text-slate-500 max-w-md mt-1 mb-4">
            {t(
              'team.dashboard.myDayEmptyDesc',
              'Cuando tengas asignaciones para esta semana o anteriores pendientes, aparecerán aquí.'
            )}
          </p>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => onOpenPlanning?.()}
            disabled={!onOpenPlanning}
          >
            <Calendar className="h-4 w-4" />
            {t('team.dashboard.viewPlanning', 'Ver planificación')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5 mb-6">
      {/* Greeting + summary bar */}
      <Card className="bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/40 border-blue-100/60 shadow-sm overflow-hidden relative">
        <div className="absolute -top-8 -right-8 opacity-[0.06] pointer-events-none">
          <Sun className="h-40 w-40 text-blue-600" />
        </div>
        <CardContent className="pt-5 pb-4 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {t('employeeDashboard.myDay.greeting', {
                  name: currentUser?.name?.split(' ')[0] ?? t('employeeDashboard.myDay.greetingFallback'),
                })}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {format(today, t('employeeDashboard.myDay.dateFormat'), { locale: dateLocale })}
                <span className="mx-1.5 text-slate-300">·</span>
                {t('employeeDashboard.myDay.workday')}{' '}
                <span className="font-semibold text-slate-700">{dailyCapacity}h</span>
                <span className="mx-1.5 text-slate-300">·</span>
                {t('employeeDashboard.myDay.inFocus')}{' '}
                <span className="font-semibold text-amber-700">{totalFocusHours}h</span>
              </p>
            </div>
            <div className="relative max-w-xs w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <Input
                placeholder={t('employeeDashboard.myDay.searchPlaceholder')}
                className="h-8 pl-8 pr-8 text-sm bg-white/80 border-slate-200"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setSearchQuery('')}>
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {focusTasks.length > 4 && (
        <Alert className="border-amber-200 bg-amber-50/80">
          <AlertDescription className="text-amber-900 text-sm">
            {t('employeeDashboard.myDay.tooManyFocus')}
          </AlertDescription>
        </Alert>
      )}

      {/* En foco hoy */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-0.5">
          <Sun className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{t('employeeDashboard.myDay.focusToday')}</h3>
          {focusTasks.length > 0 && (
            <Badge variant="secondary" className="h-5 text-[10px] bg-amber-100 text-amber-700 border-amber-200">
              {focusTasks.length}
            </Badge>
          )}
        </div>
        {focusTasks.length === 0 ? (
          <Card className="border-dashed border-slate-200 bg-slate-50/50">
            <CardContent className="py-6 text-center">
              <p className="text-sm text-slate-500">
                {searchQuery ? t('employeeDashboard.myDay.noFocusSearch') : t('employeeDashboard.myDay.noFocusEmpty')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {focusTasks.map(task => renderTaskCard(task, { showReorder: false, isFocus: true }))}
          </div>
        )}
      </div>

      {/* Backlog semanal */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-0.5">
          <ArrowRight className="h-4 w-4 text-slate-400" />
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{t('employeeDashboard.myDay.weeklyBacklog')}</h3>
          {backlogTasks.length > 0 && (
            <Badge variant="secondary" className="h-5 text-[10px]">
              {backlogTasks.length}
            </Badge>
          )}
        </div>
        {backlogTasks.length === 0 ? (
          <Card className="border-dashed border-slate-200 bg-slate-50/50">
            <CardContent className="py-4 text-center">
              <p className="text-sm text-slate-500">
                {searchQuery ? t('employeeDashboard.myDay.noBacklogSearch') : t('employeeDashboard.myDay.noBacklogEmpty')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedBacklog.map(task => renderTaskCard(task, { showReorder: true, isFocus: false }))}
          </div>
        )}
      </div>

      {editingTask ? (
        <CoherenceAllocationEditDialog
          key={editingTask.id}
          allocation={editingTask}
          viewDate={viewDate}
          deadlines={[]}
          onDismiss={() => setEditingTask(null)}
        />
      ) : null}
    </div>
  );
}
