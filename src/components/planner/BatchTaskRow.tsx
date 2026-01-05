import { format } from 'date-fns';
import { cn, formatProjectName } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, X, Plus, Trash2, AlertTriangle, Link as LinkIcon, User } from 'lucide-react';
import { Project, Employee, Allocation, NewTaskRow, Client } from '@/types';
import { ProjectBudgetStatus } from '@/hooks/useAllocationSheet';
import { useState } from 'react';

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
}

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
    currentEmployeeId
}: BatchTaskRowProps) {
    const [openCombobox, setOpenCombobox] = useState(false);
    const [openEmployeeCombobox, setOpenEmployeeCombobox] = useState(false);

    // Calcular si esta tarea excede las horas contratadas
    const taskProject = task.projectId ? activeProjects.find(p => p.id === task.projectId) : null;
    const taskHours = parseFloat(task.hours) || 0;

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
            {/* Fila 1: Proyecto + Nombre de tarea */}
            <div className="flex gap-3 items-center">
                {/* Selector de Proyecto (ancho fijo más compacto) */}
                <div className="w-[280px] shrink-0">
                    <Popover open={openCombobox} onOpenChange={setOpenCombobox} modal={true}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                    "w-full justify-between h-9 px-3 text-left font-normal text-sm",
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
                    <PopoverContent className="w-[450px] p-0" align="start">
                        <Command
                            filter={(value, search) => {
                                if (value.toLowerCase().includes(search.toLowerCase())) return 1;
                                return 0;
                            }}
                        >
                            <CommandInput placeholder="Buscar proyecto..." />
                            <CommandList className="max-h-[280px] overflow-y-auto overscroll-contain">
                                <CommandEmpty>No hay.</CommandEmpty>
                                <CommandGroup heading="Proyectos asignados">
                                    {activeProjects.map((project) => {
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
                
                {/* Nombre de la tarea (más espacio ahora) */}
                <Input
                    className="flex-1 h-9 text-sm min-w-0"
                    placeholder="Nombre de la tarea"
                    value={task.taskName}
                    onChange={(e) => updateTaskRow(task.id, 'taskName', e.target.value)}
                />
            </div>

            {/* Fila 2: Detalles adicionales */}
            <div className="flex gap-3 items-center">
                {/* Selector de empleado (solo si tiene permiso) */}
                {canAssignToOthers && (
                    <div className="w-[160px] shrink-0">
                        <Popover open={openEmployeeCombobox} onOpenChange={setOpenEmployeeCombobox} modal={true}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                        "w-full justify-between h-9 px-3 text-left font-normal text-xs",
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
                            <PopoverContent className="w-[300px] p-0" align="start">
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

                <div className="w-[140px]">
                    <Select value={task.dependencyId || 'none'} onValueChange={(v) => updateTaskRow(task.id, 'dependencyId', v)} disabled={!task.projectId}>
                        <SelectTrigger className="h-9 text-xs px-2"><SelectValue placeholder="Sin dep." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">-- Sin dependencia --</SelectItem>
                            {getAvailableDependencies(task.projectId).map(dep => {
                                const owner = employees.find(e => e.id === dep.employeeId);
                                return <SelectItem key={dep.id} value={dep.id} className="text-xs">{dep.taskName} ({owner?.name?.substring(0, 6)}..)</SelectItem>;
                            })}
                        </SelectContent>
                    </Select>
                </div>

                <Input
                    type="number"
                    className={cn("w-20 h-9 text-center text-sm font-medium", willExceed && "border-amber-300 bg-amber-50 text-amber-700")}
                    placeholder="h"
                    value={task.hours}
                    onChange={(e) => updateTaskRow(task.id, 'hours', e.target.value)}
                    step="0.5"
                />

                <div className="w-32">
                    <Select value={task.weekDate} onValueChange={(v) => updateTaskRow(task.id, 'weekDate', v)}>
                        <SelectTrigger className={cn("h-9 text-xs pl-2 pr-1", isWeekOverloaded && "border-red-300 text-red-700 bg-red-50")}>
                            <SelectValue placeholder="Semana" />
                        </SelectTrigger>
                        <SelectContent>{weeks.map((w, i) => (<SelectItem key={w.weekStart.toISOString()} value={format(w.weekStart, 'yyyy-MM-dd')}>Sem {i + 1}</SelectItem>))}</SelectContent>
                    </Select>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-slate-400 hover:text-red-600 shrink-0 hover:bg-red-50"
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
        </div>
    );
}
