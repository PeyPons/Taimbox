/**
 * Catálogo de scopes de la API de integración (JWT claim `scopes` + columna `api_tokens.scopes`).
 * Debe mantenerse alineado con `public.api_default_scopes()` en migraciones SQL.
 */

export const API_TOKEN_SCOPE_CATALOG = [
  'employees',
  'clients',
  'projects',
  'allocations',
  'allocation_notes',
  'deadlines',
  'absences',
  'team_events',
  'global_assignments',
  'department_config',
  'client_settings',
  'weekly_feedback',
  'professional_goals',
  'user_routines',
  'project_editing_locks',
  'task_transfers',
] as const;

export type ApiTokenScope = (typeof API_TOKEN_SCOPE_CATALOG)[number];

export const API_TOKEN_SCOPE_LABELS: Record<ApiTokenScope, { es: string; en: string }> = {
  employees: { es: 'Empleados', en: 'Employees' },
  clients: { es: 'Clientes', en: 'Clients' },
  projects: { es: 'Proyectos', en: 'Projects' },
  allocations: { es: 'Asignaciones (tareas)', en: 'Allocations (tasks)' },
  allocation_notes: { es: 'Notas de tarea', en: 'Allocation notes' },
  deadlines: { es: 'Deadlines / entregables', en: 'Deadlines' },
  absences: { es: 'Ausencias', en: 'Absences' },
  team_events: { es: 'Eventos de equipo', en: 'Team events' },
  global_assignments: { es: 'Asignaciones globales', en: 'Global assignments' },
  department_config: { es: 'Config. departamentos', en: 'Department config' },
  client_settings: { es: 'Ajustes de cliente', en: 'Client settings' },
  weekly_feedback: { es: 'Feedback semanal', en: 'Weekly feedback' },
  professional_goals: { es: 'Objetivos', en: 'Goals' },
  user_routines: { es: 'Rutinas', en: 'Routines' },
  project_editing_locks: { es: 'Bloqueos de edición', en: 'Editing locks' },
  task_transfers: { es: 'Transferencias', en: 'Task transfers' },
};

/** Recursos fuera de la API de integración (denegados al issuer `timeboxing-api`). */
export const API_TOKEN_BLOCKED_RESOURCES = [
  'agencies',
  'api_tokens',
  'audit_logs',
  'blog_posts',
  'ad_accounts_config',
  'ads_sync_logs',
  'google_ads_campaigns',
  'google_ads_changes',
  'meta_ads_campaigns',
  'meta_sync_logs',
  'segmentation_rules',
  'notification_rules',
  'notification_deliveries',
  'platform_admins',
  'platform_audit_logs',
  'review_jobs',
  'review_job_chunks',
  'review_job_events',
  'review_job_inputs',
  'review_profiles',
  'review_skills',
  'review_skill_versions',
  'support_tickets',
  'support_ticket_replies',
  'form_rate_limit_events',
  'time_entries',
  'active_timers',
  'timer_sessions',
  'user_agencies',
  'allocations_duplicate',
] as const;

export function isApiTokenScope(value: string): value is ApiTokenScope {
  return (API_TOKEN_SCOPE_CATALOG as readonly string[]).includes(value);
}

export function normalizeApiTokenScopes(input: unknown): ApiTokenScope[] {
  if (!Array.isArray(input)) {
    return [...API_TOKEN_SCOPE_CATALOG];
  }
  const unique = new Set<ApiTokenScope>();
  for (const item of input) {
    if (typeof item === 'string' && isApiTokenScope(item)) {
      unique.add(item);
    }
  }
  if (unique.size === 0) {
    return [...API_TOKEN_SCOPE_CATALOG];
  }
  return API_TOKEN_SCOPE_CATALOG.filter((s) => unique.has(s));
}
