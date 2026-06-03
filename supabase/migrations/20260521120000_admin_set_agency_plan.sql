-- RPC usada por admin plataforma; la Edge Function admin-set-agency-plan sincroniza Stripe antes.
CREATE OR REPLACE FUNCTION public.admin_set_agency_plan(p_agency_id uuid, p_plan_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'access_denied';
  END IF;
  IF p_plan_id IS NULL OR p_plan_id NOT IN ('starter', 'pro', 'business', 'scale', 'enterprise') THEN
    RAISE EXCEPTION 'invalid_plan';
  END IF;
  UPDATE public.agencies
  SET
    plan_id = p_plan_id,
    subscription_status = CASE WHEN p_plan_id = 'starter' THEN 'active' ELSE subscription_status END,
    trial_ends_at = CASE WHEN p_plan_id = 'starter' THEN NULL ELSE trial_ends_at END,
    updated_at = now()
  WHERE id = p_agency_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'agency_not_found';
  END IF;
END;
$$;
