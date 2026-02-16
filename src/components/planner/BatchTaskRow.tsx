import { format, startOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, X, Plus, Trash2, AlertTriangle, Link as LinkIcon, User } from 'lucide-react';
import { Project, Employee, Allocation, NewTaskRow, Client, Deadline } from '@/types';
import { ProjectBudgetStatus } from '@/hooks/useAllocationSheet';
import { useState, useMemo } from 'react';
import { isAllocationInEffectiveMonth } from '@/utils/dateUtils';
import { useProjectAliasing } from '@/hooks/useProjectAliasing';

interface BatchTaskRowProps {
    task: NewTaskRow;
    otherTasks: NewTaskRow[]; // To calculate cumulative impact
    updateTaskRow: (id: string, field: keyof NewTaskRow, value: any) => void;
    removeTaskRow: (id: string) => void;
    canRemove: boolean;
    activeProjects: Project[];
    weeks: { weekStart: Date }[];
    employees: Employee[];
    clients: Client[];
    getProjectBudgetStatus: (projectId: string) => ProjectBudgetStatus;
    getAvailableDependencies: (projectId: string) => Allocation[];
    getWeekExceedStatus?: (weekDate: string) => boolean;
    canAssignToOthers?: boolean; // Si puede asignar tareas a otros empleados
    currentEmployeeId?: string; // ID del empleado actual
    deadlines?: Deadline[]; // Deadlines del mes
    allocations?: Allocation[]; // Todas las allocations para calcular horas del empleado
    viewDate?: Date; // Fecha del mes para filtrar allocations
}

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

export function BatchTaskRow({
    task,
    otherTasks,
    updateTaskRow,
    removeTaskRow,
    canRemove,
    activeProjects,
    weeks,
    employees,
    clients,
    getProjectBudgetStatus,
    getAvailableDependencies,
    getWeekExceedStatus,
    canAssignToOthers = false,
    currentEmployeeId,
    deadlines = [],
    allocations = [],
    viewDate
}: BatchTaskRowProps) {
    const [openCombobox, setOpenCombobox] = useState(false);
    const [openEmployeeCombobox, setOpenEmployeeCombobox] = useState(false);
    const { formatName: formatProjectName } = useProjectAliasing();

    // Ordenar proyectos: primero los que tienen deadline asignado al empleado de la tarea, luego el resto
    const taskEmployeeIdForSort = task.employeeId || currentEmployeeId;
    const { projectsWithDeadline, projectsWithoutDeadline } = useMemo(() => {
        if (!viewDate || !taskEmployeeIdForSort || deadlines.length === 0) {
            return { projectsWithDeadline: [], projectsWithoutDeadline: activeProjects };
        }
        const monthKey = format(startOfMonth(viewDate), 'yyyy-MM');
        const withDeadline: Project[] = [];
        const withoutDeadline: Project[] = [];
        for (const p of activeProjects) {
            const d = deadlines.find(d => d.projectId === p.id && d.month === monthKey && !d.isHidden);
            const hours = d?.employeeHours[taskEmployeeIdForSort] ?? 0;
            if (hours > 0) withDeadline.push(p);
            else withoutDeadline.push(p);
        }
        return { projectsWithDeadline: withDeadline, projectsWithoutDeadline: withoutDeadline };
    }, [activeProjects, deadlines, viewDate, taskEmployeeIdForSort]);

    const sortedProjectsForSelector = useMemo(
        () => [...projectsWithDeadline, ...projectsWithoutDeadline],
        [projectsWithDeadline, projectsWithoutDeadline]
    );

    // Calcular si esta tarea excede las horas contratadas
    const taskProject = task.projectId ? activeProjects.find(p => p.id === task.projectId) : null;
    const taskHours = parseFloat(task.hours) || 0;

    // Calcular horas del deadline del empleado para este proyecto
    // Usar el empleado asignado a la tarea, o el empleado actual si no hay uno asignado
    const taskEmployeeId = task.employeeId || currentEmployeeId;
    const deadlineInfo = useMemo(() => {
        if (!task.projectId || !taskEmployeeId || !viewDate) return null;

        const monthKey = format(startOfMonth(viewDate), 'yyyy-MM');
        const deadline = deadlines.find(d => d.projectId === task.projectId && d.month === monthKey && !d.isHidden);
        if (!deadline) return null;

        const deadlineHours = deadline.employeeHours[taskEmployeeId] || 0;
        if (deadlineHours === 0) return null;

        // Calcular horas ya asignadas del empleado en este proyecto
        const employeeAllocations = allocations.filter(a =>
            a.employeeId === taskEmployeeId &&
            a.projectId === task.projectId &&
            isAllocationInEffectiveMonth(a.weekStartDate, viewDate)
        );

        const planned = employeeAllocations
            .filter(a => a.status !== 'completed')
            .reduce((sum, a) => sum + (a.hoursAssigned || 0), 0);

        const computed = employeeAllocations
            .filter(a => a.status === 'completed')
            .reduce((sum, a) => sum + (a.hoursComputed || 0), 0);

        // Sumar horas de otras tareas del mismo proyecto y empleado en este formulario
        const otherTasksSameProjectAndEmployee = otherTasks
            .filter(t => t.id !== task.id && t.projectId === task.projectId && (t.employeeId || currentEmployeeId) === taskEmployeeId)
            .reduce((sum, t) => sum + (parseFloat(t.hours) || 0), 0);

        const totalAssigned = round2(planned + computed + otherTasksSameProjectAndEmployee + taskHours);
        const remaining = round2(deadlineHours - totalAssigned);

        return {
            deadlineHours,
            totalAssigned,
            remaining,
            exceeds: totalAssigned > deadlineHours,
            employeeId: taskEmployeeId
        };
    }, [task.projectId, task.hours, task.employeeId, taskEmployeeId, currentEmployeeId, deadlines, allocations, viewDate, otherTasks, task.id]);

    // Horas ya planificadas de este proyecto (del formulario actual, excluyendo esta fila)
    const otherTasksHours = otherTasks
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

    // Validación de fila incompleta
    const isIncomplete = !task.projectId || !task.taskName || !task.hours || !task.weekDate;

    // Validación de semana sobrecargada (si se pasa la prop)
    const isWeekOverloaded = task.weekDate && getWeekExceedStatus ? getWeekExceedStatus(task.weekDate) : false;

    return (
        <div className={cn(
            "flex flex-col gap-3 p-4 rounded-xl border transition-all bg-white shadow-sm hover:shadow-md",
            isIncomplete ? "border-slate-200" : "border-slate-200",
            isIncomplete && (otherTasks.length > 0) && "border-l-4 border-l-amber-300 left-border-fix"
        )}>
            {/* Fila 1: Proyecto + Nombre de tarea (apilado en móvil) */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                {/* Selector de Proyecto */}
                <div className="w-full sm:w-[280px] sm:shrink-0 min-w-0">
                    <Popover open={openCombobox} onOpenChange={setOpenCombobox} modal={true}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                    "w-full justify-between h-11 sm:h-9 min-h-[44px] sm:min-h-0 px-3 text-left font-normal text-sm",
                                    !task.projectId && "text-muted-foreground",
                                    willExceed && "border-amber-300 bg-amber-50 text-amber-900"
                                )}>
                                <span className="truncate text-sm">
                                    {task.projectId ? formatProjectName(activeProjects.find((p) => p.id === task.projectId)?.name || '') : "Seleccionar proyecto..."}
                                </span>
                                <div className="flex items-center gap-2 opacity-50 shrink-0">
                                    {willExceed && <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />}
                                    <Plus className="h-3.5 w-3.5" />
                                </div>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[calc(100vw-2rem)] max-w-[450px] p-0" align="start">
                            <Command
                                filter={(value, search) => {
                                    if (value.toLowerCase().includes(search.toLowerCase())) return 1;
                                    return 0;
                                }}
                            >
                                <CommandInput placeholder="Buscar proyecto..." />
                                <CommandList className="max-h-[280px] overflow-y-auto overscroll-contain">
                                    <CommandEmpty>No hay.</CommandEmpty>
                                    <CommandGroup heading={projectsWithDeadline.length > 0 ? "Proyectos (primero con tu deadline)" : "Proyectos"}>
                                        {sortedProjectsForSelector.map((project) => {
                                            const client = clients.find(c => c.id === project.clientId);
                                            const budgetStatus = getProjectBudgetStatus(project.id);
                                            const totalUsed = budgetStatus.totalComputed + budgetStatus.totalPlanned;
                                            const remaining = budgetStatus.budgetMax > 0 ? budgetStatus.budgetMax - totalUsed : null;

                                            const computedPct = budgetStatus.budgetMax > 0
                                                ? Math.round((budgetStatus.totalComputed / budgetStatus.budgetMax) * 100)
                                                : 0;

                                            const plannedPct = budgetStatus.budgetMax > 0
                                                ? Math.round((budgetStatus.totalPlanned / budgetStatus.budgetMax) * 100)
                                                : 0;

                                            // Calcular deadline del empleado para este proyecto
                                            // En el selector, mostrar el deadline del empleado asignado en la tarea (si existe) o del empleado actual
                                            const taskEmployeeId = task.employeeId || currentEmployeeId;
                                            let projectDeadlineInfo: { deadlineHours: number; totalAssigned: number; employeeName?: string } | null = null;
                                            if (taskEmployeeId && viewDate) {
                                                const monthKey = format(startOfMonth(viewDate), 'yyyy-MM');
                                                const deadline = deadlines.find(d => d.projectId === project.id && d.month === monthKey && !d.isHidden);
                                                if (deadline) {
                                                    const deadlineHours = deadline.employeeHours[taskEmployeeId] || 0;
                                                    if (deadlineHours > 0) {
                                                        const employeeAllocations = allocations.filter(a =>
                                                            a.employeeId === taskEmployeeId &&
                                                            a.projectId === project.id &&
                                                            isAllocationInEffectiveMonth(a.weekStartDate, viewDate)
                                                        );

                                                        const planned = employeeAllocations
                                                            .filter(a => a.status !== 'completed')
                                                            .reduce((sum, a) => sum + (a.hoursAssigned || 0), 0);

                                                        const computed = employeeAllocations
                                                            .filter(a => a.status === 'completed')
                                                            .reduce((sum, a) => sum + (a.hoursComputed || 0), 0);

                                                        // Sumar horas de otras tareas del mismo proyecto y empleado en este formulario
                                                        const otherTasksSameProjectAndEmployee = otherTasks
                                                            .filter(t => t.id !== task.id && t.projectId === project.id && (t.employeeId || currentEmployeeId) === taskEmployeeId)
                                                            .reduce((sum, t) => sum + (parseFloat(t.hours) || 0), 0);

                                                        // Si esta es la tarea actual y el proyecto coincide, sumar sus horas también
                                                        const currentTaskHours = (task.projectId === project.id && (task.employeeId || currentEmployeeId) === taskEmployeeId)
                                                            ? (parseFloat(task.hours) || 0)
                                                            : 0;

                                                        const totalAssigned = round2(planned + computed + otherTasksSameProjectAndEmployee + currentTaskHours);
                                                        const employee = employees.find(e => e.id === taskEmployeeId);
                                                        projectDeadlineInfo = {
                                                            deadlineHours,
                                                            totalAssigned,
                                                            employeeName: employee?.name
                                                        };
                                                    }
                                                }
                                            }

                                            // Search value includes client name for better filtering
                                            const searchValue = `${project.name} ${client?.name || ''}`;

                                            return (
                                                <CommandItem key={project.id} value={searchValue} onSelect={() => { updateTaskRow(task.id, 'projectId', project.id); setOpenCombobox(false); }}>
                                                    <Check className={cn("mr-2 h-4 w-4 shrink-0", task.projectId === project.id ? "opacity-100" : "opacity-0")} />
                                                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: client?.color || '#6b7280' }} />
                                                            <span className="truncate font-medium">
                                                                {formatProjectName(project.name)}
                                                                {client?.name && <span className="ml-1 text-[10px] text-slate-400 font-normal">({client.name})</span>}
                                                            </span>
                                                            {budgetStatus.budgetMax > 0 && (
                                                                <div className="ml-auto flex items-center gap-1 shrink-0">
                                                                    <span className={cn(
                                                                        "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                                                                        computedPct > 100 ? "bg-red-100 text-red-700" :
                                                                            computedPct > 85 ? "bg-amber-100 text-amber-700" :
                                                                                "bg-emerald-100 text-emerald-700"
                                                                    )}>
                                                                        {computedPct}%
                                                                    </span>
                                                                    {plannedPct > 0 && (
                                                                        <span className="text-[10px] text-slate-400 font-medium">
                                                                            (+{plannedPct}% plan.)
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] pl-4 text-slate-500 flex justify-between items-center gap-2">
                                                            <span className="truncate">
                                                                {budgetStatus.budgetMax > 0
                                                                    ? (
                                                                        <span>
                                                                            <span className="font-medium text-slate-700">{budgetStatus.totalComputed.toFixed(1)}h</span>
                                                                            {budgetStatus.totalPlanned > 0 && <span className="text-slate-400"> +{budgetStatus.totalPlanned.toFixed(1)}h</span>}
                                                                            <span className="text-slate-400"> / {budgetStatus.budgetMax}h</span>
                                                                        </span>
                                                                    )
                                                                    : 'Sin límite'}
                                                            </span>
                                                            {remaining !== null && (
                                                                <span className={cn("shrink-0", remaining < 0 ? "text-red-600 font-bold" : "text-slate-400")}>
                                                                    {remaining > 0 ? `${remaining.toFixed(1)}h rest.` : `${Math.abs(remaining).toFixed(1)}h ex.`}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {/* Indicador de deadline del empleado */}
                                                        {projectDeadlineInfo && (
                                                            <div className="text-[10px] pl-4 flex items-center gap-1.5 mt-0.5">
                                                                <span className={cn(
                                                                    "font-medium",
                                                                    taskEmployeeId === currentEmployeeId ? "text-blue-600" : "text-indigo-600"
                                                                )}>
                                                                    {taskEmployeeId === currentEmployeeId ? "Tu deadline:" : `${projectDeadlineInfo.employeeName || 'Su'} deadline:`}
                                                                </span>
                                                                <span className={cn(
                                                                    "font-bold",
                                                                    projectDeadlineInfo.totalAssigned > projectDeadlineInfo.deadlineHours ? "text-red-600" :
                                                                        projectDeadlineInfo.totalAssigned >= projectDeadlineInfo.deadlineHours * 0.9 ? "text-amber-600" :
                                                                            taskEmployeeId === currentEmployeeId ? "text-blue-600" : "text-indigo-600"
                                                                )}>
                                                                    {projectDeadlineInfo.totalAssigned.toFixed(1)} / {projectDeadlineInfo.deadlineHours}h
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </CommandItem>
                                            );
                                        })}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Nombre de la tarea */}
                <Input
                    className="flex-1 min-w-0 h-11 sm:h-9 min-h-[44px] sm:min-h-0 text-sm"
                    placeholder="Nombre de la tarea"
                    value={task.taskName}
                    onChange={(e) => updateTaskRow(task.id, 'taskName', e.target.value)}
                />
            </div>

            {/* Fila 2: Detalles adicionales (apilado en móvil para evitar scroll horizontal) */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                {/* Selector de empleado (solo si tiene permiso) */}
                {canAssignToOthers && (
                    <div className="w-full sm:w-[160px] sm:shrink-0 min-w-0">
                        <Popover open={openEmployeeCombobox} onOpenChange={setOpenEmployeeCombobox} modal={true}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                        "w-full justify-between h-11 sm:h-9 min-h-[44px] sm:min-h-0 px-3 text-left font-normal text-xs",
                                        !task.employeeId && "text-muted-foreground"
                                    )}>
                                    <span className="truncate text-xs flex items-center gap-1.5">
                                        <User className="h-3 w-3" />
                                        {task.employeeId
                                            ? employees.find((e) => e.id === task.employeeId)?.name || 'Empleado...'
                                            : currentEmployeeId
                                                ? employees.find((e) => e.id === currentEmployeeId)?.name || 'Yo'
                                                : 'Asignar a...'}
                                    </span>
                                    <Plus className="h-3 w-3 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[calc(100vw-2rem)] max-w-[300px] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Buscar empleado..." />
                                    <CommandList>
                                        <CommandEmpty>No se encontró empleado.</CommandEmpty>
                                        <CommandGroup>
                                            {employees.filter(e => e.isActive).map((emp) => (
                                                <CommandItem
                                                    key={emp.id}
                                                    value={`${emp.name} ${emp.first_name || ''} ${emp.last_name || ''}`}
                                                    onSelect={() => {
                                                        updateTaskRow(task.id, 'employeeId', emp.id);
                                                        setOpenEmployeeCombobox(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            task.employeeId === emp.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    <span className="text-sm">{emp.name || emp.first_name || 'Sin nombre'}</span>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                )}

                <div className="w-full sm:w-[140px] min-w-0">
                    <Select value={task.dependencyId || 'none'} onValueChange={(v) => updateTaskRow(task.id, 'dependencyId', v)} disabled={!task.projectId}>
                        <SelectTrigger className="w-full h-11 sm:h-9 min-h-[44px] sm:min-h-0 text-xs px-2"><SelectValue placeholder="Sin dep." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">-- Sin dependencia --</SelectItem>
                            {getAvailableDependencies(task.projectId).map(dep => {
                                const owner = employees.find(e => e.id === dep.employeeId);
                                return <SelectItem key={dep.id} value={dep.id} className="text-xs">{dep.taskName} ({owner?.name?.substring(0, 6)}..)</SelectItem>;
                            })}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 sm:flex sm:flex-nowrap gap-2 sm:gap-3 items-center">
                    <Input
                        type="number"
                        className={cn("w-full min-w-0 h-11 sm:h-9 min-h-[44px] sm:min-h-0 text-center text-sm font-medium font-mono", willExceed && "border-amber-300 bg-amber-50 text-amber-700", "sm:w-20")}
                        placeholder="h"
                        value={task.hours}
                        onChange={(e) => updateTaskRow(task.id, 'hours', e.target.value)}
                        step="0.5"
                    />
                    <div className="min-w-0 sm:w-32">
                        <Select value={task.weekDate} onValueChange={(v) => updateTaskRow(task.id, 'weekDate', v)}>
                            <SelectTrigger className={cn("w-full h-11 sm:h-9 min-h-[44px] sm:min-h-0 text-xs pl-2 pr-1", isWeekOverloaded && "border-red-300 text-red-700 bg-red-50")}>
                                <SelectValue placeholder="Semana" />
                            </SelectTrigger>
                            <SelectContent>{weeks.map((w, i) => (<SelectItem key={w.weekStart.toISOString()} value={format(w.weekStart, 'yyyy-MM-dd')}>Sem {i + 1}</SelectItem>))}</SelectContent>
                        </Select>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 sm:h-9 sm:w-9 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 text-slate-400 hover:text-red-600 shrink-0 hover:bg-red-50"
                    onClick={() => removeTaskRow(task.id)}
                    disabled={!canRemove}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            {/* Badge de exceso inline */}
            {
                willExceed && (
                    <div className="flex items-center gap-1 ml-1 text-[10px] text-amber-700">
                        <AlertTriangle className="w-3 h-3" />
                        <span>+{exceedsBy.toFixed(1)}h exceso ({projectedTotal.toFixed(1)}/{budgetMax}h)</span>
                    </div>
                )
            }

            {/* Indicador de deadline del empleado */}
            {deadlineInfo && (() => {
                const isCurrentEmployee = deadlineInfo.employeeId === currentEmployeeId;
                const employee = employees.find(e => e.id === deadlineInfo.employeeId);
                const employeeName = employee?.name || 'Empleado';
                return (
                    <div className="flex items-center gap-2 mt-1 p-2 rounded-md bg-blue-50 border border-blue-200">
                        <div className="flex items-center gap-2 flex-1">
                            <span className={cn(
                                "text-[10px] font-medium",
                                isCurrentEmployee ? "text-blue-700" : "text-indigo-700"
                            )}>
                                {isCurrentEmployee ? "Tu deadline:" : `${employeeName} deadline:`}
                            </span>
                            <span className={cn(
                                "text-[11px] font-bold",
                                deadlineInfo.exceeds ? "text-red-600" :
                                    deadlineInfo.totalAssigned >= deadlineInfo.deadlineHours * 0.9 ? "text-amber-600" :
                                        isCurrentEmployee ? "text-blue-600" : "text-indigo-600"
                            )}>
                                {deadlineInfo.totalAssigned.toFixed(1)} / {deadlineInfo.deadlineHours}h
                                {deadlineInfo.exceeds && (
                                    <span className="ml-1 text-red-600">(+{round2(deadlineInfo.totalAssigned - deadlineInfo.deadlineHours)}h)</span>
                                )}
                                {!deadlineInfo.exceeds && deadlineInfo.remaining > 0 && (
                                    <span className={cn("ml-1 font-normal", isCurrentEmployee ? "text-blue-500" : "text-indigo-500")}>
                                        ({deadlineInfo.remaining.toFixed(1)}h rest.)
                                    </span>
                                )}
                            </span>
                        </div>
                        <div className="w-24 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full rounded-full",
                                    deadlineInfo.exceeds ? "bg-red-500" :
                                        deadlineInfo.totalAssigned >= deadlineInfo.deadlineHours * 0.9 ? "bg-amber-500" :
                                            "bg-blue-500"
                                )}
                                style={{ width: `${Math.min((deadlineInfo.totalAssigned / deadlineInfo.deadlineHours) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
