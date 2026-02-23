-- Eliminar el constraint antiguo (allocation_id, date) que impedía varias filas por tarea/día.
-- Con él, solo puede existir UNA fila por (allocation_id, date), así que la RPC actualizaba
-- esa fila (a veces de otro empleado) y el usuario veía 0. Quedamos solo con
-- time_entries_employee_allocation_date_unique (employee_id, allocation_id, date).

ALTER TABLE public.time_entries
DROP CONSTRAINT IF EXISTS time_entries_allocation_id_date_key;
