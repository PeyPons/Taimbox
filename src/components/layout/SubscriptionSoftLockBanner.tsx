import { Link } from 'react-router-dom';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { AlertTriangle } from 'lucide-react';

export function SubscriptionSoftLockBanner() {
  const { isSoftLocked } = useSubscriptionLimits();

  if (!isSoftLocked) return null;

  return (
    <div
      className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white text-sm font-medium"
      role="alert"
    >
      <AlertTriangle className="h-5 w-5 shrink-0" />
      <span>
        Tu agencia excede los límites del Plan Starter. Pasa a Pro o Business para volver a planificar.
      </span>
      <Link
        to="/agency?tab=billing"
        className="ml-2 underline font-semibold hover:no-underline"
      >
        Ver planes
      </Link>
    </div>
  );
}
