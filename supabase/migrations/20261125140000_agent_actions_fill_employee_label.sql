-- Si llega employee_id (o client_id / project_id), rellenar siempre el label
-- desde la tabla maestra para que /agentes no muestre "Sin persona".

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
    SELECT e.id, e.name INTO v_employee_id, v_employee_label
    FROM public.employees e
    WHERE e.id = v_employee_id AND e.agency_id = p_agency_id;
    IF v_employee_id IS NULL THEN
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
  ELSE
    v_warnings := v_warnings || jsonb_build_array('employee_missing');
  END IF;

  v_client_id := p_client_id;
  IF v_client_id IS NOT NULL THEN
    SELECT c.id, c.name INTO v_client_id, v_client_label
    FROM public.clients c
    WHERE c.id = v_client_id AND c.agency_id = p_agency_id;
    IF v_client_id IS NULL THEN
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
    SELECT p.id, p.name, p.client_id INTO v_project_id, v_project_label, v_client_before
    FROM public.projects p
    WHERE p.id = v_project_id AND p.agency_id = p_agency_id;
    IF v_project_id IS NULL THEN
      RAISE EXCEPTION 'project_id no pertenece a la agencia';
    END IF;
    IF v_client_id IS NULL AND v_client_before IS NOT NULL THEN
      v_client_id := v_client_before;
      SELECT c.name INTO v_client_label FROM public.clients c WHERE c.id = v_client_id;
      IF v_match = 'not_required' AND v_category = 'client_work' THEN
        v_match := 'matched';
      END IF;
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
      IF v_client_before IS NULL AND v_client_id IS NOT NULL THEN
        SELECT c.name INTO v_client_label FROM public.clients c WHERE c.id = v_client_id;
      ELSE
        v_client_id := COALESCE(v_client_before, v_client_id);
      END IF;
      IF v_match IN ('not_required', 'unmatched') AND v_category = 'client_work' AND v_client_id IS NOT NULL THEN
        v_match := 'matched';
      END IF;
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

COMMENT ON FUNCTION public.record_agent_action IS
  'Upsert de agent_actions. Rellena employee_label/client_label/project_label desde maestros cuando llega el id.';
