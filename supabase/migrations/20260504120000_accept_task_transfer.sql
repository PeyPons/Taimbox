-- Aceptación atómica de transferencias de tarea (evita accepted + allocation aún en sender).
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

    RETURN json_build_object(
      'transfer_id', p_transfer_id,
      'allocation_id', v_transfer.allocation_id,
      'mode', 'distribute',
      'new_allocation_id', NULL::uuid
    );
  END IF;

  -- rollover: do not modify original allocation; insert continuation for receiver on next ISO week
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

REVOKE ALL ON FUNCTION public.accept_task_transfer(uuid, text, uuid[], date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_task_transfer(uuid, text, uuid[], date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_task_transfer(uuid, text, uuid[], date) TO service_role;

CREATE INDEX IF NOT EXISTS idx_task_transfers_allocation_id_status
  ON public.task_transfers (allocation_id, status);
