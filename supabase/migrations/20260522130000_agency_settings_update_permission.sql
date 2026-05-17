-- Permite guardar settings.roles a usuarios con can_access_agency_settings (no solo is_agency_admin).

CREATE OR REPLACE FUNCTION public.user_has_agency_role_permission(
  p_user_id uuid,
  p_agency_id uuid,
  p_permission text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  emp_role text;
  ua_role text;
  role_name text;
  v_settings jsonb;
  roles_arr jsonb;
  n int;
  i int;
  elem jsonb;
BEGIN
  IF p_user_id IS NULL OR p_agency_id IS NULL OR p_permission IS NULL OR btrim(p_permission) = '' THEN
    RETURN false;
  END IF;

  IF EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = p_user_id) THEN
    RETURN true;
  END IF;

  IF NOT (
    EXISTS (SELECT 1 FROM public.user_agencies ua WHERE ua.user_id = p_user_id AND ua.agency_id = p_agency_id)
    OR EXISTS (SELECT 1 FROM public.employees e WHERE e.user_id = p_user_id AND e.agency_id = p_agency_id)
  ) THEN
    RETURN false;
  END IF;

  SELECT ua.role INTO ua_role
  FROM public.user_agencies ua
  WHERE ua.user_id = p_user_id AND ua.agency_id = p_agency_id
  LIMIT 1;

  SELECT e.role INTO emp_role
  FROM public.employees e
  WHERE e.user_id = p_user_id
    AND e.agency_id = p_agency_id
    AND COALESCE(e.is_active, true) = true
  ORDER BY e.created_at DESC NULLS LAST
  LIMIT 1;

  role_name := COALESCE(NULLIF(btrim(emp_role), ''), NULLIF(btrim(ua_role), ''));
  IF role_name IS NULL THEN
    RETURN false;
  END IF;

  SELECT a.settings INTO v_settings FROM public.agencies a WHERE a.id = p_agency_id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  roles_arr := COALESCE(v_settings->'roles', '[]'::jsonb);
  n := COALESCE(jsonb_array_length(roles_arr), 0);

  FOR i IN 0..GREATEST(n - 1, 0) LOOP
    EXIT WHEN n = 0 OR i >= n;
    elem := roles_arr->i;
    IF lower(btrim(elem->>'name')) = lower(btrim(role_name)) THEN
      RETURN COALESCE((elem->'permissions'->>p_permission)::boolean, false);
    END IF;
  END LOOP;

  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.user_has_agency_role_permission(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_has_agency_role_permission(uuid, uuid, text) TO authenticated;

COMMENT ON FUNCTION public.user_has_agency_role_permission(uuid, uuid, text) IS
  'Comprueba si el usuario tiene un permiso de rol en settings.roles de la agencia (platform admin: siempre true).';

-- Actualiza settings completos (la app envía el objeto settings ya fusionado).
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
      -- Compatibilidad: owners/admins legacy vía is_agency_admin si existe en el servidor
      pg_catalog.to_regprocedure('public.is_agency_admin(uuid,uuid)') IS NOT NULL
      AND public.is_agency_admin(auth.uid(), p_agency_id)
    )
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  UPDATE public.agencies
  SET settings = COALESCE(p_settings, '{}'::jsonb),
      updated_at = now()
  WHERE id = p_agency_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'agency not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT a.settings INTO out_settings FROM public.agencies a WHERE a.id = p_agency_id;
  RETURN out_settings;
END;
$$;

REVOKE ALL ON FUNCTION public.update_agency_settings_for_client(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_agency_settings_for_client(uuid, jsonb) TO authenticated;

COMMENT ON FUNCTION public.update_agency_settings_for_client(uuid, jsonb) IS
  'Persiste agencies.settings para miembros con can_access_agency_settings (o platform admin / is_agency_admin legacy).';

-- Ampliar política UPDATE directa (fallback si el cliente aún usa .from(agencies).update)
DROP POLICY IF EXISTS agencies_update ON public.agencies;
CREATE POLICY agencies_update ON public.agencies
  FOR UPDATE
  USING (
    public.can_write_via_api()
    AND (
      public.is_platform_admin()
      OR public.user_has_agency_role_permission(auth.uid(), id, 'can_access_agency_settings')
      OR (
        pg_catalog.to_regprocedure('public.is_agency_admin(uuid,uuid)') IS NOT NULL
        AND public.is_agency_admin(auth.uid(), id)
      )
    )
  )
  WITH CHECK (
    public.can_write_via_api()
    AND (
      public.is_platform_admin()
      OR public.user_has_agency_role_permission(auth.uid(), id, 'can_access_agency_settings')
      OR (
        pg_catalog.to_regprocedure('public.is_agency_admin(uuid,uuid)') IS NOT NULL
        AND public.is_agency_admin(auth.uid(), id)
      )
    )
  );
