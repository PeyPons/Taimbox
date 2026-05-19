-- Acción explícita de cierre weekly (sustituye depender de prefijos en comments).
ALTER TABLE public.weekly_feedback
ADD COLUMN IF NOT EXISTS weekly_action text;

ALTER TABLE public.weekly_feedback
DROP CONSTRAINT IF EXISTS weekly_feedback_weekly_action_check;

ALTER TABLE public.weekly_feedback
ADD CONSTRAINT weekly_feedback_weekly_action_check
CHECK (
  weekly_action IS NULL
  OR weekly_action = ANY (
    ARRAY['keep', 'postpone', 'distribute', 'transfer', 'justify', 'cancel', 'move']::text[]
  )
);

COMMENT ON COLUMN public.weekly_feedback.weekly_action IS
  'Acción de cierre weekly: keep, postpone, distribute, transfer, justify, cancel, move.';

DROP FUNCTION IF EXISTS public.partial_close_rollover(uuid, numeric, numeric, date, numeric, uuid, text);

CREATE OR REPLACE FUNCTION public.partial_close_rollover(
  p_original_id uuid,
  p_hours_actual numeric,
  p_hours_computed numeric,
  p_dest_week_start date,
  p_new_hours_assigned numeric,
  p_feedback_employee_id uuid,
  p_feedback_comments text,
  p_feedback_weekly_action text DEFAULT 'postpone'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_orig public.allocations%ROWTYPE;
  v_new_id uuid;
  v_actual numeric := COALESCE(p_hours_actual, 0);
BEGIN
  IF v_actual < 0 THEN
    RAISE EXCEPTION 'p_hours_actual cannot be negative';
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
    hours_actual = v_actual,
    hours_computed = COALESCE(p_hours_computed, v_actual),
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

  INSERT INTO public.weekly_feedback (
    employee_id,
    week_start_date,
    project_id,
    allocation_id,
    reason,
    comments,
    weekly_action
  )
  VALUES (
    p_feedback_employee_id,
    v_orig.week_start_date,
    v_orig.project_id,
    p_original_id,
    'other',
    p_feedback_comments,
    COALESCE(NULLIF(p_feedback_weekly_action, ''), 'postpone')
  );

  RETURN v_new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.partial_close_rollover(uuid, numeric, numeric, date, numeric, uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.partial_close_rollover(uuid, numeric, numeric, date, numeric, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.partial_close_rollover(uuid, numeric, numeric, date, numeric, uuid, text, text) TO service_role;
