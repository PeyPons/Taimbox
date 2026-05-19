-- Al guardar agencies.settings, impide que el cliente reinyecte secretos OAuth en JSON
-- (tokens viven en columnas dedicadas; settings.integrations solo admite claves no sensibles
-- salvo platform admin).

CREATE OR REPLACE FUNCTION public.update_agency_settings_for_client(
  p_agency_id uuid,
  p_settings jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_settings jsonb;
  merged_settings jsonb;
  new_integ jsonb;
  old_integ jsonb;
  safe_integ jsonb;
  secret_key text;
  secret_keys text[] := ARRAY[
    'googleClientSecret',
    'googleAdsDevToken',
    'googleRefreshToken',
    'metaAccessToken',
    'metaAdAccountIds',
    'googleAdsCustomerId'
  ];
  out_settings jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;

  IF p_agency_id IS NULL THEN
    RAISE EXCEPTION 'agency_id required' USING ERRCODE = '22023';
  END IF;

  IF NOT (
    EXISTS (SELECT 1 FROM public.user_agencies ua WHERE ua.user_id = auth.uid() AND ua.agency_id = p_agency_id)
    OR EXISTS (SELECT 1 FROM public.employees e WHERE e.user_id = auth.uid() AND e.agency_id = p_agency_id)
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF NOT (
    public.is_platform_admin()
    OR public.user_has_agency_role_permission(auth.uid(), p_agency_id, 'can_access_agency_settings')
    OR (
      pg_catalog.to_regprocedure('public.is_agency_admin(uuid,uuid)') IS NOT NULL
      AND public.is_agency_admin(auth.uid(), p_agency_id)
    )
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT a.settings INTO current_settings
  FROM public.agencies a
  WHERE a.id = p_agency_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'agency not found' USING ERRCODE = 'P0002';
  END IF;

  current_settings := COALESCE(current_settings, '{}'::jsonb);
  merged_settings := COALESCE(p_settings, '{}'::jsonb);

  IF NOT public.is_platform_admin() THEN
    new_integ := COALESCE(merged_settings->'integrations', '{}'::jsonb);
    old_integ := COALESCE(current_settings->'integrations', '{}'::jsonb);
    safe_integ := new_integ;

    FOREACH secret_key IN ARRAY secret_keys LOOP
      safe_integ := safe_integ - secret_key;
    END LOOP;

    FOREACH secret_key IN ARRAY secret_keys LOOP
      IF old_integ ? secret_key THEN
        safe_integ := jsonb_set(safe_integ, ARRAY[secret_key], old_integ->secret_key, true);
      END IF;
    END LOOP;

    merged_settings := jsonb_set(merged_settings, '{integrations}', safe_integ, true);
  END IF;

  UPDATE public.agencies
  SET settings = merged_settings,
      updated_at = now()
  WHERE id = p_agency_id;

  SELECT a.settings INTO out_settings FROM public.agencies a WHERE a.id = p_agency_id;
  RETURN out_settings;
END;
$$;

COMMENT ON FUNCTION public.update_agency_settings_for_client(uuid, jsonb) IS
  'Persiste agencies.settings; para no platform admins preserva secretos OAuth en settings.integrations desde BD (no confía en el JSON del cliente).';
