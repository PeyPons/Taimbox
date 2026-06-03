-- Trial expiry job, plan scale, expire expired trials to starter

-- Allow scale plan_id
ALTER TABLE public.agencies DROP CONSTRAINT IF EXISTS agencies_plan_id_check;
ALTER TABLE public.agencies ADD CONSTRAINT agencies_plan_id_check
  CHECK (plan_id IN ('starter', 'pro', 'business', 'scale', 'enterprise'));

CREATE OR REPLACE FUNCTION public.expire_agency_trials()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer := 0;
  rec record;
  mod jsonb;
BEGIN
  FOR rec IN
    SELECT id, settings, plan_id
    FROM public.agencies
    WHERE subscription_status = 'trialing'
      AND trial_ends_at IS NOT NULL
      AND trial_ends_at < now()
      AND COALESCE(plan_id, 'starter') NOT IN ('enterprise')
  LOOP
    mod := COALESCE(rec.settings, '{}'::jsonb);
    mod := jsonb_set(
      mod,
      '{modules}',
      jsonb_build_object(
        'deadlines', true,
        'timeTracker', true,
        'weeklyFeedback', false,
        'professionalGoals', false,
        'ppc', false
      ),
      true
    );
    UPDATE public.agencies
    SET
      plan_id = 'starter',
      subscription_status = 'active',
      trial_ends_at = NULL,
      settings = mod,
      updated_at = now()
    WHERE id = rec.id;
    n := n + 1;
  END LOOP;
  RETURN n;
END;
$$;

COMMENT ON FUNCTION public.expire_agency_trials() IS
  'Downgrade agencias con trial expirado a starter (Free) y ajusta módulos.';

-- pg_cron hourly if extension available (no-op on install without cron)
DO $cron$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'expire_agency_trials_hourly';
    PERFORM cron.schedule(
      'expire_agency_trials_hourly',
      '15 * * * *',
      $cmd$SELECT public.expire_agency_trials();$cmd$
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron not configured for expire_agency_trials: %', SQLERRM;
END;
$cron$;
