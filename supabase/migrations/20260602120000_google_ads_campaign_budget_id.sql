-- Presupuesto compartido Google Ads: varias campañas pueden apuntar al mismo campaign_budget.

ALTER TABLE public.google_ads_campaigns
  ADD COLUMN IF NOT EXISTS budget_id text;

COMMENT ON COLUMN public.google_ads_campaigns.budget_id IS
  'ID del campaign_budget en Google Ads. Varias campañas pueden compartir el mismo presupuesto (cartera).';
