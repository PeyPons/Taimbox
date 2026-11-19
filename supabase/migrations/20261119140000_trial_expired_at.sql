-- Guarda la fecha en que terminó la prueba de Agency al pasar a Free.
-- expire_agency_trials() ya no borra esa fecha: trial_ends_at se vacía y
-- trial_expired_at conserva el instante del fin.

ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS trial_expired_at timestamptz;

COMMENT ON COLUMN public.agencies.trial_expired_at IS
  'Instante en que terminó la prueba y la cuenta pasó a Free. No se borra.';

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
    SELECT id, settings, plan_id, trial_ends_at, trial_expired_at
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
      trial_expired_at = COALESCE(rec.trial_expired_at, rec.trial_ends_at),
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
  'Pasa a Free las pruebas vencidas, recorta módulos y guarda trial_expired_at.';
