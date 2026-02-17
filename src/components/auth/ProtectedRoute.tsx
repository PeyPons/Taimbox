import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAgency } from "@/contexts/AgencyContext";
import { usePermissions } from "@/hooks/usePermissions";
import { ROUTE_PERMISSIONS } from "@/types/permissions";

export const ProtectedRoute = () => {
  const { session, loading, isInitialized } = useAuth();
  const { currentAgency, isLoading: isAgencyLoading } = useAgency();
  const { canAccess } = usePermissions();
  const location = useLocation();
  const pathname = location.pathname;

  // Rutas que no dependen de agencia ni de permisos de app: solo exigen sesión
  const adminOrSuspended = pathname.startsWith("/admin") || pathname === "/suspended";
  if (adminOrSuspended) {
    if (!isInitialized || loading) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
          <div className="h-8 w-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin opacity-60" />
        </div>
      );
    }
    if (!session) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return <Outlet />;
  }

  // Mientras se inicializa la autenticación mostrar spinner
  // Para la agencia, solo mostrar spinner si NO tenemos datos todavía
  if (!isInitialized || loading || (isAgencyLoading && !currentAgency)) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="h-8 w-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin opacity-60" />
      </div>
    );
  }

  // Si no hay sesión, redirigir al login preservando la ruta original
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si la agencia no ha completado el setup y no estamos ya en /onboarding
  if (currentAgency && currentAgency.setupCompleted === false && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
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

  // Si hay sesión y permisos OK, renderizar la ruta protegida
  return <Outlet />;
};
