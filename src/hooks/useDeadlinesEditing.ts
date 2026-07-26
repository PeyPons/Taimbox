/**
 * Hook de edición inline en Deadlines: locks (adquirir/renovar/liberar),
 * estado del formulario inline, autoSave serializado por snapshot/proyecto,
 * handleFormPatch. Usado solo por DeadlinesPage.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from '@/lib/notify';
import { supabase } from '@/lib/supabase';
import type { Deadline } from '@/types';
import { budgetsNearlyEqual } from '@/utils/budgetUtils';

const PERF_DEBUG = import.meta.env.DEV;
const perfNow = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
const logPerf = (label: string, start: number, meta?: unknown) => {
  if (!PERF_DEBUG) return;
  const ms = perfNow() - start;
  if (meta !== undefined) {
    console.debug(`[perf][deadlines-edit] ${label}: ${ms.toFixed(1)}ms`, meta);
  } else {
    console.debug(`[perf][deadlines-edit] ${label}: ${ms.toFixed(1)}ms`);
  }
};

export type InlineFormData = {
  employeeHours: Record<string, number>;
  notes: string;
  isHidden: boolean;
  budgetOverride?: number;
};

function cloneFormData(data: InlineFormData): InlineFormData {
  return {
    ...data,
    employeeHours: { ...data.employeeHours },
  };
}

type ChannelRef = ReturnType<typeof supabase.channel> | null;
type SetEditingLocks = React.Dispatch<React.SetStateAction<Record<string, { employeeId: string; employeeName: string; lockedAt: string }>>>;

export interface UseDeadlinesEditingParams {
  canEditDeadlines: boolean;
  selectedMonth: string;
  currentUser: { id: string } | null;
  /** Vista soporte (platform admin sin empleado): edición sin locks (FK exige employee_id). */
  skipEditLocks?: boolean;
  employees: { id: string; first_name?: string; name: string }[];
  getProjectDeadline: (projectId: string) => Deadline | undefined;
  hiddenProjects: Set<string>;
  setHiddenProjects: React.Dispatch<React.SetStateAction<Set<string>>>;
  setDeadlines: React.Dispatch<React.SetStateAction<Deadline[]>>;
  editingLocks: Record<string, { employeeId: string; employeeName: string; lockedAt: string }>;
  setEditingLocks: SetEditingLocks;
  broadcastChannelRef: React.RefObject<ChannelRef>;
  setExpandedProjects: React.Dispatch<React.SetStateAction<Set<string>>>;
  /** Ref compartido con useDeadlinesPageData para ignorar Realtime del proyecto en edición. */
  editingProjectIdRef?: React.MutableRefObject<string | null>;
  /** Presupuesto catálogo del proyecto (para normalizar overrides redundantes). */
  getProject?: (projectId: string) => { budgetHours: number } | undefined;
}

export function useDeadlinesEditing(params: UseDeadlinesEditingParams) {
  const {
    canEditDeadlines,
    selectedMonth,
    currentUser,
    skipEditLocks = false,
    employees,
    getProjectDeadline,
    hiddenProjects,
    setHiddenProjects,
    setDeadlines,
    editingLocks,
    setEditingLocks,
    broadcastChannelRef,
    setExpandedProjects,
    editingProjectIdRef,
    getProject,
  } = params;

  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [inlineFormData, setInlineFormData] = useState<InlineFormData>({
    employeeHours: {},
    notes: '',
    isHidden: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLockAcquiring, setIsLockAcquiring] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveTimeoutProjectRef = useRef<string | null>(null);
  const lockRefreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lockAttemptRef = useRef(0);
  const inlineFormDataRef = useRef(inlineFormData);
  const saveChainRef = useRef(Promise.resolve());
  /** Proyecto en edición (sync, para ignorar blur/patches tardíos de otro proyecto). */
  const currentEditingIdRef = useRef<string | null>(null);
  const isLockAcquiringRef = useRef(false);
  /** Último snapshot pendiente por projectId (coalesce sin cruzar formularios). */
  const pendingSaveByProjectRef = useRef<Record<string, InlineFormData>>({});

  useEffect(() => {
    inlineFormDataRef.current = inlineFormData;
  }, [inlineFormData]);

  useEffect(() => {
    currentEditingIdRef.current = editingProjectId;
    if (editingProjectIdRef) editingProjectIdRef.current = editingProjectId;
  }, [editingProjectId, editingProjectIdRef]);

  const releaseEditLock = useCallback(
    async (projectId: string) => {
      if (skipEditLocks || !currentUser) return;
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
    [currentUser, selectedMonth, setEditingLocks, broadcastChannelRef, skipEditLocks]
  );

  const verifyEditLock = useCallback(
    async (projectId: string): Promise<boolean> => {
      if (skipEditLocks) return true;
      if (!currentUser) return false;
      const { data: lock, error } = await supabase
        .from('project_editing_locks')
        .select('employee_id')
        .eq('project_id', projectId)
        .eq('month', selectedMonth)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error) return true;
      if (!lock || lock.employee_id === currentUser.id) return true;

      const editor = employees.find((e) => e.id === lock.employee_id);
      toast.warning(
        `${editor?.first_name || editor?.name || 'Alguien'} está editando este proyecto. No se guardaron los cambios.`
      );
      return false;
    },
    [currentUser, selectedMonth, employees, skipEditLocks]
  );

  const acquireEditLock = useCallback(
    async (projectId: string): Promise<boolean> => {
      const t0 = perfNow();
      if (skipEditLocks) {
        logPerf('acquireEditLock:skippedSupportView', t0, { projectId });
        return true;
      }
      if (!currentUser) return false;
      const expiresAt = new Date(Date.now() + 60 * 1000).toISOString();
      try {
        const { data: existingLock } = await supabase
          .from('project_editing_locks')
          .select('id,employee_id,locked_at')
          .eq('project_id', projectId)
          .eq('month', selectedMonth)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (existingLock) {
          if (existingLock.employee_id !== currentUser.id) {
            const editor = employees.find((e) => e.id === existingLock.employee_id);
            setEditingLocks((prev) => ({
              ...prev,
              [projectId]: {
                employeeId: existingLock.employee_id,
                employeeName: editor?.first_name || editor?.name || 'Alguien',
                lockedAt: String((existingLock as { locked_at?: string }).locked_at || new Date().toISOString()),
              },
            }));
            toast.warning(`${editor?.first_name || editor?.name || 'Alguien'} está editando este proyecto. Espera a que termine.`);
            return false;
          }
          await supabase
            .from('project_editing_locks')
            .update({ expires_at: expiresAt })
            .eq('id', existingLock.id);
          return true;
        }

        const { error } = await supabase.from('project_editing_locks').insert({
          project_id: projectId,
          employee_id: currentUser.id,
          month: selectedMonth,
          expires_at: expiresAt,
        });

        if (error) {
          const pgCode =
            typeof error === 'object' && error && 'code' in error
              ? String((error as { code: string }).code)
              : '';
          const { data: conflictLock } = await supabase
            .from('project_editing_locks')
            .select('id,employee_id,locked_at')
            .eq('project_id', projectId)
            .eq('month', selectedMonth)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle();

          if (conflictLock?.employee_id !== currentUser.id) {
            const editor = employees.find((e) => e.id === conflictLock?.employee_id);
            setEditingLocks((prev) => ({
              ...prev,
              [projectId]: {
                employeeId: conflictLock!.employee_id,
                employeeName: editor?.first_name || editor?.name || 'Alguien',
                lockedAt: String((conflictLock as { locked_at?: string }).locked_at || new Date().toISOString()),
              },
            }));
            toast.warning(`${editor?.first_name || editor?.name || 'Alguien'} está editando este proyecto. Espera a que termine.`);
            return false;
          }

          if (conflictLock && pgCode === '23505') {
            await supabase
              .from('project_editing_locks')
              .update({ expires_at: expiresAt, employee_id: currentUser.id })
              .eq('id', conflictLock.id);
          }
        }
        return true;
      } catch (error) {
        console.error('Error adquiriendo lock:', error);
        return false;
      } finally {
        logPerf('acquireEditLock', t0, { projectId, month: selectedMonth });
      }
    },
    [currentUser, selectedMonth, employees, setEditingLocks, skipEditLocks]
  );

  const persistSaveDeadline = useCallback(
    async (projectId: string, formData: InlineFormData) => {
      const canSave = await verifyEditLock(projectId);
      if (!canSave) return;

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
        throw error;
      }
    },
    [selectedMonth, getProjectDeadline, getProject, setDeadlines, setHiddenProjects, verifyEditLock]
  );

  /**
   * Cola serializada por snapshot atado al projectId.
   * Coalesce: varios enqueue del mismo proyecto conservan solo el último snapshot.
   * Nunca lee el formulario “actual” al ejecutar (evita cruzar A↔B al cambiar de proyecto).
   */
  const enqueueAutoSave = useCallback(
    (projectId: string, formSnapshot?: InlineFormData) => {
      const snapshot = cloneFormData(formSnapshot ?? inlineFormDataRef.current);
      pendingSaveByProjectRef.current[projectId] = snapshot;

      saveChainRef.current = saveChainRef.current
        .then(async () => {
          const formData = pendingSaveByProjectRef.current[projectId];
          if (!formData) return;
          delete pendingSaveByProjectRef.current[projectId];
          await persistSaveDeadline(projectId, formData);
        })
        .catch(() => {
          /* persistSaveDeadline ya notifica */
        });
      return saveChainRef.current;
    },
    [persistSaveDeadline]
  );

  const clearDebouncedSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }
    autoSaveTimeoutProjectRef.current = null;
  }, []);

  const flushAutoSave = useCallback(
    (projectId: string, formSnapshot?: InlineFormData) => {
      clearDebouncedSave();
      // Blur tardío de otro proyecto sin snapshot: no cruzar formularios.
      if (!formSnapshot && currentEditingIdRef.current !== projectId) {
        return saveChainRef.current;
      }
      return enqueueAutoSave(projectId, formSnapshot ?? inlineFormDataRef.current);
    },
    [enqueueAutoSave, clearDebouncedSave]
  );

  const scheduleDebouncedSave = useCallback(
    (projectId: string, delayMs: number, formSnapshot: InlineFormData) => {
      clearDebouncedSave();
      setAutoSaveStatus('idle');
      autoSaveTimeoutProjectRef.current = projectId;
      // Snapshot de respaldo por si el form cambia de proyecto antes del timeout.
      const fallbackSnapshot = cloneFormData(formSnapshot);
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSaveTimeoutRef.current = null;
        autoSaveTimeoutProjectRef.current = null;
        if (currentEditingIdRef.current !== projectId) return;
        enqueueAutoSave(projectId, inlineFormDataRef.current ?? fallbackSnapshot);
      }, delayMs);
    },
    [enqueueAutoSave, clearDebouncedSave]
  );

  const cancelEditingProject = useCallback(async () => {
    lockAttemptRef.current += 1;
    isLockAcquiringRef.current = false;
    setIsLockAcquiring(false);
    const projectIdToRelease = currentEditingIdRef.current ?? editingProjectId;
    const formSnapshot =
      projectIdToRelease && autoSaveTimeoutProjectRef.current === projectIdToRelease
        ? cloneFormData(inlineFormDataRef.current)
        : null;

    // Invalidar edición ya: blur de cierre no debe mutar/guardar de nuevo.
    currentEditingIdRef.current = null;
    if (editingProjectIdRef) editingProjectIdRef.current = null;

    clearDebouncedSave();
    if (projectIdToRelease && formSnapshot) {
      enqueueAutoSave(projectIdToRelease, formSnapshot);
    }
    if (projectIdToRelease) {
      try {
        await saveChainRef.current;
      } catch {
        /* persistSaveDeadline ya notificó */
      }
    }

    if (projectIdToRelease) await releaseEditLock(projectIdToRelease);
    if (lockRefreshIntervalRef.current) {
      clearInterval(lockRefreshIntervalRef.current);
      lockRefreshIntervalRef.current = null;
    }
    const win = window as unknown as { __deadlineBeforeUnload?: () => void };
    if (win.__deadlineBeforeUnload) {
      window.removeEventListener('beforeunload', win.__deadlineBeforeUnload as EventListener);
      delete win.__deadlineBeforeUnload;
    }
    setEditingProjectId(null);
    setInlineFormData({ employeeHours: {}, notes: '', isHidden: false });
    inlineFormDataRef.current = { employeeHours: {}, notes: '', isHidden: false };
  }, [editingProjectId, releaseEditLock, clearDebouncedSave, enqueueAutoSave, editingProjectIdRef]);

  const renewEditLock = useCallback(
    async (projectId: string) => {
      if (!currentUser || currentEditingIdRef.current !== projectId) return;
      try {
        const { data, error } = await supabase
          .from('project_editing_locks')
          .update({ expires_at: new Date(Date.now() + 60 * 1000).toISOString() })
          .eq('project_id', projectId)
          .eq('employee_id', currentUser.id)
          .eq('month', selectedMonth)
          .select('id')
          .maybeSingle();

        if (error?.code === 'PGRST116' || !data) {
          cancelEditingProject();
        }
      } catch (error) {
        console.error('Error renovando lock:', error);
      }
    },
    [currentUser, selectedMonth, cancelEditingProject]
  );

  const startEditingProject = useCallback(
    async (projectId: string) => {
      const t0 = perfNow();
      if (!canEditDeadlines || currentEditingIdRef.current === projectId) return;

      const attemptId = ++lockAttemptRef.current;
      const previousEditingId = currentEditingIdRef.current;
      const previousFormSnapshot = previousEditingId
        ? cloneFormData(inlineFormDataRef.current)
        : null;
      const hadPendingDebounce =
        !!autoSaveTimeoutRef.current && autoSaveTimeoutProjectRef.current === previousEditingId;
      const tBeforeLock = perfNow();

      const knownLock = editingLocks[projectId];
      if (!skipEditLocks && knownLock && knownLock.employeeId !== currentUser?.id) {
        toast.warning(`${knownLock.employeeName || 'Alguien'} está editando este proyecto. Espera a que termine.`);
        logPerf('startEditingProject:knownLockRejected', t0, { projectId });
        return;
      }

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

      // Flush del proyecto anterior CON su snapshot, antes de sustituir el formulario.
      if (previousEditingId && previousEditingId !== projectId) {
        clearDebouncedSave();
        if (hadPendingDebounce && previousFormSnapshot) {
          enqueueAutoSave(previousEditingId, previousFormSnapshot);
        }
        void (async () => {
          await saveChainRef.current;
          await releaseEditLock(previousEditingId);
        })();
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
      const initialForm: InlineFormData = {
        employeeHours,
        notes: deadline?.notes ?? '',
        isHidden: deadline?.isHidden ?? hiddenProjects.has(projectId),
        budgetOverride,
      };

      // Refs sync ya: blur tardío del proyecto anterior se ignora.
      currentEditingIdRef.current = projectId;
      if (editingProjectIdRef) editingProjectIdRef.current = projectId;
      isLockAcquiringRef.current = true;
      inlineFormDataRef.current = initialForm;

      setEditingProjectId(projectId);
      setInlineFormData(initialForm);
      setExpandedProjects((prev) => new Set([...prev, projectId]));
      setIsLockAcquiring(true);

      const lockAcquired = await acquireEditLock(projectId);
      if (attemptId !== lockAttemptRef.current) {
        if (lockAcquired) void releaseEditLock(projectId);
        return;
      }
      if (!lockAcquired) {
        isLockAcquiringRef.current = false;
        setIsLockAcquiring(false);
        if (currentEditingIdRef.current === projectId) {
          currentEditingIdRef.current = null;
          if (editingProjectIdRef) editingProjectIdRef.current = null;
        }
        setEditingProjectId((current) => (current === projectId ? null : current));
        logPerf('startEditingProject:lockRejected', t0, { projectId });
        return;
      }
      isLockAcquiringRef.current = false;
      setIsLockAcquiring(false);
      logPerf('startEditingProject:untilLockAcquired', tBeforeLock, { projectId });

      if (lockRefreshIntervalRef.current) clearInterval(lockRefreshIntervalRef.current);
      if (!skipEditLocks) {
        lockRefreshIntervalRef.current = setInterval(() => renewEditLock(projectId), 20 * 1000);

        const handleBeforeUnload = () => {
          if (currentUser) releaseEditLock(projectId);
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        (window as unknown as { __deadlineBeforeUnload?: () => void }).__deadlineBeforeUnload = handleBeforeUnload;
      }
      logPerf('startEditingProject:total', t0, { projectId });
    },
    [
      canEditDeadlines,
      acquireEditLock,
      editingLocks,
      getProjectDeadline,
      getProject,
      hiddenProjects,
      setExpandedProjects,
      renewEditLock,
      currentUser,
      releaseEditLock,
      enqueueAutoSave,
      clearDebouncedSave,
      skipEditLocks,
      editingProjectIdRef,
    ]
  );

  const handleFormPatch = useCallback(
    (patch: Partial<InlineFormData>, saveAfterMs?: number) => {
      if (isLockAcquiringRef.current) return;
      const projectId = currentEditingIdRef.current;
      if (!projectId) return;

      setInlineFormData((prev) => {
        if (currentEditingIdRef.current !== projectId) return prev;
        const next = { ...prev, ...patch, employeeHours: { ...prev.employeeHours, ...(patch.employeeHours ?? {}) } };
        inlineFormDataRef.current = next;
        if (saveAfterMs !== undefined) {
          scheduleDebouncedSave(projectId, saveAfterMs, next);
        } else {
          flushAutoSave(projectId, next);
        }
        return next;
      });
    },
    [flushAutoSave, scheduleDebouncedSave]
  );

  const updateInlineEmployeeHours = useCallback(
    (employeeId: string, hours: number, projectId: string, immediate = false) => {
      if (isLockAcquiringRef.current) return;
      // Ignora blur/onChange tardíos de un proyecto que ya no está en edición.
      if (currentEditingIdRef.current !== projectId) return;

      setInlineFormData((prev) => {
        if (currentEditingIdRef.current !== projectId) return prev;
        const nextEmployeeHours = { ...prev.employeeHours };
        const safe = hours >= 0 ? hours : 0;
        if (safe > 0) {
          nextEmployeeHours[employeeId] = safe;
        } else {
          delete nextEmployeeHours[employeeId];
        }
        const next: InlineFormData = { ...prev, employeeHours: nextEmployeeHours };
        inlineFormDataRef.current = next;

        if (immediate) {
          flushAutoSave(projectId, next);
        } else {
          scheduleDebouncedSave(projectId, 800, next);
        }
        return next;
      });
    },
    [flushAutoSave, scheduleDebouncedSave]
  );

  const toggleProjectExpanded = useCallback(
    (projectId: string) => {
      setExpandedProjects((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(projectId)) {
          newSet.delete(projectId);
          if (currentEditingIdRef.current === projectId) void cancelEditingProject();
        } else {
          newSet.add(projectId);
        }
        return newSet;
      });
    },
    [setExpandedProjects, cancelEditingProject]
  );

  const saveInlineDeadline = useCallback(
    async (projectId: string) => {
      setIsSaving(true);
      try {
        await flushAutoSave(projectId, inlineFormDataRef.current);
        toast.success('Guardado');
        currentEditingIdRef.current = null;
        setEditingProjectId(null);
        if (editingProjectIdRef) editingProjectIdRef.current = null;
      } catch (error) {
        console.error('Error guardando deadline:', error);
        toast.error((error as Error)?.message || 'Error al guardar');
      } finally {
        setIsSaving(false);
      }
    },
    [flushAutoSave, editingProjectIdRef]
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
    isLockAcquiring,
    isSaving,
    autoSaveStatus,
    startEditingProject,
    cancelEditingProject,
    updateInlineEmployeeHours,
    handleFormPatch,
    flushAutoSave,
    toggleProjectExpanded,
    saveInlineDeadline,
  };
}
