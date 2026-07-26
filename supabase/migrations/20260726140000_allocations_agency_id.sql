-- =============================================================================
-- allocations.agency_id (tenant explícito) + backfill seguro + trigger
-- =============================================================================
-- Objetivo largo plazo: filtrar/RLS/API por agency_id sin join a employees.
--
-- Seguridad de datos históricos:
--   * NO se borra ninguna fila de allocations.
--   * Backfill desde employees.agency_id; fallback projects.agency_id.
--   * Mismatches employee↔project: se asigna agency del empleado (fuente RLS actual)
--     y se emite NOTICE; no se aborta ni se elimina la tarea.
--   * Si tras el backfill queda alguna fila sin agency_id, la migración FALLA
--     (ROLLBACK completo) para no dejar el esquema a medias.
--   * INSERT/UPDATE posteriores: trigger rellena y valida coherencia.
--   * RPCs con INSERT explícito (partial_close_rollover, accept_task_transfer)
--     siguen válidas: el trigger rellena agency_id.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) Columna nullable (fase intermedia)
-- ---------------------------------------------------------------------------

ALTER TABLE public.allocations
  ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);

COMMENT ON COLUMN public.allocations.agency_id IS
  'Tenant denormalizado (misma agencia que employees.employee_id). Rellenado por trigger; no enviar desde cliente salvo integración explícita.';

-- ---------------------------------------------------------------------------
-- 2) Backfill (UPDATE only; never DELETE)
-- ---------------------------------------------------------------------------

UPDATE public.allocations a
SET agency_id = e.agency_id
FROM public.employees e
WHERE a.employee_id = e.id
  AND a.agency_id IS NULL
  AND e.agency_id IS NOT NULL;

UPDATE public.allocations a
SET agency_id = p.agency_id
FROM public.projects p
WHERE a.project_id = p.id
  AND a.agency_id IS NULL
  AND p.agency_id IS NOT NULL;

DO $$
DECLARE
  v_total bigint;
  v_null bigint;
  v_mismatch bigint;
BEGIN
  SELECT COUNT(*) INTO v_total FROM public.allocations;
  SELECT COUNT(*) INTO v_null FROM public.allocations WHERE agency_id IS NULL;
  SELECT COUNT(*) INTO v_mismatch
  FROM public.allocations a
  JOIN public.employees e ON e.id = a.employee_id
  JOIN public.projects p ON p.id = a.project_id
  WHERE e.agency_id IS DISTINCT FROM p.agency_id;

  RAISE NOTICE 'allocations agency_id backfill: total=%, still_null=%, employee_project_mismatch=%',
    v_total, v_null, v_mismatch;

  IF v_null > 0 THEN
    RAISE EXCEPTION
      'allocations.agency_id backfill incomplete: % row(s) still NULL (total %). Aborting; no schema change kept.',
      v_null, v_total;
  END IF;

  IF v_mismatch > 0 THEN
    RAISE NOTICE
      'WARNING: % allocation(s) have employee.agency_id <> project.agency_id. Rows kept; agency_id set from employee. New writes will be rejected by trigger until fixed.',
      v_mismatch;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3) NOT NULL + índices
-- ---------------------------------------------------------------------------

ALTER TABLE public.allocations
  ALTER COLUMN agency_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_allocations_agency_id
  ON public.allocations (agency_id);

CREATE INDEX IF NOT EXISTS idx_allocations_agency_week
  ON public.allocations (agency_id, week_start_date);

CREATE INDEX IF NOT EXISTS idx_allocations_agency_employee_week
  ON public.allocations (agency_id, employee_id, week_start_date);

-- ---------------------------------------------------------------------------
-- 4) Trigger: rellenar + validar coherencia en escrituras nuevas
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.allocations_set_agency_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_emp_agency uuid;
  v_proj_agency uuid;
BEGIN
  IF NEW.employee_id IS NULL THEN
    RAISE EXCEPTION 'allocations.employee_id is required';
  END IF;
  IF NEW.project_id IS NULL THEN
    RAISE EXCEPTION 'allocations.project_id is required';
  END IF;

  SELECT e.agency_id INTO v_emp_agency
  FROM public.employees e
  WHERE e.id = NEW.employee_id;

  IF v_emp_agency IS NULL THEN
    RAISE EXCEPTION 'allocations: employee % not found or has no agency_id', NEW.employee_id;
  END IF;

  SELECT p.agency_id INTO v_proj_agency
  FROM public.projects p
  WHERE p.id = NEW.project_id;

  IF v_proj_agency IS NULL THEN
    RAISE EXCEPTION 'allocations: project % not found or has no agency_id', NEW.project_id;
  END IF;

  IF v_emp_agency IS DISTINCT FROM v_proj_agency THEN
    RAISE EXCEPTION
      'allocations agency mismatch: employee agency % <> project agency %',
      v_emp_agency, v_proj_agency
      USING ERRCODE = '23514';
  END IF;

  -- Si el cliente envía agency_id, debe coincidir; si viene NULL, se rellena.
  IF NEW.agency_id IS NULL THEN
    NEW.agency_id := v_emp_agency;
  ELSIF NEW.agency_id IS DISTINCT FROM v_emp_agency THEN
    RAISE EXCEPTION
      'allocations.agency_id % does not match employee agency %',
      NEW.agency_id, v_emp_agency
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_allocations_set_agency_id ON public.allocations;
CREATE TRIGGER trg_allocations_set_agency_id
  BEFORE INSERT OR UPDATE OF employee_id, project_id, agency_id
  ON public.allocations
  FOR EACH ROW
  EXECUTE FUNCTION public.allocations_set_agency_id();

COMMENT ON FUNCTION public.allocations_set_agency_id() IS
  'Rellena allocations.agency_id desde employees y exige misma agencia en projects. No aplica a filas históricas ya backfilleadas hasta que se actualicen employee_id/project_id/agency_id.';

REVOKE ALL ON FUNCTION public.allocations_set_agency_id() FROM PUBLIC;

-- Verificación post-migración (conteos; no modifica datos):
-- SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE agency_id IS NULL) AS nulls FROM public.allocations;
-- SELECT COUNT(*) FROM public.allocations a
--   JOIN employees e ON e.id = a.employee_id
--   JOIN projects p ON p.id = a.project_id
--   WHERE e.agency_id IS DISTINCT FROM p.agency_id;
