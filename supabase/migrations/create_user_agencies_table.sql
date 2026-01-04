-- Migración: Sistema de gestión de múltiples agencias
-- Permite que un usuario pertenezca a múltiples agencias con diferentes roles

-- 1. Crear tabla de relación usuario-agencia
CREATE TABLE IF NOT EXISTS user_agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  role TEXT, -- Rol del usuario en esta agencia específica
  department TEXT, -- Departamento del usuario en esta agencia
  is_primary BOOLEAN DEFAULT false, -- Si es la agencia principal del usuario
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, agency_id) -- Un usuario solo puede estar una vez en cada agencia
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_user_agencies_user_id ON user_agencies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_agencies_agency_id ON user_agencies(agency_id);
CREATE INDEX IF NOT EXISTS idx_user_agencies_primary ON user_agencies(user_id, is_primary) WHERE is_primary = true;

-- 2. Migrar datos existentes: crear entradas en user_agencies para empleados existentes
-- Esto mantiene compatibilidad con el sistema actual
INSERT INTO user_agencies (user_id, agency_id, role, department, is_primary)
SELECT DISTINCT
  e.user_id,
  e.agency_id,
  e.role,
  e.department,
  true -- Marcar como primaria para usuarios existentes
FROM employees e
WHERE e.user_id IS NOT NULL
  AND e.agency_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_agencies ua
    WHERE ua.user_id = e.user_id AND ua.agency_id = e.agency_id
  );

-- 3. Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_user_agencies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_agencies_updated_at
  BEFORE UPDATE ON user_agencies
  FOR EACH ROW
  EXECUTE FUNCTION update_user_agencies_updated_at();

-- 4. Función helper para obtener la agencia actual de un usuario
CREATE OR REPLACE FUNCTION get_user_current_agency(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_agency_id UUID;
BEGIN
  -- Primero intentar obtener la agencia marcada como primaria
  SELECT agency_id INTO v_agency_id
  FROM user_agencies
  WHERE user_id = p_user_id AND is_primary = true
  LIMIT 1;
  
  -- Si no hay primaria, obtener la primera agencia del usuario
  IF v_agency_id IS NULL THEN
    SELECT agency_id INTO v_agency_id
    FROM user_agencies
    WHERE user_id = p_user_id
    ORDER BY joined_at ASC
    LIMIT 1;
  END IF;
  
  RETURN v_agency_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Comentarios para documentación
COMMENT ON TABLE user_agencies IS 'Relación N:M entre usuarios y agencias. Permite que un usuario pertenezca a múltiples agencias.';
COMMENT ON COLUMN user_agencies.is_primary IS 'Indica si esta es la agencia principal del usuario (la que se muestra por defecto).';
COMMENT ON COLUMN user_agencies.role IS 'Rol del usuario en esta agencia específica (puede diferir entre agencias).';

