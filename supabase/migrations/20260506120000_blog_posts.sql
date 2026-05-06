-- CMS de blog: tabla blog_posts con bloques JSONB versionados, rutas bilingues y RLS.
-- Lectura publica solo de posts publicados. Escritura restringida a platform_admins.
-- El seed inicial migra los 8 posts existentes como un unico bloque visualRef que
-- monta el componente *Article.tsx ya presente en el bundle, preservando 100% del visual.

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identidad estable. NO es la URL: solo identificador interno usado por related_slug.
  slug text NOT NULL UNIQUE,

  -- Estado de publicacion.
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published')),

  -- Rutas publicas configurables (la URL real de la pagina).
  -- Deben empezar por "/blog/" en ES y "/en/blog/" en EN.
  path_es text NOT NULL UNIQUE
    CHECK (path_es ~ '^/blog/[a-z0-9-]+$'),
  path_en text NOT NULL UNIQUE
    CHECK (path_en ~ '^/en/blog/[a-z0-9-]+$'),

  -- Metadatos editoriales bilingues.
  title_es text NOT NULL,
  title_en text NOT NULL,
  description_es text NOT NULL,
  description_en text NOT NULL,
  meta_title_es text,
  meta_title_en text,
  meta_description_es text,
  meta_description_en text,

  -- Editorial.
  date date NOT NULL DEFAULT CURRENT_DATE,
  reading_minutes int NOT NULL DEFAULT 5
    CHECK (reading_minutes > 0 AND reading_minutes < 240),
  related_slug text,

  -- Cuerpo: array de bloques JSONB versionado.
  schema_version int NOT NULL DEFAULT 1,
  blocks_es jsonb NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(blocks_es) = 'array'),
  blocks_en jsonb NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(blocks_en) = 'array'),

  -- JSON-LD opcional por locale (override del autogenerado).
  json_ld_es jsonb,
  json_ld_en jsonb,

  -- Auditoria.
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Lookup rapido por estado/fecha para listados publicos y admin.
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_date
  ON public.blog_posts (status, date DESC);

CREATE INDEX IF NOT EXISTS idx_blog_posts_related_slug
  ON public.blog_posts (related_slug)
  WHERE related_slug IS NOT NULL;

-- Trigger para mantener updated_at sincronizado.
CREATE OR REPLACE FUNCTION public.blog_posts_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  -- Set published_at automaticamente la primera vez que se publica.
  IF NEW.status = 'published'
     AND (OLD.status IS DISTINCT FROM 'published')
     AND NEW.published_at IS NULL THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_blog_posts_set_updated_at ON public.blog_posts;
CREATE TRIGGER trg_blog_posts_set_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.blog_posts_set_updated_at();

-- RLS.
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Lectura publica de posts publicados; admins ven todo.
DROP POLICY IF EXISTS blog_posts_select ON public.blog_posts;
CREATE POLICY blog_posts_select ON public.blog_posts
  FOR SELECT USING (
    status = 'published'
    OR EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid())
  );

-- Mutaciones: solo platform_admins.
DROP POLICY IF EXISTS blog_posts_insert ON public.blog_posts;
CREATE POLICY blog_posts_insert ON public.blog_posts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid())
  );

DROP POLICY IF EXISTS blog_posts_update ON public.blog_posts;
CREATE POLICY blog_posts_update ON public.blog_posts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid())
  );

DROP POLICY IF EXISTS blog_posts_delete ON public.blog_posts;
CREATE POLICY blog_posts_delete ON public.blog_posts
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid())
  );

GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;

COMMENT ON TABLE public.blog_posts IS
  'Posts del blog gestionados desde /admin/blog. Bloques JSONB versionados; lectura publica solo de status=published.';
COMMENT ON COLUMN public.blog_posts.slug IS
  'Identificador estable del post (no es la URL). related_slug apunta a este campo.';
COMMENT ON COLUMN public.blog_posts.blocks_es IS
  'Array de bloques tipados validados en cliente con Zod. Ver src/lib/blog/blockSchema.ts.';
COMMENT ON COLUMN public.blog_posts.json_ld_es IS
  'Override del JSON-LD del articulo. Si NULL, el frontend genera Article basico desde campos.';

-- ============================================================================
-- Seed: 8 posts existentes migrados como un unico bloque visualRef cada uno.
-- visualId apunta al componente *Article.tsx ya presente en el bundle.
-- El wrapper en blogVisualRegistry.ts mantiene TOC, JSON-LD y relatedPost igual que antes.
-- ============================================================================

INSERT INTO public.blog_posts (
  slug, status, path_es, path_en,
  title_es, title_en,
  description_es, description_en,
  date, reading_minutes, related_slug,
  blocks_es, blocks_en,
  published_at
) VALUES
  (
    'que-es-timeboxing', 'published',
    '/blog/que-es-timeboxing', '/en/blog/what-is-timeboxing',
    'Qué es el timeboxing: guía definitiva de productividad',
    'What is timeboxing: the definitive productivity guide',
    'Descubre la técnica de gestión del tiempo por cajas: qué es, cómo implementarla y cómo llevarla a todo el equipo para aumentar la rentabilidad.',
    'Timeboxing explained: what it is, how to implement it, and how to roll it out across the team to improve profitability.',
    '2026-03-10', 12, 'planificacion-proyectos-cronograma-recursos',
    jsonb_build_array(jsonb_build_object('id', gen_random_uuid()::text, 'type', 'visualRef', 'visualId', 'WhatIsTimeboxingArticle')),
    jsonb_build_array(jsonb_build_object('id', gen_random_uuid()::text, 'type', 'visualRef', 'visualId', 'WhatIsTimeboxingArticle')),
    '2026-03-10 00:00:00+00'
  ),
  (
    'ley-parkinson', 'published',
    '/blog/ley-parkinson', '/en/blog/parkinsons-law',
    'Ley de Parkinson: qué es, ejemplos y cómo combatirla',
    'Parkinson''s law: what it is, examples, and how to fight it',
    'Ley del tiempo, origen burocrático (Marina británica), segunda ley de gastos e ingresos, ley de la trivialidad en reuniones, evidencia y antídotos (timeboxing, plazos).',
    'Work expands to fill the time available, bureaucratic origin, expenses vs revenue, triviality in meetings, evidence, and antidotes (timeboxing, deadlines).',
    '2026-03-14', 24, 'que-es-timeboxing',
    jsonb_build_array(jsonb_build_object('id', gen_random_uuid()::text, 'type', 'visualRef', 'visualId', 'LeyParkinsonArticle')),
    jsonb_build_array(jsonb_build_object('id', gen_random_uuid()::text, 'type', 'visualRef', 'visualId', 'LeyParkinsonArticle')),
    '2026-03-14 00:00:00+00'
  ),
  (
    'planificacion-proyectos-cronograma-recursos', 'published',
    '/blog/planificacion-proyectos-cronograma-recursos', '/en/blog/project-planning-schedule-resources',
    'Planificación de proyectos: cronograma, presupuesto y recursos',
    'Project planning: schedule, budget, and resources',
    'Guía práctica para unir cronograma, presupuesto y capacidad del equipo. Incluye diagrama de Gantt, fases del proyecto, KPIs y herramientas.',
    'Practical guide to align schedule, budget, and team capacity. Gantt diagram, project phases, KPIs, and tools.',
    '2026-03-18', 10, 'que-es-timeboxing',
    jsonb_build_array(jsonb_build_object('id', gen_random_uuid()::text, 'type', 'visualRef', 'visualId', 'PlanificacionProyectosArticle')),
    jsonb_build_array(jsonb_build_object('id', gen_random_uuid()::text, 'type', 'visualRef', 'visualId', 'PlanificacionProyectosArticle')),
    '2026-03-18 00:00:00+00'
  ),
  (
    'kpis-agencias-marketing-2026', 'published',
    '/blog/kpis-agencias-marketing-2026', '/en/blog/marketing-agency-kpis-2026',
    'KPIs para agencias de marketing: 5 métricas que sí importan en 2026',
    'Marketing agency KPIs: 5 metrics that matter in 2026',
    'Utilización, rentabilidad y pacing, estimación vs real, capacidad por departamento y OKRs: métricas accionables, qué hacer si el número falla y por qué medir bien no debería ser arqueología en Excel.',
    'Utilization, profitability and pacing, estimate vs actual, capacity by department, and OKRs: actionable metrics, what to do when a number fails, and why measuring well should not be Excel archaeology.',
    '2026-03-23', 16, 'planificacion-proyectos-cronograma-recursos',
    jsonb_build_array(jsonb_build_object('id', gen_random_uuid()::text, 'type', 'visualRef', 'visualId', 'KpisAgenciasMarketingArticle')),
    jsonb_build_array(jsonb_build_object('id', gen_random_uuid()::text, 'type', 'visualRef', 'visualId', 'KpisAgenciasMarketingArticle')),
    '2026-03-23 00:00:00+00'
  ),
  (
    'plantilla-planificacion-recursos-agencia', 'published',
    '/blog/plantilla-planificacion-recursos-agencia', '/en/blog/agency-resource-planning-template',
    'Plantilla gratuita de planificación de recursos para agencias',
    'Free agency resource planning template',
    'Descarga gratis una plantilla de planificación de recursos para agencias en Excel o Google Sheets: 5 hojas con fórmulas, formato condicional, desplegables y protección de celdas. Calcula capacidad neta, utilización y margen.',
    'Download a free agency resource planning template for Excel or Google Sheets: 5 sheets with formulas, conditional formatting, dropdowns, and protected cells. Net capacity, utilization, and margin.',
    '2026-03-24', 22, 'planificacion-proyectos-cronograma-recursos',
    jsonb_build_array(jsonb_build_object('id', gen_random_uuid()::text, 'type', 'visualRef', 'visualId', 'PlantillaPlanificacionRecursosArticle')),
    jsonb_build_array(jsonb_build_object('id', gen_random_uuid()::text, 'type', 'visualRef', 'visualId', 'PlantillaPlanificacionRecursosArticle')),
    '2026-03-24 00:00:00+00'
  ),
  (
    'gestion-carga-trabajo-equipo-sin-burnout', 'published',
    '/blog/gestion-carga-trabajo-equipo-sin-burnout', '/en/blog/workload-management-without-burnout',
    'Cómo gestionar la carga de trabajo de tu equipo sin burnout',
    'How to manage team workload without burnout',
    'Guía 2026: workload management, señales de sobrecarga, framework en 6 pasos, métricas (utilización, plazos, criticidad) y herramientas por categorías. Cultura, límites y visibilidad para equipos y agencias.',
    '2026 guide: workload management, overload signals, a 6-step framework, metrics (utilization, deadlines, criticality), and tools by category. Culture, boundaries, and visibility for teams and agencies.',
    '2026-03-26', 24, 'kpis-agencias-marketing-2026',
    jsonb_build_array(jsonb_build_object('id', gen_random_uuid()::text, 'type', 'visualRef', 'visualId', 'GestionCargaTrabajoEquipoArticle')),
    jsonb_build_array(jsonb_build_object('id', gen_random_uuid()::text, 'type', 'visualRef', 'visualId', 'GestionCargaTrabajoEquipoArticle')),
    '2026-03-26 00:00:00+00'
  ),
  (
    'como-medir-rentabilidad-proyecto-agencia-dejar-vender-horas', 'published',
    '/blog/como-medir-rentabilidad-proyecto-agencia-dejar-vender-horas', '/en/blog/measure-project-profitability-stop-selling-hours',
    'Cómo medir la rentabilidad real por proyecto en tu agencia (y dejar de vender horas)',
    'How to measure real per-project profitability (and stop selling hours)',
    'Modelos de pricing (horas, retainer, valor, híbrido), margen bruto por proyecto, protocolo de alcance en tres pasos y sprints para proteger márgenes. Enlace natural con planificación y timeboxing.',
    'Pricing models (hourly, retainer, value, hybrid), gross margin per project, a three-step scope protocol, and sprints to protect margins. Ties naturally to planning and timeboxing.',
    '2026-03-26', 12, 'planificacion-proyectos-cronograma-recursos',
    jsonb_build_array(jsonb_build_object('id', gen_random_uuid()::text, 'type', 'visualRef', 'visualId', 'ComoMedirRentabilidadProyectoArticle')),
    jsonb_build_array(jsonb_build_object('id', gen_random_uuid()::text, 'type', 'visualRef', 'visualId', 'ComoMedirRentabilidadProyectoArticle')),
    '2026-03-26 00:00:00+00'
  ),
  (
    'por-que-tu-agencia-pierde-rentabilidad-equipo-ocupado', 'published',
    '/blog/por-que-tu-agencia-pierde-rentabilidad-equipo-ocupado', '/en/blog/why-agency-loses-profitability-busy-team',
    'Por qué tu agencia pierde rentabilidad aunque el equipo esté siempre ocupado',
    'Why your agency loses profitability even when the team is always busy',
    'Ocupación alta vs margen real: utilización, context switching, presencialismo digital, horas no facturables, scope creep y métricas que sí predicen rentabilidad. Sin venderte herramientas: datos, tablas y qué hacer esta semana.',
    'High utilization vs real margin: utilization, context switching, digital presenteeism, non-billable hours, scope creep, and metrics that actually predict profitability. Data, tables, and what to do this week.',
    '2026-03-26', 14, 'kpis-agencias-marketing-2026',
    jsonb_build_array(jsonb_build_object('id', gen_random_uuid()::text, 'type', 'visualRef', 'visualId', 'PorQueAgenciaPierdeRentabilidadArticle')),
    jsonb_build_array(jsonb_build_object('id', gen_random_uuid()::text, 'type', 'visualRef', 'visualId', 'PorQueAgenciaPierdeRentabilidadArticle')),
    '2026-03-26 00:00:00+00'
  ),
  (
    'capacidad-calendario-vs-capacidad-productiva-equipo', 'published',
    '/blog/capacidad-calendario-vs-capacidad-productiva-equipo', '/en/blog/calendar-capacity-vs-shippable-team-capacity',
    'Capacidad calendario vs capacidad productiva: por qué un equipo ocupado no siempre entrega',
    'Calendar capacity vs productive capacity: why a busy team still misses deliverables',
    'Cómo distinguir horas visibles de capacidad útil en agencias: señales observables, checklist semanal, anti-patrones y reglas para evitar prometer fechas con un calendario engañoso.',
    'How to separate visible hours from productive capacity in agency teams: observable signals, a weekly checklist, anti-patterns, and planning rules that avoid false delivery promises.',
    '2026-05-06', 11, 'planificacion-proyectos-cronograma-recursos',
    jsonb_build_array(jsonb_build_object('id', gen_random_uuid()::text, 'type', 'visualRef', 'visualId', 'CapacidadCalendarioVsProductivaArticle')),
    jsonb_build_array(jsonb_build_object('id', gen_random_uuid()::text, 'type', 'visualRef', 'visualId', 'CapacidadCalendarioVsProductivaArticle')),
    '2026-05-06 00:00:00+00'
  )
ON CONFLICT (slug) DO NOTHING;
