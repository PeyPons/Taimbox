/**
 * Hook de edición inline en Deadlines: locks (adquirir/renovar/liberar),
 * estado del formulario inline, autoSave, handleFormPatch. Usado solo por DeadlinesPage.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from '@/lib/notify';
import { supabase } from '@/lib/supabase';
import type { Deadline } from '@/types';
import { budgetsNearlyEqual } from '@/utils/budgetUtils';

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
  /** Presupuesto catálogo del proyecto (para normalizar overrides redundantes). */
  getProject?: (projectId: string) => { budgetHours: number } | undefined;
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
    getProject,
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

  /** Una sola petición: borra todos los locks del usuario en el mes y devuelve los project_id afectados (para broadcast). */
  const releaseAllMyLocks = useCallback(async () => {
    if (!currentUser) return;
    try {
      const { data: deletedRows } = await supabase
        .from('project_editing_locks')
        .delete()
        .eq('employee_id', currentUser.id)
        .eq('month', selectedMonth)
        .select('project_id');

      const projectIds = (deletedRows ?? []).map((r) => r.project_id).filter(Boolean);
      if (projectIds.length > 0 && broadcastChannelRef.current) {
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
        // Solo filas expiradas de este proyecto/mes (evita DELETE masivo en toda la tabla en cada clic).
        await supabase
          .from('project_editing_locks')
          .delete()
          .eq('project_id', projectId)
          .eq('month', selectedMonth)
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

      const previousEditingId = editingProjectId;

      if (previousEditingId) {
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

      // Cambio A→B: solo liberar el lock anterior (antes se hacía SELECT+DELETE de todos los del mes siempre).
      // Primera edición en la sesión: una sola DELETE devolviendo filas (huérfanos / otras pestañas).
      if (previousEditingId && previousEditingId !== projectId) {
        await releaseEditLock(previousEditingId);
      } else if (!previousEditingId) {
        await releaseAllMyLocks();
      }

      const lockAcquired = await acquireEditLock(projectId);
      if (!lockAcquired) {
        setEditingProjectId(null);
        return;
      }

      const deadline = getProjectDeadline(projectId);
      const proj = getProject?.(projectId);
      const rawOverride = deadline?.budgetOverride;
      const budgetOverride =
        proj != null &&
        rawOverride != null &&
        Number.isFinite(Number(rawOverride)) &&
        budgetsNearlyEqual(Number(rawOverride), proj.budgetHours || 0)
          ? undefined
          : rawOverride;
      const employeeHours = deadline?.employeeHours
        ? Object.fromEntries(
            Object.entries(deadline.employeeHours).filter(([, h]) => (Number(h) || 0) > 0)
          )
        : {};

      setEditingProjectId(projectId);
      setInlineFormData({
        employeeHours,
        notes: deadline?.notes ?? '',
        isHidden: deadline?.isHidden ?? hiddenProjects.has(projectId),
        budgetOverride,
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
      getProject,
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
        const proj = getProject?.(projectId);
        const normalizedOverride =
          formData.budgetOverride == null
            ? null
            : proj != null && budgetsNearlyEqual(formData.budgetOverride, proj.budgetHours || 0)
              ? null
              : formData.budgetOverride;
        const budgetOverrideLocal = normalizedOverride ?? undefined;

        const deadlineData = {
          project_id: projectId,
          month: selectedMonth,
          notes: formData.notes || null,
          employee_hours: formData.employeeHours,
          is_hidden: formData.isHidden,
          budget_override: normalizedOverride,
        };

        const patchLocalDeadline = (id: string) => {
          setDeadlines((prev) =>
            prev.map((d) =>
              d.id === id
                ? {
                    ...d,
                    projectId,
                    month: selectedMonth,
                    notes: formData.notes,
                    employeeHours: { ...formData.employeeHours },
                    isHidden: formData.isHidden,
                    budgetOverride: budgetOverrideLocal,
                  }
                : d
            )
          );
        };

        if (existingDeadline) {
          const { error } = await supabase.from('deadlines').update(deadlineData).eq('id', existingDeadline.id);
          if (error) throw error;
          patchLocalDeadline(existingDeadline.id);
        } else {
          const { data, error } = await supabase.from('deadlines').insert(deadlineData).select().single();
          if (error) {
            const pgCode =
              typeof error === 'object' && error && 'code' in error
                ? String((error as { code: string }).code)
                : '';
            const status =
              typeof error === 'object' && error && 'status' in error
                ? Number((error as { status?: number }).status)
                : NaN;
            // Fila ya creada (p. ej. segundo auto-guardado antes de refrescar estado, u otro cliente)
            if (pgCode === '23505' || status === 409) {
              const { data: row, error: selErr } = await supabase
                .from('deadlines')
                .select('*')
                .eq('project_id', projectId)
                .eq('month', selectedMonth)
                .maybeSingle();
              if (selErr || !row) throw error;
              const { error: upErr } = await supabase.from('deadlines').update(deadlineData).eq('id', row.id);
              if (upErr) throw upErr;
              setDeadlines((prev) => {
                const merged = {
                  id: row.id,
                  projectId,
                  month: selectedMonth,
                  notes: formData.notes,
                  employeeHours: { ...formData.employeeHours },
                  isHidden: formData.isHidden,
                  budgetOverride: budgetOverrideLocal,
                };
                if (prev.some((d) => d.id === row.id)) {
                  return prev.map((d) => (d.id === row.id ? merged : d));
                }
                return [...prev, merged];
              });
            } else {
              throw error;
            }
          } else if (data) {
            setDeadlines((prev) => [
              ...prev,
              {
                id: data.id,
                projectId: data.project_id,
                month: data.month,
                notes: data.notes ?? undefined,
                employeeHours: (data.employee_hours as Record<string, number>) || {},
                isHidden: data.is_hidden ?? false,
                budgetOverride: data.budget_override ?? undefined,
              },
            ]);
          }
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
    [selectedMonth, getProjectDeadline, getProject, setDeadlines, setHiddenProjects]
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
      const nextEmployeeHours = { ...inlineFormData.employeeHours };
      const safe = hours >= 0 ? hours : 0;
      if (safe > 0) {
        nextEmployeeHours[employeeId] = safe;
      } else {
        delete nextEmployeeHours[employeeId];
      }
      const newFormData: InlineFormData = {
        ...inlineFormData,
        employeeHours: nextEmployeeHours,
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
        const proj = getProject?.(projectId);
        const normalizedOverride =
          inlineFormData.budgetOverride == null
            ? null
            : proj != null && budgetsNearlyEqual(inlineFormData.budgetOverride, proj.budgetHours || 0)
              ? null
              : inlineFormData.budgetOverride;
        const budgetOverrideLocal = normalizedOverride ?? undefined;

        const deadlineData = {
          project_id: projectId,
          month: selectedMonth,
          notes: inlineFormData.notes || null,
          employee_hours: inlineFormData.employeeHours,
          is_hidden: inlineFormData.isHidden,
          budget_override: normalizedOverride,
        };

        if (existingDeadline) {
          const { error } = await supabase.from('deadlines').update(deadlineData).eq('id', existingDeadline.id);
          if (error) throw error;
          setDeadlines((prev) =>
            prev.map((d) =>
              d.id === existingDeadline.id
                ? {
                    ...d,
                    projectId,
                    month: selectedMonth,
                    notes: inlineFormData.notes,
                    employeeHours: inlineFormData.employeeHours,
                    isHidden: inlineFormData.isHidden,
                    budgetOverride: budgetOverrideLocal,
                  }
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
    [selectedMonth, getProjectDeadline, getProject, inlineFormData, setDeadlines, setHiddenProjects]
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
