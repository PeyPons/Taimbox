-- Migración: Limpieza completa al eliminar un empleado
-- Al borrar un empleado se debe eliminar todo rastro en la base de datos:
-- allocations, absences, weekly_feedback, user_routines, task_transfers,
-- referencias en deadlines.employee_hours y en team_events.affected_employee_ids.
--
-- Uso: la aplicación llama a cleanup_employee_data(uuid) ANTES de DELETE en employees.
-- Ejecutar en Supabase SQL Editor o: supabase db push
--
-- SEGURIDAD: Esta función SOLO afecta al UUID que se le pasa (p_employee_id).
-- - No elimina proyectos, clientes ni agencias.
-- - No elimina otros empleados ni sus datos.
-- - No borra filas de otros: solo WHERE employee_id = p_employee_id (o equivalente).
-- - En deadlines/team_events solo QUITA la referencia de ese empleado; no borra el registro.

-- =============================================================================
-- Función: eliminar todos los datos que referencian a UN empleado (el pasado como argumento)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.cleanup_employee_data(p_employee_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Asignaciones (tareas)
  DELETE FROM public.allocations WHERE employee_id = p_employee_id;

  -- Ausencias
  DELETE FROM public.absences WHERE employee_id = p_employee_id;

  -- Feedback semanal
  DELETE FROM public.weekly_feedback WHERE employee_id = p_employee_id;

  -- Rutinas de usuario
  DELETE FROM public.user_routines WHERE employee_id = p_employee_id;

  -- Transferencias de tareas (como origen o destino)
  DELETE FROM public.task_transfers
  WHERE from_employee_id = p_employee_id OR to_employee_id = p_employee_id;

  -- Deadlines: quitar al empleado de employee_hours (JSONB)
  UPDATE public.deadlines
  SET employee_hours = employee_hours - p_employee_id::text
  WHERE employee_hours ? p_employee_id::text;

  -- Eventos de equipo: quitar al empleado del array affected_employee_ids
  UPDATE public.team_events
  SET affected_employee_ids = array_remove(COALESCE(affected_employee_ids, ARRAY[]::uuid[]), p_employee_id)
  WHERE p_employee_id = ANY(COALESCE(affected_employee_ids, ARRAY[]::uuid[]));
END;
$$;

-- Permitir ejecución al rol que usa la API (anon/authenticated según RLS)
GRANT EXECUTE ON FUNCTION public.cleanup_employee_data(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_employee_data(uuid) TO service_role;

COMMENT ON FUNCTION public.cleanup_employee_data(uuid) IS
  'Elimina todo rastro del empleado en allocations, absences, weekly_feedback, user_routines, task_transfers, deadlines.employee_hours y team_events. Llamar antes de DELETE en employees.';
