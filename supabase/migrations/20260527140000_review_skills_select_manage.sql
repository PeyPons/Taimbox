-- Quien gestiona skills debe verlas todas en la agencia (no solo las de su rol).

DROP POLICY IF EXISTS review_skills_select ON public.review_skills;

CREATE POLICY review_skills_select ON public.review_skills
  FOR SELECT
  USING (
    (agency_id IS NULL AND is_system_template)
    OR (
      agency_id IS NOT NULL
      AND agency_id IN (SELECT public.user_agency_ids())
      AND (
        public.can_manage_review_skills(agency_id)
        OR public.review_skill_visible_to_user(id)
      )
    )
  );
