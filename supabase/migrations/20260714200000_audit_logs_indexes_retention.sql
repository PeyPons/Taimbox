-- audit_logs: índices para las queries del historial + retención de 12 meses con pg_cron
--
-- Contexto: audit_logs solo tenía la PK. Las dos consultas de ActivityLogSection filtran por
-- (agency_id, resource, created_at) y por (agency_id, resource, resource_id); sin índices se
-- degradan a seq scans a medida que crece la tabla. Además la tabla era append-only sin
-- retención: el frontend (auditService) ahora guarda diffs compactos, y este job pone techo
-- al crecimiento borrando entradas de más de 12 meses.
--
-- Retención de 12 meses (no menos): la pestaña Historial de Previsión permite navegar meses
-- pasados y reconstruye el linaje de transferencias/rollovers con consultas sin filtro de
-- fecha. Para ajustar el periodo, cambiar el INTERVAL en public.purge_old_audit_logs().

-- 1) Índices
-- Cubre: historial mensual (agency_id + resource + rango de created_at, orden DESC)
CREATE INDEX IF NOT EXISTS idx_audit_logs_agency_resource_created_at
  ON public.audit_logs (agency_id, resource, created_at DESC);

-- Cubre: consultas de linaje por lote de allocations (resource_id IN (...))
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id
  ON public.audit_logs (resource_id);

-- 2) Función de purga (retención: 12 meses)
CREATE OR REPLACE FUNCTION public.purge_old_audit_logs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer;
BEGIN
  DELETE FROM public.audit_logs
  WHERE created_at < now() - INTERVAL '12 months';
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

COMMENT ON FUNCTION public.purge_old_audit_logs() IS
  'Retención de audit_logs: elimina entradas con más de 12 meses. Programada a diario vía pg_cron (job purge_old_audit_logs_daily).';

REVOKE EXECUTE ON FUNCTION public.purge_old_audit_logs() FROM PUBLIC, anon, authenticated;

-- 3) pg_cron diario a las 03:10 si la extensión está disponible (no-op si no lo está)
DO $cron$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'purge_old_audit_logs_daily';
    PERFORM cron.schedule(
      'purge_old_audit_logs_daily',
      '10 3 * * *',
      $cmd$SELECT public.purge_old_audit_logs();$cmd$
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron not configured for purge_old_audit_logs: %', SQLERRM;
END;
$cron$;
