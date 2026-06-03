import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAgency } from '@/contexts/AgencyContext';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { supabase } from '@/lib/supabase';
import { toast } from '@/lib/notify';
import { CreditCard, Loader2, ExternalLink, Check, Calendar, XCircle, AlertTriangle } from 'lucide-react';
import { PLAN_LIMITS, PLAN_DISPLAY_NAMES } from '@/config/plans';
import type { PlanId } from '@/types';
import { format } from 'date-fns';
import { useDateLocale } from '@/hooks/useDateLocale';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const PLAN_NAMES: Record<PlanId, string> = PLAN_DISPLAY_NAMES;

const PLAN_PRICES: Record<PlanId, string> = {
  starter: '0',
  pro: '49',
  business: '149',
  scale: '299',
  enterprise: '',
};

const PRICE_ID_PRO = import.meta.env.VITE_STRIPE_PRICE_ID_PRO ?? '';
const PRICE_ID_BUSINESS = import.meta.env.VITE_STRIPE_PRICE_ID_BUSINESS ?? '';

export function AgencyBillingTab() {
  const { t } = useAppTranslation();
  const dateLocale = useDateLocale();
  const { currentAgency, refreshAgency } = useAgency();
  const {
    planId,
    currentEmployees,
    limitEmployees,
    extraBillableSeats,
    includedManagedUsers,
    isOverLimit,
    trialEndsAt,
    subscriptionStatus,
    subscriptionPeriodEndsAt,
    cancelAtPeriodEnd,
    daysRemainingTrial,
    daysRemainingPeriod,
  } = useSubscriptionLimits();
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    targetPlan: PlanId;
    priceId: string;
    loseTrial: boolean;
  }>({ open: false, targetPlan: 'pro', priceId: '', loseTrial: false });

  const trialUsedAt = currentAgency?.trialUsedAt;
  const isTrialing = subscriptionStatus === 'trialing';
  const isPastDue = subscriptionStatus === 'past_due';

  const handleCheckout = async (priceId: string, plan: PlanId) => {
    if (!currentAgency?.id) return;
    setLoadingCheckout(plan);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        toast.error(t('agency.billing.signInRequired'));
        setLoadingCheckout(null);
        return;
      }
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          agency_id: currentAgency.id,
          price_id: priceId,
          plan_id: plan,
          extra_managed_users: extraBillableSeats > 0 ? extraBillableSeats : 0,
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.updated) {
        toast.success(t('agency.billing.planUpdated'));
        refreshAgency();
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      toast.error(t('agency.billing.noCheckoutUrl'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('agency.billing.checkoutError'));
    } finally {
      setLoadingCheckout(null);
    }
  };

  /** Show confirmation dialog before changing plan if there's an active subscription */
  const handlePlanChangeClick = (priceId: string, plan: PlanId) => {
    const hasActiveSubscription = currentAgency?.stripeSubscriptionId &&
      (subscriptionStatus === 'active' || subscriptionStatus === 'trialing');

    if (hasActiveSubscription) {
      // The user will lose their trial if switching from Business trial to Pro
      const loseTrial = isTrialing && planId === 'business' && plan === 'pro';
      setConfirmDialog({ open: true, targetPlan: plan, priceId, loseTrial });
    } else {
      // No existing subscription — go directly to checkout
      handleCheckout(priceId, plan);
    }
  };

  const handleConfirmPlanChange = () => {
    setConfirmDialog(prev => ({ ...prev, open: false }));
    handleCheckout(confirmDialog.priceId, confirmDialog.targetPlan);
  };

  const handleOpenBillingPortal = async () => {
    if (!currentAgency?.id) return;
    setLoadingPortal(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        toast.error(t('agency.billing.signInRequired'));
        setLoadingPortal(false);
        return;
      }
      const { data, error } = await supabase.functions.invoke('create-billing-portal-session', {
        body: { agency_id: currentAgency.id },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      toast.error(t('agency.billing.noPortalUrl'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('agency.billing.portalError'));
    } finally {
      setLoadingPortal(false);
    }
  };

  if (!currentAgency) return null;

  const hasPaidPlan = planId === 'pro' || planId === 'business';
  const canManageSubscription = hasPaidPlan && !!currentAgency.stripeCustomerId;

  const limits = PLAN_LIMITS[planId];
  const trialEndDate = trialEndsAt ? format(new Date(trialEndsAt), 'PPP', { locale: dateLocale }) : null;
  const periodEndDate = subscriptionPeriodEndsAt
    ? format(new Date(subscriptionPeriodEndsAt), 'PPP', { locale: dateLocale })
    : null;
  const periodEndShort = subscriptionPeriodEndsAt
    ? format(new Date(subscriptionPeriodEndsAt), 'd MMM', { locale: dateLocale })
    : null;
  const statusLabel = subscriptionStatus
    ? t(`agency.billing.status.${subscriptionStatus}`, { defaultValue: subscriptionStatus })
    : null;

  const businessLabel = trialUsedAt
    ? t('agency.billing.businessNoTrial')
    : t('agency.billing.businessWithTrial');

  return (
    <div className="space-y-6">
      {/* past_due warning banner */}
      {isPastDue && (
        <div
          className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm"
          role="alert"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <div className="flex-1">
            <p className="font-medium">{t('agency.billing.pastDueTitle')}</p>
            <p className="text-amber-700 mt-0.5">
              {t('agency.billing.pastDueBody')}
            </p>
          </div>
          {canManageSubscription && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenBillingPortal}
              disabled={loadingPortal}
              className="shrink-0 border-amber-300 text-amber-800 hover:bg-amber-100"
            >
              {loadingPortal ? <Loader2 className="h-4 w-4 animate-spin" /> : t('agency.billing.updatePayment')}
            </Button>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {t('agency.billing.title')}
          </CardTitle>
          <CardDescription>
            {t('agency.billing.cardDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{t('agency.billing.currentPlanLabel')}</span>
            <Badge variant={planId === 'business' ? 'default' : planId === 'pro' ? 'secondary' : 'outline'}>
              {PLAN_NAMES[planId]}
            </Badge>
            {cancelAtPeriodEnd && periodEndShort ? (
              <Badge variant="outline" className="text-slate-600 bg-slate-100">
                {t('agency.billing.cancelsOn', { date: periodEndShort })}
              </Badge>
            ) : statusLabel ? (
              <Badge variant="outline" className="text-slate-600">
                {statusLabel}
              </Badge>
            ) : null}
          </div>

          {(subscriptionStatus === 'trialing' || daysRemainingTrial !== null) && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
              <Calendar className="h-4 w-4 text-slate-500" />
              {trialEndDate && (
                <>
                  <span>{t('agency.billing.trialUntil', { date: trialEndDate })}</span>
                  {daysRemainingTrial !== null && daysRemainingTrial > 0 && (
                    <span className="font-medium">
                      {t('agency.billing.daysRemaining', { count: daysRemainingTrial })}
                    </span>
                  )}
                </>
              )}
            </div>
          )}

          {(subscriptionStatus === 'active' && (planId === 'pro' || planId === 'business') && periodEndDate) && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
              <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
              {cancelAtPeriodEnd ? (
                <>
                  <span>{t('agency.billing.serviceEndsOn', { date: periodEndDate })}</span>
                  {daysRemainingPeriod !== null && daysRemainingPeriod > 0 && (
                    <span className="text-slate-600">
                      {t('agency.billing.daysRemaining', { count: daysRemainingPeriod })}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span>{t('agency.billing.nextBilling', { date: periodEndDate })}</span>
                  {daysRemainingPeriod !== null && daysRemainingPeriod > 0 && (
                    <span className="text-slate-600">
                      {t('agency.billing.daysRemainingInPeriod', { count: daysRemainingPeriod })}
                    </span>
                  )}
                </>
              )}
            </div>
          )}

          <div className="text-sm">
            <strong>{t('agency.billing.usageLabel')}</strong>{' '}
            {t('agency.billing.usageEmployees', {
              current: currentEmployees,
              max: limits.maxManagedUsers ?? includedManagedUsers,
            })}
            {extraBillableSeats > 0 && limits.extraUserPriceUsd != null && (
              <span className="block text-slate-600 mt-1">
                +{extraBillableSeats} {t('agency.billing.extraSeats', { price: limits.extraUserPriceUsd })}
              </span>
            )}
            {isOverLimit && (
              <p className="mt-1 text-amber-600 font-medium">
                {t('agency.billing.overLimitWarning')}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">{t('agency.billing.changePlan')}</p>
            <div className="flex flex-wrap gap-2">
              {planId !== 'pro' && PRICE_ID_PRO && (
                <Button
                  variant="outline"
                  disabled={!!loadingCheckout}
                  onClick={() => handlePlanChangeClick(PRICE_ID_PRO, 'pro')}
                >
                  {loadingCheckout === 'pro' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      {t('agency.billing.proButton')}
                    </>
                  )}
                </Button>
              )}
              {planId !== 'business' && PRICE_ID_BUSINESS && (
                <Button
                  variant="default"
                  disabled={!!loadingCheckout}
                  onClick={() => handlePlanChangeClick(PRICE_ID_BUSINESS, 'business')}
                >
                  {loadingCheckout === 'business' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      {businessLabel}
                    </>
                  )}
                </Button>
              )}
              {(!PRICE_ID_PRO || !PRICE_ID_BUSINESS) && (
                <p className="text-xs text-slate-500">
                  {t('agency.billing.stripeEnvHint')}
                </p>
              )}
            </div>
          </div>

          {canManageSubscription && (
            <div className="flex flex-col gap-2 pt-4 border-t">
              <p className="text-sm font-medium">{t('agency.billing.manageSubscription')}</p>
              <p className="text-xs text-slate-500">
                {t('agency.billing.portalDescription')}
              </p>
              <Button
                variant="outline"
                size="sm"
                disabled={loadingPortal}
                onClick={handleOpenBillingPortal}
                className="w-fit"
              >
                {loadingPortal ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-1" />
                    {t('agency.billing.portalButton')}
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation dialog for plan changes */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('agency.billing.confirmChangeTitle', { plan: PLAN_NAMES[confirmDialog.targetPlan] })}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p
                  dangerouslySetInnerHTML={{
                    __html: t('agency.billing.confirmChangeBody', {
                      from: PLAN_NAMES[planId],
                      to: PLAN_NAMES[confirmDialog.targetPlan],
                      price: PLAN_PRICES[confirmDialog.targetPlan] || t('agency.billing.enterprisePrice'),
                    }),
                  }}
                />

                {confirmDialog.loseTrial && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                    <span dangerouslySetInnerHTML={{ __html: t('agency.billing.loseTrialWarning') }} />
                  </div>
                )}

                {!confirmDialog.loseTrial && (
                  <p className="text-sm text-muted-foreground">
                    {t('agency.billing.prorateNote')}
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('agency.billing.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPlanChange}>
              {t('agency.billing.confirmChange')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
