import React, { createContext, useContext, useMemo } from 'react';
import { Employee, Client, Project, Allocation, LoadStatus, Deadline, Absence, TeamEvent, WeeklyFeedback } from '@/types';
import { demoEmployees, demoClients, demoProjects, demoAllocations, demoDeadlines } from '@/data/demoData';
import { getMonthlyCapacity } from '@/utils/dateUtils';
import { isAllocationInEffectiveMonth } from '@/utils/dateUtils';
import { AppContext } from './AppContext';

interface DemoContextType {
  employees: Employee[];
  allocations: Allocation[];
  projects: Project[];
  clients: Client[];
  absences: Absence[];
  teamEvents: TeamEvent[];
  weeklyFeedback: WeeklyFeedback[];
  deadlines: Deadline[];
  getEmployeeMonthlyLoad: (employeeId: string, year: number, month: number) => {
    hours: number;
    capacity: number;
    status: LoadStatus;
    percentage: number;
  };
  getEmployeeLoadForWeek: (
    employeeId: string,
    weekStart: string,
    effectiveStart?: Date,
    effectiveEnd?: Date,
    viewMonth?: Date
  ) => {
    hours: number;
    capacity: number;
    status: LoadStatus;
    percentage: number;
    baseCapacity: number;
    breakdown: { reason: string; hours: number; type: 'absence' | 'event' }[];
  };
  getEmployeeAllocationsForWeek: (employeeId: string, weekStart: string) => Allocation[];
  currentUser: Employee | null;
}

export const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const currentUser = demoEmployees[0]; // María como usuario demo

  const getEmployeeMonthlyLoad = (employeeId: string, year: number, month: number) => {
    const employee = demoEmployees.find(e => e.id === employeeId);
    if (!employee) return { hours: 0, capacity: 0, status: 'empty' as LoadStatus, percentage: 0 };

    const monthStart = new Date(year, month, 1);
    const monthAllocations = demoAllocations.filter(a => {
      const allocDate = new Date(a.weekStartDate);
      return a.employeeId === employeeId &&
        allocDate.getFullYear() === year &&
        allocDate.getMonth() === month;
    });

    const hours = Math.round((monthAllocations.reduce((sum, a) => sum + a.hoursAssigned, 0) + Number.EPSILON) * 100) / 100;
    const capacity = getMonthlyCapacity(year, month, employee.workSchedule);
    const percentage = capacity > 0 ? (hours / capacity) * 100 : 0;
    const hoursRemaining = capacity - hours;

    let status: LoadStatus = 'empty';
    if (hours === 0) status = 'empty';
    else if (capacity === 0 && hours > 0) status = 'overload';
    else if (hours > capacity) status = 'overload';
    else if (hoursRemaining >= 2 && hoursRemaining <= 5) status = 'healthy';
    else status = 'warning';

    return { hours, capacity, status, percentage };
  };

  const getEmployeeLoadForWeek = (
    employeeId: string,
    weekStart: string,
    effectiveStart?: Date,
    effectiveEnd?: Date,
    viewMonth?: Date
  ) => {
    const employee = demoEmployees.find(e => e.id === employeeId);
    if (!employee) {
      return {
        hours: 0,
        capacity: 0,
        baseCapacity: 0,
        status: 'empty' as LoadStatus,
        percentage: 0,
        breakdown: []
      };
    }

    let weekAllocations = demoAllocations.filter(a =>
      a.employeeId === employeeId && a.weekStartDate === weekStart
    );

    if (viewMonth) {
      weekAllocations = weekAllocations.filter(a =>
        isAllocationInEffectiveMonth(a.weekStartDate, viewMonth)
      );
    }

    const hours = weekAllocations.reduce((sum, a) => sum + a.hoursAssigned, 0);
    const capacity = employee.defaultWeeklyCapacity;
    const percentage = capacity > 0 ? (hours / capacity) * 100 : 0;
    const hoursRemaining = capacity - hours;

    let status: LoadStatus = 'empty';
    if (hours === 0) status = 'empty';
    else if (hours > capacity) status = 'overload'; // Rojo: se pasa del límite
    else if (hoursRemaining >= 2 && hoursRemaining <= 5) status = 'healthy'; // Verde: tiene entre 2-5 horas libres
    else status = 'warning'; // Amarillo: cerca del límite (menos de 2h libres o más de 5h libres)

    return {
      hours,
      capacity,
      status,
      percentage,
      baseCapacity: capacity,
      breakdown: []
    };
  };

  const getEmployeeAllocationsForWeek = (employeeId: string, weekStart: string) => {
    return demoAllocations.filter(a =>
      a.employeeId === employeeId && a.weekStartDate === weekStart
    );
  };

  const value = useMemo(() => ({
    employees: demoEmployees,
    allocations: demoAllocations,
    projects: demoProjects,
    clients: demoClients,
    absences: [],
    teamEvents: [],
    weeklyFeedback: [],
    deadlines: demoDeadlines,
    getEmployeeMonthlyLoad,
    getEmployeeLoadForWeek,
    getEmployeeAllocationsForWeek,
    currentUser,
    // Métodos dummy para compatibilidad con AppContext
    isLoading: false,
    isSecondaryLoading: false,
    isAdmin: false,
    addEmployee: () => Promise.resolve(),
    updateEmployee: () => Promise.resolve(),
    deleteEmployee: () => Promise.resolve(),
    toggleEmployeeActive: () => Promise.resolve(),
    addClient: () => { },
    updateClient: () => { },
    deleteClient: () => { },
    addProject: () => { },
    updateProject: () => { },
    deleteProject: () => { },
    addAllocation: () => Promise.resolve(null),
    updateAllocation: () => { },
    deleteAllocation: () => { },
    addAbsence: () => { },
    deleteAbsence: () => { },
    addTeamEvent: () => { },
    updateTeamEvent: () => { },
    deleteTeamEvent: () => { },
    getProjectHoursForMonth: () => ({ used: 0, budget: 0, available: 0, percentage: 0 }),
    getClientTotalHoursForMonth: () => ({ used: 0, budget: 0, percentage: 0 }),
    getProjectById: (id: string) => demoProjects.find(p => p.id === id),
    getClientById: (id: string) => demoClients.find(c => c.id === id),
    loadDataForMonth: () => Promise.resolve(true),
    ensureMonthLoaded: () => Promise.resolve(),
    addWeeklyFeedback: () => { },
    refreshData: () => Promise.resolve(),
    fetchArchivedProjects: () => Promise.resolve(),
    userRoutines: [],
    addRoutine: () => Promise.resolve(),
    deleteRoutine: () => Promise.resolve(),
    toggleRoutine: () => Promise.resolve(),
    // Transfers (Global State) para evitar crash en AllocationSheet
    pendingTransfers: [],
    outgoingTransfers: [],
    fetchTransfers: () => Promise.resolve(),
  }), [currentUser]);

  // Inyectar DemoContext como AppContext temporalmente para que los componentes funcionen
  // Usar 'as any' para permitir que DemoContext funcione como AppContext
  const appContextValue = value as any;

  return (
    <DemoContext.Provider value={value}>
      <AppContext.Provider value={appContextValue}>
        {children}
      </AppContext.Provider>
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within DemoProvider');
  }
  return context;
}
