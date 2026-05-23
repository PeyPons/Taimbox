-- Permite crear/editar review_skills a admins de agencia (no solo created_by).

CREATE OR REPLACE FUNCTION public.can_manage_review_skills(p_agency_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p_agency_id IS NOT NULL
    AND (
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
    )
    AND (
      public.is_platform_admin()
      OR public.user_has_agency_role_permission(auth.uid(), p_agency_id, 'can_access_agency_settings')
      OR public.user_has_agency_role_permission(auth.uid(), p_agency_id, 'can_access_review_agents')
      OR (
        pg_catalog.to_regprocedure('public.is_agency_admin(uuid,uuid)') IS NOT NULL
        AND public.is_agency_admin(auth.uid(), p_agency_id)
      )
    );
$$;

REVOKE ALL ON FUNCTION public.can_manage_review_skills(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_manage_review_skills(uuid) TO authenticated;

COMMENT ON FUNCTION public.can_manage_review_skills(uuid) IS
  'Gestión de skills de revisión: admin de agencia, can_access_review_agents o platform admin.';

DROP POLICY IF EXISTS review_skills_insert ON public.review_skills;
DROP POLICY IF EXISTS review_skills_update ON public.review_skills;
DROP POLICY IF EXISTS review_skills_delete ON public.review_skills;
DROP POLICY IF EXISTS review_skill_versions_insert ON public.review_skill_versions;

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
