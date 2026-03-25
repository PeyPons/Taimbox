import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatformAdmin } from "@/hooks/usePlatformAdmin";
import { toast } from "@/lib/notify";

/**
 * Guard para rutas del área admin. Requiere sesión y que el usuario sea platform_admin.
 * No depende de AgencyContext (usar fuera del árbol que exige agencia).
 */
export function PlatformAdminRoute() {
  const { session, loading: authLoading, isInitialized } = useAuth();
  const { isPlatformAdmin, isLoading: adminLoading } = usePlatformAdmin();
  const location = useLocation();

  if (!isInitialized || authLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="h-8 w-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin opacity-60" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="h-8 w-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin opacity-60" />
      </div>
    );
  }

  if (!isPlatformAdmin) {
    toast.error("No tienes permisos para acceder al panel de administración.");
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
