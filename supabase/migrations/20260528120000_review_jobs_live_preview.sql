-- Vista en directo del texto que genera Ollama durante map/reduce.

ALTER TABLE public.review_jobs
  ADD COLUMN IF NOT EXISTS live_preview text,
  ADD COLUMN IF NOT EXISTS live_phase text,
  ADD COLUMN IF NOT EXISTS live_updated_at timestamptz;

COMMENT ON COLUMN public.review_jobs.live_preview IS 'Últimos tokens generados por Ollama (streaming, truncado).';
COMMENT ON COLUMN public.review_jobs.live_phase IS 'Fase activa: mapping | reducing.';
