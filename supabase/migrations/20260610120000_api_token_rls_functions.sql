-- Endurece user_agency_ids() y can_write_via_api(): revocación/expiración de tokens API
-- y distinción readonly vs readwrite. Reemplaza implementación previa en prod.

CREATE OR REPLACE FUNCTION public.user_agency_ids()
RETURNS SETOF uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  jwt jsonb;
  jwt_agency uuid;
  jwt_sub uuid;
BEGIN
  jwt := auth.jwt();

  IF jwt IS NOT NULL AND jwt->>'iss' = 'timeboxing-api' THEN
    BEGIN
      jwt_agency := (jwt->>'agency_id')::uuid;
      jwt_sub := (jwt->>'sub')::uuid;
    EXCEPTION WHEN OTHERS THEN
      RETURN;
    END;

    IF jwt_agency IS NOT NULL AND jwt_sub IS NOT NULL THEN
      IF EXISTS (
        SELECT 1
        FROM public.api_tokens t
        WHERE t.id = jwt_sub
          AND t.agency_id = jwt_agency
          AND t.is_active = true
          AND (t.expires_at IS NULL OR t.expires_at > now())
      ) THEN
        RETURN NEXT jwt_agency;
      END IF;
    END IF;
    RETURN;
  END IF;

  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
    SELECT DISTINCT x.agency_id
    FROM (
      SELECT ua.agency_id
      FROM public.user_agencies ua
      WHERE ua.user_id = auth.uid()
      UNION
      SELECT e.agency_id
      FROM public.employees e
      WHERE e.user_id = auth.uid()
    ) x;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_write_via_api()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  jwt jsonb;
  jwt_permissions text;
  jwt_agency uuid;
  jwt_sub uuid;
BEGIN
  jwt := auth.jwt();

  IF jwt IS NULL OR jwt->>'iss' IS DISTINCT FROM 'timeboxing-api' THEN
    RETURN true;
  END IF;

  jwt_permissions := jwt->>'permissions';
  IF jwt_permissions IS DISTINCT FROM 'readwrite' THEN
    RETURN false;
  END IF;

  BEGIN
    jwt_agency := (jwt->>'agency_id')::uuid;
    jwt_sub := (jwt->>'sub')::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN false;
  END;

  RETURN EXISTS (
    SELECT 1
    FROM public.api_tokens t
    WHERE t.id = jwt_sub
      AND t.agency_id = jwt_agency
      AND t.is_active = true
      AND t.permissions = 'readwrite'
      AND (t.expires_at IS NULL OR t.expires_at > now())
  );
END;
$$;

REVOKE ALL ON FUNCTION public.user_agency_ids() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_write_via_api() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_agency_ids() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.can_write_via_api() TO authenticated, anon;

COMMENT ON FUNCTION public.user_agency_ids() IS
  'Agencias accesibles: usuario app (user_agencies + employees) o token API (iss=timeboxing-api) con fila activa/no expirada en api_tokens.';

COMMENT ON FUNCTION public.can_write_via_api() IS
  'true para usuarios app; para JWT API (iss=timeboxing-api) exige permissions=readwrite y token activo en api_tokens.';
