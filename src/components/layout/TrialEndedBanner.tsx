import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAgency } from '@/contexts/AgencyContext';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { trialHasLapsed } from '@/utils/effectivePlanModules';

function dismissKey(agencyId: string, endedAt: string): string {
  return `tb-trial-ended-dismissed:${agencyId}:${endedAt}`;
}

/**
 * Aviso de prueba terminada. Sale mientras el cron no ha corrido (trial aún en curso
 * pero con fecha vencida) y después, cuando trial_expired_at ya está guardada y el plan es Free.
 * Se cierra en este navegador y no vuelve en el resto de pantallas.
 */
export function TrialEndedBanner() {
  const { currentAgency } = useAgency();
  const { planId } = useSubscriptionLimits();
  const { t } = useAppTranslation();
  const endedAt =
    currentAgency?.trialExpiredAt ??
    (trialHasLapsed(currentAgency?.subscriptionStatus, currentAgency?.trialEndsAt)
      ? currentAgency?.trialEndsAt
      : undefined);
  const show =
    Boolean(currentAgency?.id && endedAt) &&
    (planId === 'starter' || trialHasLapsed(currentAgency?.subscriptionStatus, currentAgency?.trialEndsAt));
  const storageKey = currentAgency?.id && endedAt ? dismissKey(currentAgency.id, endedAt) : '';
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!storageKey) {
      setDismissed(false);
      return;
    }
    try {
      setDismissed(localStorage.getItem(storageKey) === '1');
    } catch {
      setDismissed(false);
    }
  }, [storageKey]);

  if (!show || !storageKey || dismissed) return null;

  const close = () => {
    try {
      localStorage.setItem(storageKey, '1');
    } catch {
      /* el cierre vale igual en esta pestaña */
    }
    setDismissed(true);
  };

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 px-4 py-3 bg-indigo-700 text-white text-sm lg:pl-64"
      role="status"
    >
      <span className="font-medium">{t('layout.subscriptionBanner.trialEnded')}</span>
      <Link
        to="/agency?tab=billing"
        className="inline-flex items-center rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-indigo-800 hover:bg-indigo-50"
      >
        {t('layout.subscriptionBanner.upgrade')}
      </Link>
      <button
        type="button"
        onClick={close}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white/90 hover:bg-white/15"
        aria-label={t('layout.subscriptionBanner.dismiss')}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
