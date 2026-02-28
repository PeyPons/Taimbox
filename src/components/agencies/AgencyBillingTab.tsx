import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAgency } from '@/contexts/AgencyContext';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { CreditCard, Loader2, ExternalLink, Check } from 'lucide-react';
import { PLAN_LIMITS } from '@/config/plans';
import type { PlanId } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const PLAN_NAMES: Record<PlanId, string> = {
  starter: 'Starter',
  pro: 'Pro',
  business: 'Business',
};

const PRICE_ID_PRO = import.meta.env.VITE_STRIPE_PRICE_ID_PRO ?? '';
const PRICE_ID_BUSINESS = import.meta.env.VITE_STRIPE_PRICE_ID_BUSINESS ?? '';

export function AgencyBillingTab() {
  const { currentAgency } = useAgency();
  const {
    planId,
    currentEmployees,
    limitEmployees,
    isOverLimit,
    trialEndsAt,
    subscriptionStatus,
  } = useSubscriptionLimits();
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);

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

  if (!currentAgency) return null;

  const limits = PLAN_LIMITS[planId];
  const trialEndDate = trialEndsAt ? format(new Date(trialEndsAt), "d 'de' MMMM yyyy", { locale: es }) : null;

  return (
    <div className="space-y-6">
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
            {subscriptionStatus === 'trialing' && trialEndDate && (
              <span className="text-sm text-slate-600">
                Trial hasta el {trialEndDate}
              </span>
            )}
          </div>

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
                  onClick={() => handleCheckout(PRICE_ID_PRO, 'pro')}
                >
                  {loadingCheckout === 'pro' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Pro (49 €/mes)
                    </>
                  )}
                </Button>
              )}
              {planId !== 'business' && PRICE_ID_BUSINESS && (
                <Button
                  variant="default"
                  disabled={!!loadingCheckout}
                  onClick={() => handleCheckout(PRICE_ID_BUSINESS, 'business')}
                >
                  {loadingCheckout === 'business' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Business (149 €/mes, 14 días de prueba)
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
        </CardContent>
      </Card>
    </div>
  );
}
