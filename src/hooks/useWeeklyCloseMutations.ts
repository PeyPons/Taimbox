import { useCallback, useMemo } from 'react';
import { format, parseISO, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/lib/notify';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/contexts/AppContext';
import { useAgency } from '@/contexts/AgencyContext';
import { logCreate, logUpdate } from '@/services/auditService';
import { round2 } from '@/utils/numbers';
import { useWeeklyCloseDay } from '@/hooks/useWeeklyCloseDay';
import { collectSelectableFutureWeekSlots, isAllocationInEffectiveMonth } from '@/utils/dateUtils';
import { normalizeWeeklyHourInput, parseWeeklyCloseHours } from '@/utils/weeklyCloseShared';
import { copyAllocationNotes } from '@/services/allocationNotesService';
import type { Allocation } from '@/types';

export const WEEKLY_SLOT_EXTRA_MONTHS = 1;

export { normalizeWeeklyHourInput, parseWeeklyCloseHours } from '@/utils/weeklyCloseShared';

/** Fila `allocations` desde Supabase → forma camelCase coherente con `logCreate` en AppContext (historial / ActivityLog). */
function mapAllocationRowForAudit(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: row.id,
    employeeId: row.employee_id,
    projectId: row.project_id,
    weekStartDate: row.week_start_date,
    hoursAssigned: round2(Number(row.hours_assigned)),
    hoursActual: row.hours_actual != null ? round2(Number(row.hours_actual)) : undefined,
    hoursComputed: row.hours_computed != null ? round2(Number(row.hours_computed)) : undefined,
    status: row.status || 'planned',
    description: row.description ?? undefined,
    taskName: row.task_name ?? undefined,
    dependencyId: row.dependency_id ?? undefined,
    transferredFromAllocationId: row.transferred_from_allocation_id ?? undefined,
    distributionSourceAllocationId: row.distribution_source_allocation_id ?? undefined,
    parentAllocationId: row.parent_allocation_id ?? undefined,
    originalTransferredTaskName: row.original_transferred_task_name ?? undefined,
    transferSourceEmployeeId: row.transfer_source_employee_id ?? undefined,
    userPriority: row.user_priority ?? null,
    focusDate: row.focus_date ?? null,
    isLocked: row.is_locked ?? false,
  };
}

function parseRolloverNewAllocationId(data: unknown): string | null {
  if (typeof data === 'string' && /^[0-9a-f-]{36}$/i.test(data)) return data;
  return null;
}

export interface DistributionRowInput {
  taskName: string;
  hours: string;
  weekDate: string;
}

export interface UseWeeklyCloseMutationsResult {
  preference: 'actual' | 'computed' | undefined;
  applyMove: (
    task: Allocation,
    employeeId: string,
    targetWeekVal: string,
    comment?: string,
    /** Si se indica, sustituye `task.hoursActual` al calcular el remanente y al cerrar la tarea. */
    hoursActualOverride?: number
  ) => Promise<boolean>;
  applyMoveToEmployee: (
    task: Allocation,
    employeeId: string,
    targetEmployeeId: string,
    targetWeekVal: string,
    transferComment?: string
  ) => Promise<void>;
  applyJustify: (task: Allocation, employeeId: string, comment?: string) => Promise<void>;
  applyKeep: (
    task: Allocation,
    employeeId: string,
    actual: number,
    computed: number,
    comment?: string
  ) => Promise<boolean>;
  applyRollover: (
    task: Allocation,
    employeeId: string,
    actual: number,
    computed: number,
    newEstimate: number,
    destWeekStr: string,
    comment?: string
  ) => Promise<boolean>;
  applyDistribute: (
    task: Allocation,
    employeeId: string,
    validTasks: DistributionRowInput[],
    userComment?: string
  ) => Promise<void>;
  getSlotsForTaskWeek: (taskWeekStartStr: string) => ReturnType<typeof collectSelectableFutureWeekSlots>;
}

export function useWeeklyCloseMutations(viewDate: Date): UseWeeklyCloseMutationsResult {
  const {
    allocations,
    employees,
    projects,
    updateAllocation,
    addAllocation,
    deleteAllocation,
    addWeeklyFeedback,
    getEmployeeLoadForWeek,
    loadDataForMonth,
  } = useApp();
  const { currentAgency } = useAgency();
  const weeklyCloseDay = useWeeklyCloseDay();
  const preference = currentAgency?.settings?.hoursTrackingPreference;

  const anchorMonth = useMemo(() => startOfMonth(viewDate), [viewDate]);

  const getSlotsForTaskWeek = useCallback(
    (taskWeekStartStr: string) =>
      collectSelectableFutureWeekSlots(taskWeekStartStr, anchorMonth, weeklyCloseDay, WEEKLY_SLOT_EXTRA_MONTHS),
    [anchorMonth, weeklyCloseDay]
  );

  const applyMove = useCallback(
    async (
      task: Allocation,
      employeeId: string,
      targetWeekVal: string,
      comment?: string,
      hoursActualOverride?: number
    ) => {
      const taskWeekDate = parseISO(task.weekStartDate);
      const taskWeekStr = format(taskWeekDate, 'yyyy-MM-dd');
      if (!targetWeekVal) {
        toast.error('Selecciona una semana destino');
        return false;
      }
      const effectiveActual =
        hoursActualOverride !== undefined ? hoursActualOverride : (task.hoursActual || 0);
      const remainingHours = task.hoursAssigned - effectiveActual;
      if (remainingHours <= 0) return true;

      const snapshotTask: Allocation = { ...task };
      const existing = allocations.find(
        a =>
          a.employeeId === employeeId &&
          a.projectId === task.projectId &&
          a.weekStartDate === targetWeekVal &&
          a.taskName === task.taskName
      );
      const snapshotExisting: Allocation | null = existing ? { ...existing } : null;

      try {
        await updateAllocation({ ...task, hoursAssigned: effectiveActual, status: 'completed' });
        if (existing) {
          await updateAllocation({ ...existing, hoursAssigned: existing.hoursAssigned + remainingHours });
          await copyAllocationNotes(task.id, existing.id);
        } else {
          const created = await addAllocation({
            employeeId,
            projectId: task.projectId,
            weekStartDate: targetWeekVal,
            hoursAssigned: remainingHours,
            taskName: task.taskName || 'Tarea movida',
            status: 'planned',
          });
          if (created) await copyAllocationNotes(task.id, created.id);
        }
        await addWeeklyFeedback({
          employeeId,
          weekStartDate: taskWeekStr,
          projectId: task.projectId,
          allocationId: task.id,
          reason: 'other',
          comments: comment?.trim()
            ? `Tarea movida a semana futura. Nota: ${comment.trim()}`
            : 'Tarea movida a semana futura',
        });
      } catch (err) {
        await updateAllocation(snapshotTask);
        if (snapshotExisting) await updateAllocation(snapshotExisting);
        toast.error(
          err instanceof Error ? err.message : 'Error al mover la tarea; se revirtió el cambio.'
        );
        return false;
      }

      const mvSlot = getSlotsForTaskWeek(task.weekStartDate).find(s => s.storageKey === targetWeekVal);
      if (mvSlot) await loadDataForMonth(mvSlot.viewMonth);
      return true;
    },
    [addAllocation, addWeeklyFeedback, allocations, getSlotsForTaskWeek, loadDataForMonth, updateAllocation]
  );

  const applyMoveToEmployee = useCallback(
    async (
      task: Allocation,
      employeeId: string,
      targetEmployeeId: string,
      targetWeekVal: string,
      transferComment?: string
    ) => {
      const taskWeekDate = parseISO(task.weekStartDate);
      const taskWeekStr = format(taskWeekDate, 'yyyy-MM-dd');
      if (!targetEmployeeId || !targetWeekVal) {
        toast.error('Selecciona compañero y semana destino');
        return;
      }
      const remainingHours = task.hoursAssigned - (task.hoursActual || 0);
      if (remainingHours <= 0) return;
      const targetEmployee = employees.find(e => e.id === targetEmployeeId);
      if (targetEmployee) {
        const twSlot = getSlotsForTaskWeek(task.weekStartDate).find(s => s.storageKey === targetWeekVal);
        const targetWeekLoad = getEmployeeLoadForWeek(
          targetEmployeeId,
          targetWeekVal,
          undefined,
          undefined,
          twSlot?.viewMonth ?? viewDate
        );
        if ((targetWeekLoad?.hours || 0) + remainingHours > (targetWeekLoad?.capacity || 0)) {
          toast.warning(`${targetEmployee.name} excedería su capacidad. La tarea se creará de todas formas.`);
        }
      }

      const snapshotTask: Allocation = { ...task };
      const taskNameTransferred = task.taskName || 'Tarea';
      try {
        await updateAllocation({ ...task, hoursAssigned: task.hoursActual || 0, status: 'completed' });
        const created = await addAllocation({
          employeeId: targetEmployeeId,
          projectId: task.projectId,
          weekStartDate: targetWeekVal,
          hoursAssigned: remainingHours,
          taskName: taskNameTransferred,
          status: 'planned',
          transferredFromAllocationId: task.id,
          originalTransferredTaskName:
            task.originalTransferredTaskName || taskNameTransferred.replace(/\(transferida de .+\)/, '').trim(),
          transferSourceEmployeeId: employeeId,
        });
        if (created) await copyAllocationNotes(task.id, created.id);
        const transferBase = `Tarea transferida a ${employees.find(e => e.id === targetEmployeeId)?.name || 'otro empleado'} (${remainingHours}h restantes) | Nombre: ${task.taskName || 'Sin nombre'}`;
        await addWeeklyFeedback({
          employeeId,
          weekStartDate: taskWeekStr,
          projectId: task.projectId,
          allocationId: task.id,
          reason: 'other',
          comments: transferComment?.trim() ? `${transferBase} | Nota: ${transferComment.trim()}` : transferBase,
        });
      } catch (err) {
        await updateAllocation(snapshotTask);
        toast.error(
          err instanceof Error ? err.message : 'Error en la transferencia; se revirtió el cambio.'
        );
        return;
      }

      const transferSlot = getSlotsForTaskWeek(task.weekStartDate).find(s => s.storageKey === targetWeekVal);
      if (transferSlot) await loadDataForMonth(transferSlot.viewMonth);
    },
    [
      addAllocation,
      addWeeklyFeedback,
      employees,
      getEmployeeLoadForWeek,
      getSlotsForTaskWeek,
      loadDataForMonth,
      updateAllocation,
      viewDate,
    ]
  );

  const applyJustify = useCallback(
    async (task: Allocation, employeeId: string, comment?: string) => {
      const taskWeekDate = parseISO(task.weekStartDate);
      const taskWeekStr = format(taskWeekDate, 'yyyy-MM-dd');
      if (comment?.trim()) {
        await addWeeklyFeedback({
          employeeId,
          weekStartDate: taskWeekStr,
          projectId: task.projectId,
          allocationId: task.id,
          reason: 'other',
          comments: comment,
        });
      }
    },
    [addWeeklyFeedback]
  );

  const applyKeep = useCallback(
    async (task: Allocation, employeeId: string, actual: number, computed: number, comment?: string) => {
      const taskWeekDate = parseISO(task.weekStartDate);
      const taskWeekStr = format(taskWeekDate, 'yyyy-MM-dd');
      if (actual <= 0) {
        toast.error(`"${task.taskName}" necesita horas reales mayores a 0`);
        return false;
      }
      await updateAllocation({ ...task, hoursActual: actual, hoursComputed: computed, status: 'completed' });
      const fb =
        comment ||
        `Tarea completada: ${actual.toFixed(2)}h reales, ${computed.toFixed(2)}h computadas`;
      await addWeeklyFeedback({
        employeeId,
        weekStartDate: taskWeekStr,
        projectId: task.projectId,
        allocationId: task.id,
        reason: 'other',
        comments: fb,
      });
      return true;
    },
    [addWeeklyFeedback, updateAllocation]
  );

  const applyRollover = useCallback(
    async (
      task: Allocation,
      employeeId: string,
      actual: number,
      computed: number,
      newEstimate: number,
      destWeekStr: string,
      comment?: string
    ) => {
      const slots = getSlotsForTaskWeek(task.weekStartDate);
      const destSlot = slots.find(s => s.storageKey === destWeekStr);
      if (!destWeekStr || !destSlot) {
        toast.error(`"${task.taskName}": elige semana destino`);
        return false;
      }
      if (actual < 0) {
        toast.error(`"${task.taskName}": las horas reales no pueden ser negativas`);
        return false;
      }
      if (newEstimate <= 0) {
        toast.error(`"${task.taskName}" necesita horas planificadas > 0`);
        return false;
      }
      const destLabel = format(destSlot.weekStart, 'd MMM yyyy', { locale: es });
      const fb =
        comment ||
        `Tarea con rollover: ${actual.toFixed(2)}h registradas, ${newEstimate.toFixed(2)}h planificadas desde ${destLabel}`;

      const { data: rpcData, error: rpcError } = await supabase.rpc('partial_close_rollover', {
        p_original_id: task.id,
        p_hours_actual: actual,
        p_hours_computed: computed,
        p_dest_week_start: destWeekStr,
        p_new_hours_assigned: newEstimate,
        p_feedback_employee_id: employeeId,
        p_feedback_comments: fb,
      });

      if (rpcError) {
        toast.error(rpcError.message || 'No se pudo completar el cierre parcial (¿migración aplicada en Supabase?)');
        return false;
      }

      // La RPC no pasa por addAllocation/updateAllocation: sin esto el historial (audit_logs) pierde la continuación semanal.
      const agencyId = currentAgency?.id;
      if (agencyId) {
        const mergedParent: Allocation = {
          ...task,
          hoursActual: round2(actual),
          hoursComputed: round2(computed),
          status: 'completed',
        };
        void logUpdate(
          agencyId,
          'ALLOCATION',
          task.id,
          task as unknown as Record<string, unknown>,
          mergedParent as unknown as Record<string, unknown>,
        );

        const newId = parseRolloverNewAllocationId(rpcData);
        if (newId) {
          const { data: newRow } = await supabase.from('allocations').select('*').eq('id', newId).maybeSingle();
          if (newRow && typeof newRow === 'object') {
            void logCreate(agencyId, 'ALLOCATION', newId, mapAllocationRowForAudit(newRow as Record<string, unknown>));
          }
        }
      }

      await loadDataForMonth(startOfMonth(parseISO(task.weekStartDate)));
      await loadDataForMonth(destSlot.viewMonth);
      return true;
    },
    [currentAgency?.id, getSlotsForTaskWeek, loadDataForMonth]
  );

  const applyDistribute = useCallback(
    async (task: Allocation, employeeId: string, validTasks: DistributionRowInput[], userComment?: string) => {
      const parseHours = parseWeeklyCloseHours;
      const taskWeekDate = parseISO(task.weekStartDate);
      const taskWeekStr = format(taskWeekDate, 'yyyy-MM-dd');
      if (validTasks.length === 0) {
        toast.error('Añade al menos una tarea válida');
        return;
      }
      const totalDistributed = validTasks.reduce((sum, t) => sum + parseHours(t.hours), 0);
      if (Math.abs(totalDistributed - task.hoursAssigned) > 0.01) {
        toast.error(`Suma ${totalDistributed.toFixed(2)}h ≠ ${task.hoursAssigned.toFixed(2)}h`);
        return;
      }
      const projectMonthAllocations = allocations.filter(
        a => a.projectId === task.projectId && isAllocationInEffectiveMonth(a.weekStartDate, viewDate) && a.id !== task.id
      );
      const projectBudget = projects.find(p => p.id === task.projectId)?.budgetHours || 0;
      const newProjectMonthTotal =
        projectMonthAllocations.reduce((s, a) => s + a.hoursAssigned, 0) + totalDistributed;
      if (projectBudget > 0 && newProjectMonthTotal > projectBudget) {
        toast.warning(
          `Proyecto excede presupuesto (${newProjectMonthTotal.toFixed(1)}h/${projectBudget.toFixed(1)}h). Se creará igualmente.`
        );
      }

      const checkedWeeks = new Set<string>();
      const distSlots = getSlotsForTaskWeek(task.weekStartDate);
      for (const dt of validTasks) {
        if (checkedWeeks.has(dt.weekDate)) continue;
        checkedWeeks.add(dt.weekDate);
        const dSlot = distSlots.find(s => s.storageKey === dt.weekDate);
        const wl = getEmployeeLoadForWeek(employeeId, dt.weekDate, undefined, undefined, dSlot?.viewMonth ?? viewDate);
        const wt = validTasks.filter(t => t.weekDate === dt.weekDate).reduce((s, t) => s + parseHours(t.hours), 0);
        if ((wl?.hours || 0) + wt > (wl?.capacity || 0)) {
          toast.warning(`Semana ${format(parseISO(dt.weekDate), 'd MMM')} sobre capacidad.`);
        }
      }

      const isTransferredTask =
        !!task.transferredFromAllocationId || task.taskName?.includes('(transferida de');
      const transferMatch = task.taskName?.match(/\(transferida de (.+)\)/);
      const fromEmployeeName = transferMatch
        ? transferMatch[1]
        : task.transferSourceEmployeeId
          ? employees.find(e => e.id === task.transferSourceEmployeeId)?.name
          : null;
      const originalTransferredTaskName =
        task.originalTransferredTaskName ||
        (isTransferredTask ? task.taskName?.replace(/\(transferida de .+\)/, '').trim() || task.taskName : null);
      const originalTaskId = task.id;
      const originalTaskName =
        task.taskName?.replace(/\(transferida de .+\)/, '').trim() || task.taskName || 'Tarea';
      const baseComment = `Distribuidas en ${validTasks.length} tarea(s): ${validTasks.map(t => `${t.taskName} (${t.hours}h)`).join(', ')} | Nombre original: ${originalTaskName}`;
      await addWeeklyFeedback({
        employeeId,
        weekStartDate: taskWeekStr,
        projectId: task.projectId,
        allocationId: originalTaskId,
        reason: 'other',
        comments: userComment?.trim() ? `${baseComment} | Nota: ${userComment.trim()}` : baseComment,
      });

      for (const distTask of validTasks) {
        const newAllocation = await addAllocation({
          employeeId,
          projectId: task.projectId,
          weekStartDate: distTask.weekDate,
          hoursAssigned: parseHours(distTask.hours),
          taskName: distTask.taskName,
          status: 'planned',
          transferredFromAllocationId:
            isTransferredTask && task.transferredFromAllocationId ? task.transferredFromAllocationId : undefined,
          distributionSourceAllocationId: originalTaskId,
          originalTransferredTaskName: originalTransferredTaskName || distTask.taskName,
          transferSourceEmployeeId: task.transferSourceEmployeeId || (isTransferredTask ? undefined : employeeId),
        });
        if (newAllocation) {
          await copyAllocationNotes(originalTaskId, newAllocation.id);
          if (isTransferredTask && fromEmployeeName) {
            const fbComment =
              originalTransferredTaskName && originalTransferredTaskName !== distTask.taskName
                ? `Tarea distribuida desde transferencia de ${fromEmployeeName} (tarea original: ${originalTransferredTaskName})`
                : `Tarea distribuida desde transferencia de ${fromEmployeeName}`;
            await addWeeklyFeedback({
              employeeId,
              weekStartDate: distTask.weekDate,
              projectId: task.projectId,
              allocationId: newAllocation.id,
              reason: 'other',
              comments: fbComment,
            });
          }
        }
      }
      await deleteAllocation(originalTaskId);
    },
    [
      addAllocation,
      addWeeklyFeedback,
      allocations,
      deleteAllocation,
      employees,
      getEmployeeLoadForWeek,
      getSlotsForTaskWeek,
      projects,
      viewDate,
    ]
  );

  return useMemo(
    () => ({
      preference,
      applyMove,
      applyMoveToEmployee,
      applyJustify,
      applyKeep,
      applyRollover,
      applyDistribute,
      getSlotsForTaskWeek,
    }),
    [
      preference,
      applyMove,
      applyMoveToEmployee,
      applyJustify,
      applyKeep,
      applyRollover,
      applyDistribute,
      getSlotsForTaskWeek,
    ]
  );
}
