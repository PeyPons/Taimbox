import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Allocation, NewTaskRow } from '@/types';
import { format, parseISO } from 'date-fns';
import { getWeekEndDate } from '@/utils/dateUtils';
import { useWeeklyCloseDay } from '@/hooks/useWeeklyCloseDay';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { useAgency } from '@/contexts/AgencyContext';
import { toast } from '@/lib/notify';
import { supabase } from '@/lib/supabase';
import { round2 } from '@/utils/numbers';
import { mergeActualWithTimeEntriesSum } from '@/utils/timerReconcile';

export function useAllocationActions(employeeId: string, weeks: { weekStart: Date }[], canAssignToOthers: boolean, isWeeklyEnabled: boolean = true) {
    const { addAllocation, updateAllocation, deleteAllocation } = useApp();
    const weeklyCloseDay = useWeeklyCloseDay();
    const { currentAgency } = useAgency();
    const preference = currentAgency?.settings?.hoursTrackingPreference;
    const { isSoftLocked } = useSubscriptionLimits();

    // Guard: block all write operations when agency exceeds plan limits
    const guardSoftLock = (): boolean => {
        if (isSoftLocked) {
            toast.error('Tu agencia excede los límites del Plan Starter. Pasa a Pro o Business para editar.');
            return true;
        }
        return false;
    };

    // Estado para nuevas tareas (filas temporales)
    const [newTasks, setNewTasks] = useState<NewTaskRow[]>([]);

    // Estado para edición inline
    const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
    const [inlineNameValue, setInlineNameValue] = useState('');

    // Estado para edición completa (modal)
    const [editingAllocation, setEditingAllocation] = useState<Allocation | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Estados del formulario de edición
    const [editProjectId, setEditProjectId] = useState('');
    const [editTaskName, setEditTaskName] = useState('');
    const [editHours, setEditHours] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editWeek, setEditWeek] = useState('');
    const [editDependencyId, setEditDependencyId] = useState('none');

    const addTaskRow = (weekDate?: string) => {
        if (guardSoftLock()) return;
        const lastTask = newTasks.length > 0 ? newTasks[newTasks.length - 1] : null;
        const defaultKey = weeks.length > 0 ? format(weeks[0].weekStart, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
        const targetDate = weekDate || (lastTask ? lastTask.weekDate : defaultKey);

        setNewTasks(prev => [...prev, {
            id: crypto.randomUUID(),
            projectId: lastTask ? lastTask.projectId : '',
            taskName: '',
            hours: '',
            weekDate: targetDate,
            description: '',
            dependencyId: 'none',
            employeeId: canAssignToOthers ? undefined : employeeId
        }]);
    };

    const clearNewTasks = () => {
        setNewTasks([]);
    };

    const cancelInlineEdit = () => {
        setInlineEditingId(null);
        setInlineNameValue('');
    };

    const removeTaskRow = (id: string) => {
        setNewTasks(prev => prev.filter(t => t.id !== id));
    };

    const updateTaskRow = (id: string, field: keyof NewTaskRow, value: string) => {
        setNewTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    const rowHasPartialData = (t: NewTaskRow) =>
        t.taskName.trim().length > 0 ||
        (t.hours !== '' && !Number.isNaN(parseFloat(t.hours)) && parseFloat(t.hours) > 0);

    const canSubmitBatchAdd = useMemo(() => {
        const anyRowWithDataButNoProject = newTasks.some(t => rowHasPartialData(t) && !t.projectId);
        const atLeastOneComplete = newTasks.some(
            t => Boolean(t.projectId) && t.taskName.trim().length > 0 && parseFloat(t.hours) > 0
        );
        return atLeastOneComplete && !anyRowWithDataButNoProject;
    }, [newTasks]);

    const batchAddHint = useMemo(() => {
        if (newTasks.some(t => rowHasPartialData(t) && !t.projectId)) {
            return 'Selecciona un proyecto en cada fila que tenga nombre u horas.';
        }
        if (!newTasks.some(t => Boolean(t.projectId) && t.taskName.trim() && parseFloat(t.hours) > 0)) {
            return 'Completa al menos una fila: proyecto, nombre de tarea y horas.';
        }
        return null;
    }, [newTasks]);

    const handleSave = async () => {
        if (isSaving || guardSoftLock()) return;

        if (!editingAllocation) {
            if (!canSubmitBatchAdd) {
                toast.error(batchAddHint || 'Revisa proyecto, nombre y horas en cada fila.');
                return;
            }
        }

        setIsSaving(true);
        try {
            if (editingAllocation) {
                if (!editProjectId || !editHours) {
                    setIsSaving(false);
                    return;
                }
                await updateAllocation({
                    ...editingAllocation,
                    projectId: editProjectId,
                    taskName: editTaskName,
                    weekStartDate: editWeek,
                    hoursAssigned: parseFloat(editHours),
                    description: editDescription,
                    dependencyId: editDependencyId === 'none' ? null : editDependencyId
                });
            } else {
                const validTasks = newTasks.filter(
                    t => t.projectId && t.taskName.trim() && parseFloat(t.hours) > 0
                );
                if (validTasks.length === 0) {
                    toast.error('No hay tareas válidas para guardar.');
                    setIsSaving(false);
                    return;
                }
                const savePromises = validTasks.map(task => {
                    const targetEmployeeId = task.employeeId || employeeId;
                    return addAllocation({
                        employeeId: targetEmployeeId,
                        projectId: task.projectId,
                        taskName: task.taskName.trim(),
                        weekStartDate: task.weekDate,
                        hoursAssigned: parseFloat(task.hours),
                        status: 'planned',
                        description: task.description,
                        dependencyId: task.dependencyId === 'none' ? null : task.dependencyId
                    });
                });

                await Promise.all(savePromises);
                setNewTasks([]);
            }
            setIsFormOpen(false);
            setEditingAllocation(null);
        } catch (error) {
            console.error('Error guardando tareas:', error);
            toast.error('Error al guardar las tareas');
        } finally {
            setIsSaving(false);
        }
    };

    const startEditFull = (allocation: Allocation) => {
        if (guardSoftLock()) return;
        if (isWeeklyEnabled) {
            try {
                const taskWeekDate = parseISO(allocation.weekStartDate);
                const taskWeekEnd = getWeekEndDate(taskWeekDate, weeklyCloseDay);
                const today = new Date();

                if (taskWeekEnd < today) {
                    toast.error('No puedes editar tareas de semanas pasadas. Usa el botón "Weekly" para gestionarlas.');
                    return;
                }
            } catch {
                // Si hay error parseando, permitir editar
            }
        }

        setEditingAllocation(allocation);
        setEditProjectId(allocation.projectId);
        setEditTaskName(allocation.taskName || '');
        setEditHours(allocation.hoursAssigned.toString());
        setEditDescription(allocation.description || '');
        setEditWeek(allocation.weekStartDate);
        setEditDependencyId(allocation.dependencyId || 'none');
        setIsFormOpen(true);
    };

    const handleDeleteClick = () => {
        if (!editingAllocation) return;
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!editingAllocation || guardSoftLock()) return;
        await deleteAllocation(editingAllocation.id);
        setShowDeleteConfirm(false);
        setIsFormOpen(false);
        setEditingAllocation(null);
    };

    const [recentlyToggled, setRecentlyToggled] = useState<Set<string>>(new Set());

    const toggleTaskCompletion = async (allocation: Allocation) => {
        if (guardSoftLock()) return;
        const isCompleting = allocation.status !== 'completed';
        setRecentlyToggled(prev => { const newSet = new Set(prev); newSet.add(allocation.id); return newSet; });

        const clearRecent = () => {
            setTimeout(() => { setRecentlyToggled(prev => { const newSet = new Set(prev); newSet.delete(allocation.id); return newSet; }); }, 120000);
        };

        if (!isCompleting) {
            // No poner hoursActual/hoursComputed a 0: borraría en BD el tiempo ya imputado (cronómetro / Real).
            await updateAllocation({
                id: allocation.id,
                status: 'planned',
            });
            clearRecent();
            return;
        }

        const timeTrackerOn = currentAgency?.settings?.modules?.timeTracker === true;
        let working = { ...allocation };

        let flushHoursFallback: number | null = null;
        if (timeTrackerOn) {
            const { data: active } = await supabase
                .from('active_timers')
                .select('started_at, allocation_id')
                .eq('employee_id', allocation.employeeId)
                .maybeSingle();
            if (active?.started_at && active.allocation_id === allocation.id) {
                let secondsToLog = Math.max(0, Math.floor((Date.now() - new Date(active.started_at).getTime()) / 1000));
                if (secondsToLog < 1) secondsToLog = 1;
                const hoursToLog = Number((secondsToLog / 3600).toFixed(6));
                flushHoursFallback = hoursToLog;
                const pDate = new Date().toISOString().split('T')[0];
                const { error } = await supabase.rpc('log_timer_hours', {
                    p_employee_id: allocation.employeeId,
                    p_allocation_id: allocation.id,
                    p_hours: hoursToLog,
                    p_notes: null,
                    p_date: pDate,
                });
                if (error) {
                    toast.error('No se pudo cerrar el cronómetro al completar. Para el cronómetro e inténtalo de nuevo.');
                    setRecentlyToggled(prev => { const newSet = new Set(prev); newSet.delete(allocation.id); return newSet; });
                    return;
                }
                window.dispatchEvent(new CustomEvent('timeboxing_timer_stopped'));
                new BroadcastChannel('timer_sync').postMessage('update');
            }

            // Tras parar el cronómetro el cliente suele tener hoursActual desactualizado; la verdad está en BD.
            const [{ data: fresh }, { data: teRows }] = await Promise.all([
                supabase
                    .from('allocations')
                    .select('hours_actual, hours_computed')
                    .eq('id', allocation.id)
                    .maybeSingle(),
                supabase
                    .from('time_entries')
                    .select('hours')
                    .eq('allocation_id', allocation.id)
                    .eq('employee_id', allocation.employeeId),
            ]);
            if (fresh) {
                const rawA = fresh.hours_actual != null ? Number(fresh.hours_actual) : 0;
                const rawC = fresh.hours_computed != null ? Number(fresh.hours_computed) : 0;
                const roundedA = round2(rawA);
                const roundedC = round2(rawC);
                working = {
                    ...working,
                    hoursActual: rawA > 0 && roundedA === 0 ? rawA : roundedA,
                    hoursComputed: rawC > 0 && roundedC === 0 ? rawC : roundedC,
                };
            } else if (flushHoursFallback != null) {
                working = {
                    ...working,
                    hoursActual: round2((allocation.hoursActual ?? 0) + flushHoursFallback),
                };
            }

            const sumEntriesRaw = (teRows ?? []).reduce((s, row) => s + Number(row?.hours ?? 0), 0);
            const mergedActual = mergeActualWithTimeEntriesSum(
                working.hoursActual,
                working.hoursAssigned,
                sumEntriesRaw
            );
            if (Math.abs(mergedActual - (working.hoursActual ?? 0)) > 1e-4) {
                working = { ...working, hoursActual: mergedActual };
            }
        }

        const assigned = working.hoursAssigned;
        const hoursActualNum = working.hoursActual ?? 0;
        const preserveTracked = timeTrackerOn && hoursActualNum > 0;

        let nextActual: number;
        let nextComputed: number;
        if (preserveTracked) {
            nextActual = hoursActualNum;
            nextComputed = preference === 'actual' ? nextActual : assigned;
        } else {
            nextActual = assigned;
            nextComputed = assigned;
        }

        await updateAllocation({
            ...working,
            status: 'completed',
            hoursActual: nextActual,
            hoursComputed: nextComputed,
        });
        clearRecent();
    };

    const startInlineEdit = (allocation: Allocation) => {
        if (guardSoftLock()) return;
        if (isWeeklyEnabled) {
            try {
                const taskWeekDate = parseISO(allocation.weekStartDate);
                const taskWeekEnd = getWeekEndDate(taskWeekDate, weeklyCloseDay);
                const today = new Date();

                if (taskWeekEnd < today) {
                    toast.error('No puedes editar tareas de semanas pasadas. Usa el botón "Weekly" para gestionarlas.');
                    return;
                }
            } catch {
                // Ignorar error
            }
        }

        setInlineEditingId(allocation.id);
        setInlineNameValue(allocation.taskName || '');
    };

    const saveInlineEdit = (allocation: Allocation) => {
        if (inlineNameValue.trim() !== allocation.taskName) {
            updateAllocation({ ...allocation, taskName: inlineNameValue });
        }
        setInlineEditingId(null);
    };

    const updateInlineHours = (allocation: Allocation, field: 'hoursActual' | 'hoursComputed', value: string) => {
        const numValue = parseFloat(value) || 0;
        if (allocation[field] !== numValue) {
            const updates: Partial<Allocation> = { [field]: numValue };
            if (field === 'hoursActual' && preference === 'actual') {
                updates.hoursComputed = numValue;
            }
            updateAllocation({ ...allocation, ...updates });
        }
    };

    const moveTaskToWeek = (allocation: Allocation, targetWeekStartReal: Date) => {
        if (guardSoftLock()) return;
        const targetKey = format(targetWeekStartReal, 'yyyy-MM-dd');
        updateAllocation({ ...allocation, weekStartDate: targetKey });
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingAllocation(null);
    };

    return {
        newTasks,
        setNewTasks,
        inlineEditingId,
        inlineNameValue,
        setInlineNameValue,
        editingAllocation,
        isFormOpen,
        setIsFormOpen,
        isSaving,
        showDeleteConfirm,
        setShowDeleteConfirm,
        editProjectId,
        setEditProjectId,
        editTaskName,
        setEditTaskName,
        editHours,
        setEditHours,
        editDescription,
        setEditDescription,
        editWeek,
        setEditWeek,
        editDependencyId,
        setEditDependencyId,
        addTaskRow,
        removeTaskRow,
        updateTaskRow,
        handleSave,
        startEditFull,
        handleDeleteClick,
        confirmDelete,
        toggleTaskCompletion,
        startInlineEdit,
        saveInlineEdit,
        updateInlineHours,
        moveTaskToWeek,
        closeForm,
        recentlyToggled,
        cancelInlineEdit,
        clearNewTasks,
        canSubmitBatchAdd,
        batchAddHint
    };
}

