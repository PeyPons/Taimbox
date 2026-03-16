/**
 * Hook de edición inline en Deadlines: locks (adquirir/renovar/liberar),
 * estado del formulario inline, autoSave, handleFormPatch. Usado solo por DeadlinesPage.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { Deadline } from '@/types';

export type InlineFormData = {
  employeeHours: Record<string, number>;
  notes: string;
  isHidden: boolean;
  budgetOverride?: number;
};

type ChannelRef = ReturnType<typeof supabase.channel> | null;
type SetEditingLocks = React.Dispatch<React.SetStateAction<Record<string, { employeeId: string; employeeName: string; lockedAt: string }>>>;

export interface UseDeadlinesEditingParams {
  canEditDeadlines: boolean;
  selectedMonth: string;
  currentUser: { id: string } | null;
  employees: { id: string; first_name?: string; name: string }[];
  getProjectDeadline: (projectId: string) => Deadline | undefined;
  hiddenProjects: Set<string>;
  setHiddenProjects: React.Dispatch<React.SetStateAction<Set<string>>>;
  setDeadlines: React.Dispatch<React.SetStateAction<Deadline[]>>;
  setEditingLocks: SetEditingLocks;
  broadcastChannelRef: React.RefObject<ChannelRef>;
  setExpandedProjects: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export function useDeadlinesEditing(params: UseDeadlinesEditingParams) {
  const {
    canEditDeadlines,
    selectedMonth,
    currentUser,
    employees,
    getProjectDeadline,
    hiddenProjects,
    setHiddenProjects,
    setDeadlines,
    setEditingLocks,
    broadcastChannelRef,
    setExpandedProjects,
  } = params;

  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [inlineFormData, setInlineFormData] = useState<InlineFormData>({
    employeeHours: {},
    notes: '',
    isHidden: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockRefreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const releaseEditLock = useCallback(
    async (projectId: string) => {
      if (!currentUser) return;
      try {
        await supabase
          .from('project_editing_locks')
          .delete()
          .eq('project_id', projectId)
          .eq('employee_id', currentUser.id)
          .eq('month', selectedMonth);

        if (broadcastChannelRef.current) {
          broadcastChannelRef.current.send({
            type: 'broadcast',
            event: 'lock-released',
            payload: { projectIds: [projectId], employeeId: currentUser.id },
          });
        }
        setEditingLocks((prev) => {
          const next = { ...prev };
          delete next[projectId];
          return next;
        });
      } catch (error) {
        console.error('Error liberando lock:', error);
      }
    },
    [currentUser, selectedMonth, setEditingLocks, broadcastChannelRef]
  );

  const releaseAllMyLocks = useCallback(async () => {
    if (!currentUser) return;
    try {
      const { data: myLocks } = await supabase
        .from('project_editing_locks')
        .select('project_id')
        .eq('employee_id', currentUser.id)
        .eq('month', selectedMonth) as { data: { project_id: string }[] | null };

      await supabase
        .from('project_editing_locks')
        .delete()
        .eq('employee_id', currentUser.id)
        .eq('month', selectedMonth);

      if (myLocks?.length && broadcastChannelRef.current) {
        const projectIds = myLocks.map((l) => l.project_id);
        broadcastChannelRef.current.send({
          type: 'broadcast',
          event: 'lock-released',
          payload: { projectIds, employeeId: currentUser.id },
        });
        setEditingLocks((prev) => {
          const next = { ...prev };
          projectIds.forEach((pid) => {
            if (next[pid]?.employeeId === currentUser.id) delete next[pid];
          });
          return next;
        });
      }
    } catch (error) {
      console.error('Error liberando todos los locks:', error);
    }
  }, [currentUser, selectedMonth, setEditingLocks, broadcastChannelRef]);

  const acquireEditLock = useCallback(
    async (projectId: string): Promise<boolean> => {
      if (!currentUser) return false;
      try {
        await supabase
          .from('project_editing_locks')
          .delete()
          .lt('expires_at', new Date().toISOString());

        const { data: existingLock } = await supabase
          .from('project_editing_locks')
          .select('*')
          .eq('project_id', projectId)
          .eq('month', selectedMonth)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (existingLock) {
          if (existingLock.employee_id !== currentUser.id) {
            const editor = employees.find((e) => e.id === existingLock.employee_id);
            toast.warning(`${editor?.first_name || editor?.name || 'Alguien'} está editando este proyecto. Espera a que termine.`);
            return false;
          }
          await supabase
            .from('project_editing_locks')
            .update({ expires_at: new Date(Date.now() + 60 * 1000).toISOString() })
            .eq('id', existingLock.id);
          return true;
        }

        const { error } = await supabase.from('project_editing_locks').insert({
          project_id: projectId,
          employee_id: currentUser.id,
          month: selectedMonth,
          expires_at: new Date(Date.now() + 60 * 1000).toISOString(),
        });

        if (error) {
          const { data: conflictLock } = await supabase
            .from('project_editing_locks')
            .select('*')
            .eq('project_id', projectId)
            .eq('month', selectedMonth)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle() as { data: { employee_id: string } | null };
          if (conflictLock?.employee_id !== currentUser.id) {
            const editor = employees.find((e) => e.id === conflictLock.employee_id);
            toast.warning(`${editor?.first_name || editor?.name || 'Alguien'} está editando este proyecto. Espera a que termine.`);
            return false;
          }
        }
        return true;
      } catch (error) {
        console.error('Error adquiriendo lock:', error);
        return false;
      }
    },
    [currentUser, selectedMonth, employees]
  );

  const cancelEditingProject = useCallback(async () => {
    const projectIdToRelease = editingProjectId;
    if (projectIdToRelease) await releaseEditLock(projectIdToRelease);
    if (lockRefreshIntervalRef.current) {
      clearInterval(lockRefreshIntervalRef.current);
      lockRefreshIntervalRef.current = null;
    }
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }
    const win = window as unknown as { __deadlineBeforeUnload?: () => void };
    if (win.__deadlineBeforeUnload) {
      window.removeEventListener('beforeunload', win.__deadlineBeforeUnload as EventListener);
      delete win.__deadlineBeforeUnload;
    }
    setEditingProjectId(null);
    setInlineFormData({ employeeHours: {}, notes: '', isHidden: false });
  }, [editingProjectId, releaseEditLock]);

  const renewEditLock = useCallback(
    async (projectId: string) => {
      if (!currentUser || editingProjectId !== projectId) return;
      try {
        const { error } = await supabase
          .from('project_editing_locks')
          .update({ expires_at: new Date(Date.now() + 60 * 1000).toISOString() })
          .eq('project_id', projectId)
          .eq('employee_id', currentUser.id)
          .eq('month', selectedMonth) as { error: { code?: string } | null };

        if (error?.code === 'PGRST116') {
          cancelEditingProject();
        }
      } catch (error) {
        console.error('Error renovando lock:', error);
      }
    },
    [currentUser, selectedMonth, editingProjectId, cancelEditingProject]
  );

  const startEditingProject = useCallback(
    async (projectId: string) => {
      if (!canEditDeadlines || editingProjectId === projectId) return;
      await releaseAllMyLocks();

      if (editingProjectId) {
        if (lockRefreshIntervalRef.current) {
          clearInterval(lockRefreshIntervalRef.current);
          lockRefreshIntervalRef.current = null;
        }
        const win = window as unknown as { __deadlineBeforeUnload?: () => void };
        if (win.__deadlineBeforeUnload) {
          window.removeEventListener('beforeunload', win.__deadlineBeforeUnload as EventListener);
          delete win.__deadlineBeforeUnload;
        }
      }

      const lockAcquired = await acquireEditLock(projectId);
      if (!lockAcquired) {
        setEditingProjectId(null);
        return;
      }

      const deadline = getProjectDeadline(projectId);
      setEditingProjectId(projectId);
      setInlineFormData({
        employeeHours: deadline?.employeeHours ? { ...deadline.employeeHours } : {},
        notes: deadline?.notes ?? '',
        isHidden: deadline?.isHidden ?? hiddenProjects.has(projectId),
        budgetOverride: deadline?.budgetOverride,
      });
      setExpandedProjects((prev) => new Set([...prev, projectId]));

      if (lockRefreshIntervalRef.current) clearInterval(lockRefreshIntervalRef.current);
      lockRefreshIntervalRef.current = setInterval(() => renewEditLock(projectId), 20 * 1000);

      const handleBeforeUnload = () => {
        if (currentUser) releaseEditLock(projectId);
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      (window as unknown as { __deadlineBeforeUnload?: () => void }).__deadlineBeforeUnload = handleBeforeUnload;
    },
    [
      canEditDeadlines,
      editingProjectId,
      releaseAllMyLocks,
      acquireEditLock,
      getProjectDeadline,
      hiddenProjects,
      setExpandedProjects,
      renewEditLock,
      currentUser,
      releaseEditLock,
    ]
  );

  const autoSaveDeadline = useCallback(
    async (projectId: string, formData: InlineFormData) => {
      setAutoSaveStatus('saving');
      try {
        const existingDeadline = getProjectDeadline(projectId);
        const deadlineData = {
          project_id: projectId,
          month: selectedMonth,
          notes: formData.notes || null,
          employee_hours: formData.employeeHours,
          is_hidden: formData.isHidden,
          budget_override: formData.budgetOverride ?? null,
        };

        if (existingDeadline) {
          const { error } = await supabase.from('deadlines').update(deadlineData).eq('id', existingDeadline.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('deadlines').insert(deadlineData).select().single();
          if (error) throw error;
        }

        if (formData.isHidden) {
          setHiddenProjects((prev) => new Set([...prev, projectId]));
        } else {
          setHiddenProjects((prev) => {
            const next = new Set(prev);
            next.delete(projectId);
            return next;
          });
        }
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 1500);
      } catch (error) {
        console.error('Error auto-saving:', error);
        setAutoSaveStatus('idle');
        toast.error('Error al guardar');
      }
    },
    [selectedMonth, getProjectDeadline, setHiddenProjects]
  );

  const handleFormPatch = useCallback(
    (patch: Partial<InlineFormData>, saveAfterMs?: number) => {
      const projectId = editingProjectId;
      setInlineFormData((prev) => {
        const next = { ...prev, ...patch };
        if (saveAfterMs !== undefined) {
          if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
          autoSaveTimeoutRef.current = setTimeout(() => {
            if (projectId) autoSaveDeadline(projectId, next);
          }, saveAfterMs);
        } else {
          if (projectId) autoSaveDeadline(projectId, next);
        }
        return next;
      });
    },
    [editingProjectId, autoSaveDeadline]
  );

  const updateInlineEmployeeHours = useCallback(
    (employeeId: string, hours: number, projectId: string, immediate = false) => {
      const newFormData: InlineFormData = {
        ...inlineFormData,
        employeeHours: {
          ...inlineFormData.employeeHours,
          [employeeId]: hours >= 0 ? hours : 0,
        },
      };
      setInlineFormData(newFormData);

      if (immediate) {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
          autoSaveTimeoutRef.current = null;
        }
        autoSaveDeadline(projectId, newFormData);
      } else {
        if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
        setAutoSaveStatus('idle');
        autoSaveTimeoutRef.current = setTimeout(() => autoSaveDeadline(projectId, newFormData), 800);
      }
    },
    [inlineFormData, autoSaveDeadline]
  );

  const toggleProjectExpanded = useCallback(
    (projectId: string) => {
      setExpandedProjects((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(projectId)) {
          newSet.delete(projectId);
          if (editingProjectId === projectId) cancelEditingProject();
        } else {
          newSet.add(projectId);
        }
        return newSet;
      });
    },
    [setExpandedProjects, editingProjectId, cancelEditingProject]
  );

  const saveInlineDeadline = useCallback(
    async (projectId: string) => {
      setIsSaving(true);
      try {
        const existingDeadline = getProjectDeadline(projectId);
        const deadlineData = {
          project_id: projectId,
          month: selectedMonth,
          notes: inlineFormData.notes || null,
          employee_hours: inlineFormData.employeeHours,
          is_hidden: inlineFormData.isHidden,
          budget_override: inlineFormData.budgetOverride ?? null,
        };

        if (existingDeadline) {
          const { error } = await supabase.from('deadlines').update(deadlineData).eq('id', existingDeadline.id);
          if (error) throw error;
          setDeadlines((prev) =>
            prev.map((d) =>
              d.id === existingDeadline.id
                ? { ...d, projectId, month: selectedMonth, notes: inlineFormData.notes, employeeHours: inlineFormData.employeeHours, isHidden: inlineFormData.isHidden, budgetOverride: inlineFormData.budgetOverride }
                : d
            )
          );
        } else {
          const { data, error } = await supabase.from('deadlines').insert(deadlineData).select().single();
          if (error) throw error;
          setDeadlines((prev) => [
            ...prev,
            {
              id: data.id,
              projectId: data.project_id,
              month: data.month,
              notes: data.notes,
              employeeHours: data.employee_hours || {},
              isHidden: data.is_hidden || false,
              budgetOverride: data.budget_override ?? undefined,
            },
          ]);
        }

        if (inlineFormData.isHidden) {
          setHiddenProjects((prev) => new Set([...prev, projectId]));
        } else {
          setHiddenProjects((prev) => {
            const next = new Set(prev);
            next.delete(projectId);
            return next;
          });
        }
        toast.success('Guardado');
        setEditingProjectId(null);
      } catch (error) {
        console.error('Error guardando deadline:', error);
        toast.error((error as Error)?.message || 'Error al guardar');
      } finally {
        setIsSaving(false);
      }
    },
    [selectedMonth, getProjectDeadline, inlineFormData, setDeadlines, setHiddenProjects]
  );

  useEffect(() => {
    return () => {
      if (lockRefreshIntervalRef.current) clearInterval(lockRefreshIntervalRef.current);
      const win = window as unknown as { __deadlineBeforeUnload?: () => void };
      if (win.__deadlineBeforeUnload) {
        window.removeEventListener('beforeunload', win.__deadlineBeforeUnload as EventListener);
        delete win.__deadlineBeforeUnload;
      }
      if (editingProjectId && currentUser) releaseEditLock(editingProjectId);
    };
  }, [editingProjectId, currentUser, selectedMonth, releaseEditLock]);

  return {
    editingProjectId,
    setEditingProjectId,
    inlineFormData,
    setInlineFormData,
    isSaving,
    autoSaveStatus,
    startEditingProject,
    cancelEditingProject,
    updateInlineEmployeeHours,
    handleFormPatch,
    autoSaveDeadline,
    toggleProjectExpanded,
    saveInlineDeadline,
  };
}
