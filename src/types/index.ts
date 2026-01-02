export interface WorkSchedule {
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}

import { UserPermissions } from './permissions';

// ============================================
// Agency Types
// ============================================

export interface AgencyModules {
  seo?: boolean;
  ppc?: boolean;
  weeklyFeedback?: boolean;
  professionalGoals?: boolean;
  deadlines?: boolean;
}

export interface AgencyBranding {
  primaryColor?: string;
  logo?: string;
}

// Custom project filter configuration
export interface CustomProjectFilter {
  id: string;
  name: string;           // Internal name: "SEO", "PPC", etc.
  displayName: string;    // UI display: "Proyectos SEO"
  enabled: boolean;       // If filter is active for this agency
  includePatterns: string[];  // Keywords to INCLUDE (OR logic)
  excludePatterns: string[];  // Keywords to EXCLUDE (AND logic)
  description?: string;   // Explanation of what the filter does
}

export interface AgencySettings {
  modules?: AgencyModules;
  roles?: string[];
  branding?: AgencyBranding;
  features?: Record<string, boolean>;
  projectFilters?: CustomProjectFilter[];  // Custom project filters
}

export interface Agency {
  id: string;
  name: string;
  slug: string;
  settings: AgencySettings;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// Employee Types
// ============================================

export type EmployeeRole = 'Responsable' | 'Coordinador' | 'SEO' | 'PPC';

export interface Employee {
  id: string;
  agencyId: string;  // FK a agencies - agencia a la que pertenece
  name: string;
  email?: string;
  role: EmployeeRole;
  avatarUrl?: string;
  defaultWeeklyCapacity: number;
  workSchedule: WorkSchedule;
  department?: string;
  hourlyRate?: number;
  isActive: boolean;
  user_id?: string;
  first_name?: string;
  last_name?: string;
  crmUserId?: number;  // ID del usuario en el CRM
  welcomeTourCompleted?: boolean;  // Si el usuario completó el tour de bienvenida
  deadlinesTourCompleted?: boolean;  // Si el usuario completó el tour de deadlines
  plannerTourCompleted?: boolean;  // Si el usuario completó el tour del planificador
  permissions?: UserPermissions;  // Permisos de acceso a diferentes secciones
}

export interface TeamEvent {
  id: string;
  name: string;
  date: string;
  hoursReduction: number;
  affectedEmployeeIds: string[] | 'all';
  description?: string;
}

export interface Client {
  id: string;
  agencyId: string;  // FK a agencies - agencia a la que pertenece
  name: string;
  color: string;
}

export interface Project {
  id: string;
  agencyId: string;  // FK a agencies - agencia a la que pertenece
  clientId: string;
  name: string;
  status: 'active' | 'archived' | 'completed';
  budgetHours: number;
  minimumHours?: number;
  monthlyFee?: number;
  lastMeetingDate?: string;
  okrs?: OKR[];
  deliverables_log?: Record<string, string[]>;
  externalId?: number;    // ID del proyecto en el CRM
  projectType?: string;   // 'PPC' | 'Entregable' | 'Mensual'
  isHidden?: boolean;     // Si el proyecto está oculto
}

export interface OKR {
  id: string;
  title: string;
  progress: number;
  keyResults?: string; // JSON string of KeyResultItem[]
}

export interface Allocation {
  id: string;
  employeeId: string;
  projectId: string;
  weekStartDate: string;
  hoursAssigned: number;
  hoursActual?: number;
  hoursComputed?: number;
  status: 'planned' | 'completed' | 'active';
  description?: string;
  taskName?: string;
  dependencyId?: string;
  transferredFromAllocationId?: string; // ID de la tarea original de la que proviene esta transferencia
  distributionSourceAllocationId?: string; // ID de la tarea transferida de la que proviene esta distribución
}

export type LoadStatus = 'empty' | 'healthy' | 'warning' | 'overload';

export interface WeekData {
  weekStart: Date;
  weekEnd: Date;
  weekLabel: string;
  effectiveStart?: Date;
  effectiveEnd?: Date;
}

export interface Absence {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  type: 'vacation' | 'sick_leave' | 'personal' | 'other';
  description?: string;
  hours?: number;
}

export interface ProfessionalGoal {
  id: string;
  employeeId: string;
  title: string;
  description?: string;
  keyResults?: string;
  actions?: string;
  trainingUrl?: string;
  startDate?: string;
  dueDate?: string;
  progress: number;
}

export interface Deadline {
  id: string;
  projectId: string;
  month: string; // Formato: 'YYYY-MM' (ej: '2024-03')
  notes?: string;
  employeeHours: Record<string, number>; // employeeId -> hours
  isHidden?: boolean; // Si el proyecto está oculto este mes
}

export interface GlobalAssignment {
  id: string;
  month: string; // Formato: 'YYYY-MM'
  name: string; // Ej: "Deadline afecta a todos", "Creación timeboxing"
  hours: number;
  affectsAll: boolean; // Si afecta a todos los empleados
  affectedEmployeeIds?: string[]; // Si no afecta a todos, lista de IDs
  employeeId?: string; // ID del empleado que creó la asignación
}

export interface WeeklyFeedback {
  id: string;
  employeeId: string;
  weekStartDate: string; // Formato: 'YYYY-MM-DD' (lunes de la semana)
  projectId?: string;
  allocationId?: string;
  reason?: 'technical_issue' | 'client_blocker' | 'bad_estimation' | 'personal_absence' | 'other';
  comments?: string;
  createdAt: string;
}
