-- Mejoras adicionales para la tabla user_agencies
-- Estas mejoras aseguran integridad referencial y mejor rendimiento

-- 1. Asegurar que solo haya una agencia primaria por usuario
-- Crear función para validar que solo hay una is_primary = true por usuario
CREATE OR REPLACE FUNCTION ensure_single_primary_agency()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se está marcando como primaria, quitar is_primary de otras agencias del mismo usuario
  IF NEW.is_primary = true THEN
    UPDATE user_agencies
    SET is_primary = false
    WHERE user_id = NEW.user_id
      AND agency_id != NEW.agency_id
      AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para asegurar una sola agencia primaria
DROP TRIGGER IF EXISTS trigger_ensure_single_primary_agency ON user_agencies;
CREATE TRIGGER trigger_ensure_single_primary_agency
  BEFORE INSERT OR UPDATE ON user_agencies
  FOR EACH ROW
  WHEN (NEW.is_primary = true)
  EXECUTE FUNCTION ensure_single_primary_agency();

-- 2. Índice compuesto para búsquedas frecuentes (user_id + agency_id)
CREATE INDEX IF NOT EXISTS idx_user_agencies_user_agency 
  ON user_agencies(user_id, agency_id);

-- 3. Índice para búsquedas por agencia (útil para getAgencyMembers)
CREATE INDEX IF NOT EXISTS idx_user_agencies_agency_user 
  ON user_agencies(agency_id, user_id);

-- 4. Comentarios adicionales
COMMENT ON FUNCTION ensure_single_primary_agency() IS 
  'Asegura que un usuario solo tenga una agencia marcada como primaria (is_primary = true)';

