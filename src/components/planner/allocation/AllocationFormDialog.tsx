
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { LayoutGrid, Link as LinkIcon, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { Allocation, Project, Client, Employee, Deadline } from '@/types';
import { NewTaskRow } from '@/types';
import { BatchTaskRow } from '../BatchTaskRow';
import { ProjectImpactSummary } from '../ProjectImpactSummary';
import { DependencyPicker, DEPENDENCY_NONE } from '@/components/planner/allocation/DependencyPicker';
import { ProjectPicker } from '@/components/planner/allocation/ProjectPicker';
import { WeekPicker } from '@/components/planner/allocation/WeekPicker';
import { TaskNotesTrigger } from '@/components/planner/allocation/TaskNotesTrigger';
import { useAllocationNoteCounts } from '@/hooks/useAllocationNotes';
import { ProjectBudgetStatus } from '@/hooks/useAllocationSheet';
import { useMouseWheelScroll } from '@/hooks/useMouseWheelScroll';
import { useIsMobile } from '@/hooks/use-mobile';
import type { GetEmployeeLoadForWeekFn, PlannerBatchPreviewContext } from '@/utils/plannerBatchPreview';

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
    getEmployeeLoadForWeek: GetEmployeeLoadForWeekFn;
    formatProjectName: (name: string) => string;
    /** Añadir tareas en lote (planificador): mismas reglas que dashboard empleado */
    canSubmitBatchAdd: boolean;
    batchAddHint: string | null;
    batchPreview: PlannerBatchPreviewContext;
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
    formatProjectName: _formatProjectName,
    canSubmitBatchAdd,
    batchAddHint,
    batchPreview,
}: AllocationFormDialogProps) {
    const [showConfirmClose, setShowConfirmClose] = React.useState(false);
    const [pendingCloseAction, setPendingCloseAction] = React.useState<'open-change' | 'close-click' | null>(null);
    const isMobile = useIsMobile();
    const editScrollRef = useMouseWheelScroll<HTMLDivElement>();
    const editAllocationId = editingAllocation?.id;
    const { data: noteCounts = {} } = useAllocationNoteCounts(editAllocationId ? [editAllocationId] : []);
    const editNoteCount = editAllocationId ? noteCounts[editAllocationId] ?? 0 : 0;

    const hasUnsavedChanges = () => {
        if (!editingAllocation) {
            return newTasks.length > 1 || newTasks.some(t => t.taskName.trim() !== '' || t.hours !== '');
        }
        return (
            editTaskName !== (editingAllocation.taskName || '') ||
            editHours !== editingAllocation.hoursAssigned.toString() ||
            (Boolean(editProjectId) && editProjectId !== editingAllocation.projectId) ||
            editWeek !== editingAllocation.weekStartDate ||
            editDependencyId !== (editingAllocation.dependencyId || 'none')
        );
    };

    const handleOpenChange = (open: boolean) => {
        if (!open && hasUnsavedChanges()) {
            setPendingCloseAction('open-change');
            setShowConfirmClose(true);
            return;
        }
        onOpenChange(open);
    };

    const handleCloseClick = () => {
        if (hasUnsavedChanges()) {
            setPendingCloseAction('close-click');
            setShowConfirmClose(true);
            return;
        }
        onClose();
    };

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
        <div className={cn("flex-1 min-h-0 min-w-0 overflow-hidden flex flex-col", !editingAllocation && "sm:flex-row")}>
                    {editingAllocation ? (
                        <div
                            ref={editScrollRef}
                            className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain p-4 sm:p-6 pt-2 custom-scrollbar"
                        >
                            <div className="grid gap-4 mt-4">
                                <div className="space-y-2">
                                    <Label>Proyecto</Label>
                                    <ProjectPicker
                                        value={editProjectId}
                                        onChange={setEditProjectId}
                                        activeProjects={activeProjects}
                                        clients={clients}
                                        employees={employees}
                                        deadlines={deadlines}
                                        viewDate={viewDate}
                                        getProjectBudgetStatus={getProjectBudgetStatus}
                                        batchPreview={batchPreview}
                                        employeeId={editingAllocation.employeeId || currentEmployeeId}
                                        contextTaskHours={parseFloat(editHours) || 0}
                                        contextTaskId={editingAllocation.id}
                                        triggerClassName={cn(isMobile ? 'h-11 min-h-[44px]' : 'h-10')}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <Label>Tarea</Label>
                                        <TaskNotesTrigger
                                            allocationId={editingAllocation.id}
                                            noteCount={editNoteCount}
                                            inline
                                        />
                                    </div>
                                    <Input value={editTaskName} onChange={e => setEditTaskName(e.target.value)} placeholder="Ej: CMS multilingüe — Guacamayo Jacinto" className={cn(isMobile && "h-11 min-h-[44px]")} />
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-xs text-slate-500">
                                        <LinkIcon className="w-3 h-3" /> Depende de otra tarea
                                    </Label>
                                    <DependencyPicker
                                        value={editDependencyId || DEPENDENCY_NONE}
                                        onChange={setEditDependencyId}
                                        dependencies={getAvailableDependencies(editProjectId, editingAllocation.id)}
                                        employees={employees}
                                        weeks={weeks}
                                        disabled={!editProjectId}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Horas</Label><Input type="number" value={editHours} onChange={e => setEditHours(e.target.value)} step="0.5" className={cn(isMobile && "h-11 min-h-[44px]")} /></div>
                                    <div className="space-y-2">
                                        <Label>Semana</Label>
                                        <WeekPicker
                                            value={editWeek}
                                            onChange={setEditWeek}
                                            weeks={weeks}
                                            viewDate={viewDate}
                                            isOverloaded={editWeek ? getWeekExceedStatus(editWeek) : false}
                                            className={cn(isMobile && 'h-11 min-h-[44px]')}
                                        />
                                    </div>
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
                                                batchPreview={batchPreview}
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
                                    batchPreview={batchPreview}
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
        <div className={cn("p-4 sm:p-6 py-4 border-t bg-slate-50/50 shrink-0 flex flex-wrap items-center gap-2 w-full")}>
            {!editingAllocation && (
                <div className="flex items-center gap-2 text-xs mr-auto w-full sm:w-auto min-w-0">
                    {batchAddHint ? (
                        <span className="text-amber-600 flex items-start gap-1">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {batchAddHint}
                        </span>
                    ) : (
                        <span className="text-slate-500">Listo para guardar las filas completas.</span>
                    )}
                </div>
            )}
            <div className="flex gap-2 ml-auto flex-1 sm:flex-initial justify-end">
                {editingAllocation && <Button variant="ghost" size="sm" onClick={onDelete} className={cn("text-red-500 mr-auto", isMobile && "h-11 min-h-[44px]")} disabled={isSaving}><Trash2 className="w-4 h-4 mr-2" /> Eliminar</Button>}
                <Button variant="ghost" onClick={handleCloseClick} disabled={isSaving} className={cn(isMobile && "h-11 min-h-[44px]")}>Cancelar</Button>
                <Button
                    onClick={onSave}
                    disabled={isSaving || (!editingAllocation && !canSubmitBatchAdd)}
                    className={cn(isMobile && "h-11 min-h-[44px]")}
                >
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

    const confirmDialog = (
      <AlertDialog
        open={showConfirmClose}
        onOpenChange={(open) => {
          setShowConfirmClose(open);
          if (!open) setPendingCloseAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar cambios?</AlertDialogTitle>
            <AlertDialogDescription>
              {editingAllocation
                ? 'Tienes cambios sin guardar. Si cierras ahora, los perderás.'
                : 'Tienes tareas pendientes por guardar. Si cierras ahora, perderás los datos introducidos.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Seguir editando</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowConfirmClose(false);
                if (pendingCloseAction === 'open-change') {
                  onOpenChange(false);
                } else if (pendingCloseAction === 'close-click') {
                  onClose();
                }
                setPendingCloseAction(null);
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Sí, descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );

    if (isMobile) {
        return (
            <>
            <Sheet open={isOpen} onOpenChange={handleOpenChange}>
                <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl p-0 gap-0 flex flex-col overflow-hidden">
                    {modalContent}
                </SheetContent>
            </Sheet>
            {confirmDialog}
            </>
        );
    }

    return (
        <>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className={cn("overflow-hidden gap-0 p-0 transition-all duration-300 max-w-[95vw] flex flex-col max-h-[90vh]", editingAllocation ? "sm:max-w-[650px]" : "sm:max-w-[1100px] h-[85vh] sm:h-[80vh]")}>
                {modalContent}
            </DialogContent>
        </Dialog>
        {confirmDialog}
        </>
    );
}
