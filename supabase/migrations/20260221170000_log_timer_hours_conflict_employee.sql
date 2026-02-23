-- Solo actualiza la función log_timer_hours para usar ON CONFLICT (employee_id, allocation_id, date).
-- Ejecutar si la migración 20260221160000 aplicó el constraint pero la función quedó con el ON CONFLICT antiguo
-- (allocation_id, date), por lo que las horas se guardaban en la fila de otro empleado y al recargar se veía 0.
--
-- Comprobar después:
-- 1) Función: SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'log_timer_hours';
--    Debe contener "ON CONFLICT (employee_id, allocation_id, date)".
-- 2) Constraint: SELECT conname FROM pg_constraint WHERE conrelid = 'public.time_entries'::regclass AND contype = 'u';
--    Debe listar time_entries_employee_allocation_date_unique.

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
