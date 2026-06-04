-- Part 2: plantilla + fragmentos ley/timeboxing

-- plantilla-planificacion-recursos-agencia
UPDATE public.blog_posts SET blocks_es = (
  SELECT COALESCE(jsonb_agg(CASE
      WHEN elem->>'id' = '3745f219-1576-4595-9b35-d166e3a33d7c' THEN jsonb_set(elem, '{html}', to_jsonb('La plantilla funciona en Excel y en Google Sheets; las fórmulas son compatibles. La diferencia relevante es operativa: en Sheets el archivo vive en la nube y varios pueden editar a la vez — con el riesgo de romper una celda desprotegida si alguien no sigue el protocolo.'::text))
      WHEN elem->>'id' = '9185705a-c44b-46b5-aa43-8d08b7df3827' THEN jsonb_set(elem, '{html}', to_jsonb('La plantilla viene con dos semanas de ejemplo (S12 y S13). Para añadir una nueva semana, duplica la columna de la semana anterior, actualiza la etiqueta en la fila de cabecera y comprueba que los SUMIF siguen apuntando al rango correcto antes de rellenar horas reales.'::text))
      WHEN elem->>'id' = '6f902704-1141-47b9-ae1a-79dbcd9d2edf' THEN jsonb_set(elem, '{html}', to_jsonb('Capacidad, asignación, pacing y utilización sin mantener la hoja a mano cada lunes: cuando el modelo manual ya no escala, la misma lógica puede vivir en un planificador que actualice números al registrar horas. Taimbox se puede explorar sin compromiso.'::text))
      WHEN elem->>'id' = 'c55f3e84-e472-48e3-bdcb-cade3d49651e' THEN jsonb_set(elem, '{html}', to_jsonb('La plantilla aplica formato condicional nativo en la columna de utilización. Excel y Google Sheets lo interpretan directamente al importar el .xlsx — no hace falta reconfigurar reglas salvo que cambies los umbrales acordados con dirección.'::text))
      ELSE elem
    END ORDER BY ord), '[]'::jsonb)
  FROM jsonb_array_elements(blocks_es) WITH ORDINALITY AS t(elem, ord)
) WHERE slug = 'plantilla-planificacion-recursos-agencia';

UPDATE public.blog_posts SET blocks_en = (
  SELECT COALESCE(jsonb_agg(CASE
      WHEN elem->>'id' = '3745f219-1576-4595-9b35-d166e3a33d7c' THEN jsonb_set(elem, '{html}', to_jsonb('The template works in Excel and Google Sheets; formulas are compatible. The meaningful difference is operational: in Sheets the file lives in the cloud and several people can edit at once — with the risk of breaking an unprotected cell if someone skips the protocol.'::text))
      WHEN elem->>'id' = '9185705a-c44b-46b5-aa43-8d08b7df3827' THEN jsonb_set(elem, '{html}', to_jsonb('The template ships with two sample weeks (S12 and S13). To add a new week, duplicate the previous week column, update the header label, and verify SUMIF ranges still point to the right cells before entering real hours.'::text))
      WHEN elem->>'id' = '6f902704-1141-47b9-ae1a-79dbcd9d2edf' THEN jsonb_set(elem, '{html}', to_jsonb('Capacity, allocation, pacing, and utilization without rebuilding the sheet every Monday: when the manual model stops scaling, the same logic can live in a planner that updates numbers when hours are logged. You can explore Taimbox with no commitment.'::text))
      WHEN elem->>'id' = 'c55f3e84-e472-48e3-bdcb-cade3d49651e' THEN jsonb_set(elem, '{html}', to_jsonb('The template uses native conditional formatting on the utilization column. Excel and Google Sheets apply it when you import the .xlsx — you only need to reconfigure rules if you change the thresholds agreed with leadership.'::text))
      ELSE elem
    END ORDER BY ord), '[]'::jsonb)
  FROM jsonb_array_elements(blocks_en) WITH ORDINALITY AS t(elem, ord)
) WHERE slug = 'plantilla-planificacion-recursos-agencia';


-- ley-parkinson (extra)
UPDATE public.blog_posts SET blocks_es = (
  SELECT COALESCE(jsonb_agg(CASE
      WHEN elem->>'id' = '3a0f20cd-a127-4c74-b3a0-cf9b80be8eae' THEN jsonb_set(elem, '{html}', to_jsonb('En agencias, en muchos estudios, plazos más cortos y claros se asocian a mejor foco y a que el trabajo no se dilate sin límite — siempre que el techo venga acompañado de entregable y no solo de presión.'::text))
      ELSE elem
    END ORDER BY ord), '[]'::jsonb)
  FROM jsonb_array_elements(blocks_es) WITH ORDINALITY AS t(elem, ord)
) WHERE slug = 'ley-parkinson';

UPDATE public.blog_posts SET blocks_en = (
  SELECT COALESCE(jsonb_agg(CASE
      WHEN elem->>'id' = '3a0f20cd-a127-4c74-b3a0-cf9b80be8eae' THEN jsonb_set(elem, '{html}', to_jsonb('In agencies, many studies link shorter, clearer deadlines to better focus and work that does not expand without limits — as long as the ceiling comes with a deliverable, not pressure alone.'::text))
      ELSE elem
    END ORDER BY ord), '[]'::jsonb)
  FROM jsonb_array_elements(blocks_en) WITH ORDINALITY AS t(elem, ord)
) WHERE slug = 'ley-parkinson';


-- que-es-timeboxing (extra)
UPDATE public.blog_posts SET blocks_es = (
  SELECT COALESCE(jsonb_agg(CASE
      WHEN elem->>'id' = '27b30477-ae01-48a3-8701-e7dfe7b6ebbc' THEN jsonb_set(elem, '{html}', to_jsonb('<strong>El beneficio:</strong> cura el perfeccionismo tóxico y garantiza que el resto del día no sufra retrasos en cadena — porque el corte obliga a priorizar lo esencial dentro del timebox.'::text))
      ELSE elem
    END ORDER BY ord), '[]'::jsonb)
  FROM jsonb_array_elements(blocks_es) WITH ORDINALITY AS t(elem, ord)
) WHERE slug = 'que-es-timeboxing';

UPDATE public.blog_posts SET blocks_en = (
  SELECT COALESCE(jsonb_agg(CASE
      WHEN elem->>'id' = '27b30477-ae01-48a3-8701-e7dfe7b6ebbc' THEN jsonb_set(elem, '{html}', to_jsonb('<strong>The benefit:</strong> it curbs toxic perfectionism and keeps the rest of the day from slipping — because the forced stop makes you prioritize what matters inside the box.'::text))
      ELSE elem
    END ORDER BY ord), '[]'::jsonb)
  FROM jsonb_array_elements(blocks_en) WITH ORDINALITY AS t(elem, ord)
) WHERE slug = 'que-es-timeboxing';

