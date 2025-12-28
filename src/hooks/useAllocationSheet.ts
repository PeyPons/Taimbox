import { useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Allocation, Project } from '@/types';
import { getWeeksForMonth, getStorageKey } from '@/utils/dateUtils';
import { format, isSameMonth, parseISO, addDays, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

export interface ProjectBudgetStatus {
  totalComputed: number;
  totalPlanned: number;
  budgetMax: number;
  budgetMin: number;
  percentage: number;
  status: 'healthy' | 'warning' | 'overload' | 'under';
  breakdown: { employeeId: string; employeeName: string; computed: number; planned: number }[];
}

export type SortOption = 'budget_desc' | 'budget_asc' | 'my_hours_desc' | 'my_hours_asc' | 'name_asc' | 'name_desc';

export function useAllocationSheet(employeeId: string, viewDate: Date) {
  const { 
    employees, projects, allocations, getEmployeeAllocationsForWeek, 
    getEmployeeLoadForWeek, getProjectById 
  } = useApp();

  const employee = employees.find(e => e.id === employeeId);
  const weeks = useMemo(() => getWeeksForMonth(viewDate), [viewDate]);

  // Calcular índice de la semana actual
  const currentWeekIndex = useMemo(() => {
    const today = new Date();
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    const idx = weeks.findIndex(w => {
      // Comparar las fechas de inicio de semana directamente
      const weekStartDate = new Date(w.weekStart);
      return weekStartDate.getTime() === currentWeekStart.getTime();
    });
    // Si no encuentra la semana actual, buscar la más cercana
    if (idx < 0 && weeks.length > 0) {
      // Buscar la semana más cercana a la actual
      const todayTime = today.getTime();
      let closestIdx = 0;
      let minDiff = Math.abs(new Date(weeks[0].weekStart).getTime() - todayTime);
      weeks.forEach((w, i) => {
        const diff = Math.abs(new Date(w.weekStart).getTime() - todayTime);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = i;
        }
      });
      return closestIdx;
    }
    return idx >= 0 ? idx : 0;
  }, [weeks]);

  const activeProjects = useMemo(() =>
    projects.filter(p => p.status === 'active').sort((a, b) => a.name.localeCompare(b.name)),
  [projects]);

  // Resumen mensual de proyectos del empleado
  const monthlyProjectSummary = useMemo(() => {
    const monthAllocations = allocations.filter(a =>
      a.employeeId === employeeId &&
      isSameMonth(parseISO(a.weekStartDate), viewDate)
    );

    const projectMap: Record<string, {
      projectId: string;
      name: string;
      estimated: number;
      completed: number;
      computed: number;
      totalTasks: number;
      completedTasks: number;
    }> = {};

    monthAllocations.forEach(a => {
      if (!projectMap[a.projectId]) {
        const project = getProjectById(a.projectId);
        projectMap[a.projectId] = {
          projectId: a.projectId,
          name: project?.name || 'Desconocido',
          estimated: 0,
          completed: 0,
          computed: 0,
          totalTasks: 0,
          completedTasks: 0
        };
      }
      projectMap[a.projectId].estimated += a.hoursAssigned || 0;
      projectMap[a.projectId].totalTasks += 1;
      if (a.status === 'completed') {
        projectMap[a.projectId].completed += a.hoursActual || 0;
        projectMap[a.projectId].computed += a.hoursComputed || 0;
        projectMap[a.projectId].completedTasks += 1;
      }
    });

    return Object.values(projectMap)
      .map(p => ({
        ...p,
        estimated: round2(p.estimated),
        completed: round2(p.completed),
        computed: round2(p.computed),
        progress: p.estimated > 0 ? Math.round((p.computed / p.estimated) * 100) : 0
      }))
      .sort((a, b) => b.estimated - a.estimated);
  }, [allocations, employeeId, viewDate, getProjectById]);

  // Calcular estado de presupuesto de un proyecto (por mes, no por semana)
  const getProjectBudgetStatus = useMemo(() => {
    return (projectId: string): ProjectBudgetStatus => {
      const project = projects.find(p => p.id === projectId);
      if (!project) {
        return {
          totalComputed: 0,
          totalPlanned: 0,
          budgetMax: 0,
          budgetMin: 0,
          percentage: 0,
          status: 'healthy',
          breakdown: []
        };
      }

      const monthAllocations = allocations.filter(a => 
        a.projectId === projectId && 
        isSameMonth(parseISO(a.weekStartDate), viewDate)
      );

      const breakdownMap: Record<string, { computed: number; planned: number }> = {};
      let totalComputed = 0;
      let totalPlanned = 0;

      monthAllocations.forEach(a => {
        const computed = a.status === 'completed' ? (a.hoursComputed || 0) : 0;
        const planned = a.status !== 'completed' ? (a.hoursAssigned || 0) : 0;
        totalComputed += computed;
        totalPlanned += planned;
        
        if (!breakdownMap[a.employeeId]) {
          breakdownMap[a.employeeId] = { computed: 0, planned: 0 };
        }
        breakdownMap[a.employeeId].computed += computed;
        breakdownMap[a.employeeId].planned += planned;
      });

      const breakdown = Object.entries(breakdownMap).map(([empId, data]) => {
        const emp = employees.find(e => e.id === empId);
        return { employeeId: empId, employeeName: emp?.name || 'Desconocido', ...data };
      }).sort((a, b) => (b.computed + b.planned) - (a.computed + a.planned));

      const budgetMax = project.budgetHours || 0;
      const budgetMin = project.minimumHours || 0;
      const percentage = budgetMax > 0 ? round2((totalComputed / budgetMax) * 100) : 0;
      const isExact100 = budgetMax > 0 && Math.abs(totalComputed - budgetMax) < 0.1;
      const isAtMinimum = budgetMin > 0 && totalComputed >= budgetMin && (budgetMax === 0 || totalComputed <= budgetMax);

      let status: 'healthy' | 'warning' | 'overload' | 'under' = 'healthy';
      if (totalComputed > budgetMax) {
        status = 'overload';
      } else if (isExact100 || isAtMinimum) {
        status = 'healthy';
      } else if (percentage >= 80) {
        status = 'warning';
      } else if (budgetMin > 0 && totalComputed < budgetMin && totalPlanned === 0) {
        status = 'under';
      }

      return { 
        totalComputed: round2(totalComputed), 
        totalPlanned: round2(totalPlanned), 
        budgetMax, 
        budgetMin, 
        percentage, 
        status, 
        breakdown 
      };
    };
  }, [projects, allocations, employees, viewDate]);

  // Filtrar y ordenar proyectos
  const getFilteredAndSortedProjects = (
    searchTerm: string,
    showOnlyMyProjects: boolean,
    sortOption: SortOption,
    activeWeekIndex: number
  ) => {
    let filtered = activeProjects;

    // Filtro de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term)
      );
    }

    // Filtro: solo proyectos donde tengo tareas
    if (showOnlyMyProjects && weeks[activeWeekIndex]) {
      const weekKey = format(weeks[activeWeekIndex].weekStart, 'yyyy-MM-dd');
      const myProjectIds = new Set(
        allocations
          .filter(a => a.employeeId === employeeId && a.weekStartDate === weekKey)
          .map(a => a.projectId)
      );
      filtered = filtered.filter(p => myProjectIds.has(p.id));
    }

    // Ordenación
    return filtered.sort((a, b) => {
      switch (sortOption) {
        case 'budget_desc':
          return (b.budgetHours || 0) - (a.budgetHours || 0);
        case 'budget_asc':
          return (a.budgetHours || 0) - (b.budgetHours || 0);
        case 'my_hours_desc': {
          const weekKey = weeks[activeWeekIndex] ? format(weeks[activeWeekIndex].weekStart, 'yyyy-MM-dd') : '';
          const aHours = allocations
            .filter(al => al.projectId === a.id && al.employeeId === employeeId && al.weekStartDate === weekKey)
            .reduce((sum, al) => sum + al.hoursAssigned, 0);
          const bHours = allocations
            .filter(al => al.projectId === b.id && al.employeeId === employeeId && al.weekStartDate === weekKey)
            .reduce((sum, al) => sum + al.hoursAssigned, 0);
          return bHours - aHours;
        }
        case 'my_hours_asc': {
          const weekKey = weeks[activeWeekIndex] ? format(weeks[activeWeekIndex].weekStart, 'yyyy-MM-dd') : '';
          const aHours = allocations
            .filter(al => al.projectId === a.id && al.employeeId === employeeId && al.weekStartDate === weekKey)
            .reduce((sum, al) => sum + al.hoursAssigned, 0);
          const bHours = allocations
            .filter(al => al.projectId === b.id && al.employeeId === employeeId && al.weekStartDate === weekKey)
            .reduce((sum, al) => sum + al.hoursAssigned, 0);
          return aHours - bHours;
        }
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });
  };

  return {
    employee,
    weeks,
    currentWeekIndex,
    activeProjects,
    monthlyProjectSummary,
    getProjectBudgetStatus,
    getFilteredAndSortedProjects,
  };
}
