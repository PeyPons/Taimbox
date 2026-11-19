# Taimbox · SEO de contenido (web pública)

Aporte de Carmen para Rosario. 18 de noviembre de 2026, hora de Canarias. Web pública ES y EN; el Dashboard queda fuera. Rosario confirma el tuteo en los textos de la web (`landing.json`: «tu equipo» aparece y «ustedes» no). En este documento y en el PDF, ustedes. Tráfico: pendiente de confirmar en GSC. Se conservan las URL de Rosario §1. `/guia` queda como índice-hub. `/para-quien` entra solo en Completo, a confirmar con ustedes, porque añade una URL a las 75. El Anexo A recoge title, meta y H1 del resto de esas 75, en Base, una versión por URL.

El repo no documenta píxeles de SERP (lo de `docs/15-cms-blog.md` es el aspecto de las cards). Criterio orientativo: title 35-60 caracteres, consulta al inicio y marca al final; meta de hasta 155, con beneficio, un dato y un cierre. Recuento entre paréntesis en el §1; en el anexo, medido en caracteres y comprobado.

## 1. Titles, metas, H1 y FAQ

En `landing.json` hay titles para «empresas», metas fuera de rango (rentabilidad ES, 182), giros tipo «Descubre», «Empodera», «definitiva» o «al céntimo», y un CRM en integraciones por confirmar (`carmen.md` §4.6). Solo tienen FAQ la home, `/precios` y `/seguridad`. En precios: «nunca borraremos tus datos» y early adopter «de por vida» (99 $/249 $), por confirmar (`carmen.md` §4.2 y §4.5). El H1 EN dice lo mismo que el ES, sin calco.

| URL | Title ES | Title EN | H1 ES |
|---|---|---|---|
| `/` | Planificación de recursos y margen para agencias \| Taimbox (58) | Resource planning and margin for agencies \| Taimbox (51) | La carga, los plazos y el margen, en un mismo sistema |
| `/por-que-timeboxing` | Qué es el timeboxing y cómo usarlo en tu agencia \| Taimbox (58) | What timeboxing is and how agencies use it \| Taimbox (52) | El tiempo se fija de antemano y se ata a un coste |
| `/planificador-recursos` | Planificador de recursos y capacidad para agencias \| Taimbox (60) | Resource and capacity planner for agencies \| Taimbox (52) | Ves quién hace qué, cuándo, y el impacto de cada asignación |
| `/reportes-rentabilidad` | Rentabilidad por proyecto y margen en tu agencia \| Taimbox (58) | Per-project profitability for your agency \| Taimbox (51) | Coste, ingreso y margen de cada proyecto, con la fórmula a la vista |
| `/control-proyectos` | Control de proyectos y deadlines para agencias \| Taimbox (56) | Project control and deadlines for agencies \| Taimbox (52) | Del briefing al plazo, con avisos cuando el plan no cuadra |
| `/gestion-equipos` | Gestión de capacidad y equipos para agencias \| Taimbox (54) | Team and capacity management for agencies \| Taimbox (51) | Horarios, ausencias y capacidad real en un mismo sitio |
| `/dashboard-empleado` | Panel del empleado, tiempo y cierre semanal \| Taimbox (53) | Employee dashboard: tasks, time and weekly close \| Taimbox (58) | Qué tienes hoy, cuánto tiempo llevas y cómo cierras la semana |
| `/integraciones` | Integraciones: Google Ads, Meta Ads y API \| Taimbox (51) | Integrations: Google Ads, Meta Ads and API \| Taimbox (52) | Google Ads y Meta en solo lectura, API REST y exportaciones |
| `/monitor-ppc` | Monitor de presupuestos PPC de tus clientes \| Taimbox (53) | PPC budget monitor for agency client spend \| Taimbox (52) | El gasto de Google Ads y Meta, unificado, en los planes que lo incluyen |
| `/seguridad` | Dónde se guardan y cómo se aíslan tus datos \| Taimbox (53) | Where your data is stored and how it is isolated \| Taimbox (58) | Dónde están los datos, cómo se aíslan por agencia y qué hace cada tercero |
| `/precios` | Compara planes Free, Team, Agency y Scale \| Taimbox (51) | Compare Free, Team, Agency and Scale plans \| Taimbox (52) | Empiezas gratis y subes de plan cuando necesitas forecast, API o Ads |

Metas (143-155 caracteres): retoman el H1, añaden un dato y un CTA (plan Free, ver API, comparar planes o contacto), sin CRM ni cifras no confirmadas. Patrón, home ES (148): Ve la carga de tu equipo, los plazos y el margen de cada proyecto en un mismo sistema. Empieza gratis con el plan Free y compara el resto de planes. EN (144): See team workload, deadlines and per-project margin in one system. Start free with the Free plan and compare the other plans side by side. Resto ES/EN: timeboxing, método atado a un coste y CTA al planificador (145/148); planificador, impacto antes de guardar (153/146); rentabilidad, fórmula a la vista (144/152); proyectos, aviso si el plan no cuadra (145/145); equipos, capacidad con festivos y bajas (153/152); empleado, cierre semanal sin microgestión (147/151); integraciones, Ads en solo lectura, API y exports, sin CRM (149/146); PPC, gasto unificado en los planes que lo incluyen (154/146); seguridad, aislamiento por agencia y terceros, solo con hechos contrastados (143/147); precios, Free y subida a forecast, API o Ads, Enterprise a medida (153/155).

**FAQ.** Home: qué es Taimbox (carga, plazos y margen en un mismo sistema); si hay plan Free (sí, con los límites que se confirmen); si hay que instalar algo (no, se usa en el navegador); datos (detalle en `/seguridad`). Precios: cambio de plan desde Configuración, con prorrateo; tope de personas, aviso y solo lectura hasta ajustar; early adopter y prueba de 14 días del plan Agency, a redactar cuando Alexander confirme condición y cifras. Resto de landings: tres preguntas (qué hace, para quién, en qué plan) para el `FAQPage` del plan SEO completo. Seguridad no reiterará cifrado, región, DPO ni normas hasta contrastarlos (`carmen.md` §4.9).

## 2. Diez artículos

Siete reescrituras y tres nuevas (`carmen.md` §2.3), ES y EN. Parkinson y planificación de proyectos se revisan en Completo, sin sumar un tema. El décimo artículo del sitemap, `/blog/estimacion-proyectos-agencia-como-acertar` (par EN `/en/blog/agency-project-estimation-how-to-get-it-right`), entra en Completo. Primero hay que comprobar de dónde sale: está en `public/sitemap.xml` y no en `blogPosts.ts` ni en el mapa estático de `publicPaths.ts`. Hay un seed en `scripts/blog-seed/estimacion-proyectos-agencia-cms.json` (estado `published`); no se ha consultado la base. Los titles del Anexo A de esa URL se basan en ese seed, sin fórmulas del tipo «siempre fallan».

1. Timeboxing en una agencia · informacional · timeboxing · `/por-que-timeboxing` · `/guia/planificador`
2. Un equipo ocupado puede no ser rentable · informacional · rentabilidad · `/reportes-rentabilidad` · `/guia/informes`
3. Medir la rentabilidad por proyecto · investigación comercial · rentabilidad · `/reportes-rentabilidad` · `/guia/informes`
4. Capacidad calendario frente a productiva · informacional · planificador y equipos · `/planificador-recursos` · `/guia/equipo`
5. KPIs semanales de una agencia de marketing · informacional · rentabilidad · `/reportes-rentabilidad` · `/guia/informes`
6. Gestionar la carga del equipo · informacional · equipos · `/gestion-equipos` · `/guia/planificador`
7. Plantilla de planificación de recursos · recurso · planificador · `/planificador-recursos` · `/guia/planificador`
8. Cierre semanal y forecast (nueva) · informacional · planificador · `/reportes-rentabilidad` · `/guia/weekly-forecast`
9. Vigilar el presupuesto de Google Ads y Meta (nueva) · informacional · PPC e integraciones · `/monitor-ppc` · `/guia/configuracion`
10. Criterios para elegir un planificador (nueva, sin ranking) · investigación comercial · planificador · `/planificador-recursos` · `/guia/planificador`

## 3. Enlazado

Landing → su guía + 1 o 2 artículos del cluster. Artículo → landing y guía, en el cuerpo. `/guia` → secciones, blog, plantilla y API. Home → precios, planificador, rentabilidad y guía. `/precios` → forecast, API y Ads. Integraciones → PPC y `/api-docs`. Blog por cluster, no solo en el pie (Rosario §2, completo). Anclas: «Ver la guía del planificador»; «Cómo se calcula el margen»; «Capacidad real del equipo»; «Cierre semanal y Weekly Forecast»; «Google Ads y Meta en solo lectura»; «Qué ve cada persona en su panel»; «Comparar planes». Espejo `/en` según `publicPaths.ts`.

## 4. Paridad ES/EN de la guía

`docs/10` §11.2: títulos del índice en i18n; cuerpo «en `CONTENT_MAP` (principalmente en español)»; slugs de las nueve secciones en español. En la copia local el cuerpo ya está en i18n (`guide.content.*`): 238 claves por idioma, unos 2.180 palabras en ES y unas 2.140 en EN, sin cadenas en español en el locale EN. Ese punto del doc 10 está desactualizado. Falta: las URL EN conservan el slug ES (`/en/guide/planificador`, `/en/guide/mi-espacio`, vía `pathEsToEn`); si ustedes quieren slugs en inglés, los 301 de un solo salto van en el plan SEO completo (Rosario §2). Falta la pasada editorial de equivalencia, en la reescritura de la guía del Completo. Sin JavaScript ni base de datos.

## 5. Calendario de apoyo (12 semanas)

Sin prometer posiciones ni clics. Rosario §4: Esencial, 2 piezas al mes de hasta 1.200 palabras; Crecimiento, 4 al mes, con el Completo. Los diez de lanzamiento se estiman en 1.500 por idioma (`carmen.md` §3); las piezas mensuales, en 1.200. Una pieza bilingüe cuenta como una. Mes 1: on-page y artículos 1-4. Mes 2: artículos 5-8 y guía. Mes 3: artículos 9-10, cierre de guía, piezas legacy y medición pendiente de GSC. Con Base y Esencial: on-page Base y cuatro piezas (timeboxing, rentabilidad, capacidad y plantilla).

## 6. Estimación Base y Completo

Sigue `carmen.md` §3, sin tarifas. **Base (aprox. 13.800 palabras, ES y EN):** chrome, home, precios con FAQ, contacto, por qué timeboxing, planificador, rentabilidad, proyectos y seguridad de lanzamiento, con titles, metas y H1. El Anexo A añade title, meta y H1 del resto de las 75 URL (una versión por URL, sin reescribir el cuerpo). Quedan para más adelante, en texto, empleado, equipos, integraciones, PPC, guía y blog. **Completo (aprox. 73.400, incluye el Base):** esos cuerpos; «para quién» (a confirmar con ustedes); guía (unos 9.000); lead magnet; índice del blog, los diez artículos del §2 y, tras comprobar su origen, la reescritura de `/blog/estimacion-proyectos-agencia-como-acertar` (unos 30.000 en el bloque de blog); pitch; pasada de `/api-docs`; enlazado y calendario. El inglés de artículos y lead magnet puede ir en un segundo envío.

## 7. Fuentes

`aportes/rosario.md` (§1 y §2), `aportes/carmen.md`, `brief.md`, `ENCARGO-EQUIPO.md`, `investigacion/ALCANCE-PUBLICO-vs-DASHBOARD.md`; repo local: `src/locales/es` y `en` (`landing.json`, `homeLiteral.json`, `blog.json`, `app.json`, `apiDocs.json`), `publicPaths.ts`, `blogPosts.ts`, `GuiaPage.tsx`, `src/components/landing`, `scripts/blog-seed/estimacion-proyectos-agencia-cms.json`, `docs/10` §11.2, `docs/15-cms-blog.md`, `public/sitemap.xml`, `public/robots.txt`. Sin base de datos ni Search Console.

## Anexo A: titles, metas y H1 del resto de URL (Base)

Fuera del cuerpo. Cubre las 53 URL del sitemap que no están en el cuadro de 11 del §1 ni en sus 11 pares EN (75 menos 22). Una versión por URL. Tuteo. Titles 35-60 caracteres y metas de hasta 155, medidos en caracteres. Textos basados en el contenido del repo (`blog.json`, `blogPosts.ts`, `landing.json` guía y estáticas, `apiDocs.json`, `app.json` y, en la URL de estimación, el seed citado). Sin funciones, cifras ni precios inventados, y sin superlativos. El H1 del artículo de KPIs sigue las 5 métricas del cuerpo, no el `seoTitle` actual que habla de 15.

Notas en la columna URL, en cursiva:
- `/pitch` y `/en/pitch`: el repo ya pone `robots="noindex, nofollow"` (`PresentationPage.tsx`) y `robots.txt` las bloquea, aunque siguen en el sitemap (desajuste que señala Rosario §1). Noindex a decidir por Rosario. Metas sin cifras de resultado (`carmen.md` §4.8).
- `/login`: está en el sitemap y `robots.txt` la bloquea; la página no lleva `SeoTags`. Noindex a decidir por Rosario. No hay ruta `/en/login` en `App.tsx`.
- `/blog/estimacion-proyectos-agencia-como-acertar` y su par EN: Completo; primero comprobar el origen (véase §2).

### ES (27 URL)

| URL | Title | Meta | H1 |
|---|---|---|---|
| `/blog` | Blog: plantillas, KPIs y planificación \| Taimbox | Guías de planificación, timeboxing y recursos para agencias: plantillas, KPIs y marcos de trabajo, filtrados por tema. | Guías de planificación y recursos para agencias |
| `/blog/estimacion-proyectos-agencia-como-acertar` *Completo; comprobar origen* | Estimación de proyectos en tu agencia \| Taimbox | Esfuerzo frente a duración, buffers, tipos de fee y un ritual en cinco pasos antes de prometer una fecha en un proyecto de agencia. | Cómo estimar proyectos en una agencia y acertar más |
| `/blog/capacidad-calendario-vs-capacidad-productiva-equipo` | Capacidad calendario y capacidad útil \| Taimbox | Cómo distinguir horas visibles de capacidad útil: señales, una lista semanal y reglas para no prometer fechas con un calendario engañoso. | Capacidad calendario frente a capacidad productiva |
| `/blog/por-que-tu-agencia-pierde-rentabilidad-equipo-ocupado` | Por qué un equipo ocupado no es rentable \| Taimbox | Ocupación alta y margen no siempre van juntos. Utilización, cambios de contexto, horas no facturables y señales para mirar el margen de tu agencia. | Por qué tu agencia pierde margen con el equipo ocupado |
| `/blog/como-medir-rentabilidad-proyecto-agencia-dejar-vender-horas` | Rentabilidad real por proyecto en agencia \| Taimbox | Modelos de precio, margen bruto por proyecto y un protocolo de alcance en tres pasos para ver el coste y el margen de cada trabajo. | Cómo medir la rentabilidad por proyecto en tu agencia |
| `/blog/gestion-carga-trabajo-equipo-sin-burnout` | Carga de trabajo del equipo sin burnout \| Taimbox | Señales de sobrecarga, un marco en seis pasos y métricas de utilización, plazos y criticidad para repartir el trabajo del equipo con límites claros. | Cómo gestionar la carga de trabajo de tu equipo |
| `/blog/plantilla-planificacion-recursos-agencia` | Plantilla gratuita de recursos para agencias \| Taimbox | Plantilla en Excel o Google Sheets, con cinco hojas (instrucciones, equipo, proyectos, asignación semanal e insights) para capacidad, utilización y margen. | Plantilla gratuita de planificación de recursos para agencias |
| `/blog/kpis-agencias-marketing-2026` | 5 KPIs para agencias de marketing en 2026 \| Taimbox | Utilización, rentabilidad y ritmo, estimación frente a real, capacidad por departamento y OKR: qué mide cada cifra y qué decisión permite. | KPIs para agencias de marketing: 5 métricas para 2026 |
| `/blog/planificacion-proyectos-cronograma-recursos` | Planificar proyectos, plazos y recursos \| Taimbox | Cómo alinear cronograma, presupuesto y capacidad del equipo: fases, un diagrama de Gantt y cifras para seguir el avance del proyecto. | Planificación de proyectos: cronograma, presupuesto y recursos |
| `/blog/ley-parkinson` | Ley de Parkinson en el trabajo de agencia \| Taimbox | El trabajo tiende a llenar el tiempo que le das. Origen, la trivialidad en las reuniones y antídotos con plazos y timeboxing. | Ley de Parkinson: qué es, ejemplos y cómo acotarla |
| `/blog/que-es-timeboxing` | Timeboxing: qué es y cómo aplicarlo \| Taimbox | El timeboxing fija un bloque de tiempo a una tarea. Diferencias con el time blocking, bloques rígidos o flexibles, y cómo llevarlo a tu equipo. | Qué es el timeboxing y cómo llevarlo a tu equipo |
| `/guia` | Guía de funciones: planificador y más \| Taimbox | Cómo usar el planificador, Mi espacio, deadlines, informes, Weekly Forecast, equipo, tiempos, clientes y la configuración de tu agencia. | Guía de Taimbox |
| `/guia/planificador` | Planificador: calendario del equipo \| Taimbox | Vista central del mes: qué tarea tiene cada persona en cada semana, colores por proyecto y avisos de sobrecarga. Vistas semanal y mensual. | Planificador |
| `/guia/mi-espacio` | Mi espacio: tu panel de trabajo \| Taimbox | Tu panel personal en Taimbox: carga, proyectos, control de planificación y dependencias del día o de la semana. | Mi espacio |
| `/guia/deadlines` | Deadlines: objetivos de horas al mes \| Taimbox | Objetivos de horas por mes, por proyecto y por persona, para comparar lo previsto, lo planificado y lo computado. | Deadlines |
| `/guia/informes` | Informes de seguimiento y margen \| Taimbox | Informes de seguimiento operativo, rentabilidad y capacidad del equipo, con datos históricos y exportación por API. | Informes |
| `/guia/weekly-forecast` | Weekly Forecast y cierre semanal \| Taimbox | Previsión y cierre de equipo: resumen por persona, ajustes y redistribución de horas. Se distingue de la revisión personal Weekly en Mi espacio. | Weekly Forecast |
| `/guia/equipo` | Equipo: personas, horarios y bajas \| Taimbox | Alta y edición de miembros, horarios, ausencias y capacidad. También Team Capacity y Team Pulse, si tu agencia los tiene activos. | Equipo |
| `/guia/tiempos` | Tiempos: cronómetro por tarea \| Taimbox | Registra las horas reales de cada tarea con un cronómetro. Ves en qué está el equipo y puedes parar el tuyo desde la barra lateral o Tiempos. | Tiempos |
| `/guia/clientes-proyectos` | Clientes, proyectos y horas \| Taimbox | Catálogo de cuentas y proyectos: presupuestos de horas, cuotas mensuales, estado y avance frente al presupuesto. | Clientes y proyectos |
| `/guia/configuracion` | Configuración de la agencia y roles \| Taimbox | Roles, permisos, módulos activos e integraciones de tu agencia. Desde aquí también se gestionan los tokens de la API. | Configuración |
| `/api-docs` | API de integración para tu agencia \| Taimbox | Cómo conectar tus herramientas con los datos de planificación, equipo y proyectos. Autenticación por token, límites por agencia y referencia de recursos. | API de integración |
| `/contacto` | Contacto para dudas y soporte \| Taimbox | Escríbenos por el formulario o a hello@taimbox.com. Si ya eres cliente, usa el panel de Soporte en tu área de Agencia. | ¿En qué podemos ayudarte? |
| `/privacidad` | Política de privacidad y datos \| Taimbox | Qué datos recopilamos en Taimbox, para qué los usamos y tus derechos según el RGPD. Contacto: hello@taimbox.com. Actualizado el 2 de marzo de 2026. | Política de privacidad |
| `/condiciones` | Condiciones de uso del servicio \| Taimbox | Condiciones que rigen el uso de Taimbox por agencias y profesionales. Al crear una cuenta, aceptas estos términos. Actualizado el 2 de marzo de 2026. | Condiciones del servicio |
| `/pitch` *noindex a decidir por Rosario* | Presentación para agencias \| Taimbox | Presentación de Taimbox para una conversación comercial: timeboxing, planificación de recursos y seguimiento del presupuesto. | Presentación Taimbox |
| `/login` *noindex a decidir por Rosario* | Entrar en tu cuenta de la agencia \| Taimbox | Entra en Taimbox con tu email y contraseña, o crea una cuenta para tu agencia. | Acceder |

### EN (26 URL)

| URL | Title | Meta | H1 |
|---|---|---|---|
| `/en/blog` | Agency planning guides and templates \| Taimbox | Practical guides on project planning, timeboxing and resource management for agencies. Templates, KPIs and frameworks, filtered by topic. | Guides and resources for agencies |
| `/en/blog/agency-project-estimation-how-to-get-it-right` *Completo; comprobar origen* | Agency project estimation: effort and fees \| Taimbox | Effort versus duration, buffers, fee types and a five-step ritual before you promise a date on an agency project. | How to estimate agency projects more accurately |
| `/en/blog/calendar-capacity-vs-shippable-team-capacity` | Calendar capacity versus useful capacity \| Taimbox | How to separate visible hours from useful capacity: signals, a weekly checklist and rules that avoid promising dates from a misleading calendar. | Calendar capacity versus productive capacity |
| `/en/blog/why-agency-loses-profitability-busy-team` | A busy team can still miss the margin \| Taimbox | High utilization and margin do not always move together. Utilization, context switching, non-billable hours and signals to review your agency margin. | Why your agency loses margin when the team is busy |
| `/en/blog/measure-project-profitability-stop-selling-hours` | Per-project profitability in an agency \| Taimbox | Pricing models, gross margin per project and a three-step scope protocol to see the cost and margin of each piece of work. | How to measure profitability per project in your agency |
| `/en/blog/workload-management-without-burnout` | Team workload management without burnout \| Taimbox | Overload signals, a six-step framework and metrics for utilization, deadlines and criticality, so work is shared with clear limits. | How to manage your team's workload |
| `/en/blog/agency-resource-planning-template` | Free resource planning template for agencies \| Taimbox | An Excel or Google Sheets template with five tabs (instructions, team, projects, weekly allocation and insights) for capacity, utilization and margin. | Free resource planning template for agencies |
| `/en/blog/marketing-agency-kpis-2026` | 5 marketing agency KPIs for 2026 \| Taimbox | Utilization, profitability and pacing, estimate versus actual, capacity by department and OKRs: what each figure measures and which decision it supports. | Marketing agency KPIs: 5 metrics for 2026 |
| `/en/blog/project-planning-schedule-resources` | Project planning, schedule and resources \| Taimbox | How to align schedule, budget and team capacity: phases, a Gantt view and figures to track project progress. | Project planning: schedule, budget and resources |
| `/en/blog/parkinsons-law` | Parkinson's law in agency work \| Taimbox | Work tends to fill the time you give it. Origin, triviality in meetings, and antidotes with deadlines and timeboxing. | Parkinson's law: what it is, examples and how to cap it |
| `/en/blog/what-is-timeboxing` | What timeboxing is, with examples \| Taimbox | Timeboxing gives a task a fixed time box. See how it differs from time blocking, when to use a hard or soft box, and how to bring it to your team. | What timeboxing is and how to roll it out in your team |
| `/en/guide` | Feature guide: planner, reports and team \| Taimbox | How to use the planner, My space, deadlines, reports, Weekly Forecast, team, time tracking, clients and your agency settings. | Taimbox guide |
| `/en/guide/planificador` | Planner: the team calendar \| Taimbox | The central monthly view: which task each person has in each week, color by project and overload alerts. Weekly and monthly views. | Planner |
| `/en/guide/mi-espacio` | My space: your work dashboard \| Taimbox | Your personal Taimbox dashboard: workload, projects, planning control and dependencies for the day or the week. | My space |
| `/en/guide/deadlines` | Deadlines: monthly hour targets \| Taimbox | Hour targets per month, project and person, so you can compare what was expected, what was planned and what was logged. | Deadlines |
| `/en/guide/informes` | Reports for delivery and margin \| Taimbox | Operational follow-up, profitability and team capacity reports, with historical data and export through the API. | Reports |
| `/en/guide/weekly-forecast` | Weekly Forecast and weekly close \| Taimbox | Team forecast and close: per-person summary, adjustments and hour redistribution. Distinct from the personal Weekly review in My space. | Weekly Forecast |
| `/en/guide/equipo` | Team: people, schedules and leave \| Taimbox | Add and edit members, schedules, absences and capacity. Team Capacity and Team Pulse appear if your agency has them on. | Team |
| `/en/guide/tiempos` | Time tracking: per-task timer \| Taimbox | Log real hours on each task with a timer. See what the team is working on and stop your own timer from the sidebar or the Time page. | Time |
| `/en/guide/clientes-proyectos` | Clients, projects and contracted hours \| Taimbox | A catalog of accounts and projects: hour budgets, monthly fees, status and progress against the budget. | Clients and projects |
| `/en/guide/configuracion` | Agency settings, roles and API \| Taimbox | Roles, permissions, active modules and integrations for your agency. API tokens are also managed from here. | Settings |
| `/en/api-docs` | Integration API documentation \| Taimbox | How to connect your tools to planning, team and project data. Token authentication, per-agency limits and a resource reference. | Integration API |
| `/en/contact` | Contact for questions and support \| Taimbox | Write to us with the form or at hello@taimbox.com. If you are already a customer, use the Support panel in your Agency area. | How can we help you? |
| `/en/privacy` | How we handle your personal data \| Taimbox | What data we collect in Taimbox, what we use it for and your rights under the GDPR. Contact: hello@taimbox.com. Last updated March 2, 2026. | Privacy policy |
| `/en/terms` | Terms of use of the service \| Taimbox | Terms that govern the use of Taimbox by agencies and professionals. By creating an account, you accept these terms. Last updated March 2, 2026. | Terms of service |
| `/en/pitch` *noindex a decidir por Rosario* | Product presentation for agencies \| Taimbox | A short Taimbox presentation for a commercial conversation: timeboxing, resource planning and budget follow-up. | Taimbox presentation |

### Fuera de las 75 (no entran en el recuento)

Rutas públicas del repo que no están en el sitemap conservado. Titles y H1 sobrios, por si Rosario las incorpora después. No están incluidas en las 53 del anexo.
- `/reset-password` (solo ES; no aparece en `robots.txt`; Rosario §5 pregunta si entra en el alcance público): title «Restablecer la contraseña de tu cuenta | Taimbox» (48); H1 «Nueva contraseña»; meta «Establece una nueva contraseña para tu cuenta de Taimbox con el enlace que te hemos enviado.» (92).
- 404 (`path="*"`; el H1 actual es «404» y el subtítulo, «Página no encontrada»): title «Esta página no se ha encontrado | Taimbox» (41); H1 «Página no encontrada»; meta «Esta dirección no existe o ya no está disponible. Vuelve al inicio de Taimbox o entra en la guía.» (97). Sin URL propia en el sitemap.
- `/api-docs/openapi` y `/en/api-docs/openapi`: están en `publicPaths.ts` y en `App.tsx`, no en el sitemap. Rosario §1 y §5 dejan pendiente si el visor OpenAPI debe indexarse. Title ES «Especificación OpenAPI de la API | Taimbox» (42); H1 «OpenAPI»; meta «Especificación OpenAPI 3.0 de la API de integración por agencia, para usarla con Swagger, Postman, Redoc u otros generadores.» (125). EN: title «Interactive OpenAPI specification | Taimbox» (43); H1 «OpenAPI»; meta «OpenAPI 3.0 spec for the per-agency integration API, for use with Swagger, Postman, Redoc or client generators.» (111).
