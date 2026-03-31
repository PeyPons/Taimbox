import { useMemo } from 'react';
import { Allocation, Employee, Project } from '@/types';
import { isAllocationInEffectiveMonth } from '@/utils/dateUtils';

export interface WeeklyForecastTransferItem {
  fromEmployeeId: string;
  fromEmployeeName: string;
  fromEmployeeAvatar?: string;
  toEmployeeId: string;
  toEmployeeName: string;
  toEmployeeAvatar?: string;
  projectId: string;
  projectName: string;
  hours: number;
  taskName: string;
  status: 'pending' | 'kept' | 'distributed' | 'rejected';
  feedbackId?: string;
  allocationId?: string;
  createdAt: string;
  comments?: string;
  distributedTasks?: Array<{ name: string; hours: number; weekDate: string; employeeName?: string }>;
  notes?: string;
  originalWeek?: string;
  targetWeek?: string;
  acceptanceMode?: 'keep' | 'move' | 'distribute' | 'rollover';
  resultAllocationIds?: string[];
  uniqueId: string;
}

interface UseWeeklyForecastTransfersParams {
  weeklyFeedback: any[] | undefined;
  allocations: Allocation[] | undefined;
  employees: Employee[] | undefined;
  projects: Project[] | undefined;
  currentMonth: Date;
  filterFeedbackEmployee: string;
  filterFeedbackProject: string;
  filterTransferStatus: 'all' | 'pending' | 'kept' | 'distributed';
  dbTransfers: any[];
  selectedDepartmentId: string | null;
  employeesForView: Array<{ id: string }>;
}

export function useWeeklyForecastTransfers(params: UseWeeklyForecastTransfersParams) {
  const {
    weeklyFeedback,
    allocations,
    employees,
    projects,
    currentMonth,
    filterFeedbackEmployee,
    filterFeedbackProject,
    filterTransferStatus,
    dbTransfers,
    selectedDepartmentId,
    employeesForView,
  } = params;

  return useMemo(() => {
    if (!weeklyFeedback || !Array.isArray(weeklyFeedback) || !allocations || !Array.isArray(allocations)) return [];

    const isInMonth = (dateStr: string | Date) => {
      try {
        return isAllocationInEffectiveMonth(dateStr, currentMonth);
      } catch {
        return false;
      }
    };

    const transferFeedbacks = (weeklyFeedback || []).filter(fb => {
      if (!isInMonth(fb.weekStartDate)) return false;
      const comment = fb.comments || '';
      return comment.includes('transferida a') || comment.includes('Tarea transferida a');
    });

    const transferredTasks = (allocations || []).filter(a => {
      const isTransferred = a.transferredFromAllocationId !== undefined && a.transferredFromAllocationId !== null;
      if (!isTransferred && !a.taskName?.includes('(transferida de')) return false;
      return isInMonth(a.weekStartDate);
    });

    const transferMap = new Map<string, WeeklyForecastTransferItem>();

    dbTransfers.forEach(t => {
      const key = t.id;
      let status: 'pending' | 'kept' | 'distributed' | 'rejected' = 'pending';
      if (t.status === 'accepted') {
        if (t.acceptance_mode === 'distribute') {
          status = 'distributed';
        } else {
          status = 'kept';
        }
      }
      if (t.status === 'rejected') status = 'rejected';

      transferMap.set(key, {
        fromEmployeeId: t.from_employee_id,
        fromEmployeeName: t.from_employee?.name || 'Desconocido',
        fromEmployeeAvatar: t.from_employee?.avatar_url,
        toEmployeeId: t.to_employee_id,
        toEmployeeName: t.to_employee?.name || 'Desconocido',
        toEmployeeAvatar: t.to_employee?.avatar_url,
        projectId: t.allocation?.project_id || '',
        projectName: projects?.find(p => p.id === t.allocation?.project_id)?.name || 'Sin proyecto',
        hours: t.hours_transferred,
        taskName: t.allocation?.task_name || 'Tarea',
        status,
        allocationId: t.allocation_id,
        createdAt: t.requested_at,
        comments: t.reason,
        originalWeek: t.requested_at,
        acceptanceMode: t.acceptance_mode,
        resultAllocationIds: t.result_allocation_ids || [],
        uniqueId: key,
      });
    });

    transferFeedbacks.forEach(fb => {
      const fromEmployee = employees?.find(e => e.id === fb.employeeId);
      const match = fb.comments?.match(/transferida a (.+?) \(/);
      const toEmployeeName = match ? match[1] : null;
      const toEmployee = toEmployeeName ? employees?.find(e => e.name === toEmployeeName) : null;
      const hoursMatch = fb.comments?.match(/\((\d+(?:\.\d+)?)h restantes\)/);
      const hours = hoursMatch ? parseFloat(hoursMatch[1]) : 0;

      if (fromEmployee && toEmployee && fb.allocationId) {
        const key = `${fb.allocationId}-${toEmployee.id}`;
        const transferredTask = transferredTasks.find(
          t => t.id === fb.allocationId || t.taskName?.includes(`(transferida de ${fromEmployee.name})`)
        );

        let status: 'pending' | 'kept' | 'distributed' | 'rejected' = 'pending';
        let targetWeek: string | undefined;

        const taskFeedbackOriginal = weeklyFeedback.find(f => f.allocationId === fb.allocationId);
        const taskFeedbackTransferred = transferredTask ? weeklyFeedback.find(f => f.allocationId === transferredTask.id) : null;
        const taskFeedback = taskFeedbackTransferred || taskFeedbackOriginal;

        if (taskFeedback) {
          if (taskFeedback.comments?.includes('Tarea mantenida tal cual')) {
            status = 'kept';
            targetWeek = taskFeedback.weekStartDate;
          } else if (taskFeedback.comments?.includes('Distribuidas en')) {
            status = 'distributed';
            targetWeek = taskFeedback.weekStartDate;
          }
        }

        let taskName = 'Tarea transferida';
        if (transferredTask) {
          taskName = transferredTask.taskName?.replace(/\(transferida de .+\)/, '').trim() || 'Tarea transferida';
        } else if (taskFeedback?.comments) {
          const nameMatch = taskFeedback.comments.match(/Nombre original: (.+?)(?:\s*\||$)/);
          if (nameMatch) {
            taskName = nameMatch[1].trim();
          } else {
            const transferNameMatch = fb.comments?.match(/Nombre: (.+?)(?:\s*\||$)/);
            if (transferNameMatch) taskName = transferNameMatch[1].trim();
          }
        } else if (fb.comments) {
          const transferNameMatch = fb.comments.match(/Nombre: (.+?)(?:\s*\||$)/);
          if (transferNameMatch) taskName = transferNameMatch[1].trim();
        }

        let notes: string | undefined;
        if (taskFeedback?.comments) {
          const notesMatch = taskFeedback.comments.match(/\| Motivo: (.+)$/);
          if (notesMatch) notes = notesMatch[1].trim();
        }

        transferMap.set(key, {
          fromEmployeeId: fromEmployee.id,
          fromEmployeeName: fromEmployee.name,
          fromEmployeeAvatar: fromEmployee.avatarUrl,
          toEmployeeId: toEmployee.id,
          toEmployeeName: toEmployee.name,
          toEmployeeAvatar: toEmployee.avatarUrl,
          projectId: fb.projectId || '',
          projectName: projects?.find(p => p.id === fb.projectId)?.name || 'Sin proyecto',
          hours: hours || (transferredTask?.hoursAssigned || 0),
          taskName,
          status,
          feedbackId: fb.id,
          allocationId: fb.allocationId,
          createdAt: taskFeedback?.createdAt || fb.createdAt,
          comments: fb.comments,
          notes,
          originalWeek: fb.weekStartDate,
          targetWeek,
          uniqueId: key,
        });
      }
    });

    transferredTasks.forEach(task => {
      let fromEmployee: Employee | undefined | null;
      let originalTaskName = 'Tarea transferida';

      if (task.transferSourceEmployeeId) {
        fromEmployee = employees?.find(e => e.id === task.transferSourceEmployeeId);
        originalTaskName = task.originalTransferredTaskName || task.taskName || 'Tarea transferida';
      } else {
        const match = task.taskName?.match(/\(transferida de (.+)\)/);
        const fromEmployeeName = match ? match[1] : null;
        fromEmployee = fromEmployeeName ? employees?.find(e => e.name === fromEmployeeName) : null;
        originalTaskName = task.taskName?.replace(/\(transferida de .+\)/, '').trim() || 'Tarea transferida';
      }

      if (fromEmployee && task.employeeId) {
        const toEmployee = employees?.find(e => e.id === task.employeeId);
        if (toEmployee) {
          const key = `${task.id}-${toEmployee.id}`;
          if (!transferMap.has(key)) {
            const taskFeedback = weeklyFeedback.find(f => f.allocationId === task.id);
            let status: 'pending' | 'kept' | 'distributed' | 'rejected' = 'pending';
            let targetWeek: string | undefined;

            if (taskFeedback) {
              if (taskFeedback.comments?.includes('Tarea mantenida tal cual')) {
                status = 'kept';
                targetWeek = taskFeedback.weekStartDate;
              } else if (taskFeedback.comments?.includes('Distribuidas en')) {
                status = 'distributed';
                targetWeek = taskFeedback.weekStartDate;
              }
            }

            let taskName = originalTaskName;
            if (taskFeedback?.comments && status === 'distributed') {
              const nameMatch = taskFeedback.comments.match(/Nombre original: (.+?)(?:\s*\||$)/);
              if (nameMatch) taskName = nameMatch[1].trim();
            }

            transferMap.set(key, {
              fromEmployeeId: fromEmployee.id,
              fromEmployeeName: fromEmployee.name,
              fromEmployeeAvatar: fromEmployee.avatarUrl,
              toEmployeeId: toEmployee.id,
              toEmployeeName: toEmployee.name,
              toEmployeeAvatar: toEmployee.avatarUrl,
              projectId: task.projectId,
              projectName: projects?.find(p => p.id === task.projectId)?.name || 'Sin proyecto',
              hours: task.hoursAssigned,
              taskName,
              status,
              allocationId: task.id,
              createdAt: task.weekStartDate,
              originalWeek: task.weekStartDate,
              targetWeek,
              uniqueId: key,
            });
          }
        }
      }
    });

    const distributedFromTransfers = (allocations || []).filter(a => {
      const isDistributed = a.distributionSourceAllocationId !== undefined && a.distributionSourceAllocationId !== null;
      if (!isDistributed && !a.taskName?.includes('(transferida de')) return false;
      return isInMonth(a.weekStartDate);
    });

    const distributedGroups = new Map<
      string,
      {
        fromEmployeeId: string;
        fromEmployeeName: string;
        fromEmployeeAvatar?: string;
        toEmployeeId: string;
        toEmployeeName: string;
        toEmployeeAvatar?: string;
        projectId: string;
        projectName: string;
        originalTaskName: string;
        distributedTasks: Array<{ id: string; name: string; hours: number; weekDate: string; employeeName: string }>;
        totalHours: number;
        createdAt: string;
        originalWeek?: string;
        targetWeek?: string;
      }
    >();

    distributedFromTransfers.forEach(distTask => {
      let fromEmployee: Employee | undefined;
      let originalTaskName: string;
      let newTaskName: string = distTask.taskName || 'Tarea';
      let originalWeek: string | undefined;

      if (distTask.transferSourceEmployeeId && distTask.originalTransferredTaskName) {
        fromEmployee = employees?.find(e => e.id === distTask.transferSourceEmployeeId);
        originalTaskName = distTask.originalTransferredTaskName;
        originalWeek = distTask.weekStartDate;
      }

      if (!fromEmployee && distTask.distributionSourceAllocationId) {
        const transferredTask = allocations.find(a => a.id === distTask.distributionSourceAllocationId);
        if (transferredTask) {
          originalWeek = transferredTask.weekStartDate;
          if (transferredTask.transferredFromAllocationId) {
            const originalTask = allocations.find(a => a.id === transferredTask.transferredFromAllocationId);
            if (originalTask) {
              fromEmployee = employees?.find(e => e.id === originalTask.employeeId);
              originalTaskName = originalTask.taskName || 'Tarea';
              originalWeek = originalTask.weekStartDate;
            } else {
              const transferMatch = transferredTask.taskName?.match(/\(transferida de (.+?)\)/);
              const fromEmployeeName = transferMatch ? transferMatch[1] : null;
              fromEmployee = fromEmployeeName ? employees?.find(e => e.name === fromEmployeeName) : undefined;
              originalTaskName = transferredTask.taskName?.replace(/\(transferida de .+\)/, '').trim() || 'Tarea';
            }
          } else {
            const transferMatch = transferredTask.taskName?.match(/\(transferida de (.+?)\)/);
            const fromEmployeeName = transferMatch ? transferMatch[1] : null;
            fromEmployee = fromEmployeeName ? employees?.find(e => e.name === fromEmployeeName) : undefined;
            originalTaskName = transferredTask.taskName?.replace(/\(transferida de .+\)/, '').trim() || 'Tarea';
          }
        }
      }

      if (!fromEmployee) {
        const fullMatch = distTask.taskName?.match(/^(.+?)\s*\(transferida de (.+?), original: (.+?)\)$/);
        if (fullMatch) {
          const [, newName, fromEmployeeName, origName] = fullMatch;
          fromEmployee = employees?.find(e => e.name === fromEmployeeName);
          originalTaskName = origName.trim();
          newTaskName = newName.trim();
        } else {
          const simpleMatch = distTask.taskName?.match(/^(.+?)\s*\(transferida de (.+?)\)$/);
          if (simpleMatch) {
            const [, newName, fromEmployeeName] = simpleMatch;
            fromEmployee = employees?.find(e => e.name === fromEmployeeName);
            originalTaskName = newName.trim();
            newTaskName = newName.trim();
          } else {
            const taskFeedback = weeklyFeedback.find(f => f.allocationId === distTask.id);
            const originalNameMatch = taskFeedback?.comments?.match(/tarea original: (.+?)(?:\s*\||$)/i);
            originalTaskName = originalNameMatch ? originalNameMatch[1].trim() : distTask.taskName || 'Tarea';
            return;
          }
        }
      }

      if (!fromEmployee) return;
      const toEmployee = employees?.find(e => e.id === distTask.employeeId);
      if (!toEmployee) return;

      const groupKey = `${fromEmployee.id}-${toEmployee.id}-${distTask.projectId}-${originalTaskName}`;

      if (!distributedGroups.has(groupKey)) {
        distributedGroups.set(groupKey, {
          fromEmployeeId: fromEmployee.id,
          fromEmployeeName: fromEmployee.name,
          fromEmployeeAvatar: fromEmployee.avatarUrl,
          toEmployeeId: toEmployee.id,
          toEmployeeName: toEmployee.name,
          toEmployeeAvatar: toEmployee.avatarUrl,
          projectId: distTask.projectId,
          projectName: projects?.find(p => p.id === distTask.projectId)?.name || 'Sin proyecto',
          originalTaskName,
          distributedTasks: [],
          totalHours: 0,
          createdAt: distTask.weekStartDate,
          originalWeek,
          targetWeek: distTask.weekStartDate,
        });
      }

      const group = distributedGroups.get(groupKey)!;
      group.distributedTasks.push({
        id: distTask.id,
        name: newTaskName.trim(),
        hours: distTask.hoursAssigned,
        weekDate: distTask.weekStartDate,
        employeeName: toEmployee.name,
      });
      group.totalHours += distTask.hoursAssigned;
    });

    distributedGroups.forEach((group, key) => {
      const existingKey = Array.from(transferMap.keys()).find(k => {
        const entry = transferMap.get(k);
        return (
          entry?.fromEmployeeId === group.fromEmployeeId &&
          entry?.toEmployeeId === group.toEmployeeId &&
          entry?.projectId === group.projectId &&
          entry?.taskName === group.originalTaskName
        );
      });

      if (existingKey) {
        const existing = transferMap.get(existingKey)!;
        existing.hours = group.totalHours;
        existing.status = 'distributed';
        existing.targetWeek = group.targetWeek;
        existing.distributedTasks = group.distributedTasks.map(t => ({
          name: t.name,
          hours: t.hours,
          weekDate: t.weekDate,
          employeeName: t.employeeName,
        }));
        transferMap.set(existingKey, existing);
      } else {
        const distributionFeedback = weeklyFeedback.find(
          fb => fb.comments?.includes('Distribuidas en') && fb.projectId === group.projectId && fb.employeeId === group.toEmployeeId
        );

        let notes: string | undefined;
        if (distributionFeedback?.comments) {
          const notesMatch = distributionFeedback.comments.match(/\| Motivo: (.+)$/);
          if (notesMatch) notes = notesMatch[1].trim();
        }

        transferMap.set(`distributed-${key}`, {
          fromEmployeeId: group.fromEmployeeId,
          fromEmployeeName: group.fromEmployeeName,
          fromEmployeeAvatar: group.fromEmployeeAvatar,
          toEmployeeId: group.toEmployeeId,
          toEmployeeName: group.toEmployeeName,
          toEmployeeAvatar: group.toEmployeeAvatar,
          projectId: group.projectId,
          projectName: group.projectName,
          hours: group.totalHours,
          taskName: group.originalTaskName,
          status: 'distributed',
          allocationId: group.distributedTasks[0]?.id,
          createdAt: distributionFeedback?.createdAt || group.createdAt,
          comments: distributionFeedback?.comments,
          distributedTasks: group.distributedTasks.map(t => ({
            name: t.name,
            hours: t.hours,
            weekDate: t.weekDate,
            employeeName: t.employeeName,
          })),
          notes,
          originalWeek: group.originalWeek,
          targetWeek: group.targetWeek,
          uniqueId: `distributed-${key}`,
        });
      }
    });

    let filtered = Array.from(transferMap.values());

    if (filterFeedbackEmployee !== 'all') {
      filtered = filtered.filter(t => t.fromEmployeeId === filterFeedbackEmployee || t.toEmployeeId === filterFeedbackEmployee);
    }

    if (filterFeedbackProject !== 'all') {
      filtered = filtered.filter(t => t.projectId === filterFeedbackProject);
    }

    if (filterTransferStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterTransferStatus);
    }

    if (selectedDepartmentId && employeesForView.length > 0) {
      const deptEmployeeIds = new Set(employeesForView.map(e => e.id));
      filtered = filtered.filter(t => deptEmployeeIds.has(t.fromEmployeeId) && deptEmployeeIds.has(t.toEmployeeId));
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [
    weeklyFeedback,
    allocations,
    employees,
    projects,
    currentMonth,
    filterFeedbackEmployee,
    filterFeedbackProject,
    filterTransferStatus,
    dbTransfers,
    selectedDepartmentId,
    employeesForView,
  ]);
}

