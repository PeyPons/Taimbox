-- Reglas de notificación por agencia (email vía Resend desde Edge Functions)
-- notification_deliveries: auditoría / deduplicación; solo accesible con service role (RLS sin políticas)

CREATE TABLE public.notification_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  trigger_type text NOT NULL CHECK (trigger_type IN ('scheduled', 'task_transfer_pending')),
  schedule_hour_utc integer CHECK (schedule_hour_utc IS NULL OR (schedule_hour_utc >= 0 AND schedule_hour_utc <= 23)),
  conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  recipient_policy text NOT NULL CHECK (recipient_policy IN (
    'transfer_target',
    'transfer_source',
    'all_with_hours_in_month',
    'role_name',
    'agency_admins',
    'custom_emails'
  )),
  recipient_role_name text,
  extra_emails text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_notification_rules_agency_enabled ON public.notification_rules (agency_id) WHERE enabled = true;
CREATE INDEX idx_notification_rules_trigger ON public.notification_rules (agency_id, trigger_type) WHERE enabled = true;

CREATE TABLE public.notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  rule_id uuid REFERENCES public.notification_rules(id) ON DELETE SET NULL,
  dedupe_key text NOT NULL,
  trigger_type text NOT NULL,
  payload jsonb,
  recipient_emails text[] NOT NULL,
  resend_id text,
  success boolean NOT NULL,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT notification_deliveries_dedupe UNIQUE (agency_id, dedupe_key)
);

CREATE INDEX idx_notification_deliveries_agency_created ON public.notification_deliveries (agency_id, created_at DESC);

COMMENT ON TABLE public.notification_rules IS 'Reglas configurables de avisos por email (evaluadas en Edge Functions).';
COMMENT ON TABLE public.notification_deliveries IS 'Registro de envíos y deduplicación; inserción solo desde service role.';

-- RLS: miembros de la agencia (user_agencies) pueden gestionar reglas
ALTER TABLE public.notification_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY notification_rules_select ON public.notification_rules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_agencies ua
      WHERE ua.user_id = auth.uid() AND ua.agency_id = notification_rules.agency_id
    )
  );

CREATE POLICY notification_rules_insert ON public.notification_rules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_agencies ua
      WHERE ua.user_id = auth.uid() AND ua.agency_id = notification_rules.agency_id
    )
  );

CREATE POLICY notification_rules_update ON public.notification_rules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_agencies ua
      WHERE ua.user_id = auth.uid() AND ua.agency_id = notification_rules.agency_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_agencies ua
      WHERE ua.user_id = auth.uid() AND ua.agency_id = notification_rules.agency_id
    )
  );

CREATE POLICY notification_rules_delete ON public.notification_rules
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_agencies ua
      WHERE ua.user_id = auth.uid() AND ua.agency_id = notification_rules.agency_id
    )
  );

ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_rules TO authenticated;
GRANT ALL ON public.notification_rules TO service_role;

GRANT ALL ON public.notification_deliveries TO service_role;

CREATE OR REPLACE FUNCTION public.notification_rules_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notification_rules_updated_at
  BEFORE UPDATE ON public.notification_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.notification_rules_set_updated_at();
