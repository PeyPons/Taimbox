import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';

interface PlanGuardProps {
  children?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Redirige a Plan y facturación si la ruta actual requiere un plan superior al del usuario.
 * Usar envolviendo rutas que requieren Pro o Business (operaciones/Pro; ads, api-keys/Business; weekly-forecast, okrs/Pro).
 */
export function PlanGuard({ children, redirectTo = '/agency?tab=billing' }: PlanGuardProps) {
  const location = useLocation();
  const { canAccessRouteByPlan } = useSubscriptionLimits();

  if (!canAccessRouteByPlan(location.pathname)) {
    return <Navigate to={redirectTo} replace state={{ from: location.pathname }} />;
  }

  return children ? <>{children}</> : <Outlet />;
}
