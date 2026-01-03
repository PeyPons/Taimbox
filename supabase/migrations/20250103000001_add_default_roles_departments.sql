-- ============================================
-- Migración: Añadir roles y departamentos por defecto a agencias existentes
-- Fecha: 2025-01-03
-- ============================================

-- Añadir roles por defecto a agencias que no los tienen
UPDATE agencies
SET settings = jsonb_set(
  COALESCE(settings, '{}'::jsonb),
  '{roles}',
  '["Responsable", "Coordinador", "Especialista"]'::jsonb
)
WHERE settings->>'roles' IS NULL
   OR settings->'roles' = 'null'::jsonb
   OR jsonb_array_length(settings->'roles') = 0;

-- Añadir departamentos por defecto a agencias que no los tienen
UPDATE agencies
SET settings = jsonb_set(
  COALESCE(settings, '{}'::jsonb),
  '{departments}',
  '["SEO", "PPC"]'::jsonb
)
WHERE settings->>'departments' IS NULL
   OR settings->'departments' = 'null'::jsonb;

-- Asegurar que el color de branding por defecto esté configurado
UPDATE agencies
SET settings = jsonb_set(
  COALESCE(settings, '{}'::jsonb),
  '{branding}',
  jsonb_set(
    COALESCE(settings->'branding', '{}'::jsonb),
    '{primaryColor}',
    '"#6366f1"'::jsonb
  )
)
WHERE settings->'branding'->>'primaryColor' IS NULL;

-- Añadir permiso can_access_agency_settings a empleados existentes que tienen can_access_settings
UPDATE employees
SET permissions = jsonb_set(
  COALESCE(permissions, '{}'::jsonb),
  '{can_access_agency_settings}',
  COALESCE(permissions->'can_access_settings', 'true'::jsonb)
)
WHERE permissions IS NOT NULL 
  AND permissions->>'can_access_agency_settings' IS NULL;

-- Comentarios
COMMENT ON COLUMN agencies.settings IS 'Configuración JSONB: modules, roles, departments, branding, projectFilters, integrations';
