-- Tabla para almacenar feedback semanal de empleados (bloqueos y justificaciones)
CREATE TABLE IF NOT EXISTS weekly_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL, -- Lunes de la semana reportada
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL, -- Opcional, si el bloqueo es general
  allocation_id UUID REFERENCES allocations(id) ON DELETE SET NULL, -- Para vincular a una tarea específica
  reason TEXT CHECK (reason IN ('technical_issue', 'client_blocker', 'bad_estimation', 'personal_absence', 'other')),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_weekly_feedback_employee_id ON weekly_feedback(employee_id);
CREATE INDEX IF NOT EXISTS idx_weekly_feedback_week_start_date ON weekly_feedback(week_start_date);
CREATE INDEX IF NOT EXISTS idx_weekly_feedback_project_id ON weekly_feedback(project_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE weekly_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Empleados pueden insertar y ver sus propios registros
CREATE POLICY "Employees can insert their own feedback"
  ON weekly_feedback
  FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM employees WHERE id = employee_id));

CREATE POLICY "Employees can view their own feedback"
  ON weekly_feedback
  FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM employees WHERE id = employee_id));

-- Policy: Managers y Admins pueden ver todas las entradas
CREATE POLICY "Managers and admins can view all feedback"
  ON weekly_feedback
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM employees 
      WHERE role IN ('admin', 'manager') OR role = 'Responsable'
    )
  );

-- Comentarios
COMMENT ON TABLE weekly_feedback IS 'Feedback semanal de empleados sobre bloqueos y desviaciones';
COMMENT ON COLUMN weekly_feedback.week_start_date IS 'Fecha de inicio de la semana (lunes)';
COMMENT ON COLUMN weekly_feedback.reason IS 'Razón del bloqueo: technical_issue, client_blocker, bad_estimation, personal_absence, other';
COMMENT ON COLUMN weekly_feedback.comments IS 'Comentarios adicionales del empleado';

