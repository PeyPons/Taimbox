-- Reglas de notificación: mismo criterio que settings (can_access_agency_settings), no solo is_agency_admin.

CREATE OR REPLACE FUNCTION public.can_manage_agency_notification_rules(p_agency_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_platform_admin()
    OR public.user_has_agency_role_permission(auth.uid(), p_agency_id, 'can_access_agency_settings')
    OR (
      pg_catalog.to_regprocedure('public.is_agency_admin(uuid,uuid)') IS NOT NULL
      AND public.is_agency_admin(auth.uid(), p_agency_id)
    );
$$;

REVOKE ALL ON FUNCTION public.can_manage_agency_notification_rules(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_manage_agency_notification_rules(uuid) TO authenticated;

DROP POLICY IF EXISTS notification_rules_select ON public.notification_rules;
DROP POLICY IF EXISTS notification_rules_insert ON public.notification_rules;
DROP POLICY IF EXISTS notification_rules_update ON public.notification_rules;
DROP POLICY IF EXISTS notification_rules_delete ON public.notification_rules;

CREATE POLICY notification_rules_select ON public.notification_rules
  FOR SELECT
  USING (public.can_manage_agency_notification_rules(agency_id));

CREATE POLICY notification_rules_insert ON public.notification_rules
  FOR INSERT
  WITH CHECK (
    public.can_manage_agency_notification_rules(agency_id)
    AND public.can_write_via_api()
  );

CREATE POLICY notification_rules_update ON public.notification_rules
  FOR UPDATE
  USING (
    public.can_manage_agency_notification_rules(agency_id)
    AND public.can_write_via_api()
  )
  WITH CHECK (
    public.can_manage_agency_notification_rules(agency_id)
    AND public.can_write_via_api()
  );

CREATE POLICY notification_rules_delete ON public.notification_rules
  FOR DELETE
  USING (
    public.can_manage_agency_notification_rules(agency_id)
    AND public.can_write_via_api()
  );
