import { useCallback, useMemo } from 'react';
import { endOfMonth, startOfMonth } from 'date-fns';
import { useApp } from '../contexts/AppContext';
import { useAgency } from '../contexts/AgencyContext';
import {
  computeProjectMetricsForMonth,
  type ProjectMetrics,
  type EmployeeMetrics,
  type ProjectMetricsDeadline,
  type ComputeProjectMetricsParams,
} from '@/utils/projectMetricsCompute';
import type { Employee, GlobalAssignment } from '@/types';
import { getAbsenceHoursInRange } from '@/utils/absenceUtils';
import { getMonthlyCapacity } from '@/utils/dateUtils';
import { getTeamEventHoursInRange } from '@/utils/teamEventUtils';
import { round2 } from '@/utils/numbers';

/**
 * Central metrics calculation hook.
 * Single source of truth for project and employee metrics.
 * Use this throughout the application instead of recalculating locally.
 */

export type { ProjectMetrics, EmployeeMetrics, ProjectMetricsDeadline };

export interface UseProjectMetricsOptions {
  month: Date;
  projectId?: string;
  employeeId?: string;
  clientId?: string;
  /** Si se pasa, se usa el presupuesto efectivo del mes (deadline / Entregable) coherente con Deadlines. */
  deadlines?: ProjectMetricsDeadline[];
  /** Horas por empleado en Deadlines (mismo mes) para no ocultar inactivos con carga. */
  deadlinesEmployeeVisibility?: Array<{ month: string; employeeHours: Record<string, number> }>;
  globalAssignmentsEmployeeVisibility?: GlobalAssignment[];
}

export interface UseProjectMetricsResult {
  projectMetrics: ProjectMetrics[];
  employeeMetrics: EmployeeMetrics[];
  totals: {
    totalPlanned: number;
    totalActual: number;
    totalComputed: number;
    totalBudget: number;
    totalFee: number;
    avgProgress: number;
  };
  isLoading: boolean;
  getProjectMetrics: (projectId: string) => ProjectMetrics | undefined;
  getEmployeeMetrics: (employeeId: string) => EmployeeMetrics | undefined;
}

export function useProjectMetrics(options: UseProjectMetricsOptions): UseProjectMetricsResult {
  const { allocations, projects, clients, employees, absences, teamEvents, isLoading } = useApp();
  const { currentAgency } = useAgency();
  const preference = currentAgency?.settings?.hoursTrackingPreference;
  const {
    month,
    projectId,
    employeeId,
    clientId,
    deadlines,
    deadlinesEmployeeVisibility,
    globalAssignmentsEmployeeVisibility,
  } = options;

  const getEmployeeMonthlyCapacity = useCallback(
    (employee: Employee, viewMonth: Date) => {
      const year = viewMonth.getFullYear();
      const monthIndex = viewMonth.getMonth();
      const monthStart = startOfMonth(viewMonth);
      const monthEnd = endOfMonth(viewMonth);
      const base = getMonthlyCapacity(year, monthIndex, employee.workSchedule);
      const empAbsences = absences.filter(a => a.employeeId === employee.id);
      const absenceH = getAbsenceHoursInRange(monthStart, monthEnd, empAbsences, employee.workSchedule);
      const eventH = getTeamEventHoursInRange(
        monthStart,
        monthEnd,
        employee.id,
        teamEvents,
        employee.workSchedule,
        empAbsences
      );
      return round2(Math.max(0, base - absenceH - eventH));
    },
    [absences, teamEvents]
  );

  const result = useMemo(() => {
    const params: ComputeProjectMetricsParams = {
      allocations,
      projects,
      clients,
      employees,
      month,
      hoursTrackingPreference: preference,
      deadlines,
      projectId,
      employeeId,
      clientId,
      getEmployeeMonthlyCapacity,
      deadlinesEmployeeVisibility,
      globalAssignmentsEmployeeVisibility,
    };
    return computeProjectMetricsForMonth(params);
  }, [
    allocations,
    projects,
    clients,
    employees,
    month,
    projectId,
    employeeId,
    clientId,
    deadlines,
    deadlinesEmployeeVisibility,
    globalAssignmentsEmployeeVisibility,
    preference,
    getEmployeeMonthlyCapacity,
  ]);

  return {
    ...result,
    isLoading,
  };
}

export default useProjectMetrics;
