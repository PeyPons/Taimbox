import { Link } from 'react-router-dom';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { AlertTriangle } from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { formatUpgradeOptionsList, getUpgradePlansFor } from '@/config/billingDisplay';
import { PLAN_DISPLAY_NAMES } from '@/config/plans';

export function SubscriptionSoftLockBanner() {
  const { isSoftLocked, planDisplayName, currentEmployees, limitEmployees } = useSubscriptionLimits();
  const { t, i18n } = useAppTranslation();
  const locale = i18n.language.startsWith('es') ? 'es' : 'en';

  if (!isSoftLocked) return null;

  const upgradeOptions = formatUpgradeOptionsList(getUpgradePlansFor('starter'), locale);

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-3 bg-red-600 text-white text-sm font-medium lg:pl-64"
      role="alert"
    >
      <AlertTriangle className="h-5 w-5 shrink-0" />
      <span>
        {t('layout.subscriptionBanner.exceeds', {
          planName: planDisplayName ?? PLAN_DISPLAY_NAMES.starter,
          current: currentEmployees,
          max: limitEmployees ?? 5,
          upgradeOptions,
        })}
      </span>
      <Link
        to="/agency?tab=billing"
        className="ml-1 underline font-semibold hover:no-underline whitespace-nowrap"
      >
        {t('layout.subscriptionBanner.viewPlans', 'Ver planes')}
      </Link>
    </div>
  );
}
