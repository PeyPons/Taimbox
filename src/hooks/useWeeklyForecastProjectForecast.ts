import { useMemo } from 'react';
import { Allocation, Client, Deadline, Project } from '@/types';
import { getEffectiveBudget } from '@/utils/budgetUtils';
import { getEffectiveCompletedHours } from '@/utils/hoursTracking';
import { isAllocationInEffectiveMonth } from '@/utils/dateUtils';
import { round2 } from '@/utils/numbers';

type ForecastStatus = 'red' | 'yellow' | 'green';
type SortBy = 'name' | 'status' | 'difference' | 'contracted';

export interface WeeklyProjectForecastItem {
  projectId: string;
  projectName: string;
  clientName: string;
  clientColor: string;
  contracted: number;
  realized: number;
  completedHours: number;
  plannedHours: number;
  difference: number;
  status: ForecastStatus;
}

interface UseWeeklyForecastProjectForecastParams {
  projects: Project[];
  filteredProjectsForView: Project[];
  selectedDepartmentId: string | null;
  allocations: Allocation[];
  clients: Client[];
  monthDeadlines: Deadline[];
  currentMonth: Date;
  employeesForView: Array<{ id: string }>;
  filterClient: string;
  filterProjectStatus: string;
  filterId: string;
  sortBy: SortBy;
  filterProject: (project: Project, filterId: string) => boolean;
  hoursTrackingPreference?: 'actual' | 'computed' | null;
}

export function useWeeklyForecastProjectForecast(params: UseWeeklyForecastProjectForecastParams) {
  const {
    projects,
    filteredProjectsForView,
    selectedDepartmentId,
    allocations,
    clients,
    monthDeadlines,
    currentMonth,
    employeesForView,
    filterClient,
    filterProjectStatus,
    filterId,
    sortBy,
    filterProject,
    hoursTrackingPreference,
  } = params;

  return useMemo(() => {
    const baseProjects = selectedDepartmentId ? filteredProjectsForView : projects;
    if (!baseProjects || !Array.isArray(baseProjects)) return [];
    let filteredProjects = baseProjects.filter(p => p.status === 'active' && !p.isHidden);

    if (filterClient !== 'all') {
      filteredProjects = filteredProjects.filter(p => p.clientId === filterClient);
    }

    if (filterId !== 'all') {
      filteredProjects = filteredProjects.filter(p => filterProject(p, filterId));
    }

    const deptEmployeeIds = selectedDepartmentId ? new Set(employeesForView.map(e => e.id)) : null;

    const forecastData = filteredProjects
      .map(project => {
        const deadline = monthDeadlines.find(d => d.projectId === project.id);
        const contracted = getEffectiveBudget(project, deadline);

        let monthAllocations = allocations.filter(
          a => a.projectId === project.id && isAllocationInEffectiveMonth(a.weekStartDate, currentMonth)
        );
        if (deptEmployeeIds) {
          monthAllocations = monthAllocations.filter(a => deptEmployeeIds.has(a.employeeId));
        }

        const completed = monthAllocations.filter(a => a.status === 'completed');
        const planned = monthAllocations.filter(a => a.status !== 'completed');

        const completedHours = round2(
          completed.reduce((sum, a) => sum + getEffectiveCompletedHours(a, hoursTrackingPreference ?? undefined), 0)
        );
        const plannedHours = round2(planned.reduce((sum, a) => sum + a.hoursAssigned, 0));
        const realized = round2(completedHours + plannedHours);
        const difference = round2(contracted - realized);

        const minimum = project.minimumHours || 0;
        const targetHours = minimum > 0 ? minimum : contracted;
        const hoursMissing = targetHours - realized;

        let status: ForecastStatus;
        if (contracted > 0 && realized > contracted + 5) {
          status = 'red';
        } else if (hoursMissing > 5) {
          status = 'yellow';
        } else {
          status = 'green';
        }

        return {
          projectId: project.id,
          projectName: project.name,
          clientName: clients.find(c => c.id === project.clientId)?.name || 'Sin cliente',
          clientColor: clients.find(c => c.id === project.clientId)?.color || '#6b7280',
          contracted,
          realized,
          completedHours,
          plannedHours,
          difference,
          status,
        } satisfies WeeklyProjectForecastItem;
      })
      .filter(proj => (filterProjectStatus === 'all' ? true : proj.status === filterProjectStatus))
      .sort((a, b) => {
        if (sortBy === 'name') return a.projectName.localeCompare(b.projectName);
        if (sortBy === 'status') {
          const statusOrder = { red: 0, yellow: 1, green: 2 };
          return statusOrder[a.status] - statusOrder[b.status] || Math.abs(b.difference) - Math.abs(a.difference);
        }
        if (sortBy === 'difference') return Math.abs(b.difference) - Math.abs(a.difference);
        if (sortBy === 'contracted') return b.contracted - a.contracted;
        return 0;
      });

    return Array.isArray(forecastData) ? forecastData : [];
  }, [
    selectedDepartmentId,
    filteredProjectsForView,
    projects,
    filterClient,
    filterId,
    filterProject,
    employeesForView,
    monthDeadlines,
    allocations,
    currentMonth,
    clients,
    filterProjectStatus,
    sortBy,
    hoursTrackingPreference,
  ]);
}

