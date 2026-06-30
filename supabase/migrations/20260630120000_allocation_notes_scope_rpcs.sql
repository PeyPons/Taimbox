-- Contadores y listados de allocation_notes sin URLs gigantes (IDs en cuerpo RPC, no query string).

CREATE OR REPLACE FUNCTION public.count_allocation_notes_for_ids(
  p_agency_id uuid,
  p_allocation_ids uuid[]
)
RETURNS TABLE(allocation_id uuid, note_count bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT n.allocation_id, COUNT(*)::bigint AS note_count
  FROM public.allocation_notes n
  WHERE n.agency_id = p_agency_id
    AND n.deleted_at IS NULL
    AND p_allocation_ids IS NOT NULL
    AND cardinality(p_allocation_ids) > 0
    AND n.allocation_id = ANY (p_allocation_ids)
  GROUP BY n.allocation_id;
$$;

COMMENT ON FUNCTION public.count_allocation_notes_for_ids(uuid, uuid[]) IS
  'Conteo de notas activas por allocation_id. IDs en POST (RPC), apto para listas largas.';

CREATE OR REPLACE FUNCTION public.count_allocation_notes_for_employee_month(
  p_agency_id uuid,
  p_employee_id uuid,
  p_month date
)
RETURNS TABLE(allocation_id uuid, note_count bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT n.allocation_id, COUNT(*)::bigint AS note_count
  FROM public.allocation_notes n
  INNER JOIN public.allocations a ON a.id = n.allocation_id
  INNER JOIN public.employees e ON e.id = a.employee_id AND e.agency_id = p_agency_id
  WHERE n.agency_id = p_agency_id
    AND n.deleted_at IS NULL
    AND a.employee_id = p_employee_id
    AND date_trunc('month', a.week_start_date)::date = date_trunc('month', p_month)::date
  GROUP BY n.allocation_id;
$$;

COMMENT ON FUNCTION public.count_allocation_notes_for_employee_month(uuid, uuid, date) IS
  'Conteo de notas del planificador: empleado + mes efectivo (week_start_date en ese mes).';

CREATE OR REPLACE FUNCTION public.search_allocation_ids_by_note_body(
  p_agency_id uuid,
  p_allocation_ids uuid[],
  p_query text
)
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(
    array_agg(DISTINCT n.allocation_id),
    ARRAY[]::uuid[]
  )
  FROM public.allocation_notes n
  WHERE n.agency_id = p_agency_id
    AND n.deleted_at IS NULL
    AND p_allocation_ids IS NOT NULL
    AND cardinality(p_allocation_ids) > 0
    AND n.allocation_id = ANY (p_allocation_ids)
    AND p_query IS NOT NULL
    AND length(btrim(p_query)) > 0
    AND lower(n.body) LIKE '%' || lower(btrim(p_query)) || '%';
$$;

CREATE OR REPLACE FUNCTION public.list_allocation_notes_for_ids(
  p_agency_id uuid,
  p_allocation_ids uuid[]
)
RETURNS TABLE(
  id uuid,
  allocation_id uuid,
  agency_id uuid,
  author_employee_id uuid,
  body text,
  source text,
  created_at timestamptz,
  deleted_at timestamptz,
  author_name text,
  author_avatar_url text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    n.id,
    n.allocation_id,
    n.agency_id,
    n.author_employee_id,
    n.body,
    n.source,
    n.created_at,
    n.deleted_at,
    e.name AS author_name,
    e.avatar_url AS author_avatar_url
  FROM public.allocation_notes n
  LEFT JOIN public.employees e ON e.id = n.author_employee_id
  WHERE n.agency_id = p_agency_id
    AND n.deleted_at IS NULL
    AND p_allocation_ids IS NOT NULL
    AND cardinality(p_allocation_ids) > 0
    AND n.allocation_id = ANY (p_allocation_ids)
  ORDER BY n.created_at ASC;
$$;

REVOKE ALL ON FUNCTION public.count_allocation_notes_for_ids(uuid, uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_allocation_notes_for_ids(uuid, uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_allocation_notes_for_ids(uuid, uuid[]) TO service_role;

REVOKE ALL ON FUNCTION public.count_allocation_notes_for_employee_month(uuid, uuid, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_allocation_notes_for_employee_month(uuid, uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_allocation_notes_for_employee_month(uuid, uuid, date) TO service_role;

REVOKE ALL ON FUNCTION public.search_allocation_ids_by_note_body(uuid, uuid[], text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_allocation_ids_by_note_body(uuid, uuid[], text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_allocation_ids_by_note_body(uuid, uuid[], text) TO service_role;

REVOKE ALL ON FUNCTION public.list_allocation_notes_for_ids(uuid, uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_allocation_notes_for_ids(uuid, uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_allocation_notes_for_ids(uuid, uuid[]) TO service_role;
