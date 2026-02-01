import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAgency } from "@/contexts/AgencyContext";
import { useApp } from "@/contexts/AppContext";
import { ROUTE_PERMISSIONS } from "@/types/permissions";

export const ProtectedRoute = () => {
  const { session, loading, isInitialized } = useAuth();
  const { currentAgency, isLoading: isAgencyLoading } = useAgency();
  const { currentUser } = useApp();
  const location = useLocation();

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

  // Verificar permisos de ruta si el usuario está cargado
  if (currentUser?.permissions) {
    const pathname = location.pathname;

    // Buscar permiso requerido para esta ruta
    const matchingRoute = Object.keys(ROUTE_PERMISSIONS).find(route =>
      pathname === route || pathname.startsWith(route + '/')
    );

    if (matchingRoute) {
      const requiredPermission = ROUTE_PERMISSIONS[matchingRoute];
      const hasPermission = currentUser.permissions[requiredPermission];

      if (hasPermission === false) {
        // Redirigir al dashboard si no tiene permiso
        console.warn(`[ProtectedRoute] User lacks permission ${requiredPermission} for ${pathname}`);
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  // Si hay sesión y permisos OK, renderizar la ruta protegida
  return <Outlet />;
};
