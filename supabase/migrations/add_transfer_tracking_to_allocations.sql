-- Añadir campos para rastrear transferencias y distribuciones en allocations
-- Esto permite un rastreo más robusto sin depender del formato de texto en task_name

-- Campo para rastrear de qué tarea original proviene una transferencia
ALTER TABLE allocations 
ADD COLUMN IF NOT EXISTS transferred_from_allocation_id UUID REFERENCES allocations(id) ON DELETE SET NULL;

-- Campo para rastrear de qué tarea transferida proviene una distribución
-- (cuando una tarea transferida se distribuye en múltiples tareas)
ALTER TABLE allocations 
ADD COLUMN IF NOT EXISTS distribution_source_allocation_id UUID REFERENCES allocations(id) ON DELETE SET NULL;

-- Índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_allocations_transferred_from ON allocations(transferred_from_allocation_id) 
WHERE transferred_from_allocation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_allocations_distribution_source ON allocations(distribution_source_allocation_id) 
WHERE distribution_source_allocation_id IS NOT NULL;

-- Comentarios
COMMENT ON COLUMN allocations.transferred_from_allocation_id IS 'ID de la tarea original de la que proviene esta transferencia. NULL si no es una transferencia.';
COMMENT ON COLUMN allocations.distribution_source_allocation_id IS 'ID de la tarea transferida de la que proviene esta distribución. NULL si no es una distribución.';

