-- Límite de horas del cronómetro configurable por agencia (frontend).
-- La BD permite hasta 24h por entrada; cada agencia elige su máximo (p. ej. 12h) en settings.timeTrackerMaxHours.

ALTER TABLE public.time_entries
DROP CONSTRAINT IF EXISTS max_hours_per_entry;

ALTER TABLE public.time_entries
ADD CONSTRAINT max_hours_per_entry CHECK (hours <= 24::numeric);

COMMENT ON CONSTRAINT max_hours_per_entry ON public.time_entries IS
'Máximo 24h por entrada; el límite efectivo por sesión es configurable por agencia (timeTrackerMaxHours).';
 