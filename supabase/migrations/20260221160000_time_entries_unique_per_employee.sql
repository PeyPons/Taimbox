-- time_entries debe ser una fila por EMPLEADO por asignación por día, no una fila por asignación por día.
-- Con UNIQUE (allocation_id, date) la RPC actualizaba la única fila del día; si esa fila era de otro
-- empleado (p. ej. datos legacy), el usuario actual no la ve por RLS y veía su propia fila con hours=0.
-- Solución: UNIQUE (employee_id, allocation_id, date) y UPSERT por esa clave.

-- 1. Quitar la restricción antigua
ALTER TABLE public.time_entries
DROP CONSTRAINT IF EXISTS time_entries_allocation_date_unique;

-- 2. Nueva restricción: una fila por empleado por asignación por día
ALTER TABLE public.time_entries
ADD CONSTRAINT time_entries_employee_allocation_date_unique UNIQUE (employee_id, allocation_id, date);

-- 3. RPC: UPSERT por (employee_id, allocation_id, date)
CREATE OR REPLACE FUNCTION public.log_timer_hours(
  p_employee_id uuid,
  p_allocation_id uuid,
  p_hours numeric,
  p_notes text DEFAULT NULL,
  p_date date DEFAULT CURRENT_DATE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_started_at timestamptz;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != (SELECT user_id FROM public.employees WHERE id = p_employee_id) THEN
    RAISE EXCEPTION 'No autorizado a registrar tiempo para este empleado';
  END IF;

  IF p_hours IS NULL OR p_hours <= 0 THEN
    RETURN;
  END IF;

  SELECT started_at INTO v_started_at
  FROM public.active_timers
  WHERE employee_id = p_employee_id;

  -- UPSERT por (employee_id, allocation_id, date): cada empleado tiene su fila
  INSERT INTO public.time_entries (employee_id, allocation_id, date, hours, notes)
  VALUES (p_employee_id, p_allocation_id, p_date, p_hours, p_notes)
  ON CONFLICT (employee_id, allocation_id, date)
  DO UPDATE SET
    hours = public.time_entries.hours + EXCLUDED.hours,
    notes = CONCAT_WS(' | ', NULLIF(TRIM(public.time_entries.notes), ''), NULLIF(TRIM(EXCLUDED.notes), ''));

  UPDATE public.allocations
  SET hours_actual = COALESCE(hours_actual, 0) + p_hours
  WHERE id = p_allocation_id;

  IF v_started_at IS NOT NULL THEN
    INSERT INTO public.timer_sessions (employee_id, allocation_id, start_time, end_time, hours)
    VALUES (p_employee_id, p_allocation_id, v_started_at, now(), p_hours);
  END IF;

  DELETE FROM public.active_timers
  WHERE employee_id = p_employee_id;
END;
$$;

COMMENT ON FUNCTION public.log_timer_hours(uuid, uuid, numeric, text, date) IS
'Cierra el cronómetro: UPSERT en time_entries por (employee_id, allocation_id, date), actualiza allocations.hours_actual, inserta en timer_sessions, borra active_timers.';
