-- Anotaciones persistentes por tarea (allocation_notes) + copia en ciclo de vida.

-- ---------------------------------------------------------------------------
-- Tabla allocation_notes
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.allocation_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_id uuid NOT NULL REFERENCES public.allocations(id) ON DELETE CASCADE,
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  author_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  body text NOT NULL,
  source text NOT NULL DEFAULT 'user'
    CHECK (source IN ('user', 'legacy_description', 'system_copy')),
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT allocation_notes_body_not_empty CHECK (length(btrim(body)) > 0),
  CONSTRAINT allocation_notes_body_max_len CHECK (length(body) <= 10000)
);

COMMENT ON TABLE public.allocation_notes IS
  'Anotaciones append-only por allocation (tarea semanal). Distinto de weekly_feedback.comments y time_entries.notes.';

CREATE INDEX IF NOT EXISTS idx_allocation_notes_allocation_created
  ON public.allocation_notes (allocation_id, created_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_allocation_notes_agency_id
  ON public.allocation_notes (agency_id);

-- ---------------------------------------------------------------------------
-- Copiar notas entre allocations (rollover, transferencia, distribución)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.copy_allocation_notes(
  p_from uuid,
  p_to uuid,
  p_source text DEFAULT 'system_copy'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from_agency uuid;
  v_to_agency uuid;
  v_count integer;
BEGIN
  IF p_from IS NULL OR p_to IS NULL OR p_from = p_to THEN
    RETURN 0;
  END IF;

  SELECT e.agency_id INTO v_from_agency
  FROM public.allocations a
  JOIN public.employees e ON e.id = a.employee_id
  WHERE a.id = p_from;

  SELECT e.agency_id INTO v_to_agency
  FROM public.allocations a
  JOIN public.employees e ON e.id = a.employee_id
  WHERE a.id = p_to;

  IF v_from_agency IS NULL OR v_to_agency IS NULL OR v_from_agency <> v_to_agency THEN
    RAISE EXCEPTION 'allocations agency mismatch or not found';
  END IF;

  INSERT INTO public.allocation_notes (
    allocation_id,
    agency_id,
    author_employee_id,
    body,
    source,
    created_at
  )
  SELECT
    p_to,
    n.agency_id,
    n.author_employee_id,
    n.body,
    COALESCE(NULLIF(btrim(p_source), ''), 'system_copy'),
    n.created_at
  FROM public.allocation_notes n
  WHERE n.allocation_id = p_from
    AND n.deleted_at IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.copy_allocation_notes(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.copy_allocation_notes(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.copy_allocation_notes(uuid, uuid, text) TO service_role;

-- ---------------------------------------------------------------------------
-- Migración legacy: allocations.description → allocation_notes
-- ---------------------------------------------------------------------------

INSERT INTO public.allocation_notes (
  allocation_id,
  agency_id,
  author_employee_id,
  body,
  source,
  created_at
)
SELECT
  a.id,
  e.agency_id,
  a.employee_id,
  btrim(a.description),
  'legacy_description',
  COALESCE(a.created_at, now())
FROM public.allocations a
JOIN public.employees e ON e.id = a.employee_id
WHERE a.description IS NOT NULL
  AND length(btrim(a.description)) > 0
  AND NOT EXISTS (
    SELECT 1
    FROM public.allocation_notes n
    WHERE n.allocation_id = a.id
      AND n.source = 'legacy_description'
  );

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.allocation_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY allocation_notes_select ON public.allocation_notes
  FOR SELECT
  USING (agency_id IN (SELECT public.user_agency_ids()));

CREATE POLICY allocation_notes_insert ON public.allocation_notes
  FOR INSERT
  WITH CHECK (
    agency_id IN (SELECT public.user_agency_ids())
    AND public.can_write_via_api()
    AND EXISTS (
      SELECT 1
      FROM public.allocations al
      JOIN public.employees e ON e.id = al.employee_id
      WHERE al.id = allocation_id
        AND e.agency_id = allocation_notes.agency_id
    )
    AND (
      author_employee_id IS NULL
      OR author_employee_id IN (
        SELECT e.id
        FROM public.employees e
        WHERE e.user_id = auth.uid()
          AND e.agency_id = allocation_notes.agency_id
          AND e.is_active = true
      )
    )
  );

CREATE POLICY allocation_notes_update ON public.allocation_notes
  FOR UPDATE
  USING (
    deleted_at IS NULL
    AND agency_id IN (SELECT public.user_agency_ids())
    AND public.can_write_via_api()
    AND (
      public.is_agency_admin(auth.uid(), agency_id)
      OR author_employee_id IN (
        SELECT e.id
        FROM public.employees e
        WHERE e.user_id = auth.uid()
          AND e.agency_id = allocation_notes.agency_id
          AND e.is_active = true
      )
    )
  )
  WITH CHECK (
    agency_id IN (SELECT public.user_agency_ids())
    AND deleted_at IS NOT NULL
  );

-- ---------------------------------------------------------------------------
-- audit_logs: permitir recurso ALLOCATION_NOTE
-- ---------------------------------------------------------------------------

ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_resource_check;

ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_resource_check
  CHECK (resource = ANY (ARRAY[
    'ALLOCATION'::text,
    'ALLOCATION_NOTE'::text,
    'PROJECT'::text,
    'EMPLOYEE'::text,
    'CLIENT'::text,
    'ABSENCE'::text,
    'TEAM_EVENT'::text
  ]));

-- ---------------------------------------------------------------------------
-- partial_close_rollover: copiar notas al hijo
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.partial_close_rollover(
  p_original_id uuid,
  p_hours_actual numeric,
  p_hours_computed numeric,
  p_dest_week_start date,
  p_new_hours_assigned numeric,
  p_feedback_employee_id uuid,
  p_feedback_comments text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_orig public.allocations%ROWTYPE;
  v_new_id uuid;
BEGIN
  IF p_hours_actual IS NULL OR p_hours_actual <= 0 THEN
    RAISE EXCEPTION 'p_hours_actual must be > 0';
  END IF;
  IF p_new_hours_assigned IS NULL OR p_new_hours_assigned <= 0 THEN
    RAISE EXCEPTION 'p_new_hours_assigned must be > 0';
  END IF;

  SELECT * INTO v_orig FROM public.allocations WHERE id = p_original_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'allocation not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.employees e
    INNER JOIN public.user_agencies ua ON ua.user_id = auth.uid() AND ua.agency_id = e.agency_id
    WHERE e.id = v_orig.employee_id
  ) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE public.allocations
  SET
    hours_actual = p_hours_actual,
    hours_computed = p_hours_computed,
    status = 'completed'
  WHERE id = p_original_id;

  INSERT INTO public.allocations (
    employee_id,
    project_id,
    week_start_date,
    hours_assigned,
    hours_actual,
    hours_computed,
    status,
    description,
    task_name,
    dependency_id,
    transferred_from_allocation_id,
    distribution_source_allocation_id,
    parent_allocation_id,
    original_transferred_task_name,
    transfer_source_employee_id,
    user_priority,
    is_locked,
    focus_date
  )
  VALUES (
    v_orig.employee_id,
    v_orig.project_id,
    p_dest_week_start,
    p_new_hours_assigned,
    0,
    0,
    'planned',
    v_orig.description,
    v_orig.task_name,
    v_orig.dependency_id,
    v_orig.transferred_from_allocation_id,
    v_orig.distribution_source_allocation_id,
    p_original_id,
    v_orig.original_transferred_task_name,
    v_orig.transfer_source_employee_id,
    v_orig.user_priority,
    COALESCE(v_orig.is_locked, false),
    NULL
  )
  RETURNING id INTO v_new_id;

  PERFORM public.copy_allocation_notes(p_original_id, v_new_id, 'system_copy');

  INSERT INTO public.weekly_feedback (
    employee_id,
    week_start_date,
    project_id,
    allocation_id,
    reason,
    comments
  )
  VALUES (
    p_feedback_employee_id,
    v_orig.week_start_date,
    v_orig.project_id,
    p_original_id,
    'other',
    p_feedback_comments
  );

  RETURN v_new_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- accept_task_transfer: copiar notas en rollover; keep/move/distribute conservan id
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.accept_task_transfer(
  p_transfer_id uuid,
  p_acceptance_mode text,
  p_result_allocation_ids uuid[] DEFAULT ARRAY[]::uuid[],
  p_target_week date DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transfer public.task_transfers%ROWTYPE;
  v_alloc public.allocations%ROWTYPE;
  v_receiver_id uuid;
  v_new_id uuid;
  v_next_week date;
  v_mode text;
  v_child_id uuid;
BEGIN
  v_mode := lower(trim(p_acceptance_mode));

  IF v_mode NOT IN ('keep', 'move', 'distribute', 'rollover') THEN
    RAISE EXCEPTION 'acceptance_mode invalid: %', p_acceptance_mode USING ERRCODE = '22023';
  END IF;

  IF v_mode = 'move' AND p_target_week IS NULL THEN
    RAISE EXCEPTION 'p_target_week is required for move mode' USING ERRCODE = '22023';
  END IF;

  SELECT id INTO v_receiver_id
  FROM public.employees
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_receiver_id IS NULL THEN
    RAISE EXCEPTION 'no employee linked to current user' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_transfer
  FROM public.task_transfers
  WHERE id = p_transfer_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'transfer % not found or not pending', p_transfer_id USING ERRCODE = 'P0002';
  END IF;

  IF v_transfer.to_employee_id <> v_receiver_id THEN
    RAISE EXCEPTION 'only the receiver can accept this transfer' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = v_receiver_id AND e.agency_id = v_transfer.agency_id
  ) THEN
    RAISE EXCEPTION 'receiver agency mismatch' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_alloc
  FROM public.allocations
  WHERE id = v_transfer.allocation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'allocation % not found', v_transfer.allocation_id USING ERRCODE = 'P0002';
  END IF;

  IF v_alloc.employee_id <> v_transfer.from_employee_id THEN
    RAISE EXCEPTION 'allocation is no longer owned by the sender' USING ERRCODE = '23503';
  END IF;

  IF v_mode IN ('keep', 'move') THEN
    UPDATE public.task_transfers
    SET
      status = 'accepted',
      responded_at = now(),
      acceptance_mode = v_mode,
      result_allocation_ids = COALESCE(p_result_allocation_ids, ARRAY[]::uuid[])
    WHERE id = p_transfer_id;

    UPDATE public.allocations
    SET
      employee_id = v_transfer.to_employee_id,
      transfer_source_employee_id = v_transfer.from_employee_id,
      original_transferred_task_name = v_alloc.task_name,
      week_start_date = CASE WHEN v_mode = 'move' THEN p_target_week ELSE v_alloc.week_start_date END
    WHERE id = v_transfer.allocation_id;

    RETURN json_build_object(
      'transfer_id', p_transfer_id,
      'allocation_id', v_transfer.allocation_id,
      'mode', v_mode,
      'new_allocation_id', NULL::uuid
    );
  END IF;

  IF v_mode = 'distribute' THEN
    IF p_result_allocation_ids IS NULL OR COALESCE(cardinality(p_result_allocation_ids), 0) < 1 THEN
      RAISE EXCEPTION 'distribute requires non-empty p_result_allocation_ids' USING ERRCODE = '22023';
    END IF;

    UPDATE public.task_transfers
    SET
      status = 'accepted',
      responded_at = now(),
      acceptance_mode = 'distribute',
      result_allocation_ids = p_result_allocation_ids
    WHERE id = p_transfer_id;

    UPDATE public.allocations
    SET
      hours_assigned = 0,
      is_locked = true,
      transfer_source_employee_id = v_transfer.from_employee_id,
      original_transferred_task_name = v_alloc.task_name
    WHERE id = v_transfer.allocation_id;

    FOREACH v_child_id IN ARRAY p_result_allocation_ids LOOP
      PERFORM public.copy_allocation_notes(v_transfer.allocation_id, v_child_id, 'system_copy');
    END LOOP;

    RETURN json_build_object(
      'transfer_id', p_transfer_id,
      'allocation_id', v_transfer.allocation_id,
      'mode', 'distribute',
      'new_allocation_id', NULL::uuid
    );
  END IF;

  v_next_week := (v_alloc.week_start_date + interval '7 days')::date;

  INSERT INTO public.allocations (
    employee_id,
    project_id,
    week_start_date,
    hours_assigned,
    hours_actual,
    hours_computed,
    status,
    description,
    task_name,
    dependency_id,
    transferred_from_allocation_id,
    distribution_source_allocation_id,
    parent_allocation_id,
    original_transferred_task_name,
    transfer_source_employee_id,
    user_priority,
    is_locked,
    focus_date
  )
  VALUES (
    v_transfer.to_employee_id,
    v_alloc.project_id,
    v_next_week,
    v_transfer.hours_transferred,
    0,
    0,
    'planned',
    v_alloc.description,
    v_alloc.task_name,
    v_alloc.dependency_id,
    v_transfer.allocation_id,
    v_alloc.distribution_source_allocation_id,
    v_alloc.parent_allocation_id,
    v_alloc.task_name,
    v_transfer.from_employee_id,
    v_alloc.user_priority,
    false,
    NULL
  )
  RETURNING id INTO v_new_id;

  PERFORM public.copy_allocation_notes(v_transfer.allocation_id, v_new_id, 'system_copy');

  UPDATE public.task_transfers
  SET
    status = 'accepted',
    responded_at = now(),
    acceptance_mode = 'rollover',
    result_allocation_ids = ARRAY[v_new_id]::uuid[]
  WHERE id = p_transfer_id;

  RETURN json_build_object(
    'transfer_id', p_transfer_id,
    'allocation_id', v_transfer.allocation_id,
    'mode', 'rollover',
    'new_allocation_id', v_new_id
  );
END;
$$;
