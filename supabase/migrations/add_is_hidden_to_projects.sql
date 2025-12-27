-- Agregar campo is_hidden a la tabla projects
-- Permite ocultar proyectos sin eliminarlos

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;

-- Crear índice para mejorar consultas de proyectos visibles
CREATE INDEX IF NOT EXISTS idx_projects_is_hidden ON projects(is_hidden) WHERE is_hidden = FALSE;
