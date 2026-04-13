-- Limpieza al borrar empleado (RPC usada por la app) y borrado irreversible de agencia (solo admins de plataforma).
-- Si ya existía cleanup_employee_data en el servidor, esta migración la reemplaza por CREATE OR REPLACE.

CREATE OR REPLACE FUNCTION public.cleanup_employee_data(p_employee_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.employees e
    INNER JOIN public.user_agencies ua
      ON ua.agency_id = e.agency_id AND ua.user_id = auth.uid()
    WHERE e.id = p_employee_id
  ) AND NOT EXISTS (
    SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  DELETE FROM public.active_timers WHERE employee_id = p_employee_id;
  DELETE FROM public.timer_sessions WHERE employee_id = p_employee_id;
  DELETE FROM public.time_entries WHERE employee_id = p_employee_id;

  DELETE FROM public.task_transfers
  WHERE from_employee_id = p_employee_id OR to_employee_id = p_employee_id;

  DELETE FROM public.weekly_feedback WHERE employee_id = p_employee_id;
  DELETE FROM public.user_routines WHERE employee_id = p_employee_id;
  DELETE FROM public.professional_goals WHERE employee_id = p_employee_id;
  DELETE FROM public.project_editing_locks WHERE employee_id = p_employee_id;
  DELETE FROM public.absences WHERE employee_id = p_employee_id;

  DELETE FROM public.global_assignments WHERE employee_id = p_employee_id;

  UPDATE public.global_assignments ga
  SET affected_employee_ids = (
    SELECT COALESCE(jsonb_agg(to_jsonb(val)), '[]'::jsonb)
    FROM jsonb_array_elements_text(ga.affected_employee_ids) AS t(val)
    WHERE val <> p_employee_id::text
  ),
  updated_at = now()
  WHERE ga.affected_employee_ids IS NOT NULL
    AND jsonb_typeof(ga.affected_employee_ids) = 'array'
    AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements_text(ga.affected_employee_ids) AS x(v)
      WHERE v = p_employee_id::text
    );

  UPDATE public.allocations
  SET parent_allocation_id = NULL
  WHERE parent_allocation_id IN (SELECT id FROM public.allocations WHERE employee_id = p_employee_id);

  UPDATE public.allocations
  SET dependency_id = NULL
  WHERE dependency_id IN (SELECT id FROM public.allocations WHERE employee_id = p_employee_id);

  UPDATE public.allocations
  SET transferred_from_allocation_id = NULL
  WHERE transferred_from_allocation_id IN (SELECT id FROM public.allocations WHERE employee_id = p_employee_id);

  UPDATE public.allocations
  SET distribution_source_allocation_id = NULL
  WHERE distribution_source_allocation_id IN (SELECT id FROM public.allocations WHERE employee_id = p_employee_id);

  DELETE FROM public.allocations
  WHERE employee_id = p_employee_id OR transfer_source_employee_id = p_employee_id;

  UPDATE public.deadlines d
  SET employee_hours = d.employee_hours - p_employee_id::text,
      updated_at = now()
  WHERE d.employee_hours ? p_employee_id::text;

  UPDATE public.team_events te
  SET affected_employee_ids = (
    SELECT COALESCE(jsonb_agg(to_jsonb(val)), '[]'::jsonb)
    FROM jsonb_array_elements_text(te.affected_employee_ids) AS t(val)
    WHERE val <> p_employee_id::text
  )
  WHERE te.affected_employee_ids IS NOT NULL
    AND jsonb_typeof(te.affected_employee_ids) = 'array'
    AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements_text(te.affected_employee_ids) AS x(v)
      WHERE v = p_employee_id::text
    );
END;
$$;

COMMENT ON FUNCTION public.cleanup_employee_data(uuid) IS
  'Elimina datos operativos del empleado (timers, allocations, absences, locks, global_assignments, deadlines/team_events). No borra la fila employees.';

GRANT EXECUTE ON FUNCTION public.cleanup_employee_data(uuid) TO authenticated;


CREATE OR REPLACE FUNCTION public.admin_delete_agency(p_agency_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid()) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.agencies a WHERE a.id = p_agency_id) THEN
    RAISE EXCEPTION 'agency not found';
  END IF;

  DELETE FROM public.support_ticket_replies str
  USING public.support_tickets st
  WHERE str.ticket_id = st.id AND st.agency_id = p_agency_id;

  DELETE FROM public.support_tickets WHERE agency_id = p_agency_id;

  FOR r IN SELECT id FROM public.employees WHERE agency_id = p_agency_id
  LOOP
    DELETE FROM public.active_timers WHERE employee_id = r.id;
    DELETE FROM public.timer_sessions WHERE employee_id = r.id;
    DELETE FROM public.time_entries WHERE employee_id = r.id;
    DELETE FROM public.task_transfers
    WHERE from_employee_id = r.id OR to_employee_id = r.id;
    DELETE FROM public.weekly_feedback WHERE employee_id = r.id;
    DELETE FROM public.user_routines WHERE employee_id = r.id;
    DELETE FROM public.professional_goals WHERE employee_id = r.id;
    DELETE FROM public.project_editing_locks WHERE employee_id = r.id;
    DELETE FROM public.absences WHERE employee_id = r.id;
    DELETE FROM public.global_assignments WHERE employee_id = r.id;

    UPDATE public.global_assignments ga
    SET affected_employee_ids = (
      SELECT COALESCE(jsonb_agg(to_jsonb(val)), '[]'::jsonb)
      FROM jsonb_array_elements_text(ga.affected_employee_ids) AS t(val)
      WHERE val <> r.id::text
    ),
    updated_at = now()
    WHERE ga.agency_id = p_agency_id
      AND ga.affected_employee_ids IS NOT NULL
      AND jsonb_typeof(ga.affected_employee_ids) = 'array'
      AND EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(ga.affected_employee_ids) AS x(v)
        WHERE v = r.id::text
      );

    UPDATE public.deadlines d
    SET employee_hours = d.employee_hours - r.id::text,
        updated_at = now()
    WHERE d.employee_hours ? r.id::text;

    UPDATE public.team_events te
    SET affected_employee_ids = (
      SELECT COALESCE(jsonb_agg(to_jsonb(val)), '[]'::jsonb)
      FROM jsonb_array_elements_text(te.affected_employee_ids) AS t(val)
      WHERE val <> r.id::text
    )
    WHERE te.agency_id = p_agency_id
      AND te.affected_employee_ids IS NOT NULL
      AND jsonb_typeof(te.affected_employee_ids) = 'array'
      AND EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(te.affected_employee_ids) AS x(v)
        WHERE v = r.id::text
      );

    UPDATE public.allocations
    SET parent_allocation_id = NULL
    WHERE parent_allocation_id IN (SELECT id FROM public.allocations WHERE employee_id = r.id);

    UPDATE public.allocations
    SET dependency_id = NULL
    WHERE dependency_id IN (SELECT id FROM public.allocations WHERE employee_id = r.id);

    UPDATE public.allocations
    SET transferred_from_allocation_id = NULL
    WHERE transferred_from_allocation_id IN (SELECT id FROM public.allocations WHERE employee_id = r.id);

    UPDATE public.allocations
    SET distribution_source_allocation_id = NULL
    WHERE distribution_source_allocation_id IN (SELECT id FROM public.allocations WHERE employee_id = r.id);

    DELETE FROM public.allocations
    WHERE employee_id = r.id OR transfer_source_employee_id = r.id;
  END LOOP;

  DELETE FROM public.deadlines
  WHERE project_id IN (SELECT id FROM public.projects WHERE agency_id = p_agency_id);

  DELETE FROM public.projects WHERE agency_id = p_agency_id;

  DELETE FROM public.client_settings
  WHERE agency_id = p_agency_id
     OR client_id IN (SELECT id::text FROM public.clients WHERE agency_id = p_agency_id);

  DELETE FROM public.clients WHERE agency_id = p_agency_id;

  DELETE FROM public.employees WHERE agency_id = p_agency_id;

  DELETE FROM public.user_agencies WHERE agency_id = p_agency_id;

  DELETE FROM public.department_config WHERE agency_id = p_agency_id;

  DELETE FROM public.api_tokens WHERE agency_id = p_agency_id;
  DELETE FROM public.audit_logs WHERE agency_id = p_agency_id;
  DELETE FROM public.active_timers WHERE agency_id = p_agency_id;
  DELETE FROM public.time_entries WHERE agency_id = p_agency_id;
  DELETE FROM public.timer_sessions WHERE agency_id = p_agency_id;
  DELETE FROM public.task_transfers WHERE agency_id = p_agency_id;
  DELETE FROM public.team_events WHERE agency_id = p_agency_id;
  DELETE FROM public.global_assignments WHERE agency_id = p_agency_id;

  DELETE FROM public.ad_accounts_config WHERE agency_id = p_agency_id;
  DELETE FROM public.ads_sync_logs WHERE agency_id = p_agency_id;
  DELETE FROM public.google_ads_campaigns WHERE agency_id = p_agency_id;
  DELETE FROM public.meta_ads_campaigns WHERE agency_id = p_agency_id;
  DELETE FROM public.meta_sync_logs WHERE agency_id = p_agency_id;
  DELETE FROM public.segmentation_rules WHERE agency_id = p_agency_id;

  DELETE FROM public.agencies WHERE id = p_agency_id;
END;
$$;

COMMENT ON FUNCTION public.admin_delete_agency(uuid) IS
  'Borrado irreversible de agencia y datos ligados. Solo platform_admins. Cancelar Stripe antes (Edge Function admin-delete-agency).';

GRANT EXECUTE ON FUNCTION public.admin_delete_agency(uuid) TO authenticated;
