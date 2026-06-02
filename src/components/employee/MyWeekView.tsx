import { useMemo, useState, memo, useEffect } from 'react';
import { useAppOrDemo } from '@/hooks/useAppOrDemo';
import { useAgency } from '@/contexts/AgencyContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { format } from 'date-fns';
import { AppTrans, useAppTranslation } from '@/hooks/useAppTranslation';
import { useDateLocale } from '@/hooks/useDateLocale';
import {
  Sparkles, Target,
  CheckCircle2, Clock, Filter, Check, ChevronDown, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectAliasing } from '@/hooks/useProjectAliasing';
import { Deadline } from '@/types';
import { fetchDeadlinesForMonth } from '@/utils/deadlineUtils';
import { getEffectiveCompletedHours, getPlanningDeltaHours } from '@/utils/hoursTracking';
import { isAllocationInEffectiveMonth } from '@/utils/dateUtils';
import { SensitiveText } from '@/components/privacy/SensitiveText';

interface MyWeekViewProps {
  employeeId: string;
  viewDate: Date;
}

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

const clampPct = (n: number) => Math.max(0, Math.min(100, n));

type UtilTone = 'muted' | 'ok' | 'warn' | 'over';

function utilizationTone(planned: number, spent: number): UtilTone {
  if (planned <= 0) return spent > 0 ? 'ok' : 'muted';
  const ratio = spent / planned;
  if (ratio > 1) return 'over';
  if (ratio >= 0.85) return 'warn';
  if (spent <= 0) return 'muted';
  return 'ok';
}

function projectConsumptionTone(pctUsed: number): UtilTone {
  if (pctUsed > 100) return 'over';
  if (pctUsed >= 85) return 'warn';
  return 'ok';
}

function utilizationPercentage(planned: number, spent: number): number {
  if (planned <= 0) return spent > 0 ? 100 : 0;
  return round2((spent / planned) * 100);
}

const MEMBER_TONE_BADGE: Record<UtilTone, string> = {
  muted: 'bg-slate-100 text-slate-600 border-slate-200',
  ok: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  warn: 'bg-amber-50 text-amber-900 border-amber-200',
  over: 'bg-red-50 text-red-800 border-red-200'
};

const MEMBER_TONE_BAR: Record<UtilTone, string> = {
  muted: 'bg-slate-200',
  ok: 'bg-emerald-600',
  warn: 'bg-amber-500',
  over: 'bg-red-600'
};

const PROJECT_BADGE: Record<UtilTone, string> = {
  muted: 'bg-slate-50 text-slate-600 border-slate-200',
  ok: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  warn: 'bg-amber-50 text-amber-900 border-amber-200',
  over: 'bg-red-50 text-red-800 border-red-200'
};

export const MyWeekView = memo(function MyWeekView({ employeeId, viewDate }: MyWeekViewProps) {
  const { t } = useAppTranslation();
  const dateLocale = useDateLocale();
  const { allocations, projects, clients, employees, getEmployeeMonthlyLoad } = useAppOrDemo();
  const { currentAgency } = useAgency();
  const { formatName: formatProjectName } = useProjectAliasing();

  const [projectsSearchQuery, setProjectsSearchQuery] = useState('');
  const [filterTeammate, setFilterTeammate] = useState<string>('all');
  const [openFilterTeammate, setOpenFilterTeammate] = useState(false);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);

  const preference = currentAgency?.settings?.hoursTrackingPreference;
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
  const myEmployee = employees.find(e => e.id === employeeId);

  // Allocations del mes para este empleado
  const monthlyAllocations = allocations.filter(a =>
    a.employeeId === employeeId &&
    isAllocationInEffectiveMonth(a.weekStartDate, viewDate) &&
    !(a.isLocked && round2(Number(a.hoursAssigned)) === 0)
  );

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
      // Compañeros con detalle (Plan y Comp)
      teammates: {
        id: string;
        name: string;
        avatarUrl?: string;
        hoursPlanned: number; // Horas planificadas
        hoursComputed: number; // Horas computadas
        impactPercentage: number;
      }[];
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
          teammates: [],
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

      // Compañeros con sus horas Plan y Comp
      const teammateData: Record<string, { planned: number; computed: number }> = {};
      allProjectAllocations
        .filter(a => a.employeeId !== employeeId)
        .forEach(a => {
          if (!teammateData[a.employeeId]) {
            teammateData[a.employeeId] = { planned: 0, computed: 0 };
          }
          teammateData[a.employeeId].planned += a.hoursAssigned;
          if (a.status === 'completed') {
            teammateData[a.employeeId].computed += getEffectiveCompletedHours(a, preference);
          }
        });

      groups[projId].teammates = Object.entries(teammateData).map(([empId, data]) => {
        const emp = employees.find(e => e.id === empId);
        return {
          id: empId,
          name: emp?.name || t('employeeDashboard.common.unknown'),
          avatarUrl: emp?.avatarUrl,
          hoursPlanned: round2(data.planned),
          hoursComputed: round2(data.computed),
          impactPercentage: projectTotal > 0 ? round2((data.computed / projectTotal) * 100) : 0
        };
      }).sort((a, b) => b.hoursComputed - a.hoursComputed);
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
  }, [monthlyAllocations, allocations, projects, clients, employees, employeeId, viewDate, preference, deadlines]);

  // Lista de todos los compañeros únicos para filtro
  const allTeammates = useMemo(() => {
    const set = new Set<string>();
    projectGroups.forEach(g => g.teammates.forEach(t => set.add(t.id)));
    return Array.from(set).map(id => employees.find(e => e.id === id)).filter(Boolean);
  }, [projectGroups, employees]);

  // Filtrar proyectos (texto libre como en Control de planificación + filtro por compañero)
  const filteredProjects = useMemo(() => {
    const q = projectsSearchQuery.trim().toLowerCase();
    return projectGroups.filter(g => {
      if (filterTeammate !== 'all' && !g.teammates.some(t => t.id === filterTeammate)) return false;
      if (!q) return true;
      const projectLabel = formatProjectName(g.projectName).toLowerCase();
      const clientLabel = g.clientName.toLowerCase();
      return projectLabel.includes(q) || clientLabel.includes(q);
    });
  }, [projectGroups, projectsSearchQuery, filterTeammate, formatProjectName]);

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
                <Target className="h-3.5 w-3.5" /> {t('employeeDashboard.myWeek.performanceSubtitle')}
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
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="text-xs text-slate-600">{t('employeeDashboard.common.filtersAndSearch')}</span>
              </div>
              {(projectsSearchQuery.trim() || filterTeammate !== 'all') && (
                <p className="text-xs text-slate-500">
                  <AppTrans
                    i18nKey="employeeDashboard.common.showingProjectsFiltered"
                    values={{ visible: filteredProjects.length, total: projectGroups.length }}
                    components={{ strong: <strong /> }}
                  />
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-[200px] flex-1 sm:flex-initial sm:min-w-[220px] max-w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder={t('employeeDashboard.common.searchByProjectOrClient')}
                    value={projectsSearchQuery}
                    onChange={(e) => setProjectsSearchQuery(e.target.value)}
                    className="pl-9 h-10 w-full bg-white border-slate-200 shadow-sm"
                    aria-label={t('employeeDashboard.common.searchInProjectsAria')}
                  />
                </div>
                {allTeammates.length > 0 && (
                  <Popover open={openFilterTeammate} onOpenChange={setOpenFilterTeammate}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="min-w-[220px] h-10 text-sm justify-between font-normal w-full sm:w-auto">
                        <span className="truncate">
                          {filterTeammate === 'all'
                            ? t('employeeDashboard.common.allTeammates')
                            : (
                                <SensitiveText kind="employee" id={filterTeammate}>
                                  {allTeammates.find(e => e?.id === filterTeammate)?.name ?? t('employeeDashboard.common.team')}
                                </SensitiveText>
                              )}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="min-w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder={t('employeeDashboard.common.searchTeammate')} />
                        <CommandList className="max-h-[320px]">
                          <CommandEmpty>{t('employeeDashboard.common.noTeammatesFound')}</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value={t('employeeDashboard.common.allTeammates')}
                              className="py-2.5"
                              onSelect={() => { setFilterTeammate('all'); setOpenFilterTeammate(false); }}
                            >
                              <Check className={cn('mr-2 h-4 w-4 shrink-0', filterTeammate === 'all' ? 'opacity-100' : 'opacity-0')} />
                              {t('employeeDashboard.common.allTeammates')}
                            </CommandItem>
                            {allTeammates.map(emp => emp && (
                              <CommandItem
                                key={emp.id}
                                value={emp.name || emp.id}
                                className="py-2.5"
                                onSelect={() => { setFilterTeammate(emp.id); setOpenFilterTeammate(false); }}
                              >
                                <Check className={cn('mr-2 h-4 w-4 shrink-0', filterTeammate === emp.id ? 'opacity-100' : 'opacity-0')} />
                                <span className="truncate">
                                  <SensitiveText kind="employee" id={emp.id}>{emp.name}</SensitiveText>
                                </span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Grid de proyectos - altura uniforme */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 min-w-0 items-start">
            {filteredProjects.map(group => {
              const balance = group.myPlanDeltaSum;
              const isPositive = balance >= 0;
              const mySpent = preference === 'actual' ? group.myReal : group.myComputed;
              const hasProjectBudget = group.projectBudget > 0;
              const consumptionTone = hasProjectBudget
                ? projectConsumptionTone(group.projectPercentageUsed)
                : null;
              const headerBadgeTone: UtilTone = hasProjectBudget
                ? consumptionTone!
                : group.myImpactPercentage >= 50
                  ? 'ok'
                  : group.myImpactPercentage >= 25
                    ? 'warn'
                    : 'muted';
              const planMilestonePct = group.projectBudget > 0
                ? clampPct((group.projectTotalAssigned / group.projectBudget) * 100)
                : 0;
              const consumptionFillPct = group.projectBudget > 0
                ? clampPct((group.projectTotalComputedAll / group.projectBudget) * 100)
                : 0;

              const headerMembers: { id: string; name: string; avatarUrl?: string; isMe?: boolean }[] = [
                {
                  id: employeeId,
                  name: myEmployee?.name || t('employeeDashboard.common.you'),
                  avatarUrl: myEmployee?.avatarUrl,
                  isMe: true
                },
                ...group.teammates.map(tm => ({ id: tm.id, name: tm.name, avatarUrl: tm.avatarUrl }))
              ];

              return (
                <Card
                  key={group.projectId}
                  className={cn(
                    'flex flex-col min-w-0 transition-all hover:shadow-md rounded-xl border overflow-hidden',
                    !hasProjectBudget && 'border-slate-200',
                    hasProjectBudget && consumptionTone === 'ok' && 'border-emerald-200/90',
                    hasProjectBudget && consumptionTone === 'warn' && 'border-amber-200/90',
                    hasProjectBudget && consumptionTone === 'over' && 'border-red-200/90',
                    hasProjectBudget && consumptionTone === 'muted' && 'border-slate-200'
                  )}
                >
                  <CardHeader className="pb-2 pt-4 px-4 space-y-3 min-w-0">
                    <div className="flex items-start justify-between gap-3 min-w-0">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm font-bold text-slate-900 truncate leading-tight" title={group.projectName}>
                          <SensitiveText kind="project" id={group.projectId}>{formatProjectName(group.projectName)}</SensitiveText>
                        </CardTitle>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          <SensitiveText kind="account" id={group.clientId}>{group.clientName}</SensitiveText>
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className={cn('shrink-0 font-semibold tabular-nums', PROJECT_BADGE[headerBadgeTone])}>
                              {group.projectBudget > 0
                                ? `${round2(group.projectPercentageUsed)}%`
                                : `${group.myImpactPercentage}%`}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-[220px]">
                            {group.projectBudget > 0 ? (
                              <>
                                <p className="font-semibold mb-1">{t('employeeDashboard.myWeek.consumptionTooltipTitle')}</p>
                                <p className="text-xs text-muted-foreground">
                                  {t('employeeDashboard.myWeek.consumptionTooltipBody', {
                                    computed: group.projectTotalComputedAll,
                                    budget: group.projectBudget,
                                  })}
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="font-semibold mb-1">{t('employeeDashboard.myWeek.contributionTooltipTitle')}</p>
                                <p className="text-xs text-muted-foreground">
                                  {t('employeeDashboard.myWeek.contributionTooltipBody', {
                                    percent: group.myImpactPercentage,
                                  })}
                                </p>
                              </>
                            )}
                          </TooltipContent>
                        </Tooltip>

                        <div className="flex -space-x-2">
                          {headerMembers.slice(0, 5).map((m) => (
                            <Tooltip key={m.id}>
                              <TooltipTrigger asChild>
                                <Avatar className={cn('h-7 w-7 border-2 border-white shadow-sm', m.isMe && 'ring-2 ring-emerald-200')}>
                                  <AvatarImage src={m.avatarUrl} />
                                  <AvatarFallback
                                    className={cn(
                                      'text-[10px] font-semibold',
                                      m.isMe ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                                    )}
                                  >
                                    {m.isMe ? t('employeeDashboard.common.youShort') : m.name.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent>
                                {m.isMe ? (
                                  <span className="font-medium">{t('employeeDashboard.common.you')}</span>
                                ) : (
                                  <SensitiveText kind="employee" id={m.id} className="font-medium">
                                    {m.name}
                                  </SensitiveText>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          ))}
                          {headerMembers.length > 5 && (
                            <div className="h-7 w-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-semibold text-slate-600 z-0">
                              +{headerMembers.length - 5}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {group.projectBudget > 0 && (
                      <div className="space-y-2 pt-1 border-t border-slate-100">
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide truncate min-w-0">
                            {t('employeeDashboard.myWeek.consumptionTitle')}
                          </span>
                          <span className="text-xs font-bold text-slate-800 tabular-nums shrink-0 text-right">
                            {group.projectTotalComputedAll}h / {group.projectBudget}h
                          </span>
                        </div>
                        <div className="space-y-1.5 min-w-0">
                          <div className="relative min-w-0">
                            <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all',
                                  MEMBER_TONE_BAR[projectConsumptionTone(group.projectPercentageUsed)]
                                )}
                                style={{ width: `${consumptionFillPct}%` }}
                              />
                            </div>
                            {planMilestonePct > 0 && (
                              <div
                                className="pointer-events-none absolute left-0 right-0 top-0 h-2.5"
                                aria-hidden
                              >
                                <div
                                  className="absolute top-0 h-full w-px bg-slate-500/70 -translate-x-1/2"
                                  style={{ left: `${planMilestonePct}%` }}
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex items-baseline justify-between gap-3 text-[10px] text-slate-500 min-w-0">
                            <span className="tabular-nums shrink-0">0h</span>
                            <span className="tabular-nums shrink-0 text-right">
                              {round2(group.projectBudget)}h
                            </span>
                          </div>
                          <p
                            className="text-[10px] text-center font-medium text-slate-600 leading-snug px-0.5 min-w-0 break-words"
                            title={
                              group.projectTotalAssigned > 0
                                ? t('employeeDashboard.myWeek.planAssignedMonth', { hours: group.projectTotalAssigned })
                                : undefined
                            }
                          >
                            {group.projectTotalAssigned > 0
                              ? t('employeeDashboard.myWeek.planAssignedMonth', { hours: group.projectTotalAssigned })
                              : '—'}
                          </p>
                        </div>
                        {group.hoursMissing > 0 && (
                          <p className="text-[10px] text-amber-700 font-medium leading-snug">
                            {t('employeeDashboard.myWeek.hoursMissing', { hours: group.hoursMissing })}
                          </p>
                        )}
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="px-4 pb-4 pt-0 space-y-3 min-w-0">
                    {(group.teammates.length > 0 || group.myEstimated > 0) && (
                      <div className="space-y-2 min-w-0">
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                            {t('employeeDashboard.myWeek.teamSection')}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {preference === 'actual'
                              ? t('employeeDashboard.myWeek.realOverPlan')
                              : t('employeeDashboard.myWeek.computedOverPlan')}
                          </div>
                        </div>
                        <div className="space-y-3 min-w-0">
                          {group.myEstimated > 0 && (() => {
                            const tone = utilizationTone(group.myEstimated, mySpent);
                            const pct = utilizationPercentage(group.myEstimated, mySpent);
                            const barW = group.myEstimated > 0
                              ? clampPct((mySpent / group.myEstimated) * 100)
                              : 0;
                            return (
                              <div key="me" className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Avatar className="h-6 w-6 border border-emerald-200 shrink-0">
                                    <AvatarImage src={myEmployee?.avatarUrl} />
                                    <AvatarFallback className="text-[9px] bg-emerald-100 text-emerald-800 font-semibold">
                                      {t('employeeDashboard.common.youShort')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs font-medium text-slate-800 truncate min-w-0 flex-1">
                                    {t('employeeDashboard.common.you')}
                                  </span>
                                  <div className="flex items-center gap-1.5 shrink-0 min-w-0">
                                    <span className="text-[11px] font-medium text-slate-600 tabular-nums whitespace-nowrap text-right">
                                      {mySpent} / {group.myEstimated}h
                                    </span>
                                    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-5 font-semibold tabular-nums shrink-0', MEMBER_TONE_BADGE[tone])}>
                                      {pct}%
                                    </Badge>
                                  </div>
                                </div>
                                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden ml-8 min-w-0">
                                  <div
                                    className={cn('h-full rounded-full', MEMBER_TONE_BAR[tone])}
                                    style={{ width: `${barW}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })()}
                          {group.teammates.map((tm) => {
                            const tone = utilizationTone(tm.hoursPlanned, tm.hoursComputed);
                            const pct = utilizationPercentage(tm.hoursPlanned, tm.hoursComputed);
                            const barW = tm.hoursPlanned > 0
                              ? clampPct((tm.hoursComputed / tm.hoursPlanned) * 100)
                              : 0;
                            return (
                              <div key={tm.id} className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Avatar className="h-6 w-6 border border-slate-200 shrink-0">
                                    <AvatarImage src={tm.avatarUrl} />
                                    <AvatarFallback className="text-[9px] bg-slate-100 text-slate-700 font-medium">
                                      {tm.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs font-medium text-slate-800 truncate min-w-0 flex-1">
                                    <SensitiveText kind="employee" id={tm.id}>{tm.name.split(' ')[0]}</SensitiveText>
                                  </span>
                                  <div className="flex items-center gap-1.5 shrink-0 min-w-0">
                                    <span className="text-[11px] font-medium text-slate-600 tabular-nums whitespace-nowrap text-right">
                                      {tm.hoursComputed} / {tm.hoursPlanned}h
                                    </span>
                                    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-5 font-semibold tabular-nums shrink-0', MEMBER_TONE_BADGE[tone])}>
                                      {pct}%
                                    </Badge>
                                  </div>
                                </div>
                                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden ml-8 min-w-0">
                                  <div
                                    className={cn('h-full rounded-full', MEMBER_TONE_BAR[tone])}
                                    style={{ width: `${barW}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 min-w-0">
                      <div className="rounded-lg bg-slate-100/90 px-1.5 sm:px-2 py-2 text-center min-w-0">
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide truncate">{t('employeeDashboard.hours.estimated')}</p>
                        <p className="text-sm font-bold text-slate-900 tabular-nums mt-0.5 truncate">{group.myEstimated}h</p>
                      </div>
                      <div className="rounded-lg bg-slate-100/90 px-1.5 sm:px-2 py-2 text-center min-w-0">
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide truncate">
                          {preference === 'actual' ? t('employeeDashboard.hours.real') : t('employeeDashboard.hours.computedCol')}
                        </p>
                        <p className="text-sm font-bold text-emerald-700 tabular-nums mt-0.5 truncate">
                          {preference === 'actual' ? group.myReal : group.myComputed}h
                        </p>
                      </div>
                      <div
                        className={cn(
                          'rounded-lg px-1.5 sm:px-2 py-2 text-center border min-w-0',
                          balance === 0 && 'bg-slate-100/90 border-slate-200',
                          balance > 0 && 'bg-emerald-50 border-emerald-200',
                          balance < 0 && 'bg-red-50 border-red-200'
                        )}
                      >
                        <p
                          className={cn(
                            'text-[10px] font-semibold uppercase tracking-wide',
                            balance === 0 && 'text-slate-500',
                            balance > 0 && 'text-emerald-800',
                            balance < 0 && 'text-red-800'
                          )}
                        >
                          {t('employeeDashboard.hours.balance')}
                        </p>
                        {group.myCompletedTasks === 0 ? (
                          <p className="text-xs font-semibold text-slate-500 mt-1">—</p>
                        ) : balance === 0 ? (
                          <p className="text-sm font-bold text-slate-600 tabular-nums mt-0.5 truncate">0h</p>
                        ) : (
                          <p
                            className={cn(
                              'text-sm font-bold tabular-nums mt-0.5 truncate',
                              isPositive ? 'text-emerald-800' : 'text-red-800'
                            )}
                          >
                            {isPositive ? '+' : ''}{balance}h
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
});
