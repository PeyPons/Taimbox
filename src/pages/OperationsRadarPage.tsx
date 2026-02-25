import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useAgency } from '@/contexts/AgencyContext';
import { useDepartmentView } from '@/contexts/DepartmentViewContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Activity, PlayCircle, Search, ChevronDown, LayoutGrid, Ban, CircleDashed, Clock, AlertOctagon, CheckCircle2, GitBranch } from 'lucide-react';
import { GlobalPlanningInconsistencies } from '@/components/employee/GlobalPlanningInconsistencies';
import { format, startOfMonth, isSameMonth, endOfMonth, getDate, subMonths, addMonths, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useProjectMetrics } from '@/hooks/useProjectMetrics';
import { useProjectAliasing } from '@/hooks/useProjectAliasing';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { normalizeDepartments, employeeBelongsToDepartment } from '@/utils/departmentUtils';
import { isAllocationInEffectiveMonth } from '@/utils/dateUtils';
import { fetchDeadlinesForMonth } from '@/utils/deadlineUtils';
import type { Allocation, Deadline } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

function parseMonthFromSearchParams(searchParams: URLSearchParams): Date {
    const mes = searchParams.get('mes');
    if (!mes || !/^\d{4}-\d{2}$/.test(mes)) return startOfMonth(new Date());
    try {
        const d = parseISO(`${mes}-01`);
        if (isNaN(d.getTime())) return startOfMonth(new Date());
        return startOfMonth(d);
    } catch {
        return startOfMonth(new Date());
    }
}

export default function OperationsRadarPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { projects, clients, allocations, employees, ensureMonthLoaded } = useApp();
    const { currentAgency } = useAgency();
    const { selectedDepartmentId, setSelectedDepartmentId } = useDepartmentView();
    const { formatName: formatProjectName } = useProjectAliasing();

    const [globalSearchQuery, setGlobalSearchQuery] = useState('');

    const departments = useMemo(
        () => normalizeDepartments(currentAgency?.settings?.departments),
        [currentAgency?.settings?.departments]
    );

    const [viewDate, setViewDate] = useState<Date>(() => parseMonthFromSearchParams(searchParams));

    // Sincronizar estado inicial de mes con URL cuando cambian los params (ej. navegación atrás)
    useEffect(() => {
        setViewDate(prev => {
            const fromUrl = parseMonthFromSearchParams(searchParams);
            return prev.getTime() !== fromUrl.getTime() ? fromUrl : prev;
        });
    }, [searchParams]);

    // Permitir que ?depto= configure la vista por departamento (una sola fuente de verdad)
    useEffect(() => {
        const depto = searchParams.get('depto');
        if (!depto) return;

        if (depto === 'all' || depto === 'global') {
            setSelectedDepartmentId(null);
            return;
        }

        const match = departments.find(d => d.id === depto || d.name === depto);
        if (match && match.id !== selectedDepartmentId) {
            setSelectedDepartmentId(match.id);
        }
    }, [searchParams, departments, selectedDepartmentId, setSelectedDepartmentId]);

    // Cargar datos del mes
    useEffect(() => {
        ensureMonthLoaded(viewDate);
    }, [viewDate, ensureMonthLoaded]);

    const [deadlines, setDeadlines] = useState<Deadline[]>([]);
    useEffect(() => {
        const monthKey = format(viewDate, 'yyyy-MM');
        let cancelled = false;
        fetchDeadlinesForMonth(monthKey, currentAgency?.id).then(({ data, error }) => {
            if (!cancelled && !error && data) setDeadlines(data);
            if (!cancelled && error) setDeadlines([]);
        });
        return () => { cancelled = true; };
    }, [viewDate, currentAgency?.id]);

    const handlePrevMonth = () => {
        const next = subMonths(viewDate, 1);
        setViewDate(next);
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('mes', format(next, 'yyyy-MM'));
        navigate({ pathname: '/operaciones', search: nextParams.toString() }, { replace: true });
    };
    const handleNextMonth = () => {
        const next = addMonths(viewDate, 1);
        setViewDate(next);
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('mes', format(next, 'yyyy-MM'));
        navigate({ pathname: '/operaciones', search: nextParams.toString() }, { replace: true });
    };
    const handleToday = () => {
        const next = startOfMonth(new Date());
        setViewDate(next);
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('mes', format(next, 'yyyy-MM'));
        navigate({ pathname: '/operaciones', search: nextParams.toString() }, { replace: true });
    };

    const { projectMetrics } = useProjectMetrics({
        month: viewDate,
        deadlines
    });

    const isCurrentMonth = isSameMonth(new Date(), viewDate);
    const referenceDate = isCurrentMonth ? new Date() : endOfMonth(viewDate);
    const currentWeekOfMonth = Math.ceil(getDate(referenceDate) / 7);
    const isEndOfMonth = currentWeekOfMonth >= 3;
    const atRiskProjectsRaw = useMemo(() => {
        const risks: Array<
            typeof projectMetrics[0] & { riskLevel: 'critical' | 'high' | 'medium'; riskReason: string; riskType: 'overBudget' | 'lowProgress' | 'lowPace' }
        > = [];

        projectMetrics.forEach(p => {
            const hoursOverBudget = p.actual - p.budget;
            const completionRate = p.budget > 0 ? (p.actual / p.budget) * 100 : 0;
            const projectNameLower = p.projectName.toLowerCase();
            const isOffPageOrLinkbuilding = projectNameLower.includes('off-page') ||
                projectNameLower.includes('offpage') ||
                projectNameLower.includes('linkbuilding') ||
                projectNameLower.includes('link building');

            if (hoursOverBudget > 0) {
                risks.push({
                    ...p,
                    riskLevel: hoursOverBudget > 5 ? 'critical' : 'high',
                    riskReason: `Supera presupuesto en ${hoursOverBudget.toFixed(1)}h`,
                    riskType: 'overBudget'
                });
            } else if (isEndOfMonth && completionRate < 35 && p.budget > 0 && !isOffPageOrLinkbuilding) {
                risks.push({
                    ...p,
                    riskLevel: completionRate < 20 ? 'critical' : 'high',
                    riskReason: `Poco avance (${completionRate.toFixed(0)}%)`,
                    riskType: 'lowProgress'
                });
            } else if (!p.isPacing && p.budget > 0) {
                // Por debajo del objetivo (no al ritmo): Aviso bajo, no "En regla"
                risks.push({
                    ...p,
                    riskLevel: 'medium',
                    riskReason: `Por debajo del objetivo (Avance real: ${p.progressOperational.toFixed(0)}%)`,
                    riskType: 'lowPace'
                });
            }
        });

        return risks.sort((a, b) => {
            const riskOrder: Record<string, number> = { critical: 0, high: 1, medium: 2 };
            return (riskOrder[a.riskLevel] || 2) - (riskOrder[b.riskLevel] || 2);
        });
    }, [projectMetrics, isEndOfMonth]);

    // Empleados y proyectos relevantes para la vista por departamento actual
    const employeesForView = useMemo(() => {
        if (!selectedDepartmentId || !departments.length) return employees ?? [];
        const dept = departments.find(d => d.id === selectedDepartmentId || d.name === selectedDepartmentId);
        if (!dept) return employees ?? [];
        return (employees ?? []).filter(e => employeeBelongsToDepartment(e.department, dept.id, dept.name));
    }, [employees, selectedDepartmentId, departments]);

    const projectIdsForDepartment = useMemo(() => {
        if (!selectedDepartmentId) return undefined as Set<string> | undefined;
        if (!employeesForView.length) return new Set<string>();
        const allowedEmployeeIds = new Set(employeesForView.map(e => e.id));
        const ids = new Set<string>();
        allocations.forEach(a => {
            if (!allowedEmployeeIds.has(a.employeeId)) return;
            if (!isAllocationInEffectiveMonth(a.weekStartDate, viewDate)) return;
            ids.add(a.projectId);
        });
        return ids;
    }, [allocations, employeesForView, selectedDepartmentId, viewDate]);

    const atRiskProjects = useMemo(() => {
        // Sin filtro de departamento → todos los riesgos
        if (!projectIdsForDepartment) return atRiskProjectsRaw;
        return atRiskProjectsRaw.filter(risk => projectIdsForDepartment.has(risk.projectId));
    }, [atRiskProjectsRaw, projectIdsForDepartment]);

    /** Estado único por proyecto (misma lógica que cartera): excluyente y con orden de prioridad */
    type ProjectStatusType = 'over-budget' | 'behind-schedule' | 'needs-planning' | 'no-activity' | 'in-rule';

    type ProjectRowItem = {
        projectId: string;
        projectName: string;
        clientName: string;
        planned: number;
        actual: number;
        computed: number;
        budget: number;
        progressOperational: number;
        riskLevel?: 'critical' | 'high' | 'medium';
        riskType?: 'overBudget' | 'lowProgress' | 'lowPace';
        /** Estado para filtros y badge: En regla solo si no hay exceso, retraso, falta planificar ni sin actividad */
        status: ProjectStatusType;
    };

    const allProjectsForView = useMemo(() => {
        const selectedDept = selectedDepartmentId && departments.length
            ? departments.find(d => d.id === selectedDepartmentId || d.name === selectedDepartmentId)
            : null;
        const byDept = projectIdsForDepartment && selectedDept
            ? projectMetrics.filter(p => {
                if (!projectIdsForDepartment.has(p.projectId)) return false;
                const project = projects?.find(proj => proj.id === p.projectId);
                if (!project?.responsibleDepartmentId) return true;
                return project.responsibleDepartmentId === selectedDept.id || project.responsibleDepartmentId === selectedDept.name;
            })
            : projectIdsForDepartment
                ? projectMetrics.filter(p => projectIdsForDepartment.has(p.projectId))
                : projectMetrics;
        const riskMap = new Map(atRiskProjects.map(r => [r.projectId, r]));
        const rows: ProjectRowItem[] = byDept.map(p => {
            const risk = riskMap.get(p.projectId);
            const base = {
                projectId: p.projectId,
                projectName: p.projectName,
                clientName: p.clientName ?? '',
                planned: p.planned,
                actual: p.actual,
                computed: p.computed,
                budget: p.budget,
                progressOperational: p.progressOperational,
                status: 'in-rule' as ProjectStatusType
            };
            if (risk) {
                return { ...base, riskLevel: risk.riskLevel, riskType: risk.riskType };
            }
            return base;
        });
        const riskOrder: Record<string, number> = { critical: 0, high: 1, medium: 2 };
        return rows.sort((a, b) => {
            const aOrder = a.riskLevel ? riskOrder[a.riskLevel] ?? 3 : 4;
            const bOrder = b.riskLevel ? riskOrder[b.riskLevel] ?? 3 : 4;
            if (aOrder !== bOrder) return aOrder - bOrder;
            return (a.projectName || '').localeCompare(b.projectName || '');
        });
    }, [projectMetrics, projectIdsForDepartment, atRiskProjects, selectedDepartmentId, departments, projects]);

    const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatusType>('all');
    const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());

    const toggleAlert = (projectId: string) => {
        setExpandedAlerts(prev => {
            const next = new Set(prev);
            if (next.has(projectId)) next.delete(projectId);
            else next.add(projectId);
            return next;
        });
    };

    type ProjectDetail = {
        effectiveUsage: number;
        planningPct: number;
        realPct: number;
        computedPct: number;
        pendingTasks: Allocation[];
        completedTasks: Allocation[];
    };

    const projectDetailsByProjectId = useMemo(() => {
        const map = new Map<string, ProjectDetail>();
        const monthAllocations = (allocations ?? []).filter(a => isAllocationInEffectiveMonth(a.weekStartDate, viewDate));
        const projectIds = new Set(projectMetrics.map(p => p.projectId));
        const budgetByProject = new Map(projectMetrics.map(p => [p.projectId, p.budget]));
        projectIds.forEach(projectId => {
            const projectAllocs = monthAllocations.filter(a => a.projectId === projectId);
            const completedTasks = projectAllocs.filter(a => a.status === 'completed');
            const pendingTasks = projectAllocs.filter(a => a.status !== 'completed');
            const totalAssigned = projectAllocs.reduce((s, a) => s + (a.hoursAssigned || 0), 0);
            const hoursReal = completedTasks.reduce((s, a) => s + (a.hoursActual || 0), 0);
            const hoursComputed = completedTasks.reduce((s, a) => s + (a.hoursComputed || 0), 0);
            const effectiveUsage = hoursComputed + pendingTasks.reduce((s, a) => s + (a.hoursAssigned || 0), 0);
            const budget = budgetByProject.get(projectId) ?? 0;
            const planningPct = budget > 0 ? (effectiveUsage / budget) * 100 : 0;
            const realPct = budget > 0 ? (hoursReal / budget) * 100 : 0;
            const computedPct = budget > 0 ? (hoursComputed / budget) * 100 : 0;
            map.set(projectId, {
                effectiveUsage: round2(effectiveUsage),
                planningPct: round2(planningPct),
                realPct: round2(realPct),
                computedPct: round2(computedPct),
                pendingTasks,
                completedTasks
            });
        });
        return map;
    }, [allocations, viewDate, projectMetrics]);

    /** Estado único por proyecto (prioridad: exceso > retrasados > falta planificar > sin actividad > en regla).
     * "Falta planificar" solo cuando hay tareas pendientes Y aún no se ha cubierto el objetivo (computado < presupuesto).
     * Si el proyecto ya tiene computado >= presupuesto, las tareas pendientes no obligan a "Falta planificar" (pueden ser tareas en curso). */
    const rowsWithStatus = useMemo(() => {
        function getStatus(row: ProjectRowItem): ProjectStatusType {
            const pendingCount = projectDetailsByProjectId.get(row.projectId)?.pendingTasks.length ?? 0;
            if (row.riskType === 'overBudget') return 'over-budget';
            if (row.riskType === 'lowProgress' || row.riskType === 'lowPace') return 'behind-schedule';
            const budgetReached = row.budget > 0 && row.computed >= row.budget;
            if (pendingCount > 0 && !budgetReached) return 'needs-planning';
            if (row.budget > 0 && row.planned === 0 && row.computed === 0) return 'no-activity';
            return 'in-rule';
        }
        const statusOrder: Record<ProjectStatusType, number> = { 'over-budget': 0, 'behind-schedule': 1, 'needs-planning': 2, 'no-activity': 3, 'in-rule': 4 };
        return allProjectsForView.map(row => ({ ...row, status: getStatus(row) })).sort((a, b) => {
            const o = statusOrder[a.status] - statusOrder[b.status];
            if (o !== 0) return o;
            return (a.projectName || '').localeCompare(b.projectName || '');
        });
    }, [allProjectsForView, projectDetailsByProjectId]);

    const filteredAllProjects = useMemo(() => {
        let list = rowsWithStatus;
        const q = globalSearchQuery.trim().toLowerCase();
        if (q) {
            list = list.filter(r => {
                const formattedName = formatProjectName(r.projectName);
                return formattedName.toLowerCase().includes(q) ||
                    r.projectName.toLowerCase().includes(q) ||
                    (r.clientName && r.clientName.toLowerCase().includes(q));
            });
        }
        if (statusFilter !== 'all') {
            list = list.filter(r => r.status === statusFilter);
        }
        return list;
    }, [rowsWithStatus, globalSearchQuery, statusFilter, formatProjectName]);

    const displayList: ProjectRowItem[] = filteredAllProjects;

    const totalCountAfterSearch = useMemo(() => {
        const q = globalSearchQuery.trim().toLowerCase();
        if (!q) return rowsWithStatus.length;
        return rowsWithStatus.filter(r => {
            const formattedName = formatProjectName(r.projectName);
            return formattedName.toLowerCase().includes(q) ||
                r.projectName.toLowerCase().includes(q) ||
                (r.clientName && r.clientName.toLowerCase().includes(q));
        }).length;
    }, [rowsWithStatus, globalSearchQuery, formatProjectName]);

    const filterCounts = useMemo(() => {
        const list = rowsWithStatus;
        return {
            all: list.length,
            'no-activity': list.filter(p => p.status === 'no-activity').length,
            'needs-planning': list.filter(p => p.status === 'needs-planning').length,
            'behind-schedule': list.filter(p => p.status === 'behind-schedule').length,
            'over-budget': list.filter(p => p.status === 'over-budget').length,
            'in-rule': list.filter(p => p.status === 'in-rule').length
        };
    }, [rowsWithStatus]);

    const departmentNameForView = useMemo(() => {
        if (!selectedDepartmentId) return null;
        const d = departments.find(x => x.id === selectedDepartmentId || x.name === selectedDepartmentId);
        return d?.name ?? null;
    }, [selectedDepartmentId, departments]);

    /** Tareas del mes que bloquean a otras (no completadas y de las que depende al menos otra tarea). Respetan filtro por departamento. */
    const blockingTasksForView = useMemo(() => {
        const monthAllocs = (allocations ?? []).filter(a => isAllocationInEffectiveMonth(a.weekStartDate, viewDate));
        const allowedEmployeeIds = employeesForView.length > 0 ? new Set(employeesForView.map(e => e.id)) : null;

        const blocking = monthAllocs.filter(a => {
            if (a.status === 'completed') return false;
            if (allowedEmployeeIds && !allowedEmployeeIds.has(a.employeeId)) return false;
            return monthAllocs.some(other => other.dependencyId === a.id);
        });

        return blocking.map(allocation => {
            const waitingAllocs = monthAllocs.filter(o => o.dependencyId === allocation.id);
            const project = projects?.find(p => p.id === allocation.projectId);
            const client = project ? clients?.find(c => c.id === project.clientId) : undefined;
            const blockerEmployee = employees?.find(e => e.id === allocation.employeeId);

            const waitingEmployees = waitingAllocs
                .map(w => employees?.find(e => e.id === w.employeeId))
                .filter((e): e is NonNullable<typeof e> => Boolean(e));

            // Empleados únicos que están esperando por esta tarea
            const uniqueWaitingEmployees: typeof waitingEmployees = [];
            const seen = new Set<string>();
            waitingEmployees.forEach(emp => {
                if (emp && !seen.has(emp.id)) {
                    seen.add(emp.id);
                    uniqueWaitingEmployees.push(emp);
                }
            });

            // Para cada tarea bloqueada: nombre de la tarea y de la persona bloqueada
            const blockedTaskDetails = waitingAllocs.map(wa => ({
                taskName: wa.taskName || 'Tarea sin nombre',
                employeeName: employees?.find(e => e.id === wa.employeeId)?.name ?? 'Alguien'
            }));

            return {
                allocation,
                projectName: project?.name ?? '',
                clientName: client?.name ?? '',
                blockerEmployee,
                waitingAllocs,
                waitingEmployees: uniqueWaitingEmployees,
                blockedTaskDetails
            };
        });
    }, [allocations, viewDate, employeesForView, projects, employees, clients]);

    const [blockingSectionOpen, setBlockingSectionOpen] = useState(true);
    useEffect(() => {
        if (blockingTasksForView.length > 0) setBlockingSectionOpen(true);
    }, [blockingTasksForView.length]);

    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <Activity className="h-6 w-6 text-indigo-600" />
                            Seguimiento operativo
                        </h1>
                        <p className="text-slate-500 mt-1">
                            Revisión diaria de procesos en riesgo y desviaciones. La búsqueda aplica a ambos paneles.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative min-w-[200px] max-w-[320px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar proyecto o cliente..."
                                value={globalSearchQuery}
                                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                                className="pl-9 h-10"
                                aria-label="Buscar en Seguimiento operativo (aplica a ambos paneles)"
                            />
                        </div>
                        <div className="flex items-center gap-1 bg-white rounded-lg border p-1 shadow-sm">
                            <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-9 w-9 text-slate-500" aria-label="Mes anterior">
                                &lt;
                            </Button>
                            <Button variant="ghost" onClick={handleToday} className="h-9 px-3 text-sm font-medium text-slate-700 capitalize">
                                {format(viewDate, 'MMM yyyy', { locale: es })}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-9 w-9 text-slate-500" aria-label="Mes siguiente">
                                &gt;
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <Collapsible open={blockingSectionOpen} onOpenChange={setBlockingSectionOpen} className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <CollapsibleTrigger asChild>
                    <button
                        type="button"
                        className={cn(
                            "flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 rounded-lg",
                            blockingTasksForView.length > 0 && "bg-amber-50/50 hover:bg-amber-50"
                        )}
                        aria-expanded={blockingSectionOpen}
                    >
                        <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <GitBranch className="h-4 w-4 text-slate-500 shrink-0" />
                            {blockingTasksForView.length > 0
                                ? `${blockingTasksForView.length} tarea${blockingTasksForView.length !== 1 ? 's' : ''} bloquean al equipo`
                                : 'Nada bloquea al equipo este mes'}
                        </span>
                        <ChevronDown className={cn("h-4 w-4 text-slate-400 shrink-0 transition-transform", blockingSectionOpen && "rotate-180")} />
                    </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="px-4 pb-3 pt-0 border-t border-slate-100">
                        {blockingTasksForView.length === 0 ? (
                            <p className="text-xs text-slate-500 pt-3">Todas las tareas de las que dependen otras están completadas o no hay dependencias este mes.</p>
                        ) : (
                            <ul className="space-y-2 pt-3">
                                {blockingTasksForView.map(({ allocation, projectName, clientName, blockerEmployee, waitingEmployees, blockedTaskDetails }) => {
                                    const blockerName = blockerEmployee?.name ?? 'Alguien';
                                    const blockerTaskName = allocation.taskName || 'Tarea sin nombre';

                                    // Quién es bloqueado (lista de nombres únicos)
                                    const blockedNames = waitingEmployees.map(e => e.name).join(', ');

                                    return (
                                        <li key={allocation.id} className="flex items-start gap-3 py-3 px-3 rounded-md bg-slate-50/80 text-xs border border-slate-100">
                                            <Avatar className="h-8 w-8 border shrink-0 ring-2 ring-amber-200">
                                                <AvatarImage src={blockerEmployee?.avatarUrl} />
                                                <AvatarFallback className="bg-amber-100 text-amber-800 text-[10px] font-bold">
                                                    {blockerName.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1 space-y-1.5">
                                                {/* Quién bloquea a quién */}
                                                <p className="text-sm font-semibold text-slate-800">
                                                    <span className="text-amber-700">{blockerName}</span>
                                                    {' bloquea a '}
                                                    <span className="text-slate-700">{blockedNames || 'otras tareas'}</span>
                                                </p>
                                                {/* Tarea del bloqueador */}
                                                <p className="text-[11px] text-slate-600">
                                                    <span className="font-medium text-slate-500">Tarea bloqueadora:</span>{' '}
                                                    <span className="text-slate-800" title={blockerTaskName}>{blockerTaskName}</span>
                                                </p>
                                                {/* Tarea(s) bloqueada(s) */}
                                                {blockedTaskDetails.length > 0 && (
                                                    <div className="text-[11px]">
                                                        <span className="font-medium text-slate-500">
                                                            {blockedTaskDetails.length === 1 ? 'Tarea bloqueada:' : 'Tareas bloqueadas:'}
                                                        </span>
                                                        <ul className="mt-0.5 list-none space-y-0.5 pl-0">
                                                            {blockedTaskDetails.map((b, i) => (
                                                                <li key={i} className="text-slate-700">
                                                                    · <span className="text-slate-800">{b.taskName}</span>
                                                                    <span className="text-slate-500"> ({b.employeeName})</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {/* Proyecto y cliente */}
                                                <p className="text-[11px] text-slate-500 truncate" title={`${formatProjectName(projectName)}${clientName ? ` · ${clientName}` : ''}`}>
                                                    {formatProjectName(projectName)}
                                                    {clientName && ` · ${clientName}`}
                                                </p>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </CollapsibleContent>
            </Collapsible>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                <div className="flex flex-col gap-6">
                    <GlobalPlanningInconsistencies viewDate={viewDate} searchQuery={globalSearchQuery} hideProjectSearch />
                </div>

                <div className="flex flex-col gap-6">
                    <Card className="border-l-4 border-l-slate-400 flex-1">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-slate-600" />
                                Estado de proyectos
                            </CardTitle>
                            <CardDescription className="flex flex-col gap-1">
                                <span>Cómo van los proyectos este mes. Filtra por nivel de aviso si lo necesitas.</span>
                                {departmentNameForView && (
                                    <span className="text-amber-700 font-medium">
                                        Vista filtrada por departamento: {departmentNameForView}
                                    </span>
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {displayList.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground border rounded-lg bg-slate-50 border-dashed">
                                    <PlayCircle className="h-12 w-12 mx-auto mb-2 text-emerald-300" />
                                    <p className="text-sm font-medium text-slate-700">
                                        {allProjectsForView.length === 0
                                            ? (departmentNameForView ? `No hay proyectos para ${departmentNameForView} este mes.` : 'No hay proyectos este mes.')
                                            : 'Ningún proyecto con los filtros actuales.'}
                                    </p>
                                    {statusFilter !== 'all' && (
                                        <Button variant="outline" size="sm" className="mt-2" onClick={() => setStatusFilter('all')}>
                                            Ver todos
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Button
                                                variant={statusFilter === 'all' ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setStatusFilter('all')}
                                                className={cn("h-8 text-xs gap-1.5", statusFilter === 'all' ? "bg-slate-900" : "bg-white")}
                                            >
                                                <LayoutGrid className="h-3.5 w-3.5" />
                                                Todos
                                                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                                                    {filterCounts.all}
                                                </Badge>
                                            </Button>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant={statusFilter === 'no-activity' ? 'default' : 'outline'}
                                                            size="sm"
                                                            onClick={() => setStatusFilter('no-activity')}
                                                            className={cn("h-8 text-xs gap-1.5", statusFilter === 'no-activity' ? "bg-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")}
                                                        >
                                                            <Ban className="h-3.5 w-3.5" />
                                                            Sin actividad
                                                            {filterCounts['no-activity'] > 0 && (
                                                                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px] bg-slate-200">
                                                                    {filterCounts['no-activity']}
                                                                </Badge>
                                                            )}
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="bottom" className="max-w-[200px] text-center">
                                                        <p className="text-xs">Proyectos con objetivo pero sin tareas planificadas ni computadas este mes</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant={statusFilter === 'needs-planning' ? 'default' : 'outline'}
                                                            size="sm"
                                                            onClick={() => setStatusFilter('needs-planning')}
                                                            className={cn("h-8 text-xs gap-1.5", statusFilter === 'needs-planning' ? "bg-amber-600 hover:bg-amber-700" : "bg-white border-amber-200 text-amber-700 hover:bg-amber-50")}
                                                        >
                                                            <CircleDashed className="h-3.5 w-3.5" />
                                                            Falta planificar
                                                            {filterCounts['needs-planning'] > 0 && (
                                                                <Badge className={cn("ml-1 h-5 px-1.5 text-[10px]", statusFilter === 'needs-planning' ? "bg-amber-700" : "bg-amber-100 text-amber-700")}>
                                                                    {filterCounts['needs-planning']}
                                                                </Badge>
                                                            )}
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="bottom" className="max-w-[200px] text-center">
                                                        <p className="text-xs">Proyectos con tareas pendientes de completar este mes</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant={statusFilter === 'behind-schedule' ? 'default' : 'outline'}
                                                            size="sm"
                                                            onClick={() => setStatusFilter('behind-schedule')}
                                                            className={cn("h-8 text-xs gap-1.5", statusFilter === 'behind-schedule' ? "bg-orange-600 hover:bg-orange-700" : "bg-white border-orange-200 text-orange-700 hover:bg-orange-50")}
                                                        >
                                                            <Clock className="h-3.5 w-3.5" />
                                                            Retrasados
                                                            {filterCounts['behind-schedule'] > 0 && (
                                                                <Badge className={cn("ml-1 h-5 px-1.5 text-[10px]", statusFilter === 'behind-schedule' ? "bg-orange-700" : "bg-orange-100 text-orange-700")}>
                                                                    {filterCounts['behind-schedule']}
                                                                </Badge>
                                                            )}
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="bottom" className="max-w-[220px] text-center">
                                                        <p className="text-xs">Por debajo del objetivo o poco avance (ritmo bajo / poco avance)</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant={statusFilter === 'over-budget' ? 'default' : 'outline'}
                                                            size="sm"
                                                            onClick={() => setStatusFilter('over-budget')}
                                                            className={cn("h-8 text-xs gap-1.5", statusFilter === 'over-budget' ? "bg-red-600 hover:bg-red-700" : "bg-white border-red-200 text-red-700 hover:bg-red-50")}
                                                        >
                                                            <AlertOctagon className="h-3.5 w-3.5" />
                                                            Exceso horas
                                                            {filterCounts['over-budget'] > 0 && (
                                                                <Badge className={cn("ml-1 h-5 px-1.5 text-[10px]", statusFilter === 'over-budget' ? "bg-red-700" : "bg-red-100 text-red-700")}>
                                                                    {filterCounts['over-budget']}
                                                                </Badge>
                                                            )}
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="bottom" className="max-w-[200px] text-center">
                                                        <p className="text-xs">Proyectos que superan el presupuesto del mes</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant={statusFilter === 'in-rule' ? 'default' : 'outline'}
                                                            size="sm"
                                                            onClick={() => setStatusFilter('in-rule')}
                                                            className={cn("h-8 text-xs gap-1.5", statusFilter === 'in-rule' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50")}
                                                        >
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                            En regla
                                                            {filterCounts['in-rule'] > 0 && (
                                                                <Badge className={cn("ml-1 h-5 px-1.5 text-[10px]", statusFilter === 'in-rule' ? "bg-emerald-700" : "bg-emerald-100 text-emerald-700")}>
                                                                    {filterCounts['in-rule']}
                                                                </Badge>
                                                            )}
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="bottom" className="max-w-[220px] text-center">
                                                        <p className="text-xs">Al día, sin exceso y sin tareas pendientes de planificar</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </div>
                                    {displayList.length === 0 ? (
                                        <p className="text-sm text-slate-500 py-4 text-center">Ningún resultado con los filtros actuales.</p>
                                    ) : (
                                        <>
                                            <p className="text-xs text-slate-500">
                                                {displayList.length} proyecto{displayList.length !== 1 ? 's' : ''}.
                                            </p>
                                            <div className="space-y-1">
                                                {displayList.map((row, idx) => {
                                        const project = projects.find(p => p.id === row.projectId);
                                        const deptName = project?.responsibleDepartmentId
                                            ? departments.find(d => d.id === project.responsibleDepartmentId || d.name === project.responsibleDepartmentId)?.name
                                            : null;
                                        const progressPct = row.budget > 0 ? Math.min(120, (row.computed / row.budget) * 100) : 0;
                                        const isOverBudget = row.riskType === 'overBudget';
                                        const hoursRemaining = Math.max(0, row.budget - row.computed);
                                        const hoursOver = Math.max(0, row.computed - row.budget);
                                        const isExpanded = expandedAlerts.has(row.projectId);
                                        const actionPhrase = isOverBudget
                                            ? `${hoursOver.toFixed(1)}h por encima del acuerdo.`
                                            : row.riskType === 'lowProgress'
                                                ? `Faltan ${hoursRemaining.toFixed(1)}h para el objetivo del mes.`
                                                : row.riskType === 'lowPace'
                                                    ? `Ritmo bajo para llegar al objetivo.`
                                                    : row.status === 'in-rule' && hoursRemaining > 0
                                                        ? `Objetivo: ${row.budget.toFixed(1)}h. Faltan ${hoursRemaining.toFixed(1)}h por computar.`
                                                        : null;
                                        const statusLabel = row.status === 'over-budget' ? 'Exceso horas' : row.status === 'behind-schedule' ? 'Retrasados' : row.status === 'needs-planning' ? 'Falta planificar' : row.status === 'no-activity' ? 'Sin actividad' : 'En regla';
                                        return (
                                            <Collapsible
                                                key={`${row.projectId}-${idx}`}
                                                open={isExpanded}
                                                onOpenChange={() => toggleAlert(row.projectId)}
                                            >
                                                <div
                                                    className={cn(
                                                        "rounded-lg border transition-colors",
                                                        row.status === 'over-budget' ? 'bg-red-50/50 border-red-200' :
                                                        row.status === 'behind-schedule' ? 'bg-orange-50/50 border-orange-200' :
                                                        row.status === 'needs-planning' ? 'bg-amber-50/50 border-amber-200' :
                                                        row.status === 'no-activity' ? 'bg-slate-50/50 border-slate-200' :
                                                        'bg-emerald-50/30 border-emerald-200/80'
                                                    )}
                                                >
                                                    <CollapsibleTrigger asChild>
                                                        <div className="flex flex-col gap-2 p-3 hover:bg-black/5 cursor-pointer rounded-lg">
                                                            <div className="flex items-center gap-2">
                                                                <ChevronDown className={cn("h-4 w-4 text-slate-400 shrink-0 transition-transform", isExpanded && "rotate-180")} />
                                                                <div className="min-w-0 flex-1 text-left">
                                                                <h4 className="text-sm font-semibold text-slate-900 truncate">
                                                                        {formatProjectName(row.projectName)}
                                                                </h4>
                                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs text-slate-600">
                                                                        {row.clientName && <span>{row.clientName}</span>}
                                                                        {deptName && <span className="text-slate-500">· {deptName}</span>}
                                                                    </div>
                                                                </div>
                                                                <Badge
                                                                    variant="outline"
                                                                    className={cn(
                                                                        "shrink-0",
                                                                        row.status === 'over-budget' && "bg-red-100 text-red-800 border-red-200",
                                                                        row.status === 'behind-schedule' && "bg-orange-100 text-orange-800 border-orange-200",
                                                                        row.status === 'needs-planning' && "bg-amber-100 text-amber-800 border-amber-200",
                                                                        row.status === 'no-activity' && "bg-slate-100 text-slate-700 border-slate-200",
                                                                        row.status === 'in-rule' && "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                                    )}
                                                                >
                                                                    {statusLabel}
                                                                </Badge>
                                                            </div>
                                                            {row.budget > 0 && (
                                                                <div className="flex flex-wrap items-center gap-3 pl-6">
                                                                    <div className="flex items-baseline gap-1.5">
                                                                        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Contratadas</span>
                                                                        <span className="font-mono text-sm font-semibold text-slate-800">{row.budget}h</span>
                                                                    </div>
                                                                    <div className="flex items-baseline gap-1.5">
                                                                        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Computadas</span>
                                                                        <span className={cn("font-mono text-sm font-semibold", isOverBudget ? "text-red-600" : "text-amber-600")}>{row.computed.toFixed(1)}h</span>
                                                                    </div>
                                                                    <div className="flex items-baseline gap-1.5">
                                                                        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Por computar</span>
                                                                        <span className="font-mono text-sm font-semibold text-blue-600">{hoursRemaining.toFixed(1)}h</span>
                                                                    </div>
                                                                    <div className="flex-1 min-w-[80px] flex items-center gap-2">
                                                                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-[120px]">
                                                                            <div
                                                                                className={cn(
                                                                                    "h-full rounded-full transition-all",
                                                                                    isOverBudget ? "bg-red-500" : progressPct >= 90 ? "bg-amber-500" : "bg-emerald-500"
                                                                                )}
                                                                                style={{ width: `${Math.min(100, progressPct)}%` }}
                                                                            />
                                                                        </div>
                                                                        <span className={cn(
                                                                            "text-xs font-semibold tabular-nums",
                                                                            isOverBudget ? "text-red-600" : progressPct >= 90 ? "text-amber-600" : "text-emerald-600"
                                                                        )}>
                                                                            {isOverBudget && progressPct > 100 ? `>100%` : `${Math.min(100, Math.round(progressPct))}%`}
                                                                        </span>
                                                                    </div>
                                                                    {(() => {
                                                                        const pendingCount = projectDetailsByProjectId.get(row.projectId)?.pendingTasks.length ?? 0;
                                                                        if (pendingCount > 0) {
                                                                            return (
                                                                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                                                                                    {pendingCount} pendientes
                                                                                </span>
                                                                            );
                                                                        }
                                                                        return null;
                                                                    })()}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </CollapsibleTrigger>
                                                    <CollapsibleContent>
                                                        <div className="px-3 pb-3 pt-0 flex flex-col gap-3 border-t border-slate-200/80 mt-0 pt-2">
                                                            {row.budget > 0 && (() => {
                                                                const detail = projectDetailsByProjectId.get(row.projectId);
                                                                const effectiveUsage = detail?.effectiveUsage ?? row.planned + row.computed;
                                                                const planningPct = detail?.planningPct ?? (row.budget > 0 ? (effectiveUsage / row.budget) * 100 : 0);
                                                                const realPct = detail?.realPct ?? (row.budget > 0 ? (row.actual / row.budget) * 100 : 0);
                                                                const computedPct = detail?.computedPct ?? row.progressOperational;
                                                                return (
                                                                    <div className="space-y-1.5">
                                                                        <div className="flex justify-between text-[10px] text-slate-600">
                                                                            <span>
                                                                                {effectiveUsage > row.planned ? (
                                                                                    <><span className="font-semibold text-slate-800">{round2(effectiveUsage)}h</span> proyección</>
                                                                                ) : (
                                                                                    <><span className="font-semibold text-slate-800">{round2(row.planned)}h</span> estimadas</>
                                                                                )}
                                                                                {effectiveUsage < row.budget && (
                                                                                    <span className="text-amber-600 ml-1">
                                                                                        (Faltan {round2(row.budget - effectiveUsage)}h de {row.budget}h asignadas)
                                                                                    </span>
                                                                                )}
                                                                                {effectiveUsage > row.budget && (
                                                                                    <span className="text-red-600 ml-1">(+{round2(effectiveUsage - row.budget)}h de exceso)</span>
                                                                                )}
                                                                            </span>
                                                                            <span className="text-slate-500">Asignadas: <span className="font-semibold">{row.budget}h</span></span>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-[10px] text-slate-400 w-14">Estimado</span>
                                                                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                                    <div className={cn("h-full rounded-full", isOverBudget ? "bg-red-500" : "bg-blue-500")} style={{ width: `${Math.min(100, planningPct)}%` }} />
                                                                                </div>
                                                                                <span className="text-[10px] font-medium text-slate-600 w-10 text-right">{round2(planningPct)}%</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-[10px] text-slate-400 w-14">Real</span>
                                                                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, realPct)}%` }} />
                                                                                </div>
                                                                                <span className="text-[10px] font-medium text-blue-600 w-10 text-right">{round2(realPct)}%</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-[10px] text-slate-400 w-14">Computado</span>
                                                                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, computedPct)}%` }} />
                                                                                </div>
                                                                                <span className="text-[10px] font-medium text-emerald-600 w-10 text-right">{round2(computedPct)}%</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })()}
                                                            {actionPhrase && (
                                                                <p className="text-xs text-slate-700 font-medium leading-snug">{actionPhrase}</p>
                                                            )}
                                                            {(() => {
                                                                const detail = projectDetailsByProjectId.get(row.projectId);
                                                                const pending = detail?.pendingTasks ?? [];
                                                                return (
                                                                    <div className="border-t border-slate-200/80 pt-2 mt-0">
                                                                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                                                            Tareas pendientes del equipo ({pending.length})
                                                                        </h4>
                                                                        {pending.length > 0 ? (
                                                                            <div className="space-y-1.5">
                                                                                {pending.map(task => {
                                                                                    const emp = employees?.find(e => e.id === task.employeeId);
                                                                                    return (
                                                                                        <div key={task.id} className="flex items-center justify-between py-2 px-2 bg-white border rounded-md text-xs">
                                                                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                                                                <Avatar className="h-6 w-6 border shrink-0">
                                                                                                    <AvatarImage src={emp?.avatarUrl} />
                                                                                                    <AvatarFallback className="bg-slate-100 text-slate-600 text-[9px] font-bold">
                                                                                                        {emp?.name?.substring(0, 2).toUpperCase() ?? '??'}
                                                                                                    </AvatarFallback>
                                                                                                </Avatar>
                                                                                                <div className="min-w-0 flex-1">
                                                                                                    <p className="font-medium truncate text-slate-800">{task.taskName || 'Tarea'}</p>
                                                                                                    <p className="text-[10px] text-slate-400">{emp?.name} · Sem {format(parseISO(task.weekStartDate), 'w')}</p>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="text-right shrink-0">
                                                                                                <p className="font-mono font-bold text-slate-800">{task.hoursAssigned ?? 0}h</p>
                                                                                                <p className="text-[10px] text-slate-400">estimadas</p>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        ) : (
                                                                            <p className="text-[11px] text-slate-400 text-center py-3 bg-slate-50 rounded-md border border-dashed">
                                                                                Sin tareas pendientes este mes
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })()}
                                                            {(() => {
                                                                const detail = projectDetailsByProjectId.get(row.projectId);
                                                                const completed = detail?.completedTasks ?? [];
                                                                if (completed.length === 0) return null;
                                                                return (
                                                                    <Collapsible>
                                                                        <CollapsibleTrigger asChild>
                                                                            <div className="flex items-center justify-between py-2 border-t border-slate-200/80 cursor-pointer hover:bg-slate-50/50 rounded px-2 -mx-2">
                                                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                                                    Tareas completadas ({completed.length})
                                                                                </span>
                                                                                <ChevronDown className="h-4 w-4 text-slate-400" />
                                                                            </div>
                                                                        </CollapsibleTrigger>
                                                                        <CollapsibleContent>
                                                                            <div className="space-y-1.5 pt-2">
                                                                                {completed.map(task => {
                                                                                    const emp = employees?.find(e => e.id === task.employeeId);
                                                                                    return (
                                                                                        <div key={task.id} className="flex items-center justify-between py-2 px-2 bg-slate-50/50 border rounded-md text-xs">
                                                                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                                                                <Avatar className="h-6 w-6 border shrink-0">
                                                                                                    <AvatarImage src={emp?.avatarUrl} />
                                                                                                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-[9px] font-bold">
                                                                                                        {emp?.name?.substring(0, 2).toUpperCase() ?? '??'}
                                                                                                    </AvatarFallback>
                                                                                                </Avatar>
                                                                                                <div className="min-w-0 flex-1">
                                                                                                    <p className="font-medium truncate text-slate-800">{task.taskName || 'Tarea'}</p>
                                                                                                    <p className="text-[10px] text-slate-400">{emp?.name} · Sem {format(parseISO(task.weekStartDate), 'w')}</p>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="text-right shrink-0 space-y-0.5">
                                                                                                <p className="font-mono text-[10px] text-slate-600">Est: {task.hoursAssigned ?? 0}h</p>
                                                                                                <p className="font-mono text-[10px] text-blue-600">Real: {task.hoursActual ?? task.hoursAssigned ?? 0}h</p>
                                                                                                <p className="font-mono text-[10px] text-emerald-600">Comp: {task.hoursComputed ?? task.hoursAssigned ?? 0}h</p>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </CollapsibleContent>
                                                                    </Collapsible>
                                                                );
                                                            })()}
                                                        </div>
                                                    </CollapsibleContent>
                                                </div>
                                            </Collapsible>
                                        );
                                    })}
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
