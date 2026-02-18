import { Navigate, useLocation } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { useMemo, useRef, useEffect, useState } from 'react';

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

  // Determinar si todavía estamos en proceso de carga
  const isStillLoading = useMemo(() => {
    if (!isAuthInitialized) return true;
    if (isAppLoading) return true;
    // Si puede ser platform admin sin empleado, esperar a saberlo antes de redirigir
    if (session && !currentUser && isPlatformAdminLoading) return true;
    // Si hay sesión pero aún esperamos vinculación (y no es platform admin)
    if (session && employees.length > 0 && !currentUser && !linkWaitComplete && !isPlatformAdmin) return true;
    return false;
  }, [isAuthInitialized, isAppLoading, session, employees.length, currentUser, linkWaitComplete, isPlatformAdmin, isPlatformAdminLoading]);

  // Mientras carga, mostrar spinner
  if (isStillLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="h-8 w-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin opacity-60" />
      </div>
    );
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
