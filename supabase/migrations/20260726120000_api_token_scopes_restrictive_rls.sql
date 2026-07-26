-- API de integración a largo plazo:
-- 1) scopes por recurso en api_tokens + claim JWT
-- 2) helpers is_api_token / api_scope_allows
-- 3) políticas AS RESTRICTIVE (sin reescribir las permisivas existentes)
-- 4) endurecer grants de api_tokens (sin token_hash ni escritura desde cliente)
--
-- Aplicar en self-hosted como owner de tablas (suele ser supabase_admin), p. ej.:
--   docker exec -i supabase-db psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 < migration.sql

-- ---------------------------------------------------------------------------
-- Columna scopes
-- ---------------------------------------------------------------------------

ALTER TABLE public.api_tokens
  ADD COLUMN IF NOT EXISTS scopes text[] NOT NULL DEFAULT ARRAY[]::text[];

COMMENT ON COLUMN public.api_tokens.scopes IS
  'Recursos de integración permitidos (allowlist). Vacío se interpreta como api_default_scopes() solo para tokens legacy hasta backfill.';

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_api_token()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT COALESCE(auth.jwt()->>'iss', '') = 'timeboxing-api';
$$;

CREATE OR REPLACE FUNCTION public.api_default_scopes()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ARRAY[
    'employees',
    'clients',
    'projects',
    'allocations',
    'allocation_notes',
    'deadlines',
    'absences',
    'team_events',
    'global_assignments',
    'department_config',
    'client_settings',
    'weekly_feedback',
    'professional_goals',
    'user_routines',
    'project_editing_locks',
    'task_transfers'
  ]::text[];
$$;

CREATE OR REPLACE FUNCTION public.api_effective_scopes()
RETURNS text[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  jwt jsonb;
  jwt_scopes jsonb;
  scopes text[];
  jwt_agency uuid;
  jwt_sub uuid;
BEGIN
  IF NOT public.is_api_token() THEN
    RETURN NULL;
  END IF;

  jwt := auth.jwt();
  jwt_scopes := jwt->'scopes';

  IF jwt_scopes IS NOT NULL AND jsonb_typeof(jwt_scopes) = 'array' AND jsonb_array_length(jwt_scopes) > 0 THEN
    SELECT COALESCE(array_agg(x), ARRAY[]::text[])
    INTO scopes
    FROM (
      SELECT DISTINCT trim(both '"' from value::text) AS x
      FROM jsonb_array_elements(jwt_scopes)
      WHERE trim(both '"' from value::text) = ANY (public.api_default_scopes())
    ) s;
    IF scopes IS NOT NULL AND cardinality(scopes) > 0 THEN
      RETURN scopes;
    END IF;
  END IF;

  BEGIN
    jwt_agency := (jwt->>'agency_id')::uuid;
    jwt_sub := (jwt->>'sub')::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN ARRAY[]::text[];
  END;

  SELECT t.scopes
  INTO scopes
  FROM public.api_tokens t
  WHERE t.id = jwt_sub
    AND t.agency_id = jwt_agency
    AND t.is_active = true
    AND (t.expires_at IS NULL OR t.expires_at > now());

  IF scopes IS NULL THEN
    RETURN ARRAY[]::text[];
  END IF;

  IF cardinality(scopes) = 0 THEN
    -- Legacy: tokens sin scopes → superficie documentada (no blog/Ads/audit).
    RETURN public.api_default_scopes();
  END IF;

  RETURN scopes;
END;
$$;

CREATE OR REPLACE FUNCTION public.api_scope_allows(p_resource text, p_mode text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  mode text := lower(coalesce(p_mode, 'read'));
  scopes text[];
BEGIN
  IF NOT public.is_api_token() THEN
    RETURN true;
  END IF;

  IF p_resource IS NULL OR btrim(p_resource) = '' THEN
    RETURN false;
  END IF;

  IF mode = 'write' AND NOT public.can_write_via_api() THEN
    RETURN false;
  END IF;

  scopes := public.api_effective_scopes();
  IF scopes IS NULL OR cardinality(scopes) = 0 THEN
    RETURN false;
  END IF;

  RETURN p_resource = ANY (scopes);
END;
$$;

REVOKE ALL ON FUNCTION public.is_api_token() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.api_default_scopes() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.api_effective_scopes() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.api_scope_allows(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_api_token() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.api_default_scopes() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.api_effective_scopes() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.api_scope_allows(text, text) TO authenticated, anon;

COMMENT ON FUNCTION public.is_api_token() IS
  'true si el JWT actual es de integración (iss=timeboxing-api).';
COMMENT ON FUNCTION public.api_default_scopes() IS
  'Allowlist canónica de recursos de la API de integración.';
COMMENT ON FUNCTION public.api_effective_scopes() IS
  'Scopes efectivos del token API (claim JWT scopes o fila api_tokens; legacy vacío → default).';
COMMENT ON FUNCTION public.api_scope_allows(text, text) IS
  'Para app users siempre true. Para token API exige recurso en scopes; write también can_write_via_api().';

-- Backfill tokens existentes
UPDATE public.api_tokens
SET scopes = public.api_default_scopes()
WHERE scopes IS NULL OR cardinality(scopes) = 0;

-- ---------------------------------------------------------------------------
-- can_assign_tasks_for_employee: token API solo con scope allocations:write
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.can_assign_tasks_for_employee(p_target_employee_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_agency_id uuid;
  v_my_employee_id uuid;
  v_employee_role text;
  v_settings jsonb;
  roles_arr jsonb;
  n int;
  i int;
  elem jsonb;
  v_can boolean := false;
  jwt jsonb;
BEGIN
  IF p_target_employee_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT e.agency_id INTO v_agency_id
  FROM public.employees e
  WHERE e.id = p_target_employee_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF NOT (v_agency_id IN (SELECT public.user_agency_ids())) THEN
    RETURN false;
  END IF;

  jwt := auth.jwt();

  IF jwt IS NOT NULL AND jwt->>'iss' = 'timeboxing-api' THEN
    RETURN public.api_scope_allows('allocations', 'write');
  END IF;

  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  IF public.is_agency_admin(auth.uid(), v_agency_id) THEN
    RETURN true;
  END IF;

  SELECT e.id, e.role
  INTO v_my_employee_id, v_employee_role
  FROM public.employees e
  WHERE e.user_id = auth.uid()
    AND e.agency_id = v_agency_id
    AND e.is_active = true
  ORDER BY e.created_at DESC NULLS LAST
  LIMIT 1;

  IF v_my_employee_id IS NULL THEN
    RETURN false;
  END IF;

  IF v_my_employee_id = p_target_employee_id THEN
    RETURN true;
  END IF;

  IF v_employee_role IS NULL THEN
    RETURN false;
  END IF;

  SELECT a.settings INTO v_settings
  FROM public.agencies a
  WHERE a.id = v_agency_id;

  roles_arr := COALESCE(v_settings->'roles', '[]'::jsonb);
  n := COALESCE(jsonb_array_length(roles_arr), 0);

  FOR i IN 0..GREATEST(n - 1, 0) LOOP
    EXIT WHEN n = 0 OR i >= n;
    elem := roles_arr->i;
    IF lower(btrim(elem->>'name')) = lower(btrim(v_employee_role)) THEN
      v_can := COALESCE((elem->'permissions'->>'can_assign_tasks_to_others')::boolean, false);
      EXIT;
    END IF;
  END LOOP;

  RETURN v_can;
END;
$$;

REVOKE ALL ON FUNCTION public.can_assign_tasks_for_employee(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_assign_tasks_for_employee(uuid) TO authenticated;

COMMENT ON FUNCTION public.can_assign_tasks_for_employee(uuid) IS
  'true si puede INSERT/UPDATE/DELETE allocations del employee_id. Token API: exige scope allocations + readwrite.';

-- ---------------------------------------------------------------------------
-- Políticas RESTRICTIVE: denegar issuer API en tablas fuera de integración
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  blocked text[] := ARRAY[
    'agencies',
    'api_tokens',
    'audit_logs',
    'blog_posts',
    'ad_accounts_config',
    'ads_sync_logs',
    'google_ads_campaigns',
    'google_ads_changes',
    'meta_ads_campaigns',
    'meta_sync_logs',
    'segmentation_rules',
    'notification_rules',
    'notification_deliveries',
    'platform_admins',
    'platform_audit_logs',
    'review_jobs',
    'review_job_chunks',
    'review_job_events',
    'review_job_inputs',
    'review_profiles',
    'review_skills',
    'review_skill_versions',
    'support_tickets',
    'support_ticket_replies',
    'form_rate_limit_events',
    'time_entries',
    'active_timers',
    'timer_sessions',
    'user_agencies',
    'allocations_duplicate'
  ];
  t text;
  pol text;
BEGIN
  FOREACH t IN ARRAY blocked LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      CONTINUE;
    END IF;
    pol := 'api_block_' || t;
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (NOT public.is_api_token()) WITH CHECK (NOT public.is_api_token())',
      pol, t
    );
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- Políticas RESTRICTIVE: exigir scope en tablas de integración
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  scoped text[] := public.api_default_scopes();
  t text;
  pol_read text;
  pol_ins text;
  pol_upd text;
  pol_del text;
BEGIN
  FOREACH t IN ARRAY scoped LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      CONTINUE;
    END IF;

    pol_read := 'api_scope_select_' || t;
    pol_ins := 'api_scope_insert_' || t;
    pol_upd := 'api_scope_update_' || t;
    pol_del := 'api_scope_delete_' || t;

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol_read, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol_ins, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol_upd, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol_del, t);

    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR SELECT TO authenticated USING (NOT public.is_api_token() OR public.api_scope_allows(%L, ''read''))',
      pol_read, t, t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (NOT public.is_api_token() OR public.api_scope_allows(%L, ''write''))',
      pol_ins, t, t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated USING (NOT public.is_api_token() OR public.api_scope_allows(%L, ''write'')) WITH CHECK (NOT public.is_api_token() OR public.api_scope_allows(%L, ''write''))',
      pol_upd, t, t, t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated USING (NOT public.is_api_token() OR public.api_scope_allows(%L, ''write''))',
      pol_del, t, t
    );
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- api_tokens: solo metadatos vía SELECT; sin escritura PostgREST (Edge = service_role)
-- ---------------------------------------------------------------------------

REVOKE ALL ON TABLE public.api_tokens FROM anon, authenticated;
GRANT SELECT (
  id,
  agency_id,
  name,
  permissions,
  scopes,
  is_active,
  last_used_at,
  created_at,
  expires_at
) ON public.api_tokens TO authenticated;

-- Políticas permisivas existentes siguen; la RESTRICTIVE api_block_api_tokens ya niega issuer API.
-- Añadir SELECT solo para usuarios app (no API) — ya cubierto por api_block.

COMMENT ON TABLE public.api_tokens IS
  'Metadatos de tokens API. token_hash no es seleccionable por authenticated; create/revoke solo vía Edge Functions (service_role).';
