-- ============================================
-- Migración: Migrar datos existentes a Coco Solution
-- Objetivo: Asignar todos los datos actuales a la primera agencia
-- ============================================

-- 1. Crear la agencia Coco Solution
INSERT INTO agencies (name, slug, settings)
VALUES (
  'Coco Solution',
  'coco-solution',
  '{
    "modules": {
      "seo": true,
      "ppc": true,
      "analytics": true,
      "weeklyFeedback": true,
      "professionalGoals": true,
      "deadlines": true
    },
    "roles": ["Responsable", "Coordinador", "SEO", "PPC"],
    "branding": {
      "primaryColor": "#FF5500"
    }
  }'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- 2. Migrar todos los empleados existentes a Coco Solution
UPDATE employees
SET agency_id = (SELECT id FROM agencies WHERE slug = 'coco-solution')
WHERE agency_id IS NULL;

-- 3. Migrar todos los clientes existentes a Coco Solution
UPDATE clients
SET agency_id = (SELECT id FROM agencies WHERE slug = 'coco-solution')
WHERE agency_id IS NULL;

-- 4. Migrar todos los proyectos existentes a Coco Solution
UPDATE projects
SET agency_id = (SELECT id FROM agencies WHERE slug = 'coco-solution')
WHERE agency_id IS NULL;

-- 5. Hacer las columnas NOT NULL después de migrar los datos
-- (Solo si hay datos, para evitar errores en instalaciones nuevas)
DO $$
BEGIN
  -- Solo agregar NOT NULL si la agencia existe y todos los registros tienen agency_id
  IF EXISTS (SELECT 1 FROM agencies WHERE slug = 'coco-solution') THEN
    -- Verificar que no queden registros sin agency_id
    IF NOT EXISTS (SELECT 1 FROM employees WHERE agency_id IS NULL) THEN
      ALTER TABLE employees ALTER COLUMN agency_id SET NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM clients WHERE agency_id IS NULL) THEN
      ALTER TABLE clients ALTER COLUMN agency_id SET NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM projects WHERE agency_id IS NULL) THEN
      ALTER TABLE projects ALTER COLUMN agency_id SET NOT NULL;
    END IF;
  END IF;
END $$;
