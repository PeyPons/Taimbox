-- Registro de lo que piden y cierran los agentes (Claude, Codex, Antigravity).
-- El arbol separa la peticion, la deteccion y el trabajo real.
-- Solo las hojas de trabajo de cliente (o gestiones internas) entran en el reparto
-- de tiempo. Si se solapan, el reloj de la persona se divide: no se imputa la hora
-- entera a cada cliente.

-- ---------------------------------------------------------------------------
-- Allowlist de scopes
-- ---------------------------------------------------------------------------

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
    'segmentation_rules',
    'agent_actions'
  ]::text[];
$$;

-- ---------------------------------------------------------------------------
-- Tabla
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.agent_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.agent_actions(id) ON DELETE CASCADE,
  root_id uuid,
  depth integer NOT NULL DEFAULT 0,
  external_id text,
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  allocation_id uuid REFERENCES public.allocations(id) ON DELETE SET NULL,
  tool text NOT NULL,
  category text NOT NULL,
  channel text,
  status text NOT NULL,
  attention text NOT NULL DEFAULT 'shared',
  work_mode text,
  match_status text NOT NULL DEFAULT 'not_required',
  title text NOT NULL,
  outcome text,
  client_label text,
  project_label text,
  employee_label text,
  client_tier text,
  history_ref text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  reported_minutes numeric,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agent_actions_tool_check CHECK (tool IN ('claude', 'codex', 'antigravity', 'other')),
  CONSTRAINT agent_actions_category_check CHECK (category IN ('intake', 'triage', 'client_work', 'internal', 'noise')),
  CONSTRAINT agent_actions_channel_check CHECK (
    channel IS NULL OR channel IN (
      'google_ads', 'meta', 'seo', 'dv360', 'analytics', 'email', 'crm', 'chatgpt_ads', 'internal', 'reporting', 'other'
    )
  ),
  CONSTRAINT agent_actions_status_check CHECK (status IN ('requested', 'in_progress', 'completed', 'cancelled')),
  CONSTRAINT agent_actions_attention_check CHECK (attention IN ('exclusive', 'shared', 'background')),
  CONSTRAINT agent_actions_work_mode_check CHECK (
    work_mode IS NULL OR work_mode IN ('rapida', 'cliente', 'critica', 'repetible')
  ),
  CONSTRAINT agent_actions_match_status_check CHECK (match_status IN ('matched', 'unmatched', 'ambiguous', 'not_required')),
  CONSTRAINT agent_actions_title_len CHECK (char_length(btrim(title)) BETWEEN 1 AND 300),
  CONSTRAINT agent_actions_outcome_len CHECK (outcome IS NULL OR char_length(outcome) <= 2000),
  CONSTRAINT agent_actions_history_len CHECK (history_ref IS NULL OR char_length(history_ref) <= 300),
  CONSTRAINT agent_actions_tier_len CHECK (client_tier IS NULL OR char_length(client_tier) <= 80),
  CONSTRAINT agent_actions_depth_check CHECK (depth BETWEEN 0 AND 6),
  CONSTRAINT agent_actions_time_order CHECK (finished_at IS NULL OR finished_at >= started_at),
  CONSTRAINT agent_actions_reported_minutes_check CHECK (
    reported_minutes IS NULL OR (reported_minutes >= 0 AND reported_minutes <= 1440)
  )
);

COMMENT ON TABLE public.agent_actions IS
  'Arbol de lo que pide y cierra un agente (Claude, Codex, Antigravity). intake/triage/noise no se imputan a un cliente. Las hojas client_work con cliente resuelto, y las hojas internal, se reparten el reloj si se solapan.';

COMMENT ON COLUMN public.agent_actions.category IS
  'intake = peticion humana. triage = deteccion de cliente o canal. client_work = trabajo reconocible de un cliente. internal = gestion interna. noise = descartado, no se muestra ni se imputa.';

COMMENT ON COLUMN public.agent_actions.attention IS
  'exclusive = era lo unico que hacia esa persona. shared = habia otro cliente o agente a la vez. background = el agente corria sin atencion.';

COMMENT ON COLUMN public.agent_actions.history_ref IS
  'Una ruta o ancla del historico usado (README del cliente, ultimo estado). No el contenido.';

COMMENT ON COLUMN public.agent_actions.client_tier IS
  'Etiqueta corta del escalon del cliente en su sistema (responsable, apoyo, cobertura). No es un importe.';

CREATE UNIQUE INDEX IF NOT EXISTS agent_actions_agency_external_id_uidx
  ON public.agent_actions (agency_id, external_id)
  WHERE external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS agent_actions_agency_started_idx
  ON public.agent_actions (agency_id, started_at DESC);

CREATE INDEX IF NOT EXISTS agent_actions_root_idx
  ON public.agent_actions (agency_id, root_id);

CREATE INDEX IF NOT EXISTS agent_actions_parent_idx
  ON public.agent_actions (parent_id);

CREATE INDEX IF NOT EXISTS agent_actions_employee_started_idx
  ON public.agent_actions (agency_id, employee_id, started_at DESC);

-- ---------------------------------------------------------------------------
-- Coherencia del arbol y del emparejado
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.agent_actions_prepare()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_parent public.agent_actions%ROWTYPE;
  v_walk uuid;
  v_step integer;
  v_client_agency uuid;
  v_client_name text;
  v_employee_agency uuid;
  v_project_agency uuid;
  v_project_client uuid;
  v_project_name text;
  v_alloc_agency uuid;
BEGIN
  NEW.tool := lower(btrim(NEW.tool));
  NEW.category := lower(btrim(NEW.category));
  NEW.status := lower(btrim(NEW.status));
  NEW.attention := lower(btrim(COALESCE(NEW.attention, 'shared')));
  NEW.title := btrim(NEW.title);

  IF NEW.channel IS NOT NULL THEN
    NEW.channel := NULLIF(lower(btrim(NEW.channel)), '');
  END IF;
  IF NEW.work_mode IS NOT NULL THEN
    NEW.work_mode := NULLIF(lower(btrim(NEW.work_mode)), '');
  END IF;
  IF NEW.outcome IS NOT NULL THEN
    NEW.outcome := NULLIF(btrim(NEW.outcome), '');
  END IF;
  IF NEW.history_ref IS NOT NULL THEN
    NEW.history_ref := NULLIF(btrim(NEW.history_ref), '');
  END IF;
  IF NEW.client_tier IS NOT NULL THEN
    NEW.client_tier := NULLIF(btrim(NEW.client_tier), '');
  END IF;
  IF NEW.external_id IS NOT NULL THEN
    NEW.external_id := NULLIF(btrim(NEW.external_id), '');
  END IF;

  IF NEW.metadata IS NULL THEN
    NEW.metadata := '{}'::jsonb;
  END IF;
  IF octet_length(NEW.metadata::text) > 4000 THEN
    RAISE EXCEPTION 'metadata demasiado grande: no pegues el hilo ni los documentos';
  END IF;

  IF NEW.started_at IS NULL THEN
    NEW.started_at := now();
  END IF;
  IF NEW.status IN ('requested', 'in_progress') THEN
    NEW.finished_at := NULL;
  ELSIF NEW.status = 'completed' AND NEW.finished_at IS NULL THEN
    NEW.finished_at := now();
  END IF;

  IF NEW.employee_id IS NOT NULL THEN
    SELECT e.agency_id INTO v_employee_agency
    FROM public.employees e
    WHERE e.id = NEW.employee_id;
    IF v_employee_agency IS DISTINCT FROM NEW.agency_id THEN
      RAISE EXCEPTION 'employee_id no pertenece a la agencia';
    END IF;
  END IF;

  IF NEW.client_id IS NOT NULL THEN
    SELECT c.agency_id, c.name INTO v_client_agency, v_client_name
    FROM public.clients c
    WHERE c.id = NEW.client_id;
    IF v_client_agency IS DISTINCT FROM NEW.agency_id THEN
      RAISE EXCEPTION 'client_id no pertenece a la agencia';
    END IF;
    NEW.client_label := v_client_name;
  END IF;

  IF NEW.project_id IS NOT NULL THEN
    SELECT p.agency_id, p.client_id, p.name
    INTO v_project_agency, v_project_client, v_project_name
    FROM public.projects p
    WHERE p.id = NEW.project_id;
    IF v_project_agency IS DISTINCT FROM NEW.agency_id THEN
      RAISE EXCEPTION 'project_id no pertenece a la agencia';
    END IF;
    IF NEW.client_id IS NOT NULL AND v_project_client IS DISTINCT FROM NEW.client_id THEN
      RAISE EXCEPTION 'project_id no pertenece al cliente';
    END IF;
    NEW.project_label := v_project_name;
    IF NEW.client_id IS NULL THEN
      NEW.client_id := v_project_client;
      SELECT c.name INTO v_client_name FROM public.clients c WHERE c.id = NEW.client_id;
      NEW.client_label := v_client_name;
    END IF;
  END IF;

  IF NEW.allocation_id IS NOT NULL THEN
    SELECT a.agency_id INTO v_alloc_agency
    FROM public.allocations a
    WHERE a.id = NEW.allocation_id;
    IF v_alloc_agency IS DISTINCT FROM NEW.agency_id THEN
      RAISE EXCEPTION 'allocation_id no pertenece a la agencia';
    END IF;
  END IF;

  IF NEW.client_id IS NOT NULL THEN
    NEW.match_status := 'matched';
  ELSIF NEW.match_status = 'ambiguous' THEN
    NULL;
  ELSIF NEW.match_status = 'unmatched' THEN
    NULL;
  ELSIF NEW.category = 'client_work' THEN
    NEW.match_status := 'unmatched';
  ELSE
    NEW.match_status := 'not_required';
  END IF;

  IF NEW.parent_id IS NOT NULL THEN
    IF NEW.parent_id = NEW.id THEN
      RAISE EXCEPTION 'un nodo no puede ser padre de si mismo';
    END IF;
    v_walk := NEW.parent_id;
    FOR v_step IN 1..8 LOOP
      IF v_walk = NEW.id THEN
        RAISE EXCEPTION 'ciclo en el arbol de acciones';
      END IF;
      SELECT a.parent_id INTO v_walk
      FROM public.agent_actions a
      WHERE a.id = v_walk;
      EXIT WHEN v_walk IS NULL;
    END LOOP;

    SELECT * INTO v_parent
    FROM public.agent_actions
    WHERE id = NEW.parent_id;
    IF NOT FOUND OR v_parent.agency_id <> NEW.agency_id THEN
      RAISE EXCEPTION 'parent_id no pertenece a la agencia';
    END IF;
    IF v_parent.depth >= 6 THEN
      RAISE EXCEPTION 'arbol demasiado profundo';
    END IF;
    NEW.root_id := COALESCE(v_parent.root_id, v_parent.id);
    NEW.depth := v_parent.depth + 1;
  ELSE
    NEW.root_id := NEW.id;
    NEW.depth := 0;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS agent_actions_prepare ON public.agent_actions;
CREATE TRIGGER agent_actions_prepare
  BEFORE INSERT OR UPDATE ON public.agent_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.agent_actions_prepare();

CREATE OR REPLACE FUNCTION public.agent_actions_sync_descendants()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW.root_id IS DISTINCT FROM OLD.root_id
     OR NEW.depth IS DISTINCT FROM OLD.depth
     OR NEW.parent_id IS DISTINCT FROM OLD.parent_id
  THEN
    WITH RECURSIVE tree AS (
      SELECT c.id, 1 AS rel
      FROM public.agent_actions c
      WHERE c.parent_id = NEW.id
      UNION ALL
      SELECT c.id, t.rel + 1
      FROM public.agent_actions c
      JOIN tree t ON c.parent_id = t.id
      WHERE t.rel < 8
    )
    UPDATE public.agent_actions a
    SET root_id = NEW.root_id,
        depth = NEW.depth + tree.rel
    FROM tree
    WHERE a.id = tree.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS agent_actions_sync_descendants ON public.agent_actions;
CREATE TRIGGER agent_actions_sync_descendants
  AFTER UPDATE ON public.agent_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.agent_actions_sync_descendants();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.agent_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agent_actions_select ON public.agent_actions;
CREATE POLICY agent_actions_select ON public.agent_actions
  FOR SELECT TO authenticated
  USING (agency_id IN (SELECT public.user_agency_ids()));

DROP POLICY IF EXISTS agent_actions_insert ON public.agent_actions;
CREATE POLICY agent_actions_insert ON public.agent_actions
  FOR INSERT TO authenticated
  WITH CHECK (
    agency_id IN (SELECT public.user_agency_ids())
    AND public.can_write_via_api()
  );

DROP POLICY IF EXISTS agent_actions_update ON public.agent_actions;
CREATE POLICY agent_actions_update ON public.agent_actions
  FOR UPDATE TO authenticated
  USING (
    agency_id IN (SELECT public.user_agency_ids())
    AND public.can_write_via_api()
  )
  WITH CHECK (
    agency_id IN (SELECT public.user_agency_ids())
    AND public.can_write_via_api()
  );

DROP POLICY IF EXISTS agent_actions_delete ON public.agent_actions;
CREATE POLICY agent_actions_delete ON public.agent_actions
  FOR DELETE TO authenticated
  USING (
    agency_id IN (SELECT public.user_agency_ids())
    AND public.can_write_via_api()
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_actions TO authenticated;
GRANT ALL ON public.agent_actions TO service_role;

DROP POLICY IF EXISTS api_scope_select_agent_actions ON public.agent_actions;
DROP POLICY IF EXISTS api_scope_insert_agent_actions ON public.agent_actions;
DROP POLICY IF EXISTS api_scope_update_agent_actions ON public.agent_actions;
DROP POLICY IF EXISTS api_scope_delete_agent_actions ON public.agent_actions;

CREATE POLICY api_scope_select_agent_actions ON public.agent_actions
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (NOT public.is_api_token() OR public.api_scope_allows('agent_actions', 'read'));

CREATE POLICY api_scope_insert_agent_actions ON public.agent_actions
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (NOT public.is_api_token() OR public.api_scope_allows('agent_actions', 'write'));

CREATE POLICY api_scope_update_agent_actions ON public.agent_actions
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (NOT public.is_api_token() OR public.api_scope_allows('agent_actions', 'write'))
  WITH CHECK (NOT public.is_api_token() OR public.api_scope_allows('agent_actions', 'write'));

CREATE POLICY api_scope_delete_agent_actions ON public.agent_actions
  AS RESTRICTIVE FOR DELETE TO authenticated
  USING (NOT public.is_api_token() OR public.api_scope_allows('agent_actions', 'write'));

-- Tokens que ya tenian el catalogo completo anterior reciben el recurso nuevo
-- sin reemitir el JWT: api_effective_scopes lee api_tokens.scopes.
UPDATE public.api_tokens
SET scopes = (
  SELECT ARRAY(
    SELECT DISTINCT s
    FROM unnest(scopes || ARRAY['agent_actions']::text[]) AS s
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
  'task_transfers',
  'ad_accounts_config',
  'google_ads_campaigns',
  'meta_ads_campaigns',
  'segmentation_rules'
]::text[]
  AND NOT (scopes @> ARRAY['agent_actions']::text[]);

-- ---------------------------------------------------------------------------
-- Alta idempotente para los agentes
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.record_agent_action(
  p_agency_id uuid,
  p_external_id text,
  p_tool text,
  p_category text,
  p_title text,
  p_status text DEFAULT 'completed',
  p_parent_external_id text DEFAULT NULL,
  p_channel text DEFAULT NULL,
  p_attention text DEFAULT 'shared',
  p_outcome text DEFAULT NULL,
  p_started_at timestamptz DEFAULT NULL,
  p_finished_at timestamptz DEFAULT NULL,
  p_employee_id uuid DEFAULT NULL,
  p_employee_name text DEFAULT NULL,
  p_client_id uuid DEFAULT NULL,
  p_client_name text DEFAULT NULL,
  p_project_id uuid DEFAULT NULL,
  p_project_name text DEFAULT NULL,
  p_allocation_id uuid DEFAULT NULL,
  p_client_tier text DEFAULT NULL,
  p_history_ref text DEFAULT NULL,
  p_work_mode text DEFAULT NULL,
  p_reported_minutes numeric DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_external text := NULLIF(btrim(COALESCE(p_external_id, '')), '');
  v_parent_external text := NULLIF(btrim(COALESCE(p_parent_external_id, '')), '');
  v_parent_id uuid;
  v_employee_id uuid;
  v_client_id uuid;
  v_client_before uuid;
  v_project_id uuid;
  v_match text := 'not_required';
  v_employee_label text := NULLIF(btrim(COALESCE(p_employee_name, '')), '');
  v_client_label text := NULLIF(btrim(COALESCE(p_client_name, '')), '');
  v_project_label text := NULLIF(btrim(COALESCE(p_project_name, '')), '');
  v_name text;
  v_warnings jsonb := '[]'::jsonb;
  v_count integer;
  v_existing uuid;
  v_row public.agent_actions%ROWTYPE;
  v_category text := lower(btrim(COALESCE(p_category, '')));
BEGIN
  IF p_agency_id IS NULL OR v_external IS NULL OR p_tool IS NULL OR p_title IS NULL THEN
    RAISE EXCEPTION 'agency_id, external_id, tool y title son obligatorios';
  END IF;

  IF NOT (p_agency_id IN (SELECT public.user_agency_ids())) THEN
    RAISE EXCEPTION 'agency_forbidden' USING ERRCODE = '42501';
  END IF;
  IF NOT public.can_write_via_api() THEN
    RAISE EXCEPTION 'readonly_token' USING ERRCODE = '42501';
  END IF;
  IF public.is_api_token() AND NOT public.api_scope_allows('agent_actions', 'write') THEN
    RAISE EXCEPTION 'scope_denied' USING ERRCODE = '42501';
  END IF;

  IF v_parent_external IS NOT NULL THEN
    SELECT a.id INTO v_parent_id
    FROM public.agent_actions a
    WHERE a.agency_id = p_agency_id
      AND a.external_id = v_parent_external;
    IF v_parent_id IS NULL THEN
      RAISE EXCEPTION 'parent_not_found: crea antes el nodo padre';
    END IF;
  END IF;

  v_employee_id := p_employee_id;
  IF v_employee_id IS NOT NULL THEN
    PERFORM 1 FROM public.employees e
    WHERE e.id = v_employee_id AND e.agency_id = p_agency_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'employee_id no pertenece a la agencia';
    END IF;
  ELSIF v_employee_label IS NOT NULL THEN
    v_name := lower(v_employee_label);
    SELECT count(*) INTO v_count
    FROM public.employees e
    WHERE e.agency_id = p_agency_id
      AND (
        lower(btrim(e.name)) = v_name
        OR lower(btrim(COALESCE(e.email, ''))) = v_name
      );
    IF v_count = 1 THEN
      SELECT e.id, e.name INTO v_employee_id, v_employee_label
      FROM public.employees e
      WHERE e.agency_id = p_agency_id
        AND (
          lower(btrim(e.name)) = v_name
          OR lower(btrim(COALESCE(e.email, ''))) = v_name
        );
    ELSIF v_count > 1 THEN
      v_employee_id := NULL;
      v_warnings := v_warnings || jsonb_build_array('employee_ambiguous');
    ELSE
      v_warnings := v_warnings || jsonb_build_array('employee_unmatched');
    END IF;
  END IF;

  v_client_id := p_client_id;
  IF v_client_id IS NOT NULL THEN
    PERFORM 1 FROM public.clients c
    WHERE c.id = v_client_id AND c.agency_id = p_agency_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'client_id no pertenece a la agencia';
    END IF;
    v_match := 'matched';
  ELSIF v_client_label IS NOT NULL THEN
    v_name := lower(v_client_label);
    SELECT count(*) INTO v_count
    FROM public.clients c
    WHERE c.agency_id = p_agency_id
      AND lower(btrim(c.name)) = v_name;
    IF v_count = 1 THEN
      SELECT c.id, c.name INTO v_client_id, v_client_label
      FROM public.clients c
      WHERE c.agency_id = p_agency_id
        AND lower(btrim(c.name)) = v_name;
      v_match := 'matched';
    ELSIF v_count > 1 THEN
      v_match := 'ambiguous';
      v_warnings := v_warnings || jsonb_build_array('client_ambiguous');
    ELSE
      v_match := 'unmatched';
      v_warnings := v_warnings || jsonb_build_array('client_unmatched');
    END IF;
  ELSIF v_category = 'client_work' THEN
    v_match := 'unmatched';
    v_warnings := v_warnings || jsonb_build_array('client_unmatched');
  ELSE
    v_match := 'not_required';
  END IF;

  v_project_id := p_project_id;
  IF v_project_id IS NOT NULL THEN
    PERFORM 1 FROM public.projects p
    WHERE p.id = v_project_id AND p.agency_id = p_agency_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'project_id no pertenece a la agencia';
    END IF;
  ELSIF v_project_label IS NOT NULL THEN
    v_name := lower(v_project_label);
    v_client_before := v_client_id;
    SELECT count(*) INTO v_count
    FROM public.projects p
    WHERE p.agency_id = p_agency_id
      AND lower(btrim(p.name)) = v_name
      AND (v_client_before IS NULL OR p.client_id = v_client_before);
    IF v_count = 1 THEN
      SELECT p.id, p.name, p.client_id INTO v_project_id, v_project_label, v_client_id
      FROM public.projects p
      WHERE p.agency_id = p_agency_id
        AND lower(btrim(p.name)) = v_name
        AND (v_client_before IS NULL OR p.client_id = v_client_before);
      v_match := 'matched';
    ELSIF v_count > 1 THEN
      v_warnings := v_warnings || jsonb_build_array('project_ambiguous');
    ELSE
      v_warnings := v_warnings || jsonb_build_array('project_unmatched');
    END IF;
  END IF;

  SELECT a.id INTO v_existing
  FROM public.agent_actions a
  WHERE a.agency_id = p_agency_id
    AND a.external_id = v_external;

  IF v_existing IS NULL THEN
    INSERT INTO public.agent_actions (
      agency_id, parent_id, external_id, employee_id, client_id, project_id, allocation_id,
      tool, category, channel, status, attention, work_mode, match_status,
      title, outcome, client_label, project_label, employee_label, client_tier, history_ref,
      started_at, finished_at, reported_minutes, metadata
    ) VALUES (
      p_agency_id, v_parent_id, v_external, v_employee_id, v_client_id, v_project_id, p_allocation_id,
      p_tool, p_category, p_channel, COALESCE(NULLIF(btrim(p_status), ''), 'completed'),
      COALESCE(NULLIF(btrim(p_attention), ''), 'shared'), p_work_mode, v_match,
      p_title, p_outcome, v_client_label, v_project_label, v_employee_label, p_client_tier, p_history_ref,
      p_started_at, p_finished_at, p_reported_minutes, COALESCE(p_metadata, '{}'::jsonb)
    )
    RETURNING * INTO v_row;
  ELSE
    UPDATE public.agent_actions SET
      parent_id = v_parent_id,
      employee_id = v_employee_id,
      client_id = v_client_id,
      project_id = v_project_id,
      allocation_id = p_allocation_id,
      tool = p_tool,
      category = p_category,
      channel = p_channel,
      status = COALESCE(NULLIF(btrim(p_status), ''), 'completed'),
      attention = COALESCE(NULLIF(btrim(p_attention), ''), 'shared'),
      work_mode = p_work_mode,
      match_status = v_match,
      title = p_title,
      outcome = p_outcome,
      client_label = v_client_label,
      project_label = v_project_label,
      employee_label = v_employee_label,
      client_tier = p_client_tier,
      history_ref = p_history_ref,
      started_at = COALESCE(p_started_at, started_at),
      finished_at = CASE
        WHEN lower(btrim(COALESCE(NULLIF(btrim(p_status), ''), 'completed'))) IN ('requested', 'in_progress') THEN NULL
        ELSE COALESCE(p_finished_at, finished_at)
      END,
      reported_minutes = p_reported_minutes,
      metadata = COALESCE(p_metadata, '{}'::jsonb)
    WHERE id = v_existing
    RETURNING * INTO v_row;
  END IF;

  RETURN to_jsonb(v_row) || jsonb_build_object('warnings', v_warnings);
END;
$$;

REVOKE ALL ON FUNCTION public.record_agent_action(
  uuid, text, text, text, text, text, text, text, text, text, timestamptz, timestamptz,
  uuid, text, uuid, text, uuid, text, uuid, text, text, text, numeric, jsonb
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.record_agent_action(
  uuid, text, text, text, text, text, text, text, text, text, timestamptz, timestamptz,
  uuid, text, uuid, text, uuid, text, uuid, text, text, text, numeric, jsonb
) TO authenticated, service_role;

COMMENT ON FUNCTION public.record_agent_action(
  uuid, text, text, text, text, text, text, text, text, text, timestamptz, timestamptz,
  uuid, text, uuid, text, uuid, text, uuid, text, text, text, numeric, jsonb
) IS
  'Upsert de un nodo del arbol de agentes. Resuelve empleado, cliente y proyecto por nombre exacto dentro de la agencia. No adivina si hay varios. warnings indica unmatched o ambiguous.';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'agent_actions'
     )
  THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_actions;
  END IF;
END;
$$;
