-- Marketing Ledger Migration
-- Sistema de Control Presupuestario de Marketing
-- Run this SQL in Supabase SQL Editor or via CLI

-- ============================================
-- 1. MARKETING BUDGETS (Contenedor Anual)
-- Define el techo de gasto para un año (ej: 2026 - 69.500 EUR)
-- ============================================

CREATE TABLE IF NOT EXISTS marketing_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  year INT NOT NULL,
  total_budget NUMERIC(12,2) NOT NULL,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: solo un presupuesto por año por agencia
  UNIQUE(agency_id, year)
);

-- Indexes for marketing_budgets
CREATE INDEX IF NOT EXISTS idx_marketing_budgets_agency ON marketing_budgets(agency_id);
CREATE INDEX IF NOT EXISTS idx_marketing_budgets_year ON marketing_budgets(year);

-- Enable RLS
ALTER TABLE marketing_budgets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketing_budgets
CREATE POLICY "Users can view agency marketing budgets" ON marketing_budgets
  FOR SELECT USING (
    agency_id IN (
      SELECT agency_id FROM employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert marketing budgets" ON marketing_budgets
  FOR INSERT WITH CHECK (
    agency_id IN (
      SELECT agency_id FROM employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update marketing budgets" ON marketing_budgets
  FOR UPDATE USING (
    agency_id IN (
      SELECT agency_id FROM employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete marketing budgets" ON marketing_budgets
  FOR DELETE USING (
    agency_id IN (
      SELECT agency_id FROM employees WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 2. MARKETING CATEGORIES (Jerarquia de Partidas)
-- Las "filas" del Excel. Soporta anidacion (Padre -> Hijo).
-- ============================================

CREATE TABLE IF NOT EXISTS marketing_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES marketing_budgets(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES marketing_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,

  -- Configuracion del KPI manual
  kpi_name TEXT, -- Ej: "Leads", "Registros", "Ventas"
  kpi_target_cost NUMERIC(10,2), -- Ej: CPL objetivo 15 EUR (opcional)

  -- Permisos: Quien puede ver/editar esta fila especifica
  -- Si esta vacio, solo lo ven admins. Si contiene IDs, esos empleados pueden ver/operar
  allowed_employees UUID[] DEFAULT '{}',

  -- Orden de visualizacion dentro del mismo nivel
  sort_order INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for marketing_categories
CREATE INDEX IF NOT EXISTS idx_marketing_categories_budget ON marketing_categories(budget_id);
CREATE INDEX IF NOT EXISTS idx_marketing_categories_parent ON marketing_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_marketing_categories_allowed ON marketing_categories USING GIN(allowed_employees);

-- Enable RLS
ALTER TABLE marketing_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketing_categories
-- Usuarios pueden ver categorias si pertenecen a la agencia Y (allowed_employees esta vacio O contiene su employee_id)
CREATE POLICY "Users can view marketing categories" ON marketing_categories
  FOR SELECT USING (
    budget_id IN (
      SELECT mb.id FROM marketing_budgets mb
      JOIN employees e ON e.agency_id = mb.agency_id
      WHERE e.user_id = auth.uid()
    )
    AND (
      array_length(allowed_employees, 1) IS NULL
      OR allowed_employees = '{}'
      OR (SELECT id FROM employees WHERE user_id = auth.uid()) = ANY(allowed_employees)
    )
  );

CREATE POLICY "Users can insert marketing categories" ON marketing_categories
  FOR INSERT WITH CHECK (
    budget_id IN (
      SELECT mb.id FROM marketing_budgets mb
      JOIN employees e ON e.agency_id = mb.agency_id
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update marketing categories" ON marketing_categories
  FOR UPDATE USING (
    budget_id IN (
      SELECT mb.id FROM marketing_budgets mb
      JOIN employees e ON e.agency_id = mb.agency_id
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete marketing categories" ON marketing_categories
  FOR DELETE USING (
    budget_id IN (
      SELECT mb.id FROM marketing_budgets mb
      JOIN employees e ON e.agency_id = mb.agency_id
      WHERE e.user_id = auth.uid()
    )
  );

-- ============================================
-- 3. MARKETING MONTHLY PLANS (La Matriz)
-- Almacena la foto de cada mes.
-- ============================================

CREATE TABLE IF NOT EXISTS marketing_monthly_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES marketing_categories(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- Siempre dia 1 (2026-01-01, 2026-02-01...)

  budget_allocated NUMERIC(12,2) DEFAULT 0, -- Lo que se asigno (se actualiza solo via movimientos)
  real_spent NUMERIC(12,2) DEFAULT 0, -- Gasto real (Facturas)

  -- Resultados manuales
  manual_result_value NUMERIC(10,2) DEFAULT 0, -- Ej: 45 (Leads)
  manual_result_notes TEXT, -- Notas: "Datos sacados del CRM el dia 30"

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: solo un plan por categoria/mes
  UNIQUE(category_id, month)
);

-- Indexes for marketing_monthly_plans
CREATE INDEX IF NOT EXISTS idx_marketing_monthly_plans_category ON marketing_monthly_plans(category_id);
CREATE INDEX IF NOT EXISTS idx_marketing_monthly_plans_month ON marketing_monthly_plans(month);

-- Enable RLS
ALTER TABLE marketing_monthly_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketing_monthly_plans
CREATE POLICY "Users can view marketing monthly plans" ON marketing_monthly_plans
  FOR SELECT USING (
    category_id IN (
      SELECT mc.id FROM marketing_categories mc
      JOIN marketing_budgets mb ON mb.id = mc.budget_id
      JOIN employees e ON e.agency_id = mb.agency_id
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert marketing monthly plans" ON marketing_monthly_plans
  FOR INSERT WITH CHECK (
    category_id IN (
      SELECT mc.id FROM marketing_categories mc
      JOIN marketing_budgets mb ON mb.id = mc.budget_id
      JOIN employees e ON e.agency_id = mb.agency_id
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update marketing monthly plans" ON marketing_monthly_plans
  FOR UPDATE USING (
    category_id IN (
      SELECT mc.id FROM marketing_categories mc
      JOIN marketing_budgets mb ON mb.id = mc.budget_id
      JOIN employees e ON e.agency_id = mb.agency_id
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete marketing monthly plans" ON marketing_monthly_plans
  FOR DELETE USING (
    category_id IN (
      SELECT mc.id FROM marketing_categories mc
      JOIN marketing_budgets mb ON mb.id = mc.budget_id
      JOIN employees e ON e.agency_id = mb.agency_id
      WHERE e.user_id = auth.uid()
    )
  );

-- ============================================
-- 4. BUDGET MOVEMENTS (El Libro Mayor)
-- La unica forma de modificar "budget_allocated" en la tabla anterior.
-- ============================================

CREATE TABLE IF NOT EXISTS budget_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES employees(id),

  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),

  -- Origen (NULL = Inyeccion de capital externo)
  from_plan_id UUID REFERENCES marketing_monthly_plans(id) ON DELETE SET NULL,

  -- Destino (NULL = Retirada de fondos/Perdida)
  to_plan_id UUID REFERENCES marketing_monthly_plans(id) ON DELETE SET NULL,

  type TEXT NOT NULL CHECK (type IN ('initial_deposit', 'transfer', 'correction')),
  description TEXT -- "Mover remanente de Enero a Bolsa Q2"
);

-- Indexes for budget_movements
CREATE INDEX IF NOT EXISTS idx_budget_movements_created_at ON budget_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_budget_movements_created_by ON budget_movements(created_by);
CREATE INDEX IF NOT EXISTS idx_budget_movements_from ON budget_movements(from_plan_id);
CREATE INDEX IF NOT EXISTS idx_budget_movements_to ON budget_movements(to_plan_id);
CREATE INDEX IF NOT EXISTS idx_budget_movements_type ON budget_movements(type);

-- Enable RLS
ALTER TABLE budget_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for budget_movements
CREATE POLICY "Users can view budget movements" ON budget_movements
  FOR SELECT USING (
    created_by IN (
      SELECT e.id FROM employees e
      WHERE e.agency_id IN (
        SELECT agency_id FROM employees WHERE user_id = auth.uid()
      )
    )
    OR from_plan_id IN (
      SELECT mp.id FROM marketing_monthly_plans mp
      JOIN marketing_categories mc ON mc.id = mp.category_id
      JOIN marketing_budgets mb ON mb.id = mc.budget_id
      JOIN employees e ON e.agency_id = mb.agency_id
      WHERE e.user_id = auth.uid()
    )
    OR to_plan_id IN (
      SELECT mp.id FROM marketing_monthly_plans mp
      JOIN marketing_categories mc ON mc.id = mp.category_id
      JOIN marketing_budgets mb ON mb.id = mc.budget_id
      JOIN employees e ON e.agency_id = mb.agency_id
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert budget movements" ON budget_movements
  FOR INSERT WITH CHECK (
    created_by IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 5. MARKETING EXPENSES (Facturas/Gastos)
-- Para desglosar el "real_spent" de arriba.
-- ============================================

CREATE TABLE IF NOT EXISTS marketing_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_plan_id UUID NOT NULL REFERENCES marketing_monthly_plans(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  concept TEXT, -- "Factura Google Ads #FV-2026-01"
  date DATE,
  is_estimated BOOLEAN DEFAULT false, -- Para marcar gastos pendientes de cierre

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for marketing_expenses
CREATE INDEX IF NOT EXISTS idx_marketing_expenses_plan ON marketing_expenses(monthly_plan_id);
CREATE INDEX IF NOT EXISTS idx_marketing_expenses_date ON marketing_expenses(date);

-- Enable RLS
ALTER TABLE marketing_expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketing_expenses
CREATE POLICY "Users can view marketing expenses" ON marketing_expenses
  FOR SELECT USING (
    monthly_plan_id IN (
      SELECT mp.id FROM marketing_monthly_plans mp
      JOIN marketing_categories mc ON mc.id = mp.category_id
      JOIN marketing_budgets mb ON mb.id = mc.budget_id
      JOIN employees e ON e.agency_id = mb.agency_id
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert marketing expenses" ON marketing_expenses
  FOR INSERT WITH CHECK (
    monthly_plan_id IN (
      SELECT mp.id FROM marketing_monthly_plans mp
      JOIN marketing_categories mc ON mc.id = mp.category_id
      JOIN marketing_budgets mb ON mb.id = mc.budget_id
      JOIN employees e ON e.agency_id = mb.agency_id
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update marketing expenses" ON marketing_expenses
  FOR UPDATE USING (
    monthly_plan_id IN (
      SELECT mp.id FROM marketing_monthly_plans mp
      JOIN marketing_categories mc ON mc.id = mp.category_id
      JOIN marketing_budgets mb ON mb.id = mc.budget_id
      JOIN employees e ON e.agency_id = mb.agency_id
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete marketing expenses" ON marketing_expenses
  FOR DELETE USING (
    monthly_plan_id IN (
      SELECT mp.id FROM marketing_monthly_plans mp
      JOIN marketing_categories mc ON mc.id = mp.category_id
      JOIN marketing_budgets mb ON mb.id = mc.budget_id
      JOIN employees e ON e.agency_id = mb.agency_id
      WHERE e.user_id = auth.uid()
    )
  );

-- ============================================
-- 6. TRIGGERS para actualizar contadores automaticamente
-- ============================================

-- Trigger function para actualizar real_spent cuando se añade/modifica/elimina un gasto
CREATE OR REPLACE FUNCTION update_monthly_plan_spent()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE marketing_monthly_plans
    SET real_spent = real_spent + NEW.amount,
        updated_at = NOW()
    WHERE id = NEW.monthly_plan_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Si cambio el monthly_plan_id, actualizar ambos
    IF OLD.monthly_plan_id != NEW.monthly_plan_id THEN
      UPDATE marketing_monthly_plans
      SET real_spent = real_spent - OLD.amount,
          updated_at = NOW()
      WHERE id = OLD.monthly_plan_id;

      UPDATE marketing_monthly_plans
      SET real_spent = real_spent + NEW.amount,
          updated_at = NOW()
      WHERE id = NEW.monthly_plan_id;
    ELSE
      -- Solo cambio el monto
      UPDATE marketing_monthly_plans
      SET real_spent = real_spent - OLD.amount + NEW.amount,
          updated_at = NOW()
      WHERE id = NEW.monthly_plan_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE marketing_monthly_plans
    SET real_spent = real_spent - OLD.amount,
        updated_at = NOW()
    WHERE id = OLD.monthly_plan_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS trg_update_monthly_plan_spent ON marketing_expenses;
CREATE TRIGGER trg_update_monthly_plan_spent
  AFTER INSERT OR UPDATE OR DELETE ON marketing_expenses
  FOR EACH ROW EXECUTE FUNCTION update_monthly_plan_spent();

-- Trigger function para actualizar budget_allocated cuando se crea un movimiento
CREATE OR REPLACE FUNCTION apply_budget_movement()
RETURNS TRIGGER AS $$
BEGIN
  -- Restar del origen (si existe)
  IF NEW.from_plan_id IS NOT NULL THEN
    UPDATE marketing_monthly_plans
    SET budget_allocated = budget_allocated - NEW.amount,
        updated_at = NOW()
    WHERE id = NEW.from_plan_id;
  END IF;

  -- Sumar al destino (si existe)
  IF NEW.to_plan_id IS NOT NULL THEN
    UPDATE marketing_monthly_plans
    SET budget_allocated = budget_allocated + NEW.amount,
        updated_at = NOW()
    WHERE id = NEW.to_plan_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS trg_apply_budget_movement ON budget_movements;
CREATE TRIGGER trg_apply_budget_movement
  AFTER INSERT ON budget_movements
  FOR EACH ROW EXECUTE FUNCTION apply_budget_movement();

-- ============================================
-- 7. COMMENTS para documentacion
-- ============================================

COMMENT ON TABLE marketing_budgets IS 'Presupuestos anuales de marketing por agencia';
COMMENT ON TABLE marketing_categories IS 'Categorias jerarquicas de gasto (SEM, Social, etc.)';
COMMENT ON TABLE marketing_monthly_plans IS 'Planificacion y resultados mensuales por categoria';
COMMENT ON TABLE budget_movements IS 'Libro mayor de movimientos de presupuesto (trazabilidad completa)';
COMMENT ON TABLE marketing_expenses IS 'Gastos/facturas individuales asociados a cada mes/categoria';

COMMENT ON COLUMN marketing_categories.allowed_employees IS 'Array de employee IDs que pueden ver/editar esta categoria. Vacio = solo admins';
COMMENT ON COLUMN marketing_monthly_plans.budget_allocated IS 'Presupuesto asignado, solo modificable via budget_movements';
COMMENT ON COLUMN marketing_monthly_plans.manual_result_value IS 'Valor de resultados ingresado manualmente (leads, ventas, etc.)';
COMMENT ON COLUMN budget_movements.from_plan_id IS 'NULL indica inyeccion de capital externo';
COMMENT ON COLUMN budget_movements.to_plan_id IS 'NULL indica retirada de fondos';
