-- Portal de agentes de revisión (Ollama): tablas, RLS, Storage, Realtime, plantillas sistema

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_review_role_for_user(p_agency_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  IF auth.uid() IS NULL OR p_agency_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT e.role INTO v_role
  FROM public.employees e
  WHERE e.user_id = auth.uid()
    AND e.agency_id = p_agency_id
    AND e.is_active = true
  ORDER BY e.created_at DESC NULLS LAST
  LIMIT 1;

  RETURN v_role;
END;
$$;

COMMENT ON FUNCTION public.get_review_role_for_user(uuid) IS
  'Rol del empleado activo en la agencia (para filtrar review_skills por visibility_roles).';

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE public.review_profiles (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  display_name text,
  role_key text,
  notify_email text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (user_id, agency_id)
);

CREATE INDEX idx_review_profiles_agency ON public.review_profiles (agency_id);

CREATE TABLE public.review_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid REFERENCES public.agencies(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  skill_type text NOT NULL CHECK (skill_type IN ('document', 'url', 'mixed')),
  system_prompt text NOT NULL DEFAULT '',
  review_checklist jsonb NOT NULL DEFAULT '[]'::jsonb,
  output_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  visibility_roles text[] NOT NULL DEFAULT '{}'::text[],
  allowed_input_types text[] NOT NULL DEFAULT ARRAY['pdf','docx','txt','md','url']::text[],
  is_system_template boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  version integer NOT NULL DEFAULT 1,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT review_skills_agency_slug_unique UNIQUE (agency_id, slug)
);

CREATE INDEX idx_review_skills_agency ON public.review_skills (agency_id) WHERE NOT is_archived;
CREATE INDEX idx_review_skills_system ON public.review_skills (is_system_template) WHERE is_system_template;

CREATE TABLE public.review_skill_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id uuid NOT NULL REFERENCES public.review_skills(id) ON DELETE CASCADE,
  version integer NOT NULL,
  snapshot jsonb NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (skill_id, version)
);

CREATE TABLE public.review_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.review_skills(id) ON DELETE RESTRICT,
  skill_version integer NOT NULL DEFAULT 1,
  requested_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued', 'preprocessing', 'chunking', 'mapping', 'reducing',
    'completed', 'failed', 'cancelled'
  )),
  progress_pct integer NOT NULL DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
  progress_message text,
  error_message text,
  input_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  result_markdown text,
  result_json jsonb,
  ollama_model text NOT NULL DEFAULT 'gemma4:latest',
  notify_on_complete boolean NOT NULL DEFAULT true,
  email_sent_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_review_jobs_agency_status ON public.review_jobs (agency_id, status);
CREATE INDEX idx_review_jobs_requested_created ON public.review_jobs (requested_by, created_at DESC);

CREATE TABLE public.review_job_inputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.review_jobs(id) ON DELETE CASCADE,
  input_type text NOT NULL CHECK (input_type IN ('file', 'url', 'paste')),
  storage_path text,
  source_url text,
  original_filename text,
  extracted_text_path text,
  char_count integer,
  token_estimate integer,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_review_job_inputs_job ON public.review_job_inputs (job_id);

CREATE TABLE public.review_job_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.review_jobs(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  chunk_text_path text,
  partial_result_json jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (job_id, chunk_index)
);

CREATE INDEX idx_review_job_chunks_job ON public.review_job_chunks (job_id);

CREATE TABLE public.review_job_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.review_jobs(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  message text NOT NULL DEFAULT '',
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_review_job_events_job_created ON public.review_job_events (job_id, created_at);

CREATE OR REPLACE FUNCTION public.review_skill_visible_to_user(p_skill_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s public.review_skills%ROWTYPE;
  v_role text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  SELECT * INTO s FROM public.review_skills WHERE id = p_skill_id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF s.agency_id IS NULL AND s.is_system_template THEN
    IF NOT EXISTS (SELECT 1 FROM public.user_agencies ua WHERE ua.user_id = auth.uid()) THEN
      RETURN false;
    END IF;
    v_role := (
      SELECT e.role FROM public.employees e
      INNER JOIN public.user_agencies ua ON ua.agency_id = e.agency_id AND ua.user_id = auth.uid()
      WHERE e.user_id = auth.uid() AND e.is_active = true
      ORDER BY ua.is_primary DESC NULLS LAST
      LIMIT 1
    );
  ELSIF s.agency_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_agencies ua
      WHERE ua.user_id = auth.uid() AND ua.agency_id = s.agency_id
    ) THEN
      RETURN false;
    END IF;
    v_role := public.get_review_role_for_user(s.agency_id);
  ELSE
    RETURN false;
  END IF;

  IF s.visibility_roles IS NULL OR cardinality(s.visibility_roles) = 0 THEN
    RETURN true;
  END IF;

  IF v_role IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM unnest(s.visibility_roles) AS r(role_name)
    WHERE lower(btrim(role_name)) = lower(btrim(v_role))
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.review_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_skill_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_job_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_job_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_job_events ENABLE ROW LEVEL SECURITY;

-- review_profiles
CREATE POLICY review_profiles_select ON public.review_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY review_profiles_insert ON public.review_profiles
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND agency_id IN (SELECT public.user_agency_ids())
  );

CREATE POLICY review_profiles_update ON public.review_profiles
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- review_skills
CREATE POLICY review_skills_select ON public.review_skills
  FOR SELECT USING (
    (agency_id IS NULL AND is_system_template)
    OR (
      agency_id IN (SELECT public.user_agency_ids())
      AND public.review_skill_visible_to_user(id)
    )
  );

CREATE POLICY review_skills_insert ON public.review_skills
  FOR INSERT WITH CHECK (
    agency_id IN (SELECT public.user_agency_ids())
    AND NOT is_system_template
  );

CREATE POLICY review_skills_update ON public.review_skills
  FOR UPDATE USING (
    agency_id IN (SELECT public.user_agency_ids())
    AND NOT is_system_template
    AND created_by = auth.uid()
  )
  WITH CHECK (agency_id IN (SELECT public.user_agency_ids()) AND NOT is_system_template);

CREATE POLICY review_skills_delete ON public.review_skills
  FOR DELETE USING (
    agency_id IN (SELECT public.user_agency_ids())
    AND NOT is_system_template
    AND created_by = auth.uid()
  );

-- review_skill_versions
CREATE POLICY review_skill_versions_select ON public.review_skill_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.review_skills s
      WHERE s.id = skill_id
        AND (
          (s.agency_id IS NULL AND s.is_system_template)
          OR (s.agency_id IN (SELECT public.user_agency_ids()) AND public.review_skill_visible_to_user(s.id))
        )
    )
  );

CREATE POLICY review_skill_versions_insert ON public.review_skill_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.review_skills s
      WHERE s.id = skill_id
        AND s.agency_id IN (SELECT public.user_agency_ids())
        AND NOT s.is_system_template
    )
  );

-- review_jobs
CREATE POLICY review_jobs_select ON public.review_jobs
  FOR SELECT USING (
    agency_id IN (SELECT public.user_agency_ids())
    AND (
      requested_by = auth.uid()
      OR (
        pg_catalog.to_regprocedure('public.is_agency_admin(uuid,uuid)') IS NOT NULL
        AND public.is_agency_admin(auth.uid(), agency_id)
      )
    )
  );

CREATE POLICY review_jobs_insert ON public.review_jobs
  FOR INSERT WITH CHECK (
    agency_id IN (SELECT public.user_agency_ids())
    AND requested_by = auth.uid()
  );

CREATE POLICY review_jobs_update ON public.review_jobs
  FOR UPDATE USING (
    agency_id IN (SELECT public.user_agency_ids())
    AND requested_by = auth.uid()
    AND status IN ('queued', 'preprocessing', 'chunking', 'mapping', 'reducing')
  )
  WITH CHECK (requested_by = auth.uid());

-- review_job_inputs / chunks / events (via job ownership)
CREATE POLICY review_job_inputs_select ON public.review_job_inputs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.review_jobs j
      WHERE j.id = job_id
        AND j.agency_id IN (SELECT public.user_agency_ids())
        AND (j.requested_by = auth.uid() OR (
          pg_catalog.to_regprocedure('public.is_agency_admin(uuid,uuid)') IS NOT NULL
          AND public.is_agency_admin(auth.uid(), j.agency_id)
        ))
    )
  );

CREATE POLICY review_job_inputs_insert ON public.review_job_inputs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.review_jobs j
      WHERE j.id = job_id AND j.requested_by = auth.uid()
    )
  );

CREATE POLICY review_job_chunks_select ON public.review_job_chunks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.review_jobs j
      WHERE j.id = job_id
        AND j.agency_id IN (SELECT public.user_agency_ids())
        AND (j.requested_by = auth.uid() OR (
          pg_catalog.to_regprocedure('public.is_agency_admin(uuid,uuid)') IS NOT NULL
          AND public.is_agency_admin(auth.uid(), j.agency_id)
        ))
    )
  );

CREATE POLICY review_job_events_select ON public.review_job_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.review_jobs j
      WHERE j.id = job_id
        AND j.agency_id IN (SELECT public.user_agency_ids())
        AND (j.requested_by = auth.uid() OR (
          pg_catalog.to_regprocedure('public.is_agency_admin(uuid,uuid)') IS NOT NULL
          AND public.is_agency_admin(auth.uid(), j.agency_id)
        ))
    )
  );

-- ---------------------------------------------------------------------------
-- Storage bucket review-documents (private)
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'review-documents',
  'review-documents',
  false,
  52428800,
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'text/html'
  ]::text[]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY review_documents_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'review-documents'
    AND (storage.foldername(name))[1]::uuid IN (SELECT public.user_agency_ids())
  );

CREATE POLICY review_documents_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'review-documents'
    AND (storage.foldername(name))[1]::uuid IN (SELECT public.user_agency_ids())
  );

CREATE POLICY review_documents_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'review-documents'
    AND (storage.foldername(name))[1]::uuid IN (SELECT public.user_agency_ids())
  );

CREATE POLICY review_documents_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'review-documents'
    AND (storage.foldername(name))[1]::uuid IN (SELECT public.user_agency_ids())
  );

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.review_jobs;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.review_job_events;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- System skill templates (global, agency_id NULL)
-- ---------------------------------------------------------------------------

INSERT INTO public.review_skills (
  agency_id, slug, name, description, skill_type, system_prompt,
  review_checklist, output_schema, visibility_roles, is_system_template
) VALUES
(
  NULL, 'propuesta-comercial', 'Revisión propuesta comercial', 'Revisa propuestas comerciales y ofertas.',
  'document',
  'Eres un revisor senior de propuestas comerciales. Evalúa claridad de valor, pricing, alcance, riesgos y tono profesional.',
  '[{"id":"valor","label":"Propuesta de valor clara","severity":"high"},{"id":"alcance","label":"Alcance delimitado","severity":"high"},{"id":"pricing","label":"Pricing coherente","severity":"medium"}]'::jsonb,
  '{"summary":"","score":0,"findings":[],"recommendations":[]}'::jsonb,
  ARRAY['comercial','Administrador']::text[], true
),
(
  NULL, 'contrato-clausulas', 'Revisión contrato / cláusulas', 'Revisa contratos y cláusulas sensibles.',
  'document',
  'Eres un revisor legal orientado a negocio (no sustituyes abogado). Señala cláusulas ambiguas, plazos, responsabilidad, IP y salida.',
  '[{"id":"ambiguity","label":"Ambigüedad","severity":"high"},{"id":"ip","label":"Propiedad intelectual","severity":"high"}]'::jsonb,
  '{"summary":"","score":0,"findings":[],"recommendations":[]}'::jsonb,
  ARRAY['legal','Administrador']::text[], true
),
(
  NULL, 'landing-copy-cta', 'Revisión landing (copy + CTA)', 'Analiza landings: mensaje, CTA y coherencia.',
  'url',
  'Revisa la landing como experto en conversión: propuesta de valor, jerarquía, CTA, objeciones y tono.',
  '[{"id":"cta","label":"CTA visible","severity":"high"},{"id":"mensaje","label":"Mensaje en 5 segundos","severity":"high"}]'::jsonb,
  '{"summary":"","score":0,"findings":[],"recommendations":[]}'::jsonb,
  ARRAY['marketing','seo','Administrador']::text[], true
),
(
  NULL, 'seo-on-page', 'Revisión SEO on-page', 'SEO técnico básico de la página.',
  'url',
  'Revisa title, meta description, H1-H3, intención de búsqueda y señales on-page.',
  '[{"id":"title","label":"Title optimizado","severity":"medium"}]'::jsonb,
  '{"summary":"","score":0,"findings":[],"recommendations":[]}'::jsonb,
  ARRAY['seo','marketing','Administrador']::text[], true
),
(
  NULL, 'coherencia-operativa', 'Revisión coherencia operativa', 'Coherencia de entregables e informes.',
  'document',
  'Revisa coherencia operativa: plazos, dependencias, riesgos de ejecución y claridad para el equipo.',
  '[]'::jsonb,
  '{"summary":"","score":0,"findings":[],"recommendations":[]}'::jsonb,
  ARRAY['ops','Administrador']::text[], true
),
(
  NULL, 'informe-entregable', 'Revisión informe / entregable', 'Calidad de informes y entregables.',
  'document',
  'Revisa estructura, conclusiones accionables, datos citados y calidad redaccional del entregable.',
  '[]'::jsonb,
  '{"summary":"","score":0,"findings":[],"recommendations":[]}'::jsonb,
  ARRAY['ops','Administrador']::text[], true
),
(
  NULL, 'comparativa-multi-doc', 'Comparativa multi-documento', 'Compara varios documentos.',
  'mixed',
  'Compara documentos: contradicciones, huecos, versiones y recomendaciones unificadas.',
  '[]'::jsonb,
  '{"summary":"","score":0,"findings":[],"recommendations":[]}'::jsonb,
  ARRAY['ops','legal','comercial','Administrador']::text[], true
),
(
  NULL, 'accesibilidad-basica', 'Checklist accesibilidad básica', 'Accesibilidad básica de la página.',
  'url',
  'Revisa headings, contraste mencionado en copy, textos alternativos referenciados y navegación por teclado inferida del HTML.',
  '[]'::jsonb,
  '{"summary":"","score":0,"findings":[],"recommendations":[]}'::jsonb,
  ARRAY['producto','marketing','Administrador']::text[], true
);

COMMENT ON TABLE public.review_jobs IS 'Trabajos de revisión IA (procesados por review-worker en ia-srv).';
