-- Aumentar precisión de hours para registrar intervalos cortos (segundos).
-- Con 2 decimales, 30 s = 0,00833 h se redondeaba a 0,01 o 0,00 y se perdía.
-- numeric(10,6) permite hasta 9999,999999 h (6 decimales; 1 s ≈ 0,000278 h).

ALTER TABLE public.time_entries
  ALTER COLUMN hours TYPE numeric(10, 6);

COMMENT ON COLUMN public.time_entries.hours IS 'Horas registradas (precisión 6 decimales para intervalos de segundos).';

-- Misma precisión en allocations.hours_actual (suma de time_entries)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'allocations' AND column_name = 'hours_actual'
  ) THEN
    EXECUTE 'ALTER TABLE public.allocations ALTER COLUMN hours_actual TYPE numeric(12, 6)';
  END IF;
END $$;

-- timer_sessions.hours ya es numeric sin precisión fija; por consistencia fijamos (10,6)
ALTER TABLE public.timer_sessions
  ALTER COLUMN hours TYPE numeric(10, 6);
