import { useCallback, useMemo } from 'react';
import { format, parseISO, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/lib/notify';
import { useApp } from '@/contexts/AppContext';
import { useAgency } from '@/contexts/AgencyContext';
import { useWeeklyCloseDay } from '@/hooks/useWeeklyCloseDay';
import { collectSelectableFutureWeekSlots, isAllocationInEffectiveMonth } from '@/utils/dateUtils';
import type { Allocation } from '@/types';

export const WEEKLY_SLOT_EXTRA_MONTHS = 1;

export function normalizeWeeklyHourInput(raw: string): string {
  const v = raw.replace(/[^0-9,.]/g, '').replace(/,/g, '.');
  const parts = v.split('.');
  return parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : v;
}

export function parseWeeklyCloseHours(value: string): number {
  const parsed = parseFloat(value.replace(',', '.'));
  return Number.isNaN(parsed) ? 0 : parsed;
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
      await updateAllocation({ ...task, hoursAssigned: effectiveActual, status: 'completed' });
      const existing = allocations.find(
        a =>
          a.employeeId === employeeId &&
          a.projectId === task.projectId &&
          a.weekStartDate === targetWeekVal &&
          a.taskName === task.taskName
      );
      if (existing) {
        await updateAllocation({ ...existing, hoursAssigned: existing.hoursAssigned + remainingHours });
      } else {
        await addAllocation({
          employeeId,
          projectId: task.projectId,
          weekStartDate: targetWeekVal,
          hoursAssigned: remainingHours,
          taskName: task.taskName || 'Tarea movida',
          status: 'planned',
        });
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
      await updateAllocation({ ...task, hoursAssigned: task.hoursActual || 0, status: 'completed' });
      const taskNameTransferred = task.taskName || 'Tarea';
      await addAllocation({
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
      const transferBase = `Tarea transferida a ${employees.find(e => e.id === targetEmployeeId)?.name || 'otro empleado'} (${remainingHours}h restantes) | Nombre: ${task.taskName || 'Sin nombre'}`;
      await addWeeklyFeedback({
        employeeId,
        weekStartDate: taskWeekStr,
        projectId: task.projectId,
        allocationId: task.id,
        reason: 'other',
        comments: transferComment?.trim() ? `${transferBase} | Nota: ${transferComment.trim()}` : transferBase,
      });
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
      const taskWeekDate = parseISO(task.weekStartDate);
      const taskWeekStr = format(taskWeekDate, 'yyyy-MM-dd');
      const slots = getSlotsForTaskWeek(task.weekStartDate);
      const destSlot = slots.find(s => s.storageKey === destWeekStr);
      if (!destWeekStr || !destSlot) {
        toast.error(`"${task.taskName}": elige semana destino`);
        return false;
      }
      if (actual <= 0) {
        toast.error(`"${task.taskName}" necesita horas reales > 0`);
        return false;
      }
      if (newEstimate <= 0) {
        toast.error(`"${task.taskName}" necesita horas planificadas > 0`);
        return false;
      }
      await updateAllocation({ ...task, hoursActual: actual, hoursComputed: computed, status: 'completed' });
      try {
        const newAllocation = await addAllocation({
          employeeId: task.employeeId,
          projectId: task.projectId,
          weekStartDate: destWeekStr,
          hoursAssigned: newEstimate,
          hoursActual: 0,
          hoursComputed: 0,
          status: 'planned',
          taskName: task.taskName,
          description: task.description,
          parentAllocationId: task.id,
        });
        if (!newAllocation) {
          toast.error(`No se pudo crear tarea para "${task.taskName}"`);
          return false;
        }
        await loadDataForMonth(destSlot.viewMonth);
      } catch (error) {
        toast.error(`Error: ${error instanceof Error ? error.message : 'desconocido'}`);
        return false;
      }
      const destLabel = format(destSlot.weekStart, 'd MMM yyyy', { locale: es });
      const fb =
        comment ||
        `Tarea con rollover: ${actual.toFixed(2)}h registradas, ${newEstimate.toFixed(2)}h planificadas desde ${destLabel}`;
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
    [addAllocation, addWeeklyFeedback, getSlotsForTaskWeek, loadDataForMonth, updateAllocation]
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
        if (isTransferredTask && fromEmployeeName && newAllocation) {
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
