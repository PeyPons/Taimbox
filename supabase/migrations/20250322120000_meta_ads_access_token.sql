-- Token OAuth de Meta (Marketing API), modelo SaaS: credenciales de app en servidor, token por agencia.
ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS meta_ads_access_token text;

COMMENT ON COLUMN public.agencies.meta_ads_access_token IS 'Access token de usuario Meta (long-lived tras OAuth). Prioridad sobre settings.integrations.metaAccessToken.';
