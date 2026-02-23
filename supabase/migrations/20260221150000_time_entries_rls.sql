-- RLS en time_entries para que el usuario autenticado pueda LEER sus propias entradas.
-- La RPC log_timer_hours es SECURITY DEFINER y escribe en time_entries; sin esta política,
-- el cliente (SELECT desde la app) no vería las filas tras recargar y todo aparecería en 0.

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- Permitir SELECT: el usuario solo ve time_entries del empleado vinculado a su auth.uid()
DROP POLICY IF EXISTS "Employees can view own time_entries" ON public.time_entries;
CREATE POLICY "Employees can view own time_entries"
ON public.time_entries FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);

COMMENT ON POLICY "Employees can view own time_entries" ON public.time_entries IS
'El empleado puede ver sus propias entradas de tiempo (necesario para que el cronómetro muestre horas tras F5).';
