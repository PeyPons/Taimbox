-- Añadir 'enterprise' al CHECK constraint de plan_id
-- Permite agencies con plan_id = 'enterprise' para equipos de +50 empleados

ALTER TABLE public.agencies
  DROP CONSTRAINT IF EXISTS agencies_plan_id_check;

ALTER TABLE public.agencies
  ADD CONSTRAINT agencies_plan_id_check
  CHECK (plan_id IN ('starter', 'pro', 'business', 'enterprise'));

COMMENT ON COLUMN public.agencies.plan_id IS 'Plan de suscripción: starter, pro, business, enterprise';
