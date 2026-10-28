-- Abre las tablas operativas de Ads a la API de integración (scopes),
-- en lugar de la política RESTRICTIVE que las negaba por completo.
-- Los logs de sincronización y google_ads_changes siguen fuera.

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
    'task_transfers',
    'ad_accounts_config',
    'google_ads_campaigns',
    'meta_ads_campaigns',
    'segmentation_rules'
  ]::text[];
$$;

-- La fila de api_tokens es la fuente de verdad: un JWT ya emitido
-- no trae los scopes nuevos, pero el backfill de abajo sí.
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
  row_scopes text[];
  jwt_agency uuid;
  jwt_sub uuid;
  filtered text[];
BEGIN
  IF NOT public.is_api_token() THEN
    RETURN NULL;
  END IF;

  jwt := auth.jwt();

  BEGIN
    jwt_agency := (jwt->>'agency_id')::uuid;
    jwt_sub := (jwt->>'sub')::uuid;
  EXCEPTION WHEN OTHERS THEN
    jwt_agency := NULL;
    jwt_sub := NULL;
  END;

  IF jwt_agency IS NOT NULL AND jwt_sub IS NOT NULL THEN
    SELECT t.scopes
    INTO row_scopes
    FROM public.api_tokens t
    WHERE t.id = jwt_sub
      AND t.agency_id = jwt_agency
      AND t.is_active = true
      AND (t.expires_at IS NULL OR t.expires_at > now());

    IF row_scopes IS NOT NULL AND cardinality(row_scopes) > 0 THEN
      SELECT COALESCE(array_agg(x), ARRAY[]::text[])
      INTO filtered
      FROM (
        SELECT DISTINCT s AS x
        FROM unnest(row_scopes) AS s
        WHERE s = ANY (public.api_default_scopes())
      ) q;
      RETURN COALESCE(filtered, ARRAY[]::text[]);
    END IF;

    IF row_scopes IS NOT NULL AND cardinality(row_scopes) = 0 THEN
      RETURN public.api_default_scopes();
    END IF;
  END IF;

  jwt_scopes := jwt->'scopes';
  IF jwt_scopes IS NOT NULL AND jsonb_typeof(jwt_scopes) = 'array' AND jsonb_array_length(jwt_scopes) > 0 THEN
    SELECT COALESCE(array_agg(x), ARRAY[]::text[])
    INTO filtered
    FROM (
      SELECT DISTINCT trim(both '"' from value::text) AS x
      FROM jsonb_array_elements(jwt_scopes)
      WHERE trim(both '"' from value::text) = ANY (public.api_default_scopes())
    ) s;
    IF filtered IS NOT NULL AND cardinality(filtered) > 0 THEN
      RETURN filtered;
    END IF;
  END IF;

  RETURN ARRAY[]::text[];
END;
$$;

COMMENT ON FUNCTION public.api_effective_scopes() IS
  'Scopes del token API. Prioriza api_tokens.scopes (filtrado a la allowlist) para que un alta de recurso valga sin reemitir el JWT.';

-- Tokens que ya tenían el catálogo completo anterior reciben Ads.
UPDATE public.api_tokens
SET scopes = (
  SELECT ARRAY(
    SELECT DISTINCT s
    FROM unnest(
      scopes || ARRAY[
        'ad_accounts_config',
        'google_ads_campaigns',
        'meta_ads_campaigns',
        'segmentation_rules'
      ]::text[]
    ) AS s
  )
)
WHERE scopes @> ARRAY[
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

DO $$
DECLARE
  ads text[] := ARRAY[
    'ad_accounts_config',
    'google_ads_campaigns',
    'meta_ads_campaigns',
    'segmentation_rules'
  ];
  t text;
  pol text;
BEGIN
  FOREACH t IN ARRAY ads LOOP
    pol := 'api_block_' || t;
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'api_scope_select_' || t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'api_scope_insert_' || t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'api_scope_update_' || t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'api_scope_delete_' || t, t);

    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR SELECT TO authenticated USING (NOT public.is_api_token() OR public.api_scope_allows(%L, ''read''))',
      'api_scope_select_' || t, t, t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (NOT public.is_api_token() OR public.api_scope_allows(%L, ''write''))',
      'api_scope_insert_' || t, t, t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated USING (NOT public.is_api_token() OR public.api_scope_allows(%L, ''write'')) WITH CHECK (NOT public.is_api_token() OR public.api_scope_allows(%L, ''write''))',
      'api_scope_update_' || t, t, t, t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated USING (NOT public.is_api_token() OR public.api_scope_allows(%L, ''write''))',
      'api_scope_delete_' || t, t, t
    );
  END LOOP;
END;
$$;
