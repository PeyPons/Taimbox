-- Módulo de Cronómetro (Time Tracking) y Cortafuegos
-- Tabla active_timers, RLS, constraint time_entries (max 12h), RPC log_timer_hours.
-- Nota: La función cleanup_employee_data(p_employee_id) debe incluir:
--   DELETE FROM public.active_timers WHERE employee_id = p_employee_id;
-- Si ya existe, añadir esa línea al cuerpo de la función y volver a desplegarla.

-- 1. Tabla temporal para cronómetros activos (1 por empleado)
CREATE TABLE public.active_timers (
  employee_id uuid PRIMARY KEY REFERENCES public.employees(id) ON DELETE CASCADE,
  allocation_id uuid NOT NULL REFERENCES public.allocations(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Cortafuegos a nivel de BD: máximo 12h por entrada en time_entries
-- Si ya existen filas con hours > 12, ejecutar antes: UPDATE time_entries SET hours = 12 WHERE hours > 12;
ALTER TABLE public.time_entries
ADD CONSTRAINT max_hours_per_entry CHECK (hours <= 12::numeric);

-- 3. RLS en active_timers
ALTER TABLE public.active_timers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view their own active timers"
ON public.active_timers FOR SELECT
USING (auth.uid() IN (SELECT user_id FROM public.employees WHERE id = employee_id));

CREATE POLICY "Employees can insert their own active timers"
ON public.active_timers FOR INSERT
WITH CHECK (auth.uid() IN (SELECT user_id FROM public.employees WHERE id = employee_id));

CREATE POLICY "Employees can update their own active timers"
ON public.active_timers FOR UPDATE
USING (auth.uid() IN (SELECT user_id FROM public.employees WHERE id = employee_id));

CREATE POLICY "Employees can delete their own active timers"
ON public.active_timers FOR DELETE
USING (auth.uid() IN (SELECT user_id FROM public.employees WHERE id = employee_id));

-- 4. RPC log_timer_hours: insert time_entries, suma atómica en allocations, borra active_timers (una transacción).
-- Solo el empleado dueño puede registrar su tiempo (auth.uid() = employees.user_id).
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
BEGIN
  -- Solo el empleado vinculado al usuario actual puede registrar su tiempo
  IF auth.uid() IS NULL OR auth.uid() != (SELECT user_id FROM public.employees WHERE id = p_employee_id) THEN
    RAISE EXCEPTION 'No autorizado a registrar tiempo para este empleado';
  END IF;

  IF p_hours IS NULL OR p_hours <= 0 THEN
    RETURN;
  END IF;

  INSERT INTO public.time_entries (employee_id, allocation_id, date, hours, notes)
  VALUES (p_employee_id, p_allocation_id, p_date, p_hours, p_notes);

  UPDATE public.allocations
  SET hours_actual = COALESCE(hours_actual, 0) + p_hours
  WHERE id = p_allocation_id;

  DELETE FROM public.active_timers WHERE employee_id = p_employee_id;
END;
$$;

COMMENT ON FUNCTION public.log_timer_hours(uuid, uuid, numeric, text, date) IS
'Registra horas de un timer cerrado: inserta en time_entries, suma en allocations.hours_actual y borra de active_timers. Solo el empleado (auth.uid) puede invocarla.';
