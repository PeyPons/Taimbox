import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAgency } from '@/contexts/AgencyContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { supabase } from '@/lib/supabase';
import {
  adsBudgetAlertDedupeKey,
  buildAdsPpcAlerts,
  type AdsCampaignRow,
  type AdsClientSettingRow,
} from '@/utils/adsPpcAlertBuild';
import {
  loadNotificationState,
  saveNotificationState,
  storageKeyForNotifyState,
} from '@/lib/notificationState';
import { useApp } from '@/contexts/AppContext';

const GOOGLE_CAMPAIGN_FIELDS =
  'client_id, client_name, cost, date, daily_budget, status, budget_id, campaign_name';

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

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`;

    const [settingsRes, googleRes, metaRes, googleAccountsRes, metaAccountsRes, googleRulesRes, metaRulesRes] =
      await Promise.all([
        supabase
          .from('client_settings')
          .select('client_id, budget_limit, group_name, is_hidden')
          .eq('agency_id', currentAgency.id),
        canGoogle
          ? supabase
              .from('google_ads_campaigns')
              .select(GOOGLE_CAMPAIGN_FIELDS)
              .eq('agency_id', currentAgency.id)
              .gte('date', monthStart)
              .lte('date', monthEnd)
          : Promise.resolve({ data: [] }),
        canMeta
          ? supabase
              .from('meta_ads_campaigns')
              .select('client_id, client_name, cost, date, status, campaign_name')
              .eq('agency_id', currentAgency.id)
              .gte('date', monthStart)
              .lte('date', monthEnd)
          : Promise.resolve({ data: [] }),
        canGoogle
          ? supabase
              .from('ad_accounts_config')
              .select('account_id, account_name')
              .eq('agency_id', currentAgency.id)
              .eq('platform', 'google')
              .eq('is_active', true)
          : Promise.resolve({ data: [] }),
        canMeta
          ? supabase
              .from('ad_accounts_config')
              .select('account_id, account_name')
              .eq('agency_id', currentAgency.id)
              .eq('platform', 'meta')
              .eq('is_active', true)
          : Promise.resolve({ data: [] }),
        canGoogle
          ? supabase
              .from('segmentation_rules')
              .select('account_id, keyword, virtual_name')
              .eq('agency_id', currentAgency.id)
              .eq('platform', 'google')
          : Promise.resolve({ data: [] }),
        canMeta
          ? supabase
              .from('segmentation_rules')
              .select('account_id, keyword, virtual_name')
              .eq('agency_id', currentAgency.id)
              .eq('platform', 'meta')
          : Promise.resolve({ data: [] }),
      ]);

    const settings = (settingsRes.data ?? []) as AdsClientSettingRow[];
    const hasBudgets = settings.some((s) => Number(s.budget_limit) > 0 && !s.is_hidden);
    if (!hasBudgets) return;

    const platforms: Array<'google' | 'meta'> = [];
    if (canGoogle) platforms.push('google');
    if (canMeta) platforms.push('meta');

    const alerts = buildAdsPpcAlerts({
      settings,
      google: canGoogle
        ? {
            campaigns: (googleRes.data ?? []) as AdsCampaignRow[],
            accounts: googleAccountsRes.data ?? [],
            rules: googleRulesRes.data ?? [],
          }
        : undefined,
      meta: canMeta
        ? {
            campaigns: (metaRes.data ?? []) as AdsCampaignRow[],
            accounts: metaAccountsRes.data ?? [],
            rules: metaRulesRes.data ?? [],
          }
        : undefined,
      platforms,
      now,
    });

    for (const alert of alerts) {
      const dedupeKey = adsBudgetAlertDedupeKey(alert);
      if (state.adsBudgetAlerts[dedupeKey]) continue;

      const platformLabel =
        alert.platform === 'google'
          ? t('ads.google', 'Google Ads')
          : t('ads.meta', 'Meta Ads');
      const link = alert.platform === 'google' ? '/google-ads' : '/meta-ads';
      const accountLabel = alert.isGroup
        ? `${alert.displayName} (grupo)`
        : alert.displayName;

      if (alert.status === 'over') {
        pushSystemNotification({
          type: 'ads',
          title: t('ads.notifications.budgetOverTitle', 'Presupuesto PPC superado'),
          message: t('ads.notifications.budgetOverMessage', {
            platform: platformLabel,
            account: accountLabel,
            spent: Math.round(alert.spent).toString(),
            budget: Math.round(alert.monthlyBudgetMax).toString(),
            defaultValue: `${platformLabel}: ${accountLabel} ha superado el presupuesto (${Math.round(alert.spent)} / ${Math.round(alert.monthlyBudgetMax)} ${alert.currency}).`,
          }),
          link,
        });
      } else {
        pushSystemNotification({
          type: 'ads',
          title: t('ads.notifications.budgetRiskTitle', 'Riesgo de presupuesto PPC'),
          message: t('ads.notifications.budgetRiskMessage', {
            platform: platformLabel,
            account: accountLabel,
            forecast: Math.round(alert.forecast).toString(),
            budget: Math.round(alert.monthlyBudgetMax).toString(),
            defaultValue: `${platformLabel}: ${accountLabel} podría superar el presupuesto (proy. ${Math.round(alert.forecast)} / ${Math.round(alert.monthlyBudgetMax)} ${alert.currency}).`,
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
