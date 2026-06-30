import { useMemo, useState, memo, useEffect, useCallback } from 'react';
import { useAppOrDemo } from '@/hooks/useAppOrDemo';
import { useAgency } from '@/contexts/AgencyContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format } from 'date-fns';
import { AppTrans, useAppTranslation } from '@/hooks/useAppTranslation';
import { useDateLocale } from '@/hooks/useDateLocale';
import {
  Sparkles,
  CheckCircle2, Clock, Search, Pencil, ListTodo, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectAliasing } from '@/hooks/useProjectAliasing';
import { Allocation, Deadline, AgencySettings } from '@/types';
import { fetchDeadlinesForMonth } from '@/utils/deadlineUtils';
import { getEffectiveCompletedHours, getPlanningDeltaHours } from '@/utils/hoursTracking';
import { formatTaskWeekCalendarSpan, isAllocationInEffectiveMonth } from '@/utils/dateUtils';
import { SensitiveText } from '@/components/privacy/SensitiveText';
import { CoherenceAllocationEditDialog } from '@/components/employee/CoherenceAllocationEditDialog';

interface MyWeekViewProps {
  employeeId: string;
  viewDate: Date;
}

type TaskStatusFilter = 'all' | 'pending' | 'completed';

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

export const MyWeekView = memo(function MyWeekView({ employeeId, viewDate }: MyWeekViewProps) {
  const { t } = useAppTranslation();
  const dateLocale = useDateLocale();
  const { allocations, projects, clients, getEmployeeMonthlyLoad } = useAppOrDemo();
  const { currentAgency } = useAgency();
  const { formatName: formatProjectName } = useProjectAliasing();

  const [projectsSearchQuery, setProjectsSearchQuery] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState<TaskStatusFilter>('all');
  const [expandedProjectIds, setExpandedProjectIds] = useState<Set<string>>(() => new Set());
  const [editingTask, setEditingTask] = useState<Allocation | null>(null);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);

  const preference = currentAgency?.settings?.hoursTrackingPreference;
  const showComputedHours = preference !== 'actual';
  const monthKey = format(viewDate, 'yyyy-MM');

  useEffect(() => {
    const loadDeadlines = async () => {
      try {
        const { data, error } = await fetchDeadlinesForMonth(monthKey, currentAgency?.id);
        if (error) throw error;
        setDeadlines(data ?? []);
      } catch (error) {
        console.error('Error cargando deadlines en MyWeekView:', error);
      }
    };
    loadDeadlines();
  }, [monthKey, currentAgency?.id]);

  const monthLabel = format(viewDate, 'MMMM yyyy', { locale: dateLocale });

  // Allocations del mes para este empleado
  const monthlyAllocations = allocations.filter(a =>
    a.employeeId === employeeId &&
    isAllocationInEffectiveMonth(a.weekStartDate, viewDate) &&
    !(a.isLocked && round2(Number(a.hoursAssigned)) === 0)
  );

  const tasksByProjectId = useMemo(() => {
    const map = new Map<string, Allocation[]>();
    monthlyAllocations.forEach((alloc) => {
      const list = map.get(alloc.projectId) ?? [];
      list.push(alloc);
      map.set(alloc.projectId, list);
    });
    return map;
  }, [monthlyAllocations]);

  const filterTasksByStatus = useCallback((tasks: Allocation[]) => {
    if (taskStatusFilter === 'pending') return tasks.filter(a => a.status !== 'completed');
    if (taskStatusFilter === 'completed') return tasks.filter(a => a.status === 'completed');
    return tasks;
  }, [taskStatusFilter]);

  const toggleProjectExpanded = useCallback((projectId: string) => {
    setExpandedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }, []);

  // Métricas globales del mes
  const monthlyStats = useMemo(() => {
    const load = getEmployeeMonthlyLoad(employeeId, viewDate.getFullYear(), viewDate.getMonth());

    const completed = monthlyAllocations.filter(a => a.status === 'completed');
    const totalTasks = monthlyAllocations.length;
    const completedTasks = completed.length;

    const totalEstimated = monthlyAllocations.reduce((sum, a) => sum + a.hoursAssigned, 0);
    const totalReal = completed.reduce((sum, a) => sum + (a.hoursActual || 0), 0);
    const totalComputed = completed.reduce((sum, a) => sum + getEffectiveCompletedHours(a, preference), 0);

    const executionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      ...load,
      totalTasks,
      completedTasks,
      totalEstimated: round2(totalEstimated),
      totalReal: round2(totalReal),
      totalComputed: round2(totalComputed),
      executionRate: round2(executionRate)
    };
  }, [employeeId, viewDate, monthlyAllocations, getEmployeeMonthlyLoad, preference]);

  // Agrupar por proyecto con métricas de impacto y compañeros detallados
  const projectGroups = useMemo(() => {
    const groups: Record<string, {
      projectId: string;
      projectName: string;
      clientName: string;
      clientId: string;
      clientColor: string;
      myEstimated: number;
      myReal: number;
      myComputed: number;
      myTasks: number;
      myCompletedTasks: number;
      projectTotalComputed: number;
      projectBudget: number;
      projectMinimum: number;
      // Totales del proyecto (cliente)
      projectTotalAssigned: number; // Horas asignadas totales
      projectTotalPlanned: number; // Horas planificadas totales (no completadas)
      projectTotalComputedAll: number; // Horas computadas totales
      projectPercentageUsed: number; // % usado del presupuesto
      myImpactPercentage: number;
      hoursMissing: number; // Horas faltantes por asignar (si aplica)
      /** Suma de getPlanningDeltaHours en tareas completadas (misma semántica que el planificador). */
      myPlanDeltaSum: number;
    }> = {};

    // Procesar mis allocations
    monthlyAllocations.forEach(alloc => {
      if (!groups[alloc.projectId]) {
        const proj = projects.find(p => p.id === alloc.projectId);
        const cli = clients.find(c => c.id === proj?.clientId);
        const deadline = deadlines.find(d => d.projectId === alloc.projectId);
        const effectiveBudget = deadline?.budgetOverride !== undefined && deadline.budgetOverride !== null
          ? deadline.budgetOverride
          : (proj?.budgetHours || 0);

        groups[alloc.projectId] = {
          projectId: alloc.projectId,
          projectName: proj?.name || t('employeeDashboard.common.noProject'),
          clientName: cli?.name || t('employeeDashboard.common.internal'),
          clientId: cli?.id ?? `internal-${alloc.projectId}`,
          clientColor: cli?.color || '#6b7280',
          myEstimated: 0,
          myReal: 0,
          myComputed: 0,
          myTasks: 0,
          myCompletedTasks: 0,
          projectTotalComputed: 0,
          projectBudget: effectiveBudget,
          projectMinimum: proj?.minimumHours || 0,
          projectTotalAssigned: 0,
          projectTotalPlanned: 0,
          projectTotalComputedAll: 0,
          projectPercentageUsed: 0,
          myImpactPercentage: 0,
          hoursMissing: 0,
          myPlanDeltaSum: 0
        };
      }

      groups[alloc.projectId].myEstimated += alloc.hoursAssigned;
      groups[alloc.projectId].myTasks += 1;

      if (alloc.status === 'completed') {
        groups[alloc.projectId].myReal += alloc.hoursActual || 0;
        groups[alloc.projectId].myComputed += getEffectiveCompletedHours(alloc, preference);
        groups[alloc.projectId].myCompletedTasks += 1;
        groups[alloc.projectId].myPlanDeltaSum += getPlanningDeltaHours(alloc, preference) ?? 0;
      }
    });

    // Calcular totales del proyecto y compañeros con sus aportes
    Object.keys(groups).forEach(projId => {
      const allProjectAllocations = allocations.filter(a =>
        a.projectId === projId &&
        isAllocationInEffectiveMonth(a.weekStartDate, viewDate)
      );

      // Totales del proyecto (cliente)
      const projectTotalAssigned = round2(allProjectAllocations.reduce((sum, a) => sum + a.hoursAssigned, 0));
      const projectTotalPlanned = round2(allProjectAllocations
        .filter(a => a.status !== 'completed')
        .reduce((sum, a) => sum + a.hoursAssigned, 0));
      const projectTotalComputedAll = round2(allProjectAllocations
        .filter(a => a.status === 'completed')
        .reduce((sum, a) => sum + getEffectiveCompletedHours(a, preference), 0));

      groups[projId].projectTotalAssigned = projectTotalAssigned;
      groups[projId].projectTotalPlanned = projectTotalPlanned;
      groups[projId].projectTotalComputedAll = projectTotalComputedAll;

      // % usado del presupuesto
      const budget = groups[projId].projectBudget;
      groups[projId].projectPercentageUsed = budget > 0 ? round2((projectTotalComputedAll / budget) * 100) : 0;

      // Horas faltantes por asignar
      // Si tiene mínimo, solo falta si no llegamos al mínimo
      // Si no tiene mínimo, falta si no llegamos al budget
      const minimum = groups[projId].projectMinimum;

      const targetHours = minimum > 0 ? minimum : budget;

      groups[projId].hoursMissing = targetHours > 0 && projectTotalAssigned < targetHours
        ? round2(targetHours - projectTotalAssigned)
        : 0;

      // Total computado del proyecto (para mi impacto)
      const projectTotal = projectTotalComputedAll;
      groups[projId].projectTotalComputed = projectTotal;

      // Mi impacto
      if (projectTotal > 0) {
        groups[projId].myImpactPercentage = round2((groups[projId].myComputed / projectTotal) * 100);
      }
    });

    return Object.values(groups)
      .map(g => ({
        ...g,
        myEstimated: round2(g.myEstimated),
        myReal: round2(g.myReal),
        myComputed: round2(g.myComputed),
        myPlanDeltaSum: round2(g.myPlanDeltaSum)
      }))
      .sort((a, b) => b.myComputed - a.myComputed);
  }, [monthlyAllocations, allocations, projects, clients, employeeId, viewDate, preference, deadlines, t]);

  // Filtrar proyectos (texto libre + estado de tareas)
  const filteredProjects = useMemo(() => {
    const q = projectsSearchQuery.trim().toLowerCase();
    return projectGroups.filter(g => {
      const projectTasks = tasksByProjectId.get(g.projectId) ?? [];
      const visibleTasks = filterTasksByStatus(projectTasks);
      if (taskStatusFilter !== 'all' && visibleTasks.length === 0) return false;

      if (!q) return true;
      const projectLabel = formatProjectName(g.projectName).toLowerCase();
      const clientLabel = g.clientName.toLowerCase();
      const taskMatch = projectTasks.some(t => (t.taskName ?? '').toLowerCase().includes(q));
      return projectLabel.includes(q) || clientLabel.includes(q) || taskMatch;
    });
  }, [projectGroups, projectsSearchQuery, formatProjectName, tasksByProjectId, filterTasksByStatus, taskStatusFilter]);

  return (
    <TooltipProvider>
      <div className="space-y-6" data-tour="projects-summary">
        {/* Header con título, KPIs y filtros */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 capitalize flex items-center gap-2">
                {monthLabel}
              </h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <ListTodo className="h-3.5 w-3.5" /> {t('employeeDashboard.myWeek.tasksSubtitle')}
              </p>
            </div>

            {/* KPIs compactos */}
            <div className="flex items-center gap-3 flex-wrap">
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <span className="text-sm font-bold text-slate-700">~{monthlyStats.capacity}h</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>{t('employeeDashboard.myWeek.capacityTooltip')}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger>
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg",
                    monthlyStats.executionRate >= 50 ? "bg-emerald-50" : "bg-amber-50"
                  )}>
                    <CheckCircle2 className={cn("h-4 w-4", monthlyStats.executionRate >= 50 ? "text-emerald-500" : "text-amber-500")} />
                    <span className={cn("text-sm font-bold", monthlyStats.executionRate >= 50 ? "text-emerald-700" : "text-amber-700")}>
                      {monthlyStats.executionRate}%
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {t('employeeDashboard.myWeek.tasksCompletedTooltip', {
                    completed: monthlyStats.completedTasks,
                    total: monthlyStats.totalTasks,
                  })}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Búsqueda y filtros (mismo patrón que Control de planificación / coherencia global) */}
          {projectGroups.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 sm:p-4 space-y-3">
              {projectsSearchQuery.trim() && (
                <p className="text-xs text-slate-500">
                  <AppTrans
                    i18nKey="employeeDashboard.common.showingProjectsFiltered"
                    values={{ visible: filteredProjects.length, total: projectGroups.length }}
                    components={{ strong: <strong /> }}
                  />
                </p>
              )}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
                <div className="relative min-w-0 flex-1 sm:min-w-[240px] sm:max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder={t('employeeDashboard.myWeek.searchPlaceholder')}
                    value={projectsSearchQuery}
                    onChange={(e) => setProjectsSearchQuery(e.target.value)}
                    className="pl-9 h-10 w-full bg-white border-slate-200 shadow-sm"
                    aria-label={t('employeeDashboard.common.searchInProjectsAria')}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(['all', 'pending', 'completed'] as const).map((status) => (
                    <Button
                      key={status}
                      type="button"
                      variant={taskStatusFilter === status ? 'default' : 'outline'}
                      size="sm"
                      className="h-9 text-xs px-3"
                      onClick={() => setTaskStatusFilter(status)}
                    >
                      {status === 'all' && t('employeeDashboard.myWeek.taskStatusAll')}
                      {status === 'pending' && t('employeeDashboard.myWeek.taskStatusPending')}
                      {status === 'completed' && t('employeeDashboard.myWeek.taskStatusCompleted')}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Listado por proyecto */}
        {filteredProjects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-muted-foreground">
                {projectGroups.length === 0
                  ? t('employeeDashboard.myWeek.noProjectsMonth')
                  : t('employeeDashboard.myWeek.noProjectsFilter')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2 min-w-0">
            {filteredProjects.map((group) => {
              const allProjectTasks = tasksByProjectId.get(group.projectId) ?? [];
              const visibleTasks = filterTasksByStatus(allProjectTasks).sort((a, b) => {
                const weekCmp = a.weekStartDate.localeCompare(b.weekStartDate);
                if (weekCmp !== 0) return weekCmp;
                return (a.taskName ?? '').localeCompare(b.taskName ?? '');
              });
              const pendingCount = allProjectTasks.filter(a => a.status !== 'completed').length;
              const isExpanded = expandedProjectIds.has(group.projectId);
              const mySpent = preference === 'actual' ? group.myReal : group.myComputed;
              const balance = group.myPlanDeltaSum;
              const isPositive = balance >= 0;

              return (
                <Collapsible
                  key={group.projectId}
                  open={isExpanded}
                  onOpenChange={() => toggleProjectExpanded(group.projectId)}
                  className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm"
                >
                  <CollapsibleTrigger className="flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-slate-50/80 transition-colors">
                    <ChevronRight
                      className={cn(
                        'h-4 w-4 mt-0.5 shrink-0 text-slate-400 transition-transform duration-200',
                        isExpanded && 'rotate-90'
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate leading-tight">
                        <SensitiveText kind="project" id={group.projectId}>
                          {formatProjectName(group.projectName)}
                        </SensitiveText>
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        <SensitiveText kind="account" id={group.clientId}>{group.clientName}</SensitiveText>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1.5 tabular-nums">
                        {t('employeeDashboard.myWeek.projectTaskSummary', {
                          tasks: visibleTasks.length,
                          pending: pendingCount,
                          estimated: group.myEstimated,
                          spent: mySpent,
                        })}
                      </p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      <Badge variant="outline" className="text-[10px] font-semibold tabular-nums">
                        {group.myCompletedTasks}/{group.myTasks} {t('employeeDashboard.myWeek.tasksShort')}
                      </Badge>
                      <span className="text-xs font-bold text-slate-700 tabular-nums">{group.myEstimated}h</span>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-3 border-t border-slate-100">
                      <div className="pt-3 space-y-1">
                        {visibleTasks.length > 0 ? (
                          visibleTasks.map((task) => (
                            <EmployeeMonthTaskRow
                              key={task.id}
                              task={task}
                              dateLocale={dateLocale}
                              showComputedHours={showComputedHours}
                              preference={preference}
                              onEdit={() => setEditingTask(task)}
                              t={t}
                            />
                          ))
                        ) : (
                          <p className="text-sm text-slate-500 text-center py-4 border border-dashed rounded-md bg-slate-50">
                            {t('employeeDashboard.myWeek.noTasksForFilter')}
                          </p>
                        )}
                      </div>

                      <Collapsible className="mt-3">
                        <CollapsibleTrigger className="flex w-full items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-700 py-2">
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform [[data-state=open]_&]:rotate-90" />
                          {t('employeeDashboard.myWeek.projectSummaryToggle')}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-1 pb-1 space-y-3">
                          {group.projectBudget > 0 && (
                            <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-slate-600">
                              <span className="font-semibold">{t('employeeDashboard.myWeek.consumptionTitle')}: </span>
                              <span className="tabular-nums font-medium text-slate-800">
                                {group.projectTotalComputedAll}h / {group.projectBudget}h
                              </span>
                              {group.hoursMissing > 0 && (
                                <p className="text-[10px] text-amber-700 font-medium mt-1">
                                  {t('employeeDashboard.myWeek.hoursMissing', { hours: group.hoursMissing })}
                                </p>
                              )}
                            </div>
                          )}
                          <div className="grid grid-cols-3 gap-2 min-w-0">
                            <div className="rounded-lg bg-slate-100/90 px-2 py-2 text-center min-w-0">
                              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide truncate">
                                {t('employeeDashboard.hours.estimated')}
                              </p>
                              <p className="text-sm font-bold text-slate-900 tabular-nums mt-0.5">{group.myEstimated}h</p>
                            </div>
                            <div className="rounded-lg bg-slate-100/90 px-2 py-2 text-center min-w-0">
                              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide truncate">
                                {preference === 'actual' ? t('employeeDashboard.hours.real') : t('employeeDashboard.hours.computedCol')}
                              </p>
                              <p className="text-sm font-bold text-emerald-700 tabular-nums mt-0.5">
                                {preference === 'actual' ? group.myReal : group.myComputed}h
                              </p>
                            </div>
                            <div
                              className={cn(
                                'rounded-lg px-2 py-2 text-center border min-w-0',
                                balance === 0 && 'bg-slate-100/90 border-slate-200',
                                balance > 0 && 'bg-emerald-50 border-emerald-200',
                                balance < 0 && 'bg-red-50 border-red-200'
                              )}
                            >
                              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                                {t('employeeDashboard.hours.balance')}
                              </p>
                              {group.myCompletedTasks === 0 ? (
                                <p className="text-xs font-semibold text-slate-500 mt-1">—</p>
                              ) : (
                                <p
                                  className={cn(
                                    'text-sm font-bold tabular-nums mt-0.5',
                                    balance === 0 && 'text-slate-600',
                                    balance > 0 && 'text-emerald-800',
                                    balance < 0 && 'text-red-800'
                                  )}
                                >
                                  {balance === 0 ? '0h' : `${isPositive ? '+' : ''}${balance}h`}
                                </p>
                              )}
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}

        {editingTask && (
          <CoherenceAllocationEditDialog
            allocation={editingTask}
            viewDate={viewDate}
            deadlines={deadlines}
            onDismiss={() => setEditingTask(null)}
          />
        )}
      </div>
    </TooltipProvider>
  );
});

interface EmployeeMonthTaskRowProps {
  task: Allocation;
  dateLocale: ReturnType<typeof useDateLocale>;
  showComputedHours: boolean;
  preference?: AgencySettings['hoursTrackingPreference'];
  onEdit: () => void;
  t: ReturnType<typeof useAppTranslation>['t'];
}

function EmployeeMonthTaskRow({ task, dateLocale, showComputedHours, preference, onEdit, t }: EmployeeMonthTaskRowProps) {
  const weekSpan = formatTaskWeekCalendarSpan(task.weekStartDate, dateLocale);
  const isCompleted = task.status === 'completed';
  const estHours = task.hoursAssigned ?? 0;
  const realHours = task.hoursActual ?? estHours;
  const compHours = getEffectiveCompletedHours(task, preference);

  const hoursMeta = isCompleted
    ? [
        `${t('operationsRadar.taskEstShort', 'Est')} ${estHours}h`,
        `${t('operationsRadar.actualLabel', 'Real')} ${realHours}h`,
        ...(showComputedHours ? [`${t('operationsRadar.computedLabel', 'Comp')} ${compHours}h`] : []),
      ].join(' · ')
    : `${estHours}h · ${t('operationsRadar.estimated', 'estimadas')}`;

  return (
    <div
      className={cn(
        'group flex items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-colors',
        isCompleted ? 'bg-slate-50/90 border-slate-200/90' : 'bg-white border-slate-200 hover:border-slate-300'
      )}
    >
      <div
        className={cn(
          'h-2 w-2 shrink-0 rounded-full',
          isCompleted ? 'bg-emerald-500' : 'bg-blue-500'
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug text-slate-800 line-clamp-2">
          <SensitiveText kind="task" id={task.id}>
            {task.taskName || t('employeeDashboard.myDay.unnamedTask')}
          </SensitiveText>
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] leading-tight">
          <span className="shrink-0 font-semibold tabular-nums text-slate-800">{hoursMeta}</span>
          <span className="text-slate-300" aria-hidden>·</span>
          <span className="text-slate-500">{weekSpan}</span>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 text-slate-400 opacity-70 transition-opacity hover:text-slate-800 group-hover:opacity-100"
        onClick={onEdit}
        aria-label={t('operationsRadar.coherenceTasksEditAria', 'Editar tarea')}
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
