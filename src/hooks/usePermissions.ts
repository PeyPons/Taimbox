import { useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAgency } from '@/contexts/AgencyContext';
import { UserPermissions, ROUTE_PERMISSIONS, SUPPORT_IMPERSONATION_PERMISSIONS } from '@/types/permissions';
import { canAccessRoute, hasPermissionFlag, resolveUserPermissions } from '@/utils/permissionsUtils';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';

/**
 * Hook para verificar permisos del usuario actual basados en su rol
 */
export function usePermissions() {
  const { currentUser } = useApp();
  const { currentAgency } = useAgency();
  const { isPlatformAdmin } = usePlatformAdmin();

  const permissions = useMemo(() => {
    // Vista de soporte: platform admin con agencia cargada pero sin perfil de empleado en ella.
    if (isPlatformAdmin && currentAgency && !currentUser) {
      return SUPPORT_IMPERSONATION_PERMISSIONS;
    }
    return resolveUserPermissions({
      currentUserRole: currentUser?.role,
      agencyRoles: currentAgency?.settings?.roles,
    });
  }, [currentUser, currentAgency, isPlatformAdmin]);

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

