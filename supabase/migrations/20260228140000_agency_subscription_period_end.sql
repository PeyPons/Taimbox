-- Añadir fin del periodo de suscripción (para mostrar "días restantes" y próxima facturación)
-- El webhook stripe-webhook debe actualizar este campo desde sub.current_period_end

ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS subscription_period_ends_at timestamptz;

COMMENT ON COLUMN public.agencies.subscription_period_ends_at IS 'Fin del periodo de facturación actual (Stripe subscription.current_period_end). Para mostrar próxima facturación y días restantes.';
