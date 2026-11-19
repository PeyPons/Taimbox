# Taimbox · SEO técnico (Pepe, 18/11/2026)

Alcance: web pública (landings, blog, guía, legales, precios, contacto, API docs). Queda fuera el Dashboard y el resto de rutas autenticadas. Fuentes: copia de solo lectura en `investigacion/repo` y lecturas GET a `https://taimbox.com` (18/11/2026, zona Atlantic/Canary). Sin cifras de tráfico.

## 1. Cómo se sirven hoy metas, canonicals, hreflang y el renderizado

La web pública es una SPA React + Vite (`investigacion/repo/vite.config.ts`, `index.html`, `docs/01-arquitectura.md`). El HTML inicial es el mismo en las rutas HTML comprobadas (2.747 bytes): `<html lang="es">`, `<title>Taimbox</title>`, `og:title` «Taimbox», `og:description` «Gestión de equipo», `#root` vacío, sin meta description, canonical, hreflang ni JSON-LD. Idéntico con user-agent normal y Googlebot (`curl -sS https://taimbox.com/`, mismo MD5), también en `/en`.

Las metas por página las inyecta el cliente con `react-helmet-async`: `src/seo/SeoTags.tsx` (title, description, canonical absoluto vía `src/lib/publicSiteUrl.ts` / `VITE_PUBLIC_SITE_URL`, Open Graph sin `og:image`, JSON-LD opcional) y `src/seo/RouteHreflangSync.tsx` en `src/App.tsx` (`es` / `en` / `x-default` hacia la URL en español), a partir de `src/i18n/publicPaths.ts`. Landings: `CommercialSeoTags.tsx` (`WebPage`); blog: `BlogArticleSeo.tsx` / `BlogArticleDynamicPage.tsx` (`Article`). Ese mapa se puede reutilizar. Conviene que esas etiquetas y el contenido visible estén ya en el HTML inicial (prerender o SSG).

`meta-worker.js` no interviene en las metas HTML: es un proceso Node de sincronización de cuentas Meta Ads con Supabase, fuera del alcance de la web pública. No hay `wrangler`, `_redirects` ni `_headers` en el repo.

**Estados HTTP.** El origen devuelve el mismo `index.html` con HTTP 200 en rutas existentes, en `/que-es-timeboxing`, en `/dashboard` y en URLs inexistentes (`/esta-ruta-no-existe-pepe-404`, `/blog/este-articulo-no-existe-xyz`): soft 404 (`src/pages/NotFound.tsx`, sin código 404 ni `noindex`). En `App.tsx`, `/que-es-timeboxing` está comentado como «301», pero es un `<Navigate replace>`: `curl --max-redirs 0` da 200, sin `Location`. `/precios` y `/precios/` responden ambas 200.

**robots y sitemap.** En vivo coinciden al byte con `public/robots.txt` y `public/sitemap.xml` (`diff` vacío, curl 18/11/2026). robots permite `/`, declara el sitemap y hace `Disallow` de login, dashboard, otras internas y `/pitch`. El sitemap tiene 75 URLs, sin `lastmod` ni xhtml hreflang. Incluye `/login` (también en `Disallow`) y `/pitch` y `/en/pitch` (`Disallow`; `PresentationPage.tsx` pone `noindex, nofollow` en cliente). Faltan `/api-docs/openapi` y su par EN (públicas en `App.tsx` y `publicPaths.ts`). Posts: `npm run sitemap:blog`.

**Cabeceras y host.** HTML: `Cache-Control: no-cache, no-store, must-revalidate` (como `public/serve.json`), `cf-cache-status: DYNAMIC`, HSTS `max-age=63072000; preload`, `server: cloudflare`. Los assets con hash (`/assets/index-BD9O5cnQ.js`, `index-BzyBebTw.css`) llegan con `max-age=14400`, no con 31.536.000 s + `immutable` de `serve.json`. JS principal: 3.561.226 bytes en crudo / 1.002.351 gzip; CSS: 236.226 / 31.895 Brotli. `www.taimbox.com` no tiene A ni CNAME (DoH Cloudflare, Status 3). `http://` no se pudo comprobar (el proxy del box devuelve 500; falso positivo conocido).

**Rendimiento** (Lighthouse 12.8.2 móvil, 18/11/2026 ~23:24 Atlantic/Canary). Chrome ejecuta JS, así que el SEO de Lighthouse puede salir alto aunque el HTML crudo no lleve las metas. Home: rendimiento 36, SEO 100, accesibilidad 94, best practices 100; LCP 11,1 s, FCP 7,6 s, TBT 930 ms, CLS 0,013; 1.605 KiB de transferencia (scripts 1.466 KiB); TTFB 160 ms. `/precios`: rendimiento 29, SEO 100, accesibilidad 98, best practices 100; LCP 10,4 s, TBT 860 ms, CLS 0,182; 1.530 KiB; TTFB 170 ms. `vite.config.ts` no separa el bundle público del de la aplicación.

## 2. Qué haría falta al rehacer la web pública (horas internas)

Conviene **mantener las URLs públicas actuales** (detalle en el CSV). Lista priorizada:

1. **Prerender o SSG** de la web pública: title, description, canonical, hreflang (`es` / `en` / `x-default`), Open Graph (con imagen) y contenido visible en el HTML inicial, reutilizando `publicPaths.ts` y el criterio de `SeoTags`. **16–24 h.**
2. **Códigos HTTP y redirecciones**: 404 real en rutas inexistentes (y en artículos o secciones de guía que no existan); 301 de servidor de `/que-es-timeboxing` → `/blog/que-es-timeboxing`; 301 de la barra final a la canónica sin slash; alta de `www` con 301 al apex. Un solo salto, sin cadenas. **4–8 h.**
3. **Sitemap y robots alineados**: sacar `/login`, `/pitch` y `/en/pitch` del sitemap; añadir `/api-docs/openapi` y su par EN si se indexan; `lastmod`; generación en el build (el script del blog ya existe). En pantallas de acceso, `Disallow` o `noindex` de forma coherente (`/reset-password` hoy no está en `robots.txt`). **3–5 h.**
4. **Rendimiento**: bundle de la web pública separado del Dashboard; caché larga e `immutable` en `/assets/*` con hash, en línea con `serve.json`. **10–16 h.**
5. **Schema en el HTML inicial**: `Organization` / `SoftwareApplication` en la home, `WebPage` en landings, `Article` (y FAQ/HowTo donde el blog ya lo prevé) y `BreadcrumbList`. **4–8 h.**

**Total: 37–61 horas internas.** Login y restablecer contraseña quedan pendientes de confirmar en el alcance (indexación: fuera; la URL de `/login` aparece hoy en el sitemap).

## 3. Mapa de URLs

Fichero: `aportes/pepe-mapa-urls.csv` (78 filas: 75 del sitemap + `/api-docs/openapi` y su par EN + la 301 de `/que-es-timeboxing`). Columnas: `url_actual`, `idioma`, `tipo`, `url_nueva`, `accion` (`mantener` / `301` / `crear` / `retirar`), `notas`.

- 76 `mantener` (recomendado conservar las rutas actuales).
- 1 `301`: `/que-es-timeboxing` → `/blog/que-es-timeboxing` (destino que se mantiene; un solo salto).
- 1 `retirar` del índice: `/login` (fuera de alcance de indexación; sacar del sitemap).
- `/pitch` y `/en/pitch`: se mantiene la URL si ustedes la siguen usando, pero se retiran del sitemap y se conserva `noindex`.

Comprobación: hoy no hay cadenas HTTP de servidor (las rutas HTML responden 200). El 301 propuesto apunta a una URL `mantener`, sin segundo salto. El Dashboard no forma parte de este mapa.
