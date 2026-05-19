-- Eventos de rate limit para formularios públicos (contacto, registro).
-- Solo accesible vía service role desde Edge Functions.

CREATE TABLE IF NOT EXISTS public.form_rate_limit_events (
  id bigserial PRIMARY KEY,
  bucket text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS form_rate_limit_events_bucket_created_idx
  ON public.form_rate_limit_events (bucket, created_at DESC);

ALTER TABLE public.form_rate_limit_events ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.form_rate_limit_events IS
  'Contador temporal para rate limiting de formularios públicos; sin políticas RLS (solo service role).';
