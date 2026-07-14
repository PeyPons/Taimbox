import type { UserPermissions } from '@/types/permissions';
import { DEFAULT_PERMISSIONS, PERMISSION_LABELS } from '@/types/permissions';
import type { RolePermissions } from '@/types';

/** Permisos editables en Configuración → Equipo → Roles (solo los que la app usa hoy). */
export const AGENCY_ROLE_PERMISSION_GROUPS: {
  groupKey: string;
  labelKey: string;
  fallback: string;
  permissions: (keyof UserPermissions)[];
}[] = [
  {
    groupKey: 'management',
    labelKey: 'common.management',
    fallback: 'Gestión',
    permissions: [
      'can_access_planner',
      'can_access_projects',
      'can_access_clients',
      'can_access_team',
      'can_access_settings',
    ],
  },
  {
    groupKey: 'ppcAds',
    labelKey: 'common.ppcAds',
    fallback: 'PPC & Ads',
    permissions: ['can_access_google_ads', 'can_access_meta_ads'],
  },
  {
    groupKey: 'others',
    labelKey: 'common.others',
    fallback: 'Otros',
    permissions: [
      'can_access_operations_radar',
      'can_access_financial_health',
      'can_access_deadlines',
      'can_access_okrs',
      'can_access_team_capacity',
      'can_assign_tasks_to_others',
      'can_access_weekly_forecast',
      'can_access_activity_log',
      'can_access_review_agents',
    ],
  },
  {
    groupKey: 'configSupport',
    labelKey: 'common.configSupport',
    fallback: 'Configuración y soporte',
    permissions: ['can_access_agency_settings', 'can_access_api_keys', 'can_access_support'],
  },
];

export const ALL_EDITABLE_ROLE_PERMISSIONS = AGENCY_ROLE_PERMISSION_GROUPS.flatMap((g) => g.permissions);

export function isProtectedAdminRole(role: RolePermissions): boolean {
  if (role.is_system_role) return true;
  const n = role.name.trim().toLowerCase();
  return n === 'administrador' || n === 'admin' || n === 'administrator';
}

/** Opt-out: sin clave explícita = permitido (salvo roles restringidos al crear). */
export function isRolePermissionEnabled(
  role: RolePermissions,
  permission: keyof UserPermissions,
): boolean {
  if (isProtectedAdminRole(role)) return true;
  // Compat: roles guardados antes de existir el permiso heredan la visibilidad
  // efectiva del Weekly (misma regla que resolveUserPermissions en runtime).
  if (permission === 'can_access_activity_log' && role.permissions?.can_access_activity_log === undefined) {
    return role.permissions?.can_access_weekly_forecast !== false;
  }
  return role.permissions?.[permission] !== false;
}

/** Persiste booleanos explícitos para cada permiso editable (evita ambigüedad tras guardar). */
export function normalizeRoleForSave(role: RolePermissions): RolePermissions {
  if (isProtectedAdminRole(role)) {
    return {
      ...role,
      is_system_role: true,
      permissions: { ...DEFAULT_PERMISSIONS },
    };
  }

  const permissions = {} as UserPermissions;
  for (const key of ALL_EDITABLE_ROLE_PERMISSIONS) {
    permissions[key] = isRolePermissionEnabled(role, key);
  }

  return { ...role, permissions };
}

export function normalizeRolesForSave(roles: RolePermissions[]): RolePermissions[] {
  return roles.map(normalizeRoleForSave);
}

export { PERMISSION_LABELS };
