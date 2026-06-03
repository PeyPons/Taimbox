import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAgency } from '@/contexts/AgencyContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { supabase } from '@/lib/supabase';
import {
  adsBudgetAlertDedupeKey,
  computeAdsBudgetAlerts,
  type AdsClientSettingRow,
  type AdsSpendRow,
} from '@/utils/adsBudgetAlerts';
import {
  loadNotificationState,
  saveNotificationState,
  storageKeyForNotifyState,
} from '@/lib/notificationState';
import { useApp } from '@/contexts/AppContext';

/**
 * Avisos de presupuesto PPC (Google + Meta) en la campanita.
 * Se evalúa en cliente tras cargar datos; deduplicación por mes y cuenta en localStorage.
 */
export function useAdsBudgetNotifications(): void {
  const { t } = useTranslation();
  const { currentUser } = useApp();
  const { currentAgency } = useAgency();
  const { permissions } = usePermissions();
  const { planIncludesAds } = useSubscriptionLimits();
  const { pushSystemNotification } = useNotifications();

  const canGoogle = planIncludesAds && permissions.can_access_google_ads !== false;
  const canMeta = planIncludesAds && permissions.can_access_meta_ads !== false;

  const runChecks = useCallback(async () => {
    if (!currentUser?.id || !currentAgency?.id || (!canGoogle && !canMeta)) return;

    const storageKey = storageKeyForNotifyState(currentAgency.id, currentUser.id);
    let state = loadNotificationState(storageKey, new Set(), new Date());
    let dirty = false;

    const { data: settingsRows } = await supabase
      .from('client_settings')
      .select('client_id, budget_limit, group_name, is_hidden')
      .eq('agency_id', currentAgency.id);

    const settings = (settingsRows ?? []) as AdsClientSettingRow[];
    const hasBudgets = settings.some((s) => Number(s.budget_limit) > 0 && !s.is_hidden);
    if (!hasBudgets) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`;

    let googleRows: AdsSpendRow[] = [];
    let metaRows: AdsSpendRow[] = [];

    if (canGoogle) {
      const { data } = await supabase
        .from('google_ads_campaigns')
        .select('client_id, cost, date')
        .eq('agency_id', currentAgency.id)
        .gte('date', monthStart)
        .lte('date', monthEnd);
      googleRows = (data ?? []) as AdsSpendRow[];
    }

    if (canMeta) {
      const { data } = await supabase
        .from('meta_ads_campaigns')
        .select('client_id, cost, date')
        .eq('agency_id', currentAgency.id)
        .gte('date', monthStart)
        .lte('date', monthEnd);
      metaRows = (data ?? []) as AdsSpendRow[];
    }

    const alerts = computeAdsBudgetAlerts(settings, googleRows, metaRows, now);

    for (const alert of alerts) {
      const dedupeKey = adsBudgetAlertDedupeKey(alert);
      if (state.adsBudgetAlerts[dedupeKey]) continue;

      const platformLabel =
        alert.platform === 'google'
          ? t('ads.google', 'Google Ads')
          : t('ads.meta', 'Meta Ads');
      const link = alert.platform === 'google' ? '/google-ads' : '/meta-ads';

      if (alert.status === 'over') {
        pushSystemNotification({
          type: 'ads',
          title: t('ads.notifications.budgetOverTitle', 'Presupuesto PPC superado'),
          message: t('ads.notifications.budgetOverMessage', {
            platform: platformLabel,
            account: alert.displayName,
            spent: alert.spent.toFixed(0),
            budget: alert.budget.toFixed(0),
            defaultValue: `${platformLabel}: ${alert.displayName} ha superado el presupuesto (${alert.spent.toFixed(0)} / ${alert.budget.toFixed(0)}).`,
          }),
          link,
        });
      } else {
        pushSystemNotification({
          type: 'ads',
          title: t('ads.notifications.budgetRiskTitle', 'Riesgo de presupuesto PPC'),
          message: t('ads.notifications.budgetRiskMessage', {
            platform: platformLabel,
            account: alert.displayName,
            forecast: alert.forecast.toFixed(0),
            budget: alert.budget.toFixed(0),
            defaultValue: `${platformLabel}: ${alert.displayName} podría superar el presupuesto (proy. ${alert.forecast.toFixed(0)} / ${alert.budget.toFixed(0)}).`,
          }),
          link,
        });
      }

      state = {
        ...state,
        adsBudgetAlerts: { ...state.adsBudgetAlerts, [dedupeKey]: now.toISOString() },
      };
      dirty = true;
    }

    if (dirty) {
      saveNotificationState(storageKey, state);
    }
  }, [canGoogle, canMeta, currentAgency?.id, currentUser?.id, pushSystemNotification, t]);

  useEffect(() => {
    void runChecks();
  }, [runChecks]);

  useEffect(() => {
    const onFocus = () => {
      void runChecks();
    };
    const onVis = () => {
      if (document.visibilityState === 'visible') void runChecks();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);
    const intervalId = window.setInterval(() => {
      void runChecks();
    }, 15 * 60 * 1000);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
      window.clearInterval(intervalId);
    };
  }, [runChecks]);
}
