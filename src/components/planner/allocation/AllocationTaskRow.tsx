import { Allocation, Employee, TaskTransfer, WeeklyFeedback } from '@/types';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link as LinkIcon, CheckCircle2, Users, Clock, TrendingUp, TrendingDown, Sun } from 'lucide-react';
import { TaskNotesTrigger } from '@/components/planner/allocation/TaskNotesTrigger';
import { format } from 'date-fns';
import { useWeeklyCloseDay } from '@/hooks/useWeeklyCloseDay';
import { PlannerTaskContextMenu } from '@/components/planner/allocation/PlannerTaskContextMenu';
import { TaskTimer } from '@/components/employee/TaskTimer';
import { useAgency } from '@/contexts/AgencyContext';
import { getPlanningDeltaHours } from '@/utils/hoursTracking';
import { formatDecimalHoursAsHm } from '@/utils/timerDisplay';
import { round2 } from '@/utils/numbers';
import { SensitiveText } from '@/components/privacy/SensitiveText';

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
    /** Abre el modal de cierre Weekly centrado en la tarea (planificador) */
    onOpenWeeklyForTask?: (alloc: Allocation) => void;
    isWeeklyEnabled: boolean;
    /** En móvil: fila más alta y táctil */
    isMobile?: boolean;
    /** Mostrar cronómetro de tareas (módulo timeTracker + empleado con user_id) */
    showTaskTimer?: boolean;
    /** Callback al registrar tiempo (refrescar allocations) */
    onTimeLogged?: (allocationId: string, hoursLogged: number) => void;
    /** Suma de time_entries para esta allocation (mismo empleado); alinea UI si Real en BD está desfasado */
    timeEntriesSum?: number;
    noteCount?: number;
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
    onOpenWeeklyForTask,
    isWeeklyEnabled,
    isMobile = false,
    showTaskTimer = false,
    onTimeLogged,
    timeEntriesSum,
    noteCount = 0,
}: AllocationTaskRowProps) {
    const weeklyCloseDay = useWeeklyCloseDay();
    const { currentAgency } = useAgency();
    const preference = currentAgency?.settings?.hoursTrackingPreference;
    const todayIso = format(new Date(), 'yyyy-MM-dd');
    const isFocusToday = alloc.focusDate === todayIso;

    const isCompleted = alloc.status === 'completed';
    const pendingTransfer = (outgoingTransfers || []).find(t => t.allocationId === alloc.id && t.status === 'pending');
    const depTask = alloc.dependencyId ? allocations.find(a => a.id === alloc.dependencyId) : null;
    const depOwner = depTask ? employees.find(e => e.id === depTask.employeeId) : null;
    const isDepReady = depTask?.status === 'completed';
    const blockingTasks = allocations.filter(a => a.dependencyId === alloc.id && a.status !== 'completed');

    const taskDelta = getPlanningDeltaHours(alloc, preference);
    const trackedHoursFromTimer =
        showTaskTimer && timeEntriesSum !== undefined ? round2(timeEntriesSum) : null;

    const isCardLayout = showAllWeeks || isMobile;

    const displayTaskName = (() => {
        let cleanName = alloc.taskName || 'Tarea';
        cleanName = cleanName.replace(/\s*\(transferida de .+?(?:, original: .+?)?\)/g, '').trim();
        return cleanName || 'Tarea';
    })();

    const isTransferred = alloc.transferSourceEmployeeId || alloc.taskName?.includes('(transferida de') || alloc.transferredFromAllocationId;
    const isDistributed = alloc.distributionSourceAllocationId;
    const hasWeeklyFeedback = weeklyFeedback.some(fb => fb.allocationId === alloc.id);
    const wasAdjustedViaWeekly = hasWeeklyFeedback || isTransferred || isDistributed ||
        (alloc.hoursAssigned === 0 && alloc.hoursActual === 0 && alloc.hoursComputed === 0 && alloc.status === 'completed');
    const isZeroDueToWeekly = (alloc.hoursAssigned === 0 && alloc.hoursActual === 0 && alloc.hoursComputed === 0) &&
        (hasWeeklyFeedback || alloc.taskName?.includes('(transferida de'));

    return (
        <div className={cn(
            "group flex items-start transition-all touch-manipulation",
            isCardLayout ? "gap-2.5 p-3" : "gap-2 p-2.5",
            isCompleted
                ? "bg-slate-50/50 hover:bg-slate-100/50"
                : "hover:bg-primary/10/30"
        )}>
            <Checkbox
                checked={isCompleted}
                onCheckedChange={() => onToggleCompletion()}
                className={cn(
                    "shrink-0",
                    isCardLayout ? "mt-1 scale-110" : "mt-1",
                    isMobile && !isCardLayout && "scale-110",
                    isCompleted && "data-[state=checked]:bg-emerald-600"
                )}
            />
            <div className={cn("flex-1 min-w-0 flex flex-col", isCardLayout ? "gap-1.5" : "gap-2.5")}>
                <div className="flex items-start gap-2 min-w-0">
                    <div className="flex-1 min-w-0" onDoubleClick={() => onStartInlineEdit()}>
                        {isInlineEditing ? (
                            <Input
                                autoFocus
                                value={inlineNameValue}
                                onChange={e => onInlineNameChange(e.target.value)}
                                onBlur={() => onSaveInline()}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') onSaveInline();
                                }}
                                className={cn(isCardLayout ? "h-9 text-sm" : "h-6 text-xs")}
                            />
                        ) : (
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
                                {isFocusToday && (
                                    <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-amber-100 shrink-0" title="El empleado marcó esta tarea en foco para hoy">
                                        <Sun className="h-2.5 w-2.5 text-amber-600" aria-label="En foco hoy" />
                                    </span>
                                )}
                                <p
                                    className={cn(
                                        "font-medium leading-snug min-w-0",
                                        isCardLayout ? "text-sm line-clamp-2 flex-[1_1_8rem]" : "text-xs line-clamp-2 flex-1",
                                        isCompleted && "line-through text-slate-400"
                                    )}
                                    title={displayTaskName}
                                >
                                    <SensitiveText kind="task" id={alloc.id}>{displayTaskName}</SensitiveText>
                                </p>
                                {wasAdjustedViaWeekly && (
                                    <Badge variant="outline" className="h-5 px-1.5 text-[9px] bg-primary/10 text-indigo-700 border-indigo-200 shrink-0">
                                        Weekly
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center shrink-0 -mt-0.5">
                        <TaskNotesTrigger
                            allocationId={alloc.id}
                            noteCount={noteCount}
                            className={cn(
                                isCardLayout ? 'h-8 w-8' : isMobile ? 'h-11 w-11 min-h-[44px] min-w-[44px]' : 'h-6 w-6',
                                noteCount === 0 && 'opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity',
                                noteCount > 0 && 'opacity-100'
                            )}
                        />
                        <PlannerTaskContextMenu
                            alloc={alloc}
                            pendingTransfer={!!pendingTransfer}
                            isWeeklyEnabled={isWeeklyEnabled}
                            weeklyCloseDay={weeklyCloseDay}
                            nextWeekStart={nextWeekStart}
                            onStartEditFull={() => onStartEditFull()}
                            onTransfer={() => {
                                setTransferTask(alloc);
                                setTransferDialogOpen(true);
                            }}
                            onMoveTask={onMoveTask}
                            onOpenWeeklyForTask={onOpenWeeklyForTask}
                            triggerClassName={cn(
                                isCardLayout ? 'h-8 w-8' : isMobile ? 'h-11 w-11 min-h-[44px] min-w-[44px]' : 'h-5 w-5'
                            )}
                            iconClassName={isCardLayout ? 'h-4 w-4' : isMobile ? 'h-4 w-4' : 'h-3 w-3'}
                        />
                    </div>
                </div>

                {depTask && !isCompleted && (
                    <div className={cn(
                        "flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-md border w-fit max-w-full",
                        isDepReady
                            ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                            : "text-amber-700 bg-amber-50 border-amber-200"
                    )}>
                        {isDepReady ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : <LinkIcon className="w-3 h-3 shrink-0" />}
                        <span className="text-slate-600 shrink-0">{isDepReady ? 'Listo:' : 'Dep:'}</span>
                        {!showAllWeeks ? (
                            <>
                                <span className={cn("font-medium truncate", isDepReady ? "text-slate-700" : "text-slate-600")}>
                                    <SensitiveText kind="task" id={depTask.id}>{depTask.taskName}</SensitiveText>
                                </span>
                                {depOwner && (
                                    <>
                                        <Avatar className="h-3.5 w-3.5 border border-slate-300 shrink-0">
                                            <AvatarImage src={depOwner.avatarUrl} alt={depOwner.name} />
                                            <AvatarFallback className="bg-primary/100 text-white text-[6px] font-bold">
                                                {depOwner.name.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="font-semibold text-slate-800 truncate">
                                            <SensitiveText kind="employee" id={depOwner.id}>{depOwner.name}</SensitiveText>
                                        </span>
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                <span className={cn("font-medium truncate max-w-[140px]", isDepReady ? "text-slate-700" : "text-slate-600")} title={depTask.taskName}>
                                    <SensitiveText kind="task" id={depTask.id}>{depTask.taskName}</SensitiveText>
                                </span>
                                {depOwner && (
                                    <span className="font-semibold text-slate-800 truncate max-w-[80px]" title={depOwner.name}>
                                        <SensitiveText kind="employee" id={depOwner.id}>{depOwner.name.split(' ')[0]}</SensitiveText>
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                )}

                {blockingTasks.length > 0 && !isCompleted && (
                    <div className="flex flex-col gap-1">
                        {blockingTasks.map(bt => {
                            const blockedUser = employees.find(e => e.id === bt.employeeId);
                            const firstName = blockedUser?.name?.split(' ')[0] || 'Compañero';
                            return (
                                <div key={bt.id} className="flex items-center gap-1.5 text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded-md w-fit border border-amber-200">
                                    <Users className="w-3 h-3 shrink-0" />
                                    <span>💡 <strong>
                                        {blockedUser ? (
                                            <SensitiveText kind="employee" id={blockedUser.id}>{firstName}</SensitiveText>
                                        ) : (
                                            firstName
                                        )}
                                    </strong> te espera</span>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* MÉTRICAS — una sola fila compacta */}
                <div className={cn(isCardLayout ? "mt-0.5" : "mt-1")}>
                    {!isCompleted && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className={cn(
                                "inline-flex items-center gap-1 text-slate-600 bg-slate-100 rounded-md tabular-nums",
                                isCardLayout ? "text-xs px-2 py-0.5" : "text-[11px] px-2 py-1"
                            )}>
                                <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                                <span className="font-medium text-slate-500">Est.</span>
                                <span className="font-bold font-mono">{alloc.hoursAssigned}h</span>
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

                    {isCompleted && (
                        <div className="flex flex-wrap items-center gap-1.5">
                            <div className={cn(
                                "inline-flex items-center gap-1 text-slate-400 bg-slate-100 rounded-md tabular-nums",
                                isCardLayout ? "text-[11px] px-1.5 py-0.5" : "text-[10px] px-1.5 py-0.5"
                            )}>
                                <span>Est.</span>
                                <span className="font-mono font-medium">{alloc.hoursAssigned}h</span>
                            </div>

                            <div className={cn(
                                "inline-flex items-center gap-1 bg-blue-50 text-blue-800 rounded-md border border-blue-200 tabular-nums",
                                isCardLayout ? "text-[11px] px-1.5 py-0.5" : "text-[10px] px-1.5 py-0.5"
                            )}>
                                <span className="font-medium">Real</span>
                                <input
                                    key={`${alloc.id}-hoursActual-${alloc.hoursActual ?? 0}`}
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    defaultValue={alloc.hoursActual || 0}
                                    onBlur={(e) => onUpdateInlineHours('hoursActual', e.target.value)}
                                    className={cn(
                                        "w-9 text-center bg-transparent border-0 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-400 rounded font-bold font-mono",
                                        isCardLayout ? "text-xs" : "text-[11px]"
                                    )}
                                />
                            </div>

                            {preference !== 'actual' && (
                                <div className={cn(
                                    "inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 rounded-md border border-emerald-200 tabular-nums",
                                    isCardLayout ? "text-[11px] px-1.5 py-0.5" : "text-[10px] px-1.5 py-0.5"
                                )}>
                                    <span className="font-medium">Comp.</span>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        disabled={preference === 'actual'}
                                        defaultValue={alloc.hoursComputed || 0}
                                        onBlur={(e) => onUpdateInlineHours('hoursComputed', e.target.value)}
                                        className={cn(
                                            "w-9 text-center bg-transparent border-0 focus:outline-none focus:bg-white rounded font-bold font-mono",
                                            isCardLayout ? "text-xs" : "text-[11px]",
                                            preference === 'actual' ? "cursor-not-allowed opacity-50" : "focus:ring-1 focus:ring-emerald-400"
                                        )}
                                    />
                                </div>
                            )}

                            {showTaskTimer && trackedHoursFromTimer !== null && trackedHoursFromTimer > 0 && (
                                <div
                                    key={`${alloc.id}-timer-readonly-${trackedHoursFromTimer}`}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border font-mono font-medium tabular-nums bg-slate-50 border-slate-200 text-slate-600 text-[10px]"
                                    title="Tiempo imputado con el cronómetro"
                                    role="status"
                                >
                                    <Clock className="h-3 w-3 text-slate-400 shrink-0" aria-hidden />
                                    {formatDecimalHoursAsHm(trackedHoursFromTimer)}
                                </div>
                            )}

                            {taskDelta !== null && Math.abs(taskDelta) > 0.01 ? (
                                <span className={cn(
                                    "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-medium tabular-nums",
                                    isCardLayout ? "text-[11px]" : "text-[10px]",
                                    taskDelta >= 0
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-red-100 text-red-700"
                                )}>
                                    {taskDelta >= 0 ? <TrendingUp className="h-3 w-3 shrink-0" /> : <TrendingDown className="h-3 w-3 shrink-0" />}
                                    {taskDelta > 0 ? '+' : ''}{taskDelta}h
                                </span>
                            ) : taskDelta !== null ? (
                                <span className={cn("text-slate-400", isCardLayout ? "text-[11px]" : "text-[10px]")}>Exacto</span>
                            ) : null}

                            {isZeroDueToWeekly && (
                                <Badge variant="outline" className="h-5 px-1.5 text-[9px] bg-primary/10 text-indigo-700 border-indigo-200">
                                    Weekly
                                </Badge>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
