-- Add assigned_budget column to marketing_categories for Top-Down Budgeting
ALTER TABLE public.marketing_categories 
ADD COLUMN assigned_budget numeric DEFAULT 0;

COMMENT ON COLUMN public.marketing_categories.assigned_budget IS 'Presupuesto anual asignado a la categoria (Top-Down)';
