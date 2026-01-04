-- Migración para sincronizar roles y departamentos entre employees y user_agencies
-- Asegura que todos los empleados con user_id tengan registro en user_agencies
-- y que los roles/departamentos estén sincronizados

-- 1. Crear registros en user_agencies para empleados que no los tengan
INSERT INTO user_agencies (user_id, agency_id, role, department, is_primary)
SELECT DISTINCT
  e.user_id,
  e.agency_id,
  e.role,
  e.department,
  -- Marcar como primaria solo si es el único registro del usuario o si ya tiene is_primary=true
  CASE 
    WHEN (
      SELECT COUNT(*) 
      FROM employees e2 
      WHERE e2.user_id = e.user_id AND e2.user_id IS NOT NULL
    ) = 1 THEN true
    WHEN EXISTS (
      SELECT 1 
      FROM user_agencies ua2 
      WHERE ua2.user_id = e.user_id AND ua2.is_primary = true
    ) THEN false
    ELSE false
  END
FROM employees e
WHERE e.user_id IS NOT NULL
  AND e.agency_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM user_agencies ua
    WHERE ua.user_id = e.user_id 
      AND ua.agency_id = e.agency_id
  )
ON CONFLICT (user_id, agency_id) DO NOTHING;

-- 2. Actualizar roles y departamentos en user_agencies desde employees
-- Solo si user_agencies tiene NULL y employees tiene un valor
UPDATE user_agencies ua
SET 
  role = COALESCE(ua.role, e.role),
  department = COALESCE(ua.department, e.department),
  updated_at = NOW()
FROM employees e
WHERE ua.user_id = e.user_id
  AND ua.agency_id = e.agency_id
  AND (
    (ua.role IS NULL AND e.role IS NOT NULL) OR
    (ua.department IS NULL AND e.department IS NOT NULL)
  );

-- 3. Asegurar que al menos un registro por usuario tenga is_primary = true
-- Si ningún registro tiene is_primary, marcar el más antiguo
UPDATE user_agencies ua1
SET is_primary = true
WHERE NOT EXISTS (
  SELECT 1 
  FROM user_agencies ua2 
  WHERE ua2.user_id = ua1.user_id 
    AND ua2.is_primary = true
)
AND ua1.id = (
  SELECT id 
  FROM user_agencies ua3 
  WHERE ua3.user_id = ua1.user_id 
  ORDER BY joined_at ASC, created_at ASC 
  LIMIT 1
);

-- 4. Comentario explicativo
COMMENT ON TABLE user_agencies IS 'Relación N:M entre usuarios y agencias. Los roles y departamentos aquí son específicos por agencia. Si un usuario está en múltiples agencias, puede tener diferentes roles en cada una.';

