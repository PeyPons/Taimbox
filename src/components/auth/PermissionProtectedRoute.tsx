import { Navigate, useLocation } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAgency } from '@/contexts/AgencyContext';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { useMemo, useRef, useEffect, useState } from 'react';
import { RouteContentLoader } from '@/components/layout/PageLoader';

interface PermissionProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

/**
 * Componente que protege rutas basándose en permisos del usuario
 * OPTIMIZADO: Mínima espera, solo cuando realmente es necesario
 */
export function PermissionProtectedRoute({ children, requiredPermission }: PermissionProtectedRouteProps) {
  const location = useLocation();
  const { canAccess } = usePermissions();
  const { currentUser, isLoading: isAppLoading, employees } = useApp();
  const { currentAgency } = useAgency();
  const { session, isInitialized: isAuthInitialized } = useAuth();
  const { isPlatformAdmin, isLoading: isPlatformAdminLoading } = usePlatformAdmin();
  
  // Ref para evitar logs duplicados
  const hasLoggedWarningRef = useRef(false);
  
  // Estado para espera mínima de vinculación (solo si es necesario)
  const [linkWaitComplete, setLinkWaitComplete] = useState(false);
  
  // Espera corta SOLO si hay sesión + employees pero no currentUser
  useEffect(() => {
    if (session && !isAppLoading && employees.length > 0 && !currentUser && !linkWaitComplete) {
      // Espera mínima de 100ms para dar tiempo a la vinculación
      const timeout = setTimeout(() => setLinkWaitComplete(true), 100);
      return () => clearTimeout(timeout);
    } else if (currentUser) {
      setLinkWaitComplete(true);
    }
  }, [session, isAppLoading, employees.length, currentUser, linkWaitComplete]);

  const isAgencySwitchPending = useMemo(() => {
    if (!session || !currentAgency || isAppLoading || isPlatformAdmin) return false;
    return employees.length === 0 && !currentUser;
  }, [session, currentAgency, isAppLoading, isPlatformAdmin, employees.length, currentUser]);

  // Determinar si todavía estamos en proceso de carga
  const isStillLoading = useMemo(() => {
    if (!isAuthInitialized) return true;
    if (isAppLoading) return true;
    if (isAgencySwitchPending) return true;
    // Si puede ser platform admin sin empleado, esperar a saberlo antes de redirigir
    if (session && !currentUser && isPlatformAdminLoading) return true;
    // Si hay sesión pero aún esperamos vinculación (y no es platform admin)
    if (session && employees.length > 0 && !currentUser && !linkWaitComplete && !isPlatformAdmin) return true;
    return false;
  }, [isAuthInitialized, isAppLoading, isAgencySwitchPending, session, employees.length, currentUser, linkWaitComplete, isPlatformAdmin, isPlatformAdminLoading]);

  // Mientras carga, spinner en el área de contenido (sidebar visible)
  if (isStillLoading) {
    return <RouteContentLoader />;
  }

  // Si no hay sesión, redirigir al login
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si hay sesión pero no se encontró el empleado vinculado (después de esperar)
  // Excepción: administrador de plataforma puede ver contenido de la agencia actual sin ser empleado
  if (!currentUser && !isPlatformAdmin) {
    if (!hasLoggedWarningRef.current) {
      hasLoggedWarningRef.current = true;
      console.warn('[PermissionProtectedRoute] Sesión activa pero sin empleado vinculado. Redirigiendo a /');
    }
    return <Navigate to="/dashboard" replace />;
  }

  // Verificar permisos
  const permissionToCheck = requiredPermission || location.pathname;
  const hasPermission = canAccess(permissionToCheck);

  if (!hasPermission) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
