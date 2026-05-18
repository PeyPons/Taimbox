-- Corrige CTAs de descarga del post plantilla cuando el cuerpo está en bloques granulares
-- (migración de descomposición 20260507120000 apuntaba a /planificador-recursos o /reportes-rentabilidad).
-- Idempotente: solo afecta bloques cta cuyo texto es descarga de plantilla.

UPDATE public.blog_posts
SET
  blocks_es = (
    SELECT COALESCE(
      jsonb_agg(
        CASE
          WHEN elem->>'type' = 'cta'
            AND elem->>'text' ILIKE '%descargar plantilla%'
          THEN jsonb_set(
            elem,
            '{href}',
            to_jsonb('/recursos/plantilla-planificacion-recursos-taimbox.xlsx'::text)
          )
          ELSE elem
        END
        ORDER BY ord
      ),
      '[]'::jsonb
    )
    FROM jsonb_array_elements(blocks_es) WITH ORDINALITY AS t(elem, ord)
  ),
  blocks_en = (
    SELECT COALESCE(
      jsonb_agg(
        CASE
          WHEN elem->>'type' = 'cta'
            AND (
              elem->>'text' ILIKE '%download%template%'
              OR elem->>'text' ILIKE '%template download%'
            )
          THEN jsonb_set(
            elem,
            '{href}',
            to_jsonb('/recursos/plantilla-planificacion-recursos-taimbox.xlsx'::text)
          )
          ELSE elem
        END
        ORDER BY ord
      ),
      '[]'::jsonb
    )
    FROM jsonb_array_elements(blocks_en) WITH ORDINALITY AS t(elem, ord)
  )
WHERE slug = 'plantilla-planificacion-recursos-agencia'
  AND jsonb_array_length(blocks_es) > 1;
