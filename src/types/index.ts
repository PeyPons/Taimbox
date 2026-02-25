// ============================================
// View Mode Types
// ============================================

export type ViewMode = 'weekly' | 'daily';

/** Departamento/área para filtrado de vistas (ej: Marketing, Desarrollo). Definido en Configuración de Agencia. */
export interface DepartmentDefinition {
  id: string;
  name: string;
  color: string;
}

export interface DepartmentConfig {
  id: string;
  agencyId: string;
  departmentName: string;
  defaultView: ViewMode;
  isViewStrict: boolean;
  closingDay?: number;    // 0=Monday, 6=Sunday
  closingHour?: number;   // 0-23
  createdAt?: string;
  updatedAt?: string;
}

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
  timeTracker?: boolean;
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

// Project aliasing rule for renaming/grouping projects (e.g., Kit Digital)
export interface ProjectAliasingRule {
  id: string;
  name: string;                    // Internal name (e.g., "kit-digital")
  displayPrefix: string;           // Prefix to show (e.g., "KD:")
  enabled: boolean;
  matchPatterns: string[];         // Detection patterns: ["(KD)", "[KD]", "kit digital"]
  groupAsVirtualClient: boolean;   // Create virtual client grouping these projects
  virtualClientName?: string;      // Virtual client name (e.g., "Kit Digital")
  virtualClientColor?: string;     // Virtual client color
}

export interface RolePermissions {
  name: string;
  is_system_role?: boolean;  // true = protected role (e.g., Administrador)
  permissions: import('./permissions').UserPermissions;
}

export interface AgencySettings {
  modules?: AgencyModules;
  roles?: RolePermissions[];
  /** Lista de departamentos/áreas (nombre + color). Legacy: puede ser string[]; normalizar a DepartmentDefinition[] en la UI. */
  departments?: (string | DepartmentDefinition)[];
  branding?: AgencyBranding;
  features?: Record<string, boolean>;
  projectFilters?: CustomProjectFilter[];  // Custom project filters
  projectAliasingRules?: ProjectAliasingRule[];  // Project aliasing/renaming rules
  integrations?: {
    metaAccessToken?: string;
    metaAdAccountIds?: string;
    googleAdsCustomerId?: string;
    googleAdsDevToken?: string;
    googleRefreshToken?: string;
    googleClientId?: string;
    googleClientSecret?: string;
  };
  enabledIntegrations?: {
    weekly_feedback?: boolean;       // Sistema de cierre semanal (Weekly Reports)
    crm_export?: boolean;            // Exportación de tareas al CRM
    crm_user_id?: boolean;           // Campo ID Usuario CRM en perfiles
    // Futuras integraciones: google_ads, meta_ads, etc.
  };
  // Weekly system configuration
  weeklyCloseDay?: number; // Days from week start for weekly close (0-6, default 4 = Friday)
  // Excluir tareas de estos proyectos o clientes del cálculo de precisión de planificación (índice de fiabilidad)
  planningPrecisionExclusions?: {
    projectIds?: string[];
    clientIds?: string[];
  };
  /** Cronómetro de tareas: máximo de horas por sesión antes de auto-pausa (1���24, por defecto 12). */
  timeTrackerMaxHours?: number;
  /** Objetivo de Precio Hora Efectivo (?/h) en Salud financiera. Si no se define, se usa 75 ?/h o la media de coste por hora si es superior. */
  ehrTarget?: number;
}

export type AgencyStatus = 'active' | 'suspended';

export interface Agency {
  id: string;
  name: string;
  slug: string;
  settings: AgencySettings;
  setupCompleted?: boolean;
  status?: AgencyStatus;
  createdAt?: string;
  updatedAt?: string;
  google_ads_refresh_token?: string;
  google_ads_customer_id?: string;
}

// ============================================
// Employee Types
// ============================================

export type EmployeeRole = string;

export interface Employee {
  id: string;
  agencyId: string;  // FK a agencies - agencia a la que pertenece
  name: string;
  email?: string;
  role: EmployeeRole;
  avatarUrl?: string;
  defaultWeeklyCapacity: number;
  workSchedule: WorkSchedule;
  department?: string;         // Legacy field, use departmentId
  departmentId?: string;       // FK to department_config
  /** Coste mensual (n?mina) en ?. Se reparte a proyectos en proporci?n horas en proyecto / total horas del empleado. Persistido en API como hourly_rate. */
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
  preferredView?: ViewMode | null;  // Vista preferida del usuario (solo usada si el departamento no es estricto)
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
  /** ID del departamento responsable (para filtrado en reportes por área). */
  responsibleDepartmentId?: string | null;
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
  status: 'planned' | 'completed' | 'active' | 'in_progress';
  description?: string;
  taskName?: string;
  dependencyId?: string | null;
  transferredFromAllocationId?: string; // ID de la tarea original de la que proviene esta transferencia
  distributionSourceAllocationId?: string; // ID de la tarea transferida de la que proviene esta distribución
  parentAllocationId?: string | null; // ID de la tarea padre cuando se hace rollover
  originalTransferredTaskName?: string; // Nombre original de la tarea transferida (snapshot)
  transferSourceEmployeeId?: string; // ID del empleado origen de la transferencia
  userPriority?: number | null; // Prioridad personal del usuario (menor = más prioritario)
  isLocked?: boolean; // When true, only admins can edit
}

export interface TimeEntry {
  id: string;
  allocationId: string;
  employeeId: string;
  date: string;       // YYYY-MM-DD
  hours: number;      // 0-24
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NewTaskRow {
  id: string;
  projectId: string;
  taskName: string;
  hours: string;
  weekDate: string;
  description?: string;
  dependencyId?: string;
  employeeId?: string; // Opcional: para asignar tareas a otros empleados
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
  budgetOverride?: number; // Override del budget mensual para regularización (null = usar project.budgetHours)
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

export interface UserRoutine {
  id: string;
  employeeId: string;
  title: string;
  estimatedMinutes: number;
  projectId?: string;
  isActive: boolean;
}

// ============================================
// Transfer Types
// ============================================

export type TransferStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface TaskTransfer {
  id: string;
  allocationId: string;
  fromEmployeeId: string;
  toEmployeeId: string;
  status: TransferStatus;
  reason?: string;
  rejectionReason?: string;
  hours: number; // Mapped from hours_transferred for convenience
  hoursTransferred: number;
  requestedAt: string;
  respondedAt?: string;
  agencyId: string;

  // Acceptance tracking
  acceptanceMode?: 'keep' | 'move' | 'distribute' | 'rollover';
  resultAllocationIds?: string[];

  // Joined fields (from queries)
  fromEmployeeName?: string;
  toEmployeeName?: string;
  taskName?: string;
  projectId?: string;
  projectName?: string; // We might need to fetch this or derive it
  originalWeek?: string;
}
