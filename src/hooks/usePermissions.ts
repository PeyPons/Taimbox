import { useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAgency } from '@/contexts/AgencyContext';
import { UserPermissions, ROUTE_PERMISSIONS } from '@/types/permissions';
import { canAccessRoute, hasPermissionFlag, resolveUserPermissions } from '@/utils/permissionsUtils';

/**
 * Hook para verificar permisos del usuario actual basados en su rol
 */
export function usePermissions() {
  const { currentUser } = useApp();
  const { currentAgency } = useAgency();

  const permissions = useMemo(() => {
    return resolveUserPermissions({
      currentUserRole: currentUser?.role,
      agencyRoles: currentAgency?.settings?.roles,
    });
  }, [currentUser, currentAgency]);

  /**
   * Verifica si el usuario tiene permiso para acceder a una ruta
   */
  const canAccess = (route: string): boolean => {
    return canAccessRoute(permissions, route, ROUTE_PERMISSIONS);
  };

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  const hasPermission = (permission: keyof UserPermissions): boolean => {
    return hasPermissionFlag(permissions, permission);
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

