-- Notas del equipo en cuentas de Google Ads y Meta.

CREATE TABLE IF NOT EXISTS public.ad_account_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('google', 'meta')),
  account_id text NOT NULL,
  author_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT ad_account_notes_account_id_len CHECK (length(btrim(account_id)) BETWEEN 1 AND 200),
  CONSTRAINT ad_account_notes_body_not_empty CHECK (length(btrim(body)) > 0),
  CONSTRAINT ad_account_notes_body_max_len CHECK (length(body) <= 4000)
);

COMMENT ON TABLE public.ad_account_notes IS
  'Notas internas del equipo sobre una cuenta de Google Ads o Meta. Borrado lógico con deleted_at.';

CREATE INDEX IF NOT EXISTS idx_ad_account_notes_account
  ON public.ad_account_notes (agency_id, platform, account_id, created_at)
  WHERE deleted_at IS NULL;

CREATE OR REPLACE FUNCTION public.ad_account_notes_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.agency_id IS DISTINCT FROM OLD.agency_id
      OR NEW.platform IS DISTINCT FROM OLD.platform
      OR NEW.account_id IS DISTINCT FROM OLD.account_id
      OR NEW.author_employee_id IS DISTINCT FROM OLD.author_employee_id
      OR NEW.created_at IS DISTINCT FROM OLD.created_at
    THEN
      RAISE EXCEPTION 'ad account note identity is immutable';
    END IF;
    IF NEW.body IS DISTINCT FROM OLD.body AND NEW.deleted_at IS NULL THEN
      NEW.updated_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ad_account_notes_guard ON public.ad_account_notes;
CREATE TRIGGER ad_account_notes_guard
  BEFORE UPDATE ON public.ad_account_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.ad_account_notes_guard();

CREATE OR REPLACE FUNCTION public.ad_account_note_counts(p_agency_id uuid, p_platform text)
RETURNS TABLE(account_id text, note_count bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT n.account_id, count(*)::bigint
  FROM public.ad_account_notes n
  WHERE n.agency_id = p_agency_id
    AND n.platform = p_platform
    AND n.deleted_at IS NULL
    AND p_agency_id IN (SELECT public.user_agency_ids())
  GROUP BY n.account_id;
$$;

REVOKE ALL ON FUNCTION public.ad_account_note_counts(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ad_account_note_counts(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ad_account_note_counts(uuid, text) TO service_role;

ALTER TABLE public.ad_account_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ad_account_notes_select ON public.ad_account_notes;
CREATE POLICY ad_account_notes_select ON public.ad_account_notes
  FOR SELECT TO authenticated
  USING (agency_id IN (SELECT public.user_agency_ids()));

DROP POLICY IF EXISTS ad_account_notes_insert ON public.ad_account_notes;
CREATE POLICY ad_account_notes_insert ON public.ad_account_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    agency_id IN (SELECT public.user_agency_ids())
    AND author_employee_id IN (
      SELECT e.id
      FROM public.employees e
      WHERE e.user_id = auth.uid()
        AND e.agency_id = ad_account_notes.agency_id
        AND e.is_active = true
    )
  );

DROP POLICY IF EXISTS ad_account_notes_update ON public.ad_account_notes;
CREATE POLICY ad_account_notes_update ON public.ad_account_notes
  FOR UPDATE TO authenticated
  USING (
    deleted_at IS NULL
    AND agency_id IN (SELECT public.user_agency_ids())
  )
  WITH CHECK (agency_id IN (SELECT public.user_agency_ids()));

DROP POLICY IF EXISTS ad_account_notes_no_api ON public.ad_account_notes;
CREATE POLICY ad_account_notes_no_api ON public.ad_account_notes
  AS RESTRICTIVE
  FOR ALL TO authenticated
  USING (NOT public.is_api_token())
  WITH CHECK (NOT public.is_api_token());

REVOKE ALL ON TABLE public.ad_account_notes FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.ad_account_notes TO authenticated;
GRANT ALL ON TABLE public.ad_account_notes TO service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ad_account_notes;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
