import { useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAgency } from '../contexts/AgencyContext';
import {
  computeProjectMetricsForMonth,
  type ProjectMetrics,
  type EmployeeMetrics,
  type ProjectMetricsDeadline,
  type ComputeProjectMetricsParams,
} from '@/utils/projectMetricsCompute';

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
  /** Si se pasa, se usa getEffectiveBudget(project, deadline) para el objetivo del mes (coherente con Deadlines/Coherencia) */
  deadlines?: ProjectMetricsDeadline[];
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
  const { allocations, projects, clients, employees, isLoading } = useApp();
  const { currentAgency } = useAgency();
  const preference = currentAgency?.settings?.hoursTrackingPreference;
  const { month, projectId, employeeId, clientId, deadlines } = options;

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
    };
    return computeProjectMetricsForMonth(params);
  }, [allocations, projects, clients, employees, month, projectId, employeeId, clientId, deadlines, preference]);

  return {
    ...result,
    isLoading,
  };
}

export default useProjectMetrics;
