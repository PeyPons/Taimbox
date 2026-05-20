import { UserPermissions } from '@/types/permissions';

interface RolePermissionsLike {
  name?: string;
  permissions?: UserPermissions;
}

export const RESTRICTED_PERMISSIONS: UserPermissions = {
  can_access_planner: false,
  can_access_projects: false,
  can_access_clients: false,
  can_access_team: false,
  can_access_team_capacity: false,
  can_access_reports: false,
  can_access_operations_radar: false,
  can_access_financial_health: false,
  can_access_google_ads: false,
  can_access_meta_ads: false,
  can_access_deadlines: true,
  can_access_okrs: false,
  can_access_weekly_forecast: false,
  can_access_settings: true,
  can_access_agency_settings: false,
  can_access_api_keys: false,
  can_access_support: true,
};

function normalizeRoleName(name: string | null | undefined): string {
  return (name ?? '').trim().toLowerCase();
}

function isRolePermissionsLike(value: unknown): value is RolePermissionsLike {
  return typeof value === 'object' && value !== null;
}

export function findRoleConfigByName(roles: unknown[], userRoleName: string): RolePermissionsLike | null {
  const normalizedUserRole = normalizeRoleName(userRoleName);
  if (!normalizedUserRole) return null;

  for (const role of roles) {
    if (typeof role === 'string') {
      if (normalizeRoleName(role) === normalizedUserRole) {
        return null;
      }
      continue;
    }

    if (!isRolePermissionsLike(role)) continue;
    if (normalizeRoleName(role.name) === normalizedUserRole) {
      return role;
    }
  }

  return null;
}

export function resolveUserPermissions(params: {
  currentUserRole?: string | null;
  agencyRoles?: unknown[];
}): UserPermissions {
  const { currentUserRole, agencyRoles = [] } = params;

  // Sin rol en empleado (null, vacío o solo espacios): mismo criterio que rol desconocido — acceso mínimo.
  // No usar defaultPermissions aquí: DEFAULT_PERMISSIONS habilita toda la app, incl. configuración de agencia.
  if (!normalizeRoleName(currentUserRole)) {
    return RESTRICTED_PERMISSIONS;
  }

  const roleConfig = findRoleConfigByName(agencyRoles, currentUserRole);
  if (roleConfig?.permissions) {
    const p = roleConfig.permissions;
    return {
      ...p,
      can_access_operations_radar: p.can_access_operations_radar ?? p.can_access_reports ?? false,
      can_access_financial_health: p.can_access_financial_health ?? p.can_access_reports ?? false,
    };
  }

  console.warn(
    `[usePermissions] No role configuration found for role "${currentUserRole}". User will have restricted access. Configure permissions in Agency Settings.`
  );
  return RESTRICTED_PERMISSIONS;
}

export function canAccessRoute(
  permissions: UserPermissions,
  route: string,
  routePermissions: Record<string, keyof UserPermissions>
): boolean {
  const permissionKey = routePermissions[route];
  if (!permissionKey) return true;
  return permissions[permissionKey] !== false;
}

export function hasPermissionFlag(permissions: UserPermissions, permission: keyof UserPermissions): boolean {
  return permissions[permission] !== false;
}
