import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAgency } from '@/contexts/AgencyContext';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { supabase } from '@/lib/supabase';
import { toast } from '@/lib/notify';
import { CreditCard, Loader2, ExternalLink, Check, Calendar, XCircle, AlertTriangle } from 'lucide-react';
import { PLAN_LIMITS } from '@/config/plans';
import type { PlanId } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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

const PLAN_NAMES: Record<PlanId, string> = {
  starter: 'Starter',
  pro: 'Pro',
  business: 'Business',
  enterprise: 'Enterprise',
};

const PLAN_PRICES: Record<PlanId, string> = {
  starter: '0',
  pro: '49',
  business: '149',
  enterprise: 'Personalizado',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Activa',
  trialing: 'En prueba',
  past_due: 'Pago pendiente',
  canceled: 'Cancelada',
  incomplete: 'Incompleta',
  incomplete_expired: 'Expirada',
};

const PRICE_ID_PRO = import.meta.env.VITE_STRIPE_PRICE_ID_PRO ?? '';
const PRICE_ID_BUSINESS = import.meta.env.VITE_STRIPE_PRICE_ID_BUSINESS ?? '';

export function AgencyBillingTab() {
  const { currentAgency, refreshAgency } = useAgency();
  const {
    planId,
    currentEmployees,
    limitEmployees,
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
        toast.error('Debes iniciar sesión');
        setLoadingCheckout(null);
        return;
      }
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          agency_id: currentAgency.id,
          price_id: priceId,
          plan_id: plan,
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.updated) {
        toast.success('Plan actualizado. Los cambios se reflejan en unos segundos.');
        refreshAgency();
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      toast.error('No se recibió URL de pago');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al iniciar el pago');
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
        toast.error('Debes iniciar sesión');
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
      toast.error('No se recibió URL del portal');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al abrir el portal de facturación');
    } finally {
      setLoadingPortal(false);
    }
  };

  if (!currentAgency) return null;

  const hasPaidPlan = planId === 'pro' || planId === 'business';
  const canManageSubscription = hasPaidPlan && !!currentAgency.stripeCustomerId;

  const limits = PLAN_LIMITS[planId];
  const trialEndDate = trialEndsAt ? format(new Date(trialEndsAt), "d 'de' MMMM yyyy", { locale: es }) : null;
  const periodEndDate = subscriptionPeriodEndsAt
    ? format(new Date(subscriptionPeriodEndsAt), "d 'de' MMMM yyyy", { locale: es })
    : null;
  const periodEndShort = subscriptionPeriodEndsAt
    ? format(new Date(subscriptionPeriodEndsAt), 'd MMM', { locale: es })
    : null;
  const statusLabel = subscriptionStatus ? STATUS_LABELS[subscriptionStatus] ?? subscriptionStatus : null;

  // Business button label: show trial only if not used yet
  const businessLabel = trialUsedAt
    ? 'Business ($149/mes)'
    : 'Business ($149/mes, 14 días de prueba)';

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
            <p className="font-medium">Pago pendiente</p>
            <p className="text-amber-700 mt-0.5">
              No hemos podido procesar tu último pago. Actualiza tu método de pago para evitar la interrupción del servicio.
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
              {loadingPortal ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Actualizar pago'}
            </Button>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Plan y facturación
          </CardTitle>
          <CardDescription>
            Plan actual, uso y opciones para cambiar de plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">Plan actual:</span>
            <Badge variant={planId === 'business' ? 'default' : planId === 'pro' ? 'secondary' : 'outline'}>
              {PLAN_NAMES[planId]}
            </Badge>
            {cancelAtPeriodEnd && periodEndShort ? (
              <Badge variant="outline" className="text-slate-600 bg-slate-100">
                Se cancela el {periodEndShort}
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
                  <span>Prueba hasta el {trialEndDate}</span>
                  {daysRemainingTrial !== null && daysRemainingTrial > 0 && (
                    <span className="font-medium">
                      ({daysRemainingTrial} {daysRemainingTrial === 1 ? 'día' : 'días'} restantes)
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
                  <span>Tu servicio finalizará el {periodEndDate}. Después pasarás a Starter.</span>
                  {daysRemainingPeriod !== null && daysRemainingPeriod > 0 && (
                    <span className="text-slate-600">
                      ({daysRemainingPeriod} {daysRemainingPeriod === 1 ? 'día' : 'días'} restantes)
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span>Próxima facturación: {periodEndDate}</span>
                  {daysRemainingPeriod !== null && daysRemainingPeriod > 0 && (
                    <span className="text-slate-600">
                      ({daysRemainingPeriod} {daysRemainingPeriod === 1 ? 'día' : 'días'} restantes en el periodo actual)
                    </span>
                  )}
                </>
              )}
            </div>
          )}

          <div className="text-sm">
            <strong>Uso:</strong> {currentEmployees} de {limits.maxEmployees} empleados
            {isOverLimit && (
              <p className="mt-1 text-amber-600 font-medium">
                Tu agencia supera el límite del plan actual. Pasa a un plan superior para desbloquear la edición.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Cambiar de plan</p>
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
                      Pro ($49/mes)
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
                  Configura VITE_STRIPE_PRICE_ID_PRO y VITE_STRIPE_PRICE_ID_BUSINESS para habilitar los botones.
                </p>
              )}
            </div>
          </div>

          {canManageSubscription && (
            <div className="flex flex-col gap-2 pt-4 border-t">
              <p className="text-sm font-medium">Gestionar o cancelar suscripción</p>
              <p className="text-xs text-slate-500">
                Abre el portal de Stripe para actualizar el método de pago, ver facturas o cancelar la suscripción. Al cancelar, pasarás a plan Starter al final del periodo facturado.
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
                    Gestionar suscripción / Cancelar
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
              Cambiar a {PLAN_NAMES[confirmDialog.targetPlan]}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Vas a cambiar de <strong>{PLAN_NAMES[planId]}</strong> a{' '}
                  <strong>{PLAN_NAMES[confirmDialog.targetPlan]}</strong> (${PLAN_PRICES[confirmDialog.targetPlan]}/mes).
                </p>

                {confirmDialog.loseTrial && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                    <span>
                      Estás en periodo de prueba Business. Al cambiar a Pro, <strong>la prueba terminará inmediatamente</strong> y se cobrará Pro ($49/mes) desde hoy.
                    </span>
                  </div>
                )}

                {!confirmDialog.loseTrial && (
                  <p className="text-sm text-muted-foreground">
                    Se aplicará un prorrateo sobre la diferencia de precio en tu próxima factura.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPlanChange}>
              Confirmar cambio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
