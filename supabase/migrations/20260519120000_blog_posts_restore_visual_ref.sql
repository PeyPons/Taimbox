-- Restaura los posts del blog al formato seed original: un unico bloque visualRef
-- por locale que monta el Page.tsx completo (TOC, mockups, JSON-LD, relatedPost).
-- Revierte la descomposicion granular (20260507120000) que dejaba articulos incompletos.
-- Idempotente: re-ejecutar es seguro.

UPDATE public.blog_posts SET
  schema_version = 1,
  blocks_es = jsonb_build_array(jsonb_build_object(
    'id', gen_random_uuid()::text,
    'type', 'visualRef',
    'visualId', 'WhatIsTimeboxingArticle'
  )),
  blocks_en = jsonb_build_array(jsonb_build_object(
    'id', gen_random_uuid()::text,
    'type', 'visualRef',
    'visualId', 'WhatIsTimeboxingArticle'
  )),
  json_ld_es = NULL,
  json_ld_en = NULL
WHERE slug = 'que-es-timeboxing';

UPDATE public.blog_posts SET
  schema_version = 1,
  blocks_es = jsonb_build_array(jsonb_build_object(
    'id', gen_random_uuid()::text,
    'type', 'visualRef',
    'visualId', 'LeyParkinsonArticle'
  )),
  blocks_en = jsonb_build_array(jsonb_build_object(
    'id', gen_random_uuid()::text,
    'type', 'visualRef',
    'visualId', 'LeyParkinsonArticle'
  )),
  json_ld_es = NULL,
  json_ld_en = NULL
WHERE slug = 'ley-parkinson';

UPDATE public.blog_posts SET
  schema_version = 1,
  blocks_es = jsonb_build_array(jsonb_build_object(
    'id', gen_random_uuid()::text,
    'type', 'visualRef',
    'visualId', 'PlanificacionProyectosArticle'
  )),
  blocks_en = jsonb_build_array(jsonb_build_object(
    'id', gen_random_uuid()::text,
    'type', 'visualRef',
    'visualId', 'PlanificacionProyectosArticle'
  )),
  json_ld_es = NULL,
  json_ld_en = NULL
WHERE slug = 'planificacion-proyectos-cronograma-recursos';

UPDATE public.blog_posts SET
  schema_version = 1,
  blocks_es = jsonb_build_array(jsonb_build_object(
    'id', gen_random_uuid()::text,
    'type', 'visualRef',
    'visualId', 'KpisAgenciasMarketingArticle'
  )),
  blocks_en = jsonb_build_array(jsonb_build_object(
    'id', gen_random_uuid()::text,
    'type', 'visualRef',
    'visualId', 'KpisAgenciasMarketingArticle'
  )),
  json_ld_es = NULL,
  json_ld_en = NULL
WHERE slug = 'kpis-agencias-marketing-2026';

UPDATE public.blog_posts SET
  schema_version = 1,
  blocks_es = jsonb_build_array(jsonb_build_object(
    'id', gen_random_uuid()::text,
    'type', 'visualRef',
    'visualId', 'PlantillaPlanificacionRecursosArticle'
  )),
  blocks_en = jsonb_build_array(jsonb_build_object(
    'id', gen_random_uuid()::text,
    'type', 'visualRef',
    'visualId', 'PlantillaPlanificacionRecursosArticle'
  )),
  json_ld_es = NULL,
  json_ld_en = NULL
WHERE slug = 'plantilla-planificacion-recursos-agencia';

UPDATE public.blog_posts SET
  schema_version = 1,
  blocks_es = jsonb_build_array(jsonb_build_object(
    'id', gen_random_uuid()::text,
    'type', 'visualRef',
    'visualId', 'GestionCargaTrabajoEquipoArticle'
  )),
  blocks_en = jsonb_build_array(jsonb_build_object(
    'id', gen_random_uuid()::text,
    'type', 'visualRef',
    'visualId', 'GestionCargaTrabajoEquipoArticle'
  )),
  json_ld_es = NULL,
  json_ld_en = NULL
WHERE slug = 'gestion-carga-trabajo-equipo-sin-burnout';

UPDATE public.blog_posts SET
  schema_version = 1,
  blocks_es = jsonb_build_array(jsonb_build_object(
    'id', gen_random_uuid()::text,
    'type', 'visualRef',
    'visualId', 'ComoMedirRentabilidadProyectoArticle'
  )),
  blocks_en = jsonb_build_array(jsonb_build_object(
    'id', gen_random_uuid()::text,
    'type', 'visualRef',
    'visualId', 'ComoMedirRentabilidadProyectoArticle'
  )),
  json_ld_es = NULL,
  json_ld_en = NULL
WHERE slug = 'como-medir-rentabilidad-proyecto-agencia-dejar-vender-horas';

UPDATE public.blog_posts SET
  schema_version = 1,
  blocks_es = jsonb_build_array(jsonb_build_object(
    'id', gen_random_uuid()::text,
    'type', 'visualRef',
    'visualId', 'PorQueAgenciaPierdeRentabilidadArticle'
  )),
  blocks_en = jsonb_build_array(jsonb_build_object(
    'id', gen_random_uuid()::text,
    'type', 'visualRef',
    'visualId', 'PorQueAgenciaPierdeRentabilidadArticle'
  )),
  json_ld_es = NULL,
  json_ld_en = NULL
WHERE slug = 'por-que-tu-agencia-pierde-rentabilidad-equipo-ocupado';

UPDATE public.blog_posts SET
  schema_version = 1,
  blocks_es = jsonb_build_array(jsonb_build_object(
    'id', gen_random_uuid()::text,
    'type', 'visualRef',
    'visualId', 'CapacidadCalendarioVsProductivaArticle'
  )),
  blocks_en = jsonb_build_array(jsonb_build_object(
    'id', gen_random_uuid()::text,
    'type', 'visualRef',
    'visualId', 'CapacidadCalendarioVsProductivaArticle'
  )),
  json_ld_es = NULL,
  json_ld_en = NULL
WHERE slug = 'capacidad-calendario-vs-capacidad-productiva-equipo';
