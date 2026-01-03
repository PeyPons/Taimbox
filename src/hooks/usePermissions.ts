import { useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAgency } from '@/contexts/AgencyContext';
import { UserPermissions, ROUTE_PERMISSIONS, DEFAULT_PERMISSIONS } from '@/types/permissions';

const RESTRICTED_PERMISSIONS: UserPermissions = {
  can_access_planner: false,
  can_access_projects: false,
  can_access_clients: false,
  can_access_team: false,
  can_access_team_capacity: false,
  can_access_reports: false,
  can_access_client_reports: false,
  can_access_google_ads: false,
  can_access_meta_ads: false,
  can_access_ads_reports: false,
  can_access_deadlines: true,
  can_access_okrs: false,
  can_access_weekly_forecast: false,
  can_access_weekly: true,
  can_access_settings: true,
  can_access_agency_settings: false,
};

/**
 * Hook para verificar permisos del usuario actual basados en su rol
 */
export function usePermissions() {
  const { currentUser } = useApp();
  const { currentAgency } = useAgency();

  const permissions = useMemo(() => {
    if (!currentUser) {
      return DEFAULT_PERMISSIONS;
    }

    // 1. Buscar el rol del usuario en la configuración de la agencia
    const agencyRoles = currentAgency?.settings?.roles || [];
    const userRoleName = currentUser.role || '';

    // Safety check: roles might be strings (legacy) or RoleConfig objects (new)
    // We treat agencyRoles as any[] here to avoid TS errors with mismatched runtime data
    const safeAgencyRoles = agencyRoles as any[];

    const roleConfig = safeAgencyRoles.find(
      (r) => {
        if (!r) return false;
        if (typeof r === 'string') return r.toLowerCase() === userRoleName.toLowerCase();
        return r.name && r.name.toLowerCase() === userRoleName.toLowerCase();
      }
    );

    // 2. Si encontramos configuración de rol, usar esos permisos
    if (roleConfig && typeof roleConfig !== 'string' && roleConfig.permissions) {
      return roleConfig.permissions;
    }

    // 3. Fallback: Si el rol contiene keywords de manager/admin, dar todos los permisos
    const MANAGER_KEYWORDS = ['manager', 'admin', 'director', 'ceo', 'founder', 'head', 'lead', 'responsable', 'coordinador'];
    const roleLower = userRoleName.toLowerCase();
    if (MANAGER_KEYWORDS.some(k => roleLower.includes(k))) {
      return DEFAULT_PERMISSIONS;
    }

    // 4. Default: Permisos restringidos para roles no configurados
    return RESTRICTED_PERMISSIONS;
  }, [currentUser, currentAgency]);

  /**
   * Verifica si el usuario tiene permiso para acceder a una ruta
   */
  const canAccess = (route: string): boolean => {
    const permissionKey = ROUTE_PERMISSIONS[route];
    if (!permissionKey) {
      return true;
    }
    return permissions[permissionKey] !== false;
  };

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  const hasPermission = (permission: keyof UserPermissions): boolean => {
    return permissions[permission] !== false;
  };

  /**
   * Obtiene todos los permisos del usuario
   */
  const getAllPermissions = (): UserPermissions => {
    return permissions;
  };

  return {
    permissions,
    canAccess,
    hasPermission,
    getAllPermissions,
  };
}

