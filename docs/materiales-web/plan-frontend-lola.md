# Taimbox · Aporte de frontend (Lola)

Uso interno para el equipo, con un bloque reutilizable en la propuesta. Auditoría solo lectura del repo en `investigacion/repo`, 18/11/2026 (hora de Canarias, UTC+0). Sin tocar el repo, la Pi ni Supabase, sin contacto externo y sin gasto.

Las horas del bloque B son **internas de frontend**. No van al PDF ni se convierten aquí en precio. El diseño visual, el logotipo nuevo, la redacción legal y el Dashboard quedan fuera de estas cifras.

El documento tiene dos bloques. El A puede copiarse a la propuesta. El B no sale del equipo.

---

# A. Para el PDF (apto cliente)

Trato de «ustedes». Alcance y funcionalidades en lenguaje comercial. Sin horas, tarifas, costes ni cifras internas. Sin críticas a la web actual.

## A.1 Lo que hemos entendido

Taimbox es una plataforma de planificación y control operativo para agencias. La propuesta cubre **rehacer la web pública** (portada, landings de producto, páginas interiores y piezas de captación e información), en español y en inglés, y un **logotipo nuevo**. El área privada (el Dashboard, tras iniciar sesión) no forma parte de este trabajo.

Hemos revisado el código de la web pública para ajustar el alcance a lo que ustedes ya ofrecen a quien llega sin cuenta: presentación del producto, comparación de planes, contenidos de ayuda, blog, documentación de integraciones y un canal de contacto.

## A.2 Qué entra en la web pública nueva

- **Portada.** Presentación del producto, recorridos visuales de las vistas principales, integraciones, seguridad, planes, preguntas frecuentes y llamada a la acción, con una cabecera y un pie comunes.
- **Landings de funcionalidad.** Páginas de producto para el espacio de cada persona, el planificador de recursos, la gestión de equipos, los reportes de rentabilidad, el control de proyectos, las integraciones, el monitor de publicidad y la seguridad. También la página que explica el enfoque de timeboxing.
- **Planes y precios.** Comparativa de los planes públicos, con precios en la moneda que elijan consultar y llamadas claras a registro o a contacto en los planes que se cierran por conversación.
- **Blog.** Índice con búsqueda y categorías, y artículos bilingües que se pueden publicar sin un despliegue, conservando tiempos de lectura, piezas visuales, plantilla descargable cuando exista y datos para buscadores.
- **Guía de uso.** Índice y capítulos por área (planificación, espacio personal, plazos, informes, weekly, equipo, tiempos, clientes y proyectos, configuración).
- **Documentación de la API.** Guía de integración, tutoriales, referencia de recursos y visor de la especificación OpenAPI.
- **Contacto.** Formulario con validación y confirmación, más un canal de correo, para consultas comerciales.
- **Presentación comercial.** Recorrido por diapositivas del producto, pensado para una reunión o una demo.
- **Páginas de apoyo.** Política de privacidad, condiciones, página 404 y preferencias de cookies alineadas con la medición (el consentimiento se pide antes de activar lo no esencial).
- **Versión en inglés.** Cada página pública tiene su equivalente bajo un prefijo de idioma, con metadatos y mapa del sitio en los dos idiomas.

El área de administración del blog (alta y edición de artículos) y las pantallas de acceso o recuperación de contraseña se tratan como piezas de frontera: la web pública las usa o las enlaza, pero no se presupuestan aquí como parte del Dashboard ni como anexo legal.

## A.3 Enfoque técnico (vista de front)

Recomendamos mantener el stack actual de la web pública: **React**, **Vite**, **Tailwind** y **Shadcn**, con textos en dos idiomas e inyección de metadatos (título, descripción, canónica, alternativas de idioma y datos estructurados). El blog público seguirá leyendo los artículos publicados en la base existente. El formulario de contacto seguirá entregando los envíos al servicio de correo que ya opera en el servidor.

El logotipo nuevo se integrará en cabecera, pie y piezas de marca cuando la dirección de arte lo entregue. Las páginas legales se adaptan al nuevo diseño conservando el texto vigente, sin reescritura jurídica en este alcance.

Nada de lo anterior implica cambiar el producto que ustedes ya operan en el área privada. Se trata de dar a la cara pública una presentación más clara, coherente y fácil de mantener, en los dos idiomas, sin tocar el Dashboard.

---

# B. Interno (no va al PDF)

## Preguntas de alcance (no asumir)

1. **Login y reset-password** (`src/pages/Login.tsx`, 553 L; `ResetPasswordPage.tsx`, 211 L): pantallas públicas de acceso, muy acopladas a Auth, registro, onboarding y conversión. ¿Entran en este presupuesto o se dejan con la piel actual?
2. **CMS del blog** (`/admin/blog`, `AdminBlogPage.tsx` 230 L, `AdminBlogEditorPage.tsx` 854 L, `BlogBlocksEditor.tsx` 486 L): vive en el panel de plataforma, fuera del alcance «web pública». El blog público **depende** de este contrato. Aquí solo se estima el consumo público, no rehacer el editor.
3. **`/dashboard-empleado`**: es landing pública que describe el Dashboard (`EmployeeDashboardArticle.tsx`). **Entra** como landing, no como el Dashboard real.
4. **Prerender o SSR** para crawlers: no aparece en el repo (véase B.3 SEO). ¿Se añade o se mantiene meta en cliente?
5. **Páginas legales**: solo cambio de piel con el copy actual, alineado con la ausencia de anexo legal en la propuesta.

## B.1 Inventario de la web pública

Fuente de rutas: `src/App.tsx` (L 128-189, 268). Cada ruta ES tiene espejo `/en` en `src/i18n/publicPaths.ts` (28 pares estáticos) más pares de blog resueltos en runtime por `BlogPathSync.tsx`. Componentes de chrome comunes, no repetidos en cada fila: `LandingHeader.tsx` (257 L, menú, `FeaturesDropdown.tsx` 268 L, `LanguageSelector.tsx` 114 L, enlaces a `/login`), `LandingFooter.tsx` (166 L), `CookieBanner.tsx` (234 L, montado en `App.tsx`). Líneas con `wc -l`.

| Ruta ES (espejo EN) | Secciones / pieza | Componentes landing (además del chrome) | Lín. aprox. | Animación | Interactividad | Datos |
|---|---|---|---:|---|---|---|
| `/`, `/en` | Hero + 9 bloques (s01 mock planificador, s02 pilares, s03 perfiles con 5 mocks, s04 fases, s05 integraciones/PPC, s06 seguridad, s07 planes, s08 FAQ, s09 CTA) | `LandingLiteralHero`, `LandingBelowMotionSections`, `below/LandingBelowSection01-09`, hooks `useLanding*` | pág. 100; hero 781; below ~3.100; hooks 349 | `motion/react` (MotionConfig, whileInView); `animate` de `motion` (órbita, ticker, parallax, glow al puntero); respeta `useReducedMotion` | CTAs, acordeón FAQ, selector de planes/divisa en s07, mocks por rol | i18n `landing` + `homeLiteral.json` (177 hojas); precios de `publicPricing.ts` |
| `/por-que-timeboxing` (`/en/why-taimbox`) | 6 secciones (gancho, teoría, problema, solución, arquitectura, CTA) | `LandingArticle` | 57 + 430 | CSS / transiciones | Demo de planificador lazy (`components/demo/DemoDashboard.tsx`, 319 L) | i18n `landing.articleWhy`; SEO JSON-LD |
| `/dashboard-empleado`, `/planificador-recursos`, `/gestion-equipos`, `/reportes-rentabilidad`, `/control-proyectos`, `/integraciones` (y `/en/...`) | 6 a 8 secciones por landing (hero, bloques, CTA) | `EmployeeDashboardArticle` 640, `PlannerArticle` 513, `TeamArticle` 533, `ReportsArticle` 431, `ProjectsArticle` 438, `IntegrationsArticle` 493; wrappers de ~32 L | ~3.100 en artículos | Sobre todo CSS / Tailwind | CTAs, maquetas estáticas | i18n `landing.commercial.*`; `CommercialSeoTags.tsx` |
| `/monitor-ppc` (`/en/ppc-monitor`) | 7 secciones + 4 mocks (dashboard, forecast, segmentación, holdings) | `PpcMonitorPacingChart` 371; página monolítica | 547 + 371 | CSS | Gráfico de pacing, mocks | i18n `commercial.ppc` |
| `/seguridad` (`/en/security`) | 8 secciones | Página monolítica | 391 | CSS | CTAs, listados | i18n `commercial.security` |
| `/precios` (`/en/pricing`) | 5 secciones: hero, dos filas de planes (Free/Team/Agency y Scale/Enterprise), fórmulas, confianza, FAQ (6 ítems) | `LandingPricingCurrencySelect` 66 | 525 | CSS | Selector de divisa, acordeón FAQ, CTAs a registro o contacto | i18n `landing.pricing` (misma fuente que s07); `publicPricing.ts`, `publicPricingLayout.ts`; tipos via API Frankfurter (`usePublicPricingCurrency.ts`, 178 L) con fallback |
| `/blog`, `/blog/:slug` (`/en/blog`, `/en/blog/:slug`) | Índice (destacado, búsqueda, filtros, grid); artículo dinámico (breadcrumb, bloques, TOC, related, JSON-LD). Redirección `/que-es-timeboxing` → `/blog/que-es-timeboxing` | `BlockRenderer`, bloques, `RevealOnScroll`, `visualRegistry` (9 fullPage + 16 inline), artículos en `landing/blog/` (p. ej. plantilla 1.004 L) | índice 373; ficha 175; `lib/blog` ~1.089; artículos y visuales en el total de `components/landing` (16.325 L la carpeta) | `RevealOnScroll`; CSS | Búsqueda y categorías; calculadora de buffer y gráficos en posts; descarga `.xlsx` en `public/recursos/` | Supabase `blog_posts` vía `useBlogPosts.ts` + `lib/blog/client.ts` (RLS published); i18n `blog.json` (1.316 hojas/idioma); `src/data/blogPosts.ts` es legado (el índice ya no lo lee) |
| `/guia`, `/guia/:section` (`/en/guide`, `/en/guide/:section`) | Índice + 9 capítulos (planificador, mi-espacio, deadlines, informes, weekly-forecast, equipo, tiempos, clientes-proyectos, configuracion) | Página autosuficiente | 965 | CSS | Navegación entre capítulos | i18n `landing.guide` |
| `/contacto` (`/en/contact`) | Intro + formulario (nombre, email, asunto, mensaje) + enlace mailto (sin citar la dirección aquí) | Chrome + UI Shadcn | 287 | CSS / spinners | Alta, validación, toasts, límites `INPUT_LIMITS` | i18n `landing.static.contact`; envío a Edge `send-contact-email` (Resend, destinatario por `CONTACT_TO_EMAIL`; rate limit 5 envíos / 15 min por IP en `_shared/rate-limit.ts`). Sin honeypot ni Turnstile en el front actual |
| `/api-docs` (`/en/api-docs`) | Overview, tutoriales (11), SDK/REST/filtro/realtime, referencia (~20 recursos) | Shell 334 L + carpeta `pages/api-docs` 5.575 L (`tables.ts` / `tables.en.ts` ~1.515 L c/u) | ~5.900 | CSS | Búsqueda, TOC, copiar ejemplos, anclas | i18n `apiDocs.json` (324 hojas/idioma) |
| `/api-docs/openapi` (`/en/api-docs/openapi`) | Visor | `LanguageSelector`; Redoc por CDN sobre `public/openapi/taimbox-integration-api.json` (5.200 L), generado por `scripts/generate-openapi.mjs` (376 L) | 136 | la del visor | Navegación Redoc | JSON estático + i18n `apiDocs` |
| `/pitch` (`/en/pitch`) | 16 diapositivas (S00-S15) | `PresentationMockups` 386 L | 747 + 386 | transiciones entre slides | Teclado (flechas, espacio, enter) y botones | i18n `landing.static.pitch` |
| `/privacidad`, `/condiciones` (`/en/privacy`, `/en/terms`) | Bloques legales por secciones | Chrome | 331 y 240 | no | Enlaces internos | i18n `landing.static.privacy` / `terms` |
| 404 (`*`) | Mensaje + vuelta al inicio | no usa el chrome de landing | 30 | no | enlace | i18n `app` (namespace del panel) |

`public/sitemap.xml`: 75 `<loc>` (ES+EN, incl. 10 artículos de blog por idioma, capítulos de guía, y también `/login` y `/pitch`). `public/robots.txt` permite lo público y deniega rutas de panel; lista `/pitch` en `Disallow` aunque el sitemap lo incluye (dato a contrastar al rehacer SEO). `components/landing`: 82 ficheros, 16.325 L.

## B.2 Qué se comparte con el Dashboard y qué se puede separar

**Compartido hoy (misma SPA, `src/App.tsx`):**

- **Proveedores globales** envuelven también lo público: `AuthProvider`, `AgencyProvider`, `PrivacyDemoProvider`, `DepartmentViewProvider`, `AppProvider`, `GoalsProvider`, `NotificationProvider`, `TooltipProvider`, `QueryClient`, `HelmetProvider` (`App.tsx`). Las landings no llaman a esos contextos, pero el arranque y el bundle sí los cargan.
- **UI Shadcn** (`src/components/ui`, 31 piezas; `src/index.css` 404 L, color `--primary` común). Lo público usa al menos accordion, alert-dialog, badge, button, card, dialog, input, label, select, sheet, switch, table, tabs, textarea.
- **i18n único** (`src/i18n/config.ts`): namespaces `landing`, `blog`, `app`, `apiDocs`. Lo público vive sobre todo en `landing` (1.326 hojas) + `homeLiteral` (177, fusionado en `landing.home.literal`) + `blog` (1.316) + `apiDocs` (324). `app.json` (~3.440 hojas) es del panel; el 404 público y el login sí lo usan. Detección: ruta `/en` fuerza inglés en público; el panel respeta `localStorage`.
- **Config de planes**: `publicPricing.ts` alimenta home y `/precios`; `plans.ts` y guards son del Dashboard. Hay que mantener alineados copy público y entitlements (docs/16).
- **Cliente Supabase**, toasts (`lib/notify`), marca (`components/brand`), GTM y Consent Mode (aplican a toda la SPA, `index.html` + `cookieConsent.ts` 139 L). El pie enlaza también a `/soporte` (ruta protegida).
- **Login** usa piezas de agencia (`CurrencySelect`) y el flujo de registro.

**Qué se puede separar con riesgo contenido:** namespaces i18n públicos, componentes de `components/landing`, `src/seo`, `publicPaths`, hooks `useLanding*` / `useBlogPosts` / `usePublicPricingCurrency`, páginas listadas arriba. El CMS admin y el login quedan en el lado panel.

**Riesgos de separar (app pública independiente o split agresivo):** romper hreflang y el cache de paths del blog; desalineación de precios públicos vs plan real; doble carga de GTM/cookies; el pie o la cabecera apuntando a rutas autenticadas; inflar o romper el bundle del Dashboard al extraer providers; el blog público sin el contrato de `blog_posts`. Una separación «suave» (lazy y no montar lógica de panel en rutas públicas) es más segura que un split en dos deploys.

## B.3 Complejidad (piezas que tiran de las horas)

- **Blog y CMS.** Modelo en `docs/15-cms-blog.md`: tabla `blog_posts`, bloques JSONB (11 tipos, Zod en `blockSchema.ts`, DOMPurify en `sanitize.ts`), RLS (público solo `published`), paridad ES/EN (`path_es` / `path_en`), JSON-LD opcional, `visualRegistry` (9 artículos a componente fullPage legado + 16 visuales inline; el post de estimación vive en bloques). Sitemap de posts: `scripts/generate-blog-sitemap.mjs`. Auditoría editorial y editor quedan en admin (fuera de estas horas). En sitemap hay **10 artículos por idioma** (el índice consume Supabase, no `blogPosts.ts`).
- **Guía.** Una página de 965 L, 9 slugs, copy largo en `landing.guide`. Los slugs se reutilizan bajo `/en/guide/:section`.
- **API docs / OpenAPI.** Superficie grande y bilingüe (tablas duplicadas ES/EN, tutoriales, búsqueda). El visor carga Redoc desde CDN. El JSON se regenera en `prebuild`. Hay que no desincronizar la referencia respecto a la API real (eso es contrato con backend, no reescritura de la API).
- **Pitch.** 16 slides + mockups + teclado; pieza de outreach, no del menú principal.
- **SEO.** `src/seo` (233 L): `SeoTags.tsx` (Helmet: title, description, canonical, OG, JSON-LD), `RouteHreflangSync.tsx` + `hreflangPaths.ts`, `CommercialSeoTags.tsx`, `BlogArticleSeo.tsx`. Sitemap 75 URLs + script de blog. **No hay prerender ni SSR en el repo**: el `index.html` deja un OG genérico; las metas finas se inyectan en cliente. El fichero raíz `meta-worker.js` (391 L) **no es un worker de SEO**; es un script de sincronización de anuncios. Conviene no presupuestarlo como meta de buscadores.
- **i18n.** Dos idiomas, ~3.140 hojas de copy público por idioma (suma landing + homeLiteral + blog + apiDocs), más routing y `LanguageSelector`. El volumen está; el trabajo es cablear el diseño nuevo sin romper paridad.
- **Formulario de contacto.** Front → `supabase.functions.invoke('send-contact-email')` → Resend. Rate limit por IP. Sin captcha ni honeypot hoy (se puede proponer al rehacer, con backend).
- **Planes / precios (`docs/16`, junio 2026).** Cinco planes públicos (ids internos distintos del nombre comercial), moneda de cobro en USD y selector de divisa orientativo, precio early vs oficial, asientos, histórico y módulos descritos en producto. Home muestra un subconjunto (`PRICING_HOME_PLAN_IDS`); `/precios` las dos filas de `publicPricingLayout.ts`. Scale y Enterprise van a contacto. Cualquier cambio de cifras o de matriz debe tocar a la vez `publicPricing.ts`, `landing.json` (`pricing.plans.*`) y el criterio de producto del panel.

## B.4 Estimación interna de horas (no va al PDF)

**Supuestos:** stack actual (React, Vite, Tailwind, Shadcn); se rehace la UI pública **dentro del mismo repo/SPA**, sin tocar el Dashboard; el diseño visual llega hecho (fuera de estas horas); el logotipo llega hecho (fuera); se reutiliza el copy ES/EN existente (no hay redacción ni traducción de textos nuevos); las legales solo se rediseñan; el CMS admin no se rehace; login y reset quedan fuera salvo decisión (abajo); el Edge de contacto y la tabla `blog_posts` se conservan; QA funcional y visual de front (ES y EN, escritorio y 375, motion-reduce, formulario, cookies, metas) **va incluido** en las horquillas; no incluye despliegue, DNS, ni trabajo de backend más allá de cablear contratos ya existentes.

| Bloque | Mín. | Máx. |
|---|---:|---:|
| Chrome compartido, i18n de rutas, cookies / Consent Mode, 404 | 20 | 32 |
| Portada (hero, 9 secciones, motion, mocks) | 36 | 56 |
| Landings de producto (6 artículos + PPC + seguridad + «por qué») y demo | 32 | 48 |
| Precios (5 planes, divisa, FAQ, alineación con docs/16) | 12 | 20 |
| Blog público (índice, ficha dinámica, visuales, sitemap de posts) | 32 | 48 |
| Guía (índice + 9 capítulos) | 12 | 18 |
| API docs + visor OpenAPI | 20 | 32 |
| Pitch (16 slides) | 8 | 14 |
| Contacto (front; Edge actual) | 6 | 10 |
| SEO técnico (tags, hreflang, sitemap, robots), sin prerender | 8 | 14 |
| Legales (solo piel) | 3 | 5 |
| QA ES+EN (ya repartido en espíritu en los bloques; esta fila es la pasada transversal) | 14 | 20 |
| Integración cuidadosa en la SPA (lazy, no romper el panel) | 8 | 14 |
| **Total Base (alcance cerrado arriba)** | **211** | **331** |

Horquilla redondeada de comunicación interna: **210-330 h de front**. Una lectura central cae en torno a **260-270 h**.

**Añadidos opcionales (no suman al Base hasta que se decidan):**

- Login + recuperación de contraseña (piel nueva, mismos flujos): **12-18 h**.
- Prerender o capa para crawlers (metas por URL sin ejecutar toda la SPA): **16-28 h**.
- Separación fuerte a un deploy público independiente: **24-40 h**, con los riesgos de B.2.
- Rehacer el CMS admin: fuera de este encargo; si se pidiera, otra estimación (orden de **40-60 h**).


## B.5 Actualización 18/11 (cambio de alcance de Ramón): prerender incluido en Base

- Base con prerender: 211-331 h + 16-28 h = **227-359 h** (centro ~275-290 h; comunicación interna 225-360 h). Login y reset siguen aparte (12-18 h) y el CMS admin queda fuera.
- Rutas que cubre: las 75 URLs de `public/sitemap.xml` salvo `/login` (páginas ES y /en, 10 artículos por idioma, guía con 9 capítulos, API docs y visor OpenAPI, pitch, legales, contacto, precios). No cubre rutas de panel ni `/soporte`.
- Intervención de Andrés: sí en despliegue. Hay que decidir cómo se sirve el HTML generado (hoy es SPA), reglas de rewrite y 404, y un disparador para regenerar los artículos cuando se publique en `blog_posts` (el build lee Supabase). Sus horas las estima él.

## B.6 Horas finales por plan, con prerender (según «Planes de la web» de aportes/fermin.md; internas, no al PDF)

Redacción de textos nuevos fuera de estas horas (no es front). Diseño y logo fuera. Login y reset fuera.

**Base:** 215-341 h (centro ~260-275). Partimos de B.4 + prerender (227-359) y ajustamos al alcance de Fermín: sin pitch (-8/-14), API docs solo adaptación visual (-8/-12), guía con plantilla y contenido actual (-4/-6), y sumamos eventos de medición en front (dataLayer, +8-14), que B.4 no incluía.

**Completo:** 303-491 h (centro ~395-400). Base de B.4 con prerender y medición (235-373) más:

| Añadido | Mín. | Máx. |
|---|---:|---:|
| Sistema de movimiento más elaborado + demo del planificador (arrancar y pausar) en páginas públicas | 16 | 28 |
| 8 landings con tratamiento propio (sobre la plantilla) | 8 | 14 |
| Página nueva «Para quién» | 6 | 10 |
| Guía reescrita y navegación mejorada | 4 | 8 |
| API docs y visor: rediseño | 4 | 8 |
| Adaptación del editor del blog a plantillas nuevas (/admin, solo plantillas) | 12 | 20 |
| Lead magnet ES/EN (página, formulario, descarga) | 8 | 14 |
| Segunda ronda de pruebas + eventos y panel ampliados | 10 | 16 |
| **Añadido total** | **68** | **118** |

## B.7 Horquilla revisada con trabajo asistido por IA (18/11; internas, no al PDF)

Con prerender incluido, sin textos, diseño ni login/reset.
- Base: **120-190 h** (centro ~150). Completo: **165-265 h** (centro ~210).
- Cálculo: ~70 % de las horas de B.4 a B.6 es construcción (maquetar, cablear i18n, tablas de API docs, plantillas), que se acelera ~55 %. ~30 % es QA, revisión de diseño, accesibilidad, pruebas en móvil, prerender e integración en la SPA, que se acelera ~25 %. La demo y el movimiento del Completo se aceleran menos de lo medio.
- Riesgo: la revisión humana de diseño y la corrección tras QA no se comprimen; si el diseño llega tarde o cambia, la horquilla sube hacia el máximo.
