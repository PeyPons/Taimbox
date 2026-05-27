-- Moneda por cuenta publicitaria (Meta/Google); la agencia usa agencies.settings.currency (JSONB).

ALTER TABLE public.ad_accounts_config
  ADD COLUMN IF NOT EXISTS currency text;

COMMENT ON COLUMN public.ad_accounts_config.currency IS
  'ISO 4217 de la cuenta en la plataforma (Meta/Google). Puede diferir de agencies.settings.currency.';
