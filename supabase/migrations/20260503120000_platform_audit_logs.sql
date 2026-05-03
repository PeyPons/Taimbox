-- Auditoría a nivel plataforma (sobrevive al purge de agencias) y endurecimiento de admin_delete_agency.
-- TODO: añadir INSERT en platform_audit_logs desde admin_set_agency_plan / admin_remove_platform_admin
--       cuando sus definiciones SQL estén disponibles en el repo o en una migración aplicada al servidor.

-- Auditoría a nivel plataforma. Sobrevive al borrado de agencias.
CREATE TABLE IF NOT EXISTS public.platform_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL,
  by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_audit_logs_created_at
  ON public.platform_audit_logs (created_at DESC);

ALTER TABLE public.platform_audit_logs ENABLE ROW LEVEL SECURITY;

-- Solo platform_admins leen. Inserción se hace desde RPC SECURITY DEFINER (dueño bypassa RLS).
CREATE POLICY platform_audit_logs_select ON public.platform_audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid())
  );

GRANT SELECT ON public.platform_audit_logs TO authenticated;

COMMENT ON TABLE public.platform_audit_logs IS
  'Auditoría a nivel plataforma (purges, etc). Sin agency_id; sobrevive al borrado.';


CREATE OR REPLACE FUNCTION public.admin_delete_agency(p_agency_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_slug text;
  v_name text;
  v_employees_count int;
  v_projects_count int;
  v_had_stripe boolean;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid()) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.agencies a WHERE a.id = p_agency_id) THEN
    RAISE EXCEPTION 'agency not found';
  END IF;

  SELECT a.slug, a.name, (a.stripe_subscription_id IS NOT NULL)
    INTO v_slug, v_name, v_had_stripe
  FROM public.agencies a WHERE a.id = p_agency_id;

  SELECT count(*)::int INTO v_employees_count FROM public.employees WHERE agency_id = p_agency_id;
  SELECT count(*)::int INTO v_projects_count FROM public.projects WHERE agency_id = p_agency_id;

  INSERT INTO public.platform_audit_logs (event, by_user_id, payload)
  VALUES (
    'agency_purged',
    auth.uid(),
    jsonb_build_object(
      'agency_id', p_agency_id,
      'agency_slug', v_slug,
      'agency_name', v_name,
      'employees_count', v_employees_count,
      'projects_count', v_projects_count,
      'had_stripe_subscription', v_had_stripe
    )
  );

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

  -- google_ads_changes (sin agency_id; cleanup vía clients).
  -- Defensivo: la tabla puede estar inerte; evita acumulación si/cuando se active el feature.
  DELETE FROM public.google_ads_changes
  WHERE client_id IN (SELECT id::text FROM public.clients WHERE agency_id = p_agency_id);

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
  'Borrado irreversible de agencia y datos ligados. Solo platform_admins. Registra agency_purged en platform_audit_logs. Cancelar Stripe antes (Edge Function admin-delete-agency).';
