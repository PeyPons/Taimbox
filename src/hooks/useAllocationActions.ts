import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Allocation, NewTaskRow } from '@/types';
import { format, parseISO } from 'date-fns';
import { getWeekEndDate } from '@/utils/dateUtils';
import { useWeeklyCloseDay } from '@/hooks/useWeeklyCloseDay';
import { toast } from 'sonner';

export function useAllocationActions(employeeId: string, weeks: { weekStart: Date }[], canAssignToOthers: boolean, isWeeklyEnabled: boolean = true) {
    const { addAllocation, updateAllocation, deleteAllocation } = useApp();
    const weeklyCloseDay = useWeeklyCloseDay();

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

    const handleSave = async () => {
        if (isSaving) return;

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
                const savePromises = newTasks
                    .filter(task => task.projectId && task.hours)
                    .map(task => {
                        const targetEmployeeId = task.employeeId || employeeId;
                        return addAllocation({
                            employeeId: targetEmployeeId,
                            projectId: task.projectId,
                            taskName: task.taskName,
                            weekStartDate: task.weekDate,
                            hoursAssigned: parseFloat(task.hours),
                            status: 'planned',
                            description: task.description,
                            dependencyId: task.dependencyId === 'none' ? null : task.dependencyId
                        });
                    });

                await Promise.all(savePromises);
                setNewTasks([]); // Limpiar filas agregadas
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
        if (!editingAllocation) return;
        await deleteAllocation(editingAllocation.id);
        setShowDeleteConfirm(false);
        setIsFormOpen(false);
        setEditingAllocation(null);
    };

    const [recentlyToggled, setRecentlyToggled] = useState<Set<string>>(new Set());

    const toggleTaskCompletion = (allocation: Allocation) => {
        const isCompleting = allocation.status !== 'completed';
        setRecentlyToggled(prev => { const newSet = new Set(prev); newSet.add(allocation.id); return newSet; });
        updateAllocation({
            ...allocation,
            status: isCompleting ? 'completed' : 'planned',
            hoursActual: isCompleting ? allocation.hoursAssigned : 0,
            hoursComputed: isCompleting ? allocation.hoursAssigned : 0
        });
        setTimeout(() => { setRecentlyToggled(prev => { const newSet = new Set(prev); newSet.delete(allocation.id); return newSet; }); }, 120000);
    };

    const startInlineEdit = (allocation: Allocation) => {
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
            updateAllocation({ ...allocation, [field]: numValue });
        }
    };

    const moveTaskToWeek = (allocation: Allocation, targetWeekStartReal: Date) => {
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
        clearNewTasks
    };
}

