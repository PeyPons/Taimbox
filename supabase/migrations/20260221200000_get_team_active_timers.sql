-- RPC para la página "Tiempos": listar cronómetros activos de todos los empleados de la agencia.
-- Solo puede llamarla un usuario autenticado; devuelve filas de su misma agencia.

CREATE OR REPLACE FUNCTION public.get_team_active_timers()
RETURNS TABLE (
  employee_id uuid,
  employee_name text,
  allocation_id uuid,
  task_name text,
  client_name text,
  started_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
STABLE
AS $$
  SELECT
    at.employee_id,
    e.name AS employee_name,
    at.allocation_id,
    a.task_name,
    c.name AS client_name,
    at.started_at
  FROM public.active_timers at
  JOIN public.employees e ON e.id = at.employee_id
  JOIN public.allocations a ON a.id = at.allocation_id
  LEFT JOIN public.projects p ON p.id = a.project_id
  LEFT JOIN public.clients c ON c.id = p.client_id
  WHERE e.agency_id = (
    SELECT emp.agency_id FROM public.employees emp WHERE emp.user_id = auth.uid() LIMIT 1
  )
  AND auth.uid() IS NOT NULL;
$$;

COMMENT ON FUNCTION public.get_team_active_timers() IS
'Lista cronómetros activos de todos los empleados de la agencia del usuario. Para la página Tiempos.';
