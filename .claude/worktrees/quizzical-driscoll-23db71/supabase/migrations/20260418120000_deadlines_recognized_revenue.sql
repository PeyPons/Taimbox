-- Ingreso reconocido por mes para proyectos tipo Entregable (rentabilidad / Salud financiera).
ALTER TABLE public.deadlines
  ADD COLUMN IF NOT EXISTS recognized_revenue numeric;

COMMENT ON COLUMN public.deadlines.recognized_revenue IS
  'Fee reconocido en € para este mes (proyectos Entregable). NULL = usar projects.monthly_fee en métricas.';
