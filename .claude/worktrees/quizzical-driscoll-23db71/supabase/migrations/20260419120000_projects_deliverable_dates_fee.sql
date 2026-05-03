-- Entregables: precio total y ventana de fechas en el proyecto (cartera), no en deadlines.
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS deliverable_contract_fee numeric,
  ADD COLUMN IF NOT EXISTS deliverable_start_date date,
  ADD COLUMN IF NOT EXISTS deliverable_due_date date;

COMMENT ON COLUMN public.projects.deliverable_contract_fee IS
  'Importe total € del contrato entregable. NULL = usar monthly_fee como total al prorratear por meses.';
COMMENT ON COLUMN public.projects.deliverable_start_date IS
  'Inicio de la fase entregable (fecha inclusiva).';
COMMENT ON COLUMN public.projects.deliverable_due_date IS
  'Fin previsto de la fase entregable (fecha inclusiva).';
