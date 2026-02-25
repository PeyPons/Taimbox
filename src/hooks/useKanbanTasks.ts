import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAgency } from '@/contexts/AgencyContext';
import { useApp } from '@/contexts/AppContext';
import { KanbanTask, KanbanTaskStatus, KanbanTaskType, KanbanTaskPriority, SOPItem } from '@/types';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'sonner';

interface KanbanTaskRow {
  id: string;
  agency_id: string;
  employee_id: string;
  client_id: string;
  allocation_id: string | null;
  title: string;
  task_type: KanbanTaskType;
  status: KanbanTaskStatus;
  priority: KanbanTaskPriority;
  platform: string | null;
  sop_checklist: SOPItem[];
  sop_template_id: string | null;
  due_date: string | null;
  week_start_date: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: KanbanTaskRow): KanbanTask {
  return {
    id: row.id,
    agencyId: row.agency_id,
    employeeId: row.employee_id,
    clientId: row.client_id,
    allocationId: row.allocation_id,
    title: row.title,
    taskType: row.task_type,
    status: row.status,
    priority: row.priority,
    platform: row.platform || undefined,
    sopChecklist: row.sop_checklist || [],
    sopTemplateId: row.sop_template_id,
    dueDate: row.due_date || undefined,
    weekStartDate: row.week_start_date,
    completedAt: row.completed_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface CreateKanbanTaskInput {
  clientId: string;
  title: string;
  taskType: KanbanTaskType;
  status?: KanbanTaskStatus;
  priority?: KanbanTaskPriority;
  platform?: string;
  sopChecklist?: SOPItem[];
  sopTemplateId?: string;
  dueDate?: string;
  weekStartDate: string;
  allocationId?: string;
}

export function useKanbanTasks(employeeId: string | undefined, month: Date) {
  const { currentAgency } = useAgency();
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const monthStart = format(startOfMonth(month), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(month), 'yyyy-MM-dd');

  const loadTasks = useCallback(async () => {
    if (!currentAgency?.id || !employeeId) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('kanban_tasks')
        .select('*')
        .eq('agency_id', currentAgency.id)
        .eq('employee_id', employeeId)
        .gte('week_start_date', monthStart)
        .lte('week_start_date', monthEnd)
        .order('created_at', { ascending: true });

      if (error) {
        if (error.code === '42P01') {
          setTasks([]);
          setIsLoading(false);
          return;
        }
        throw error;
      }

      setTasks((data || []).map(mapRow));
    } catch (error) {
      console.error('[useKanbanTasks] Error loading tasks:', error);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentAgency?.id, employeeId, monthStart, monthEnd]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const createTask = useCallback(async (input: CreateKanbanTaskInput): Promise<KanbanTask | null> => {
    if (!currentAgency?.id || !employeeId) return null;

    try {
      const { data, error } = await supabase
        .from('kanban_tasks')
        .insert({
          agency_id: currentAgency.id,
          employee_id: employeeId,
          client_id: input.clientId,
          allocation_id: input.allocationId || null,
          title: input.title,
          task_type: input.taskType,
          status: input.status || 'backlog',
          priority: input.priority || 'medium',
          platform: input.platform || null,
          sop_checklist: input.sopChecklist || [],
          sop_template_id: input.sopTemplateId || null,
          due_date: input.dueDate || null,
          week_start_date: input.weekStartDate,
        })
        .select()
        .single();

      if (error) throw error;

      const newTask = mapRow(data);
      setTasks(prev => [...prev, newTask]);
      return newTask;
    } catch (error) {
      console.error('[useKanbanTasks] Error creating task:', error);
      toast.error('Error al crear la tarea');
      return null;
    }
  }, [currentAgency?.id, employeeId]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<KanbanTask>): Promise<boolean> => {
    try {
      const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };

      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.taskType !== undefined) dbUpdates.task_type = updates.taskType;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.platform !== undefined) dbUpdates.platform = updates.platform;
      if (updates.sopChecklist !== undefined) dbUpdates.sop_checklist = updates.sopChecklist;
      if (updates.sopTemplateId !== undefined) dbUpdates.sop_template_id = updates.sopTemplateId;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
      if (updates.clientId !== undefined) dbUpdates.client_id = updates.clientId;
      if (updates.allocationId !== undefined) dbUpdates.allocation_id = updates.allocationId;

      if (updates.status !== undefined) {
        dbUpdates.status = updates.status;
        if (updates.status === 'done') {
          dbUpdates.completed_at = new Date().toISOString();
        } else {
          dbUpdates.completed_at = null;
        }
      }

      const { error } = await supabase
        .from('kanban_tasks')
        .update(dbUpdates)
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.map(t => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          ...updates,
          updatedAt: dbUpdates.updated_at as string,
          completedAt: dbUpdates.completed_at as string | undefined,
        };
      }));

      return true;
    } catch (error) {
      console.error('[useKanbanTasks] Error updating task:', error);
      toast.error('Error al actualizar la tarea');
      return false;
    }
  }, []);

  const deleteTask = useCallback(async (taskId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('kanban_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.filter(t => t.id !== taskId));
      return true;
    } catch (error) {
      console.error('[useKanbanTasks] Error deleting task:', error);
      toast.error('Error al eliminar la tarea');
      return false;
    }
  }, []);

  const moveTask = useCallback(async (taskId: string, newStatus: KanbanTaskStatus): Promise<boolean> => {
    return updateTask(taskId, { status: newStatus });
  }, [updateTask]);

  const tasksByStatus = useMemo(() => {
    const map: Record<KanbanTaskStatus, KanbanTask[]> = {
      'backlog': [],
      'todo': [],
      'in-progress': [],
      'review': [],
      'done': [],
    };

    for (const task of tasks) {
      if (map[task.status]) {
        map[task.status].push(task);
      }
    }

    for (const status of Object.keys(map) as KanbanTaskStatus[]) {
      map[status].sort((a, b) => {
        if (a.taskType === 'FIRE' && b.taskType !== 'FIRE') return -1;
        if (a.taskType !== 'FIRE' && b.taskType === 'FIRE') return 1;

        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
      });
    }

    return map;
  }, [tasks]);

  return {
    tasks,
    tasksByStatus,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    refreshTasks: loadTasks,
  };
}
