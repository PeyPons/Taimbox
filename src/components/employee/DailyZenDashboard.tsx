import { useMemo, useState, useCallback, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format, startOfWeek, addDays, addMinutes, setHours, setMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    CheckCircle2, GripVertical, ChevronDown, ChevronUp, Loader2,
    Lock, AlertTriangle, Calendar, Battery, MoreHorizontal, ArrowDown, Clock, Zap, Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Allocation } from '@/types';
import { RoutineManagerDialog } from './RoutineManagerDialog';

const ZEN_ONBOARDING_KEY = 'zen_mode_onboarding_shown';
const DEFAULT_DAILY_CAPACITY = 8;

interface DailyZenDashboardProps {
    employeeId: string;
    viewDate?: Date;
}

export function DailyZenDashboard({ employeeId, viewDate = new Date() }: DailyZenDashboardProps) {
    const { allocations, projects, clients, employees, updateAllocation, addAllocation } = useApp();
    const [showCompleted, setShowCompleted] = useState(false);
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
    const [isSavingOrder, setIsSavingOrder] = useState(false);
    const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

    // Dialog state
    const [taskToComplete, setTaskToComplete] = useState<Allocation | null>(null);
    const [showCompleteDialog, setShowCompleteDialog] = useState(false);
    const [customHours, setCustomHours] = useState('');
    const [isEditingHours, setIsEditingHours] = useState(false);

    // Quick Task State
    const [quickTaskText, setQuickTaskText] = useState('');
    const [isCreatingQuick, setIsCreatingQuick] = useState(false);

    // Capacidad
    const currentEmployee = employees.find(e => e.id === employeeId);
    const dailyCapacity = currentEmployee?.defaultWeeklyCapacity
        ? currentEmployee.defaultWeeklyCapacity / 5
        : DEFAULT_DAILY_CAPACITY;

    useEffect(() => {
        const hasSeenOnboarding = localStorage.getItem(ZEN_ONBOARDING_KEY);
        if (!hasSeenOnboarding) {
            setTimeout(() => {
                toast('🌊 Nuevo Modo Fluido', {
                    description: 'Arrastra tareas hacia arriba para llenar tu día. La línea azul marca tu límite.',
                    duration: 6000,
                });
                localStorage.setItem(ZEN_ONBOARDING_KEY, 'true');
            }, 1000);
        }
    }, []);

    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekStartFormatted = format(weekStart, 'yyyy-MM-dd');

    // 1. Obtener todas las tareas de la semana
    const weekTasks = useMemo(() => {
        return allocations.filter(a => {
            if (a.employeeId !== employeeId) return false;
            try { return a.weekStartDate === weekStartFormatted; } catch { return false; }
        });
    }, [allocations, employeeId, weekStartFormatted]);

    // 2. Tareas completadas (para historial)
    const completedTasks = useMemo(() => weekTasks.filter(a => a.status === 'completed'), [weekTasks]);

    // 3. Tareas pendientes ordenadas (Lista Única)
    const pendingTasks = useMemo(() => {
        const tasks = weekTasks.filter(a => a.status !== 'completed');
        return tasks.sort((a, b) => {
            // 1. Prioridad ABSOLUTA: Active / In Progress siempre primero
            const isActiveA = a.status === 'active' || a.status === 'in_progress';
            const isActiveB = b.status === 'active' || b.status === 'in_progress';
            if (isActiveA && !isActiveB) return -1;
            if (!isActiveA && isActiveB) return 1;

            // 2. Prioridad de Usuario (Drag & Drop)
            if (a.userPriority !== null && a.userPriority !== undefined && b.userPriority !== null && b.userPriority !== undefined) {
                return a.userPriority - b.userPriority;
            }
            if (a.userPriority !== null && a.userPriority !== undefined) return -1;
            if (b.userPriority !== null && b.userPriority !== undefined) return 1;

            // 3. Fallback: Horas (Mayor a menor)
            return (b.hoursAssigned || 0) - (a.hoursAssigned || 0);
        });
    }, [weekTasks]);

    // Helpers
    const isTaskBlocked = useCallback((task: Allocation) => {
        if (!task.dependencyId) return { blocked: false };
        const blocker = allocations.find(a => a.id === task.dependencyId);
        if (!blocker) return { blocked: false };
        if (blocker.status !== 'completed') {
            return { blocked: true, blockerName: blocker.taskName || 'Tarea anterior' };
        }
        return { blocked: false };
    }, [allocations]);

    const getProjectInfo = (projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return { name: 'Proyecto', clientName: '', color: '#94a3b8' };
        const client = clients.find(c => c.id === project.clientId);
        return {
            name: project.name,
            clientName: client?.name || '',
            color: client?.color || '#94a3b8'
        };
    };

    const formatTime = (hours: number): string => {
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        if (h === 0) return `${m}m`;
        if (m === 0) return `${h}h`;
        return `${h}h ${m}m`;
    };

    // Actions
    const handleStartComplete = (task: Allocation) => {
        const blockStatus = isTaskBlocked(task);
        if (blockStatus.blocked) {
            toast.error(`Tarea bloqueada por: ${blockStatus.blockerName}`, { icon: '🔒' });
            return;
        }
        setTaskToComplete(task);
        setCustomHours(String(task.hoursAssigned || 0));
        setIsEditingHours(false);
        setShowCompleteDialog(true);
    };

    const handleConfirmComplete = async () => {
        if (!taskToComplete) return;
        const hours = isEditingHours ? (parseFloat(customHours) || 0) : (taskToComplete.hoursAssigned || 0);
        setCompletingTaskId(taskToComplete.id);
        try {
            await updateAllocation({ ...taskToComplete, status: 'completed', hoursActual: hours });
            toast.success(`Completada (${formatTime(hours)})`);
            setShowCompleteDialog(false);
        } catch {
            toast.error('Error al completar');
        } finally {
            setCompletingTaskId(null);
            setTaskToComplete(null);
        }
    };

    // Quick Task Handler (Modo Relax: Solo añadir, no iniciar reloj)
    const handleQuickTask = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!quickTaskText.trim() || isCreatingQuick) return;

        setIsCreatingQuick(true);
        try {
            // Buscamos proyecto base
            const internalProject = projects.find(p => p.name.includes('internas') || p.name.includes('General')) || projects[0];

            if (!internalProject) {
                toast.error("No hay proyectos activos para asignar la tarea rápida");
                return;
            }

            // Simplemente añadimos la tarea a la pila (top priority)
            await addAllocation({
                projectId: internalProject.id,
                employeeId,
                weekStartDate: weekStartFormatted,
                taskName: quickTaskText,
                hoursAssigned: 0.5, // 30 min default
                status: 'planned',  // Sin presión, solo planificada
                hoursActual: 0,
                userPriority: -9999 // Tope absoluto
            });

            setQuickTaskText('');
            toast.success("Tarea añadida a la pila");
        } catch (error) {
            console.error(error);
            toast.error("Error creando tarea");
        } finally {
            setIsCreatingQuick(false);
        }
    };

    // Drag & Drop Unificado
    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        setDraggedTaskId(taskId);
        e.dataTransfer.effectAllowed = 'move';
        // Hack para ocultar ghost image default si quisiéramos, por ahora standard
    };

    const handleDragOver = (e: React.DragEvent, taskId: string) => {
        e.preventDefault();
        if (taskId !== draggedTaskId) setDragOverTaskId(taskId);
    };

    const handleDrop = async (e: React.DragEvent, dropTargetId: string) => {
        e.preventDefault();
        setDragOverTaskId(null);
        if (!draggedTaskId || draggedTaskId === dropTargetId) {
            setDraggedTaskId(null);
            return;
        }

        const fromIndex = pendingTasks.findIndex(t => t.id === draggedTaskId);
        const toIndex = pendingTasks.findIndex(t => t.id === dropTargetId);
        if (fromIndex === -1 || toIndex === -1) return;

        const newOrder = [...pendingTasks];
        const [moved] = newOrder.splice(fromIndex, 1);
        newOrder.splice(toIndex, 0, moved);

        setIsSavingOrder(true);
        try {
            // Actualizar prioridades en bloque
            await Promise.all(newOrder.map((t, i) => updateAllocation({ ...t, userPriority: i })));
            toast.success('Orden actualizado');
        } catch {
            toast.error('Error al guardar orden');
        } finally {
            setIsSavingOrder(false);
            setDraggedTaskId(null);
        }
    };

    // Render Stats
    const hoursCompletedToday = completedTasks.reduce((sum, t) => sum + (t.hoursActual || t.hoursAssigned || 0), 0);

    // Calcular Timeblocking Dinámico (Actualizado: Anchor to NOW real)
    // Usamos la hora actual como punto de partida para lo pendiente.
    // Redondeamos al próximo bloque de 5 min para que se vea limpio.
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 5) * 5;
    const baseTime = setMinutes(new Date(), roundedMinutes);

    // El tiempo de inicio de las pendientes es AHORA MISMO (ETA)
    let currentScheduleTime = baseTime;

    // Lista renderizada con cálculo acumulativo local
    let accumulatedHours = 0;

    return (
        <TooltipProvider delayDuration={200}>
            <div className="max-w-3xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">

                {/* 1. Header Moderno */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 sticky top-0 z-10 backdrop-blur-md bg-white/95 transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                {format(today, "EEEE, d 'de' MMMM", { locale: es })}
                            </h1>
                            <p className="text-slate-500 text-sm mt-0.5 flex items-center gap-2">
                                <Battery className="h-4 w-4" />
                                Capacidad diaria: <span className="font-medium text-slate-700">{formatTime(dailyCapacity)}</span>
                            </p>
                        </div>

                        {/* Botón Rutinas */}
                        <div className="flex-1 flex justify-center px-4 hidden sm:flex">
                            <RoutineManagerDialog />
                        </div>

                        <div className="text-right">
                            <div className="flex items-center justify-end gap-2 mb-1">
                                <span className={cn(
                                    "text-2xl font-bold transition-colors",
                                    hoursCompletedToday > dailyCapacity ? "text-red-500" : "text-primary"
                                )}>{formatTime(hoursCompletedToday)}</span>
                                <span className="text-slate-400 text-sm font-medium uppercase tracking-wide">Hechas</span>
                            </div>
                            <Progress
                                value={(hoursCompletedToday / dailyCapacity) * 100}
                                className={cn("w-32 h-2 ml-auto", hoursCompletedToday > dailyCapacity && "bg-slate-100 [&>div]:bg-red-500")}
                            />
                        </div>
                    </div>

                    {/* Quick Input Bar */}
                    <form onSubmit={handleQuickTask} className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500">
                            <Zap className={cn("h-5 w-5", isCreatingQuick && "animate-pulse")} />
                        </div>
                        <Input
                            value={quickTaskText}
                            onChange={(e) => setQuickTaskText(e.target.value)}
                            placeholder="¿Qué acaba de surgir? (Enter para añadir)"
                            className="pl-10 pr-24 h-12 text-lg shadow-sm border-slate-200 focus:border-amber-400 focus:ring-amber-400/20 bg-slate-50/50 focus:bg-white transition-all"
                            disabled={isCreatingQuick}
                        />
                        <Button
                            type="submit"
                            size="sm"
                            disabled={!quickTaskText.trim() || isCreatingQuick}
                            className="absolute right-1.5 top-1.5 bottom-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium px-4 shadow-none transition-all"
                        >
                            {isCreatingQuick ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="flex items-center gap-1"><Plus className="h-4 w-4" /> AÑADIR</span>}
                        </Button>
                    </form>
                </div>

                {/* Visual Capacity Stack (Floating Widget) */}
                <div className="fixed right-4 top-1/2 -translate-y-1/2 hidden xl:flex flex-col items-center gap-2 bg-white p-3 rounded-2xl shadow-xl border border-slate-100 z-50">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest rotate-180" style={{ writingMode: 'vertical-rl' }}>Tu Día</span>
                    <div className="w-4 h-64 bg-slate-100 rounded-full relative overflow-hidden flex flex-col-reverse">
                        {/* Fondo base (capacidad total) */}
                        <div className="absolute inset-0 bg-slate-100 w-full h-full" />

                        {/* Bloque Completado */}
                        <div
                            className="w-full bg-slate-300 transition-all duration-500"
                            style={{ height: `${Math.min((hoursCompletedToday / dailyCapacity) * 100, 100)}%` }}
                        />

                        {/* Bloque Pendiente (Estimado) */}
                        {(() => {
                            // Calcular pending hours
                            const pendingHours = pendingTasks.reduce((sum, t) => sum + (t.hoursAssigned || 0), 0);
                            const totalProjected = hoursCompletedToday + pendingHours;
                            const pendingHeight = (pendingHours / dailyCapacity) * 100;
                            const isOverload = totalProjected > dailyCapacity;

                            return (
                                <div
                                    className={cn(
                                        "w-full transition-all duration-500 relative",
                                        isOverload ? "bg-red-400" : "bg-emerald-400"
                                    )}
                                    style={{ height: `${Math.min(pendingHeight, 100 - ((hoursCompletedToday / dailyCapacity) * 100))}%` }}
                                >
                                    {isOverload && (
                                        <div className="absolute -top-1 left-0 right-0 h-1 bg-red-600 animate-pulse" />
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                    <span className={cn(
                        "text-xs font-bold",
                        (hoursCompletedToday + pendingTasks.reduce((s, t) => s + (t.hoursAssigned || 0), 0)) > dailyCapacity
                            ? "text-red-500"
                            : "text-emerald-500"
                    )}>
                        {formatTime(hoursCompletedToday + pendingTasks.reduce((s, t) => s + (t.hoursAssigned || 0), 0))}
                    </span>
                </div>

                {/* 2. Lista de Tareas Fluida */}
                <div className="space-y-3">
                    {pendingTasks.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                            <CheckCircle2 className="h-16 w-16 text-emerald-200 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-slate-700">¡Todo al día!</h3>
                            <p className="text-slate-500 max-w-xs mx-auto mt-2">No tienes tareas pendientes para esta semana. Tómate un café ☕</p>
                        </div>
                    ) : (
                        pendingTasks.map((task, index) => {
                            const blockStatus = isTaskBlocked(task);
                            const projectInfo = getProjectInfo(task.projectId);
                            const hours = task.hoursAssigned || 0;

                            // Lógica de línea de corte
                            const prevAccumulated = accumulatedHours;
                            accumulatedHours += hours;
                            const isWithinCapacity = prevAccumulated < dailyCapacity;
                            const showsCapacityLine = !isWithinCapacity && prevAccumulated < dailyCapacity + hours; // Justo se pasa aquí (opcional) o mostrar línea ANTES de la tarea que se pasa

                            // Mejor: Mostrar separador SI la tarea anterior estaba dentro y esta ya no (o es la primera que se pasa)
                            const isFirstOverCapacity = prevAccumulated < dailyCapacity && accumulatedHours >= dailyCapacity;
                            const isWayOverCapacity = prevAccumulated >= dailyCapacity;

                            return (
                                <div key={task.id}>
                                    {/* Línea de Capacidad */}
                                    {isFirstOverCapacity && index > 0 && (
                                        <div className="py-4 flex items-center gap-4 text-slate-400">
                                            <div className="h-px bg-slate-200 flex-1" />
                                            <span className="text-xs font-medium uppercase tracking-widest flex items-center gap-1">
                                                <ArrowDown className="h-3 w-3" /> Límite sugerido ({formatTime(dailyCapacity)})
                                            </span>
                                            <div className="h-px bg-slate-200 flex-1" />
                                        </div>
                                    )}

                                    <div
                                        draggable={!blockStatus.blocked}
                                        onDragStart={(e) => handleDragStart(e, task.id)}
                                        onDragOver={(e) => handleDragOver(e, task.id)}
                                        onDrop={(e) => handleDrop(e, task.id)}
                                        className={cn(
                                            "group relative bg-white rounded-xl p-0 transition-all duration-200 border-2 flex overflow-hidden", // p-0 para manejar layout interno
                                            // Estilos base
                                            "hover:shadow-md hover:border-slate-300",
                                            // Estilos drag
                                            draggedTaskId === task.id && "opacity-40 scale-95",
                                            dragOverTaskId === task.id && "border-primary bg-primary/5 scale-[1.02]",
                                            // Estilos según estado
                                            blockStatus.blocked
                                                ? "border-slate-100 bg-slate-50 opacity-75"
                                                : isWayOverCapacity
                                                    ? "border-transparent opacity-80 bg-slate-50/[0.5] hover:opacity-100 hover:bg-white" // Tareas en backlog visualmente sutiles
                                                    : "border-transparent shadow-sm" // Tareas en foco
                                        )}
                                    >
                                        {/* Columna Horaria (Timeblocking Dinámico) */}
                                        <div className={cn(
                                            "w-20 flex flex-col items-center justify-center border-r border-slate-100 px-2 py-4 text-xs font-mono font-medium text-slate-500 bg-slate-50/50",
                                            isWayOverCapacity && "opacity-50 text-slate-300"
                                        )}>
                                            <span>{format(currentScheduleTime, 'HH:mm')}</span>
                                            <div className="h-4 w-px bg-slate-200 my-0.5" />
                                            <span className="text-slate-400">
                                                {(() => {
                                                    const endTime = addMinutes(currentScheduleTime, hours * 60);
                                                    // Actualizamos variable para la siguiente iteración
                                                    const displayEndTime = format(endTime, 'HH:mm');
                                                    currentScheduleTime = endTime; // Side effect intencional para encadenar
                                                    return displayEndTime;
                                                })()}
                                            </span>
                                        </div>

                                        <div className="flex-1 flex items-start gap-4 p-4">
                                            {/* Checkbox Action */}
                                            <button
                                                onClick={() => handleStartComplete(task)}
                                                disabled={blockStatus.blocked || isSavingOrder}
                                                className={cn(
                                                    "mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0",
                                                    blockStatus.blocked
                                                        ? "border-slate-200 bg-slate-100 cursor-not-allowed"
                                                        : "border-slate-300 hover:border-primary hover:bg-primary hover:text-white"
                                                )}
                                            >
                                                {blockStatus.blocked && <Lock className="h-3 w-3 text-slate-400" />}
                                            </button>

                                            <div className="flex-1 min-w-0 pt-0.5">
                                                {/* Meta info superior */}
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: projectInfo.color }} />
                                                    <span className="text-xs font-medium text-slate-500 truncate max-w-[200px]">
                                                        {projectInfo.clientName}
                                                        {projectInfo.name && <span className="text-slate-300 mx-1">/</span>}
                                                        {projectInfo.name}
                                                    </span>
                                                    {(task.status === 'active' || task.status === 'in_progress') && (
                                                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100">
                                                            En curso
                                                        </Badge>
                                                    )}
                                                </div>

                                                {/* Título */}
                                                <h4 className={cn(
                                                    "font-medium text-slate-900 leading-snug",
                                                    blockStatus.blocked && "text-slate-500"
                                                )}>
                                                    {task.taskName || "Sin título"}
                                                </h4>

                                                {/* Alerta de bloqueo */}
                                                {blockStatus.blocked && (
                                                    <div className="mt-2 flex items-center gap-2 text-xs text-red-500 bg-red-50 px-2 py-1 rounded-md w-fit">
                                                        <Lock className="h-3 w-3" />
                                                        <span>Bloqueada por: <strong>{blockStatus.blockerName}</strong></span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Tiempo y Grip */}
                                            <div className="flex flex-col items-end gap-2">
                                                <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md">
                                                    <Clock className="h-3 w-3 text-slate-400" />
                                                    <span className="text-xs font-bold text-slate-600">{formatTime(hours)}</span>
                                                </div>

                                                <div className={cn(
                                                    "text-slate-300 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity p-1 hover:text-slate-500",
                                                    blockStatus.blocked && "hidden"
                                                )}>
                                                    <GripVertical className="h-4 w-4" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* 3. Footer Completados */}
                <div className="pt-8 border-t border-slate-100">
                    <button
                        onClick={() => setShowCompleted(!showCompleted)}
                        className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition-colors mx-auto"
                    >
                        <span>{showCompleted ? 'Ocultar' : 'Ver'} historial de hoy ({completedTasks.length})</span>
                        {showCompleted ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>

                    {showCompleted && (
                        <div className="mt-4 space-y-2 opacity-75">
                            {completedTasks.map(task => (
                                <div key={task.id} className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                                    <span className="text-sm text-slate-500 line-through flex-1">{task.taskName}</span>
                                    <span className="text-xs text-slate-400 font-mono italic">
                                        {formatTime(task.hoursActual || task.hoursAssigned || 0)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Dialog de Completar */}
                <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
                    <AlertDialogContent className="max-w-md rounded-2xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-emerald-600">
                                <CheckCircle2 className="h-6 w-6" />
                                ¡Tarea Completada!
                            </AlertDialogTitle>
                            <AlertDialogDescription asChild>
                                <div className="text-slate-600 pt-2 text-sm">
                                    <div className="p-3 bg-slate-50 rounded-lg mb-4 border border-slate-100">
                                        <p className="font-medium text-slate-900">{taskToComplete?.taskName}</p>
                                        <p className="text-xs text-slate-500 mt-1">Estimado: {formatTime(taskToComplete?.hoursAssigned || 0)}</p>
                                    </div>

                                    {isEditingHours ? (
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 block">Horas reales invertidas:</label>
                                            <div className="flex gap-2">
                                                <Input
                                                    type="number" step="0.5"
                                                    value={customHours} onChange={e => setCustomHours(e.target.value)}
                                                    className="text-lg font-mono" autoFocus
                                                />
                                                <Button variant="outline" onClick={() => { setIsEditingHours(false); setCustomHours(''); }}>
                                                    Volver
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p>¿Registramos el tiempo estimado o quieres ajustarlo?</p>
                                    )}
                                </div>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-2">
                            {!isEditingHours && (
                                <>
                                    <Button variant="ghost" onClick={() => setIsEditingHours(true)}>
                                        Ajustar tiempo
                                    </Button>
                                    <AlertDialogAction onClick={handleConfirmComplete} className="bg-emerald-600 hover:bg-emerald-700">
                                        Registrar {formatTime(taskToComplete?.hoursAssigned || 0)}
                                    </AlertDialogAction>
                                </>
                            )}
                            {isEditingHours && (
                                <AlertDialogAction onClick={handleConfirmComplete} className="bg-emerald-600 hover:bg-emerald-700 w-full">
                                    Confirmar {customHours || 0}h
                                </AlertDialogAction>
                            )}
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </TooltipProvider>
    );
}
