-- Vista diaria (modelo Pull): foco del empleado por fecha local persistida en servidor
ALTER TABLE public.allocations
ADD COLUMN IF NOT EXISTS focus_date date DEFAULT NULL;

COMMENT ON COLUMN public.allocations.focus_date IS 'Fecha (día local del empleado) en que la tarea está en foco; NULL = backlog. No afecta a hours_assigned ni métricas financieras.';

-- Cierre parcial atómico: completar allocation original + crear continuación + auditoría weekly_feedback
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

REVOKE ALL ON FUNCTION public.partial_close_rollover(uuid, numeric, numeric, date, numeric, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.partial_close_rollover(uuid, numeric, numeric, date, numeric, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.partial_close_rollover(uuid, numeric, numeric, date, numeric, uuid, text) TO service_role;
