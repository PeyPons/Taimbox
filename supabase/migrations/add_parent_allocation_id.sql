-- Añadir columna para trazabilidad (Recursive Relationship)
-- Verificar si la columna ya existe antes de añadirla
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'allocations' 
        AND column_name = 'parent_allocation_id'
    ) THEN
        ALTER TABLE allocations 
        ADD COLUMN parent_allocation_id UUID REFERENCES allocations(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Crear índice para mejorar consultas de rollover (si no existe)
CREATE INDEX IF NOT EXISTS idx_allocations_parent_allocation_id 
ON allocations(parent_allocation_id) 
WHERE parent_allocation_id IS NOT NULL;

-- Comentario en la columna
COMMENT ON COLUMN allocations.parent_allocation_id IS 
'ID de la tarea padre cuando se hace rollover. Permite rastrear tareas fragmentadas entre semanas.';
