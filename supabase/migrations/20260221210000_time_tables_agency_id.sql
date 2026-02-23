-- Añadir agency_id a las tablas de tiempos para filtrado por agencia en API e integraciones.
-- Todas las tablas de tiempo (time_entries, active_timers, timer_sessions) quedan alineadas con el resto del modelo (agency_id en recurso).

-- 1. time_entries: añadir agency_id, rellenar desde employees, obligatorio
ALTER TABLE public.time_entries
ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id) ON DELETE CASCADE;

UPDATE public.time_entries te
SET agency_id = e.agency_id
FROM public.employees e
WHERE e.id = te.employee_id
  AND te.agency_id IS NULL;

ALTER TABLE public.time_entries
ALTER COLUMN agency_id SET NOT NULL;

COMMENT ON COLUMN public.time_entries.agency_id IS 'Agencia del empleado que registra; permite filtrar por agencia en API.';

-- 2. active_timers: añadir agency_id, rellenar desde employees, obligatorio
ALTER TABLE public.active_timers
ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id) ON DELETE CASCADE;

UPDATE public.active_timers at
SET agency_id = e.agency_id
FROM public.employees e
WHERE e.id = at.employee_id
  AND at.agency_id IS NULL;

ALTER TABLE public.active_timers
ALTER COLUMN agency_id SET NOT NULL;

COMMENT ON COLUMN public.active_timers.agency_id IS 'Agencia del empleado; permite filtrar por agencia en API.';

-- Trigger: rellenar agency_id en active_timers desde employees (el frontend no lo envía)
CREATE OR REPLACE FUNCTION public.set_active_timers_agency_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  SELECT agency_id INTO NEW.agency_id FROM public.employees WHERE id = NEW.employee_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_active_timers_agency_id_trigger ON public.active_timers;
CREATE TRIGGER set_active_timers_agency_id_trigger
  BEFORE INSERT OR UPDATE OF employee_id ON public.active_timers
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_active_timers_agency_id();

-- 3. timer_sessions: añadir agency_id, rellenar desde employees, obligatorio
ALTER TABLE public.timer_sessions
ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id) ON DELETE CASCADE;

UPDATE public.timer_sessions ts
SET agency_id = e.agency_id
FROM public.employees e
WHERE e.id = ts.employee_id
  AND ts.agency_id IS NULL;

ALTER TABLE public.timer_sessions
ALTER COLUMN agency_id SET NOT NULL;

COMMENT ON COLUMN public.timer_sessions.agency_id IS 'Agencia del empleado; permite filtrar por agencia en API y webhooks.';

-- 4. Actualizar log_timer_hours para rellenar agency_id en INSERTs
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
  v_agency_id uuid;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != (SELECT user_id FROM public.employees WHERE id = p_employee_id) THEN
    RAISE EXCEPTION 'No autorizado a registrar tiempo para este empleado';
  END IF;

  IF p_hours IS NULL OR p_hours <= 0 THEN
    RETURN;
  END IF;

  SELECT agency_id INTO v_agency_id FROM public.employees WHERE id = p_employee_id;

  SELECT started_at INTO v_started_at
  FROM public.active_timers
  WHERE employee_id = p_employee_id;

  INSERT INTO public.time_entries (employee_id, allocation_id, date, hours, notes, agency_id)
  VALUES (p_employee_id, p_allocation_id, p_date, p_hours, p_notes, v_agency_id)
  ON CONFLICT (employee_id, allocation_id, date)
  DO UPDATE SET
    hours = public.time_entries.hours + EXCLUDED.hours,
    notes = CONCAT_WS(' | ', NULLIF(TRIM(public.time_entries.notes), ''), NULLIF(TRIM(EXCLUDED.notes), ''));

  UPDATE public.allocations
  SET hours_actual = COALESCE(hours_actual, 0) + p_hours
  WHERE id = p_allocation_id;

  IF v_started_at IS NOT NULL THEN
    INSERT INTO public.timer_sessions (employee_id, allocation_id, start_time, end_time, hours, agency_id)
    VALUES (p_employee_id, p_allocation_id, v_started_at, now(), p_hours, v_agency_id);
  END IF;

  DELETE FROM public.active_timers
  WHERE employee_id = p_employee_id;
END;
$$;

COMMENT ON FUNCTION public.log_timer_hours(uuid, uuid, numeric, text, date) IS
'Cierra el cronómetro: UPSERT en time_entries (con agency_id), actualiza allocations.hours_actual, inserta en timer_sessions (con agency_id), borra active_timers. Solo el empleado (auth.uid) puede invocarla.';
