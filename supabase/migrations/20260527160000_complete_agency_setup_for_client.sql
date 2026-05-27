-- Marcar onboarding completado: cualquier miembro de la agencia (registro / Explorar ya).
-- El UPDATE directo en agencies puede quedar en 0 filas por RLS sin devolver error al cliente.

CREATE OR REPLACE FUNCTION public.complete_agency_setup_for_client(p_agency_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;

  IF p_agency_id IS NULL THEN
    RAISE EXCEPTION 'agency_id required' USING ERRCODE = '22023';
  END IF;

  IF NOT (
    EXISTS (
      SELECT 1 FROM public.user_agencies ua
      WHERE ua.user_id = auth.uid() AND ua.agency_id = p_agency_id
    )
    OR EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.user_id = auth.uid() AND e.agency_id = p_agency_id
    )
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  UPDATE public.agencies
  SET setup_completed = true,
      updated_at = now()
  WHERE id = p_agency_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'agency not found' USING ERRCODE = 'P0002';
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_agency_setup_for_client(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_agency_setup_for_client(uuid) TO authenticated;

COMMENT ON FUNCTION public.complete_agency_setup_for_client(uuid) IS
  'Marca setup_completed=true para miembros de la agencia (onboarding Explorar ya / asistente).';
