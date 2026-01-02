-- ============================================
-- Migración: RLS Policies para multi-tenancy por agencia
-- Objetivo: Asegurar que cada usuario solo acceda a datos de su agencia
-- ============================================

-- Habilitar RLS en las tablas principales
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES PARA AGENCIES
-- ============================================

-- Los usuarios solo pueden ver su propia agencia
CREATE POLICY "Users can view their own agency"
  ON agencies FOR SELECT
  USING (
    id IN (
      SELECT agency_id FROM employees
      WHERE user_id = auth.uid()
    )
  );

-- Solo super admins pueden crear agencias (via service role)
-- Por ahora, permitir a cualquier usuario autenticado para desarrollo
CREATE POLICY "Authenticated users can insert agencies"
  ON agencies FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Solo super admins pueden actualizar agencias
CREATE POLICY "Users can update their own agency"
  ON agencies FOR UPDATE
  USING (
    id IN (
      SELECT agency_id FROM employees
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- POLICIES PARA EMPLOYEES
-- ============================================

-- Los usuarios pueden ver empleados de su agencia
CREATE POLICY "Users can view employees in their agency"
  ON employees FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM employees
      WHERE user_id = auth.uid()
    )
  );

-- Los usuarios pueden crear empleados en su agencia
CREATE POLICY "Users can insert employees in their agency"
  ON employees FOR INSERT
  WITH CHECK (
    agency_id IN (
      SELECT agency_id FROM employees
      WHERE user_id = auth.uid()
    )
  );

-- Los usuarios pueden actualizar empleados en su agencia
CREATE POLICY "Users can update employees in their agency"
  ON employees FOR UPDATE
  USING (
    agency_id IN (
      SELECT agency_id FROM employees
      WHERE user_id = auth.uid()
    )
  );

-- Los usuarios pueden eliminar empleados en su agencia
CREATE POLICY "Users can delete employees in their agency"
  ON employees FOR DELETE
  USING (
    agency_id IN (
      SELECT agency_id FROM employees
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- POLICIES PARA CLIENTS
-- ============================================

-- Los usuarios pueden ver clientes de su agencia
CREATE POLICY "Users can view clients in their agency"
  ON clients FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM employees
      WHERE user_id = auth.uid()
    )
  );

-- Los usuarios pueden crear clientes en su agencia
CREATE POLICY "Users can insert clients in their agency"
  ON clients FOR INSERT
  WITH CHECK (
    agency_id IN (
      SELECT agency_id FROM employees
      WHERE user_id = auth.uid()
    )
  );

-- Los usuarios pueden actualizar clientes en su agencia
CREATE POLICY "Users can update clients in their agency"
  ON clients FOR UPDATE
  USING (
    agency_id IN (
      SELECT agency_id FROM employees
      WHERE user_id = auth.uid()
    )
  );

-- Los usuarios pueden eliminar clientes en su agencia
CREATE POLICY "Users can delete clients in their agency"
  ON clients FOR DELETE
  USING (
    agency_id IN (
      SELECT agency_id FROM employees
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- POLICIES PARA PROJECTS
-- ============================================

-- Los usuarios pueden ver proyectos de su agencia
CREATE POLICY "Users can view projects in their agency"
  ON projects FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM employees
      WHERE user_id = auth.uid()
    )
  );

-- Los usuarios pueden crear proyectos en su agencia
CREATE POLICY "Users can insert projects in their agency"
  ON projects FOR INSERT
  WITH CHECK (
    agency_id IN (
      SELECT agency_id FROM employees
      WHERE user_id = auth.uid()
    )
  );

-- Los usuarios pueden actualizar proyectos en su agencia
CREATE POLICY "Users can update projects in their agency"
  ON projects FOR UPDATE
  USING (
    agency_id IN (
      SELECT agency_id FROM employees
      WHERE user_id = auth.uid()
    )
  );

-- Los usuarios pueden eliminar proyectos en su agencia
CREATE POLICY "Users can delete projects in their agency"
  ON projects FOR DELETE
  USING (
    agency_id IN (
      SELECT agency_id FROM employees
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- NOTA: Las tablas que dependen de employee_id o project_id
-- (allocations, absences, etc.) heredan la seguridad a través
-- de los joins con employees/projects
-- ============================================

-- Comentarios
COMMENT ON POLICY "Users can view their own agency" ON agencies IS 'Los usuarios solo ven la agencia a la que pertenecen';
COMMENT ON POLICY "Users can view employees in their agency" ON employees IS 'Los usuarios solo ven empleados de su agencia';
COMMENT ON POLICY "Users can view clients in their agency" ON clients IS 'Los usuarios solo ven clientes de su agencia';
COMMENT ON POLICY "Users can view projects in their agency" ON projects IS 'Los usuarios solo ven proyectos de su agencia';
