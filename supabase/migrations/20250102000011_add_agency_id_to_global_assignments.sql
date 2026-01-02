-- Migración: Agregar agency_id a global_assignments
-- Objetivo: Separar asignaciones globales por agencia y evitar cruce de datos

-- 1. Agregar columna
ALTER TABLE global_assignments 
ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE;

-- 2. Backfill de datos existentes
-- Asignar la agencia basándose en el empleado que creó la asignación (employee_id)
UPDATE global_assignments
SET agency_id = employees.agency_id
FROM employees
WHERE global_assignments.employee_id = employees.id
AND global_assignments.agency_id IS NULL;

-- 3. Crear índice
CREATE INDEX IF NOT EXISTS idx_global_assignments_agency_id ON global_assignments(agency_id);

-- 4. Comentario
COMMENT ON COLUMN global_assignments.agency_id IS 'Agencia a la que pertenece la asignación global';
