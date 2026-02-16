
import React from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';
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
import { useIsMobile } from '@/hooks/use-mobile';

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
    const isMobile = useIsMobile();

    // Derive month name for title
    const monthName = viewDate.toLocaleString('es-ES', { month: 'long' });

    const headerBlock = (
        <div className={cn("border-b shrink-0", "p-4 sm:p-6 pb-4", !editingAllocation && "bg-white z-10")}>
            <h2 className="flex items-center gap-2 text-lg font-semibold leading-none tracking-tight">
                {editingAllocation ? 'Editar tarea' : <><LayoutGrid className="h-5 w-5 text-primary" /> Planificar tareas</>}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
                {editingAllocation ? 'Modifica detalles y dependencias.' : `Planifica múltiples tareas para ${monthName}.`}
            </p>
        </div>
    );

    const bodyContent = (
        <div className={cn("flex-1 min-w-0 overflow-hidden", !editingAllocation && "flex flex-col sm:flex-row")}>
                    {editingAllocation ? (
                        <div className="p-4 sm:p-6 pt-2">
                            <div className="grid gap-4 mt-4">
                                <div className="space-y-2">
                                    <Label>Proyecto</Label>
                                    <Popover open={editProjectOpen} onOpenChange={setEditProjectOpen} modal={true}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn("w-full justify-between px-3 text-left font-normal", isMobile ? "h-11 min-h-[44px]" : "h-10")}
                                            >
                                                <span className="truncate">
                                                    {editProjectId
                                                        ? formatProjectName(activeProjects.find(p => p.id === editProjectId)?.name || '')
                                                        : "Seleccionar proyecto..."}
                                                </span>
                                                <Search className="h-4 w-4 opacity-50 shrink-0 ml-2" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className={cn("p-0", isMobile ? "w-[calc(100vw-2rem)] max-w-[400px]" : "w-[400px]")} align="start">
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
                                <div className="space-y-2"><Label>Tarea</Label><Input value={editTaskName} onChange={e => setEditTaskName(e.target.value)} className={cn(isMobile && "h-11 min-h-[44px]")} /></div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-xs text-slate-500"><LinkIcon className="w-3 h-3" /> Depende de otra tarea</Label>
                                    <Select value={editDependencyId} onValueChange={setEditDependencyId} disabled={!editProjectId}>
                                        <SelectTrigger className={cn(isMobile ? "h-11 min-h-[44px]" : "h-9")}><SelectValue placeholder="Sin dependencia" /></SelectTrigger>
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
                                    <div className="space-y-2"><Label>Horas</Label><Input type="number" value={editHours} onChange={e => setEditHours(e.target.value)} step="0.5" className={cn(isMobile && "h-11 min-h-[44px]")} /></div>
                                    <div className="space-y-2"><Label>Semana</Label><Select value={editWeek} onValueChange={setEditWeek}><SelectTrigger className={cn(isMobile && "h-11 min-h-[44px]")}><SelectValue /></SelectTrigger><SelectContent>{weeks.map((w, i) => <SelectItem key={w.weekStart.toISOString()} value={format(w.weekStart, 'yyyy-MM-dd')}>Sem {i + 1}</SelectItem>)}</SelectContent></Select></div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Left Column: Task Inputs */}
                            <div className="flex-1 flex flex-col min-w-0 overflow-hidden border-r border-slate-200 bg-white w-full sm:w-2/3 p-4 sm:p-6">
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
                                    }} className={cn("w-full border-dashed text-slate-500 hover:text-primary hover:border-primary/50", isMobile ? "h-11 min-h-[44px]" : "h-9")}>
                                        <Plus className="h-4 w-4 mr-2" /> Añadir otra fila
                                    </Button>
                                </div>
                            </div>

                            {/* Right Column: Impact Summary */}
                            <div className="w-full sm:w-1/3 bg-slate-50 border-t sm:border-t-0 sm:border-l border-slate-200 p-4 sm:p-6 overflow-y-auto custom-scrollbar min-h-0">
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
    );

    const footerBlock = (
        <div className={cn("p-4 sm:p-6 py-4 border-t bg-slate-50/50 shrink-0 flex flex-wrap items-center gap-2 w-full", editingAllocation && "bg-transparent border-t-0 pt-0")}>
            {!editingAllocation && (
                <div className="flex items-center gap-2 text-xs text-slate-500 mr-auto w-full sm:w-auto">
                    {newTasks.some(t => !t.projectId || !t.taskName || !t.hours || !t.weekDate) && (
                        <span className="text-amber-600 flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5" /> Completa los campos obligatorios
                        </span>
                    )}
                </div>
            )}
            <div className="flex gap-2 ml-auto flex-1 sm:flex-initial justify-end">
                {editingAllocation && <Button variant="ghost" size="sm" onClick={onDelete} className={cn("text-red-500 mr-auto", isMobile && "h-11 min-h-[44px]")} disabled={isSaving}><Trash2 className="w-4 h-4 mr-2" /> Eliminar</Button>}
                <Button variant="ghost" onClick={onClose} disabled={isSaving} className={cn(isMobile && "h-11 min-h-[44px]")}>Cancelar</Button>
                <Button onClick={onSave} disabled={isSaving} className={cn(isMobile && "h-11 min-h-[44px]")}>
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
        </div>
    );

    const modalContent = (
        <>
            {headerBlock}
            {bodyContent}
            {footerBlock}
        </>
    );

    if (isMobile) {
        return (
            <Sheet open={isOpen} onOpenChange={onOpenChange}>
                <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl p-0 gap-0 flex flex-col overflow-hidden">
                    {modalContent}
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className={cn("overflow-hidden gap-0 p-0 transition-all duration-300 max-w-[95vw] sm:max-w-[650px]", editingAllocation && "overflow-visible", !editingAllocation && "sm:max-w-[1100px] h-[85vh] sm:h-[80vh] flex flex-col")}>
                {modalContent}
            </DialogContent>
        </Dialog>
    );
}
