-- Unicidad proyecto+mes en deadlines y locks; deduplicar filas huérfanas antes de crear índices.

DELETE FROM public.deadlines a
USING public.deadlines b
WHERE a.project_id = b.project_id
  AND a.month = b.month
  AND a.id < b.id;

DELETE FROM public.project_editing_locks a
USING public.project_editing_locks b
WHERE a.project_id = b.project_id
  AND a.month = b.month
  AND a.id < b.id;

CREATE UNIQUE INDEX IF NOT EXISTS deadlines_project_id_month_key
  ON public.deadlines (project_id, month);

CREATE UNIQUE INDEX IF NOT EXISTS project_editing_locks_project_id_month_key
  ON public.project_editing_locks (project_id, month);
