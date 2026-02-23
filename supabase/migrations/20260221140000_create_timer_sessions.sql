-- Tabla "Caja Negra" timer_sessions para integraciones externas (p. ej. Perfex CRM).
-- Append-only: cada cierre de cronómetro guarda start_time y end_time exactos para webhooks.
-- Sin impacto en el frontend: la RPC log_timer_hours sigue siendo la misma desde React.

-- 1. Tabla de sesiones exactas (una fila por cada "Stop" del cronómetro)
CREATE TABLE public.timer_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  allocation_id uuid NOT NULL REFERENCES public.allocations(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL DEFAULT now(),
  hours numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.timer_sessions IS
'Sesiones exactas de cronómetro (start_time/end_time) para webhooks e integraciones (p. ej. Perfex). Append-only. La analítica interna sigue en time_entries.';

-- 2. RLS
ALTER TABLE public.timer_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view their own sessions"
ON public.timer_sessions FOR SELECT
USING (auth.uid() IN (SELECT user_id FROM public.employees WHERE id = employee_id));

-- 3. RPC log_timer_hours: captura started_at antes de borrar active_timers, escribe en timer_sessions
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

  -- Capturar start_time ANTES de borrar el timer activo (para timer_sessions y webhooks)
  SELECT started_at INTO v_started_at
  FROM public.active_timers
  WHERE employee_id = p_employee_id;

  -- 1. Analítica interna: UPSERT en time_entries (varias paradas el mismo día suman)
  INSERT INTO public.time_entries (employee_id, allocation_id, date, hours, notes)
  VALUES (p_employee_id, p_allocation_id, p_date, p_hours, p_notes)
  ON CONFLICT (allocation_id, date)
  DO UPDATE SET
    hours = public.time_entries.hours + EXCLUDED.hours,
    notes = CONCAT_WS(' | ', NULLIF(TRIM(public.time_entries.notes), ''), NULLIF(TRIM(EXCLUDED.notes), ''));

  -- 2. Sumar al acumulado de la tarea
  UPDATE public.allocations
  SET hours_actual = COALESCE(hours_actual, 0) + p_hours
  WHERE id = p_allocation_id;

  -- 3. Caja negra: sesión exacta para webhooks / integraciones (Perfex, etc.)
  IF v_started_at IS NOT NULL THEN
    INSERT INTO public.timer_sessions (employee_id, allocation_id, start_time, end_time, hours)
    VALUES (p_employee_id, p_allocation_id, v_started_at, now(), p_hours);
  END IF;

  -- 4. Limpiar el timer activo
  DELETE FROM public.active_timers
  WHERE employee_id = p_employee_id;
END;
$$;

COMMENT ON FUNCTION public.log_timer_hours(uuid, uuid, numeric, text, date) IS
'Cierra el cronómetro: UPSERT en time_entries, actualiza allocations.hours_actual, inserta sesión exacta en timer_sessions (para webhooks), borra active_timers. Solo el empleado (auth.uid) puede invocarla.';

-- 4. Limpieza al borrar empleado: incluir timer_sessions
CREATE OR REPLACE FUNCTION public.cleanup_employee_data(p_employee_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  DELETE FROM public.active_timers WHERE employee_id = p_employee_id;
  DELETE FROM public.timer_sessions WHERE employee_id = p_employee_id;
  DELETE FROM public.time_entries WHERE employee_id = p_employee_id;

  DELETE FROM public.allocations WHERE employee_id = p_employee_id;
  DELETE FROM public.absences WHERE employee_id = p_employee_id;
  DELETE FROM public.weekly_feedback WHERE employee_id = p_employee_id;
  DELETE FROM public.user_routines WHERE employee_id = p_employee_id;
  DELETE FROM public.professional_goals WHERE employee_id = p_employee_id;

  DELETE FROM public.task_transfers
  WHERE from_employee_id = p_employee_id OR to_employee_id = p_employee_id;

  UPDATE public.deadlines
  SET employee_hours = employee_hours - p_employee_id::text
  WHERE employee_hours ? p_employee_id::text;

  UPDATE public.team_events
  SET affected_employee_ids = (
    SELECT COALESCE(jsonb_agg(to_jsonb(elem)), '[]'::jsonb)
    FROM jsonb_array_elements_text(affected_employee_ids) AS elem
    WHERE elem <> p_employee_id::text
  )
  WHERE jsonb_typeof(affected_employee_ids) = 'array'
    AND affected_employee_ids @> to_jsonb(ARRAY[p_employee_id::text]);
END;
$$;

COMMENT ON FUNCTION public.cleanup_employee_data(uuid) IS
'Elimina o actualiza todos los datos asociados a un empleado antes de borrarlo: active_timers, timer_sessions, time_entries, allocations, absences, weekly_feedback, user_routines, professional_goals, task_transfers; actualiza deadlines.employee_hours y team_events.affected_employee_ids.';
