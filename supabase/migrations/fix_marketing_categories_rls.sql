-- Fix Marketing Categories RLS Policy
-- Corrige el error "more than one row returned by a subquery used as an expression"
-- Ejecutar este script en Supabase SQL Editor

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view marketing categories" ON marketing_categories;

-- Recreate with fixed subquery using EXISTS instead of scalar subquery
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
      OR EXISTS (SELECT 1 FROM employees WHERE user_id = auth.uid() AND id = ANY(allowed_employees))
    )
  );
