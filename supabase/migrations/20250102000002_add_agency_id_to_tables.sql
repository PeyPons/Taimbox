-- ============================================
-- Migración: Agregar agency_id a tablas principales
-- Objetivo: Vincular datos con agencias
-- ============================================

-- 1. Agregar columna agency_id a employees
ALTER TABLE employees
ADD COLUMN agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE;

-- 2. Agregar columna agency_id a clients
ALTER TABLE clients
ADD COLUMN agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE;

-- 3. Agregar columna agency_id a projects
ALTER TABLE projects
ADD COLUMN agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE;

-- Crear índices para queries eficientes
CREATE INDEX idx_employees_agency_id ON employees(agency_id);
CREATE INDEX idx_clients_agency_id ON clients(agency_id);
CREATE INDEX idx_projects_agency_id ON projects(agency_id);

-- Índices compuestos para queries frecuentes
CREATE INDEX idx_employees_agency_active ON employees(agency_id, is_active);
CREATE INDEX idx_projects_agency_status ON projects(agency_id, status);
CREATE INDEX idx_clients_agency_name ON clients(agency_id, name);

-- Comentarios de documentación
COMMENT ON COLUMN employees.agency_id IS 'FK a agencies - agencia a la que pertenece el empleado';
COMMENT ON COLUMN clients.agency_id IS 'FK a agencies - agencia a la que pertenece el cliente';
COMMENT ON COLUMN projects.agency_id IS 'FK a agencies - agencia a la que pertenece el proyecto';
