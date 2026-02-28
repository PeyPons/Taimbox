-- Extender admin_list_agencies con columnas de billing (plan_id, subscription_status, trial_ends_at)
-- y añadir RPC admin_set_agency_plan para soporte desde /admin.
-- Requiere que existan is_platform_admin() y las columnas de agencies de 20260228120000_add_agency_billing.sql.

-- Cambiar el tipo de retorno obliga a borrar la función antes (PostgreSQL no permite alterar OUT/retorno)
DROP FUNCTION IF EXISTS public.admin_list_agencies(text, text);

CREATE OR REPLACE FUNCTION public.admin_list_agencies(p_search text, p_status text)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  status text,
  setup_completed boolean,
  created_at timestamptz,
  employees_count bigint,
  projects_count bigint,
  plan_id text,
  subscription_status text,
  trial_ends_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'access_denied';
  END IF;
  RETURN QUERY
  SELECT
    a.id,
    a.name,
    a.slug,
    a.status,
    a.setup_completed,
    a.created_at,
    (SELECT count(*)::bigint FROM public.employees e WHERE e.agency_id = a.id),
    (SELECT count(*)::bigint FROM public.projects p WHERE p.agency_id = a.id),
    COALESCE(a.plan_id, 'starter'::text),
    a.subscription_status,
    a.trial_ends_at
  FROM public.agencies a
  WHERE (p_search IS NULL OR a.name ILIKE '%' || p_search || '%' OR a.slug ILIKE '%' || p_search || '%')
    AND (p_status IS NULL OR a.status = p_status)
  ORDER BY a.created_at DESC;
END;
$$;

COMMENT ON FUNCTION public.admin_list_agencies(text, text) IS 'Lista agencias para panel admin (solo platform_admins). Incluye plan y suscripción desde 20260228130000.';

-- RPC para que soporte pueda forzar plan (Starter/Pro/Business) desde /admin
CREATE OR REPLACE FUNCTION public.admin_set_agency_plan(p_agency_id uuid, p_plan_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'access_denied';
  END IF;
  IF p_plan_id IS NULL OR p_plan_id NOT IN ('starter', 'pro', 'business') THEN
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

COMMENT ON FUNCTION public.admin_set_agency_plan(uuid, text) IS 'Soporte: asigna plan a una agencia (solo platform_admins).';
