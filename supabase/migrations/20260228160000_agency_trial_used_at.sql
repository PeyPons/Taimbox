-- Un solo trial por agencia: si ya usó la prueba de 14 días (por registro o por Stripe), no ofrecer trial de nuevo en Checkout.
-- create-checkout-session solo añade trial_period_days cuando trial_used_at es null.

ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS trial_used_at timestamptz;

COMMENT ON COLUMN public.agencies.trial_used_at IS 'Fecha en que la agencia usó el trial (por registro o por Stripe). Si está definido, no se ofrece trial de nuevo en Checkout Business.';
