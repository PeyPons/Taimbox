-- Presupuesto de un periodo (varios meses) además del objetivo del mes.

ALTER TABLE public.client_settings
  ADD COLUMN IF NOT EXISTS budget_mode text NOT NULL DEFAULT 'month',
  ADD COLUMN IF NOT EXISTS budget_period_start date,
  ADD COLUMN IF NOT EXISTS budget_period_end date;

ALTER TABLE public.client_settings
  DROP CONSTRAINT IF EXISTS client_settings_budget_mode_check;

ALTER TABLE public.client_settings
  ADD CONSTRAINT client_settings_budget_mode_check
  CHECK (budget_mode IN ('month', 'period'));

ALTER TABLE public.client_settings
  DROP CONSTRAINT IF EXISTS client_settings_budget_period_range;

ALTER TABLE public.client_settings
  ADD CONSTRAINT client_settings_budget_period_range
  CHECK (
    budget_mode = 'month'
    OR (
      budget_period_start IS NOT NULL
      AND budget_period_end IS NOT NULL
      AND budget_period_start <= budget_period_end
    )
  );

COMMENT ON COLUMN public.client_settings.budget_mode IS
  'month: budget_limit es el objetivo del mes en curso. period: budget_limit es el total entre budget_period_start y budget_period_end.';
COMMENT ON COLUMN public.client_settings.budget_period_start IS
  'Primer día del periodo cuando budget_mode = period.';
COMMENT ON COLUMN public.client_settings.budget_period_end IS
  'Último día del periodo cuando budget_mode = period.';
