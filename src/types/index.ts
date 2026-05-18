// ============================================
// View Mode Types
// ============================================

export type ViewMode = 'weekly' | 'daily';

/** Departamento/?rea para filtrado de vistas (ej: Marketing, Desarrollo). Definido en Configuraci?n de Agencia. */
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
  name: string;           // Internal name: e.g. channel or department slug
  displayName: string;    // UI display label
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

/** Reparto de un gasto común a toda la agencia (por horas del mes). */
export type CommonExpenseAllocationGlobal = { type: 'global' };

/** Reparto solo entre empleados de un departamento (por horas). */
export type CommonExpenseAllocationDepartment = { type: 'department'; departmentId: string };

/** Importe partido por porcentajes entre departamentos; dentro de cada uno, por horas. */
export type CommonExpenseAllocationSplitPercent = {
  type: 'split_percent';
  parts: { departmentId: string; percent: number }[];
};

export type CommonExpenseAllocation =
  | CommonExpenseAllocationGlobal
  | CommonExpenseAllocationDepartment
  | CommonExpenseAllocationSplitPercent;

/** Línea de gasto común mensual (la clave `yyyy-MM` vive en `AgencySettings.commonExpensesByMonth`). */
export interface CommonExpenseEntry {
  id: string;
  label: string;
  /** Importe mensual en €; debe ser >= 0. */
  amount: number;
  allocation: CommonExpenseAllocation;
  notes?: string;
  /**
   * Solo en `AgencySettings.commonExpensesRecurring`: primer mes (yyyy-MM, inclusive) en que aplica el gasto fijo mensual.
   * No usar en entradas de `commonExpensesByMonth` (se ignoran al persistir si aparecieran).
   */
  recurringFromMonth?: string;
  /**
   * Solo recurrentes: último mes (yyyy-MM, inclusive). Sin definir = sigue aplicando en meses posteriores.
   */
  recurringUntilMonth?: string;
  /**
   * Cómo se reparte el importe dentro del scope resuelto por `allocation`.
   *  - `byHours` (default, compat): proporcional a las horas del mes; excluye empleados con 0 h.
   *  - `byHeadcount`: a partes iguales entre todos los empleados del scope (incluye quien no usa Taimbox).
   *  - `byPayroll`: proporcional a la nómina mensual (`Employee.monthlyCost`) dentro del scope.
   * Omitido = `byHours` para no romper datos existentes.
   */
  distribution?: 'byHours' | 'byHeadcount' | 'byPayroll';
  /**
   * Extensible sin romper consumidores (p. ej. futuro reparto por `Project.responsibleDepartmentId`).
   * Valores opacos para el MVP.
   */
  scope?: Record<string, unknown>;
}

export interface AgencySettings {
  /** Usuario Auth propietario de la agencia (facturación / transferencia). No confundir con user_agencies.is_primary (agencia por defecto por usuario). */
  ownerUserId?: string;
  modules?: AgencyModules;
  roles?: RolePermissions[];
  /** Lista de departamentos/?reas (nombre + color). Legacy: puede ser string[]; normalizar a DepartmentDefinition[] en la UI. */
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
    weekly_feedback?: boolean;       // Cierre semanal: bloquea edición directa de semanas pasadas en planificador; cambios vía WeeklyReportDialog
    crm_export?: boolean;            // CSV export + project external_id (CRM project ID) in project forms
    crm_user_id?: boolean;           // Employee profile field for external / CRM user id
    anonymize_ads_for_video?: boolean; // Modo demostración: oculta nombres en Ads
  };
  // Weekly system configuration
  weeklyCloseDay?: number; // Days from week start for weekly close (0-6, default 4 = Friday)
  // Excluir tareas de estos proyectos o clientes del c?lculo de precisi?n de planificaci?n (?ndice de fiabilidad)
  planningPrecisionExclusions?: {
    projectIds?: string[];
    clientIds?: string[];
  };
  /** Cron?metro de tareas: m?ximo de horas por sesi?n antes de auto-pausa (1���24, por defecto 12). */
  timeTrackerMaxHours?: number;
  /** Objetivo de Precio Hora Efectivo (?/h) en Salud financiera. Si no se define, se usa 75 ?/h o la media de coste por hora si es superior. */
  ehrTarget?: number;
  /** Palabras clave en el nombre del proyecto que excluyen de la alerta "Poco avance" en el Radar operativo (fin de mes). Ej.: off-page, linkbuilding. */
  radarLowProgressExcludeKeywords?: string[];
  /** Prioriza usar horas reales en lugar de horas computadas para el cálculo de facturación, progreso y rentabilidad */
  hoursTrackingPreference?: 'computed' | 'actual';
  /**
   * Correo cuando una tarea bloqueante se marca completada y hay tareas dependientes.
   * Por defecto activo (`undefined` o `true`). Solo `false` desactiva el aviso.
   */
  dependencyUnblockEmailsEnabled?: boolean;
  /**
   * Gastos comunes por mes (`yyyy-MM`). Histórico: cada mes puede tener líneas puntuales;
   * editar un mes no altera otros.
   */
  commonExpensesByMonth?: Record<string, CommonExpenseEntry[]>;
  /**
   * Gastos fijos mensuales que aplican desde `recurringFromMonth` (inclusive) y hasta `recurringUntilMonth` si está definido.
   * Para un mes M se combinan con `commonExpensesByMonth[M]` (primero recurrentes aplicables, luego líneas del mes).
   */
  commonExpensesRecurring?: CommonExpenseEntry[];
}

export type AgencyStatus = 'active' | 'suspended';

/** Plan de suscripci?n (Stripe) */
export type PlanId = 'starter' | 'pro' | 'business' | 'enterprise';

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
  /** Token OAuth Meta (long-lived); prioridad sobre settings.integrations.metaAccessToken */
  meta_ads_access_token?: string;
  /** Plan actual (Stripe) */
  planId?: PlanId;
  /** Estado de la suscripci?n en Stripe */
  subscriptionStatus?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  /** Fin del trial (14 d?as para Business) */
  trialEndsAt?: string;
  /** Fin del periodo de facturaci?n actual (pr?xima facturaci?n) */
  subscriptionPeriodEndsAt?: string;
  /** True si el usuario cancel? en Stripe "al final del periodo"; el plan sigue activo hasta subscriptionPeriodEndsAt */
  subscriptionCancelAtPeriodEnd?: boolean;
  /** Fecha en que la agencia uso el trial. Si existe, no se ofrece trial de nuevo */
  trialUsedAt?: string;
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
  /** Coste mensual (nómina) en €. Se reparte a proyectos en proporción horas en proyecto / total horas del empleado. Persistido en API como `hourly_rate`. */
  monthlyCost?: number;
  /**
   * @deprecated Usar `monthlyCost`. Alias histórico; en carga suele igualarse a `monthlyCost` por compatibilidad.
   */
  hourlyRate?: number;
  isActive: boolean;
  user_id?: string;
  first_name?: string;
  last_name?: string;
  crmUserId?: number;  // ID del usuario en el CRM
  welcomeTourCompleted?: boolean;  // Si el usuario complet? el tour de bienvenida
  deadlinesTourCompleted?: boolean;  // Si el usuario complet? el tour de deadlines
  plannerTourCompleted?: boolean;  // Si el usuario complet? el tour del planificador
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
  /** Valores predefinidos habituales: ver `PROJECT_TYPE_PRESET_VALUES` en `src/config/projectTypePresets.ts`. */
  projectType?: string;
  /**
   * Solo entregables: importe total € del contrato. Si es null/undefined, `monthlyFee` se usa como total al prorratear por mes.
   */
  deliverableContractFee?: number | null;
  /** Inicio de fase (YYYY-MM-DD), inclusivo. Con `deliverableDueDate` define el prorrateo de ingreso en rentabilidad. */
  deliverableStartDate?: string | null;
  /** Fin previsto (YYYY-MM-DD), inclusivo. */
  deliverableDueDate?: string | null;
  isHidden?: boolean;     // Si el proyecto est? oculto
  /** ID del departamento responsable (para filtrado en reportes por ?rea). */
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
  distributionSourceAllocationId?: string; // ID de la tarea transferida de la que proviene esta distribuci?n
  parentAllocationId?: string | null; // ID de la tarea padre cuando se hace rollover
  originalTransferredTaskName?: string; // Nombre original de la tarea transferida (snapshot)
  transferSourceEmployeeId?: string; // ID del empleado origen de la transferencia
  userPriority?: number | null; // Prioridad personal del usuario (menor = m?s prioritario)
  isLocked?: boolean; // When true, only admins can edit
  /** Fecha (YYYY-MM-DD) en que el empleado marca la tarea en foco; null = backlog. Modelo Pull / vista diaria. */
  focusDate?: string | null;
}

export type AllocationNoteSource = 'user' | 'legacy_description' | 'system_copy';

export interface AllocationNote {
  id: string;
  allocationId: string;
  agencyId: string;
  authorEmployeeId?: string | null;
  body: string;
  source: AllocationNoteSource;
  createdAt: string;
  deletedAt?: string | null;
  authorName?: string;
  authorAvatarUrl?: string | null;
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
  /** Nota inicial creada tras insertar la allocation (no se persiste en allocations.description). */
  initialNote?: string;
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
  isHidden?: boolean; // Si el proyecto est? oculto este mes
  budgetOverride?: number; // Override del budget mensual para regularizaci?n (null = usar project.budgetHours)
}

export interface GlobalAssignment {
  id: string;
  month: string; // Formato: 'YYYY-MM'
  name: string; // Ej: "Deadline afecta a todos", "Creaci?n timeboxing"
  hours: number;
  affectsAll: boolean; // Si afecta a todos los empleados
  affectedEmployeeIds?: string[]; // Si no afecta a todos, lista de IDs
  employeeId?: string; // ID del empleado que cre? la asignaci?n
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
