-- Presupuesto diario real de Meta (campaña o suma de conjuntos activos), en la moneda de la cuenta.

ALTER TABLE public.meta_ads_campaigns
  ADD COLUMN IF NOT EXISTS daily_budget numeric DEFAULT 0;

COMMENT ON COLUMN public.meta_ads_campaigns.daily_budget IS
  'Límite diario en unidades de la moneda. Si la campaña tiene daily_budget, ese valor; si no, la suma de los conjuntos activos. No es el gasto medio.';
