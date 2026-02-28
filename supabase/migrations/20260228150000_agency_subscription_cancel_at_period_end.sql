-- Cancelación al final del periodo: el usuario cancela en Stripe pero el plan sigue activo hasta current_period_end.
-- Taimbox muestra "Se cancela el X" y mantiene acceso hasta que Stripe envíe subscription.deleted.

ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.agencies.subscription_cancel_at_period_end IS 'True si el usuario canceló en Stripe con "al final del periodo"; el plan sigue activo hasta subscription_period_ends_at. El webhook actualiza esto en subscription.updated/deleted.';
