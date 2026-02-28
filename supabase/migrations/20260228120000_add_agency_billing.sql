-- Añadir columnas de facturación/suscripción a agencies (Stripe)
-- Orden: plan_id, subscription_status, stripe_customer_id, stripe_subscription_id, trial_ends_at

ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS plan_id text NOT NULL DEFAULT 'starter'
    CHECK (plan_id IN ('starter', 'pro', 'business')),
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

COMMENT ON COLUMN public.agencies.plan_id IS 'Plan de suscripción: starter, pro, business';
COMMENT ON COLUMN public.agencies.subscription_status IS 'Estado en Stripe: active, trialing, past_due, canceled, etc.';
COMMENT ON COLUMN public.agencies.stripe_customer_id IS 'ID del Customer en Stripe';
COMMENT ON COLUMN public.agencies.stripe_subscription_id IS 'ID de la Subscription en Stripe';
COMMENT ON COLUMN public.agencies.trial_ends_at IS 'Fin del periodo de prueba (ej. 14 días)';
