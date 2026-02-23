-- Añadir restricción UNIQUE para (allocation_id, date) en time_entries
-- Esto es necesario para que el UPSERT de log_timer_hours funcione correctamente.

-- Primero, agrupar las posibles entradas duplicadas que hayan podido crearse sumando sus horas 
-- y quedándonos con la más reciente o con una sola agregada, para poder crear el índice.
WITH duplicates AS (
  SELECT allocation_id, date, SUM(hours) as total_hours, STRING_AGG(notes, E'\n') as merged_notes, MIN(id) as keep_id
  FROM public.time_entries
  GROUP BY allocation_id, date
  HAVING COUNT(*) > 1
)
UPDATE public.time_entries t
SET hours = d.total_hours,
    notes = d.merged_notes
FROM duplicates d
WHERE t.id = d.keep_id;

-- Borrar el resto de las filas duplicadas
DELETE FROM public.time_entries t
WHERE EXISTS (
  SELECT 1 FROM public.time_entries t2
  WHERE t.allocation_id = t2.allocation_id 
    AND t.date = t2.date 
    AND t.id > t2.id
);

-- Ahora sí, crear la restricción
ALTER TABLE public.time_entries 
ADD CONSTRAINT time_entries_allocation_date_unique UNIQUE (allocation_id, date);
