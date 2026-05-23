-- Refuerzo RLS review_skills: admins de agencia y miembros con permiso explícito.

CREATE OR REPLACE FUNCTION public.can_manage_review_skills(p_agency_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  IF auth.uid() IS NULL OR p_agency_id IS NULL THEN
    RETURN false;
  END IF;

  IF public.is_platform_admin() THEN
    RETURN true;
  END IF;

  IF NOT (
    EXISTS (
      SELECT 1 FROM public.user_agencies ua
      WHERE ua.user_id = auth.uid() AND ua.agency_id = p_agency_id
    )
    OR EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.user_id = auth.uid()
        AND e.agency_id = p_agency_id
        AND COALESCE(e.is_active, true)
    )
  ) THEN
    RETURN false;
  END IF;

  IF pg_catalog.to_regprocedure('public.is_agency_admin(uuid,uuid)') IS NOT NULL
     AND public.is_agency_admin(auth.uid(), p_agency_id) THEN
    RETURN true;
  END IF;

  IF public.user_has_agency_role_permission(auth.uid(), p_agency_id, 'can_access_agency_settings') THEN
    RETURN true;
  END IF;

  IF public.user_has_agency_role_permission(auth.uid(), p_agency_id, 'can_access_review_agents') THEN
    RETURN true;
  END IF;

  SELECT e.role INTO v_role
  FROM public.employees e
  WHERE e.user_id = auth.uid()
    AND e.agency_id = p_agency_id
    AND COALESCE(e.is_active, true)
  ORDER BY e.created_at DESC NULLS LAST
  LIMIT 1;

  IF v_role IS NOT NULL AND v_role ~* '(admin|administrador|owner|propietario|director)' THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.can_manage_review_skills(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_manage_review_skills(uuid) TO authenticated;

DROP POLICY IF EXISTS review_skills_insert ON public.review_skills;
DROP POLICY IF EXISTS review_skills_update ON public.review_skills;
DROP POLICY IF EXISTS review_skills_delete ON public.review_skills;
DROP POLICY IF EXISTS review_skill_versions_insert ON public.review_skill_versions;
DROP POLICY IF EXISTS review_skills_select ON public.review_skills;

CREATE POLICY review_skills_select ON public.review_skills
  FOR SELECT
  USING (
    (agency_id IS NULL AND is_system_template)
    OR (
      agency_id IS NOT NULL
      AND (
        agency_id IN (SELECT public.user_agency_ids())
        OR EXISTS (
          SELECT 1 FROM public.employees e
          WHERE e.user_id = auth.uid()
            AND e.agency_id = review_skills.agency_id
            AND COALESCE(e.is_active, true)
        )
      )
      AND (
        public.can_manage_review_skills(agency_id)
        OR public.review_skill_visible_to_user(id)
      )
    )
  );

CREATE POLICY review_skills_insert ON public.review_skills
  FOR INSERT
  WITH CHECK (
    agency_id IS NOT NULL
    AND NOT is_system_template
    AND public.can_manage_review_skills(agency_id)
  );

CREATE POLICY review_skills_update ON public.review_skills
  FOR UPDATE
  USING (
    agency_id IS NOT NULL
    AND NOT is_system_template
    AND public.can_manage_review_skills(agency_id)
  )
  WITH CHECK (
    agency_id IS NOT NULL
    AND NOT is_system_template
    AND public.can_manage_review_skills(agency_id)
  );

CREATE POLICY review_skills_delete ON public.review_skills
  FOR DELETE
  USING (
    agency_id IS NOT NULL
    AND NOT is_system_template
    AND public.can_manage_review_skills(agency_id)
  );

CREATE POLICY review_skill_versions_insert ON public.review_skill_versions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.review_skills s
      WHERE s.id = skill_id
        AND s.agency_id IS NOT NULL
        AND NOT s.is_system_template
        AND public.can_manage_review_skills(s.agency_id)
    )
  );
