# 15. CMS de blog (Supabase + bloques)

Sistema para crear, editar y publicar artículos del blog desde `/admin/blog` sin desplegar código. El cuerpo se guarda como **lista ordenada de bloques tipados** en JSONB; la maquetación de los 8 posts existentes sigue siendo la actual gracias al bloque `visualRef` que monta el `*Article.tsx` ya presente en el bundle.

## Tabla `blog_posts`

Migración: [`supabase/migrations/20260506120000_blog_posts.sql`](../supabase/migrations/20260506120000_blog_posts.sql).

Columnas relevantes:

- `slug` (text, único): identificador estable interno; otros posts lo referencian en `related_slug`. **No es la URL.**
- `status` (`draft` | `published`): RLS de `SELECT` solo expone `published` al público; los `platform_admins` ven todo.
- `path_es`, `path_en` (text, únicos, con CHECK de prefijo `/blog/` y `/en/blog/`): rutas públicas configurables desde admin.
- `title_*`, `description_*`, `meta_title_*`, `meta_description_*`: bilingües; los `meta_*` son opcionales (fallback a los normales).
- `date`, `reading_minutes`, `related_slug`: editorial.
- `schema_version` (int) + `blocks_es`, `blocks_en` (JSONB array): cuerpo. Validado en cliente con Zod en [`src/lib/blog/blockSchema.ts`](../src/lib/blog/blockSchema.ts).
- `json_ld_es`, `json_ld_en` (JSONB): override opcional del JSON-LD; si es `NULL`, [`BlogArticleDynamicPage`](../src/pages/BlogArticleDynamicPage.tsx) genera un `Article` básico desde campos.
- Auditoría: `published_at` (autoset al publicar la primera vez vía trigger), `created_at`, `updated_at` (trigger), `created_by`, `updated_by`.

RLS:

- `SELECT`: `status='published' OR is platform_admin` (concedido a `anon` + `authenticated`).
- `INSERT/UPDATE/DELETE`: solo `EXISTS platform_admins`. Patrón consistente con el resto del área admin.

Índice `idx_blog_posts_status_date` cubre el listado público y el de admin.

## Bloques

`BlogBlock` es una **discriminated union** validada con Zod. Tipos disponibles:

| Tipo | Campos clave | Uso |
|------|-------------|-----|
| `paragraph` | `html` | Texto sanitizado inline (DOMPurify, lista blanca de tags). |
| `heading` | `level: 2\|3\|4`, `text`, `anchorId?` | Cabeceras con anchor para TOC. |
| `callout` | `tone: info\|warning\|success\|highlight`, `html` | Llamadas de atención. |
| `list` | `ordered`, `items[]` | Listas ordenadas o no, items con HTML inline. |
| `table` | `headers[]`, `rows[][]` | Tabla simple, primera columna en negrita. |
| `faq` | `items: [{q,a}]` | Lista de Q&A. |
| `toc` | (sin props) | Compone índice automáticamente desde headings con `anchorId`. |
| `relatedPost` | `slug` | Resuelve resumen del post relacionado en runtime. |
| `html` | `html` | HTML libre, sanitizado con DOMPurify (lista blanca amplia). |
| `cta` | `text`, `href`, `variant` | Botón con `LocaleLink`. |
| `visualRef` | `visualId`, `props?` | Referencia a un componente registrado. |

Sanitización: [`src/lib/blog/sanitize.ts`](../src/lib/blog/sanitize.ts). DOMPurify se aplica en cualquier `html` que provenga de la BD.

## visualRegistry

[`src/lib/blog/visualRegistry.ts`](../src/lib/blog/visualRegistry.ts) mapea `visualId → componente lazy`. Cada entrada declara su modo:

- `mode: 'fullPage'`: el componente renderiza la página entera (header, footer, SEO, breadcrumb, JSON-LD). Cuando un post tiene **un único** bloque `visualRef` con este modo, [`BlogArticleDynamicPage`](../src/pages/BlogArticleDynamicPage.tsx) **delega el render completo** al componente.
- `mode: 'inline'`: el componente vive dentro del cuerpo del artículo y se monta desde `BlockRenderer` (gráficos, infografías).

Los 8 posts seedeados en la migración usan `fullPage` apuntando a sus `Page.tsx` originales — la maquetación, JSON-LD y traducciones se conservan al 100 % sin reescribir nada en bloques granulares. La descomposición fina a bloques es trabajo de Fase 2 y se hace post a post desde el editor.

Visuales registrados como `inline` (reutilizables): `CargaTrabajoFrameworkVisual`, `ParkinsonLawVisual`, `OcupacionVsRentabilidadChart`, `ScopeProtocoloInfographic`, `SenalesCargaAlertaVisual`.

## Resolución de rutas y SEO

- Rutas dinámicas en [`App.tsx`](../src/App.tsx): `/blog/:slug` y `/en/blog/:slug` → `BlogArticleDynamicPage`. Las rutas estáticas por artículo se eliminaron.
- [`BlogArticleDynamicPage`](../src/pages/BlogArticleDynamicPage.tsx) consulta Supabase (`getPostByPath`), decide entre delegar al `fullPage` o renderizar `LandingHeader` + `BlogBreadcrumb` + `<header>` con título/descripción + `BlockRenderer`.
- [`BlogPathSync`](../src/i18n/BlogPathSync.tsx) (montado en `App.tsx`) carga el mapa `path_es ↔ path_en` desde Supabase y lo inyecta en el cache runtime de [`publicPaths.ts`](../src/i18n/publicPaths.ts) vía `setBlogPathCache`. Esto permite `hreflang`/`canonical` correctos para slugs creados desde admin sin desplegar.
- Las entradas de blog del mapa estático `PUBLIC_PATH_ES_TO_EN` se mantienen como **fallback SSR-safe**; el cache runtime tiene prioridad.

## TanStack Query

[`src/hooks/useBlogPosts.ts`](../src/hooks/useBlogPosts.ts) expone:

- `usePublishedPostSummaries()` — listado público.
- `useAllPostSummaries()` — listado admin (incluye drafts).
- `usePublishedPathPairs()` — alimenta `BlogPathSync`.
- `usePostByPath(pathname)` — resolución por URL pública.
- `useRelatedSummary(slug)` — resumen de un post relacionado.
- `useCreatePost()`, `useUpdatePost()`, `useDeletePost()` — mutaciones admin (invalidan toda la familia `["blog"]`).

El cliente bajo nivel está en [`src/lib/blog/client.ts`](../src/lib/blog/client.ts).

## Admin (`/admin/blog`)

Rutas:

- `/admin/blog` → [`AdminBlogPage`](../src/pages/admin/AdminBlogPage.tsx): listado con búsqueda, badges de estado, links externos a la URL pública, edición y borrado con confirmación.
- `/admin/blog/new` y `/admin/blog/edit/:id` → [`AdminBlogEditorPage`](../src/pages/admin/AdminBlogEditorPage.tsx): formulario con tabs ES/EN, sección de identidad/rutas, traducciones+SEO, bloques editados como JSON con validación Zod en vivo, JSON-LD opcional y **previsualización lateral** que usa el mismo `BlockRenderer`. Los `visualRef` con `mode='fullPage'` no se prerrenderizan en el panel (advertencia visible).
- Entrada nueva en [`AdminLayout`](../src/components/layout/AdminLayout.tsx) con icono `Newspaper`.

## Sitemap

[`scripts/generate-blog-sitemap.mjs`](../scripts/generate-blog-sitemap.mjs) (script `npm run sitemap:blog`) consulta Supabase y reemplaza solo el contenido entre marcadores `<!-- BLOG-AUTO-START-ES --> ... <!-- BLOG-AUTO-END-ES -->` y su equivalente EN dentro de [`public/sitemap.xml`](../public/sitemap.xml). Las URLs no-blog se mantienen tal cual.

Recordatorio: ejecutar `npm run sitemap:blog` antes de cada despliegue tras cambios de slugs/altas/bajas; idealmente en el pipeline de release.

## Riesgos y consideraciones

- **XSS**: cualquier campo `html` de bloque se sanitiza con DOMPurify (`sanitizeInlineHtml` o `sanitizeHtml` según el bloque). Los `visualRef` referencian componentes del bundle, no se evalúa código de la BD.
- **Drift de JSON-LD legacy**: los posts con visualRef `fullPage` conservan su JSON-LD escrito en cada `Page.tsx`. Si en el futuro se traslada un post a bloques, el campo `json_ld_es/en` debe rellenarse para no perder el rich snippet.
- **`blogPosts.ts`**: se mantiene durante la transición porque `BlogArticleSeo` legacy lo usa para resolver hreflang en los Page.tsx delegados. Cuando todos los posts vivan en bloques granulares, este archivo y los Page.tsx por artículo pueden retirarse.
- **Cache de paths**: `BlogPathSync` poblando el cache de `publicPaths` solo afecta a hreflang/canonical generados después del primer render. Para SEO sólido, mantener el sitemap regenerado en deploy.
- **`schema_version`**: hoy es 1. Bumpear cuando se introduzcan cambios incompatibles en el schema de bloques; añadir migración de datos si procede.
