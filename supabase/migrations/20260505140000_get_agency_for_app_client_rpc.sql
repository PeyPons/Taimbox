-- Carga de agencia para la app: devuelve la fila agencies como JSONB saneado
-- para miembros sin permiso can_access_agency_settings (tokens Ads/Meta,
-- secretos en settings.integrations, IDs Stripe en cliente).
-- Los usuarios con ese permiso en su rol (y platform_admins) reciben el JSON completo.

CREATE OR REPLACE FUNCTION public.get_agency_for_app_client(p_agency_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row_agency public.agencies%ROWTYPE;
  out jsonb;
  emp_role text;
  is_plat boolean := false;
  can_settings boolean := false;
  elem jsonb;
  st jsonb;
  integ jsonb;
  roles_arr jsonb;
  n int;
  i int;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF NOT (
    EXISTS (SELECT 1 FROM public.user_agencies ua WHERE ua.user_id = auth.uid() AND ua.agency_id = p_agency_id)
    OR EXISTS (SELECT 1 FROM public.employees e WHERE e.user_id = auth.uid() AND e.agency_id = p_agency_id)
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid()) INTO is_plat;

  SELECT e.role INTO emp_role
  FROM public.employees e
  WHERE e.user_id = auth.uid() AND e.agency_id = p_agency_id
  ORDER BY e.created_at DESC NULLS LAST
  LIMIT 1;

  SELECT * INTO row_agency FROM public.agencies a WHERE a.id = p_agency_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'agency not found';
  END IF;

  out := to_jsonb(row_agency);

  IF is_plat THEN
    RETURN out;
  END IF;

  IF emp_role IS NOT NULL AND row_agency.settings IS NOT NULL THEN
    roles_arr := COALESCE(row_agency.settings->'roles', '[]'::jsonb);
    n := COALESCE(jsonb_array_length(roles_arr), 0);
    FOR i IN 0..GREATEST(n - 1, 0)
    LOOP
      EXIT WHEN n = 0 OR i >= n;
      elem := roles_arr->i;
      IF lower(btrim(elem->>'name')) = lower(btrim(emp_role)) THEN
        can_settings := (elem->'permissions'->'can_access_agency_settings') = 'true'::jsonb;
        EXIT;
      END IF;
    END LOOP;
  END IF;

  IF can_settings THEN
    RETURN out;
  END IF;

  -- Quitar secretos de columnas y facturación en el payload del cliente
  out := out || jsonb_build_object(
    'google_ads_refresh_token', NULL,
    'meta_ads_access_token', NULL,
    'google_ads_customer_id', NULL,
    'stripe_customer_id', NULL,
    'stripe_subscription_id', NULL
  );

  st := COALESCE(row_agency.settings, '{}'::jsonb);
  IF st ? 'integrations' THEN
    integ := COALESCE(st->'integrations', '{}'::jsonb);
    integ := integ
      - 'googleClientSecret'
      - 'googleAdsDevToken'
      - 'googleRefreshToken'
      - 'metaAccessToken'
      - 'metaAdAccountIds'
      - 'googleAdsCustomerId';
    st := jsonb_set(st, '{integrations}', integ, true);
  END IF;

  out := jsonb_set(out, '{settings}', st, true);

  RETURN out;
END;
$$;

REVOKE ALL ON FUNCTION public.get_agency_for_app_client(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_agency_for_app_client(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_agency_for_app_client(uuid) IS
  'Devuelve agencies como jsonb; sanea tokens/secretos Stripe y settings.integrations si el rol del empleado no tiene can_access_agency_settings. Platform admins: fila completa.';
