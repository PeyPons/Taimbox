import { useMemo, useState, memo, useEffect } from 'react';
import { useAppOrDemo } from '@/hooks/useAppOrDemo';
import { useAgency } from '@/contexts/AgencyContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { MetricsCard } from '@/components/shared/MetricsCard';
import { format, isSameMonth, parseISO } from 'date-fns';
import { isAllocationInEffectiveMonth } from '@/utils/dateUtils';
import { es } from 'date-fns/locale';
import {
  Sparkles, TrendingUp, TrendingDown, Users, Target,
  CheckCircle2, Clock, Award, Filter, Check, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectAliasing } from '@/hooks/useProjectAliasing';
import { Deadline } from '@/types';
import { fetchDeadlinesForMonth } from '@/utils/deadlineUtils';
import { getEffectiveCompletedHours } from '@/utils/hoursTracking';
import { SensitiveText } from '@/components/privacy/SensitiveText';

interface MyWeekViewProps {
  employeeId: string;
  viewDate: Date;
}

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

export const MyWeekView = memo(function MyWeekView({ employeeId, viewDate }: MyWeekViewProps) {
  const { allocations, projects, clients, employees, getEmployeeMonthlyLoad } = useAppOrDemo();
  const { currentAgency } = useAgency();
  const { formatName: formatProjectName } = useProjectAliasing();

  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterTeammate, setFilterTeammate] = useState<string>('all');
  const [openFilterProject, setOpenFilterProject] = useState(false);
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

  const monthLabel = format(viewDate, 'MMMM yyyy', { locale: es });

  // Allocations del mes para este empleado
  const monthlyAllocations = allocations.filter(a =>
    a.employeeId === employeeId &&
    isAllocationInEffectiveMonth(a.weekStartDate, viewDate)
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
  }, [employeeId, viewDate, monthlyAllocations, getEmployeeMonthlyLoad]);

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
          projectName: proj?.name || 'Sin proyecto',
          clientName: cli?.name || 'Interno',
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
          hoursMissing: 0
        };
      }

      groups[alloc.projectId].myEstimated += alloc.hoursAssigned;
      groups[alloc.projectId].myTasks += 1;

      if (alloc.status === 'completed') {
        groups[alloc.projectId].myReal += alloc.hoursActual || 0;
        groups[alloc.projectId].myComputed += getEffectiveCompletedHours(alloc, preference);
        groups[alloc.projectId].myCompletedTasks += 1;
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
          name: emp?.name || 'Desconocido',
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
        myComputed: round2(g.myComputed)
      }))
      .sort((a, b) => b.myComputed - a.myComputed);
  }, [monthlyAllocations, allocations, projects, clients, employees, employeeId, viewDate]);

  // Lista de todos los compañeros únicos para filtro
  const allTeammates = useMemo(() => {
    const set = new Set<string>();
    projectGroups.forEach(g => g.teammates.forEach(t => set.add(t.id)));
    return Array.from(set).map(id => employees.find(e => e.id === id)).filter(Boolean);
  }, [projectGroups, employees]);

  // Filtrar proyectos
  const filteredProjects = useMemo(() => {
    return projectGroups.filter(g => {
      if (filterProject !== 'all' && g.projectId !== filterProject) return false;
      if (filterTeammate !== 'all' && !g.teammates.some(t => t.id === filterTeammate)) return false;
      return true;
    });
  }, [projectGroups, filterProject, filterTeammate]);

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
                <Target className="h-3.5 w-3.5" /> Rendimiento por proyecto
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
                <TooltipContent>Tu capacidad disponible este mes</TooltipContent>
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
                <TooltipContent>{monthlyStats.completedTasks} de {monthlyStats.totalTasks} tareas completadas</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Filtros */}
          {(projectGroups.length > 1 || allTeammates.length > 0) && (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <Popover open={openFilterProject} onOpenChange={setOpenFilterProject}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[180px] h-8 text-xs justify-between font-normal">
                      <span className="truncate">
                        {filterProject === 'all'
                          ? 'Todos los proyectos'
                          : (
                              <SensitiveText kind="project" id={filterProject}>
                                {formatProjectName(projectGroups.find(g => g.projectId === filterProject)?.projectName ?? '')}
                              </SensitiveText>
                            )}
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandList className="max-h-[280px]">
                        <CommandGroup>
                          <CommandItem value="Todos los proyectos" onSelect={() => { setFilterProject('all'); setOpenFilterProject(false); }}>
                            <Check className={cn('mr-2 h-4 w-4 shrink-0', filterProject === 'all' ? 'opacity-100' : 'opacity-0')} />
                            Todos los proyectos
                          </CommandItem>
                          {projectGroups.map(g => (
                            <CommandItem key={g.projectId} value={formatProjectName(g.projectName)} onSelect={() => { setFilterProject(g.projectId); setOpenFilterProject(false); }}>
                              <Check className={cn('mr-2 h-4 w-4 shrink-0', filterProject === g.projectId ? 'opacity-100' : 'opacity-0')} />
                              <SensitiveText kind="project" id={g.projectId}>{formatProjectName(g.projectName)}</SensitiveText>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {allTeammates.length > 0 && (
                <Popover open={openFilterTeammate} onOpenChange={setOpenFilterTeammate}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[180px] h-8 text-xs justify-between font-normal">
                      <span className="truncate">
                        {filterTeammate === 'all'
                          ? 'Todos los compañeros'
                          : (
                              <SensitiveText kind="employee" id={filterTeammate}>
                                {allTeammates.find(e => e?.id === filterTeammate)?.name ?? 'Compañero'}
                              </SensitiveText>
                            )}
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandList className="max-h-[280px]">
                        <CommandGroup>
                          <CommandItem value="Todos los compañeros" onSelect={() => { setFilterTeammate('all'); setOpenFilterTeammate(false); }}>
                            <Check className={cn('mr-2 h-4 w-4 shrink-0', filterTeammate === 'all' ? 'opacity-100' : 'opacity-0')} />
                            Todos los compañeros
                          </CommandItem>
                          {allTeammates.map(emp => emp && (
                            <CommandItem key={emp.id} value={emp.name || ''} onSelect={() => { setFilterTeammate(emp.id); setOpenFilterTeammate(false); }}>
                              <Check className={cn('mr-2 h-4 w-4 shrink-0', filterTeammate === emp.id ? 'opacity-100' : 'opacity-0')} />
                              <SensitiveText kind="employee" id={emp.id}>{emp.name}</SensitiveText>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          )}
        </div>

        {/* Grid de proyectos - altura uniforme */}
        {filteredProjects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-muted-foreground">
                {filterProject !== 'all' || filterTeammate !== 'all'
                  ? "No hay proyectos con esos filtros."
                  : "Sin proyectos asignados este mes."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProjects.map(group => {
              const balance = round2(group.myComputed - group.myReal);
              const isPositive = balance >= 0;
              const completionRate = group.myTasks > 0 ? round2((group.myCompletedTasks / group.myTasks) * 100) : 0;
              const isHighImpact = group.myImpactPercentage >= 50;
              const isMediumImpact = group.myImpactPercentage >= 25 && group.myImpactPercentage < 50;

              return (
                <Card key={group.projectId} className={cn("flex flex-col h-full transition-all hover:shadow-md", isHighImpact && "ring-2 ring-emerald-200")}>
                  {/* Header */}
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm font-bold truncate" title={group.projectName}>
                          <SensitiveText kind="project" id={group.projectId}>{formatProjectName(group.projectName)}</SensitiveText>
                        </CardTitle>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: group.clientColor }} />
                          <span className="text-xs text-muted-foreground truncate">
                            <SensitiveText kind="account" id={group.clientId}>{group.clientName}</SensitiveText>
                          </span>
                        </div>
                      </div>

                      {/* Badge de impacto */}
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="outline" className={cn(
                            "shrink-0 gap-1",
                            isHighImpact ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : isMediumImpact ? "bg-primary/10 text-indigo-700 border-indigo-200"
                                : "bg-slate-50 text-slate-600 border-slate-200"
                          )}>
                            {isHighImpact ? <Award className="h-3 w-3" /> : <Target className="h-3 w-3" />}
                            {group.myImpactPercentage}%
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-[200px]">
                          <p className="font-semibold mb-1">
                            {isHighImpact ? "¡Alto impacto!" : isMediumImpact ? "Impacto notable" : "Tu contribución"}
                          </p>
                          <p className="text-xs">
                            Aportas el {group.myImpactPercentage}% del trabajo total del proyecto este mes.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Compañeros con avatares */}
                    {group.teammates.length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <Users className="h-3 w-3 text-slate-400" />
                        <div className="flex -space-x-2">
                          {group.teammates.slice(0, 4).map(tm => (
                            <Tooltip key={tm.id}>
                              <TooltipTrigger>
                                <Avatar className="h-6 w-6 border-2 border-white">
                                  <AvatarImage src={tm.avatarUrl} />
                                  <AvatarFallback className="text-[10px] bg-slate-100">
                                    {tm.name.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-semibold">
                                  <SensitiveText kind="employee" id={tm.id}>{tm.name}</SensitiveText>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {tm.hoursComputed}h computadas ({tm.impactPercentage}%)
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                          {group.teammates.length > 4 && (
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="h-6 w-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-medium text-slate-600">
                                  +{group.teammates.length - 4}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                {group.teammates.slice(4).map(tm => (
                                  <div key={tm.id} className="text-xs">
                                    <SensitiveText kind="employee" id={tm.id}>{tm.name}</SensitiveText>: {tm.hoursComputed}h
                                  </div>
                                ))}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="px-4 pb-4 pt-2 space-y-3 flex-1 flex flex-col">
                    {/* Total cliente */}
                    {group.projectBudget > 0 && (
                      <div className="space-y-1.5 pb-2 border-b">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase">Total cliente</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-400">Asignadas:</span>
                            <span className="font-bold text-slate-700 ml-1">{group.projectTotalAssigned}h</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Plan:</span>
                            <span className="font-bold text-blue-600 ml-1">{group.projectTotalPlanned}h</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Comp:</span>
                            <span className="font-bold text-emerald-600 ml-1">{group.projectTotalComputedAll}h</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Usado:</span>
                            <span className={cn("font-bold ml-1", group.projectPercentageUsed > 100 ? "text-red-600" : group.projectPercentageUsed > 80 ? "text-amber-600" : "text-emerald-600")}>
                              {group.projectPercentageUsed}%
                            </span>
                          </div>
                        </div>
                        {group.hoursMissing > 0 && (
                          <div className="text-[10px] text-amber-600 font-medium mt-1">
                            ⚠️ Faltan {group.hoursMissing}h por asignar
                          </div>
                        )}
                      </div>
                    )}

                    {/* Equipo */}
                    {(group.teammates.length > 0 || group.myEstimated > 0) && (
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase">
                          Equipo ({group.teammates.length + 1})
                        </div>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                          {/* Tú */}
                          <div className="flex items-center justify-between text-xs px-2 py-1 bg-slate-50 rounded">
                            <div className="flex items-center gap-1.5">
                              <Avatar className="h-5 w-5 border border-slate-300">
                                <AvatarFallback className="text-[9px] bg-indigo-100 text-indigo-700">
                                  Tú
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-slate-700">Tú</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px]">
                              <span className="text-blue-600">Plan: {group.myEstimated}h</span>
                              <span className="text-emerald-600">Comp: {group.myComputed}h</span>
                            </div>
                          </div>
                          {/* Compañeros */}
                          {group.teammates.map(tm => (
                            <div key={tm.id} className="flex items-center justify-between text-xs px-2 py-1">
                              <div className="flex items-center gap-1.5">
                                <Avatar className="h-5 w-5 border border-slate-300">
                                  <AvatarImage src={tm.avatarUrl} />
                                  <AvatarFallback className="text-[9px] bg-slate-100">
                                    {tm.name.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-slate-700 truncate max-w-[80px]">
                                  <SensitiveText kind="employee" id={tm.id}>{tm.name.split(' ')[0]}</SensitiveText>
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px]">
                                <span className="text-blue-600">Plan: {tm.hoursPlanned}h</span>
                                <span className="text-emerald-600">Comp: {tm.hoursComputed}h</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mis métricas */}
                    <div className="pt-2 border-t flex-1">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase mb-2">Mis métricas</div>
                      <MetricsCard
                        estimated={group.myEstimated}
                        real={group.myReal}
                        computed={group.myComputed}
                        size="sm"
                      />
                    </div>

                    {/* Balance - siempre al final */}
                    {group.myCompletedTasks > 0 && (
                      <div className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-lg mt-auto",
                        isPositive ? "bg-emerald-50" : "bg-red-50"
                      )}>
                        <span className="text-xs font-medium text-slate-600">Balance</span>
                        <div className={cn("flex items-center gap-1 font-bold text-sm", isPositive ? "text-emerald-600" : "text-red-600")}>
                          {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          {isPositive ? '+' : ''}{balance}h
                        </div>
                      </div>
                    )}
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
