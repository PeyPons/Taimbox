# Taimbox · Aporte de backend y base de datos (Andrés)

Uso interno para Ramón y el equipo. Auditoría del 18/11/2026, entre las 23:20 y las 23:50 (hora de Canarias, UTC+0). Solo lectura: `list_tables` y `SELECT` en el schema `public` del conector supabase-taimbox, más el repo en `investigacion/repo` (sin modificarlo). No he tocado `ops_*` ni el schema `mymonkeyguide`. No he aplicado migraciones, ni INSERT, UPDATE o DELETE. No he contactado a nadie ni he gastado dinero. En este informe solo hay cifras agregadas: ni nombres, ni correos, ni importes, ni filas individuales.

Reparto con Lola (`aportes/lola.md`): ella lleva la maquetación de la web pública. Yo llevo el mapa de datos, lo que la web pública toca en base y funciones, los riesgos de integración y las horas internas de backend. Estas horas no incluyen las suyas y no van al PDF.

Fuentes: `COUNT(*)` y `percentile_cont` sobre `public` (los volúmenes de `list_tables` estaban desactualizados y no se usan); `pg_policies` y privilegios de `anon`/`authenticated`; código en `investigacion/repo` (`src/App.tsx`, `src/pages/ContactoPage.tsx`, `src/pages/Login.tsx`, `src/pages/PreciosPage.tsx`, `src/hooks/useBlogPosts.ts`, `src/lib/blog/client.ts`, `docs/15-cms-blog.md`, `docs/16-planes-suscripcion-precios.md`, `supabase/functions/`).

---

## 0. Interno, no va al PDF

> Nada de este apartado se copia a la propuesta ni a ningún texto que pueda llegar al cliente.

### Horas internas de backend (horquilla)

No son precio. Supuestos, ya cerrados por Ramón (18/11/2026): se rehace solo la web pública, en el mismo producto, sin tocar el Dashboard; el CMS del blog (`blog_posts` y el editor `/admin/blog`) se queda donde está y queda fuera de alcance (la web pública solo sigue leyendo los artículos publicados); el contacto sigue yendo por correo con `send-contact-email`, y el consentimiento y el antispam van dentro del plan; se conservan todas las URLs actuales, también las `/en/` y `/que-es-timeboxing`; Lola cablea el front contra los contratos ya existentes; el alcance legal y el logotipo quedan fuera. Login y reset de contraseña no van en el Base: son una opción aparte, con su propio precio.

| Bloque | Mín. | Máx. |
|---|---:|---:|
| A. Contrato de integración (tablas, funciones, RLS, CORS, variables, sin desplegar) | 4 | 6 |
| B. Lectura pública del blog (paths ES/EN, sitemap, coordinación del precargado para buscadores; el CMS no se toca) | 10 | 16 |
| C. Formulario de contacto (mantener `send-contact-email`; añadir consentimiento, antispam y formato de error; no guarda tickets) | 6 | 10 |
| E. Planes públicos (página de presentación; el cobro sigue en el panel) | 2 | 4 |
| F. Inventario de URLs y redirecciones 1:1 (landings, 10 artículos ES/EN, `/en/`, `/que-es-timeboxing`) | 6 | 10 |
| G. Pruebas de integración backend (blog, contacto, redirecciones) | 6 | 10 |
| H. Endurecimiento menor de la superficie pública (buckets de límite, permisos del rol anónimo) | 4 | 8 |
| **Base (A+B+C+E+F+G+H; sin login ni reset)** | **38** | **64** |
| **Opción, no incluida en el Base: login y reset (mismos flujos; incluye endurecer `check_availability`)** | **+10** | **+16** |

Lectura central del Base: **46-50 h**. La opción de login y reset, si se contrata, suma **10-16 h** (el conjunto quedaría en 48-80 h). El CMS del blog no se migra ni se rehace.

### Hallazgos que no salen del equipo

1. Hay 5 agencias. 2 están `active` con plan `enterprise` y concentran todo el uso operativo. 3 están `suspended` con plan `starter`, sin clientes ni proyectos. Las 5 tienen `subscription_status = active`, pero **ninguna tiene suscripción de cobro guardada**. 2 tienen cliente en la pasarela. No hay tabla de planes ni de suscripciones: el plan vive en `agencies.plan_id`.
2. El cobro (`create-checkout-session`, `create-billing-portal-session`, `stripe-webhook`) se invoca desde el panel (`AgencyBillingTab`), no desde `/precios`. La página pública enlaza a registro o a correo. El alta (`register-agency`) crea agencia con plan `business` y prueba de 14 días, más empleado y `user_agencies`. Eso no coincide del todo con los planes que hoy figuran en la base (starter / enterprise, sin pruebas abiertas).
3. `form_rate_limit_events` guarda 1.972 eventos: 1.960 de recuperación de contraseña (desde el 17/06/2026 hasta el 18/11/2026, muchos hacia las 08:00) y 12 de registro (27/05/2026 a 07/09/2026). **Cero** con prefijo `contact`. Los buckets incluyen correos e IPs. No los transcribo. El rol `anon` no puede leer esa tabla (RLS sin política permisiva; `api_block_*` es restrictiva). Conviene pasar los identificadores a resumen irreversible.
4. Contacto y registro, en el front actual, no piden casilla de consentimiento. Contacto tampoco tiene campo trampa ni Turnstile. Sí hay límite de envíos (contacto: 5 cada 15 min por IP).
5. `check_availability` es una función `SECURITY DEFINER` ejecutable por `anon`. El registro la usa para ver si existen el correo o el nombre de agencia. Eso permite enumerar altas. Hay que endurecerla si se contrata la opción de login y reset.
6. El rol `anon` tiene privilegios amplios (incluso `TRUNCATE`) en casi todas las tablas de `public`. El RLS lo contiene hoy (en `agencies` no hay política de SELECT; el panel lee por funciones). PostgREST no expone `TRUNCATE`, pero los permisos sobran y no deberían ensancharse al rehacer la web.
7. `list_tables` devolvía volúmenes viejos (agencias en 0, asignaciones en 436, etc.). Todas las cifras de este informe salen de `COUNT(*)`.

### Decisiones de Ramón (18/11/2026)

1. Login y reset de contraseña son una **opción aparte**, con su propio precio. No van en el Base (38-64 h). Si se contratan, suman 10-16 h.
2. El CMS del blog se queda en `blog_posts`. Fuera de alcance: no se migra ni se rehace el editor.
3. El contacto sigue por correo con `send-contact-email`. Consentimiento y antispam entran en el plan (fila C).
4. Se conservan todas las URLs, también las `/en/` y `/que-es-timeboxing`.
5. `check_availability` enumerable y los permisos de `anon` se quedan en esta nota interna, no en la parte del PDF.
6. En la parte del PDF no se usan cifras de imputaciones de tiempo como argumento de venta.

---

## A. Para el PDF

Trato de «ustedes». Alcance en lenguaje comercial. Sin horas, tarifas ni cifras internas de uso. En las láminas no se nombran plataformas; en el texto, solo lo justo. Sin críticas a la web actual.

Hemos revisado cómo está organizada la información de la plataforma y qué necesita la web pública para seguir funcionando al rehacerse.

La web que ven quienes llegan sin cuenta se apoya en un conjunto pequeño de piezas, independientes del área de trabajo una vez se entra con usuario:

- **Blog.** Los artículos publicados (hoy, diez en cada idioma) se leen desde el sistema de contenidos ya en uso, que se mantiene como está. Cada uno tiene una dirección propia en español y su equivalente en inglés. Esas direcciones, también las de la versión en inglés, se conservan, junto con el listado para buscadores, para no romper visitas ni enlaces.
- **Contacto.** El formulario seguirá enviando el mensaje al correo de la organización, con un límite de envíos para reducir abusos. En la nueva web se añadirá el consentimiento y una protección frente a envíos automáticos.
- **Planes.** La página de precios presenta los planes y lleva a registro o a una conversación, según el caso. El cobro de una suscripción se gestiona dentro de la cuenta, no en la web pública. Esa separación se mantiene.
- **Alta y acceso.** La nueva web enlazará las pantallas de registro, acceso y recuperación de contraseña que ya existen. Rehacer esas pantallas, manteniendo los mismos flujos, se ofrece como una opción aparte, no va incluida de entrada.

El área de trabajo de cada agencia (clientes, proyectos, planificación, anuncios e informes) no forma parte de este presupuesto. La nueva web no cambia esa base; solo se conecta a lo que la parte pública ya usa.

Se conservan todas las direcciones actuales, también las de la versión en inglés, con redirecciones 1:1 si alguna ruta tuviera que moverse.

---

## B. Interno: mapa, uso, superficie pública y riesgos

### B.1 Mapa del schema `public`

46 tablas, todas con RLS. No hay tablas `plans` ni `subscriptions`. Relaciones principales: `agencies` → `user_agencies`, `employees`, `clients`, `projects`, `allocations`, `time_entries`, `ad_accounts_config`, `api_tokens`. `projects` → `deadlines`. `employees` → `absences`, `weekly_feedback`, `timer_sessions`. `blog_posts` no cuelga de una agencia.

| Tabla | Para qué | Volumen (`COUNT(*)`) |
|---|---|---:|
| `agencies` | Cuenta de agencia, plan y campos de cobro | 5 |
| `user_agencies` | Usuarios ligados a una agencia | 19 |
| `employees` | Personas del equipo | 19 |
| `clients` | Clientes de la agencia | 216 |
| `projects` | Proyectos | 521 |
| `allocations` | Tareas / asignaciones de horas | 17.067 |
| `allocation_notes` | Notas de asignación | 107 |
| `deadlines` | Cierres / plazos por mes y proyecto | 1.709 |
| `time_entries` | Imputaciones de tiempo | 27 |
| `timer_sessions` | Sesiones de cronómetro | 76 |
| `active_timers` | Cronómetro en curso | 1 |
| `absences` | Ausencias | 49 |
| `global_assignments` | Asignaciones globales | 33 |
| `task_transfers` | Traspasos de tarea | 39 |
| `team_events` | Eventos de equipo | 15 |
| `weekly_feedback` | Cierre semanal | 241 |
| `department_config` | Departamentos | 5 |
| `blog_posts` | Artículos del blog público | 10 |
| `form_rate_limit_events` | Límite de envíos (registro, reset, contacto) | 1.972 |
| `support_tickets` / `support_ticket_replies` | Tickets de soporte (no los usa el formulario público) | 0 / 0 |
| `ad_accounts_config` | Cuentas de anuncios | 131 |
| `google_ads_campaigns` / `meta_ads_campaigns` | Campañas | 10.827 / 20.302 |
| `ads_sync_logs` / `meta_sync_logs` | Logs de sincronización | 4.119 / 4.140 |
| `client_settings` | Ajustes por cliente (anuncios) | 70 |
| `audit_logs` | Auditoría de producto | 24.838 |
| `api_tokens` | Tokens de API | 9 |
| `notification_rules` / `notification_deliveries` | Avisos | 1 / 197 |
| `review_jobs` / `review_job_inputs` / `review_job_chunks` / `review_job_events` | Flujo de revisión | 38 / 44 / 43 / 179 |
| `review_skills` / `review_skill_versions` / `review_profiles` | Catálogo de revisión | 12 / 3 / 0 |
| `platform_admins` / `platform_audit_logs` | Administración de plataforma | 1 / 8 |
| Resto sin uso o residual (`professional_goals`, `user_routines`, `google_ads_changes`, `project_editing_locks`, `allocations_duplicate`, etc.) | Varios módulos | 0, salvo `segmentation_rules` (2) |

Todas las filas de clientes, proyectos, asignaciones y empleados tienen `agency_id`. Primera agencia: 02/01/2026. Última asignación escrita: 18/11/2026, 12:09 (hora de Canarias).

### B.2 Cómo usa la plataforma una agencia real

n = 5 es bajo: los percentiles del total salen muy tirados hacia cero. El uso real está en las 2 agencias activas. Con n = 2, p10 y p90 se acercan a los dos extremos. No se listan valores por agencia.

**Estado y plan**

- 2 agencias `active`, plan `enterprise`, con clientes, proyectos, asignaciones y cierre semanal. Las 2 tienen cliente en la pasarela; 0 tienen suscripción guardada.
- 3 agencias `suspended`, plan `starter`, sin clientes ni proyectos.
- Usuarios por agencia (sin impersonación; hay 0 filas de impersonación): las 19 de `user_agencies` coinciden con los 19 empleados, todos con usuario.

**Percentiles (p10 / p50 / p90)**

| Métrica | 5 agencias | 2 agencias con clientes (igual que las `active`) |
|---|---|---|
| Usuarios (`user_agencies`) | 1 / 1 / 9 | 4 / 8 / 12 |
| Empleados | 1 / 1 / 9 | 4 / 8 / 12 |
| Clientes | 0 / 0 / 129 | 22 / 108 / 194 |
| Proyectos | 0 / 0 / 312 | 53 / 261 / 468 |
| Asignaciones | 0 / 0 / 10.237 | 1.718 / 8.534 / 15.349 |
| Imputaciones (`time_entries`) | 0 / 0 / 15 | 7 / 14 / 20 |
| Sesiones de cronómetro | 0 / 0 / 41 | 27 / 38 / 49 |
| Deadlines | 0 / 0 / 1.025 | 172 / 855 / 1.537 |
| Cuentas de anuncios | 0 / 0 / 79 | 13 / 66 / 118 |

**Uso por módulo (de las 5; entre paréntesis, de las 2 activas)**

- Planificación y tareas: 2 de 5, con mucho volumen (17.067 asignaciones, 1.709 deadlines). Sigue habiendo escrituras en noviembre de 2026.
- Clientes y proyectos: 2 de 5 (216 clientes, 521 proyectos; 457 proyectos `active`, 40 `completed`, 24 `archived`).
- Tiempos: 2 de 5, con uso bajo (27 imputaciones y 76 sesiones, última el 27/08/2026). Hay 1 cronómetro activo.
- Equipo: 19 empleados (14 activos, 5 inactivos); ausencias en 1 agencia; cierre semanal en las 2 activas (241 filas). OKR (`professional_goals`): 0. Rutinas: 0.
- Anuncios: 1 de 5 con tokens y 131 cuentas (93 Google, 38 Meta, todas marcadas activas). Campañas y logs son el mayor volumen de la base.
- API: 2 de 5 tienen tokens (9 en total).
- Tickets de soporte: 0 agencias, 0 filas.
- Blog: 10 artículos `published` (10/03/2026 a 25/05/2026), independientes de la agencia.
- Revisión (`review_*`): hay jobs acumulados, sin uso ligado a la web pública.

Lectura interna (no va al PDF): una agencia que usa el producto de verdad planifica y cierra trabajo con un volumen alto y tiene un equipo de un dígito o poco más. El módulo de anuncios aparece concentrado. La web pública no refleja ese volumen: su carga real es el blog y el contacto; el alta solo si se contrata la opción.

### B.3 Qué toca la web pública

Confirmado en el repo, no es un supuesto. El Dashboard queda fuera. El CMS del blog no se toca. Login y reset no van en el Base: son una opción aparte (fila de +10 a 16 h).

| Pieza pública | Tablas | Funciones / RPC | Qué hay que mantener o adaptar |
|---|---|---|---|
| Blog (`/blog`, `/blog/:slug`, espejo `/en/blog/...`) | `blog_posts` (SELECT de `published` por `path_es` / `path_en`) | Ninguna Edge. Cliente en `src/lib/blog/client.ts`. Sitemap: `scripts/generate-blog-sitemap.mjs`. Precarga de metas: `meta-worker.js`. | El CMS (`blog_posts` y `/admin/blog`) se queda como está, fuera de alcance. La web pública sigue leyendo lo `published`. Conservar las 10+10 rutas (también `/en/`) y el sitemap. `src/data/blogPosts.ts` es legado. |
| Contacto (`/contacto`, `/en/contact`) | Escribe `form_rate_limit_events` (prefijo `contact:ip:`) vía service role. No escribe `support_tickets`. | `send-contact-email` (correo, límite 5 / 15 min por IP). | Se mantiene `send-contact-email` (solo correo, sin tickets). Consentimiento y antispam van en el plan. Hoy no hay eventos `contact` en la tabla de límite. |
| Planes (`/precios`, `/en/pricing`) | Ninguna | Ninguna | Textos y precios salen de `src/config/publicPricing.ts`. Los CTA van a registro o a correo. No invoca el cobro. Hay que alinear IDs de plan con `docs/16` y con `agencies.plan_id`. |
| Registro (`/login?tab=register`) | `agencies`, `employees`, `user_agencies`, `form_rate_limit_events` | `register-agency`; RPC `check_availability` (anon) | Opción no incluida en el Base. Prueba 14 días, plan inicial `business`, correo de bienvenida. |
| Acceso y reset (`/login`, `/reset-password`) | `form_rate_limit_events` (reset) | `signInWithPassword`; `request-password-reset` | Opción no incluida en el Base, junto con el registro. El volumen de reset (1.960) parece tráfico automático además de uso real. |
| Cobro | Campos de plan en `agencies` | `create-checkout-session`, `create-billing-portal-session`, `stripe-webhook` | Fuera de la web pública (panel). No romper webhooks ni IDs de plan al rehacer `/precios`. |

**RLS que afecta a la web pública** (`pg_policies`, schema `public`):

- `blog_posts_select` (rol `public`, SELECT, permisiva): `status = 'published' OR is_platform_admin()`. Alta, edición y borrado, solo administradores de plataforma.
- `api_block_blog_posts` y el resto de `api_block_*`: restrictivas, para que un token de API no pase por estas tablas.
- `form_rate_limit_events`, `support_tickets` y `agencies`: el rol anónimo no tiene política permisiva, así que no lee ni escribe directo. Las Edge usan la clave de servicio.
- `user_agencies_select`: `user_id = uid()` (solo usuario autenticado, su propia fila).

**RPC callable desde el front público:** `check_availability`. Otras funciones ejecutables por `anon` (`user_agency_ids`, `is_api_token`, etc.) son de apoyo al RLS, no las llama la landing.

Rutas de blog a conservar (todas `published`, con `path_es` y `path_en`, cuerpo en bloques; fechas 10/03/2026 a 25/05/2026):

- `/blog/que-es-timeboxing` ↔ `/en/blog/what-is-timeboxing`
- `/blog/ley-parkinson` ↔ `/en/blog/parkinsons-law`
- `/blog/planificacion-proyectos-cronograma-recursos` ↔ `/en/blog/project-planning-schedule-resources`
- `/blog/kpis-agencias-marketing-2026` ↔ `/en/blog/marketing-agency-kpis-2026`
- `/blog/plantilla-planificacion-recursos-agencia` ↔ `/en/blog/agency-resource-planning-template`
- `/blog/como-medir-rentabilidad-proyecto-agencia-dejar-vender-horas` ↔ `/en/blog/measure-project-profitability-stop-selling-hours`
- `/blog/por-que-tu-agencia-pierde-rentabilidad-equipo-ocupado` ↔ `/en/blog/why-agency-loses-profitability-busy-team`
- `/blog/gestion-carga-trabajo-equipo-sin-burnout` ↔ `/en/blog/workload-management-without-burnout`
- `/blog/capacidad-calendario-vs-capacidad-productiva-equipo` ↔ `/en/blog/calendar-capacity-vs-shippable-team-capacity`
- `/blog/estimacion-proyectos-agencia-como-acertar` ↔ `/en/blog/agency-project-estimation-how-to-get-it-right`

Ya existe la redirección `/que-es-timeboxing` → `/blog/que-es-timeboxing`. Las rutas van sin barra final.

### B.4 Riesgos y coste de integración

**Cobro y planes.** Bajo en la web pública, porque el checkout no está ahí. El riesgo es de alineación: IDs internos (`starter`, `pro`, `business`, `scale`, `enterprise`), CTAs de `/precios` y el alta con prueba de 14 días. Hoy no hay suscripciones guardadas; el webhook y el portal deben seguir igual para el panel.

**Formularios.** Medio. El contacto sigue por correo con `send-contact-email` y no escribe tickets. En el plan: casilla de privacidad, campo trampa, Turnstile, límite de envíos (ya existe) y respuesta JSON estable para que Lola pinte errores. Si se contrata la opción de login y reset, hay que conservar el límite por IP y por correo, y endurecer `check_availability` (solo en esta nota interna; no va al PDF).

**Blog / CMS.** Cerrado: el CMS se queda en `blog_posts` y queda fuera de alcance. No hay migración a un CMS en Git ni se rehace el editor. El riesgo se limita a que la web pública siga leyendo bien lo publicado y conserve las URLs, también las `/en/`.

**SEO y 301.** Cerrado: se conservan todas las URLs, también las `/en/`, las 10+10 del blog y `/que-es-timeboxing`. El trabajo es inventariarlas, dejar redirecciones 1:1 si algo se mueve y regenerar el sitemap. Si la nueva web no es la misma SPA, hay que reasignar o sustituir `meta-worker.js` para que los buscadores vean título y descripción por URL.

**Exposición de datos.** Medio, contenido hoy por RLS. No ensanchar permisos del rol anónimo. No abrir SELECT de `agencies` ni de `form_rate_limit_events`. No devolver identificadores en claro en los límites. El blog público, por diseño, expone solo lo `published`.

---

Confirmación de método: solo `list_tables` y `SELECT` (más consultas a `pg_policies` e `information_schema` / catálogo) en schema `public`. Cero escrituras.
