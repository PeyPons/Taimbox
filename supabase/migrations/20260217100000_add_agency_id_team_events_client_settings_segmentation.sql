-- Migration: Añadir agency_id a tablas para aislamiento multi-tenant
-- Tablas: team_events, client_settings, segmentation_rules
-- Ejecutar en Supabase SQL Editor o con: supabase db push
-- IMPORTANTE: Haz backup antes de ejecutar en producción.

-- =============================================================================
-- 1. team_events: añadir agency_id (FK a agencies)
-- =============================================================================
ALTER TABLE public.team_events
  ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);

-- Rellenar agency_id desde el primer empleado afectado (affected_employee_ids es jsonb array)
UPDATE public.team_events te
SET agency_id = (
  SELECT e.agency_id
  FROM public.employees e,
       jsonb_array_elements_text(COALESCE(te.affected_employee_ids, '[]'::jsonb)) AS emp_id
  WHERE e.id = (emp_id)::uuid
  LIMIT 1
)
WHERE te.agency_id IS NULL;

-- Opcional: hacer NOT NULL si se desea (descomentar tras verificar que no queden nulls)
-- ALTER TABLE public.team_events ALTER COLUMN agency_id SET NOT NULL;

COMMENT ON COLUMN public.team_events.agency_id IS 'Agencia a la que pertenece el evento; usado para filtrar por tenant.';

-- =============================================================================
-- 2. client_settings: añadir agency_id (nullable para migración)
-- =============================================================================
ALTER TABLE public.client_settings
  ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);

COMMENT ON COLUMN public.client_settings.agency_id IS 'Agencia propietaria del ajuste; filtrar siempre por agency_id en lecturas/escrituras.';

-- =============================================================================
-- 3. segmentation_rules: añadir agency_id (nullable para migración)
-- =============================================================================
ALTER TABLE public.segmentation_rules
  ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id);

COMMENT ON COLUMN public.segmentation_rules.agency_id IS 'Agencia propietaria de la regla; filtrar siempre por agency_id en lecturas/escrituras.';
