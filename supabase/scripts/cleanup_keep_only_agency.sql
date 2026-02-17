-- Script: Dejar solo los datos de UNA agencia y eliminar todo lo demás
-- Agencia a conservar: 60eb6a6f-c3ec-4b52-b9bb-3cb1886ad892
--
-- IMPORTANTE:
-- 1. Haz backup completo de la base de datos antes de ejecutar.
-- 2. Debes haber ejecutado antes la migración que añade agency_id a
--    team_events, client_settings y segmentation_rules (20260217100000).
--    Si no, comenta los bloques 11, 19 y 20 o la ejecución fallará.
-- 3. Ejecutar en Supabase SQL Editor. Esto borra datos de forma irreversible.
--
-- Tablas que NO se tocan: auth.users, google_ads_changes (sin agency_id).

DO $$
DECLARE
  target_agency_id uuid := '60eb6a6f-c3ec-4b52-b9bb-3cb1886ad892';
BEGIN
  -- 1. audit_logs (por agency_id)
  DELETE FROM public.audit_logs WHERE agency_id IS DISTINCT FROM target_agency_id;

  -- 2. time_entries (por employee de nuestra agencia)
  DELETE FROM public.time_entries
  WHERE employee_id IN (SELECT id FROM public.employees WHERE agency_id IS DISTINCT FROM target_agency_id);

  -- 3. project_editing_locks (proyectos o empleados de otras agencias)
  DELETE FROM public.project_editing_locks
  WHERE project_id IN (SELECT id FROM public.projects WHERE agency_id IS DISTINCT FROM target_agency_id)
     OR employee_id IN (SELECT id FROM public.employees WHERE agency_id IS DISTINCT FROM target_agency_id);

  -- 4. task_transfers (por agency_id)
  DELETE FROM public.task_transfers WHERE agency_id IS DISTINCT FROM target_agency_id;

  -- 5. weekly_feedback (por employee)
  DELETE FROM public.weekly_feedback
  WHERE employee_id IN (SELECT id FROM public.employees WHERE agency_id IS DISTINCT FROM target_agency_id);

  -- 6. user_routines (por employee)
  DELETE FROM public.user_routines
  WHERE employee_id IN (SELECT id FROM public.employees WHERE agency_id IS DISTINCT FROM target_agency_id);

  -- 7. professional_goals (por employee)
  DELETE FROM public.professional_goals
  WHERE employee_id IN (SELECT id FROM public.employees WHERE agency_id IS DISTINCT FROM target_agency_id);

  -- 8. absences (por employee)
  DELETE FROM public.absences
  WHERE employee_id IN (SELECT id FROM public.employees WHERE agency_id IS DISTINCT FROM target_agency_id);

  -- 9. allocations (por employee o project de otras agencias)
  DELETE FROM public.allocations
  WHERE employee_id IN (SELECT id FROM public.employees WHERE agency_id IS DISTINCT FROM target_agency_id)
     OR project_id IN (SELECT id FROM public.projects WHERE agency_id IS DISTINCT FROM target_agency_id);

  -- 10. deadlines (por project)
  DELETE FROM public.deadlines
  WHERE project_id IN (SELECT id FROM public.projects WHERE agency_id IS DISTINCT FROM target_agency_id);

  -- 11. team_events (por agency_id; si la columna no existe, omitir o ejecutar tras migración)
  DELETE FROM public.team_events WHERE agency_id IS DISTINCT FROM target_agency_id;

  -- 12. global_assignments (por agency_id)
  DELETE FROM public.global_assignments WHERE agency_id IS DISTINCT FROM target_agency_id;

  -- 13. department_config (por agency_id)
  DELETE FROM public.department_config WHERE agency_id IS DISTINCT FROM target_agency_id;

  -- 14. ad_accounts_config (por agency_id)
  DELETE FROM public.ad_accounts_config WHERE agency_id IS DISTINCT FROM target_agency_id;

  -- 15. ads_sync_logs (por agency_id)
  DELETE FROM public.ads_sync_logs WHERE agency_id IS DISTINCT FROM target_agency_id;

  -- 16. meta_sync_logs (por agency_id)
  DELETE FROM public.meta_sync_logs WHERE agency_id IS DISTINCT FROM target_agency_id;

  -- 17. google_ads_campaigns (por agency_id)
  DELETE FROM public.google_ads_campaigns WHERE agency_id IS DISTINCT FROM target_agency_id;

  -- 18. meta_ads_campaigns (por agency_id)
  DELETE FROM public.meta_ads_campaigns WHERE agency_id IS DISTINCT FROM target_agency_id;

  -- 19. client_settings (por agency_id; si la columna no existe, fallará - ejecutar tras migración de agency_id)
  DELETE FROM public.client_settings WHERE agency_id IS DISTINCT FROM target_agency_id;

  -- 20. segmentation_rules (por agency_id; si la columna no existe, fallará - ejecutar tras migración)
  DELETE FROM public.segmentation_rules WHERE agency_id IS DISTINCT FROM target_agency_id;

  -- 21. projects (por agency_id)
  DELETE FROM public.projects WHERE agency_id IS DISTINCT FROM target_agency_id;

  -- 22. clients (por agency_id)
  DELETE FROM public.clients WHERE agency_id IS DISTINCT FROM target_agency_id;

  -- 23. employees (por agency_id)
  DELETE FROM public.employees WHERE agency_id IS DISTINCT FROM target_agency_id;

  -- 24. user_agencies (por agency_id)
  DELETE FROM public.user_agencies WHERE agency_id IS DISTINCT FROM target_agency_id;

  -- 25. agencies (eliminar el resto de agencias)
  DELETE FROM public.agencies WHERE id IS DISTINCT FROM target_agency_id;

  RAISE NOTICE 'Limpieza completada: solo quedan datos de la agencia %', target_agency_id;
END $$;
