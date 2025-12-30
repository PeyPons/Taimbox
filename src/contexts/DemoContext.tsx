import React, { createContext, useContext, useMemo } from 'react';
import { Employee, Client, Project, Allocation, LoadStatus } from '@/types';
import { demoEmployees, demoClients, demoProjects, demoAllocations } from '@/data/demoData';
import { getMonthlyCapacity } from '@/utils/dateUtils';
import { isAllocationInEffectiveMonth } from '@/utils/dateUtils';
import { AppContext } from './AppContext';

interface DemoContextType {
  employees: Employee[];
  allocations: Allocation[];
  projects: Project[];
  clients: Client[];
  absences: any[];
  teamEvents: any[];
  weeklyFeedback: any[];
  getEmployeeMonthlyLoad: (employeeId: string, year: number, month: number) => {
    hours: number;
    capacity: number;
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
    breakdown: any[];
  };
  getEmployeeAllocationsForWeek: (employeeId: string, weekStart: string) => Allocation[];
  currentUser: Employee | null;
}

export const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const currentUser = demoEmployees[0]; // María como usuario demo

  const getEmployeeMonthlyLoad = (employeeId: string, year: number, month: number) => {
    const employee = demoEmployees.find(e => e.id === employeeId);
    if (!employee) return { hours: 0, capacity: 0, percentage: 0 };
    
    const monthStart = new Date(year, month, 1);
    const monthAllocations = demoAllocations.filter(a => {
      const allocDate = new Date(a.weekStartDate);
      return a.employeeId === employeeId && 
             allocDate.getFullYear() === year && 
             allocDate.getMonth() === month;
    });
    
    const hours = monthAllocations.reduce((sum, a) => sum + a.hoursAssigned, 0);
    const capacity = getMonthlyCapacity(year, month, employee.workSchedule);
    const percentage = capacity > 0 ? (hours / capacity) * 100 : 0;
    
    return { hours, capacity, percentage };
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
    
    let status: LoadStatus = 'empty';
    if (percentage === 0) status = 'empty';
    else if (percentage < 50) status = 'low';
    else if (percentage <= 100) status = percentage > 85 ? 'high' : 'optimal';
    else status = 'overload';
    
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
    getEmployeeMonthlyLoad,
    getEmployeeLoadForWeek,
    getEmployeeAllocationsForWeek,
    currentUser,
    // Métodos dummy para compatibilidad con AppContext
    isLoading: false,
    isAdmin: false,
    addEmployee: () => Promise.resolve(null),
    updateEmployee: () => Promise.resolve(null),
    deleteEmployee: () => Promise.resolve(null),
    toggleEmployeeActive: () => Promise.resolve(null),
    addClient: () => Promise.resolve(null),
    updateClient: () => Promise.resolve(null),
    deleteClient: () => Promise.resolve(null),
    addProject: () => Promise.resolve(null),
    updateProject: () => Promise.resolve(null),
    deleteProject: () => Promise.resolve(null),
    addAllocation: () => Promise.resolve(null),
    updateAllocation: () => Promise.resolve(null),
    deleteAllocation: () => Promise.resolve(null),
    addAbsence: () => Promise.resolve(null),
    deleteAbsence: () => Promise.resolve(null),
    addTeamEvent: () => Promise.resolve(null),
    updateTeamEvent: () => Promise.resolve(null),
    deleteTeamEvent: () => Promise.resolve(null),
    getProjectHoursForMonth: () => 0,
    getClientTotalHoursForMonth: () => 0,
    getProjectById: (id: string) => demoProjects.find(p => p.id === id),
    getClientById: (id: string) => demoClients.find(c => c.id === id),
    professionalGoals: [],
    addProfessionalGoal: () => Promise.resolve(null),
    updateProfessionalGoal: () => Promise.resolve(null),
    deleteProfessionalGoal: () => Promise.resolve(null),
    getEmployeeGoals: () => [],
    loadDataForMonth: () => Promise.resolve(),
    addWeeklyFeedback: () => Promise.resolve(null),
  }), []);

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
