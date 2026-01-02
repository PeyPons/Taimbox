-- ============================================
-- Migración: Crear tabla agencies
-- Objetivo: Soportar múltiples equipos/empresas
-- ============================================

-- Tabla principal de agencias
CREATE TABLE agencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT agencies_name_unique UNIQUE (name),
  CONSTRAINT agencies_slug_unique UNIQUE (slug)
);

-- Índices para búsqueda rápida
CREATE INDEX idx_agencies_slug ON agencies(slug);
CREATE INDEX idx_agencies_name ON agencies(name);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_agencies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_agencies_updated_at
  BEFORE UPDATE ON agencies
  FOR EACH ROW
  EXECUTE FUNCTION update_agencies_updated_at();

-- Comentarios de documentación
COMMENT ON TABLE agencies IS 'Tabla de agencias/empresas que usan el sistema';
COMMENT ON COLUMN agencies.name IS 'Nombre de la agencia (ej: Coco Solution)';
COMMENT ON COLUMN agencies.slug IS 'Identificador URL-friendly (ej: coco-solution)';
COMMENT ON COLUMN agencies.settings IS 'Configuración JSONB: modules, roles, branding, etc.';

-- Estructura esperada de settings:
-- {
--   "modules": {
--     "seo": true,
--     "ppc": true,
--     "analytics": false
--   },
--   "roles": ["Responsable", "Coordinador", "SEO", "PPC"],
--   "branding": {
--     "primaryColor": "#FF5500",
--     "logo": "https://..."
--   },
--   "features": {
--     "weeklyFeedback": true,
--     "professionalGoals": true,
--     "deadlines": true
--   }
-- }
