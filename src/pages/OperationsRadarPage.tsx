import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useAgency } from '@/contexts/AgencyContext';
import { useDepartmentView } from '@/contexts/DepartmentViewContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Activity, ChevronDown, GitBranch } from 'lucide-react';
import { GlobalPlanningInconsistencies } from '@/components/employee/GlobalPlanningInconsistencies';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useProjectMetrics } from '@/hooks/useProjectMetrics';
import { useProjectAliasing } from '@/hooks/useProjectAliasing';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SensitiveText } from '@/components/privacy/SensitiveText';
import { normalizeDepartments } from '@/utils/departmentUtils';
import { isAllocationInEffectiveMonth } from '@/utils/dateUtils';
import type { Allocation } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getEffectiveCompletedHours } from '@/utils/hoursTracking';
import { useOperationsRadarMonthState } from '@/hooks/useOperationsRadarMonthState';
import { useOperationsRadarData, type ProjectRowItem, type ProjectStatusType } from '@/hooks/useOperationsRadarData';
import { round2 } from '@/utils/numbers';
import { useAppTranslation } from '@/hooks/useAppTranslation';

export default function OperationsRadarPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { projects, clients, allocations, employees, ensureMonthLoaded } = useApp();
    const { currentAgency } = useAgency();
    const { selectedDepartmentId, setSelectedDepartmentId } = useDepartmentView();
    const { formatName: formatProjectName } = useProjectAliasing();
    const { t } = useAppTranslation();

    const [globalSearchQuery, setGlobalSearchQuery] = useState('');

    const departments = useMemo(
        () => normalizeDepartments(currentAgency?.settings?.departments),
        [currentAgency?.settings?.departments]
    );

    const {
        viewDate,
        deadlines,
        isCurrentMonth,
        currentWeekOfMonth,
        isEndOfMonth,
        handlePrevMonth,
        handleNextMonth,
        handleToday,
    } = useOperationsRadarMonthState({
        searchParams,
        navigate,
        ensureMonthLoaded,
        currentAgencyId: currentAgency?.id,
    });

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


    const { projectMetrics } = useProjectMetrics({
        month: viewDate,
        deadlines
    });


    const { employeesForView, allProjectsForView } = useOperationsRadarData({
        projectMetrics,
        viewDate,
        isEndOfMonth,
        radarLowProgressExcludeKeywords: currentAgency?.settings?.radarLowProgressExcludeKeywords ?? [],
        selectedDepartmentId,
        departments,
        employees,
        allocations,
        projects,
    });

    const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatusType>('all');

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
            const hoursComputed = completedTasks.reduce((s, a) => s + getEffectiveCompletedHours(a, currentAgency?.settings?.hoursTrackingPreference), 0);
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
                taskName: wa.taskName || t('operationsRadar.unnamedTask', 'Tarea sin nombre'),
                employeeName: employees?.find(e => e.id === wa.employeeId)?.name ?? t('operationsRadar.somebody', 'Alguien'),
                allocationId: wa.id,
                employeeId: wa.employeeId,
            }));

            return {
                allocation,
                projectName: project?.name ?? '',
                clientName: client?.name ?? '',
                clientId: client?.id,
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
                            {t('operationsRadar.title')}
                        </h1>
                        <p className="text-slate-500 mt-1">
                            {t('operationsRadar.description')}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1 bg-white rounded-lg border p-1 shadow-sm">
                            <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-9 w-9 text-slate-500" aria-label={t('operationsRadar.prevMonth')}>
                                &lt;
                            </Button>
                            <Button variant="ghost" onClick={handleToday} className="h-9 px-3 text-sm font-medium text-slate-700 capitalize">
                                {format(viewDate, 'MMM yyyy', { locale: es })}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-9 w-9 text-slate-500" aria-label={t('operationsRadar.nextMonth')}>
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
                                ? t('operationsRadar.blockingTasks', { count: blockingTasksForView.length, defaultValue: '{{count}} tareas bloquean al equipo' })
                                : t('operationsRadar.noBlockingTasks', 'Nada bloquea al equipo este mes')}
                        </span>
                        <ChevronDown className={cn("h-4 w-4 text-slate-400 shrink-0 transition-transform", blockingSectionOpen && "rotate-180")} />
                    </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="px-4 pb-3 pt-0 border-t border-slate-100">
                        {blockingTasksForView.length === 0 ? (
                            <p className="text-xs text-slate-500 pt-3">{t('operationsRadar.noBlockingDetails', 'Todas las tareas de las que dependen otras están completadas o no hay dependencias este mes.')}</p>
                        ) : (
                            <ul className="space-y-2 pt-3">
                                {blockingTasksForView.map(({ allocation, projectName, clientName, clientId, blockerEmployee, waitingEmployees, blockedTaskDetails }) => {
                                    const blockerName = blockerEmployee?.name ?? t('operationsRadar.somebody', 'Alguien');
                                    const blockerTaskName = allocation.taskName || t('operationsRadar.unnamedTask', 'Tarea sin nombre');

                                    return (
                                        <li key={allocation.id} className="flex items-start gap-3 py-3 px-3 rounded-md bg-slate-50/80 text-xs border border-slate-100">
                                            <Avatar className="h-8 w-8 border shrink-0 ring-2 ring-amber-200">
                                                <AvatarImage src={blockerEmployee?.avatarUrl} />
                                                <AvatarFallback className="bg-amber-100 text-amber-800 text-[10px] font-bold">
                                                    {blockerName.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1 space-y-1.5">
                                                {/* Proyecto arriba: contexto visible sin bajar al final de la tarjeta */}
                                                <div className="rounded-md border border-indigo-100 bg-indigo-50/70 px-2 py-1.5">
                                                    <p className="text-[10px] font-medium uppercase tracking-wide text-indigo-600/90">
                                                        {t('operationsRadar.blockingCardProjectLabel', 'Proyecto')}
                                                    </p>
                                                    <p
                                                        className="mt-0.5 text-sm font-semibold leading-snug text-slate-900"
                                                        title={`${formatProjectName(projectName)}${clientName ? ` · ${clientName}` : ''}`}
                                                    >
                                                        <SensitiveText kind="project" id={allocation.projectId}>
                                                            {formatProjectName(projectName)}
                                                        </SensitiveText>
                                                        {clientName && clientId && (
                                                            <>
                                                                <span className="font-normal text-slate-500"> · </span>
                                                                <SensitiveText kind="account" id={clientId} className="font-medium text-slate-700">
                                                                    {clientName}
                                                                </SensitiveText>
                                                            </>
                                                        )}
                                                        {clientName && !clientId && (
                                                            <>
                                                                <span className="font-normal text-slate-500"> · </span>
                                                                <span className="font-medium text-slate-700">{clientName}</span>
                                                            </>
                                                        )}
                                                    </p>
                                                </div>
                                                {/* Quién bloquea a quién */}
                                                <p className="text-sm font-semibold text-slate-800">
                                                    <span className="text-amber-700">
                                                        <SensitiveText kind="employee" id={allocation.employeeId}>{blockerName}</SensitiveText>
                                                    </span>
                                                    {t('operationsRadar.blocks', ' bloquea a ')}
                                                    <span className="text-slate-700">
                                                        {waitingEmployees.length === 0
                                                            ? t('operationsRadar.otherTasks', 'otras tareas')
                                                            : waitingEmployees.map((e, i) => (
                                                                <span key={e.id}>
                                                                    {i > 0 && ', '}
                                                                    <SensitiveText kind="employee" id={e.id}>{e.name}</SensitiveText>
                                                                </span>
                                                            ))}
                                                    </span>
                                                </p>
                                                {/* Tarea del bloqueador */}
                                                <p className="text-[11px] text-slate-600">
                                                    <span className="font-medium text-slate-500">{t('operationsRadar.blockerTask', 'Tarea bloqueadora:')}</span>{' '}
                                                    <span className="text-slate-800" title={blockerTaskName}>
                                                        <SensitiveText kind="task" id={allocation.id}>{blockerTaskName}</SensitiveText>
                                                    </span>
                                                </p>
                                                {/* Tarea(s) bloqueada(s): una sola en la misma línea que la etiqueta (como tarea bloqueadora); varias en lista */}
                                                {blockedTaskDetails.length > 0 && (
                                                    blockedTaskDetails.length === 1 ? (
                                                        <p className="text-[11px] text-slate-600">
                                                            <span className="font-medium text-slate-500">
                                                                {t('operationsRadar.blockedTask_one', 'Tarea bloqueada:')}
                                                            </span>{' '}
                                                            <span className="text-slate-800">
                                                                <SensitiveText kind="task" id={blockedTaskDetails[0].allocationId}>
                                                                    {blockedTaskDetails[0].taskName}
                                                                </SensitiveText>
                                                            </span>
                                                            <span className="text-slate-500">
                                                                {' '}
                                                                (
                                                                <SensitiveText kind="employee" id={blockedTaskDetails[0].employeeId}>
                                                                    {blockedTaskDetails[0].employeeName}
                                                                </SensitiveText>
                                                                )
                                                            </span>
                                                        </p>
                                                    ) : (
                                                        <div className="text-[11px]">
                                                            <span className="font-medium text-slate-500">
                                                                {t('operationsRadar.blockedTask_other', 'Tareas bloqueadas:')}
                                                            </span>
                                                            <ul className="mt-0.5 list-none space-y-0.5 pl-0">
                                                                {blockedTaskDetails.map((b, i) => (
                                                                    <li key={i} className="text-slate-700">
                                                                        ·{' '}
                                                                        <span className="text-slate-800">
                                                                            <SensitiveText kind="task" id={b.allocationId}>{b.taskName}</SensitiveText>
                                                                        </span>
                                                                        <span className="text-slate-500">
                                                                            {' '}
                                                                            (
                                                                            <SensitiveText kind="employee" id={b.employeeId}>{b.employeeName}</SensitiveText>
                                                                            )
                                                                        </span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </CollapsibleContent>
            </Collapsible>

            <GlobalPlanningInconsistencies
                viewDate={viewDate}
                searchQuery={globalSearchQuery}
                onSearchQueryChange={setGlobalSearchQuery}
                hideProjectSearch
                operationsRadar={{
                    rowsWithStatus,
                    statusFilter,
                    onStatusFilterChange: setStatusFilter,
                    filterCounts,
                    projectDetailsByProjectId,
                }}
            />
        </div>
    );
}
