-- Origen del sync (manual desde UI vs cron programado) para mostrar última sincronización fiable.

ALTER TABLE public.ads_sync_logs
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual'
  CHECK (source IN ('manual', 'cron'));

ALTER TABLE public.meta_sync_logs
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual'
  CHECK (source IN ('manual', 'cron'));

COMMENT ON COLUMN public.ads_sync_logs.source IS 'manual = botón en app; cron = scheduled-ads-sync';
COMMENT ON COLUMN public.meta_sync_logs.source IS 'manual = botón en app; cron = scheduled-ads-sync';
