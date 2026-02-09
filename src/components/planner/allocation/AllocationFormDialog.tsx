
import React from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { LayoutGrid, Search, Check, Link as LinkIcon, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { Allocation, Project, Client, Employee, Deadline } from '@/types';
import { NewTaskRow } from '@/types';
import { BatchTaskRow } from '../BatchTaskRow';
import { ProjectImpactSummary } from '../ProjectImpactSummary';
import { ProjectBudgetStatus } from '@/hooks/useAllocationSheet';

interface AllocationFormDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;

    // State from hook
    editingAllocation: Allocation | null;
    newTasks: NewTaskRow[];
    editProjectId: string;
    editTaskName: string;
    editHours: string;
    editWeek: string;
    editDependencyId: string;
    isSaving: boolean;
    showDeleteConfirm: boolean;

    // Actions from hook
    onClose: () => void;
    onSave: () => void;
    onDelete: () => void;
    onConfirmDelete: () => void;
    setEditProjectId: (id: string) => void;
    setEditTaskName: (name: string) => void;
    setEditHours: (hours: string) => void;
    setEditWeek: (week: string) => void;
    setEditDependencyId: (id: string) => void;
    setShowDeleteConfirm: (show: boolean) => void;

    // Task Row Actions
    addTaskRow: () => void;
    updateTaskRow: (id: string, field: keyof NewTaskRow, value: any) => void;
    removeTaskRow: (id: string) => void;

    // Data
    activeProjects: Project[];
    clients: Client[];
    employees: Employee[];
    weeks: { weekStart: Date; effectiveStart?: Date; effectiveEnd?: Date }[];
    allocations: Allocation[];
    deadlines: Deadline[];
    currentEmployeeId: string;
    canAssignToOthers: boolean;
    viewDate: Date;

    // Helpers
    getProjectBudgetStatus: (projectId: string) => ProjectBudgetStatus;
    getAvailableDependencies: (projectId: string, excludeId?: string) => Allocation[];
    getWeekExceedStatus: (weekDate: string) => boolean;
    getEmployeeLoadForWeek: (employeeId: string, weekStart: string, effectiveStart?: Date, effectiveEnd?: Date, viewMonth?: Date) => { hours: number; capacity: number; percentage: number };
    formatProjectName: (name: string) => string;
}

export function AllocationFormDialog({
    isOpen,
    onOpenChange,
    editingAllocation,
    newTasks,
    editProjectId,
    editTaskName,
    editHours,
    editWeek,
    editDependencyId,
    isSaving,
    showDeleteConfirm,
    onClose,
    onSave,
    onDelete,
    onConfirmDelete,
    setEditProjectId,
    setEditTaskName,
    setEditHours,
    setEditWeek,
    setEditDependencyId,
    setShowDeleteConfirm,
    addTaskRow,
    updateTaskRow,
    removeTaskRow,
    activeProjects,
    clients,
    employees,
    weeks,
    allocations,
    deadlines,
    currentEmployeeId,
    canAssignToOthers,
    viewDate,
    getProjectBudgetStatus,
    getAvailableDependencies,
    getWeekExceedStatus,
    getEmployeeLoadForWeek,
    formatProjectName
}: AllocationFormDialogProps) {
    const [editProjectOpen, setEditProjectOpen] = React.useState(false);

    // Derive month name for title
    const monthName = viewDate.toLocaleString('es-ES', { month: 'long' });

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className={cn("overflow-hidden gap-0 p-0 transition-all duration-300",
                editingAllocation ? "max-w-[650px] overflow-visible" : "max-w-[1100px] h-[80vh] flex flex-col"
            )}>
                <DialogHeader className={cn("p-6 pb-4 border-b shrink-0", !editingAllocation && "bg-white z-10")}>
                    <DialogTitle className="flex items-center gap-2">
                        {editingAllocation ? 'Editar tarea' : <><LayoutGrid className="h-5 w-5 text-primary" /> Planificar tareas</>}
                    </DialogTitle>
                    <DialogDescription>
                        {editingAllocation ? 'Modifica detalles y dependencias.' : `Planifica múltiples tareas para ${monthName}.`}
                    </DialogDescription>
                </DialogHeader>

                <div className={cn("flex-1", !editingAllocation && "flex overflow-hidden")}>
                    {editingAllocation ? (
                        <div className="p-6 pt-2">
                            <div className="grid gap-4 mt-4">
                                <div className="space-y-2">
                                    <Label>Proyecto</Label>
                                    <Popover open={editProjectOpen} onOpenChange={setEditProjectOpen} modal={true}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className="w-full justify-between h-10 px-3 text-left font-normal"
                                            >
                                                <span className="truncate">
                                                    {editProjectId
                                                        ? formatProjectName(activeProjects.find(p => p.id === editProjectId)?.name || '')
                                                        : "Seleccionar proyecto..."}
                                                </span>
                                                <Search className="h-4 w-4 opacity-50 shrink-0 ml-2" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[400px] p-0" align="start">
                                            <Command
                                                filter={(value, search) => {
                                                    if (value.toLowerCase().includes(search.toLowerCase())) return 1;
                                                    return 0;
                                                }}
                                            >
                                                <CommandInput placeholder="Buscar proyecto..." />
                                                <CommandList className="max-h-[280px] overflow-y-auto">
                                                    <CommandEmpty>No se encontró proyecto.</CommandEmpty>
                                                    <CommandGroup heading="Proyectos">
                                                        {activeProjects.map((project) => {
                                                            const client = clients.find(c => c.id === project.clientId);
                                                            return (
                                                                <CommandItem
                                                                    key={project.id}
                                                                    value={`${project.name} ${client?.name || ''}`}
                                                                    onSelect={() => {
                                                                        setEditProjectId(project.id);
                                                                        setEditProjectOpen(false);
                                                                    }}
                                                                >
                                                                    <Check className={cn("mr-2 h-4 w-4 shrink-0", editProjectId === project.id ? "opacity-100" : "opacity-0")} />
                                                                    <div className="flex items-center gap-2 min-w-0">
                                                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: client?.color || '#6b7280' }} />
                                                                        <span className="truncate font-medium">{formatProjectName(project.name)}</span>
                                                                        {client?.name && <span className="text-xs text-slate-400 truncate">({client.name})</span>}
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
                                <div className="space-y-2"><Label>Tarea</Label><Input value={editTaskName} onChange={e => setEditTaskName(e.target.value)} /></div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-xs text-slate-500"><LinkIcon className="w-3 h-3" /> Depende de otra tarea</Label>
                                    <Select value={editDependencyId} onValueChange={setEditDependencyId} disabled={!editProjectId}>
                                        <SelectTrigger className="h-9"><SelectValue placeholder="Sin dependencia" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">-- Ninguna --</SelectItem>
                                            {getAvailableDependencies(editProjectId, editingAllocation.id).map(dep => {
                                                const owner = employees.find(e => e.id === dep.employeeId);
                                                return <SelectItem key={dep.id} value={dep.id} className="text-xs">{dep.taskName} ({owner?.name})</SelectItem>;
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Horas</Label><Input type="number" value={editHours} onChange={e => setEditHours(e.target.value)} step="0.5" /></div>
                                    <div className="space-y-2"><Label>Semana</Label><Select value={editWeek} onValueChange={setEditWeek}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{weeks.map((w, i) => <SelectItem key={w.weekStart.toISOString()} value={format(w.weekStart, 'yyyy-MM-dd')}>Sem {i + 1}</SelectItem>)}</SelectContent></Select></div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Left Column: Task Inputs */}
                            <div className="flex-1 flex flex-col p-6 overflow-hidden border-r bg-white w-2/3">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold text-sm text-slate-700">Listado de tareas</h3>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative">
                                    <div className="space-y-3 pb-2">
                                        {newTasks.map(task => (
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
                                                currentEmployeeId={currentEmployeeId}
                                                deadlines={deadlines}
                                                allocations={allocations}
                                                viewDate={viewDate}
                                            />
                                        ))}

                                        <div id="task-list-end" />
                                    </div>
                                </div>

                                {/* New Row Button at Bottom */}
                                <div className="pt-3 mt-auto border-t">
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

                            {/* Right Column: Impact Summary */}
                            <div className="w-1/3 bg-slate-50 border-l p-6 overflow-y-auto custom-scrollbar">
                                <ProjectImpactSummary
                                    variant="vertical"
                                    newTasks={newTasks}
                                    projects={activeProjects}
                                    allocations={allocations}
                                    viewDate={viewDate}
                                    getProjectBudgetStatus={getProjectBudgetStatus}
                                    getEmployeeLoadForWeek={getEmployeeLoadForWeek}
                                    employeeId={currentEmployeeId}
                                    weeks={weeks}
                                    deadlines={deadlines}
                                    employees={employees}
                                />
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter className={cn("p-6 py-4 border-t bg-slate-50/50 shrink-0 flex items-center gap-2 w-full", editingAllocation && "bg-transparent border-t-0 p-6 pt-0")}>
                    {!editingAllocation && (
                        <div className="flex items-center gap-2 text-xs text-slate-500 mr-auto">
                            {newTasks.some(t => !t.projectId || !t.taskName || !t.hours || !t.weekDate) && (
                                <span className="text-amber-600 flex items-center gap-1">
                                    <AlertTriangle className="h-3.5 w-3.5" /> Completa los campos obligatorios
                                </span>
                            )}
                        </div>
                    )}
                    <div className="flex gap-2 ml-auto">
                        {editingAllocation && <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-500 mr-auto" disabled={isSaving}><Trash2 className="w-4 h-4 mr-2" /> Eliminar</Button>}
                        <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                        <Button onClick={onSave} disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                    Guardando...
                                </>
                            ) : (
                                'Guardar'
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
