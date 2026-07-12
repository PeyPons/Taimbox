---
name: redaccion-blog-articulos
description: >-
  Crear, revisar, traducir, migrar o publicar artículos del CMS de Taimbox con
  profundidad editorial, evidencia, bloques visuales útiles, negrita moderada,
  paridad ES/EN y verificación técnica. Usar al tocar blog_posts, bloques JSONB,
  metadata, JSON-LD, TOC, CTA, visualRef, scripts de migración del blog o el
  renderer público.
---

# Redacción y revisión del blog de Taimbox

## Resultado esperado

Entregar artículos que resuelvan una intención concreta, tengan la misma utilidad en ES y EN y funcionen en la página renderizada. Metadata, volumen total o ausencia de errores técnicos no bastan si los H2 siguen vacíos o la página parece un esquema expandido.

## Flujo obligatorio

1. **Leer la fuente real.** Consultar `docs/15-cms-blog.md`, `src/lib/blog/blockSchema.ts` y el estado actual de `blog_posts`. No asumir que `blog.json` o una migración legacy coincide con producción.
2. **Guardar un antes.** Exportar los posts afectados con IDs, `updated_at`, metadata, bloques ES/EN y JSON-LD. No guardar credenciales.
3. **Auditar antes de reescribir.** Separar:
   - integridad: schema, IDs, anclas, enlaces, Markdown residual y JSON-LD;
   - profundidad: qué promete y qué entrega cada H2;
   - traducción: significado, estructura, CTA y rutas localizadas;
   - presentación: ancho de lectura, jerarquía, contraste y ritmo de bloques.
4. **Diseñar la mejora por sección.** Conservar lo útil. Añadir prosa, tabla, lista, callout, ejemplo o visual solo si resuelve una carencia identificada.
5. **Redactar ES y EN en paralelo.** Traducir la intención y el nivel de detalle, no palabra por palabra. Justificar cualquier diferencia estructural.
6. **Validar el borrador.** Ejecutar `npm run audit:blog -- <export-o-dry-run.json> --strict` y corregir errores/avisos relevantes.
7. **Escribir con control de concurrencia.** En cambios por API/SQL, usar transacción y guard de `updated_at`; abortar si el artículo cambió desde el export.
8. **Leer de vuelta.** Comparar la API pública con el objeto preparado, revisar enlaces y renderizar al menos una ruta ES y su EN en escritorio y móvil.
9. **Entregar trazabilidad.** Guardar inventario antes/después y resumir qué cambió por artículo. Distinguir contenido ya publicado de cambios de frontend pendientes de deploy.

## Prueba de profundidad por H2

Un H2 debe cumplir lo que promete. Marcar para revisión cualquier H2 que tenga solo un párrafo genérico y ninguna de estas capas:

- explicación suficiente para entender la idea y tomar una decisión;
- ejemplo trabajado o contraste entre dos casos;
- tabla, lista, checklist, protocolo o callout con función real;
- subsecciones H3 que desarrollen el tema;
- visual que reduzca complejidad y tenga explicación textual.

Un H2 padre puede tener una introducción corta si organiza H3 sustanciales. No inflar conclusiones ni añadir bloques decorativos para superar una métrica.

Preferir títulos descriptivos. Evitar fórmulas como “lo que nadie te cuenta”, “las causas reales que muchos no ven”, “la verdad incómoda” o “guía definitiva” salvo que el texto demuestre literalmente esa promesa.

## Evidencia, cifras y ejemplos

- No presentar porcentajes, tiempos, costes o bandas como universales sin fuente verificable y contexto equivalente.
- En temas técnicos, legales, médicos o de investigación, preferir fuente primaria u organismo responsable. Enlazar la afirmación cerca del dato.
- Si una cifra es una configuración de plantilla, ejemplo interno o alerta operativa, etiquetarla como tal; no llamarla benchmark sectorial.
- Un cálculo ilustrativo debe mostrar entradas, fórmula y resultado. No convertir el resultado del ejemplo en recomendación general.
- No inventar testimonios ni escenas que parezcan observaciones reales. Los ejemplos hipotéticos deben ser plausibles y quedar identificados como ejemplos.
- No diagnosticar salud, intención o rendimiento individual desde métricas de carga.

## Uso de negrita

La negrita debe ayudar a escanear una decisión, no colorear el artículo.

- En un párrafo o callout normal, usar como máximo un fragmento breve en `<strong>`; admitir un segundo solo si separa dos conceptos realmente distintos.
- No poner frases completas, varias líneas ni más de aproximadamente el 30 % de las palabras del bloque en negrita.
- No encadenar `</strong> <strong>` ni usar negrita en cada oración.
- En listas, no empezar todos los ítems con una etiqueta en negrita por sistema. Usarla solo donde el lector necesite distinguir categorías; si todos los ítems tienen etiqueta, considerar una tabla o H3.
- No añadir `<strong>` dentro de tablas: la tabla y su primera columna ya aportan jerarquía visual.
- No usar negrita para simular un encabezado. Crear un bloque `heading`, `callout` o una lista estructurada.
- Fórmulas, advertencias críticas y una etiqueta breve de callout son usos válidos.

El auditor marca densidad, fragmentos repetidos y negrita extendida; revisar el contexto antes de aceptar una excepción.

## Voz y tono

- Escribir con claridad y conocimiento operativo, sin jerga de consultoría ni frases de SEO.
- Usar ejemplos concretos sin fingir experiencia personal ni dramatizar.
- Tomar postura cuando la evidencia lo permite; expresar incertidumbre cuando no.
- Evitar introducciones que repiten el H2 y conclusiones que resumen sin aportar una decisión.
- Enlaces internos con ancla descriptiva; CTA útil, localizado y relacionado con la intención del artículo.

## Bloques y ritmo visual

- Prosa para explicar; lista para pasos/señales; tabla para comparar; callout para una regla o advertencia; visual para relaciones difíciles de explicar linealmente.
- No repetir en una tabla lo mismo que dice el párrafo anterior.
- Conservar una columna de prosa legible; permitir más ancho a tablas y visuales.
- Moderar H2 largos y comprobar saltos de línea reales.
- No esconder información necesaria en hover o animación.
- En móvil, tablas deben convertirse en tarjetas o seguir siendo comprensibles sin desplazamiento horizontal excesivo.

## Traducción ES/EN

- Mantener la misma promesa, ejemplos, cautelas, enlaces y CTA en ambos idiomas.
- Revisar microcopy: botones, encabezados de tabla, etiquetas, unidades y textos de visuales.
- No aceptar paridad solo porque el número de bloques coincide. Leer al menos los títulos, CTA y bloques añadidos en EN.
- Usar rutas localizadas cuando existan y conservar `path_es`/`path_en`, canonical y hreflang.

## QA técnica mínima

- Metadata ES/EN completa y específica.
- `BlogBlocksSchema` válido; IDs únicos y `anchorId` en `^[a-z0-9-]+$`.
- TOC y anclas coherentes.
- Sin `href="#"`, `**` residual, palabras pegadas ni mezcla de idiomas.
- FAQ visible y `FAQPage` sincronizados; `Article.dateModified` actualizado cuando corresponda.
- Tiempo de lectura recalculado desde contenido renderizable.
- Enlaces internos/externos comprobados y visual IDs existentes.
- API pública idéntica al contenido preparado después de escribir.
- Render en escritorio y móvil; comprobar también HTML inicial/metadata cuando el cambio dependa del frontend.

## Scripts legacy

`scripts/migrate-blog-content.mjs` y parches antiguos se generaron desde traducciones legacy. No usarlos como fuente de verdad ni aplicarlos sobre producción sin export actual, diff completo, auditoría estricta y aprobación explícita. Si el CMS ya contiene una versión corregida, una migración regenerada puede reintroducir contenido pobre.

## Referencias

- CMS y bloques: [docs/15-cms-blog.md](../../../docs/15-cms-blog.md)
- Schema: [src/lib/blog/blockSchema.ts](../../../src/lib/blog/blockSchema.ts)
- Renderer: [src/components/landing/blog/BlockRenderer.tsx](../../../src/components/landing/blog/BlockRenderer.tsx)
