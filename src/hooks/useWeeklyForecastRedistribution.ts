import { useCallback, useMemo } from 'react';
import { parseISO } from 'date-fns';
import { Allocation, Employee } from '@/types';
import { isAllocationInEffectiveMonth, getWeekEndDate } from '@/utils/dateUtils';
import { toast } from '@/lib/notify';

interface DelayedTasksByEmployeeItem {
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  tasks: Allocation[];
}

interface UseWeeklyForecastRedistributionParams {
  selectedProject: string | null;
  allocations: Allocation[];
  currentMonth: Date;
  employees: Employee[];
  selectedDepartmentId: string | null;
  employeesForView: Array<{ id: string }>;
  weeklyCloseDay: number;
  redistributeToEmployee: string;
  redistributeWeek: string;
  redistributeSelectedTasks: Set<string>;
  addAllocation: (allocation: Omit<Allocation, 'id'>) => Promise<unknown>;
  updateAllocation: (patch: Partial<Allocation> & Pick<Allocation, 'id'>) => void | Promise<void>;
  setRedistributeSelectedTasks: (value: Set<string>) => void;
  setRedistributeToEmployee: (value: string) => void;
  setRedistributeWeek: (value: string) => void;
  setSelectedProject: (value: string | null) => void;
}

export function useWeeklyForecastRedistribution(params: UseWeeklyForecastRedistributionParams) {
  const {
    selectedProject,
    allocations,
    currentMonth,
    employees,
    selectedDepartmentId,
    employeesForView,
    weeklyCloseDay,
    redistributeToEmployee,
    redistributeWeek,
    redistributeSelectedTasks,
    addAllocation,
    updateAllocation,
    setRedistributeSelectedTasks,
    setRedistributeToEmployee,
    setRedistributeWeek,
    setSelectedProject,
  } = params;

  const delayedTasksByEmployee = useMemo<DelayedTasksByEmployeeItem[]>(() => {
    if (!selectedProject) return [];

    const today = new Date();
    const deptEmployeeIds = selectedDepartmentId ? new Set(employeesForView.map(e => e.id)) : null;

    const delayedTasks = allocations.filter(a => {
      if (a.projectId !== selectedProject) return false;
      if (a.status === 'completed') return false;
      if (deptEmployeeIds && !deptEmployeeIds.has(a.employeeId)) return false;

      try {
        const taskWeekDate = parseISO(a.weekStartDate);
        if (!isAllocationInEffectiveMonth(taskWeekDate.toISOString().split('T')[0], currentMonth)) return false;

        const taskWeekEnd = getWeekEndDate(taskWeekDate, weeklyCloseDay);
        return taskWeekEnd <= today;
      } catch {
        return false;
      }
    });

    const grouped: Record<string, Allocation[]> = {};
    delayedTasks.forEach(task => {
      if (!grouped[task.employeeId]) {
        grouped[task.employeeId] = [];
      }
      grouped[task.employeeId].push(task);
    });

    return Object.entries(grouped)
      .map(([employeeId, tasks]) => {
        const employee = employees.find(e => e.id === employeeId);
        return {
          employeeId,
          employeeName: employee?.name || 'Desconocido',
          employeeAvatar: employee?.avatarUrl,
          tasks: tasks || [],
        };
      })
      .filter(g => g.employeeName !== 'Desconocido' && g.tasks && g.tasks.length > 0);
  }, [selectedProject, allocations, currentMonth, employees, selectedDepartmentId, employeesForView, weeklyCloseDay]);

  const handleRedistribute = useCallback(async () => {
    if (!selectedProject || !redistributeToEmployee || !redistributeWeek) {
      toast.error('Completa todos los campos');
      return;
    }

    if (redistributeSelectedTasks.size === 0) {
      toast.error('Selecciona al menos una tarea para redistribuir');
      return;
    }

    const allDelayedTasks = delayedTasksByEmployee.flatMap(g => g.tasks || []);
    const tasksToTransfer = allDelayedTasks.filter(task => redistributeSelectedTasks.has(task.id));

    if (tasksToTransfer.length === 0) {
      toast.error('No hay tareas seleccionadas');
      return;
    }

    let totalHours = 0;
    const tasksByEmployee: Record<string, Allocation[]> = {};

    tasksToTransfer.forEach(task => {
      const remainingHours = task.hoursAssigned - (task.hoursActual || 0);
      if (remainingHours > 0) {
        totalHours += remainingHours;
        if (!tasksByEmployee[task.employeeId]) {
          tasksByEmployee[task.employeeId] = [];
        }
        tasksByEmployee[task.employeeId].push(task);
      }
    });

    if (totalHours <= 0) {
      toast.error('Las tareas seleccionadas no tienen horas restantes');
      return;
    }

    try {
      for (const [fromEmployeeId, employeeTasks] of Object.entries(tasksByEmployee)) {
        const fromEmployee = employees.find(e => e.id === fromEmployeeId);
        const fromEmployeeName = fromEmployee?.name || 'compañero';

        for (const task of employeeTasks) {
          const remainingHours = task.hoursAssigned - (task.hoursActual || 0);
          if (remainingHours > 0) {
            await updateAllocation({
              ...task,
              hoursAssigned: task.hoursActual || 0,
              status: 'completed',
            });

            await addAllocation({
              employeeId: redistributeToEmployee,
              projectId: selectedProject,
              weekStartDate: redistributeWeek,
              hoursAssigned: remainingHours,
              taskName: `${task.taskName || 'Tarea'} (transferida de ${fromEmployeeName})`,
              status: 'planned',
            });
          }
        }
      }

      toast.success(`${totalHours.toFixed(1)}h redistribuidas correctamente`);
      setRedistributeSelectedTasks(new Set());
      setRedistributeToEmployee('');
      setRedistributeWeek('');
      setSelectedProject(null);
    } catch (error) {
      console.error('Error redistribuyendo:', error);
      toast.error('Error al redistribuir horas');
    }
  }, [
    selectedProject,
    redistributeToEmployee,
    redistributeWeek,
    redistributeSelectedTasks,
    delayedTasksByEmployee,
    employees,
    updateAllocation,
    addAllocation,
    setRedistributeSelectedTasks,
    setRedistributeToEmployee,
    setRedistributeWeek,
    setSelectedProject,
  ]);

  return {
    delayedTasksByEmployee,
    handleRedistribute,
  };
}

