-- Endurecimiento RLS: multi-agencia, blog admin, reglas de notificación, allocations por permiso,
-- agencies sin SELECT directo de secretos.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.can_assign_tasks_for_employee(p_target_employee_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agency_id uuid;
  v_my_employee_id uuid;
  v_employee_role text;
  v_settings jsonb;
  roles_arr jsonb;
  n int;
  i int;
  elem jsonb;
  v_can boolean := false;
BEGIN
  IF auth.uid() IS NULL OR p_target_employee_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT e.agency_id INTO v_agency_id
  FROM public.employees e
  WHERE e.id = p_target_employee_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF NOT (v_agency_id IN (SELECT public.user_agency_ids())) THEN
    RETURN false;
  END IF;

  IF public.is_agency_admin(auth.uid(), v_agency_id) THEN
    RETURN true;
  END IF;

  SELECT e.id, e.role
  INTO v_my_employee_id, v_employee_role
  FROM public.employees e
  WHERE e.user_id = auth.uid()
    AND e.agency_id = v_agency_id
    AND e.is_active = true
  ORDER BY e.created_at DESC NULLS LAST
  LIMIT 1;

  IF v_my_employee_id IS NULL THEN
    RETURN false;
  END IF;

  IF v_my_employee_id = p_target_employee_id THEN
    RETURN true;
  END IF;

  IF v_employee_role IS NULL THEN
    RETURN false;
  END IF;

  SELECT a.settings INTO v_settings FROM public.agencies a WHERE a.id = v_agency_id;

  roles_arr := COALESCE(v_settings->'roles', '[]'::jsonb);
  n := COALESCE(jsonb_array_length(roles_arr), 0);

  FOR i IN 0..GREATEST(n - 1, 0) LOOP
    EXIT WHEN n = 0 OR i >= n;
    elem := roles_arr->i;
    IF lower(btrim(elem->>'name')) = lower(btrim(v_employee_role)) THEN
      v_can := COALESCE((elem->'permissions'->>'can_assign_tasks_to_others')::boolean, false);
      EXIT;
    END IF;
  END LOOP;

  RETURN v_can;
END;
$$;

REVOKE ALL ON FUNCTION public.can_assign_tasks_for_employee(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_assign_tasks_for_employee(uuid) TO authenticated;

COMMENT ON FUNCTION public.can_assign_tasks_for_employee(uuid) IS
  'true si el usuario puede INSERT/UPDATE/DELETE allocations del employee_id (propias, is_agency_admin o can_assign_tasks_to_others en el rol).';

-- Directorio de agencias del usuario (solo id + name; sin settings ni tokens).
CREATE OR REPLACE FUNCTION public.list_my_agencies_directory()
RETURNS TABLE (id uuid, name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id, a.name
  FROM public.agencies a
  WHERE a.id IN (SELECT public.user_agency_ids())
  ORDER BY a.name;
$$;

REVOKE ALL ON FUNCTION public.list_my_agencies_directory() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_my_agencies_directory() TO authenticated;

-- ---------------------------------------------------------------------------
-- allocations: SELECT por agencia; escritura según can_assign_tasks_for_employee
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS allocations_insert ON public.allocations;
DROP POLICY IF EXISTS allocations_update ON public.allocations;
DROP POLICY IF EXISTS allocations_delete ON public.allocations;

CREATE POLICY allocations_insert ON public.allocations
  FOR INSERT
  WITH CHECK (
    public.can_assign_tasks_for_employee(employee_id)
    AND public.can_write_via_api()
  );

CREATE POLICY allocations_update ON public.allocations
  FOR UPDATE
  USING (
    public.can_assign_tasks_for_employee(employee_id)
    AND public.can_write_via_api()
  )
  WITH CHECK (
    public.can_assign_tasks_for_employee(employee_id)
    AND public.can_write_via_api()
  );

CREATE POLICY allocations_delete ON public.allocations
  FOR DELETE
  USING (
    public.can_assign_tasks_for_employee(employee_id)
    AND public.can_write_via_api()
  );

-- ---------------------------------------------------------------------------
-- user_agencies, user_routines, weekly_feedback → user_agency_ids()
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS user_agencies_select ON public.user_agencies;
CREATE POLICY user_agencies_select ON public.user_agencies
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_agencies_update ON public.user_agencies;
CREATE POLICY user_agencies_update ON public.user_agencies
  FOR UPDATE
  USING (
    user_id = auth.uid()
    AND agency_id IN (SELECT public.user_agency_ids())
    AND public.can_write_via_api()
  )
  WITH CHECK (
    user_id = auth.uid()
    AND agency_id IN (SELECT public.user_agency_ids())
    AND public.can_write_via_api()
  );

DROP POLICY IF EXISTS user_routines_select ON public.user_routines;
DROP POLICY IF EXISTS user_routines_insert ON public.user_routines;
DROP POLICY IF EXISTS user_routines_update ON public.user_routines;
DROP POLICY IF EXISTS user_routines_delete ON public.user_routines;

CREATE POLICY user_routines_select ON public.user_routines
  FOR SELECT
  USING (
    employee_id IN (
      SELECT e.id FROM public.employees e
      WHERE e.agency_id IN (SELECT public.user_agency_ids())
    )
  );

CREATE POLICY user_routines_insert ON public.user_routines
  FOR INSERT
  WITH CHECK (
    employee_id IN (
      SELECT e.id FROM public.employees e
      WHERE e.agency_id IN (SELECT public.user_agency_ids())
    )
    AND public.can_write_via_api()
  );

CREATE POLICY user_routines_update ON public.user_routines
  FOR UPDATE
  USING (
    employee_id IN (
      SELECT e.id FROM public.employees e
      WHERE e.agency_id IN (SELECT public.user_agency_ids())
    )
    AND public.can_write_via_api()
  )
  WITH CHECK (
    employee_id IN (
      SELECT e.id FROM public.employees e
      WHERE e.agency_id IN (SELECT public.user_agency_ids())
    )
    AND public.can_write_via_api()
  );

CREATE POLICY user_routines_delete ON public.user_routines
  FOR DELETE
  USING (
    employee_id IN (
      SELECT e.id FROM public.employees e
      WHERE e.agency_id IN (SELECT public.user_agency_ids())
    )
    AND public.can_write_via_api()
  );

DROP POLICY IF EXISTS weekly_feedback_select ON public.weekly_feedback;
DROP POLICY IF EXISTS weekly_feedback_insert ON public.weekly_feedback;
DROP POLICY IF EXISTS weekly_feedback_update ON public.weekly_feedback;
DROP POLICY IF EXISTS weekly_feedback_delete ON public.weekly_feedback;

CREATE POLICY weekly_feedback_select ON public.weekly_feedback
  FOR SELECT
  USING (
    employee_id IN (
      SELECT e.id FROM public.employees e
      WHERE e.agency_id IN (SELECT public.user_agency_ids())
    )
  );

CREATE POLICY weekly_feedback_insert ON public.weekly_feedback
  FOR INSERT
  WITH CHECK (
    employee_id IN (
      SELECT e.id FROM public.employees e
      WHERE e.agency_id IN (SELECT public.user_agency_ids())
    )
    AND public.can_write_via_api()
  );

CREATE POLICY weekly_feedback_update ON public.weekly_feedback
  FOR UPDATE
  USING (
    employee_id IN (
      SELECT e.id FROM public.employees e
      WHERE e.agency_id IN (SELECT public.user_agency_ids())
    )
    AND public.can_write_via_api()
  )
  WITH CHECK (
    employee_id IN (
      SELECT e.id FROM public.employees e
      WHERE e.agency_id IN (SELECT public.user_agency_ids())
    )
    AND public.can_write_via_api()
  );

CREATE POLICY weekly_feedback_delete ON public.weekly_feedback
  FOR DELETE
  USING (
    employee_id IN (
      SELECT e.id FROM public.employees e
      WHERE e.agency_id IN (SELECT public.user_agency_ids())
    )
    AND public.can_write_via_api()
  );

-- ---------------------------------------------------------------------------
-- notification_rules: solo administradores de agencia
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS notification_rules_select ON public.notification_rules;
DROP POLICY IF EXISTS notification_rules_insert ON public.notification_rules;
DROP POLICY IF EXISTS notification_rules_update ON public.notification_rules;
DROP POLICY IF EXISTS notification_rules_delete ON public.notification_rules;

CREATE POLICY notification_rules_select ON public.notification_rules
  FOR SELECT
  USING (public.is_agency_admin(auth.uid(), agency_id));

CREATE POLICY notification_rules_insert ON public.notification_rules
  FOR INSERT
  WITH CHECK (
    public.is_agency_admin(auth.uid(), agency_id)
    AND public.can_write_via_api()
  );

CREATE POLICY notification_rules_update ON public.notification_rules
  FOR UPDATE
  USING (
    public.is_agency_admin(auth.uid(), agency_id)
    AND public.can_write_via_api()
  )
  WITH CHECK (
    public.is_agency_admin(auth.uid(), agency_id)
    AND public.can_write_via_api()
  );

CREATE POLICY notification_rules_delete ON public.notification_rules
  FOR DELETE
  USING (
    public.is_agency_admin(auth.uid(), agency_id)
    AND public.can_write_via_api()
  );

-- ---------------------------------------------------------------------------
-- blog_posts + platform_audit_logs: is_platform_admin() (no subquery a platform_admins)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS blog_posts_select ON public.blog_posts;
CREATE POLICY blog_posts_select ON public.blog_posts
  FOR SELECT
  USING (status = 'published' OR public.is_platform_admin());

DROP POLICY IF EXISTS blog_posts_insert ON public.blog_posts;
CREATE POLICY blog_posts_insert ON public.blog_posts
  FOR INSERT
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS blog_posts_update ON public.blog_posts;
CREATE POLICY blog_posts_update ON public.blog_posts
  FOR UPDATE
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS blog_posts_delete ON public.blog_posts;
CREATE POLICY blog_posts_delete ON public.blog_posts
  FOR DELETE
  USING (public.is_platform_admin());

DROP POLICY IF EXISTS platform_audit_logs_select ON public.platform_audit_logs;
CREATE POLICY platform_audit_logs_select ON public.platform_audit_logs
  FOR SELECT
  USING (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- agencies: sin SELECT directo; UPDATE/DELETE solo admins de agencia
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS agencies_select ON public.agencies;

DROP POLICY IF EXISTS agencies_update ON public.agencies;
CREATE POLICY agencies_update ON public.agencies
  FOR UPDATE
  USING (
    public.is_agency_admin(auth.uid(), id)
    AND public.can_write_via_api()
  )
  WITH CHECK (
    public.is_agency_admin(auth.uid(), id)
    AND public.can_write_via_api()
  );

DROP POLICY IF EXISTS agencies_delete ON public.agencies;
CREATE POLICY agencies_delete ON public.agencies
  FOR DELETE
  USING (
    public.is_agency_admin(auth.uid(), id)
    AND public.can_write_via_api()
  );

-- INSERT en agencies: solo service_role / Edge (register-agency). Sin política = deny en cliente.
DROP POLICY IF EXISTS agencies_insert ON public.agencies;
