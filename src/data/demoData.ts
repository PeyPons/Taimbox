import { Employee, Client, Project, Allocation, Deadline } from '@/types';
import { startOfWeek, format, addDays, startOfMonth, endOfMonth } from 'date-fns';

// Generar semanas del mes actual
const currentDate = new Date();
const monthStart = startOfMonth(currentDate);
const monthEnd = endOfMonth(currentDate);

const weeks: string[] = [];
let currentWeek = startOfWeek(monthStart, { weekStartsOn: 1 });
while (currentWeek <= monthEnd) {
  weeks.push(format(currentWeek, 'yyyy-MM-dd'));
  currentWeek = addDays(currentWeek, 7);
}

// Empleados con diferentes escenarios
export const demoEmployees: Employee[] = [
  {
    id: 'demo-1',
    name: 'María González',
    first_name: 'María',
    role: 'SEO Specialist',
    avatarUrl: '',
    defaultWeeklyCapacity: 40,
    isActive: true,
    workSchedule: {
      monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8,
      saturday: 0, sunday: 0
    }
  },
  {
    id: 'demo-2',
    name: 'Carlos Ruiz',
    first_name: 'Carlos',
    role: 'Content Manager',
    avatarUrl: '',
    defaultWeeklyCapacity: 40,
    isActive: true,
    workSchedule: {
      monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8,
      saturday: 0, sunday: 0
    }
  },
  {
    id: 'demo-3',
    name: 'Ana Martínez',
    first_name: 'Ana',
    role: 'Technical SEO',
    avatarUrl: '',
    defaultWeeklyCapacity: 40,
    isActive: true,
    workSchedule: {
      monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8,
      saturday: 0, sunday: 0
    }
  },
  {
    id: 'demo-4',
    name: 'Luis Fernández',
    first_name: 'Luis',
    role: 'Link Builder',
    avatarUrl: '',
    defaultWeeklyCapacity: 40,
    isActive: true,
    workSchedule: {
      monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8,
      saturday: 0, sunday: 0
    }
  },
];

export const demoClients: Client[] = [
  { id: 'demo-c1', name: 'TechCorp', color: '#3b82f6' },
  { id: 'demo-c2', name: 'E-Commerce Pro', color: '#10b981' },
  { id: 'demo-c3', name: 'StartupHub', color: '#8b5cf6' },
  { id: 'demo-c4', name: 'LocalBiz', color: '#f59e0b' },
];

export const demoProjects: Project[] = [
  { id: 'demo-p1', clientId: 'demo-c1', name: 'SEO Técnico', status: 'active', budgetHours: 160, minimumHours: 0 },
  { id: 'demo-p2', clientId: 'demo-c1', name: 'Contenidos', status: 'active', budgetHours: 120, minimumHours: 0 },
  { id: 'demo-p3', clientId: 'demo-c2', name: 'Link Building', status: 'active', budgetHours: 80, minimumHours: 0 },
  { id: 'demo-p4', clientId: 'demo-c3', name: 'SEO Full', status: 'active', budgetHours: 200, minimumHours: 0 },
  { id: 'demo-p5', clientId: 'demo-c4', name: 'SEO Local', status: 'active', budgetHours: 60, minimumHours: 0 },
];

// Allocations con diferentes escenarios:
// - María: Carga normal (80-90%)
// - Carlos: Sobrecarga (110-120%)
// - Ana: Subcarga (50-60%)
// - Luis: Carga óptima (85-95%)

export const demoAllocations: Allocation[] = [
  // María - Carga normal (80-90%)
  { 
    id: 'demo-a1', 
    employeeId: 'demo-1', 
    projectId: 'demo-p1', 
    weekStartDate: weeks[0], 
    hoursAssigned: 15, 
    hoursActual: 14.5,
    hoursComputed: 15,
    status: 'completed', 
    taskName: 'Auditoría técnica inicial'
  },
  { 
    id: 'demo-a2', 
    employeeId: 'demo-1', 
    projectId: 'demo-p2', 
    weekStartDate: weeks[0], 
    hoursAssigned: 12, 
    hoursActual: 12,
    hoursComputed: 12,
    status: 'completed', 
    taskName: 'Creación de contenidos'
  },
  { 
    id: 'demo-a3', 
    employeeId: 'demo-1', 
    projectId: 'demo-p4', 
    weekStartDate: weeks[0], 
    hoursAssigned: 10, 
    status: 'planned', 
    taskName: 'Análisis de keywords'
  },
  { 
    id: 'demo-a4', 
    employeeId: 'demo-1', 
    projectId: 'demo-p1', 
    weekStartDate: weeks[1], 
    hoursAssigned: 20, 
    status: 'planned', 
    taskName: 'Implementación mejoras'
  },
  { 
    id: 'demo-a5', 
    employeeId: 'demo-1', 
    projectId: 'demo-p2', 
    weekStartDate: weeks[1], 
    hoursAssigned: 15, 
    status: 'planned', 
    taskName: 'Optimización contenidos'
  },

  // Carlos - Sobrecarga (110-120%)
  { 
    id: 'demo-a6', 
    employeeId: 'demo-2', 
    projectId: 'demo-p1', 
    weekStartDate: weeks[0], 
    hoursAssigned: 20, 
    hoursActual: 22,
    hoursComputed: 20,
    status: 'completed', 
    taskName: 'Gestión de contenidos'
  },
  { 
    id: 'demo-a7', 
    employeeId: 'demo-2', 
    projectId: 'demo-p3', 
    weekStartDate: weeks[0], 
    hoursAssigned: 15, 
    hoursActual: 16,
    hoursComputed: 15,
    status: 'completed', 
    taskName: 'Outreach activo'
  },
  { 
    id: 'demo-a8', 
    employeeId: 'demo-2', 
    projectId: 'demo-p4', 
    weekStartDate: weeks[0], 
    hoursAssigned: 12, 
    status: 'planned', 
    taskName: 'Estrategia de contenidos'
  },
  { 
    id: 'demo-a9', 
    employeeId: 'demo-2', 
    projectId: 'demo-p2', 
    weekStartDate: weeks[1], 
    hoursAssigned: 25, 
    status: 'planned', 
    taskName: 'Redacción masiva'
  },
  { 
    id: 'demo-a10', 
    employeeId: 'demo-2', 
    projectId: 'demo-p3', 
    weekStartDate: weeks[1], 
    hoursAssigned: 20, 
    status: 'planned', 
    taskName: 'Link building intensivo'
  },

  // Ana - Subcarga (50-60%)
  { 
    id: 'demo-a11', 
    employeeId: 'demo-3', 
    projectId: 'demo-p1', 
    weekStartDate: weeks[0], 
    hoursAssigned: 12, 
    hoursActual: 11.5,
    hoursComputed: 12,
    status: 'completed', 
    taskName: 'Auditoría técnica'
  },
  { 
    id: 'demo-a12', 
    employeeId: 'demo-3', 
    projectId: 'demo-p4', 
    weekStartDate: weeks[0], 
    hoursAssigned: 10, 
    status: 'planned', 
    taskName: 'Análisis técnico'
  },
  { 
    id: 'demo-a13', 
    employeeId: 'demo-3', 
    projectId: 'demo-p1', 
    weekStartDate: weeks[1], 
    hoursAssigned: 15, 
    status: 'planned', 
    taskName: 'Optimización técnica'
  },

  // Luis - Carga óptima (85-95%)
  { 
    id: 'demo-a14', 
    employeeId: 'demo-4', 
    projectId: 'demo-p3', 
    weekStartDate: weeks[0], 
    hoursAssigned: 18, 
    hoursActual: 17.5,
    hoursComputed: 18,
    status: 'completed', 
    taskName: 'Link building estratégico'
  },
  { 
    id: 'demo-a15', 
    employeeId: 'demo-4', 
    projectId: 'demo-p4', 
    weekStartDate: weeks[0], 
    hoursAssigned: 15, 
    hoursActual: 15,
    hoursComputed: 15,
    status: 'completed', 
    taskName: 'Outreach profesional'
  },
  { 
    id: 'demo-a16', 
    employeeId: 'demo-4', 
    projectId: 'demo-p5', 
    weekStartDate: weeks[0], 
    hoursAssigned: 5, 
    status: 'planned', 
    taskName: 'SEO local básico'
  },
  { 
    id: 'demo-a17', 
    employeeId: 'demo-4', 
    projectId: 'demo-p3', 
    weekStartDate: weeks[1], 
    hoursAssigned: 20, 
    status: 'planned', 
    taskName: 'Construcción de enlaces'
  },
  { 
    id: 'demo-a18', 
    employeeId: 'demo-4', 
    projectId: 'demo-p4', 
    weekStartDate: weeks[1], 
    hoursAssigned: 12, 
    status: 'planned', 
    taskName: 'Estrategia de outreach'
  },

  // Más allocations para precisión de planificación (con horas reales/computadas)
  { 
    id: 'demo-a19', 
    employeeId: 'demo-1', 
    projectId: 'demo-p1', 
    weekStartDate: weeks[2], 
    hoursAssigned: 18, 
    hoursActual: 19.5, // Más de lo planificado
    hoursComputed: 18,
    status: 'completed', 
    taskName: 'Optimización técnica avanzada'
  },
  { 
    id: 'demo-a20', 
    employeeId: 'demo-1', 
    projectId: 'demo-p2', 
    weekStartDate: weeks[2], 
    hoursAssigned: 14, 
    hoursActual: 12, // Menos de lo planificado
    hoursComputed: 12,
    status: 'completed', 
    taskName: 'Redacción de artículos'
  },
  { 
    id: 'demo-a21', 
    employeeId: 'demo-1', 
    projectId: 'demo-p4', 
    weekStartDate: weeks[2], 
    hoursAssigned: 10, 
    hoursActual: 10, // Exacto
    hoursComputed: 10,
    status: 'completed', 
    taskName: 'Análisis de competencia'
  },

  // Dependencias: María depende de Carlos (demo-a22 depende de demo-a6)
  { 
    id: 'demo-a22', 
    employeeId: 'demo-1', 
    projectId: 'demo-p1', 
    weekStartDate: weeks[0], 
    hoursAssigned: 8, 
    hoursActual: 8,
    hoursComputed: 8,
    status: 'completed', 
    taskName: 'Revisión de contenidos',
    dependencyId: 'demo-a6' // Depende de Carlos
  },
  // Carlos depende de María (demo-a23 depende de demo-a1)
  { 
    id: 'demo-a23', 
    employeeId: 'demo-2', 
    projectId: 'demo-p1', 
    weekStartDate: weeks[1], 
    hoursAssigned: 10, 
    status: 'planned', 
    taskName: 'Continuación de auditoría',
    dependencyId: 'demo-a1' // Depende de María
  },
  // Ana depende de Luis
  { 
    id: 'demo-a24', 
    employeeId: 'demo-3', 
    projectId: 'demo-p3', 
    weekStartDate: weeks[1], 
    hoursAssigned: 12, 
    status: 'planned', 
    taskName: 'Análisis de enlaces',
    dependencyId: 'demo-a14' // Depende de Luis
  },
];

// Deadlines para coherencia de planificación
const currentMonthStr = format(currentDate, 'yyyy-MM');
export const demoDeadlines: Deadline[] = [
  {
    id: 'demo-d1',
    projectId: 'demo-p1',
    month: currentMonthStr,
    notes: 'Deadline para SEO Técnico',
    employeeHours: {
      'demo-1': 50, // María: deadline 50h
      'demo-2': 30, // Carlos: deadline 30h
      'demo-3': 25, // Ana: deadline 25h
    }
  },
  {
    id: 'demo-d2',
    projectId: 'demo-p2',
    month: currentMonthStr,
    notes: 'Deadline para Contenidos',
    employeeHours: {
      'demo-1': 40, // María: deadline 40h
      'demo-2': 35, // Carlos: deadline 35h
    }
  },
  {
    id: 'demo-d3',
    projectId: 'demo-p4',
    month: currentMonthStr,
    notes: 'Deadline para SEO Full',
    employeeHours: {
      'demo-1': 30, // María: deadline 30h
      'demo-2': 20, // Carlos: deadline 20h
      'demo-4': 25, // Luis: deadline 25h
    }
  },
  // demo-p3 y demo-p5 NO tienen deadline (para mostrar coherencia sin deadline)
];
