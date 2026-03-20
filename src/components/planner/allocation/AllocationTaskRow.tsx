import { Allocation, Employee, TaskTransfer, WeeklyFeedback } from '@/types';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    MoreHorizontal,
    Pencil,
    ArrowRightLeft,
    ArrowRightCircle,
    AlertTriangle,
    Lock,
    Link as LinkIcon,
    CheckCircle2,
    Users,
    Clock,
    TrendingUp,
    TrendingDown
} from 'lucide-react';
import { getWeekEndDate } from '@/utils/dateUtils';
import { parseISO } from 'date-fns';
import { useWeeklyCloseDay } from '@/hooks/useWeeklyCloseDay';
import { TaskTimer } from '@/components/employee/TaskTimer';
import { useAgency } from '@/contexts/AgencyContext';

interface AllocationTaskRowProps {
    alloc: Allocation;
    weekIndex: number;
    isInlineEditing: boolean;
    inlineNameValue: string;
    onInlineNameChange: (value: string) => void;
    onSaveInline: () => void;
    onStartInlineEdit: () => void;
    onToggleCompletion: () => void;
    onUpdateInlineHours: (field: 'hoursActual' | 'hoursComputed', value: string) => void;
    onStartEditFull: () => void;
    onMoveTask: (targetWeekStart: Date) => void;
    nextWeekStart: Date | undefined;
    employees: Employee[];
    allocations: Allocation[];
    outgoingTransfers: TaskTransfer[];
    weeklyFeedback: WeeklyFeedback[];
    showAllWeeks: boolean;
    setTransferTask: (alloc: Allocation) => void;
    setTransferDialogOpen: (open: boolean) => void;
    isWeeklyEnabled: boolean;
    /** En móvil: fila más alta y táctil */
    isMobile?: boolean;
    /** Mostrar cronómetro de tareas (módulo timeTracker + empleado con user_id) */
    showTaskTimer?: boolean;
    /** Callback al registrar tiempo (refrescar allocations) */
    onTimeLogged?: (allocationId: string, hoursLogged: number) => void;
}

export function AllocationTaskRow({
    alloc,
    weekIndex,
    isInlineEditing,
    inlineNameValue,
    onInlineNameChange,
    onSaveInline,
    onStartInlineEdit,
    onToggleCompletion,
    onUpdateInlineHours,
    onStartEditFull,
    onMoveTask,
    nextWeekStart,
    employees,
    allocations,
    outgoingTransfers,
    weeklyFeedback,
    showAllWeeks,
    setTransferTask,
    setTransferDialogOpen,
    isWeeklyEnabled,
    isMobile = false,
    showTaskTimer = false,
    onTimeLogged,
}: AllocationTaskRowProps) {
    const weeklyCloseDay = useWeeklyCloseDay();
    const { currentAgency } = useAgency();
    const preference = currentAgency?.settings?.hoursTrackingPreference;

    const isCompleted = alloc.status === 'completed';
    const pendingTransfer = (outgoingTransfers || []).find(t => t.allocationId === alloc.id && t.status === 'pending');
    const depTask = alloc.dependencyId ? allocations.find(a => a.id === alloc.dependencyId) : null;
    const depOwner = depTask ? employees.find(e => e.id === depTask.employeeId) : null;
    const isDepReady = depTask?.status === 'completed';
    const blockingTasks = allocations.filter(a => a.dependencyId === alloc.id && a.status !== 'completed');

    // Calcular balance individual de la tarea
    const taskBalance = isCompleted ? Math.round(((alloc.hoursComputed || 0) - (alloc.hoursActual || 0)) * 100) / 100 : 0;

    return (
        <div className={cn(
            "group flex items-start gap-2 transition-all touch-manipulation",
            isMobile ? "p-3 min-h-[44px]" : "p-2.5",
            isCompleted
                ? "bg-slate-50/50 hover:bg-slate-100/50"
                : "hover:bg-primary/10/30"
        )}>
            <Checkbox
                checked={isCompleted}
                onCheckedChange={() => onToggleCompletion()}
                className={cn("mt-1 shrink-0", isMobile && "scale-110", isCompleted && "data-[state=checked]:bg-emerald-600")}
            />
            <div className="flex-1 min-w-0">
                <div onDoubleClick={() => onStartInlineEdit()}>
                    {isInlineEditing ? (
                        <Input
                            autoFocus
                            value={inlineNameValue}
                            onChange={e => onInlineNameChange(e.target.value)}
                            onBlur={() => onSaveInline()}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') onSaveInline();
                            }}
                            className="h-6 text-xs"
                        />
                    ) : (
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col w-full">
                                <div className="flex items-center gap-1.5">
                                    <span className={cn(
                                        "font-medium leading-tight",
                                        isMobile ? "text-sm" : "text-xs",
                                        isCompleted && "line-through text-slate-400"
                                    )}>{alloc.taskName || 'Tarea'}</span>
                                    {/* Badge Weekly si la tarea fue actualizada vía Weekly */}
                                    {(() => {
                                        const isTransferred = alloc.taskName?.includes('(transferida de');
                                        const hasWeeklyFeedback = weeklyFeedback.some(fb => fb.allocationId === alloc.id);
                                        const wasAdjustedViaWeekly = hasWeeklyFeedback || isTransferred ||
                                            (alloc.hoursAssigned === 0 && alloc.hoursActual === 0 && alloc.hoursComputed === 0 && alloc.status === 'completed');

                                        return wasAdjustedViaWeekly ? (
                                            <Badge variant="outline" className="h-4 px-1.5 text-[9px] bg-primary/10 text-indigo-700 border-indigo-200">
                                                Weekly
                                            </Badge>
                                        ) : null;
                                    })()}
                                </div>

                                {depTask && !isCompleted && (
                                    <div className={cn(
                                        "flex items-center gap-1 mt-1.5 text-[9px] px-1.5 py-0.5 rounded border",
                                        isDepReady
                                            ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                                            : "text-amber-700 bg-amber-50 border-amber-200",
                                        !showAllWeeks ? "w-fit" : "w-fit"
                                    )}>
                                        {isDepReady ? <CheckCircle2 className="w-2.5 h-2.5 shrink-0" /> : <LinkIcon className="w-2.5 h-2.5 shrink-0" />}
                                        <span className="text-slate-600 shrink-0">{isDepReady ? 'Listo:' : 'Dep:'}</span>
                                        {!showAllWeeks ? (
                                            // Vista semanal: mostrar todo completo
                                            <>
                                                <span className={cn("font-medium", isDepReady ? "text-slate-700" : "text-slate-600")}>{depTask.taskName}</span>
                                                {depOwner && (
                                                    <>
                                                        <Avatar className="h-3 w-3 border border-slate-300 shrink-0">
                                                            <AvatarImage src={depOwner.avatarUrl} alt={depOwner.name} />
                                                            <AvatarFallback className="bg-primary/100 text-white text-[6px] font-bold">
                                                                {depOwner.name.substring(0, 2).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-semibold text-slate-800">{depOwner.name}</span>
                                                    </>
                                                )}
                                            </>
                                        ) : (
                                            // Vista mensual: layout compacto sin avatar
                                            <>
                                                <span className={cn("font-medium truncate max-w-[80px]", isDepReady ? "text-slate-700" : "text-slate-600")} title={depTask.taskName}>{depTask.taskName}</span>
                                                {depOwner && (
                                                    <span className="font-semibold text-slate-800 truncate max-w-[60px]" title={depOwner.name}>{depOwner.name.split(' ')[0]}</span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}

                                {blockingTasks.length > 0 && !isCompleted && (
                                    <div className="flex flex-col gap-0.5 mt-1.5">
                                        {blockingTasks.map(bt => {
                                            const blockedUser = employees.find(e => e.id === bt.employeeId);
                                            const firstName = blockedUser?.name?.split(' ')[0] || 'Compañero';
                                            return (
                                                <div key={bt.id} className="flex items-center gap-1 text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded w-fit border border-amber-200">
                                                    <Users className="w-2.5 h-2.5" />
                                                    <span>💡 <strong>{firstName}</strong> te espera</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className={cn("opacity-0 group-hover:opacity-100 transition-opacity shrink-0", isMobile ? "h-11 w-11 min-h-[44px] min-w-[44px]" : "h-5 w-5")}><MoreHorizontal className={isMobile ? "h-4 w-4" : "h-3 w-3"} /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={() => onStartEditFull()}
                                        disabled={(() => {
                                            if (pendingTransfer) return true;
                                            if (!isWeeklyEnabled) return false;
                                            try {
                                                const taskWeekDate = parseISO(alloc.weekStartDate);
                                                const taskWeekEnd = getWeekEndDate(taskWeekDate, weeklyCloseDay);
                                                return taskWeekEnd < new Date();
                                            } catch {
                                                return false;
                                            }
                                        })()}
                                    >
                                        {pendingTransfer ? <Lock className="mr-2 h-3.5 w-3.5" /> : <Pencil className="mr-2 h-3.5 w-3.5" />}
                                        {pendingTransfer ? 'Transferencia pendiente' : 'Editar'}
                                    </DropdownMenuItem>
                                    {!pendingTransfer && (
                                        <DropdownMenuItem
                                            onClick={() => {
                                                setTransferTask(alloc);
                                                setTransferDialogOpen(true);
                                            }}
                                        >
                                            <ArrowRightLeft className="mr-2 h-3.5 w-3.5" /> Transferir
                                        </DropdownMenuItem>
                                    )}
                                    {isWeeklyEnabled && (() => {
                                        try {
                                            const taskWeekDate = parseISO(alloc.weekStartDate);
                                            const taskWeekEnd = getWeekEndDate(taskWeekDate, weeklyCloseDay);
                                            const isPastWeek = taskWeekEnd < new Date();
                                            if (isPastWeek) {
                                                return (
                                                    <DropdownMenuItem disabled className="text-xs text-amber-600">
                                                        <AlertTriangle className="mr-2 h-3.5 w-3.5" /> Usa Weekly para gestionar
                                                    </DropdownMenuItem>
                                                );
                                            }
                                            return null;
                                        } catch {
                                            return null;
                                        }
                                    })()}
                                    {nextWeekStart && (
                                        <DropdownMenuItem onClick={() => onMoveTask(nextWeekStart)}><ArrowRightCircle className="mr-2 h-3.5 w-3.5" /> Mover sem.</DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>

                {/* MÉTRICAS REDISEÑADAS */}
                <div className="mt-2 space-y-1.5">
                    {/* TAREA PENDIENTE: Estimado + cronómetro si está habilitado */}
                    {!isCompleted && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className={cn("flex items-center gap-1.5 text-slate-600 bg-slate-100 px-2 py-1 rounded-md", isMobile ? "text-sm" : "text-[11px]")}>
                                <Clock className={cn("text-slate-400", isMobile ? "w-4 h-4" : "w-3 h-3")} />
                                <span className="font-medium">Estimado:</span>
                                <span className={cn("font-bold font-mono", isMobile && "text-base")}>{alloc.hoursAssigned}h</span>
                            </div>
                            {showTaskTimer && (
                                <TaskTimer
                                    employeeId={alloc.employeeId}
                                    allocationId={alloc.id}
                                    disabled={false}
                                    onTimeLogged={onTimeLogged}
                                />
                            )}
                        </div>
                    )}

                    {/* TAREA COMPLETADA: Flujo visual Est → Real → Comp */}
                    {isCompleted && (
                        <div className="space-y-1.5">
                            {/* Fila de métricas: EST → REAL → COMP */}
                            <div className={cn("flex items-center gap-1 flex-wrap", isMobile && "gap-2")}>
                                {/* EST (atenuado) */}
                                <div className={cn("flex items-center gap-1 text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded", isMobile ? "text-sm" : "text-[10px]")}>
                                    <span>Est:</span>
                                    <span className={cn("font-mono", isMobile && "text-base")}>{alloc.hoursAssigned}h</span>
                                </div>

                                <span className={cn("text-slate-300", isMobile ? "text-sm" : "text-[10px]")}>→</span>

                                {/* REAL (editable) */}
                                <div className={cn("flex items-center bg-blue-100 text-blue-800 rounded px-1.5 py-0.5 border border-blue-200", isMobile && "px-2 py-1")}>
                                    <span className={cn("font-medium mr-1", isMobile ? "text-sm" : "text-[10px]")}>Real:</span>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        defaultValue={alloc.hoursActual || 0}
                                        onBlur={(e) => onUpdateInlineHours('hoursActual', e.target.value)}
                                        className={cn("text-center bg-transparent border-0 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-400 rounded font-bold font-mono", isMobile ? "w-12 text-base min-h-[36px]" : "w-10 text-[11px]")}
                                    />
                                </div>

                                <span className={cn("text-slate-300", isMobile ? "text-sm" : "text-[10px]")}>→</span>

                                {/* COMP (editable) */}
                                {preference !== 'actual' && (
                                <div className={cn("flex items-center bg-emerald-100 text-emerald-800 rounded border border-emerald-200", isMobile ? "px-2 py-1" : "px-1.5 py-0.5")}>
                                    <span className={cn("font-medium mr-1", isMobile ? "text-sm" : "text-[10px]")}>Comp:</span>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        disabled={preference === 'actual'}
                                        defaultValue={alloc.hoursComputed || 0}
                                        onBlur={(e) => onUpdateInlineHours('hoursComputed', e.target.value)}
                                        className={cn("text-center bg-transparent border-0 focus:outline-none focus:bg-white rounded font-bold font-mono", isMobile ? "w-12 text-base min-h-[36px]" : "w-10 text-[11px]", preference === 'actual' ? "text-emerald-800/50 cursor-not-allowed" : "focus:ring-1 focus:ring-emerald-400")}
                                    />
                                </div>
                                )}
                            </div>

                            {/* BALANCE de la tarea (solo si hay diferencia) */}
                            {Math.abs(taskBalance) > 0.01 && (
                                <div className={cn(
                                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium",
                                    isMobile ? "text-sm" : "text-[10px]",
                                    taskBalance >= 0
                                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                        : "bg-red-100 text-red-700 border border-red-200"
                                )}>
                                    {taskBalance >= 0 ? <TrendingUp className={cn("shrink-0", isMobile ? "w-4 h-4" : "w-3 h-3")} /> : <TrendingDown className={cn("shrink-0", isMobile ? "w-4 h-4" : "w-3 h-3")} />}
                                    <span>{taskBalance >= 0 ? 'Ganancia' : 'Pérdida'}:</span>
                                    <span className={cn("font-bold font-mono", isMobile && "text-base")}>{taskBalance > 0 ? '+' : ''}{taskBalance}h</span>
                                </div>
                            )}

                            {/* Badge Weekly si horas=0 por ajuste de weekly */}
                            {(() => {
                                const isTransferred = alloc.taskName?.includes('(transferida de');
                                const hasWeeklyFeedback = weeklyFeedback.some(fb => fb.allocationId === alloc.id);
                                const wasAdjustedViaWeekly = hasWeeklyFeedback || isTransferred;
                                const isZeroDueToWeekly = (alloc.hoursAssigned === 0 && alloc.hoursActual === 0 && alloc.hoursComputed === 0) && wasAdjustedViaWeekly;

                                return isZeroDueToWeekly ? (
                                    <Badge variant="outline" className="h-3.5 px-1.5 text-[9px] bg-primary/10 text-indigo-700 border-indigo-200 mt-1">
                                        Weekly
                                    </Badge>
                                ) : null;
                            })()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
