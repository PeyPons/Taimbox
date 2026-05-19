import { useCallback, useEffect, useMemo, useRef } from 'react';
import { AllocationFormDialog } from '@/components/planner/allocation/AllocationFormDialog';
import { useAppAllocations, useAppEmployees, useAppProjects } from '@/contexts/AppContext';
import { useAllocationActions } from '@/hooks/useAllocationActions';
import { useAllocationSheet } from '@/hooks/useAllocationSheet';
import { useIntegration } from '@/hooks/useIntegration';
import { usePermissions } from '@/hooks/usePermissions';
import { useProjectAliasing } from '@/hooks/useProjectAliasing';
import { useTasksImpact } from '@/hooks/useTasksImpact';
import type { Allocation, Deadline } from '@/types';
import { isAllocationInEffectiveMonth } from '@/utils/dateUtils';

export interface CoherenceAllocationEditDialogProps {
  allocation: Allocation;
  viewDate: Date;
  deadlines: Deadline[];
  onDismiss: () => void;
}

/**
 * Abre el mismo formulario de edición del planificador para una asignación concreta
 * (modal de tareas en seguimiento operativo). Contexto administrativo: permite editar
 * tareas de semanas pasadas aunque Weekly esté activo (`allowEditPastWeeks`).
 */
export function CoherenceAllocationEditDialog({
  allocation,
  viewDate,
  deadlines,
  onDismiss,
}: CoherenceAllocationEditDialogProps) {
  const employeeId = allocation.employeeId;
  const { hasPermission } = usePermissions();
  const canAssignToOthers = hasPermission('can_assign_tasks_to_others');
  const isWeeklyEnabled = useIntegration('weekly_feedback');

  const { weeks, activeProjects, getProjectBudgetStatus } = useAllocationSheet(
    employeeId,
    viewDate,
    deadlines
  );

  const { allocations, getEmployeeLoadForWeek } = useAppAllocations();
  const { projects, clients } = useAppProjects();
  const { employees } = useAppEmployees();
  const { formatName: formatProjectName } = useProjectAliasing();

  const {
    newTasks,
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
    editWeek,
    setEditWeek,
    editDependencyId,
    setEditDependencyId,
    editEmployeeId,
    setEditEmployeeId,
    addTaskRow,
    removeTaskRow,
    updateTaskRow,
    handleSave,
    startEditFull,
    handleDeleteClick,
    confirmDelete,
    closeForm,
    clearNewTasks,
    canSubmitBatchAdd,
    batchAddHint,
    batchPreviewContext,
  } = useAllocationActions(employeeId, weeks, canAssignToOthers, isWeeklyEnabled, {
    allowEditPastWeeks: true,
    batchPreview: {
      allocations,
      viewDate,
      weeks,
      getProjectBudgetStatus,
      getEmployeeLoadForWeek,
    },
  });

  const getAvailableDependencies = useMemo(
    () => (projectId: string, currentTaskId?: string) => {
      if (!projectId) return [];
      return allocations.filter(
        a =>
          a.projectId === projectId &&
          a.id !== currentTaskId &&
          a.status !== 'completed' &&
          isAllocationInEffectiveMonth(a.weekStartDate, viewDate)
      );
    },
    [allocations, viewDate]
  );

  const { getWeekExceedStatus } = useTasksImpact({
    newTasks,
    projects,
    weeks,
    employeeId,
    getEmployeeLoadForWeek,
    getProjectBudgetStatus,
    viewMonth: viewDate,
    batchPreview: batchPreviewContext,
  });

  useEffect(() => {
    clearNewTasks();
    const ok = startEditFull(allocation);
    if (!ok) onDismiss();
    // Intencionalmente solo al montar / al cambiar de tarea
    // eslint-disable-next-line react-hooks/exhaustive-deps -- allocation estable por id en el padre
  }, [allocation.id]);

  const hasBeenOpen = useRef(false);
  if (isFormOpen || editingAllocation) {
    hasBeenOpen.current = true;
  }

  useEffect(() => {
    if (hasBeenOpen.current && !isFormOpen && !editingAllocation) {
      hasBeenOpen.current = false;
      clearNewTasks();
      onDismiss();
    }
  }, [isFormOpen, editingAllocation, clearNewTasks, onDismiss]);

  const handleClose = useCallback(() => {
    closeForm();
    clearNewTasks();
    onDismiss();
  }, [closeForm, clearNewTasks, onDismiss]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        closeForm();
        clearNewTasks();
        onDismiss();
      } else {
        setIsFormOpen(true);
      }
    },
    [closeForm, clearNewTasks, onDismiss, setIsFormOpen]
  );

  return (
    <AllocationFormDialog
      isOpen={isFormOpen}
      onOpenChange={handleOpenChange}
      editingAllocation={editingAllocation}
      newTasks={newTasks}
      editProjectId={editProjectId}
      editTaskName={editTaskName}
      editHours={editHours}
      editWeek={editWeek}
      editDependencyId={editDependencyId}
      editEmployeeId={editEmployeeId}
      isSaving={isSaving}
      showDeleteConfirm={showDeleteConfirm}
      onClose={handleClose}
      onSave={handleSave}
      onDelete={handleDeleteClick}
      onConfirmDelete={confirmDelete}
      setEditProjectId={setEditProjectId}
      setEditTaskName={setEditTaskName}
      setEditHours={setEditHours}
      setEditWeek={setEditWeek}
      setEditDependencyId={setEditDependencyId}
      setEditEmployeeId={setEditEmployeeId}
      setShowDeleteConfirm={setShowDeleteConfirm}
      addTaskRow={addTaskRow}
      updateTaskRow={updateTaskRow}
      removeTaskRow={removeTaskRow}
      activeProjects={activeProjects}
      clients={clients}
      employees={employees}
      weeks={weeks}
      allocations={allocations}
      deadlines={deadlines}
      currentEmployeeId={employeeId}
      canAssignToOthers={canAssignToOthers}
      viewDate={viewDate}
      getProjectBudgetStatus={getProjectBudgetStatus}
      getAvailableDependencies={getAvailableDependencies}
      getWeekExceedStatus={getWeekExceedStatus}
      getEmployeeLoadForWeek={getEmployeeLoadForWeek}
      formatProjectName={formatProjectName}
      canSubmitBatchAdd={canSubmitBatchAdd}
      batchAddHint={batchAddHint}
      batchPreview={batchPreviewContext}
    />
  );
}
