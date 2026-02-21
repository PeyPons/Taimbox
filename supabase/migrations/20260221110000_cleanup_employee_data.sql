-- Función de limpieza antes de borrar un empleado.
-- La app llama a cleanup_employee_data(p_employee_id) antes del DELETE en employees.
-- Incluye active_timers (cronómetro de tareas) y el resto de datos referenciados por employee_id.

CREATE OR REPLACE FUNCTION public.cleanup_employee_data(p_employee_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  -- Cronómetro activo (módulo time tracking)
  DELETE FROM public.active_timers WHERE employee_id = p_employee_id;

  -- Entradas de tiempo (FK a employees)
  DELETE FROM public.time_entries WHERE employee_id = p_employee_id;

  -- Asignaciones, ausencias, feedback, rutinas, metas
  DELETE FROM public.allocations WHERE employee_id = p_employee_id;
  DELETE FROM public.absences WHERE employee_id = p_employee_id;
  DELETE FROM public.weekly_feedback WHERE employee_id = p_employee_id;
  DELETE FROM public.user_routines WHERE employee_id = p_employee_id;
  DELETE FROM public.professional_goals WHERE employee_id = p_employee_id;

  -- Transferencias de tareas (empleado como origen o destino)
  DELETE FROM public.task_transfers
  WHERE from_employee_id = p_employee_id OR to_employee_id = p_employee_id;

  -- Deadlines: quitar la clave del empleado en employee_hours (jsonb)
  UPDATE public.deadlines
  SET employee_hours = employee_hours - p_employee_id::text
  WHERE employee_hours ? p_employee_id::text;

  -- Team events: quitar el empleado de affected_employee_ids (solo si es array de IDs, no "all")
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
'Elimina o actualiza todos los datos asociados a un empleado antes de borrarlo: active_timers, time_entries, allocations, absences, weekly_feedback, user_routines, professional_goals, task_transfers; quita la clave en deadlines.employee_hours y el id en team_events.affected_employee_ids. Llamar antes del DELETE en employees.';
