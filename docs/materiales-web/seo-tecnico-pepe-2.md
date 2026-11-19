# Taimbox · SEO técnico (Pepe, 18/11/2026)

Para Rosario. Alcance: web pública; el Dashboard queda fuera. Fuentes: `investigacion/repo` (solo lectura), lecturas GET a `https://taimbox.com` el 18/11/2026 (hora de Canarias) y Lighthouse 12.8.2 local, móvil. Sin cifras de tráfico: pendiente de confirmar en GSC. Detalle ampliado en `aportes/pepe.md`; mapa en `aportes/seo-pepe-mapa-301.csv`.

## 1. Situación actual
- **Renderizado.** SPA React + Vite. Todas las rutas HTML devuelven el mismo `index.html` (2.747 bytes): `<html lang="es">`, title «Taimbox», `#root` vacío, sin description, canonical, hreflang ni JSON-LD, igual con Googlebot (`curl -sS https://taimbox.com/`, mismo MD5). Metas, canonical, hreflang y schema se inyectan en el cliente: `src/seo/SeoTags.tsx`, `RouteHreflangSync.tsx`, `CommercialSeoTags.tsx`, `BlogArticleSeo.tsx` y `src/i18n/publicPaths.ts`. Ese mapa de rutas se puede reutilizar.
- **Estados HTTP.** Rutas inexistentes devuelven 200 (`/esta-ruta-no-existe-pepe-404`). `/que-es-timeboxing` es un `Navigate` de React, no un 301 (`curl --max-redirs 0`: 200 sin `Location`). `/precios` y `/precios/` responden 200 las dos.
- **Sitemap y robots.** 75 URL, iguales a `public/sitemap.xml`. Incluye `/login`, `/pitch` y `/en/pitch`, que a la vez están en `Disallow`. No incluye `/api-docs/openapi` ni su par EN. Sin `lastmod`.
- **Caché y host.** HTML sin caché; los assets con hash salen con `max-age=14400`, no con la caché larga de `public/serve.json`. `www.taimbox.com` no resuelve (DoH, Status 3). El paso de http a https no se pudo comprobar desde el box.
- **Rendimiento** (Lighthouse móvil; usa Chrome sin interfaz, no navegador interactivo): home 36 (LCP 11,1 s), `/precios` 29 (LCP 10,4 s), landing `/planificador-recursos` 54 (LCP 9,2 s), artículo de blog `/blog/estimacion-proyectos-agencia-como-acertar` 45 (LCP 11,3 s, TBT 510 ms). Crudos en `aportes/pepe-raw/`. JS principal: 3,56 MB crudo, 1,00 MB gzip, sin separar la web pública del Dashboard (`vite.config.ts`).

## 2. Cómo dar esos datos en la primera respuesta
| Opción | Qué es | Horas | Cuándo encaja |
|---|---|---|---|
| A. Prerender o SSG en el build | Cada ruta pública sale como HTML con metas, hreflang `es`/`en`/`x-default`, JSON-LD y contenido visible | 16 a 24 | Recomendada: también mejora LCP, porque el contenido llega sin esperar al JS |
| B. Worker en el borde (Cloudflare) | Reescribe el `<head>` con HTMLRewriter a partir de `publicPaths.ts`; el cuerpo sigue en cliente | 12 a 20 | Solo si se quiere acelerar sin tocar el build; el contenido visible seguiría sin estar en el HTML |

El `meta-worker.js` de la raíz no sirve para esto: sincroniza Meta Ads. Con A, el 404 y los 301 se pueden resolver en el mismo despliegue; con B, en el propio worker.

## 3. Qué va en plan base y qué en completo (horas internas)
| Punto | Base | Completo |
|---|---|---|
| Metas, canonical, hreflang es/en/x-default y contenido en el HTML (A) | 16 a 24 | 16 a 24 |
| 404 de servidor y 301 de un solo salto: `/que-es-timeboxing` → `/blog/que-es-timeboxing`, barra final → sin barra, `www` → apex | 4 a 8 | 4 a 8 |
| Sitemap generado en el build y alineado con robots (sacar `/login`, `/pitch`, `/en/pitch`; añadir `/api-docs/openapi` si se indexa; `lastmod`) | 3 a 5 | 3 a 5 |
| Schema básico (`Organization`, `SoftwareApplication`, `WebPage`, `BlogPosting`) | 2 a 4 | 2 a 4 |
| `FAQPage` y `BreadcrumbList` | no | 2 a 4 |
| Rendimiento: bundle público separado, caché larga con `immutable`, imágenes y fuentes | no | 10 a 16 |
| **Total** | **25 a 41 h** | **37 a 61 h** |

En el plan base el rendimiento queda como recomendación para una segunda fase; con A ya mejora algo, sin dato de cuánto.

## 4. Redirecciones (CSV)
`aportes/seo-pepe-mapa-301.csv`: 78 filas. 76 `mantener`, 1 `301` (`/que-es-timeboxing`) y 1 `retirar` del índice (`/login`). Se conservan las 75 URL actuales. 0 cadenas: el 301 apunta a una URL que se mantiene.

## 5. A confirmar con ustedes y límites
- Si `/login`, `/reset-password` y `/pitch` entran en el índice (hoy, no).
- Si el visor `/api-docs/openapi` debe indexarse.
- Logotipo nuevo y datos de la organización para el schema.
- Sin verificar: http a https, `www` (no resuelve), tráfico y posiciones (sin dato hasta GSC). Las notas de rendimiento son de laboratorio, no datos de campo.
