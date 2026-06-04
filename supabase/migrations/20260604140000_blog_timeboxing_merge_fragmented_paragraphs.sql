-- Fusiona tripletes párrafo/cuándo/beneficio en timeboxing y elimina bloques redundantes.
-- Idempotente: solo actúa si siguen existiendo los ids secundarios.

UPDATE public.blog_posts
SET blocks_es = (
  SELECT COALESCE(jsonb_agg(
    CASE
      WHEN elem->>'id' = '215b3ff8-3c3b-434d-a7d2-88c2d1ca2c88' THEN jsonb_set(elem, '{html}', to_jsonb('Implica que <strong>debes detener tu trabajo obligatoriamente</strong> cuando suene el cronómetro — no es sadismo de productividad, sino proteger el resto del día. <strong>Cuándo usarlo:</strong> tareas propensas al perfeccionismo (diseño), investigación acotada o reuniones que, sin techo, se expanden hasta llenar la hora reservada. <strong>El beneficio:</strong> cura el perfeccionismo tóxico y evita que el resto del día se pague en cadena de retrasos.'::text))
      WHEN elem->>'id' = '07a75943-c901-44b6-be34-8ae13839c907' THEN jsonb_set(elem, '{html}', to_jsonb('El límite actúa como <strong>aviso o punto de control</strong>: sabes que debes ir concluyendo, pero conservas margen para cerrar bien la tarea. <strong>Cuándo usarlo:</strong> trabajos creativos complejos o entregas a clientes inamovibles donde un corte duro rompería calidad. <strong>El matiz:</strong> sigues teniendo techo, pero el objetivo es terminar bien, no abandonar a medias.'::text))
      WHEN elem->>'id' IN ('ba409868-10c1-4af1-8341-03c0d320f55c', '27b30477-ae01-48a3-8701-e7dfe7b6ebbc', 'acf7148e-be24-4f82-80e0-6b336efc2eb9') THEN NULL
      ELSE elem
    END
    ORDER BY ord
  ) FILTER (WHERE CASE WHEN elem->>'id' IN ('ba409868-10c1-4af1-8341-03c0d320f55c', '27b30477-ae01-48a3-8701-e7dfe7b6ebbc', 'acf7148e-be24-4f82-80e0-6b336efc2eb9') THEN FALSE ELSE TRUE END), '[]'::jsonb)
  FROM jsonb_array_elements(blocks_es) WITH ORDINALITY AS t(elem, ord)
)
WHERE slug = 'que-es-timeboxing'
  AND blocks_es @> '[{"id":"ba409868-10c1-4af1-8341-03c0d320f55c"}]'::jsonb;

UPDATE public.blog_posts
SET blocks_en = (
  SELECT COALESCE(jsonb_agg(
    CASE
      WHEN elem->>'id' = '640a4275-2e7d-4a95-abaf-0725f0563c57' THEN jsonb_set(elem, '{html}', to_jsonb('It means you <strong>must stop when the timer rings</strong> — not productivity cruelty, but protecting the rest of the day. <strong>When to use it:</strong> tasks prone to perfectionism (design), bounded research, or meetings that expand to fill the booked hour without a ceiling. <strong>The benefit:</strong> it curbs toxic perfectionism and stops the rest of the day from paying a chain of delays.'::text))
      WHEN elem->>'id' = 'd43bccea-9d3f-464a-bd20-55ec57c07cfe' THEN jsonb_set(elem, '{html}', to_jsonb('The limit acts as a <strong>warning or checkpoint</strong>: you know you should wrap up, but you still have room to close properly. <strong>When to use it:</strong> complex creative work or immovable client deliveries where a hard stop would break quality. <strong>The nuance:</strong> you still have a ceiling, but the goal is to finish well, not to abandon mid-thought.'::text))
      WHEN elem->>'id' IN ('49ee2ef0-bc0c-4ea3-b87c-3d9d8e92305d', 'bf2f44a6-8af6-4cb1-9aba-46b9fcc59dad', 'b6e2e403-68e6-428e-8db9-dea8d13512ea') THEN NULL
      ELSE elem
    END
    ORDER BY ord
  ) FILTER (WHERE CASE WHEN elem->>'id' IN ('49ee2ef0-bc0c-4ea3-b87c-3d9d8e92305d', 'bf2f44a6-8af6-4cb1-9aba-46b9fcc59dad', 'b6e2e403-68e6-428e-8db9-dea8d13512ea') THEN FALSE ELSE TRUE END), '[]'::jsonb)
  FROM jsonb_array_elements(blocks_en) WITH ORDINALITY AS t(elem, ord)
)
WHERE slug = 'que-es-timeboxing'
  AND blocks_en @> '[{"id":"49ee2ef0-bc0c-4ea3-b87c-3d9d8e92305d"}]'::jsonb;
