import { useMemo, useState, memo, useEffect, useCallback, useRef } from 'react';
import { useAppOrDemo } from '@/hooks/useAppOrDemo';
import { useAgency } from '@/contexts/AgencyContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format, isBefore, startOfWeek } from 'date-fns';
import { AppTrans, useAppTranslation } from '@/hooks/useAppTranslation';
import { useDateLocale } from '@/hooks/useDateLocale';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Search,
  ListTodo,
  ChevronRight,
  X,
  UnfoldVertical,
  FoldVertical,
  CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectAliasing } from '@/hooks/useProjectAliasing';
import { Allocation, Deadline, AgencySettings } from '@/types';
import { fetchDeadlinesForMonth } from '@/utils/deadlineUtils';
import { getEffectiveCompletedHours, getPlanningDeltaHours } from '@/utils/hoursTracking';
import { formatTaskWeekCalendarSpan, isAllocationInEffectiveMonth, parseDateStringLocal } from '@/utils/dateUtils';
import { SensitiveText } from '@/components/privacy/SensitiveText';
import { CoherenceAllocationEditDialog } from '@/components/employee/CoherenceAllocationEditDialog';

interface MyWeekViewProps {
  employeeId: string;
  viewDate: Date;
}

type TaskStatusFilter = 'all' | 'pending' | 'completed';

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;
const WEEK_OPTS = { weekStartsOn: 1 as const };

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
  const expandInitKeyRef = useRef<string | null>(null);

  const preference = currentAgency?.settings?.hoursTrackingPreference;
  const showComputedHours = preference !== 'actual';
  const monthKey = format(viewDate, 'yyyy-MM');
  const today = useMemo(() => new Date(), []);
  const currentWeekStart = useMemo(() => startOfWeek(today, WEEK_OPTS), [today]);

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
    void loadDeadlines();
  }, [monthKey, currentAgency?.id]);

  const monthLabel = format(viewDate, 'MMMM yyyy', { locale: dateLocale });

  const monthlyAllocations = useMemo(
    () =>
      allocations.filter(
        (a) =>
          a.employeeId === employeeId &&
          isAllocationInEffectiveMonth(a.weekStartDate, viewDate) &&
          !(a.isLocked && round2(Number(a.hoursAssigned)) === 0),
      ),
    [allocations, employeeId, viewDate],
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

  const filterCounts = useMemo(
    () => ({
      all: monthlyAllocations.length,
      pending: monthlyAllocations.filter((a) => a.status !== 'completed').length,
      completed: monthlyAllocations.filter((a) => a.status === 'completed').length,
    }),
    [monthlyAllocations],
  );

  const filterTasksByStatus = useCallback(
    (tasks: Allocation[]) => {
      if (taskStatusFilter === 'pending') return tasks.filter((a) => a.status !== 'completed');
      if (taskStatusFilter === 'completed') return tasks.filter((a) => a.status === 'completed');
      return tasks;
    },
    [taskStatusFilter],
  );

  const monthlyStats = useMemo(() => {
    const load = getEmployeeMonthlyLoad(employeeId, viewDate.getFullYear(), viewDate.getMonth());
    const completed = monthlyAllocations.filter((a) => a.status === 'completed');
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
      pendingTasks: totalTasks - completedTasks,
      totalEstimated: round2(totalEstimated),
      totalReal: round2(totalReal),
      totalComputed: round2(totalComputed),
      executionRate: round2(executionRate),
    };
  }, [employeeId, viewDate, monthlyAllocations, getEmployeeMonthlyLoad, preference]);

  const projectGroups = useMemo(() => {
    const groups: Record<
      string,
      {
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
        myPendingTasks: number;
        projectTotalComputedAll: number;
        projectBudget: number;
        projectMinimum: number;
        projectTotalAssigned: number;
        projectPercentageUsed: number;
        myImpactPercentage: number;
        hoursMissing: number;
        myPlanDeltaSum: number;
      }
    > = {};

    monthlyAllocations.forEach((alloc) => {
      if (!groups[alloc.projectId]) {
        const proj = projects.find((p) => p.id === alloc.projectId);
        const cli = clients.find((c) => c.id === proj?.clientId);
        const deadline = deadlines.find((d) => d.projectId === alloc.projectId);
        const effectiveBudget =
          deadline?.budgetOverride !== undefined && deadline?.budgetOverride !== null
            ? deadline.budgetOverride
            : proj?.budgetHours || 0;

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
          myPendingTasks: 0,
          projectTotalComputedAll: 0,
          projectBudget: effectiveBudget,
          projectMinimum: proj?.minimumHours || 0,
          projectTotalAssigned: 0,
          projectPercentageUsed: 0,
          myImpactPercentage: 0,
          hoursMissing: 0,
          myPlanDeltaSum: 0,
        };
      }

      groups[alloc.projectId].myEstimated += alloc.hoursAssigned;
      groups[alloc.projectId].myTasks += 1;
      if (alloc.status !== 'completed') {
        groups[alloc.projectId].myPendingTasks += 1;
      } else {
        groups[alloc.projectId].myReal += alloc.hoursActual || 0;
        groups[alloc.projectId].myComputed += getEffectiveCompletedHours(alloc, preference);
        groups[alloc.projectId].myCompletedTasks += 1;
        groups[alloc.projectId].myPlanDeltaSum += getPlanningDeltaHours(alloc, preference) ?? 0;
      }
    });

    Object.keys(groups).forEach((projId) => {
      const allProjectAllocations = allocations.filter(
        (a) => a.projectId === projId && isAllocationInEffectiveMonth(a.weekStartDate, viewDate),
      );
      const projectTotalAssigned = round2(allProjectAllocations.reduce((sum, a) => sum + a.hoursAssigned, 0));
      const projectTotalComputedAll = round2(
        allProjectAllocations
          .filter((a) => a.status === 'completed')
          .reduce((sum, a) => sum + getEffectiveCompletedHours(a, preference), 0),
      );

      groups[projId].projectTotalAssigned = projectTotalAssigned;
      groups[projId].projectTotalComputedAll = projectTotalComputedAll;

      const budget = groups[projId].projectBudget;
      groups[projId].projectPercentageUsed =
        budget > 0 ? round2((projectTotalComputedAll / budget) * 100) : 0;

      const targetHours = groups[projId].projectMinimum > 0 ? groups[projId].projectMinimum : budget;
      groups[projId].hoursMissing =
        targetHours > 0 && projectTotalAssigned < targetHours
          ? round2(targetHours - projectTotalAssigned)
          : 0;

      if (projectTotalComputedAll > 0) {
        groups[projId].myImpactPercentage = round2(
          (groups[projId].myComputed / projectTotalComputedAll) * 100,
        );
      }
    });

    return Object.values(groups)
      .map((g) => ({
        ...g,
        myEstimated: round2(g.myEstimated),
        myReal: round2(g.myReal),
        myComputed: round2(g.myComputed),
        myPlanDeltaSum: round2(g.myPlanDeltaSum),
      }))
      .sort((a, b) => {
        if (a.myPendingTasks !== b.myPendingTasks) return b.myPendingTasks - a.myPendingTasks;
        if (a.myEstimated !== b.myEstimated) return b.myEstimated - a.myEstimated;
        return formatProjectName(a.projectName).localeCompare(formatProjectName(b.projectName));
      });
  }, [
    monthlyAllocations,
    allocations,
    projects,
    clients,
    viewDate,
    preference,
    deadlines,
    t,
    formatProjectName,
  ]);

  const pendingProjectIds = useMemo(
    () => projectGroups.filter((g) => g.myPendingTasks > 0).map((g) => g.projectId),
    [projectGroups],
  );

  const expandInitKey = `${employeeId}:${monthKey}`;
  useEffect(() => {
    if (expandInitKeyRef.current === expandInitKey) return;
    expandInitKeyRef.current = expandInitKey;
    setExpandedProjectIds(new Set(pendingProjectIds));
    setProjectsSearchQuery('');
    setTaskStatusFilter('all');
  }, [expandInitKey, pendingProjectIds]);

  const filteredProjects = useMemo(() => {
    const q = projectsSearchQuery.trim().toLowerCase();
    return projectGroups.filter((g) => {
      const projectTasks = tasksByProjectId.get(g.projectId) ?? [];
      const visibleTasks = filterTasksByStatus(projectTasks);
      if (taskStatusFilter !== 'all' && visibleTasks.length === 0) return false;

      if (!q) return true;
      const projectLabel = formatProjectName(g.projectName).toLowerCase();
      const clientLabel = g.clientName.toLowerCase();
      const taskMatch = projectTasks.some((task) => (task.taskName ?? '').toLowerCase().includes(q));
      return projectLabel.includes(q) || clientLabel.includes(q) || taskMatch;
    });
  }, [projectGroups, projectsSearchQuery, formatProjectName, tasksByProjectId, filterTasksByStatus, taskStatusFilter]);

  const allFilteredExpanded =
    filteredProjects.length > 0 && filteredProjects.every((g) => expandedProjectIds.has(g.projectId));

  const toggleProjectExpanded = useCallback((projectId: string) => {
    setExpandedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }, []);

  const setAllExpanded = useCallback(
    (expanded: boolean) => {
      setExpandedProjectIds(
        expanded ? new Set(filteredProjects.map((g) => g.projectId)) : new Set(),
      );
    },
    [filteredProjects],
  );

  return (
    <TooltipProvider>
      <div className="space-y-5" data-tour="projects-summary">
        {/* Cabecera del mes */}
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-bold capitalize text-slate-900">{monthLabel}</h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <ListTodo className="h-3.5 w-3.5 shrink-0" />
                {t('employeeDashboard.myWeek.tasksSubtitle')}
              </p>
            </div>

            <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:min-w-[280px]">
              <MonthSummaryPill
                icon={ListTodo}
                label={t('employeeDashboard.myWeek.summaryTasks')}
                value={String(monthlyStats.totalTasks)}
                sub={
                  monthlyStats.pendingTasks > 0
                    ? t('employeeDashboard.myWeek.summaryPendingShort', { count: monthlyStats.pendingTasks })
                    : t('employeeDashboard.myWeek.summaryAllDone')
                }
                tone="neutral"
              />
              <MonthSummaryPill
                icon={Clock}
                label={t('employeeDashboard.myWeek.summaryHours')}
                value={`${monthlyStats.totalEstimated}h`}
                sub={t('employeeDashboard.myWeek.summaryCapacity', { hours: monthlyStats.capacity })}
                tone="neutral"
              />
              <MonthSummaryPill
                icon={CheckCircle2}
                label={t('employeeDashboard.myWeek.summaryCompleted')}
                value={`${monthlyStats.executionRate}%`}
                sub={t('employeeDashboard.myWeek.summaryCompletedSub', {
                  completed: monthlyStats.completedTasks,
                  total: monthlyStats.totalTasks,
                })}
                tone={monthlyStats.executionRate >= 50 ? 'success' : 'warn'}
              />
              <MonthSummaryPill
                icon={CalendarDays}
                label={t('employeeDashboard.myWeek.summaryProjects')}
                value={String(projectGroups.length)}
                sub={t('employeeDashboard.myWeek.summaryProjectsSub')}
                tone="neutral"
              />
            </div>
          </div>

          {projectGroups.length > 0 && (
            <div className="space-y-3 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm sm:p-4">
              {(projectsSearchQuery.trim() || taskStatusFilter !== 'all') && (
                <p className="text-xs text-slate-500">
                  <AppTrans
                    i18nKey="employeeDashboard.common.showingProjectsFiltered"
                    values={{ visible: filteredProjects.length, total: projectGroups.length }}
                    components={{ strong: <strong /> }}
                  />
                </p>
              )}

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t('employeeDashboard.myWeek.searchPlaceholder')}
                    value={projectsSearchQuery}
                    onChange={(e) => setProjectsSearchQuery(e.target.value)}
                    className="h-10 w-full border-slate-200 bg-slate-50/50 pl-9 pr-9 shadow-none focus-visible:bg-white"
                    aria-label={t('employeeDashboard.common.searchInProjectsAria')}
                  />
                  {projectsSearchQuery.trim() && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      onClick={() => setProjectsSearchQuery('')}
                      aria-label={t('employeeDashboard.myWeek.clearSearch')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {(['all', 'pending', 'completed'] as const).map((status) => (
                    <Button
                      key={status}
                      type="button"
                      variant={taskStatusFilter === status ? 'default' : 'outline'}
                      size="sm"
                      className="h-9 gap-1.5 px-3 text-xs"
                      onClick={() => setTaskStatusFilter(status)}
                    >
                      {status === 'all' && t('employeeDashboard.myWeek.taskStatusAll')}
                      {status === 'pending' && t('employeeDashboard.myWeek.taskStatusPending')}
                      {status === 'completed' && t('employeeDashboard.myWeek.taskStatusCompleted')}
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-0 text-[10px] font-semibold tabular-nums',
                          taskStatusFilter === status
                            ? 'bg-white/20 text-inherit'
                            : 'bg-slate-100 text-slate-600',
                        )}
                      >
                        {filterCounts[status]}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>

              {filteredProjects.length > 1 && (
                <div className="flex justify-end border-t border-slate-100 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 text-xs text-slate-500"
                    onClick={() => setAllExpanded(!allFilteredExpanded)}
                  >
                    {allFilteredExpanded ? (
                      <>
                        <FoldVertical className="h-3.5 w-3.5" />
                        {t('employeeDashboard.myWeek.collapseAll')}
                      </>
                    ) : (
                      <>
                        <UnfoldVertical className="h-3.5 w-3.5" />
                        {t('employeeDashboard.myWeek.expandAll')}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Listado por proyecto */}
        {filteredProjects.length === 0 ? (
          <Card className="border-dashed border-slate-200 bg-slate-50/40">
            <CardContent className="py-14 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                <Sparkles className="h-7 w-7 text-slate-300" />
              </div>
              <p className="font-medium text-slate-700">
                {projectGroups.length === 0
                  ? t('employeeDashboard.myWeek.noProjectsMonth')
                  : t('employeeDashboard.myWeek.noProjectsFilter')}
              </p>
              {projectGroups.length > 0 && projectsSearchQuery.trim() && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setProjectsSearchQuery('')}
                >
                  {t('employeeDashboard.myWeek.clearSearch')}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2.5 min-w-0">
            {filteredProjects.map((group) => {
              const allProjectTasks = tasksByProjectId.get(group.projectId) ?? [];
              const visibleTasks = filterTasksByStatus(allProjectTasks).sort((a, b) => {
                const pendingCmp = Number(a.status === 'completed') - Number(b.status === 'completed');
                if (pendingCmp !== 0) return pendingCmp;
                const weekCmp = a.weekStartDate.localeCompare(b.weekStartDate);
                if (weekCmp !== 0) return weekCmp;
                return (a.taskName ?? '').localeCompare(b.taskName ?? '');
              });
              const isExpanded = expandedProjectIds.has(group.projectId);
              const mySpent = preference === 'actual' ? group.myReal : group.myComputed;
              const balance = group.myPlanDeltaSum;
              const isPositive = balance >= 0;
              const hasPending = group.myPendingTasks > 0;

              return (
                <Collapsible
                  key={group.projectId}
                  open={isExpanded}
                  onOpenChange={() => toggleProjectExpanded(group.projectId)}
                  className={cn(
                    'overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow',
                    hasPending ? 'border-blue-200/80' : 'border-slate-200/90',
                    isExpanded && 'shadow-md',
                  )}
                >
                  <CollapsibleTrigger className="flex w-full items-center gap-3 px-3 py-3.5 text-left transition-colors hover:bg-slate-50/80 sm:px-4">
                    <span
                      className="h-9 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: group.clientColor }}
                      aria-hidden
                    />
                    <ChevronRight
                      className={cn(
                        'h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200',
                        isExpanded && 'rotate-90',
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-bold leading-tight text-slate-900">
                          <SensitiveText kind="project" id={group.projectId}>
                            {formatProjectName(group.projectName)}
                          </SensitiveText>
                        </p>
                        {hasPending && (
                          <Badge className="h-5 border-0 bg-blue-100 px-1.5 text-[10px] font-semibold text-blue-800 hover:bg-blue-100">
                            {t('employeeDashboard.myWeek.projectPendingBadge', {
                              count: group.myPendingTasks,
                            })}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        <SensitiveText kind="account" id={group.clientId}>
                          {group.clientName}
                        </SensitiveText>
                      </p>
                      <p className="mt-1 text-[11px] tabular-nums text-slate-500">
                        {t('employeeDashboard.myWeek.projectHeaderMeta', {
                          tasks: group.myTasks,
                          hours: group.myEstimated,
                          spent: mySpent,
                        })}
                      </p>
                    </div>
                    <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                      <span className="text-sm font-bold tabular-nums text-slate-800">
                        {group.myEstimated}h
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {group.myCompletedTasks}/{group.myTasks}
                      </span>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="border-t border-slate-100 px-3 pb-3 sm:px-4">
                      <div className="space-y-1.5 pt-3">
                        {visibleTasks.length > 0 ? (
                          visibleTasks.map((task) => (
                            <EmployeeMonthTaskRow
                              key={task.id}
                              task={task}
                              dateLocale={dateLocale}
                              showComputedHours={showComputedHours}
                              preference={preference}
                              currentWeekStart={currentWeekStart}
                              onEdit={() => setEditingTask(task)}
                              t={t}
                            />
                          ))
                        ) : (
                          <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 py-4 text-center text-sm text-slate-500">
                            {t('employeeDashboard.myWeek.noTasksForFilter')}
                          </p>
                        )}
                      </div>

                      <Collapsible className="group/summary mt-3 border-t border-slate-100 pt-1">
                        <CollapsibleTrigger className="flex w-full items-center gap-2 py-2 text-xs font-medium text-slate-500 hover:text-slate-700">
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform group-data-[state=open]/summary:rotate-90" />
                          {t('employeeDashboard.myWeek.projectSummaryToggle')}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-3 pb-1 pt-1">
                          {group.projectBudget > 0 && (
                            <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                              <span className="font-semibold">
                                {t('employeeDashboard.myWeek.consumptionTitle')}:{' '}
                              </span>
                              <span className="font-medium tabular-nums text-slate-800">
                                {group.projectTotalComputedAll}h / {group.projectBudget}h
                              </span>
                              {group.hoursMissing > 0 && (
                                <p className="mt-1 text-[10px] font-medium text-amber-700">
                                  {t('employeeDashboard.myWeek.hoursMissing', {
                                    hours: group.hoursMissing,
                                  })}
                                </p>
                              )}
                            </div>
                          )}
                          <div className="grid min-w-0 grid-cols-3 gap-2">
                            <MetricTile
                              label={t('employeeDashboard.hours.estimated')}
                              value={`${group.myEstimated}h`}
                            />
                            <MetricTile
                              label={
                                preference === 'actual'
                                  ? t('employeeDashboard.hours.real')
                                  : t('employeeDashboard.hours.computedCol')
                              }
                              value={`${preference === 'actual' ? group.myReal : group.myComputed}h`}
                              valueClassName="text-emerald-700"
                            />
                            <MetricTile
                              label={t('employeeDashboard.hours.balance')}
                              value={
                                group.myCompletedTasks === 0
                                  ? '—'
                                  : balance === 0
                                    ? '0h'
                                    : `${isPositive ? '+' : ''}${balance}h`
                              }
                              valueClassName={cn(
                                group.myCompletedTasks === 0 && 'text-slate-500',
                                balance > 0 && 'text-emerald-800',
                                balance < 0 && 'text-red-800',
                              )}
                            />
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

function MonthSummaryPill({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: typeof ListTodo;
  label: string;
  value: string;
  sub: string;
  tone: 'neutral' | 'success' | 'warn';
}) {
  return (
    <div
      className={cn(
        'rounded-xl border px-3 py-2.5',
        tone === 'success' && 'border-emerald-200/80 bg-emerald-50/50',
        tone === 'warn' && 'border-amber-200/80 bg-amber-50/50',
        tone === 'neutral' && 'border-slate-200/80 bg-slate-50/60',
      )}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        <Icon className="h-3 w-3 shrink-0" />
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-0.5 text-lg font-bold tabular-nums leading-none text-slate-900">{value}</p>
      <p className="mt-1 truncate text-[10px] text-slate-500">{sub}</p>
    </div>
  );
}

function MetricTile({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="min-w-0 rounded-lg bg-slate-100/90 px-2 py-2 text-center">
      <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={cn('mt-0.5 text-sm font-bold tabular-nums text-slate-900', valueClassName)}>
        {value}
      </p>
    </div>
  );
}

interface EmployeeMonthTaskRowProps {
  task: Allocation;
  dateLocale: ReturnType<typeof useDateLocale>;
  showComputedHours: boolean;
  preference?: AgencySettings['hoursTrackingPreference'];
  currentWeekStart: Date;
  onEdit: () => void;
  t: ReturnType<typeof useAppTranslation>['t'];
}

function EmployeeMonthTaskRow({
  task,
  dateLocale,
  showComputedHours,
  preference,
  currentWeekStart,
  onEdit,
  t,
}: EmployeeMonthTaskRowProps) {
  const weekSpan = formatTaskWeekCalendarSpan(task.weekStartDate, dateLocale);
  const isCompleted = task.status === 'completed';
  const estHours = task.hoursAssigned ?? 0;
  const realHours = task.hoursActual ?? estHours;
  const compHours = getEffectiveCompletedHours(task, preference);
  const isOverdue =
    !isCompleted &&
    isBefore(parseDateStringLocal(task.weekStartDate), currentWeekStart);

  return (
    <button
      type="button"
      onClick={onEdit}
      className={cn(
        'group flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all',
        'hover:border-slate-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35',
        isCompleted
          ? 'border-slate-200/80 bg-slate-50/70'
          : 'border-slate-200 bg-white shadow-sm',
        isOverdue && !isCompleted && 'border-red-200/80 bg-red-50/30',
      )}
      aria-label={t('employeeDashboard.myWeek.openTaskAria', {
        name: task.taskName || t('employeeDashboard.myDay.unnamedTask'),
      })}
    >
      <div
        className={cn(
          'mt-0.5 h-2 w-2 shrink-0 rounded-full',
          isCompleted ? 'bg-emerald-500' : isOverdue ? 'bg-red-500' : 'bg-blue-500',
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-800">
          <SensitiveText kind="task" id={task.id}>
            {task.taskName || t('employeeDashboard.myDay.unnamedTask')}
          </SensitiveText>
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
              isCompleted ? 'bg-slate-200/70 text-slate-700' : 'bg-slate-100 text-slate-800',
            )}
          >
            <Clock className="h-3 w-3 shrink-0 opacity-70" />
            {isCompleted ? (
              showComputedHours ? (
                <span>
                  {t('operationsRadar.taskEstShort', 'Est')} {estHours}h ·{' '}
                  {t('operationsRadar.computedLabel', 'Comp')} {compHours}h
                </span>
              ) : (
                <span>
                  {t('operationsRadar.taskEstShort', 'Est')} {estHours}h ·{' '}
                  {t('operationsRadar.actualLabel', 'Real')} {realHours}h
                </span>
              )
            ) : (
              <span>
                {estHours}h · {t('operationsRadar.estimated', 'estimadas')}
              </span>
            )}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
            <CalendarDays className="h-3 w-3 shrink-0 opacity-60" />
            {weekSpan}
          </span>
          {isOverdue && (
            <Badge
              variant="outline"
              className="h-4 border-red-200 bg-red-50 px-1.5 text-[9px] text-red-600"
            >
              {t('employeeDashboard.myDay.overdue')}
            </Badge>
          )}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-slate-500" />
    </button>
  );
}
