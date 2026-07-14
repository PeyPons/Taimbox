/**
 * Definición de permisos disponibles en la aplicación
 */
export interface UserPermissions {
  can_access_planner?: boolean;
  can_access_projects?: boolean;
  can_access_clients?: boolean;
  can_access_team?: boolean;
  can_access_team_capacity?: boolean;
  /** Legacy en JSON antiguo: hereda a operaciones/rentabilidad si no están definidos. */
  can_access_reports?: boolean;
  can_access_operations_radar?: boolean;
  can_access_financial_health?: boolean;
  can_access_google_ads?: boolean;
  can_access_meta_ads?: boolean;
  can_access_deadlines?: boolean;
  can_access_okrs?: boolean;
  can_access_weekly_forecast?: boolean;
  can_access_activity_log?: boolean;
  can_access_settings?: boolean;
  can_access_agency_settings?: boolean;
  can_access_api_keys?: boolean;
  can_access_support?: boolean;
  can_assign_tasks_to_others?: boolean;
  can_access_review_agents?: boolean;
}

/**
 * Mapeo de rutas a permisos
 */
export const ROUTE_PERMISSIONS: Record<string, keyof UserPermissions> = {
  '/planner': 'can_access_planner',
  '/projects': 'can_access_projects',
  '/clients': 'can_access_clients',
  '/team': 'can_access_team',
  '/team-capacity': 'can_access_team_capacity',
  '/capacidad': 'can_access_team_capacity',
  '/reports': 'can_access_reports',
  '/operaciones': 'can_access_operations_radar',
  '/finanzas': 'can_access_financial_health',
  '/ads': 'can_access_google_ads',
  '/meta-ads': 'can_access_meta_ads',
  '/deadlines': 'can_access_deadlines',
  '/okrs': 'can_access_okrs',
  '/weekly-forecast': 'can_access_weekly_forecast',
  '/actividad': 'can_access_activity_log',
  '/settings': 'can_access_settings',
  '/agency': 'can_access_agency_settings',
  '/exportacion-informes': 'can_access_agency_settings',
  '/api-keys': 'can_access_api_keys',
  '/soporte': 'can_access_support',
  '/review-agents': 'can_access_review_agents',
};

/**
 * Permisos por defecto (todos habilitados)
 */
export const DEFAULT_PERMISSIONS: UserPermissions = {
  can_access_planner: true,
  can_access_projects: true,
  can_access_clients: true,
  can_access_team: true,
  can_access_team_capacity: true,
  can_access_reports: true,
  can_access_operations_radar: true,
  can_access_financial_health: true,
  can_access_google_ads: true,
  can_access_meta_ads: true,
  can_access_deadlines: true,
  can_access_okrs: true,
  can_access_weekly_forecast: true,
  can_access_activity_log: true,
  can_access_settings: true,
  can_access_agency_settings: true,
  can_access_api_keys: true,
  can_access_support: true,
  can_assign_tasks_to_others: true,
  can_access_review_agents: true,
};

/** Platform admin impersonando agencia sin perfil de empleado: vista operativa de soporte. */
export const SUPPORT_IMPERSONATION_PERMISSIONS: UserPermissions = {
  ...DEFAULT_PERMISSIONS,
  can_access_api_keys: false,
};

/**
 * Etiquetas amigables para los permisos
 */
export const PERMISSION_LABELS: Record<keyof UserPermissions, string> = {
  can_access_planner: 'Planificador',
  can_access_projects: 'Proyectos',
  can_access_clients: 'Clientes',
  can_access_team: 'Equipo',
  can_access_team_capacity: 'Capacidad del equipo',
  can_access_reports: 'Reportes clásicos',
  can_access_operations_radar: 'Seguimiento operativo',
  can_access_financial_health: 'Rentabilidad',
  can_access_google_ads: 'Google Ads',
  can_access_meta_ads: 'Meta Ads',
  can_access_deadlines: 'Deadlines',
  can_access_okrs: 'Objetivos (OKRs)',
  can_access_weekly_forecast: 'Forecast',
  can_access_activity_log: 'Registro de actividad',
  can_access_settings: 'Configuración',
  can_access_agency_settings: 'Configuración de Agencia',
  can_access_api_keys: 'API e integraciones',
  can_access_support: 'Contactar soporte',
  can_assign_tasks_to_others: 'Asignar tareas a otros',
  can_access_review_agents: 'Agentes de revisión (IA)',
};
