import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAgency } from "@/contexts/AgencyContext";
import { useApp } from "@/contexts/AppContext";
import { usePermissions } from "@/hooks/usePermissions";
import { usePlatformAdmin } from "@/hooks/usePlatformAdmin";
import { ROUTE_PERMISSIONS } from "@/types/permissions";
import { ONBOARDING_WIZARD_ALLOWED_KEY } from "@/utils/onboardingDefaults";
import { resolveWeeklyEnabled } from "@/utils/agencyUtils";
import { PageLoader } from "@/components/layout/PageLoader";

export const ProtectedRoute = () => {
  const { session, loading, isInitialized } = useAuth();
  const { currentAgency, isLoading: isAgencyLoading } = useAgency();
  const { canAccess } = usePermissions();
  const { currentUser, isLoading: appLoading, isSecondaryLoading } = useApp();
  const { isPlatformAdmin, isLoading: platformAdminLoading } = usePlatformAdmin();
  const location = useLocation();
  const pathname = location.pathname;

  /** Datos de agencia + app listos (evita UI con plan/módulos por defecto y allocations vacías). */
  const isAppBootstrapPending =
    Boolean(session) &&
    (appLoading || isSecondaryLoading || (isAgencyLoading && !currentAgency) || !currentAgency);

  // Rutas que no dependen de agencia ni de permisos de app: solo exigen sesión
  const adminOrSuspended =
    pathname.startsWith("/admin") || pathname === "/suspended" || pathname === "/account-inactive";
  if (adminOrSuspended) {
    if (!isInitialized || loading) {
      return <PageLoader />;
    }
    if (!session) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return <Outlet />;
  }

  // Spinner hasta auth, agencia y carga completa de datos (fases 1+2 de fetchInitialAppData)
  if (!isInitialized || loading || isAppBootstrapPending) {
    return <PageLoader />;
  }

  // Si no hay sesión, redirigir al login preservando la ruta original
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Onboarding incompleto: primero /onboarding/choose; el wizard solo tras elegir «Configurar»
  if (currentAgency && currentAgency.setupCompleted === false) {
    const onChoose = pathname === '/onboarding/choose';
    const onWizard =
      pathname === '/onboarding' &&
      typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem(ONBOARDING_WIZARD_ALLOWED_KEY) === '1';
    if (!onChoose && !onWizard) {
      return <Navigate to="/onboarding/choose" replace />;
    }
  }

  // Si la agencia está suspendida, redirigir a /suspended (salvo /admin para platform_admin, ya manejado arriba)
  if (currentAgency?.status === 'suspended') {
    return <Navigate to="/suspended" replace />;
  }

  // Verificar permisos de ruta con la misma lógica que el resto de la app (rol + agency settings)
  const matchingRoute = Object.keys(ROUTE_PERMISSIONS).find(route =>
    pathname === route || pathname.startsWith(route + "/")
  );
  if (matchingRoute && !canAccess(matchingRoute)) {
    console.warn(`[ProtectedRoute] User lacks access for ${pathname} (route ${matchingRoute})`);
    return <Navigate to="/dashboard" replace />;
  }

  if (
    (pathname === '/weekly-forecast' || pathname.startsWith('/weekly-forecast/')) &&
    !resolveWeeklyEnabled(currentAgency?.settings)
  ) {
    const redirect = canAccess('/agency') ? '/agency?tab=modules' : '/dashboard';
    console.warn('[ProtectedRoute] Weekly module disabled for agency');
    return <Navigate to={redirect} replace />;
  }

  if (
    !platformAdminLoading &&
    !isPlatformAdmin &&
    !appLoading &&
    currentUser &&
    currentUser.isActive === false
  ) {
    return <Navigate to="/account-inactive" replace />;
  }

  // Si hay sesión y permisos OK, renderizar la ruta protegida
  return <Outlet />;
};
