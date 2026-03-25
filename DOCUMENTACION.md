# Documentación Técnica Detallada - Taimbox

Esta documentación ofrece una visión profunda y técnica de la plataforma Taimbox. Incluye un **Mapa de Dependencias** (Sección 8) exhaustivo para analizar el impacto de cualquier cambio en el código.

---

## 1. Arquitectura General y Tecnologías

El sistema sigue una arquitectura de **Single Page Application (SPA)** con un backend proporcionado por **Supabase** (BaaS) y trabajadores externos para integraciones de publicidad.

- **Frontend**: React 18 con Vite y TypeScript.
- **Backend / DB**: Supabase (PostgreSQL + Auth + Realtime). La documentación pública de la API de integración está en `/api-docs` (shell en `src/pages/ApiDocsPage.tsx`, contenido modular en `src/pages/api-docs/`). La landing pública (`LandingPage.tsx`) incluye footer (`LandingFooter`) con enlaces legales (`/privacidad`, `/condiciones`), enlaces al artículo "Por qué Taimbox", enlace Cookies (preferencias RGPD), header sticky con Login y schema JSON-LD SoftwareApplication. El banner de cookies (`CookieBanner.tsx`) cumple RGPD (consentimiento explícito, categorías necesarias/analíticas/marketing, preferencias en `localStorage`); se monta en `App.tsx` y el footer dispara el evento `open-cookie-preferences` para reabrir el panel. **Medición**: el contenedor **Google Tag Manager** `GTM-WSQZRMW7` se carga desde `index.html` (snippet en `<head>` + `noscript` tras `<body>`), por lo que aplica a toda la SPA (páginas públicas y dashboard). Ya no se inyecta gtag de Google Ads en el HTML; las conversiones/Ads deben configurarse como etiquetas dentro de GTM si aplica. **Google Consent Mode v2 para GTM**: al guardar consentimiento se escriben 4 cookies (`timeboxing_gtm_analytics_storage`, `timeboxing_gtm_ad_storage`, `timeboxing_gtm_ad_user_data`, `timeboxing_gtm_ad_personalization`) con valor `granted`/`denied` y se hace push al dataLayer con evento `cookie_consent_update`. Import sugerido de variables + etiquetas de consentimiento: `gtm/GTM-consent-mode-taimbox.json` e instrucciones en `gtm/README.md`. Ver `src/lib/cookieConsent.ts` y la subsección **Google Consent Mode v2 (GTM)** más abajo en este documento. Los artículos largos orientados a SEO están en el **blog**: índice en `/blog` (`BlogPage.tsx`), artículo "Qué es el timeboxing" en `/blog/que-es-timeboxing` (`WhatIsTimeboxingPage.tsx`; la URL antigua `/que-es-timeboxing` redirige aquí) y artículo "Planificación de proyectos: cronograma, presupuesto y recursos" en `/blog/planificacion-proyectos-cronograma-recursos` (`PlanificacionProyectosCronogramaRecursosPage.tsx`), artículo "Ley de Parkinson" en `/blog/ley-parkinson` (`LeyParkinsonPage.tsx`), artículo "KPIs para agencias de marketing: 5 métricas que sí importan en 2026" en `/blog/kpis-agencias-marketing-2026` (`KpisAgenciasMarketingPage.tsx`, contenido en `KpisAgenciasMarketingArticle.tsx`). El blog solo se enlaza desde el footer (`LandingFooter.tsx`), no desde el menú principal. Todos con schema Article + SoftwareApplication donde aplica. Es una **API selectiva** (no open-source): expone solo 17 tablas de planificación, equipo y proyectos. Excluye tablas internas (ads, audit_logs, user_agencies). La documentación incluye 4 grupos (Overview, Tutoriales, SDK/REST, Referencia de Recursos), 5 tutoriales paso a paso, changelog, búsqueda (Ctrl+K), sidebar con grupos colapsables, y ResponseExample JSON por recurso. Estructura de archivos: `api-docs/data/` (types, tables, toc, changelog), `api-docs/components/` (CodeBlock, SidebarTOC, SearchBar, ResourceCard, TutorialStep, ResponseExample, etc.), `api-docs/sections/` (15 secciones). Consultarla para integraciones externas o partners.
- **Estilos**: Tailwind CSS con componentes de Shadcn UI. El color primario por defecto (`--primary` en `src/index.css`) es indigo, alineado con la landing y la página de login/registro; modificar ahí para cambiar botones, acentos y sidebar en toda la app.
- **Texto en navegación por mes**: En vistas que trabajan por mes (dashboard, reportes, proyectos, planificador, Gantt), el botón para volver al mes actual se etiqueta **"Mes actual"** (no "Hoy"), para mantener consistencia con el modelo mensual de la herramienta. Archivos afectados: `EmployeeDashboard.tsx`, `ProjectsPage.tsx`, `ClientsAndProjectsPage.tsx`, `PlannerGrid.tsx`, `GanttView.tsx`.
- **Estado Global**: React Context API con persistencia reactiva.
- **Lógica de Datos**: TanStack Query (React Query) para sincronización de servidor.
- **Workers**: Scripts independientes en Node.js para sincronización de APIs externas (Google/Meta Ads).

### 1.1b Google Consent Mode v2 (GTM)

El consentimiento de cookies se expone a **Google Tag Manager** de dos formas para usar Consent Mode con la mínima configuración. El contenedor **GTM-WSQZRMW7** está enlazado desde `index.html` (toda la app).

**1. Cookies (recomendada para lectura en carga)**  
Se escriben 4 cookies con valores `granted` o `denied`: `timeboxing_gtm_analytics_storage`, `timeboxing_gtm_ad_storage`, `timeboxing_gtm_ad_user_data`, `timeboxing_gtm_ad_personalization`. En GTM: 4 variables de tipo **Cookie de primera parte** con esos nombres (el JSON de importación `gtm/GTM-consent-mode-taimbox.json` ya las define como `Taimbox - gtm cookie …`).

**2. dataLayer (para actualizar Consent al cambiar)**  
Cada vez que el usuario acepta o cambia preferencias se hace push con evento `cookie_consent_update` y campos `analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization` (valores `"granted"` o `"denied"`). En GTM: disparador **Evento personalizado** `cookie_consent_update` y variables de **capa de datos** con esos nombres de campo (incluidas en el mismo JSON como `Taimbox - dlv …`).

**3. Etiquetas iniciales en GTM (plantilla importable)**  
El archivo `gtm/GTM-consent-mode-taimbox.json` añade tres etiquetas HTML personalizadas que llaman a `gtag` vía `dataLayer`: (a) **default** todo `denied` + `wait_for_update` en fase de consent initialization; (b) **update** leyendo las 4 cookies en **Initialization** (usuarios que vuelven con preferencias ya guardadas); (c) **update** leyendo la capa de datos en el evento `cookie_consent_update`. Si el importador no acepta los disparadores `CONSENT_INIT`/`INIT` del JSON, reasignar a los disparadores integrados del contenedor según `gtm/README.md`.

**Mapeo:** Necesarias (siempre activas) → —; Analíticas → `analytics_storage`; Marketing → `ad_storage`, `ad_user_data`, `ad_personalization`. Si no hay consentimiento guardado, no se escribe cookie ni dataLayer hasta que el usuario acepte; el estado por defecto en GTM debe ser "denied".

### 1.2 Reglas de Páginas Públicas y SEO
**CRÍTICO - Prevención de Páginas Huérfanas**: Cada vez que se genere o añada una **nueva Landing Page** pública (ej. `/monitor-ppc`, `/seguridad`, `/funcionalidad-x`):
1. **Debe añadirse a `public/sitemap.xml`** de inmediato.
2. **Debe enlazarse en la navegación del sitio** (ej. Footer en `LandingFooter.tsx`, menús dropdown estructurados como `FeaturesDropdown.tsx` o menú móvil en `LandingHeader.tsx`).
3. El frontend *debe* tener definido su `<Helmet>` respectivo (Title, Meta Description, y `rel="canonical"`).

Para **nuevos artículos del blog** (`/blog/...`): añadir la URL a `sitemap.xml`, la entrada a `src/data/blogPosts.ts`, crear la ruta en `App.tsx`, la página en `src/pages/blog/` y el componente de contenido; el índice `/blog` consume automáticamente `blogPosts.ts` y renderiza destacado + buscador + filtros por categoría + grid de artículos. El blog se enlaza solo desde el footer (no en el menú principal).

#### Base de artículos del blog

Todos los artículos del blog comparten la misma base de UX y estructura para mantener coherencia. **Componentes reutilizables** (en `src/components/landing/blog/`):

- **BlogBreadcrumb**: recibe `title`; muestra "Blog" (enlace a `/blog`) + " → " + título del artículo. Ubicación: encima del contenido del artículo, dentro del layout de la página.
- **BlogReadingTime**: recibe `minutes`; opcional `variant="editorial"` (texto oscuro para cuerpo en fondo claro). Muestra "~X min de lectura" con icono.
- **BlogTOC**: recibe `items: { id, label }[]`; opcional `variant="editorial"`. Lista de enlaces con anclas `#id`. En móvil es colapsable ("Contenido de esta guía"). Cada artículo define su propio array de TOC.
- **BlogRelatedPost**: recibe `title`, `description`, `href`; opcional `variant="editorial"`. Etiqueta "En la misma línea"; siguiente lectura al final del contenido antes del pie de autor.
- **Variante editorial** (opcional, disponible para futuros posts): tipo `BlogVariant` en `src/components/landing/blog/blogVariants.ts`. `BlogTOC`, `BlogReadingTime` y `BlogRelatedPost` aceptan `variant="editorial"` para fondo claro; actualmente todos los posts usan el diseño oscuro estándar.
- **Recursos estáticos descargables**: colocar bajo `public/recursos/` (p. ej. `plantilla-planificacion-recursos-taimbox.xlsx`); enlazar con `href` absoluto desde `/recursos/...`. Regenerar la plantilla Excel con `npm run generate:plantilla` (script `scripts/generate-plantilla-xlsx.mjs`, dependencia dev `exceljs`). La plantilla tiene 5 hojas (Instrucciones, Equipo, Proyectos, Asignacion, Insights) con fórmulas nativas, formato condicional (3 niveles de color en utilización, rojo en margen negativo, ámbar/rojo en pacing), desplegables de validación en Asignación (Persona y Proyecto enlazados), protección de celdas de fórmula, autofiltros en todas las hojas, panes congelados, colores por pestaña, KPIs de resumen y dos semanas de datos de ejemplo (S12 y S13).

**Convenciones obligatorias para nuevos posts:**

- **IDs en secciones**: cada H2 o `<section>` principal debe tener un `id` único (ej. `id="cronograma-gantt"`) para que los anclas de la TOC y los enlaces directos funcionen. Usar `scroll-mt-24` en las secciones cuando el header es fijo para compensar el scroll.
- **Datos en `blogPosts.ts`**: cada post debe tener al menos `slug`, `title`, `description`, `date`, `href`, `readingMinutes`. Opcional: `relatedSlug` (slug del artículo recomendado como siguiente lectura). Las páginas de artículo leen estos datos y pasan `readingMinutes`, `tocItems` y `relatedPost` al componente de artículo. La `date` debe ser coherente con el año editorial del sitio (p. ej. 2026) y coincidir con `datePublished` en JSON-LD y con el fallback `post?.date ?? '…'` de cada página.
- **Schema y OG**: en el Helmet de cada página de artículo incluir `datePublished` (y opcionalmente `dateModified`) en el JSON-LD de tipo Article, y meta OG (`og:type`, `og:title`, `og:description`, `og:url`) para compartir en redes. Artículos tipo guía/herramienta pueden añadir **`HowTo`** en el mismo `@graph` (pasos numerados) además de `SoftwareApplication` para Taimbox cuando aplique.
- **Tono del copy**: preferir frases naturales frente a etiquetas de manual ("paso opcional", etc.) y a mandatos de enlace ("lee también", "conviene leer"); enlazar con descripciones ("el hilo X lo desarrollamos en…", "encaja con…"). En secciones hacia guía o landings, títulos conversacionales ("Por si quieres verlo en la herramienta") y párrafos que entren al recurso sin imperativos. CTAs: formulaciones descriptivas ("Taimbox se puede explorar sin compromiso") frente a "prueba" / "mira" cuando el objetivo es sonar editorial.

Los nuevos posts deben seguir esta base para mantener la misma línea en todos los artículos.

---

## 2. Glosario de Entidades y Modelos de Datos

A continuación se detallan las entidades principales del sistema, sus variables clave y su propósito.

### 2.1. Agencia (`Agency`)
El núcleo del modelo **multi-tenant**. Cada usuario pertenece a una o más agencias.
- `id`: UUID único.
- `settings`: Objeto JSON que define la configuración de la agencia.
    - `roles`: Array de `RolePermissions` definidos por cada agencia. Sin roles hardcodeados excepto "Administrador" como rol protegido del sistema.
    - `modules`: Módulos habilitados (Ads/PPC, etc.).
    - `branding`: Colores y logotipos personalizados.
    - `projectAliasingRules`: Reglas para renombrado automático de proyectos.
    - `ehrTarget`: Opcional. Objetivo de Precio Hora Efectivo (€/h) en **Rentabilidad**. Si no se define, se usa 75 €/h o la media de coste por hora de la agencia si es superior. Se edita en Configuración de agencia → General → Rentabilidad.

#### Sistema de Roles Dinámicos
Cada agencia define sus propios roles con permisos granulares:
- Los roles se definen como `RolePermissions[]` en `AgencySettings.roles`.
- La verificación de admin (`isAdmin`) se basa en el permiso `can_access_agency_settings`, no en nombres de rol hardcodeados.
- El rol "Administrador" está protegido y no puede ser eliminado.

#### Sistema de Aliasing de Proyectos
Permite renombrar proyectos automáticamente según patrones configurables:
- `ProjectAliasingRule.matchPatterns`: Patrones de detección (ej: `["(KD)", "kit digital"]`).
- `ProjectAliasingRule.displayPrefix`: Prefijo a mostrar (ej: `"KD:"`).
- Default: Regla de Kit Digital preconfigurada.

**Implementación (Hook centralizado)**:
- **Hook**: `src/hooks/useProjectAliasing.ts` → expone `formatName(projectName)`
- **Uso**:
  ```typescript
  const { formatName: formatProjectName } = useProjectAliasing();
  // Luego: formatProjectName(project.name)
  ```
- **Función auxiliar**: `matchesAliasingRule(name, rules)` en `src/lib/utils.ts`

**Componentes que usan aliasing** (actualizar si añades más):
| Componente | Archivo | Línea aprox. |
|------------|---------|--------------|
| AllocationSheet | `src/components/planner/AllocationSheet.tsx` | ~180 |
| AllocationProjectHeader | `src/components/planner/allocation/AllocationProjectHeader.tsx` | ~45 |
| AllocationTaskRow | `src/components/planner/allocation/AllocationTaskRow.tsx` | ~50. En móvil recibe `isMobile` para filas táctiles (min-h 44px), texto `text-sm`, horas `font-mono text-base` y botón menú ≥44px. |
| AllocationFormDialog | `src/components/planner/allocation/AllocationFormDialog.tsx` | ~100. Alta por lotes: **Guardar** deshabilitado hasta ≥1 fila con proyecto+nombre+horas y sin filas con nombre/horas sin proyecto (lógica en `useAllocationActions`: `canSubmitBatchAdd`). Cerrar con cambios sin guardar: **AlertDialog** (mismo patrón y copy base que «Añadir tareas» en `EmployeeDashboard`), no diálogo nativo del navegador. |
| GanttView | `src/components/planner/GanttView.tsx` | ~95 |
| BatchTaskRow | `src/components/planner/BatchTaskRow.tsx` | ~65. Selector de proyecto en "Añadir tareas": lista ordenada con primero los proyectos que tienen deadline asignado al empleado de la tarea (o actual), luego el resto. |
| ProjectImpactSummary | `src/components/planner/ProjectImpactSummary.tsx` | ~45 |
| DashboardWidgets | `src/components/employee/DashboardWidgets.tsx` | ~120 |
| WeeklyReportDialog | `src/components/employee/WeeklyReportDialog.tsx` | Modal Weekly (UI corporativa: cabecera, buscador, tarjetas por tarea, cinco acciones con copy formal, paneles de detalle unificados, pie “Cancelar” / **Confirmar cierre**). **Semanas destino:** solo **mes de `viewDate` + mes siguiente** (`WEEKLY_SLOT_EXTRA_MONTHS = 1`). Al **abrir** el modal: `ensureMonthLoaded(viewDate)` + `loadDataForMonth(mes siguiente)` para que `getEmployeeLoadForWeek` refleje asignaciones reales. **Layout master-detail**: sidebar compacta (lista con estado ○/✓/⚠, buscador, agrupación por filtro) + panel detalle (cabecera tarea, 5 radio-options, formulario acción, nota opcional). **Progress bar** en cabecera (verde al 100 %). Móvil: sidebar → `<Select>` dropdown. Tokens del design system (`bg-background`, `text-muted-foreground`, `bg-accent`, `rounded-md`). Validación extraída: `canSubmit`, `validationErrors`, `capacityWarnings`. Selects simplificados "S1 · 3–7 mar · 27h libres". |
| PlanningInconsistenciesCard | `src/components/employee/PlanningInconsistenciesCard.tsx` | ~60. **Control de planificación** (dashboard empleado): resumen del mes + filtro «Filtrar por proyecto» integrado en un bloque unificado (ancho completo); si hay texto, muestra «Mostrando M de N tras filtrar». Botón **Añadir** (tareas): píldora pequeña, fondo blanco, texto gris (`slate-600`), icono `ListPlus` violeta (`violet-600`), borde/sombra muy suaves; en colapsado solo si hay déficit (`difference < 0`) y en expandido junto a «TUS DATOS». |
| GlobalPlanningInconsistencies | `src/components/employee/GlobalPlanningInconsistencies.tsx` | ~380 |
| MyWeekView | `src/components/employee/MyWeekView.tsx` | ~150 |
| DeadlinesPage | `src/pages/DeadlinesPage.tsx` | ~670. **Datos**: `useDeadlinesPageData.ts` (carga deadlines/globales, Realtime, locks, filteredProjects, projectsByClient, getMonthlyCapacity, getEmployeeAssignedHours). **Edición inline**: `useDeadlinesEditing.ts` (locks adquirir/renovar/liberar, formulario inline, autoSave, handleFormPatch, cancelEditingProject, toggleProjectExpanded). **Sugerencias**: `useDeadlinesRedistribution.ts`. **Filtros**: `DeadlinesFilters.tsx`. **Listado**: `DeadlinesProjectList.tsx`. **Asignaciones globales**: `GlobalAssignmentDialog.tsx`. **Sugerencias UI**: `DeadlinesSuggestionsPreview.tsx`, `DeadlinesSuggestionsPanel.tsx`. Sin dialog de crear/editar deadline (eliminado como código muerto). |
| WeeklyForecastPage | `src/pages/WeeklyForecastPage.tsx` | ~380 |
| EmployeeDashboard | `src/pages/EmployeeDashboard.tsx` | ~220. Pestaña **Dependencias**. Cabecera escritorio/móvil como arriba. Modal **Añadir tareas**: **Guardar** deshabilitado si falta proyecto en filas con nombre u horas; mínimo una fila completa (proyecto + nombre + horas). Demo: `DemoEmployeeDashboard.tsx`. |
| OperationsRadarPage | `src/pages/OperationsRadarPage.tsx` | ~540 (nombre en fila de proyecto; búsqueda por nombre formateado o crudo) |

> **⚠️ IMPORTANTE**: Si creas un nuevo componente que muestra nombres de proyectos, DEBES usar `useProjectAliasing().formatName()` para mantener consistencia.

#### Exclusiones del cálculo de precisión de planificación
- `AgencySettings.planningPrecisionExclusions`: Opcional. Permite excluir tareas de **proyectos** y/o **clientes** concretos del cálculo del **índice de fiabilidad** (precisión de planificación).
- **Campos**: `projectIds?: string[]`, `clientIds?: string[]`. Si un cliente está en `clientIds`, se excluyen todas las tareas de proyectos de ese cliente.
- **Dónde se aplica**:
  - **Dashboard del empleado → pestaña "Mis métricas"**: la tarjeta "Precisión de planificación" es `ReliabilityIndexCard`, que ya aplica las exclusiones (las tareas de proyectos/clientes excluidos no entran en el índice).
  - Utilidad compartida: `src/utils/planningPrecisionUtils.ts` → `getExcludedProjectIds(projects, exclusions)`.
- **Configuración**: En Configuración de agencia (`AgencySettingsPage`), pestaña **Módulos y métricas** → bloque "Precisión de planificación": selectores con búsqueda para elegir proyectos y clientes a excluir. La página está organizada en secciones (General, Equipo, Departamentos, Proyectos, Módulos y métricas, Integraciones, Apariencia) para facilitar la localización de opciones.

#### Radar operativo: exclusión del riesgo «Poco avance»
- `AgencySettings.radarLowProgressExcludeKeywords`: Opcional. Lista de palabras clave (strings). Si el **nombre del proyecto** contiene alguna de estas palabras (comparación insensible a mayúsculas), el proyecto **no** se marcará como riesgo «Poco avance» en el Radar operativo al final de mes (cuando el avance es &lt; 35%).
- **Dónde se aplica**: `src/pages/OperationsRadarPage.tsx` → cálculo de `atRiskProjectsRaw` (exclusión en la condición de riesgo `lowProgress`).
- **Configuración**: En Configuración de agencia, pestaña **Módulos y métricas** → bloque "Radar operativo": input para añadir/quitar palabras clave (ej. off-page, linkbuilding). Sin palabras configuradas, todos los proyectos pueden recibir la alerta «Poco avance» si aplica.

#### Vistas por Departamento
- **Propósito**: Permitir a los managers filtrar la plataforma por área (ej. Marketing, Desarrollo) sin perder la vista global.
- **Configuración**: En Configuración de agencia, pestaña **Departamentos**: listado con nombre y color por departamento. El color se usa en la barra de aviso cuando el filtro está activo.
- **Asignación**: En ficha de empleado, campo "Departamento principal" (un empleado pertenece a un departamento). En ficha de proyecto, "Departamento responsable" (para reportes financieros).
- **Selector**: En el Sidebar, dropdown "Vista por departamento": opción "Vista Global (CEO)" y lista de departamentos. La selección se persiste en `localStorage` por agencia.
- **Barra de aviso**: Si hay un departamento seleccionado, aparece una barra bajo el header con el color del departamento, texto "Estás viendo la vista filtrada de: [Nombre]. El resto de datos están ocultos." y botón "Borrar filtro".
- **Comportamiento**: Planificador y Gantt muestran solo empleados del departamento (sus tareas en todos los proyectos siguen visibles). Team Pulse y Reportes filtran por empleados y, en reportes, la rentabilidad por proyectos del departamento responsable. **WeeklyForecastPage** (Previsión mensual): semáforo, transferencias, bloqueos, redistribución y gráfico de evolución usan `employeesForView` y `filteredProjectsForView`; el historial (pestaña Historial) usa **ActivityLogSection**, que también respeta la vista por departamento (logs filtrados por empleado y proyecto del departamento). Utilidades: `src/utils/departmentUtils.ts` (`normalizeDepartments`, `employeeBelongsToDepartment`). Contexto: `DepartmentViewContext`; componentes: `DepartmentViewSelector`, `DepartmentViewBanner`.

### 2.2. Empleado (`Employee`)
Representa a los miembros del equipo.
- `role`: Nombre del rol que determina los permisos.
- `department`: ID (o nombre legacy) del departamento principal para filtrado en vistas por departamento.
- `hourlyRate`: **Coste mensual (nómina)** en €. En la UI (Team, EmployeeDialog) se edita como "Coste mensual (nómina) €". Se persiste en BD en `hourly_rate`. En Rentabilidad (`FinancialHealthPage`) hay dos modelos de coste: **Operativo** (coste estándar: nómina / capacidad teórica mensual); **Dinámico** (reparte la nómina entre proyectos en proporción a las horas del empleado en el mes: coste en proyecto = coste mensual × (horas en proyecto / total horas del empleado)). Si la agencia usa un coste medio global, se aplica a ambos modelos.
- `defaultWeeklyCapacity`: Horas base de trabajo por semana; **se calcula automáticamente** a partir del horario por día (`workSchedule`). No existe campo editable "Capacidad (h/sem)" en la configuración de empleados: la capacidad se deriva de las horas por día (L–D). Utilidad: `getWeeklyHoursFromSchedule()` en `dateUtils.ts`.
- `workSchedule`: Objeto que define las horas por día (`monday`: 8, `friday`: 6, etc.).
- `user_id`: Enlace con `auth.users` de Supabase para autenticación.

### 2.3. Proyecto (`Project`)
Contenedores de trabajo facturable o interno.
- `budgetHours`: Horas máximas contratadas por el cliente al mes.
- `minimumHours`: Suelo de horas que el equipo debe cumplir.
- `monthlyFee`: Fee recurrente en euros para cálculos de rentabilidad.
- `status`: `active`, `paused` o `completed`.
- `responsibleDepartmentId`: Opcional. ID del departamento responsable; usado para filtrar proyectos en reportes por vista departamento.

### 2.3b. Deadline (`Deadline`)
Define la foto mensual de un proyecto.
- `projectId`: Proyecto asociado.
- `month`: Mes en formato `YYYY-MM`.
- `employeeHours`: Distribución de horas por empleado.
- `budgetOverride`: Sobrescribe `project.budgetHours` solo para este mes (Regularización). Permite reducir o aumentar las horas objetivo del proyecto en ese mes (ej.: 30 h contratadas pero este mes 28 h por acuerdo con el cliente).
- `isHidden`: Si el proyecto se oculta en la planificación de este mes.

**Multi-tenant**: La tabla `deadlines` no tiene `agency_id`; la agencia se deduce por `project_id` (proyectos son por agencia). Cuando varias agencias comparten el mismo Supabase, **todas** las lecturas de deadlines deben filtrar por agencia usando join con `projects` y `projects.agency_id`. La utilidad centralizada es `fetchDeadlinesForMonth(monthKey, agencyId)` en `src/utils/deadlineUtils.ts`. El hook `useDeadlines({ agencyId })` y todos los componentes que cargan deadlines usan esta función para no mezclar datos entre agencias. "Resetear mes" y "Copiar del mes anterior" en DeadlinesPage también están acotados a la agencia actual.

**Regla de visualización**: Siempre que una vista muestre **horas totales**, **presupuesto** o **total del proyecto** para un mes concreto, debe usarse el **presupuesto efectivo** de ese mes (p. ej. `getEffectiveBudget(project, deadline)` en `src/utils/budgetUtils.ts`), de modo que se respeten los ajustes del Deadline (`budgetOverride`). Si no se hace, se mostrarían las horas contratadas del proyecto en lugar de las horas acordadas para ese mes. Rentabilidad, Radar, Coherencia, Previsión mensual y cualquier tabla "Xh / Yh" o "budget" por proyecto deben pasar los deadlines del mes a la lógica que calcula métricas (p. ej. `useProjectMetrics({ month, deadlines })`).

### 2.4. Asignación (`Allocation`)
La unidad fundamental de planificación semanal.
- `hoursAssigned`: Horas planificadas por el manager.
- `hoursActual`: Horas reportadas por el empleado.
- `hoursComputed`: Horas validadas o calculadas (usadas en métricas finales).
- `weekStartDate`: Fecha (Lunes) o primer día laborable del mes (en semanas partidas).
- `status`: `planned`, `completed`, `active`, `in_progress`.

---

## 3. Lógica de Negocio y Algoritmos Críticos

### 3.1. Cálculo de Capacidad Efectiva (`capacityUtils.ts`)
El sistema evita la "doble contabilidad" de horas no disponibles.
- **Fórmula**: `Capacidad = Horario_Laboral - Max(Ausencia, Reducción_por_Evento)`.
- **Detección de Conflictos**: Si un empleado tiene una baja médica y coincide con un festivo, el sistema no resta las horas dos veces; utiliza un cálculo diario unificado (`getDailyReduction`).

### 3.2. Gestión de Semanas Partidas ("Split Weeks")
Para que los reportes de fin de mes sean exactos, las semanas que cruzan meses se dividen.
- **Lógica**: Si una semana empieza el 29 de diciembre y termina el 4 de enero:
    - Se crea una entrada de calendario para Diciembre (29-31).
    - Se crea otra para Enero (1-4).
- **Variable `isAllocationInEffectiveMonth`**: Filtra si una tarea pertenece al mes visible basándose en el inicio de la semana normalizada.

### 3.3. Cálculo de Budget Efectivo (`budgetUtils.ts`)
Para permitir regularizaciones mensuales (ej. restar o sumar horas en un mes concreto vía Deadlines), el sistema usa `getEffectiveBudget`.
- **Lógica**: Si el `Deadline` del mes tiene `budgetOverride >= 0`, usa ese valor. Si no, usa el `Project.budgetHours` general.
- **Uso**: Cualquier pantalla que muestre **total de horas**, **presupuesto** o **objetivo del proyecto** para un mes debe usar el presupuesto efectivo (p. ej. pasando los deadlines del mes a `useProjectMetrics({ month, deadlines })` o llamando a `getEffectiveBudget(project, deadlineForMonth)`). Así se respetan los ajustes del Deadline (ej.: proyecto con 30 h contratadas pero 28 h este mes). Afecta a: `DeadlinesPage`, `WeeklyForecastPage`, `ClientsAndProjectsPage`, **Rentabilidad** (`FinancialHealthPage`), Seguimiento operativo y cualquier vista con columnas tipo "Xh / Yh" o "budget".

### 3.3. Métricas de Rentabilidad (`useProjectMetrics.ts`)
Calcula el rendimiento financiero en tiempo real.
- `progressOperational`: `(Horas Computadas / Presupuesto de Horas) * 100`.
- `hoursValue`: `Horas Computadas * (Fee Mensual / Horas Presupuestadas)`. Representa el valor monetario del trabajo realizado.
- `isPacing`: Indica si el ritmo de trabajo actual permite completar el presupuesto al final del mes.

---

## 4. Gestión del Estado Global (Contextos)

### 4.1. AppContext: El Motor de Datos
Gestiona la carga de la base de datos principal (`employees`, `projects`, `allocations`).
- **Patrón Upsert**: En lugar de recargar todo, utiliza funciones que mezclan los datos nuevos con los existentes, manteniendo la integridad de la UI.
- **`loadedMonthsRef`**: Un Set que registra qué meses ya están en memoria para evitar llamadas redundantes a la base de datos.
- **`ensureMonthLoaded`**: Tras ejecutar `loadDataForMonth` sin error, el mes **siempre** se marca en `loadedMonthsRef` (antes dependía del retorno “hubo weekly_feedback”, y meses solo con allocations no se cacheaban).

### 4.2. Estrategia de Realtime y Colaboración
Para soportar múltiples usuarios concurrentes sin saturar conexiones WebSocket, utilizamos una estrategia de **Canales Unificados**.

#### Tablas con Realtime habilitado (solo estas)
En Supabase (Database → Replication / publicación `supabase_realtime`) deben estar **únicamente** estas tablas. El resto conviene tenerlas deshabilitadas para reducir carga y conexiones.

| Tabla | Uso en la app |
|-------|----------------|
| `allocations` | AppContext (planificador) y TeamPulsePage |
| `projects` | AppContext |
| `absences` | AppContext |
| `team_events` | AppContext |
| `deadlines` | DeadlinesPage |
| `global_assignments` | DeadlinesPage |
| `project_editing_locks` | DeadlinesPage (bloqueos de edición) |
| `ads_sync_logs` | AdsPage (estado de sync Google Ads) |
| `meta_sync_logs` | MetaAdsPage (estado de sync Meta Ads) |

#### Arquitectura de Canales (`DeadlinesPage`)
En lugar de abrir una conexión por entidad, abrimos **un solo canal por sala** (mes/contexto) que transporta todos los tipos de eventos.
- **Antes (Ineficiente)**: 3 canales por usuario (`deadlines`, `assignments`, `locks`).
- **Ahora (Optimizado)**: 1 canal compartido: `deadlines-room-{YYYY-MM}`.

```typescript
// Patrón de suscripción unificada
const channel = supabase.channel(`deadlines-room-${selectedMonth}`)
  .on('postgres_changes', { table: 'deadlines' }, handleDeadlines)
  .on('postgres_changes', { table: 'global_assignments' }, handleAssignments)
  .on('postgres_changes', { table: 'project_editing_locks' }, handleLocks)
  .on('broadcast', { event: 'lock-released' }, handleBroadcasts)
  .subscribe();
```

#### Filtro por agencia en Realtime (Deadlines)
En `DeadlinesPage`, los eventos de la tabla `deadlines` se filtran por agencia: solo se aplican INSERT/UPDATE si el `project_id` del payload pertenece a un proyecto de la agencia actual (`projects.find(p => p.id === newDeadline.project_id)`). Así se evita que una agencia reciba en su estado deadlines de otra cuando comparten el mismo canal Realtime.

#### Sistema de Bloqueos (Locking)
Previene conflictos de edición simultánea en el mismo proyecto.
1. **Adquisición**: Al editar, se inserta una fila en `project_editing_locks` con fecha de expiración.
2. **Validación**: Si ya existe un lock válido de otro usuario, la UI bloquea la edición.
3. **Liberación**:
   - **Explícita**: Al guardar o cancelar.
   - **Broadcast**: Se envía evento `lock-released` para notificar inmediatamente a otros clientes.
   - **Limpieza**: Al desmontar componente o cerrar pestaña, se intenta liberar locks propios.

---

## 5. Integraciones y Automatización (Workers)

El sistema sincroniza datos de Google Ads y Meta Ads mediante procesos externos.

### 5.1. Arquitectura de los Workers (`ads-worker.js` / `meta-worker.js`)
- Corren de forma independiente en un entorno Node.js.
- Utilizan `generic-pool` para manejar conexiones a la base de datos de manera eficiente.
- **Unidad de Medida**: Google Ads entrega el coste en `micros` (millonésimas de moneda), el worker lo convierte dividiendo por `1,000,000` antes de guardarlo.
- **Sincronización**: Utilizan `Supabase Realtime` para reaccionar a cambios en la tabla de configuración y ejecutar sincronizaciones bajo demanda.

### 5.2. Edge Functions (Supabase)

Funciones serverless que corren en Deno dentro del contenedor `supabase-edge-functions`.

#### Inventario de funciones

| Función | Archivo | Descripción |
|---------|---------|-------------|
| `sync-google-ads` | `supabase/functions/sync-google-ads/index.ts` | Sincroniza campañas. Usa credenciales plataforma + refresh token (DB). Si no hay filas en `ad_accounts_config`, obtiene toda la jerarquía del MCC (MCC + sub-MCCs + subcuentas) vía `customer_client` recursivo y sincroniza cada cuenta; si hay filas, solo esas. Escribe en `google_ads_campaigns` con `agency_id`. |
| `oauth-google-ads` | `supabase/functions/oauth-google-ads/index.ts` | **(Nuevo)** Intercambia código OAuth y guarda `refresh_token` en columna de agencia. |
| `exchange-google-token` | `supabase/functions/exchange-google-token/index.ts` | *(Legacy)* Versión anterior que guardaba en JSON. |
| `sync-meta-ads` | `supabase/functions/sync-meta-ads/index.ts` | Sincroniza insights a nivel campaña (gasto, clics, conversiones, etc.) vía Graph API; **no** persiste presupuesto diario de Meta en `meta_ads_campaigns` (la integración actual no solicita esos campos). |
| `generate-api-token` | `supabase/functions/generate-api-token/index.ts` | Genera JWT con claim `agency_id` para acceso API. |
| `revoke-api-token` | `supabase/functions/revoke-api-token/index.ts` | Revoca un token API (marca `is_active = false`). |
| `create-user` | `supabase/functions/create-user/index.ts` | Crea usuario en Auth + `employees`. |
| `update-user` | `supabase/functions/update-user/index.ts` | Actualiza usuario en Auth. |
| `delete-user` | `supabase/functions/delete-user/index.ts` | Elimina usuario de Auth. |
| `invite-user-to-agency` | `supabase/functions/invite-user-to-agency/index.ts` | Invita a un usuario existente a una agencia. |
| `register-agency` | `supabase/functions/register-agency/index.ts` | Registra una nueva agencia (onboarding). Asigna plan Business con trial 14 días por defecto. |
| `add-platform-admin` | `supabase/functions/add-platform-admin/index.ts` | Añade un usuario como admin de plataforma. |
| `create-checkout-session` | `supabase/functions/create-checkout-session/index.ts` | Crea sesión de Stripe Checkout para suscripción (Pro/Business). Crea o recupera Customer, devuelve URL. Requiere `STRIPE_SECRET_KEY`. |
| `create-billing-portal-session` | `supabase/functions/create-billing-portal-session/index.ts` | Crea sesión del Stripe Customer Portal (body: `agency_id`). Redirige al portal para gestionar tarjeta, facturas o cancelar suscripción. Requiere `STRIPE_SECRET_KEY`. |
| `stripe-webhook` | `supabase/functions/stripe-webhook/index.ts` | Webhook Stripe: actualiza `agencies` (plan_id, subscription_status, trial_ends_at) según eventos de suscripción. Requiere `STRIPE_WEBHOOK_SECRET`. |
| `send-welcome-email` | `supabase/functions/send-welcome-email/index.ts` | Envía email de bienvenida (registro) o invitación (añadido a agencia) vía Resend. Body: `{ email, name, agencyName, type }`. Usa `_shared/resend.ts`. Requiere `RESEND_API_KEY`. |
| `send-contact-email` | `supabase/functions/send-contact-email/index.ts` | Envía email interno a `CONTACT_TO_EMAIL` (default `hello@taimbox.com`) desde el formulario público `/contacto` vía Resend. Body: `{ name, email, subject, message }`. Requiere `RESEND_API_KEY`. |
| `request-password-reset` | `supabase/functions/request-password-reset/index.ts` | Genera enlace de recuperación de contraseña y lo envía por email vía Resend. Body: `{ email }`. Funciona para cualquier usuario en `auth.users` (empleados, admins de plataforma, etc.). Siempre devuelve 200 (previene enumeración). No requiere autenticación. |

**Meta Ads — presupuesto y ritmo en la UI (`MetaAdsPage.tsx`):** El objetivo mensual y las alertas se basan en el **presupuesto mensual** que la agencia introduce en pantalla (persistido en `client_settings.budget_limit` por cuenta o cliente virtual). La vista compara **gasto medio diario** (lo gastado en el mes ÷ días transcurridos) con **objetivo medio diario** (presupuesto restante ÷ días que faltan). Los límites nativos de gasto siguen configurándose en Meta (campaña, conjunto, presupuesto compartido, etc.); no se muestra un «presupuesto diario importado» desde la API, para alinear el mensaje con el modelo de Meta y con lo que realmente sincroniza `sync-meta-ads`. En **Google Ads** (`AdsPage.tsx`) sí se usa `daily_budget` devuelto por la API cuando está disponible. Los filtros de la barra (cuentas ocultas, **sin inversión en el mes**) replican el comportamiento de `AdsPage` (`showHidden`, `showZeroSpend`).

#### Integración: Modo demostración (ocultar datos sensibles en toda la app)

En Configuración → Integraciones → Privacidad y demostración, la opción **"Modo demostración (ocultar datos sensibles)"** activa una capa de anonimización en la UI, además de Google Ads y Meta Ads. **Prioridad de negocio**: para demos con terceros conviene ocultar **nombres de proyecto** y **nombres de cliente** (identifican cuentas reales). El resto (empleados, tareas, etc.) puede mostrarse o anonimizarse según la pantalla.

Cuando el modo está activo, los textos sustituidos se muestran con efecto blur y una **etiqueta semántica genérica** según el tipo (`kind`: cuenta/campaña, empleado, proyecto, tarea, departamento). Los **nombres de cliente** en listados y tablas usan `SensitiveText` con **`kind="account"`** y el **id del cliente** (misma familia de etiquetas que cuentas de anuncios). Los **IDs** que ya se mostraban en la UI (p. ej. cuentas de anuncios) **siguen visibles** donde aplica.

**Auditoría / búsqueda en el código** (para encontrar fugas de nombres reales): en el repo, buscar patrones como `{client.name}`, `client?.name`, `{clientName}`, `clients.find(... )?.name`, `formatProjectName(...)` en JSX de solo lectura, y `title={...}` con nombres de proyecto o cliente. Revisar también `OkrsPage.tsx`, `ClientsAndProjectsPage.tsx`, `FinancialHealthPage.tsx` (rentabilidad) cuando se añadan filas nuevas.

**Deadlines** (`DeadlinesPage.tsx`): los **nombres de proyecto** van envueltos en `SensitiveText` con `kind="project"` en `DeadlinesProjectList.tsx`, `DeadlinesProjectEditSheet.tsx`, `DeadlinesSuggestionsPanel.tsx` (lista, filtros por proyecto, desglose por proyecto); la demo estática `DemoDeadlinesPage.tsx` alinea el mismo criterio en el título del proyecto.

**Indicador global**: una franja discreta (no el banner verde de Ads) en el layout principal (`PrivacyDemoIndicator` en `AppLayout.tsx`). En **escritorio** usa `lg:pl-64` para que el texto no quede bajo el **sidebar fijo** (`z-50`, `w-64`); lo mismo aplica a `DepartmentViewBanner` y `SubscriptionSoftLockBanner`. La **vista admin como agencia** va en una línea al pie del sidebar (`SidebarImpersonationPanel`), encima del selector de vista global, no en franja superior. En las páginas de Ads se eliminó el banner verde duplicado y los badges "Datos protegidos" redundantes para no repetir avisos.

**Implementación**: `PrivacyDemoProvider` + `usePrivacyDemo` / `SensitiveText` (`src/contexts/PrivacyDemoContext.tsx`, `src/components/privacy/SensitiveText.tsx`), motor `createPrivacyAnonymizer` (`src/lib/privacyDemoAnonymizer.ts`). `useAnonymizeAds` reutiliza el mismo contexto para `AdsPage.tsx` y `MetaAdsPage.tsx` con `AnonymizedContent`, `account(id)` y `campaign(id)`.

**Cobertura ampliada (UI)**: en varias pantallas el modo también anonimiza otros campos (p. ej. empleados o clientes) además del nombre de proyecto; eso es **opcional por pantalla** y no sustituye el foco en **proyectos** como dato crítico frente a demos con terceros.

#### Módulo compartido `_shared/resend.ts`
Módulo reutilizable que exporta `sendEmail({ to, subject, html, text? })`. Usa la API HTTP de Resend (`https://api.resend.com/emails`). Variables: `RESEND_API_KEY` (obligatoria), `RESEND_FROM_EMAIL` (default: `Taimbox <onboarding@resend.dev>`). Sin dependencias externas.

#### Emails transaccionales (Resend)
- **Registro**: Al registrar una agencia (`register-agency`), se envía email de bienvenida (fire-and-forget).
- **Crear usuario**: Al crear un usuario desde la app (`create-user`), se envía email de invitación (fire-and-forget).
- **Invitar usuario**: Al invitar a un usuario existente (`invite-user-to-agency`), se envía email de invitación (fire-and-forget).
- **Olvidé mi contraseña**: El frontend (`Login.tsx`) llama a `request-password-reset` que genera un enlace de recuperación (`supabase.auth.admin.generateLink`) y lo envía por email. Funciona para cualquier usuario en `auth.users` (empleados, admins de plataforma). El usuario recibe un enlace a `/reset-password?token_hash=...&type=recovery`. La página `ResetPasswordPage.tsx` verifica el token con `supabase.auth.verifyOtp()` y permite establecer nueva contraseña con `supabase.auth.updateUser()`.

#### Solución de problemas: Emails (Resend)

| Problema | Causa | Solución |
|----------|-------|----------|
| **No llegan emails** (bienvenida, invitación, reset contraseña) | `RESEND_API_KEY` no configurada o faltante en el contenedor | Añadir en `.env`: `RESEND_API_KEY=re_xxxxxxxx` (obtener en [resend.com](https://resend.com) → API Keys). Si usas el contenedor manual, incluir `-e RESEND_API_KEY="$RESEND_API_KEY"` en el `docker run`. |
| **Emails van a spam** | Dominio no verificado en Resend | En Resend Dashboard verificar el dominio (p. ej. `taimbox.com`) y añadir los registros DNS que indique. |
| **Emails con remitente genérico** | `RESEND_FROM_EMAIL` no configurada | Añadir en `.env`: `RESEND_FROM_EMAIL=Taimbox <no-reply@taimbox.com>`. El dominio debe estar verificado en Resend. |
| **"Olvidé mi contraseña" no envía email** | Usuario no existe en `auth.users` o error en Resend | La función siempre devuelve 200 (previene enumeración). Revisar logs: `docker logs functions --tail 50` y buscar `[request-password-reset]` o `[Resend]`. |
| **Contenedor manual sin emails** | Variables Resend no pasadas al `docker run` | Incluir `-e RESEND_API_KEY="$RESEND_API_KEY"` y `-e RESEND_FROM_EMAIL="${RESEND_FROM_EMAIL:-Taimbox <no-reply@taimbox.com>}"` en el comando. Ver sección "Workaround: usar contenedor manual". |

#### Arquitectura Google Ads OAuth (Modelo SaaS)

El flujo de Google Ads sigue un modelo SaaS donde la plataforma posee las credenciales OAuth y cada agencia solo autoriza su cuenta:

| Credencial | Origen | Quién la gestiona |
|---|---|---|
| `GOOGLE_CLIENT_ID` | Variable de entorno (servidor + frontend) | **Plataforma** |
| `GOOGLE_CLIENT_SECRET` | Variable de entorno (servidor) | **Plataforma** |
| `GOOGLE_DEVELOPER_TOKEN` | Variable de entorno (servidor) | **Plataforma** |
| `agencies.google_ads_refresh_token` | Columna en BD (obtenido vía OAuth) | **Automático** |
| `agencies.google_ads_customer_id` | Columna en BD (MCC ID) | **Cliente** (en Ajustes → Integraciones) |

**Flujo OAuth completo:**
1. Cliente entra en Configuración → Integraciones → Google Ads.
2. Hace clic en "Conectar con Google" (el MCC/Customer ID se elige después de vincular, con el selector de cuentas).
3. El frontend redirige a Google con `VITE_GOOGLE_CLIENT_ID`, `scope=adwords`, y `state=agency_id` (para recuperar la agencia en el callback).
4. Google redirige a `/google-callback?code=...&state=agency_id` → `GoogleCallbackPage.tsx` captura el código y usa `agency_id` del `state` o del contexto.
5. El frontend invoca `oauth-google-ads` con `{ code, redirect_uri, agency_id }`.
6. La Edge Function intercambia el código por tokens usando `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`.
7. Guarda el `refresh_token` en la columna `agencies.google_ads_refresh_token`.
8. El usuario selecciona la cuenta (MCC o subcuenta) en el desplegable; se guarda en `agencies.google_ads_customer_id`.
9. `sync-google-ads` y `list-google-accounts` usan `GOOGLE_DEVELOPER_TOKEN` + credenciales plataforma + `refresh_token` (columna) + `customer_id` (columna cuando aplica). **MCC:** si la agencia no tiene cuentas en `ad_accounts_config`, la sync obtiene **toda la jerarquía** del MCC seleccionado (consultando `customer_client` de forma recursiva: MCC raíz, sub-MCCs y todas sus subcuentas) y sincroniza campañas de cada cuenta; los datos se guardan en `google_ads_campaigns` con el mismo `agency_id`.

**Comportamiento de datos al desvincular / cambiar cuenta / re-sincronizar:**
- **Desvincular:** Al desvincular Google Ads (Configuración → Integraciones), se borran todos los registros de `google_ads_campaigns` de esa agencia, para no dejar datos huérfanos.
- **Cambiar de cuenta (selector):** Al elegir otro MCC/cuenta en el desplegable, se borran todos los datos de Google Ads de la agencia; la próxima sincronización rellenará solo con la nueva cuenta.
- **Volver a sincronizar:** La sync **sobrescribe** los datos del mes en curso por cuenta: para cada cuenta, borra filas en el rango de fechas del mes y hace upsert con lo que devuelve la API. No se suman ni se duplican importes; el gasto proviene siempre de la API (coste en micros convertido a unidad), por lo que no se pierden decimales por doble escritura. Tras cada sync se eliminan filas de la agencia cuyo `client_id` ya no está en la lista sincronizada (p. ej. al haber cambiado de MCC).
- **Cuentas con muchas campañas:** La sync hace una petición por cuenta y carga la respuesta en memoria. Con cuentas que tengan decenas de miles de campañas puede acercarse al límite de memoria o tiempo del Edge Runtime. Si aparecen timeouts o errores de memoria, se puede valorar paginar por rango de fechas o limitar campañas por petición.

**Con la API de Google Ads aprobada:** El flujo de conexión está listo para producción. Asegúrate de tener `GOOGLE_DEVELOPER_TOKEN` aprobado en la cuenta de desarrollador de Google Ads; sin ello, `list-google-accounts` y `sync-google-ads` pueden devolver HTML de error en lugar de JSON. Ver sección "Solución de problemas: Google OAuth y API Google Ads" más abajo.

**URIs de redirección autorizadas en Google Cloud Console:**
- `http://localhost:8080/google-callback` (desarrollo)
- `https://taimbox.com/google-callback` (producción)

#### Arquitectura Meta Ads OAuth (Modelo SaaS)

Mismo patrón que Google Ads: credenciales de la app en la plataforma y un token por agencia almacenado en BD.

| Credencial | Origen | Quién la gestiona |
|---|---|---|
| `META_APP_ID` | Variable de entorno en **Edge Functions** (Docker); mismo número que en Meta | **Plataforma** |
| `VITE_META_APP_ID` | Variable en **`.env` del frontend** (Vite); mismo valor que **Identificador de la aplicación** en Meta | **Plataforma** |
| `META_APP_SECRET` | Solo en **Edge Functions** (nunca en el frontend) | **Plataforma** |
| `agencies.meta_ads_access_token` | Columna en BD (token de usuario long-lived tras OAuth) | **Automático** |

Si en BD antigua quedó `settings.integrations.metaAccessToken`, el backend aún puede leerlo como respaldo; la UI ya no permite introducir token manual.

**Flujo OAuth:**
1. Configuración → Integraciones → Meta Ads → **Conectar con Meta**.
2. El frontend redirige a Facebook con `VITE_META_APP_ID`, `scope=ads_read` y `state` (identifica la agencia vía `sessionStorage`). No incluir `read_insights` en el OAuth: no es un permiso válido del diálogo de Login; el acceso a métricas de campañas publicitarias queda cubierto por `ads_read`.
3. Meta redirige a `/meta-callback?code=...` → `MetaCallbackPage.tsx` invoca `oauth-meta` con `{ code, redirect_uri, agency_id }`.
4. La Edge Function intercambia el código por token corto y luego por **long-lived token** (Graph API `oauth/access_token` con `fb_exchange_token`) y guarda el resultado en `agencies.meta_ads_access_token`.
5. Opcionalmente se llama a `list-meta-accounts` para rellenar/actualizar `ad_accounts_config` con las cuentas publicitarias (`/me/adaccounts`).
6. `sync-meta-ads` usa el token en este orden: columna `meta_ads_access_token` → (respaldo) `integrations.metaAccessToken` en JSON legado → `META_ACCESS_TOKEN` (entorno, opcional).

**Ajustes en Meta for Developers (app Taimbox):**
- **Inicio de sesión con Facebook para empresas** → Configuración: URI de redirección OAuth válidos → deben coincidir **exactamente** con el origen real de la SPA + `/meta-callback`: p. ej. `https://taimbox.com/meta-callback` y, si los usuarios entran por subdominio `www`, también `https://www.taimbox.com/meta-callback`. En local: `http://localhost:8080/meta-callback` (o el puerto que use Vite; debe ser el mismo que `window.location.origin` al pulsar "Conectar").
- **Dominios admitidos para el SDK para JavaScript:** incluir cada host desde el que se carga la app (p. ej. `taimbox.com` y, si aplica, `www.taimbox.com`; para pruebas en máquina, `localhost`).
- **Información básica → Dominios de la aplicación:** sin `http://` ni `https://`. Como mínimo `taimbox.com`. Si el tráfico entra por **www**, añade también **`www.taimbox.com`** como entrada aparte (Meta trata apex y www como hosts distintos). Para desarrollo local añade **`localhost`**. La URL del sitio puede ser `https://taimbox.com/` o `https://www.taimbox.com/` según el canónico que uses; política y condiciones (`/privacidad`, `/condiciones`) como ya están documentadas.
- **Verificación de dominio (Meta Business / Developers):** la meta `facebook-domain-verification` está en `index.html` (raíz del build Vite) para que Meta pueda comprobar la propiedad del dominio. Si Meta genera un nuevo código, sustituye el `content` en ese archivo y vuelve a desplegar el frontend.
- La URL de Supabase/API (`api.taimbox.com`) **no** debe usarse como redirect OAuth del frontend; el callback es siempre el origen de la app (`taimbox.com`, `www` si aplica, o `localhost`).

**Solución de problemas — error Meta: «No se puede cargar la URL / El dominio de esta URL no está incluido en los dominios de la aplicación»:**
1. Identifica el **host exacto** de la barra de direcciones cuando falla (p. ej. `www.taimbox.com` frente a `taimbox.com`, o `localhost:5173` en dev).
2. En **Información básica → Dominios de la aplicación**, añade ese dominio **sin puerto** (solo `localhost` para local; el puerto va en las URIs de redirección OAuth, no en "dominios de la aplicación").
3. En **Inicio de sesión con Facebook para empresas → Configuración**, añade la **URI de redirección OAuth válida** completa: `https://<mismo-host>/meta-callback` (incluido esquema `http`/`https` y puerto si no es 80/443).
4. En **Dominios admitidos para el SDK para JavaScript**, alinea los mismos hosts que en el paso 2.
5. Guarda cambios en Meta y vuelve a probar; el `redirect_uri` que envía el frontend es siempre `${window.location.origin}/meta-callback` (`AgencySettingsPage.tsx` / `MetaCallbackPage.tsx`).

**Migración SQL:** `supabase/migrations/20250322120000_meta_ads_access_token.sql` añade la columna `meta_ads_access_token` en `agencies` (ejecutar en la instancia antes de usar OAuth en producción).

**Migración SQL (cuentas Meta en BD):** `supabase/migrations/20250322140000_ad_accounts_config_unique.sql` añade `UNIQUE (account_id, agency_id, platform)` en `ad_accounts_config` para que el upsert desde `list-meta-accounts` / `sync-meta-ads` funcione.

**Verificación del negocio y App Review (Meta):** Taimbox es un SaaS: cada agencia conecta **su** cuenta publicitaria. Para que usuarios que no sean administradores de la app puedan autorizar OAuth y para **acceso avanzado** a permisos como `ads_read`, Meta suele exigir **verificación del negocio** y, según el caso, **revisión de la aplicación (App Review)**.

1. **Modo desarrollo vs producción**  
   Con la app en modo desarrollo, solo cuentas con rol en la app (admin, desarrollador, tester) o usuarios de prueba pueden completar el flujo. Para clientes reales sin rol, la app debe estar **publicada** y los permisos necesarios aprobados.

2. **Verificación del negocio (Business Verification)**  
   En [Meta for Developers](https://developers.facebook.com) → tu app → **Configuración de la aplicación** → sección relacionada con verificación / **Business Manager** (o [documentación oficial de verificación de negocio](https://developers.facebook.com/docs/development/release/business-verification)). Debes vincular la app a un **Meta Business** y completar la verificación de identidad del negocio (documentación legal, dominio, etc.). Solo administradores del negocio pueden iniciar el proceso.

3. **App Review — permiso `ads_read`**  
   En el panel: **Casos de uso** / **Permisos y funciones** (según la versión del panel) → solicitar **acceso avanzado** a `ads_read` si Meta lo marca como necesario para “acceso a datos de anuncios de otros usuarios”.  
   Meta suele pedir: **política de privacidad** y **condiciones** públicas (ya enlazadas en Información básica), **vídeo o capturas** del flujo real (login → Configuración → Integraciones → Conectar Meta → callback), e **instrucciones de prueba** (URL `https://taimbox.com`, cuenta de prueba o pasos para revisor). Redacta en inglés si el formulario lo exige.

4. **Qué decir en la descripción del caso de uso**  
   Ejemplo: *“Taimbox is a B2B workforce planning platform. Agencies connect their own Meta Ads account via OAuth to read campaign spend and performance for reporting. We only request `ads_read`. Data is stored per agency and used only inside the app.”*

5. **Tras la aprobación**  
   Publica los cambios en la app si el panel lo pide y comprueba el flujo con una cuenta que **no** sea admin de la app.

### 5.3. Suscripciones (Stripe)

Sistema de planes **Starter** (gratis), **Pro** (49 €/mes early adopter, 99 €/mes estándar) y **Business** (149 €/mes early adopter, 249 €/mes estándar). Plan **Enterprise** (personalizado, sin límite). Nuevos registros reciben trial Business 14 días. **Un solo trial por agencia.** Los precios early adopter se congelan de por vida para el cliente (grandfathering vía `price_id` en Stripe).

- **Campos en `agencies`:** `plan_id` (starter/pro/business/enterprise), `subscription_status`, `stripe_customer_id`, `stripe_subscription_id`, `trial_ends_at`, `subscription_period_ends_at`, `subscription_cancel_at_period_end`, `trial_used_at`.
- **Config de planes:** `src/config/plans.ts`. Límites: Starter 5 emp + histórico 2 meses (`limitHistoryToTwoMonths`), Pro 20 emp, Business 50 emp, Enterprise ilimitado. **Starter incluye cronómetro** (`timeTracker: true`). `/tiempos` ya no requiere Pro. Módulos PPC (Ads) solo en Business/Enterprise.
- **Flujo:** El usuario entra en Configuración → Plan y facturación; la app llama a `create-checkout-session` con `agency_id`, `price_id` y `plan_id`. La función crea o recupera el Customer en Stripe, crea una sesión de Checkout y devuelve la URL. Si ya existe una suscripción activa, la función actualiza la suscripción directamente (sin Checkout) previo **diálogo de confirmación** en el frontend (`AgencyBillingTab`). Si el usuario está en trial Business y cambia a Pro, el diálogo avisa que la **prueba terminará inmediatamente** y se cobrará Pro. Tras el pago, Stripe envía webhooks; `stripe-webhook` actualiza `plan_id`, `subscription_status`, `trial_ends_at` y `subscription_period_ends_at` en `agencies`. En Plan y facturación se muestran estado de la suscripción, días restantes de prueba (trialing), próxima facturación y días restantes del periodo (suscripción activa). Si la suscripción está en **`past_due`**, se muestra un banner naranja con CTA para actualizar el método de pago. **Cancelar o gestionar suscripción:** botón "Gestionar suscripción / Cancelar" (visible en planes Pro/Business con `stripe_customer_id`) que llama a `create-billing-portal-session` (body: `agency_id`); la función crea una sesión del Stripe Customer Portal y devuelve la URL; el usuario es redirigido al portal donde puede actualizar tarjeta, ver facturas o cancelar (al cancelar, Stripe envía `customer.subscription.deleted` y el webhook hace downgrade a Starter).
- **Límites y soft-lock:** Definidos en `src/config/plans.ts`. Starter: 5 empleados, histórico Inteligencia/Reportes 30 días. Pro: 20 empleados. Business: 50 empleados. El hook `useSubscriptionLimits` expone `isOverLimit`, `isSoftLocked`, `canAddEmployee`, `canAccessRouteByPlan`. Incluye **safety net client-side**: si `subscription_status === 'trialing'` y `trial_ends_at` ya pasó, trata como Starter aunque el webhook no haya llegado. Si la agencia excede el límite de su plan, la app entra en modo solo lectura: `SubscriptionSoftLockBanner` (banner rojo), bloqueo de altas en `TeamPage`, y **bloqueo de escritura en el planificador** (`useAllocationActions`: add, edit, delete, toggle, move tareas).
- **Texto condicionado por `trialUsedAt`:** El botón Business en `AgencyBillingTab` muestra "14 días de prueba" solo si `trialUsedAt` es `null`. El campo se mapea desde `trial_used_at` en `SupabaseAgency` → `trialUsedAt` en `Agency` (vía `AgencyContext.mapSupabaseAgency`).
- **Rutas por plan:** `PlanGuard` redirige a Plan y facturación si el plan no incluye la ruta (ej. /operaciones, /ads, /api-keys requieren Business; /weekly-forecast, /okrs, /tiempos requieren Pro).
- **Variables de entorno (Edge Functions):** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`. Opcional: `CHECKOUT_BASE_URL` (default `https://taimbox.com`). Frontend: `VITE_STRIPE_PRICE_ID_PRO` y `VITE_STRIPE_PRICE_ID_BUSINESS` para los botones de checkout.

#### Variables de entorno requeridas

**En el contenedor `supabase-edge-functions`** (Docker):
```
SUPABASE_URL=http://kong:8000
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
GOOGLE_CLIENT_ID=<client_id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-<secret>
GOOGLE_DEVELOPER_TOKEN=<developer_token>
META_APP_ID=<facebook_app_id>
META_APP_SECRET=<facebook_app_secret>
RESEND_API_KEY=<resend_api_key>
RESEND_FROM_EMAIL=Taimbox <no-reply@taimbox.com>
```

Opcional (solo lectura / pruebas sin OAuth por agencia): `META_ACCESS_TOKEN`.

**En el frontend** (`.env` de Vite en la raíz del proyecto, **no** en el Docker de Supabase):
```
VITE_GOOGLE_CLIENT_ID=<mismo_client_id>.apps.googleusercontent.com
VITE_META_APP_ID=<identificador_de_la_aplicacion_meta>
```

**Valores exactos para Meta (copiar desde el panel):** en [Meta for Developers](https://developers.facebook.com) → tu app → **Configuración de la aplicación** → **Información básica**. El campo **Identificador de la aplicación** (solo dígitos) es el valor de `META_APP_ID` y de `VITE_META_APP_ID` (el mismo número en ambos sitios). La **Clave secreta de la aplicación** (botón *Mostrar*) es **solo** `META_APP_SECRET` en el contenedor de Edge Functions; no la subas al repo ni al build del frontend.

**Dónde van en Docker:** las variables del bloque “contenedor `supabase-edge-functions`” se definen donde ya tienes `GOOGLE_CLIENT_ID` (por ejemplo `.env` junto al `docker-compose` de Supabase, o `environment:` del servicio `functions`). Ahí añade `META_APP_ID`, `META_APP_SECRET` y reinicia ese contenedor. `VITE_META_APP_ID` no se pone en Docker de funciones: va en el `.env` local/CI del **proyecto Vite** y se inyecta al hacer `npm run build`.

#### Despliegue de Edge Functions (self-hosted)

El entorno usa Supabase self-hosted con Docker. El contenedor `supabase-edge-functions` lee las funciones desde un volumen montado. Rutas por defecto: Taimbox `~/Taimbox`, Supabase `~/supabase-pi/supabase/docker`. El script `supabase/scripts/deploy-edge-functions-supabase-pi.sh` hace rsync de `supabase/functions/` al volumen y reinicia el servicio `functions`.

**Comandos para desplegar (en el servidor, copiar y pegar):**
```bash
cd ~/Taimbox
git pull
chmod +x supabase/scripts/deploy-edge-functions-supabase-pi.sh
./supabase/scripts/deploy-edge-functions-supabase-pi.sh
```

Si el proyecto está en otra ruta o Supabase en otro sitio: `export TIMBOXING_DIR=/ruta/Taimbox` y `export SUPABASE_DOCKER_DIR=/ruta/supabase-pi/supabase/docker` antes de ejecutar el script.

**Resumen una línea:** `cd ~/Taimbox && git pull && chmod +x supabase/scripts/deploy-edge-functions-supabase-pi.sh && ./supabase/scripts/deploy-edge-functions-supabase-pi.sh`

**Para una sola función (más rápido):**
```bash
cp -r ~/Taimbox/supabase/functions/<nombre-funcion> \
      ~/supabase-pi/supabase/docker/volumes/functions/ \
   && docker restart supabase-edge-functions
```

**Verificar variables de entorno del contenedor:**
```bash
docker inspect supabase-edge-functions --format '{{range .Config.Env}}{{println .}}{{end}}' | grep GOOGLE
```

**Verificar logs:**
```bash
docker logs supabase-edge-functions --tail 50 -f
```

#### Solución de problemas: 503 Service Unavailable

Si al vincular **Google Ads**, **Meta Ads** o listar cuentas aparece **503 (Service Unavailable)** en `oauth-google-ads`, `list-google-accounts`, `oauth-meta` o `list-meta-accounts`, suele deberse a:

1. **Funciones no desplegadas o desactualizadas**  
   Asegúrate de haber copiado las funciones al volumen y reiniciado el contenedor (ver comandos de despliegue arriba).

2. **Variables de entorno faltantes en el contenedor**  
   Las funciones necesitan en el contenedor `supabase-edge-functions`:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (para `oauth-google-ads`)
   - `GOOGLE_DEVELOPER_TOKEN` (para `list-google-accounts`)
   - `META_APP_ID`, `META_APP_SECRET` (para `oauth-meta` / Meta Ads)  
   Si falta alguna, la función puede fallar antes de devolver una respuesta controlada y el runtime devuelve 503.

3. **Crash no capturado**  
   Si el body de la petición está vacío o no es JSON válido, las funciones devuelven **400** con mensaje claro. Si aun así ves 503, revisa los logs del contenedor para ver el stack trace.

4. **DNS / «name resolution failed» (Meta Ads, Google, listados)**  
   Si el body del error o los logs mencionan **`name resolution failed`** o fallos al resolver `graph.facebook.com` / `googleapis.com`, el contenedor **`supabase-edge-functions`** no está resolviendo nombres correctamente (común en Docker con DNS del host defectuoso o redes aisladas). El frontend reintenta automáticamente algunas llamadas ante 503, pero hay que corregir la red:
   - En el `docker-compose` del servicio `functions`, añadir DNS públicos, p. ej.:
     ```yaml
     dns:
       - 8.8.8.8
       - 8.8.4.4
     ```
   - Reiniciar: `docker compose up -d functions` (o el comando equivalente en tu stack).
   - Comprobar desde el contenedor: `docker exec -it supabase-edge-functions wget -qO- --timeout=5 https://graph.facebook.com/v21.0/ 2>&1 | head` (o `curl` si está instalado). Si falla por DNS, el problema es de resolución, no de código.
   - Asegurar también que `SUPABASE_URL` sea alcanzable **desde dentro** del contenedor (p. ej. `http://kong:8000` en la red Docker de Supabase); si el runtime no puede resolver `kong`, el cliente de Supabase fallará al guardar el token tras OAuth.
   - **Vite en local:** el hot reload puede remontar la página de Configuración y repetir muchas veces la llamada a `list-google-accounts`. El frontend **deduplica** la petición por `agency_id`, aplica un **debounce** y solo carga el listado cuando la pestaña **Integraciones** está activa, para no saturar la API mientras el 503 persiste en el servidor.

**Comprobar en el servidor:**
- Que existan las carpetas `oauth-google-ads` y `list-google-accounts` dentro del volumen de functions.
- Que el contenedor tenga las variables anteriores (`docker inspect ... | grep GOOGLE` y comprobar SUPABASE_*).
- Reproducir el error y ejecutar `docker logs supabase-edge-functions --tail 100` para ver el error exacto.

#### Solución de problemas: HTTP 000, 404 y 301 al probar Edge Functions

Al hacer `curl` a las funciones, los códigos indican lo siguiente:

| Código | Significado | Acción |
|--------|-------------|--------|
| **HTTP:000** | Conexión fallida (timeout, conexión rechazada). El Edge Runtime no responde. | 1) Verificar IP del contenedor: `docker inspect supabase-edge-functions --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'`. 2) Comprobar que el contenedor está levantado: `docker ps \| grep edge-functions`. 3) Revisar logs: `docker logs supabase-edge-functions --tail 100` — si hay `shutdown signal received: 15` en bucle, el contenedor se reinicia; revisar que exista la carpeta `main` en `volumes/functions/` (el Edge Runtime la requiere). |
| **HTTP:404** | Kong responde pero la ruta no existe. | Verificar que Kong enruta a `/functions/v1/` y que el puerto expuesto es el correcto (típicamente 8000). Probar también contra la URL pública con HTTPS. |
| **HTTP:301** | Redirección (p. ej. HTTP → HTTPS). | Usar **HTTPS** en la URL: `https://api.taimbox.com/functions/v1/oauth-google-ads` en lugar de `http://`. |

**Prueba recomendada con HTTPS y anon key real:**

```bash
curl -s -w "\nHTTP:%{http_code}" -X POST \
  https://api.taimbox.com/functions/v1/oauth-google-ads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_ANON_KEY_REAL" \
  -d '{"code":"x","redirect_uri":"https://taimbox.com/google-callback","agency_id":"60eb6a6f-c3ec-4b52-b9bb-3cb1886ad892"}'
```

- Si devuelve **400** con mensaje de error (p. ej. "Falta el código" o "Google devolvió...") → la función **sí está alcanzable**; el problema es el flujo OAuth o los datos enviados.
- Si devuelve **503** → Kong no puede alcanzar el Edge Runtime; revisar que el contenedor `supabase-edge-functions` esté estable y que Kong tenga la ruta correcta a `functions:9000`.

#### Solución de problemas: Edge Runtime reiniciándose en bucle (SIGTERM → 503)

Si los logs muestran `main function started` seguido de `shutdown signal received: 15` en bucle, el contenedor se reinicia continuamente y no llega a servir peticiones. Kong devuelve 503 porque el upstream no responde.

**Síntomas:** `docker logs supabase-edge-functions --tail 50` muestra el patrón repetido; `docker ps` indica "Up X minutes" (el contenedor lleva poco tiempo reiniciado).

**Causas habituales y soluciones:**

1. **Health check fallando**  
   El docker-compose oficial de Supabase no define healthcheck para `functions`, pero si usas una variante (p. ej. supabase-pi) que sí lo tenga, puede estar fallando. Comprobar:
   ```bash
   docker inspect supabase-edge-functions --format '{{json .Config.Healthcheck}}'
   ```
   Si hay healthcheck y falla, opciones:
   - Aumentar `start_period` y `interval` en el docker-compose del servicio `functions`.
   - Comentar o eliminar el healthcheck temporalmente para verificar si el contenedor se estabiliza.

2. **Memoria insuficiente (Raspberry Pi / máquinas con poca RAM)**  
   El Edge Runtime usa ~150 MB por worker. En un Pi con varios servicios Supabase, la memoria puede agotarse y el sistema puede terminar el proceso.
   - Revisar RAM libre: `free -h`
   - Reducir servicios que no uses (p. ej. analytics, storage) si es posible.
   - Aumentar swap: `sudo dphys-swapfile swapoff && sudo nano /etc/dphys-swapfile` (cambiar `CONF_SWAPSIZE` a 2048) y `sudo dphys-swapfile setup && sudo dphys-swapfile swapon`.

3. **Probar sin healthcheck (diagnóstico)**  
   Editar el `docker-compose.yml` del servicio `functions` y comentar o eliminar el bloque `healthcheck` si existe. Luego:
   ```bash
   cd ~/supabase-pi/supabase/docker
   docker compose up -d functions
   docker logs supabase-edge-functions -f
   ```
   Si el contenedor deja de reiniciarse, el problema era el healthcheck.

4. **Verificar que el main responde**  
   Con el contenedor estable, desde el host:
   ```bash
   FUNC_IP=$(docker inspect supabase-edge-functions --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
   curl -s -w "\nHTTP:%{http_code}" -m 5 "http://${FUNC_IP}:9000/_internal/health"
   ```
   Debe devolver `{"message":"ok"}` y HTTP:200.

5. **Workaround: usar contenedor manual**  
   Si el contenedor de Compose sigue en bucle y las causas anteriores no aplican, levantar el Edge Runtime manualmente. Kong enruta a `functions:9000`, así que el contenedor debe llamarse `functions` para que resuelva en la red.

   **Importante:** No usar `--env-file .env` porque el `.env` tiene nombres como `SERVICE_ROLE_KEY` y la función espera `SUPABASE_SERVICE_ROLE_KEY`. Hay que pasar las variables explícitamente:

   ```bash
   cd /home/alex/supabase-pi/supabase/docker
   docker stop supabase-edge-functions 2>/dev/null
   docker rm -f functions 2>/dev/null

   set -a
   source .env
   set +a

   docker run -d --name functions \
     -v /home/alex/supabase-pi/supabase/docker/volumes/functions:/home/deno/functions:Z \
     --network supabase_default \
     -e SUPABASE_URL=http://kong:8000 \
     -e SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY" \
     -e SUPABASE_ANON_KEY="$ANON_KEY" \
     -e JWT_SECRET="$JWT_SECRET" \
     -e SUPABASE_DB_URL="postgresql://postgres:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}" \
     -e GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID" \
     -e GOOGLE_CLIENT_SECRET="$GOOGLE_CLIENT_SECRET" \
     -e GOOGLE_DEVELOPER_TOKEN="$GOOGLE_DEVELOPER_TOKEN" \
     -e STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
     -e STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" \
     -e RESEND_API_KEY="$RESEND_API_KEY" \
     -e RESEND_FROM_EMAIL="${RESEND_FROM_EMAIL:-Taimbox <no-reply@taimbox.com>}" \
     -e VERIFY_JWT="${FUNCTIONS_VERIFY_JWT:-true}" \
     supabase/edge-runtime:v1.69.28 \
     start --main-service /home/deno/functions/main
   ```

   Ajustar la ruta `/home/alex/` si el usuario o la instalación son distintos.

   Verificar que responde: `curl -s https://api.taimbox.com/functions/v1/hello -H "Authorization: Bearer ANON_KEY"` debe devolver algo distinto de 503. O probar `oauth-google-ads` con un código de prueba: si devuelve 400 con "Google Error: Malformed auth code" → la función está operativa.

   Para volver al contenedor de Compose:
   ```bash
   docker stop functions
   docker rm functions
   docker compose up -d functions
   ```

   Si tras volver a Compose el bucle reaparece, mantener el contenedor manual como solución estable. Puedes crear un script `start-functions-manual.sh` con el bloque anterior para ejecutarlo tras reinicios del servidor.

#### Solución de problemas: Google OAuth y API Google Ads

- **`unauthorized_client` / "Refresh token no válido para este Client ID/Secret"**  
  El refresh token guardado en la agencia se generó con **otro** OAuth Client (otro Client ID/Secret en Google Cloud) distinto al configurado en las variables de entorno del contenedor. Solución: en la app, **desvincular** la cuenta de Google Ads y **volver a vincular**; así se obtiene un refresh token con el Client ID/Secret actual. Asegúrate de que en el contenedor solo haya un juego de credenciales y que coincidan con el proyecto OAuth usado en el flujo de consentimiento.

- **"Google devolvió una página HTML" / "Unexpected token '<', \"<!DOCTYPE\"..."**  
  La llamada a Google (intercambio de token o Google Ads API) está devolviendo una página de error HTML en lugar de JSON. Posibles causas:
  - **Intercambio de token**: mismo origen que `unauthorized_client`; desvincular y vincular de nuevo.
  - **Google Ads API**: comprueba que `GOOGLE_DEVELOPER_TOKEN` sea el token de **cuenta de desarrollador de Google Ads** (aprobado o en modo test). Con cuenta MCC, la sync usa `login-customer-id` y obtiene MCC + subcuentas vía `customer_client`; si no ves datos, revisa los logs de la sync (cada cuenta muestra "X campañas" o "0 campañas con datos en el rango").

#### Crear una nueva Edge Function

1. Crear carpeta en `supabase/functions/<nombre>/index.ts`.
2. Seguir la estructura estándar (ver `exchange-google-token` como referencia):
   - Import de Supabase: `import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'`
   - Headers CORS
   - `Deno.serve(async (req) => { ... })`
   - Crear cliente Supabase con `SUPABASE_SERVICE_ROLE_KEY`
3. Añadir la función al script `deploy-functions.sh`.
4. Copiar al volumen de Docker y reiniciar `supabase-edge-functions`.
5. La función estará accesible en `<SUPABASE_URL>/functions/v1/<nombre>`.

> **⚠️ IMPORTANTE**: Los lints de VS Code sobre `Deno`, `esm.sh` y tipos implícitos `any` en archivos de Edge Functions son **esperados** — el IDE no tiene los tipos de Deno instalados. Estos errores no afectan al runtime en el servidor.

## 6. Glosario de Variables y Términos Técnicos

| Término | Ubicación Común | Significado |
|:--- |:--- |:--- |
| `RLS` | Supabase / DB | Row Level Security. Filtra datos para que cada agencia solo vea los suyos. |
| `RBAC` | `usePermissions.ts` | Role-Based Access Control. Control de acceso por nombre de rol configurado. |
| `micros` | `ads-worker.js` | Formato monetario de Google (1€ = 1,000,000 micros). |
| `slug` | `agencies` | Nombre único en la URL para identificar una agencia. |
| `weekStartsOn: 1` | `dateUtils.ts` | Configura el Lunes como primer día de la semana. |
| `hoursComputed` | `AppContext` | Horas finales validadas que impactan en la rentabilidad. |

---

## 7. Mantenimiento y Extensión

- **Añadir una nueva tabla**: 
    1. Crear en Supabase.
    2. Habilitar RLS con `agency_id` (o filtrar por relación, ej. vía `project_id` → `projects.agency_id` como en `deadlines`).
    3. Actualizar `src/types/index.ts`.
    4. Añadir lógica de carga en `AppContext.tsx` (o utilidad específica como `deadlineUtils.ts` si la carga es por entidad y por agencia).

- **UX Premium – Planificador (AllocationSheet)**  
  La barra del planificador debe transmitir claridad y control (herramienta premium). **Implementado:** (1) Botón Ordenar muestra el criterio actual (ej. "Ordenar: Horas contratadas (Mayor)") sin abrir el menú. (2) Vista Semana/Mes con texto "Semana" | "Mes" siempre visible junto al icono. (3) Línea de contexto bajo la toolbar: "Viendo la semana del X al Y" o "Viendo todo el mes · N semanas". (4) Placeholder de búsqueda "Buscar tarea o proyecto..." y tooltip explicativo. (5) Tooltips de Timeline y Previsión semanal explican el *por qué* (comparar cargas, cierre de semana). (6) Menú contextual: en vista semanal el botón es "Ordenar" y no muestra "Proyectos expandidos"; en vista mensual es "Vistas" e incluye esa opción. **Hoja de ruta futura:** estados de carga con copy orientado a la tarea ("Preparando tu planificación de marzo..."); empty state con CTA claro ("Añade una tarea con + en cualquier proyecto"); atajos de teclado documentados en tooltips (ej. flechas para cambiar mes); indicador discreto de "Preferencia guardada" al cambiar orden/expandir; posible botón primario "Añadir tarea" en header cuando la semana está vacía.

- **Aislamiento por agencia (multi-tenant)**  
  Todas las lecturas/escrituras deben acotarse a la agencia actual para no mostrar datos de una agencia en otra.
  - **Tablas con columna `agency_id`** (filtrar siempre por `agency_id` en queries e inserts): `agencies`, `employees`, `clients`, `projects`, `ad_accounts_config`, `ads_sync_logs`, `meta_sync_logs`, `meta_ads_campaigns`, `google_ads_campaigns`, `global_assignments`, `task_transfers`, `department_config`, `user_agencies`, `audit_logs`, `team_events`, `client_settings`, `segmentation_rules`.
  - **Tablas sin `agency_id` que se filtran por join**: `deadlines` (join con `projects.agency_id` vía `fetchDeadlinesForMonth(monthKey, agencyId)`), `professional_goals` (join con `employees.agency_id` en GoalsContext), `user_routines` (join con `employees.agency_id` en AppContext), `allocations` y `absences` (join con `employees.agency_id`).  
  - **Tablas sin uso en la app** (solo API/workers o deprecadas): `google_ads_changes` (no referenciada en el codebase). La tabla `time_entries` se usa desde la UI con el módulo **Cronómetro de tareas** (RPC `log_timer_hours`); máximo 24 h por entrada (límite efectivo por agencia). La tabla `active_timers` almacena el timer activo por empleado (1 fila por empleado); RLS por `auth.uid()`. La tabla **`timer_sessions`** (append-only) guarda cada cierre de cronómetro con `start_time`/`end_time` exactos para webhooks e integraciones (p. ej. Perfex CRM).

- **Arquitectura híbrida del cronómetro (drift y sincronización multi-pestaña)**  
  El módulo de cronómetro evita desfase temporal y minimiza lecturas a Supabase mediante dos decisiones de arquitectura documentadas en `src/hooks/useTaskTimer.ts` y `src/hooks/useActiveTimerForSidebar.ts`. **Evitar drift (pestaña en segundo plano):** Los navegadores pueden limitar `setInterval` a ~1 ejecución por minuto en pestañas inactivas, lo que retrasaría el tiempo mostrado. La solución es calcular el tiempo transcurrido a partir de una marca absoluta: se mantiene una ref `absoluteStartTimeRef` (timestamp de inicio). En cada tick del intervalo se calcula `elapsed = floor((Date.now() - absoluteStartTimeRef) / 1000)` en lugar de incrementar un contador. Esa ref se ancla en `loadFromDb` cuando se detecta un timer activo (origen = now - diffSeconds) y en `startTimer` (origen = Date.now()). Así el cronómetro no se desfasa aunque la pestaña esté minimizada. **Minimizar lecturas a la base de datos:** En lugar de hacer polling frecuente a `active_timers` desde cada pestaña, se usa el patrón "eventos prioritarios + polling de red de seguridad". Al iniciar o parar un cronómetro se emiten: (1) `window.dispatchEvent(CustomEvent('timeboxing_timer_started' | 'timeboxing_timer_stopped'))` para la misma pestaña; (2) `BroadcastChannel('timer_sync').postMessage('update')` para el resto de pestañas del mismo origen. El sidebar y la página Tiempos escuchan ambos tipos de eventos y recargan estado al instante. El polling a Supabase (p. ej. `get_team_active_timers`, estado del timer en sidebar) se hace cada 60 segundos como red de seguridad por si un evento no se recibió (otra máquina, pestaña cerrada, etc.). Consumidores: `useActiveTimerForSidebar`, `TiemposPage.tsx`, y cualquier vista que muestre "quién está registrando tiempo". Al tocar esta lógica, mantener coherencia entre eventos emitidos en `useTaskTimer`/`useActiveTimerForSidebar.stopCurrentTimer` y listeners en sidebar y Tiempos. **Visualización en tiempo real en el Sidebar:** El tiempo activo del cronómetro en el Sidebar debe avanzar segundo a segundo sin aumentar peticiones a Supabase. En `src/components/layout/Sidebar.tsx` se mantiene un `setInterval` local de 1000 ms que calcula la diferencia entre `Date.now()` y un anchor derivado de `elapsedSeconds` del hook (`startedAtRef`). Ese estado local (`displayElapsedSeconds` / `formattedLiveTime`) es lo que se pinta; el intervalo se limpia con `clearInterval` al desmontar o cuando el timer deja de estar activo.

- **Evitar recargas al cambiar de pestaña (patrón useRef en contextos)**  
  Al cambiar de pestaña del navegador, Supabase Auth puede refrescar el token o re-emitir el evento de sesión (`onAuthStateChange`), lo que actualiza el objeto `user`/`session` en memoria (nueva referencia). Si los contextos reaccionan a esa referencia, se disparan fetches masivos (user_agencies, employees, agencies, etc.) sin necesidad. **AuthContext** se deja intacto: debe seguir recibiendo y guardando la nueva sesión para que el JWT esté siempre fresco y las peticiones con RLS no fallen con 401. Para evitar la cascada de fetching, en **AgencyContext** se usa un `prevUserIdRef`: en el `useEffect` que llama a `fetchAgencyForUser`, si `user.id` es igual a `prevUserIdRef.current` y ya existe `currentAgency`, se hace un return temprano y no se ejecuta el fetch. En **AppContext** se usa un `prevAuthUserIdRef` en el `useEffect` que vincula empleado con usuario Auth: si el id del usuario actual ya fue procesado y hay usuario vinculado, se hace return temprano. Así se evitan recargas masivas al cambiar de pestaña sin interferir con la actualización del token en AuthContext.

- **Row Level Security (RLS) y tokens API**  
  En la base de datos (Supabase), **todas las tablas públicas** tienen RLS habilitado. El acceso se controla mediante la función SQL `user_agency_ids()` (reemplaza a la anterior `requesting_agency_id()`), que:
  1. Si la petición lleva un JWT de **API** con claim `agency_id` → devuelve solo esa agencia.
  2. Si es un **usuario normal** (sin ese claim) → devuelve **todas** las agencias del usuario desde `user_agencies` (sin depender de `is_primary`).
  
  La función anterior `requesting_agency_id()` solo devolvía **una** agencia (la primaria), lo que causaba que usuarios con múltiples agencias o con `is_primary = false` no pudieran operar en la agencia correcta. `user_agency_ids()` devuelve un `SETOF uuid` con todas las agencias, y las políticas RLS usan `IN (SELECT user_agency_ids())` en lugar de `= requesting_agency_id()`. El campo `is_primary` solo afecta a la UI (agencia por defecto al login), no a la seguridad.

  **Tabla `api_tokens`**: Almacena metadatos de tokens API emitidos (hash SHA-256, permisos, expiración). El JWT real solo se muestra una vez al crearlo.

  **Revocación y expiración con efecto inmediato**: Por defecto, al revocar un token solo se pone `is_active = false` en la BD; el JWT sigue siendo válido hasta que expire. Para que la revocación niegue el acceso al instante, la función `requesting_agency_id()` debe comprobar si el token está revocado y devolver `NULL` en ese caso. También puede verificarse `expires_at` en la BD además de la validación automática del claim `exp` del JWT.

  **Aplicar permisos readonly/readwrite**: Por defecto, las políticas RLS solo verifican `agency_id`, no el claim `permissions` del JWT. Para que tokens con `permissions='readonly'` no puedan hacer INSERT/UPDATE/DELETE, la BD debe tener la función `can_write_via_api()` y las políticas RLS de INSERT/UPDATE/DELETE deben comprobarla. Las tablas con `agency_id` directo, vía `employee_id` o vía `project_id` deben tener políticas coherentes con ese tipo.

  **Edge Functions relacionadas**:
  - `generate-api-token`: Recibe `{ agency_id, name, permissions?, expires_in_days? }` del admin autenticado, firma un JWT con claim `agency_id` y `sub` = id del registro en `api_tokens`, guarda el hash en `api_tokens` y devuelve el JWT.
  - `revoke-api-token`: Recibe `{ token_id }`, verifica que el caller es admin de la agencia dueña y marca `is_active = false`. El acceso se deniega en la siguiente petición solo si está aplicado el script anterior.

  **Políticas RLS por tipo de tabla**:
  | Tipo | Tablas | Política |
  |------|--------|----------|
  | `agency_id` directo | agencies, employees, clients, projects, global_assignments, task_transfers, department_config, ad_accounts_config, ads_sync_logs, meta_sync_logs, google_ads_campaigns, meta_ads_campaigns, team_events, client_settings, segmentation_rules, audit_logs, api_tokens, user_agencies | `agency_id IN (SELECT user_agency_ids())` |
  | Vía `employee_id` (por agencia) | allocations, absences, professional_goals, time_entries | `employee_id IN (SELECT e.id FROM employees e WHERE e.agency_id IN (SELECT user_agency_ids()))` |
  | Vía `employee_id` (por usuario) | active_timers, timer_sessions | Políticas por `auth.uid()` = `employees.user_id`. No dependen de agencia. |
  | Vía `project_id` | deadlines, project_editing_locks | `project_id IN (SELECT p.id FROM projects p WHERE p.agency_id IN (SELECT user_agency_ids()))` |
  | Política “no access” | google_ads_changes | Política `no_access_until_use` con USING (false) y WITH CHECK (false): nadie puede leer ni escribir. Cuando se confirme uso, sustituir por políticas por agency_id. |

  **Tabla `agencies` (solo lectura vía API)**: Para impedir que integradores creen agencias por API, conviene revocar `INSERT` en `public.agencies` para los roles `anon` y `authenticated`. La creación de agencias debe hacerse desde la app (registro/onboarding) o con service_role.

  **Funciones y `search_path`**: Las funciones en `public` deben tener `search_path` fijado (`pg_catalog`, `public`) para evitar "search path hijacking".

  **Índices**: Las claves foráneas sin índice pueden generar "Unindexed foreign keys" en auditorías; conviene añadir índices donde haga falta. Revisar también índices duplicados por tabla.

  **Importante**: El `service_role` key bypasea RLS. Las edge functions y workers que usan `SUPABASE_SERVICE_ROLE_KEY` no se ven afectados.

  **Solución de problemas: Un usuario no puede guardar cambios al editar tareas (allocations)**  
  Si como administrador los cambios se ven al momento pero para un usuario concreto (p. ej. un empleado) el valor no persiste (vuelve al anterior al guardar o al refetch), la causa suele ser RLS o la vinculación usuario–empleado.

  1. **Revisar políticas RLS UPDATE de `allocations`**  
     En Supabase → SQL Editor: `SELECT * FROM pg_policies WHERE tablename = 'allocations' AND cmd = 'UPDATE'`. La política debe usar `employee_id IN (SELECT e.id FROM employees e WHERE e.agency_id IN (SELECT user_agency_ids()))`. Si sigue usando `requesting_agency_id()`, actualizarla.

  2. **Comprobar vinculación usuario → agencia**  
     La tabla `user_agencies` debe tener al menos una fila con `user_id` = UUID de Auth del usuario afectado y `agency_id` de la agencia en la que trabaja. La función `user_agency_ids()` devuelve todas las `agency_id` de `user_agencies` para el usuario autenticado. El empleado asociado a la tarea (`allocations.employee_id`) debe pertenecer a una agencia que aparezca en `user_agency_ids()`.  
     **Consulta útil**: `SELECT ua.user_id, ua.agency_id, ua.is_primary FROM user_agencies ua JOIN auth.users u ON u.id = ua.user_id WHERE u.email = 'correo@ejemplo.com';`. Comprobar que existe al menos una fila para la agencia correcta.

  3. **Comportamiento en el frontend**  
     En `AppContext.updateAllocation` se hace `.update(...).eq('id', patch.id).select('id')`. Si la respuesta devuelve 0 filas (RLS impidió el update), se revierte el estado local y se muestra el mensaje: "No se pudo guardar la tarea. Comprueba que tienes permiso para editarla." Así el usuario no ve un cambio que desaparece sin explicación.

  4. **Tipo de columna `hours_assigned` (solo si los decimales no se guardan para todos)**  
     Si en el futuro se reporta que las horas decimales (p. ej. 4,5) se truncan a entero para todos los usuarios, comprobar en la BD que `allocations.hours_assigned` es de tipo `numeric` (o `decimal`), no `integer`. Si es integer, cambiar con `ALTER TABLE allocations ALTER COLUMN hours_assigned TYPE numeric USING hours_assigned::numeric;`.

  **Supabase self-hosted (sin Supabase Cloud)**  
  No se usa `supabase login` ni `supabase functions deploy`: el login es solo para la cuenta de Supabase Cloud. **Convención del proyecto:** script `supabase/scripts/deploy-edge-functions-supabase-pi.sh`; rutas por defecto: Taimbox `$HOME/Taimbox`, Supabase docker `$HOME/supabase-pi/supabase/docker`, servicio `functions`. Flujo: (1) Crear el script en el servidor (heredoc más abajo); (2) Tener `supabase/functions/` en el servidor (p. ej. `~/Taimbox/supabase/functions/`); (3) Ejecutar `./supabase/scripts/deploy-edge-functions-supabase-pi.sh` desde `~/Taimbox`. **Comandos listos para pegar (en el servidor):** `cd ~/Taimbox && git pull && chmod +x supabase/scripts/deploy-edge-functions-supabase-pi.sh && ./supabase/scripts/deploy-edge-functions-supabase-pi.sh`. Si las rutas son distintas: `export TIMBOXING_DIR=/ruta/Taimbox` y `export SUPABASE_DOCKER_DIR=/ruta/supabase-pi/supabase/docker` antes de ejecutar el script. **Crear el script la primera vez (heredoc):** en el servidor, pegar el bloque que crea `~/Taimbox/supabase/scripts/deploy-edge-functions-supabase-pi.sh` (mkdir -p, cat > ... << 'ENDOFFILE', contenido del script bash que hace rsync de `FUNCTIONS_SOURCE` a `VOLUMES_FUNCTIONS` y `docker compose restart functions`, ENDOFFILE, chmod +x); el script está versionado en el repo en `supabase/scripts/deploy-edge-functions-supabase-pi.sh`, por lo que normalmente basta con `git pull` y ejecutarlo.
  Alternativa manual: (1) Copiar la carpeta `supabase/functions/` al host del Edge Runtime; (2) Arrancar el Edge Runtime con esa ruta; (3) Configurar el proxy para `.../functions/v1/<nombre-funcion>`; (4) Definir variables de entorno. Tras cambios, actualizar archivos y reiniciar el contenedor.

  **Página de gestión**: `src/pages/ApiKeysPage.tsx` (ruta `/api-keys`, requiere permiso `can_access_api_keys`). Permite crear, listar y revocar tokens API. Enlace en Sidebar bajo "Configuración" (visible solo si el rol tiene ese permiso). La ruta `/soporte` (ContactSupportPage) requiere `can_access_support`. Ambos permisos son configurables por rol en Configuración de agencia → Equipo y permisos → sección "Configuración y soporte" (junto con Configuración de Agencia).
  **Menú Configuración (Sidebar)**: El grupo "Configuración" del Sidebar (`Sidebar.tsx`) muestra: Configuración de agencia (`/agency`), Mis Agencias (`/agencies`, solo si `can_access_agency_settings`), API & Integraciones (`/api-keys`), Soporte (`/soporte`). Gestionar miembros se accede desde Configuración de agencia → pestaña Equipo (enlace "Gestionar miembros y administradores"). Crear nueva agencia está en la página Mis Agencias (botón en cabecera). **Footer del Sidebar**: Con una sola agencia no hay dropdown de agencia; el nombre de la agencia y el selector "Vista por departamento" (Vista Global / departamentos) van en un único bloque integrado (nombre + vista en la misma línea; el nombre es enlace a `/agency` si el usuario tiene `can_access_agency_settings`). Con varias agencias, `AgencySelectorCompact` muestra solo la lista para cambiar de agencia (sin menú "Ir a Configuración"). `DepartmentViewSelector` admite prop `inline` para integrarse en esa fila cuando hay una sola agencia.

- **Área administrativa de plataforma (God Mode)**  
  Panel interno para la empresa (Taimbox), no para las agencias cliente.
  - **Tabla `platform_admins`**: `user_id` (PK), `role`, `created_at`. RLS habilitado pero **sin políticas** de lectura/escritura para `authenticated`/`anon`; nadie puede listar ni escribirse como admin desde el cliente. Solo accesible vía RPC con SECURITY DEFINER o con service_role.
  - **Semilla platform admin**: La tabla `platform_admins` y la RPC `is_platform_admin` deben existir en la BD. El primer admin se añade insertando su `auth.users.id` en `platform_admins` (INSERT idempotente con `ON CONFLICT (user_id) DO NOTHING`).
  - **AdminLayout**: Layout independiente que **no** usa AgencyContext ni AppContext. Rutas `/admin/*` se sirven con este layout y el guard `PlatformAdminRoute` (sesión + RPC `is_platform_admin`). No reutilizar componentes de la app principal que usen `useAgency()` en el área admin sin refactor presentacional.
  - **RPCs SECURITY DEFINER**: `is_platform_admin()`, `admin_list_agencies(p_search, p_status)` (devuelve también `plan_id`, `subscription_status`, `trial_ends_at` para billing), `admin_update_agency_status(p_agency_id, p_status)`, `admin_set_agency_plan(p_agency_id, p_plan_id)` (forzar plan starter/pro/business desde soporte), `admin_list_platform_admins()`, `admin_add_platform_admin_by_email(p_email, p_role)`, `admin_remove_platform_admin(p_user_id)`. Toda lectura/escritura de datos "globales" (listar agencias, cambiar estado, forzar plan, gestionar admins de plataforma) se hace mediante estas RPCs, no con consultas directas (RLS ocultaría los datos). La RPC `admin_list_agencies` devuelve columnas de billing y existe `admin_set_agency_plan`.
  - **Gestión de administradores de plataforma**: Página `/admin/admins` (AdminAdminsPage). Listar admins (email, rol, fecha), añadir por email o crear cuenta nueva con contraseña, quitar acceso. No se puede quitar al último admin. **Añadir admin**: la app llama a la Edge Function `add-platform-admin` (body: `email`, `role`, opcionales `password`, `name`). Si se envía `password` (mín. 6 caracteres), se crea el usuario en Auth con `auth.admin.createUser` y se añade a `platform_admins`; si el email ya existe, se localiza al usuario y solo se añade a `platform_admins`. Sin contraseña, el usuario debe existir en auth. La función verifica que el caller es platform admin (RPC `is_platform_admin`). La tabla `platform_admins` debe existir con `user_id`, `role`, `created_at`.
  - **Estado `suspended` en `agencies`**: Columna `status` (`active` | `suspended`). Si la agencia está suspendida, `ProtectedRoute` redirige a `/suspended` (excepto si la ruta es `/admin/*`, ya que esas rutas no exigen agencia). La página `/suspended` muestra mensaje y botón "Cerrar sesión". No documentar las RPCs `admin_*` ni `is_platform_admin` en la API pública (`/api-docs`).
  - **Dependencias**: `usePlatformAdmin`, `PlatformAdminRoute`, `AdminLayout`, `AdminAgenciesPage`, `AdminAdminsPage`, `AdminSupportPage`, `AdminMetricsPage`, `AdminDocsPage`, `SuspendedPage`, `ContactSupportPage`. Sidebar muestra "Administración" solo cuando `usePlatformAdmin().isPlatformAdmin` es true.

  - **Soporte (support_tickets):** Tabla `support_tickets` y tabla de respuestas con columna `is_internal`: respuestas con `is_internal = true` solo las ve el admin; `false` las ve la agencia. **Admin:** listado, crear ticket, cambiar estado; "Ver" abre Sheet con detalle, historial de respuestas (con etiqueta Interno / Al usuario) y formulario para añadir comentario interno o respuesta al usuario (`admin_add_support_ticket_reply` con `p_internal`). **App de usuario:** ruta `/soporte` (ContactSupportPage): "Nueva solicitud" (`create_support_ticket_from_app`); "Mis tickets" lista tickets de la agencia (`list_my_support_tickets`), "Ver" abre detalle con conversación (`get_my_support_ticket`, `list_my_support_ticket_replies` — solo respuestas no internas) y formulario para responder (`add_support_ticket_reply_from_app`). **Formato de mensajes:** Los mensajes se guardan como texto (Markdown); en UI se muestran con formato. En los formularios se usa un editor WYSIWYG (`SupportMessageEditor`, `src/components/support/SupportMessageEditor.tsx`) con barra de herramientas (negrita, cursiva, código) basado en Tiptap (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/markdown`, `@tiptap/extension-placeholder`). Al mostrar mensajes ya guardados se usa `SupportMessageContent` (`src/components/support/SupportMessageContent.tsx`) con `react-markdown` y `remark-breaks`.

  - **Métricas:** RPC `admin_platform_metrics()`; página `/admin/metrics`. Página estática `/admin/docs` con procedimientos internos.

  - **Gestión de suscripciones desde Admin:** En `/admin/agencies` la tabla muestra columnas **Plan**, **Suscripción** y **Trial hasta** (datos de `admin_list_agencies`). Filtro por plan (Todos / Starter / Pro / Business). Por cada agencia, menú "Forzar plan" (icono tarjeta) con opciones Starter, Pro, Business; llama a `admin_set_agency_plan(p_agency_id, p_plan_id)` para soporte o correcciones sin pasar por Stripe.

  - **Acceder como agencia:** Para soporte o debugging, un platform admin puede "entrar" en la app con el contexto de una agencia. Columna `is_impersonation` en `user_agencies`; RPCs `admin_impersonate_agency(p_agency_id)` (añade/actualiza fila con `is_primary = true` para que `requesting_agency_id()` devuelva esa agencia) y `admin_stop_impersonate(p_agency_id)` (borra la fila de impersonación y restaura `is_primary` en otra). En Admin → Agencias, botón "Entrar" llama a la RPC y redirige a `/dashboard?agency=<id>`. **AgencyContext** prioriza la agencia con `is_primary` en `user_agencies` y, si no hay empleado para esa agencia, carga la agencia solo por `user_agencies` (y opcionalmente `?agency=` en la URL). **ImpersonationProvider** + **SidebarImpersonationPanel** (`src/components/admin/ImpersonationBanner.tsx`): envuelve el layout de app y muestra en el **sidebar** una fila mínima al **pie**, justo encima del footer (avatar / Vista global), con nombre truncado e icono para salir (llama a `admin_stop_impersonate` y redirige a `/admin/agencies`). En móvil, el header usa un acento ámbar (inset) sin ocupar franja extra. La tabla `user_agencies` debe tener UNIQUE (user_id, agency_id). RPC `repair_user_agencies_from_employees()` repara membresías perdidas recreando filas desde la tabla `employees`. **Ver datos sin perfil de empleado:** Si el platform admin no tiene perfil en esa agencia (`currentUser` indefinido), **PermissionProtectedRoute** permite el acceso (no redirige a dashboard): se considera `isPlatformAdmin` y se deja pasar a Planificador, Deadlines, Weekly, etc. Los datos se cargan por `currentAgency.id`. En **usePlannerData**, el filtro "Solo yo" solo se aplica cuando existe `currentUser`; si no hay empleado vinculado, se muestran todos los empleados de la agencia. En **WeeklyForecastPage**, la carga de transferencias usa `currentUser?.agencyId ?? currentAgency?.id` cuando el usuario es platform admin para poder ver datos de la agencia actual.

- **Seguimiento operativo (`OperationsRadarPage.tsx`)**
  - **Filtro por departamento (una sola fuente de verdad)**: Usa exclusivamente **DepartmentViewContext** (el mismo que el Sidebar "Vista por departamento"). No hay override local en la página ni selectores adicionales de departamento en Coherencia. La selección en el Sidebar afecta tanto a la card de Coherencia como a Proyectos en alerta. Opcionalmente se puede abrir la página con `?depto=<id|nombre>` para inicializar la vista, pero Seguimiento operativo no escribe de vuelta ese parámetro.
  - **Navegación por mes**: Estado `viewDate` inicializado desde `?mes=YYYY-MM`; cabecera con anterior / "Mes actual" (MMM yyyy) / siguiente. Al montar y al cambiar mes se llama **`ensureMonthLoaded(viewDate)`** desde `useApp()` para que AppContext tenga las asignaciones de ese mes en memoria.
  - **URL persistente**: `?mes=` se lee al montar y se actualiza al cambiar de mes; el enlace es compartible y se restaura al recargar. `?depto=` solo se lee en el arranque para ajustar `DepartmentViewContext`, pero no se mantiene sincronizado automáticamente.
  - **Departamentos**: Lista desde `normalizeDepartments(currentAgency?.settings?.departments)`. Al seleccionar un departamento se aplican **dos criterios**: (1) solo se consideran proyectos con asignaciones del mes de **empleados de ese departamento** (`employeeBelongsToDepartment`); (2) de esos, solo se muestran proyectos cuyo **`responsibleDepartmentId`** coincide con el departamento seleccionado (id o nombre). Los proyectos **sin** `responsibleDepartmentId` sí se muestran si tienen horas de empleados del departamento (para no ocultar proyectos aún no asignados a un área). Así, al filtrar por SEO solo aparecen proyectos de SEO (y no de SEM u otros).
  - **Búsqueda global única (UX unificada)**: En la cabecera hay una sola barra **"Buscar proyecto o cliente..."** (Input con icono de lupa). No hay dropdown de proyecto: el usuario escribe directamente y la búsqueda aplica a **ambos paneles** (Coherencia y Estado de proyectos). Así se evita tener filtros dispersos y se alinea con el patrón de búsqueda por texto.
  - **Coherencia**: `GlobalPlanningInconsistencies` recibe `viewDate`, **`searchQuery`** y **`hideProjectSearch`**. En Seguimiento operativo se pasa `hideProjectSearch={true}`: no se muestran búsqueda ni dropdown de proyecto (evita redundancia con la barra global); solo el **filtro por empleado**, con control tipo combobox (campo "Filtrar por empleado..." clicable en toda el área, se abre lista con búsqueda). La búsqueda global filtra por nombre de proyecto o cliente. **Sin paginación**. "Expandir todo" / "Colapsar todo". Si hay más de `COHERENCE_AUTO_EXPAND_MAX` proyectos no se expanden todos por defecto.
  - **Estado de proyectos** (panel derecho): Título "Estado de proyectos". **Filtros al estilo cartera** (mismo diseño que Cartera/Proyectos): **Todos** | **Sin actividad** | **Falta planificar** | **Retrasados** | **Exceso horas** | **En regla**, con iconos y tooltips. Cada proyecto tiene **un único estado** (excluyentes, prioridad: exceso horas > retrasados > falta planificar > sin actividad > en regla). **"En regla"** solo cuando está realmente al día: sin exceso de presupuesto, sin retraso (ritmo/avance), **sin tareas pendientes de planificar** (si hay "X sin planificar" no puede estar En regla) y no "sin actividad". Lista con desplegables (Collapsible): trigger con nombre, cliente, badge del estado (Exceso horas, Retrasados, Falta planificar, Sin actividad, En regla), métricas (Contratadas, Computadas, Por computar), barra de avance y opcionalmente "X sin planificar". Al expandir: proyección, barras Estimado/Real/Computado, frase accionable. **Sin paginación**.
  - **Diferencia con otros reportes**: Team Pulse y otros módulos también respetan `DepartmentViewContext`, pero Seguimiento operativo se centra en **riesgos operativos diarios** (coherencia planificación vs ejecución y proyectos en alerta) con explicaciones accionables en una sola vista.

- **Rentabilidad / Salud Financiera (`FinancialHealthPage.tsx`, ruta `/finanzas`)**
  - **Dos modelos de coste** (selector en cabecera junto a Horas): **Operativo** y **Dinámico**.
    - **Operativo** (por defecto): Aísla el coste del proyecto de vacaciones y tiempos muertos. Fórmula: *Coste laboral = Horas del proyecto × Coste hora estándar del empleado*. El coste hora estándar = nómina mensual / capacidad teórica mensual (p. ej. `defaultWeeklyCapacity × 4,33` o 110 h si no hay capacidad).
    - **Dinámico**: Reparte la nómina entre las horas reales del mes. *Coste por hora = Salario mensual / Total horas del empleado en el mes*; *Coste en proyecto = Horas del proyecto × Coste por hora*. Las vacaciones y tiempos muertos se absorben proporcionalmente.
  - **Datos necesarios**: Por empleado, **Salario mensual bruto** (campo `hourly_rate`) y, para Operativo, **coste hora estándar** (derivado: nómina / capacidad teórica). Si la agencia usa un coste medio global, se aplica a ambos modelos.
  - **Contabilidad**: Ingreso por proyecto = fee mensual; ingreso atribuido por empleado = reparto del fee por % de horas. Margen = ingreso − coste (en € y %). EHR = ingreso del proyecto / horas del proyecto.
  - **Buscador** único en cabecera; vista por departamento. **Horas**: selector Reales / Computadas. **Coste**: selector Operativo / Dinámico, con tooltips explicativos.
  - **Coste**: Cada empleado tiene coste mensual (nómina). El coste por proyecto y por fila depende del modelo elegido (ver fórmulas arriba). El KPI "Coste interno" global es la suma de los costes calculados según el modo activo.
  - **KPIs**: EHR efectivo global, Margen neto global. **Radar de hemorragias**: columnas Coste (€) y Margen (€); desglose por empleado: Horas, Ingreso atrib., Coste, Margen. **Inversión interna**: proyectos con fee 0 €.
  - **Tabs**: **Resumen**, **Proyectos** (tabla con Ingreso, horas, EHR, Coste, Margen; desglose por empleado con ingreso atribuido y margen), **Empleados** (tabla: Horas, Ingreso atribuido, Coste, Margen, % margen; desglose por proyecto). Coste por empleado y por proyecto respetan el modelo de coste seleccionado.
  - **Horas / presupuesto por proyecto**: Las cifras de horas objetivo y "Xh / Yh" (consumido / total) provienen de `useProjectMetrics`, que recibe los **deadlines del mes**; se usa `getEffectiveBudget(project, deadline)` para que el total mostrado respete el **budgetOverride** del Deadline (ej.: 30 h contratadas pero 28 h este mes en Deadlines → se muestra 28 h como objetivo).
  - **EHR** a nivel proyecto. Proyectos internos (fee 0): margen negativo en rojo.
  - **Contexto mes (evitar "ilusión de mitad de mes")**:
    - **Selector de periodo**: Junto al selector de mes aparece un badge **"Mes en curso"** (azul, animado) o **"Mes cerrado"** (gris). Así el usuario sabe si los datos son provisionales o definitivos.
    - **Ingreso devengado**: Si se está viendo el **mes en curso**, los ingresos mostrados son el **prorrateo por días** (fee × día del mes / días del mes), salvo que el proyecto **ya haya cumplido o superado el 100 % de las horas del presupuesto** (según Horas computadas/reales), en cuyo caso se muestra el **fee total** (el trabajo ya está completado). La columna se llama "Ingreso devengado (€)" y un icono (i) explica el concepto. El margen € se calcula con ese ingreso para que sea interpretable a mitad de mes.
    - **Ritmo (Pacing)**: Columna **Ritmo** en las tablas de proyectos: compara % de presupuesto consumido (horas/budget) con % del mes transcurrido (días laborables). Barra verde = ritmo adecuado; barra roja + icono = ritmo por encima de lo previsto (riesgo de reducir margen a fin de mes). Utilidades: `getWorkingDaysInMonth` y `getWorkingDaysElapsedInMonth` en `dateUtils.ts`.
    - **Fallback coste dinámico**: Si el selector está en **Dinámico** y se ve el **mes en curso** con menos del **25 % del mes** transcurrido, el sistema usa temporalmente el coste **Operativo** (evita distorsión por pocas horas registradas) y un tooltip en la cabecera de coste lo indica.

- **Modificar permisos**:
    - Añadir el flag en `UserPermissions` y en `ROUTE_PERMISSIONS` (si protege una ruta) en `src/types/permissions.ts`.
    - Añadir etiqueta en `PERMISSION_LABELS` y valor por defecto en `DEFAULT_PERMISSIONS`.
    - Editar `src/hooks/usePermissions.ts`: añadir la clave en `RESTRICTED_PERMISSIONS` y, si aplica, lógica de compatibilidad para roles ya guardados (ej. nuevos permisos que se derivan de uno existente hasta que se edite el rol).
    - Añadir el permiso en la lista por sección en Configuración de agencia → Equipo (`AgencySettingsPage.tsx`).
    - **Seguimiento operativo** (`/operaciones`) y **Rentabilidad** (`/finanzas`) tienen permisos propios: `can_access_operations_radar` y `can_access_financial_health`. Las rutas y páginas de Reportes clásicos e Informes clientes han sido eliminadas; los permisos `can_access_reports` y `can_access_client_reports` pueden seguir en roles por compatibilidad pero no tienen página asociada.
- **Actualizar Workers**:
    - Los workers consumen tokens de `ad_accounts_config`. Si falla el refresco de token, el worker registrará el error en `ads_sync_logs`.

---

## 8. Mapa de Dependencias (Análisis de Impacto)

**⚠️ CRÍTICO**: Usa esta sección cuando modifiques algo para saber TODOS los archivos afectados.

### 8.1 Dependencias de Types (`src/types/index.ts`)

Si modificas una interface, revisa estos consumidores:

| Interface Modificada | Archivos a Revisar |
|---------------------|-------------------|
| `Allocation` | `AppContext.tsx`, `useAllocationSheet.ts`, `AllocationSheet.tsx`, `PlannerGrid.tsx`, `MobilePlannerView.tsx`, `WeekCell.tsx`, `useProjectMetrics.ts`, `useTaskTransfers.ts` |
| `Employee` | `AppContext.tsx`, `AgencyContext.tsx`, `EmployeeRow.tsx`, `TeamPage.tsx`, `usePermissions.ts`, `capacityUtils.ts` |
| `Project` | `AppContext.tsx`, `ProjectsPage.tsx`, `ClientsAndProjectsPage.tsx`, `useAllocationSheet.ts`, `useProjectMetrics.ts` |
| `Agency` / `AgencySettings` | `AgencyContext.tsx`, `AgencySettingsPage.tsx`, `usePermissions.ts` |
| `WorkSchedule` | `capacityUtils.ts`, `dateUtils.ts`, `AppContext.tsx` |
| `Absence` / `TeamEvent` | `capacityUtils.ts`, `AppContext.tsx`, `AbsencesSheet.tsx` |
| `TaskTransfer` | `useTaskTransfers.ts`, `TaskTransferComponents.tsx`, `AppContext.tsx` |
| `UserPermissions` | `usePermissions.ts`, `src/types/permissions.ts`, `PermissionProtectedRoute` en `App.tsx` |
| `OKR` / `ProfessionalGoal` | `GoalsContext.tsx`, `OkrsPage.tsx`, `ProfessionalGoalsSheet.tsx`, `EmployeeDashboard.tsx` |

### 8.2 Dependencias de Contexts

| Si modificas... | Revisa también... |
|-----------------|-------------------|
| `AppContext.tsx` (fetchData) | Todos los componentes que usan `useApp()` - especialmente `AllocationSheet`, `PlannerGrid`, `EmployeeDashboard` |
| `AppContext.tsx` (getEmployeeLoadForWeek) | `WeekCell.tsx`, `EmployeeRow.tsx`, `usePlannerData.ts` |
| `AppContext.tsx` (ensureMonthLoaded) | `usePlannerData.ts`, `AllocationSheet.tsx`, `OperationsRadarPage.tsx` |
| `AgencyContext.tsx` (currentAgency) | `AppContext.tsx`, `usePermissions.ts`, `AgencySettingsPage.tsx` |
| `GoalsContext.tsx` | `OkrsPage.tsx`, `ProfessionalGoalsSheet.tsx` |

### 8.3 Dependencias de Utilities

| Si modificas... | Revisa también... |
|-----------------|-------------------|
| `dateUtils.ts` → `getWeeksForMonth()` | `AppContext.tsx`, `usePlannerData.ts`, `useAllocationSheet.ts`, `AllocationSheet.tsx` |
| `dateUtils.ts` → `collectSelectableFutureWeekSlots()` | `WeeklyReportDialog.tsx` (destinos futuros multi-mes en Weekly) |
| `dateUtils.ts` → `isAllocationInEffectiveMonth()` | `AppContext.tsx`, `usePlannerData.ts`, `useProjectMetrics.ts` |
| `budgetUtils.ts` → `getEffectiveBudget()` | `DeadlinesPage`, `WeeklyForecastPage`, `ClientsAndProjectsPage`, `useAllocationSheet` |
| `deadlineUtils.ts` → `fetchDeadlinesForMonth(monthKey, agencyId)` | `useDeadlines`, `DeadlinesPage`, `AllocationSheet`, `EmployeeDashboard`, `WeeklyForecastPage`, `ClientsAndProjectsPage`, `PlanningInconsistenciesCard`, `MyWeekView`, `GlobalPlanningInconsistencies` |
| `capacityUtils.ts` → `getDailyReduction()` | `getCapacityReductionInRange()`, `getCapacityReductionBreakdown()`, `AppContext.tsx` |
| `capacityUtils.ts` → `getScheduledHoursForDay()` | Todas las funciones de capacidad, `WeekCell.tsx` |
| `taskPermissions.ts` → `canEditTask()` | `AllocationSheet.tsx`, cualquier UI de edición de tareas |
| `permissions.ts` → `ROUTE_PERMISSIONS` | `App.tsx` (guards), `PermissionProtectedRoute.tsx`, `Sidebar.tsx` |

### 8.4 Dependencias de Hooks

| Si modificas... | Revisa también... |
|-----------------|-------------------|
| `usePermissions.ts` | `AllocationSheet.tsx`, `PlannerGrid.tsx`, `AgencySettingsPage.tsx`, cualquier componente con lógica condicional por permisos |
| `useAllocationSheet.ts` | `AllocationSheet.tsx`, `EmployeeDashboard.tsx` |
| `usePlannerData.ts` | `PlannerGrid.tsx` (datos compartidos con `MobilePlannerView` en móvil) |
| `useProjectMetrics.ts` | `ProjectImpactSummary.tsx` y otros consumidores de métricas de proyecto |
| `useTaskTransfers.ts` | `AllocationSheet.tsx`, `TaskTransferComponents.tsx` |
| `useAllocationActions.ts` | `AllocationSheet.tsx`, `AllocationFormDialog.tsx` |
| `useDeadlines.ts` | Acepta `{ agencyId }`; usado donde se cargan deadlines. Componentes que cargan deadlines usan `fetchDeadlinesForMonth(monthKey, currentAgency?.id)` directamente o vía hook. |

### 8.5 Dependencias de Componentes Complejos (Team)

Estos componentes son muy grandes y tienen lógica interna compleja:

| Componente | Archivo | Dependencias Clave |
|------------|---------|--------------------|
| **EmployeeDialog** | `src/components/team/EmployeeDialog.tsx` | `AppContext` (UPSERT employee), `Supabase` (auth user creation) |
| **AbsencesSheet** | `src/components/team/AbsencesSheet.tsx` | `AppContext`, `capacityUtils` (validación de fechas) |
| **ProfessionalGoalsSheet** | `src/components/team/ProfessionalGoalsSheet.tsx` | `GoalsContext`, `AppContext` (empleado asociado) |

### 8.6 Flujo de Cambio de Agencia

Cuando `AgencyContext.currentAgency` cambia, se desencadena:
```
AgencyContext.switchAgency()
    ↓
AppContext useEffect detecta cambio de agency_id
    ↓
Limpia: employees, clients, projects, allocations, absences, teamEvents
    ↓
Limpia: loadedMonthsRef (caché de meses)
    ↓
fetchData() con nuevo agency_id
    ↓
Todos los componentes re-renderizan
```

### 8.7 Otras Utilidades y Hooks (Nuevos Hallazgos)

| Archivo | Propósito | Dependencias Clave |
|---------|-----------|--------------------|
| `src/utils/logger.ts` | Sistema de logging estructurado | Usado en `PlannerGrid` y otros |
| `src/hooks/useTasksImpact.ts` | Pre-cálculo de impacto de nuevas tareas | `useAllocationSheet`, `ProjectBudgetStatus` |
| `src/hooks/use-mobile.tsx` | Detección de dispositivo móvil (breakpoint 768px) | UI responsiva: `AppLayout` (ya no bloquea móvil), `PlannerGrid` → `MobilePlannerView`, `AllocationSheet` (vista semanal/mensual en cards, toggles Semana/Mes ≥44px), `AllocationTaskRow` (isMobile), `DeadlinesPage` y `DeadlinesFilters` (filtros/edición en Sheet), `Sidebar` |
| `src/components/deadlines/DeadlinesFilters.tsx` | Filtros de Deadlines con estado local (búsqueda, tipo, empleado, orden, ocultos, sin asignar) | Usado solo por `DeadlinesPage`; notifica valores vía `onFiltersChange`; no crea suscripciones Realtime |
| `src/components/deadlines/GlobalAssignmentDialog.tsx` | Dialog crear/editar asignaciones globales (nombre, horas, afecta a todos o empleados seleccionados) | Usado solo por `DeadlinesPage`; estado del formulario interno; no Realtime |
| `src/components/deadlines/DeadlinesSuggestionsPreview.tsx` | Vista compacta de recomendaciones en sidebar (hasta 3 empleados, tooltip, botón "Ver desglose por proyecto") | Usado solo por `DeadlinesPage`; presentacional; recibe `groups` (slice de sugerencias) y `onOpenFull`; no estado interno |
| `src/components/deadlines/DeadlinesSuggestionsPanel.tsx` | Panel ampliable de sugerencias (Sheet móvil / Dialog desktop): condicionantes (quién cede, % máx. receptor, % mín. quien cede), lista por empleado/proyecto, resumen propuesto | Usado solo por `DeadlinesPage`; controlado (estado y callbacks en la página); no Realtime |
| `src/components/deadlines/DeadlinesAvailabilityCard.tsx` | Card de disponibilidad del equipo (asignado vs disponible por empleado, % y barra de progreso; opcional tooltip con ausencias/eventos) | Usado por `DeadlinesPage` y por `DeadlinesPageHeader` (Sheet Equipo móvil); presentacional; `compact` para vista sin tooltip |
| `src/components/deadlines/DeadlinesProjectEditSheet.tsx` | Sheet de edición de un proyecto (móvil): horas por empleado, ajuste presupuesto, notas, ocultar | Usado solo por `DeadlinesPage` cuando isMobile y editingProjectId; controlado (formData y callbacks en la página) |
| `src/components/deadlines/DeadlinesSidebar.tsx` | Panel lateral desktop: disponibilidad, recomendaciones (DeadlinesSuggestionsPreview), tareas globales | Usado solo por `DeadlinesPage` cuando !isMobile && canEditDeadlines |
| `src/components/deadlines/DeadlinesPageHeader.tsx` | Cabecera: título, selector de mes, copiar/resetear mes, Sheet "Equipo" (móvil) | Usado solo por `DeadlinesPage` |
| `src/components/deadlines/DeadlinesConfirmDialog.tsx` | AlertDialog para confirmar eliminar deadline/asignación, copiar mes o resetear mes | Usado solo por `DeadlinesPage` |
| `src/components/deadlines/DeadlinesProjectList.tsx` | Listado de proyectos agrupados por cliente: cabeceras colapsables, filas con horas/equipo/total, edición inline (desktop), indicadores de edición concurrente y ocultos | Usado solo por `DeadlinesPage`; recibe `projectsByClient`, callbacks de edición y `onRequestDeleteDeadline`; usa `DeadlineEmployeeRow` para chips y filas de horas por empleado |
| `src/components/deadlines/DeadlineEmployeeRow.tsx` | Fila/chip de empleado en Deadlines: modo display (chip avatar + nombre + horas) o modo edit (avatar + nombre + input horas); usado en el listado de proyectos | Usado solo por `DeadlinesProjectList` |
| `src/components/clients-projects/ClientsAndProjectsFilters.tsx` | Filtros de Clientes y Proyectos con estado local (búsqueda, estado, tipo proyecto, empleado, filtros de análisis: todos/sin actividad/falta planificar/retrasados/exceso horas) | Usado solo por `ClientsAndProjectsPage`; notifica valores vía `onFiltersChange`; debounce 300 ms en búsqueda |
| `src/hooks/useProjectAliasing.ts` | Formateo de nombres de proyectos según reglas de agencia | `AgencyContext`, `formatProjectName`, usado en 15+ componentes |
| `src/utils/deadlineUtils.ts` | Carga de deadlines por mes filtrando por agencia (multi-tenant) | `fetchDeadlinesForMonth(monthKey, agencyId)`; join con `projects.agency_id`. Usado por `useDeadlines`, DeadlinesPage, AllocationSheet, EmployeeDashboard, WeeklyForecastPage, ClientsAndProjectsPage, PlanningInconsistenciesCard, MyWeekView, GlobalPlanningInconsistencies |
| `src/hooks/useDeadlines.ts` | Carga y estado de deadlines; opción `agencyId` para filtrar por agencia | `deadlineUtils.fetchDeadlinesForMonth` |
| `src/hooks/useDeadlinesRedistribution.ts` | Cálculo de tips de redistribución (desequilibrio de carga), suggestionDonors, suggestionsByEmployeeAndProject, suggestionsByEmployee; condicionantes (excludedDonorIds, maxReceiverLoadPct, minSenderLoadPct) | Usado solo por `DeadlinesPage` |

**Criterio de recomendaciones (quién sale en “Recomendaciones”)**: Aparecen como receptores **todos** los compañeros con **carga por debajo de la media** (porcentaje de horas asignadas / disponibles menor que media − umbral; si no hay nadie con el umbral estricto se usa umbral relajado de 5%). Los proyectos desde los que pueden recibir son los de los sobrecargados (aunque el receptor no tenga horas aún). No se exige compartir proyecto. como “sobrecargado”. Por tanto, un compañero con muchas horas libres pero que no trabaja en ningún proyecto en común con los sobrecargados **solo se generan tips si hay al menos 2 empleados activos y el rango de carga (máx − mín) es ≥ 5%. Lógica en `getRedistributionTips` (useDeadlinesRedistribution.ts).

| `src/hooks/useDeadlinesPageData.ts` | Carga de deadlines y global_assignments, suscripción Realtime (deadlines, global_assignments, project_editing_locks, broadcast lock-released), carga/limpieza de locks, filteredProjects, projectsByClient, activeEmployees, getMonthlyCapacity, getEmployeeAssignedHours, getProjectDeadline; expone broadcastChannelRef para envío de lock-released desde la página | Usado solo por `DeadlinesPage` |
| `src/hooks/useDeadlinesEditing.ts` | Edición inline en Deadlines: estado (editingProjectId, inlineFormData, isSaving, autoSaveStatus), refs (autoSaveTimeout, lockRefreshInterval), acquire/renew/release/releaseAllMy locks, startEditingProject, cancelEditingProject, toggleProjectExpanded, updateInlineEmployeeHours, autoSaveDeadline, handleFormPatch, saveInlineDeadline; cleanup al desmontar o cambiar mes; cancelEditingProject limpia también autoSaveTimeoutRef | Usado solo por `DeadlinesPage`; recibe canEditDeadlines, selectedMonth, currentUser, employees, getProjectDeadline, hiddenProjects, setHiddenProjects, setDeadlines, setEditingLocks, broadcastChannelRef, setExpandedProjects |

**Refactor Deadlines (auditoría)**: Tras reducir DeadlinesPage de ~1120 a ~670 líneas con hooks y componentes extraídos, se auditaron: encaje de props entre página → DeadlinesProjectList / DeadlinesProjectEditSheet / DeadlinesSidebar; tipos InlineFormData y getProjectDeadline compatibles; useDeadlinesPageData (Realtime deadlines, global_assignments, project_editing_locks, broadcast lock-released) y useDeadlinesEditing (locks, autoSave, cleanup); build y lints OK. No hay tests unitarios de Deadlines; se recomienda prueba manual: edición inline desktop, Sheet móvil, locks entre usuarios, cambio de mes, cerrar pestaña con edición abierta.

---

### 8.8 Flujo de Carga de Mes

```
Usuario navega a otro mes
    ↓
usePlannerData.setCurrentMonth()
    ↓
ensureMonthLoaded(date) en AppContext
    ↓
¿loadedMonthsRef.has(monthKey)? → SÍ → Return (Cache hit)
                                 ↓ NO
loadDataForMonth(date)
    ↓
Fetch: allocations, absences, team_events, weekly_feedback
    ↓
UPSERT merge con estado existente
    ↓
loadedMonthsRef.add(monthKey)
```

---

## 9. Checklist de Modificación

Antes de modificar cualquier archivo crítico, usa este checklist:

### Al modificar `src/types/index.ts`:
- [ ] ¿Actualicé todos los mappers en Context? (snake_case → camelCase)
- [ ] ¿Los nuevos campos son opcionales si la DB puede no tenerlos?
- [ ] ¿Revisé la sección 8.1 de dependencias?

### Al modificar `AppContext.tsx`:
- [ ] ¿Mantuve la lógica de UPSERT si es datos incrementales?
- [ ] ¿Actualicé `loadedMonthsRef` si es necesario?
- [ ] ¿Los componentes que usan `useApp()` siguen funcionando?

### Al modificar `capacityUtils.ts` o `dateUtils.ts`:
- [ ] ¿Las funciones mantienen la firma anterior?
- [ ] ¿El algoritmo de Split Weeks sigue funcionando en cambios de año?
- [ ] ¿Probé con fechas edge (31 dic, 1 ene)?

### Al añadir nuevo permiso:
- [ ] Añadido a `UserPermissions` en `src/types/permissions.ts`
- [ ] Añadido a `ROUTE_PERMISSIONS` si protege una ruta
- [ ] Añadido a `DEFAULT_PERMISSIONS` y `RESTRICTED_PERMISSIONS` en `usePermissions.ts`
- [ ] Añadido label en `PERMISSION_LABELS`

### Al modificar lógica de Realtime:
- [ ] ¿Usé un canal unificado `room-{id}` en lugar de múltiples canales?
- [ ] ¿Limpié el canal al desmontar (`removeChannel`)?
- [ ] ¿Filtré eventos por `agency_id` o contexto (ej. `project_id` en lista de proyectos de la agencia) para evitar fugas de datos?

### Al modificar políticas RLS o tokens API:
- [ ] ¿La función `requesting_agency_id()` sigue devolviendo el `agency_id` correcto para ambos escenarios (usuario normal y API token)?
- [ ] ¿Las edge functions `generate-api-token` y `revoke-api-token` verifican permisos del caller (`can_access_api_keys` o `can_access_agency_settings`)?
- [ ] ¿La nueva tabla tiene política RLS? Si no, el acceso será denegado por defecto (RLS habilitado sin policy).
- [ ] ¿El `service_role` key sigue funcionando? (Bypasea RLS, no necesita policy).

### Al cargar o modificar deadlines:
- [ ] ¿Uso `fetchDeadlinesForMonth(monthKey, currentAgency?.id)` o `useDeadlines({ agencyId: currentAgency?.id })` para no mezclar datos entre agencias en el mismo Supabase?
- [ ] ¿Las operaciones de borrado masivo (ej. "Resetear mes") filtran por proyectos de la agencia?

### Al crear componente que muestra nombres de proyectos:
- [ ] Importar `useProjectAliasing` de `@/hooks/useProjectAliasing`
- [ ] Llamar `const { formatName: formatProjectName } = useProjectAliasing()`
- [ ] Usar `formatProjectName(project.name)` en el renderizado
- [ ] Actualizar la tabla en Sección 2.1 "Componentes que usan aliasing"

---

## 10. Gotchas y Patrones Problemáticos Conocidos

### 10.1 Keys duplicadas en listas con datos potencialmente duplicados
**Archivo afectado**: `GlobalPlanningInconsistencies.tsx`

Si iteras sobre arrays que pueden tener entradas duplicadas (ej. empleados en múltiples deadlines), usa índice en la key:
```tsx
// ❌ MAL - puede generar warning si hay duplicados
{items.map(item => <div key={item.id}>...</div>)}

// ✅ BIEN - el índice garantiza unicidad
{items.map((item, index) => <div key={`${item.id}-${index}`}>...</div>)}
```

### 10.2 Prefijos en keys para evitar colisiones entre entidades
Si un mismo UUID puede aparecer como `projectId` Y como `employeeId` en diferentes niveles del árbol DOM:
```tsx
key={`proj-${inc.projectId}`}  // Para proyectos
key={`emp-${emp.employeeId}`}  // Para empleados
```

### 10.3 Eliminación de empleados (limpieza en BD)
Al eliminar un empleado **debe borrarse todo rastro en la base de datos**. No se debe solo ocultar en UI.
- **Función en BD**: `cleanup_employee_data(p_employee_id uuid)` elimina: `active_timers`, `timer_sessions`, `time_entries`, `allocations`, `absences`, `weekly_feedback`, `user_routines`, `professional_goals`, `task_transfers`; actualiza `deadlines.employee_hours` y `team_events.affected_employee_ids`.
- **Flujo**: En `AppContext.deleteEmployee` se llama primero a `supabase.rpc('cleanup_employee_data', { p_employee_id: id })` y después al `DELETE` en `employees`. Si la migración no está aplicada, el usuario verá un toast indicándolo.
- **Estado local**: Tras el cleanup se actualizan también `weeklyFeedback`, `userRoutines` y `teamEvents` en el estado para que la UI no muestre datos huérfanos.

### 10.4 Informe de coherencia (GlobalPlanningInconsistencies)
- **Un empleado, una fila por proyecto**: La lista "Empleados afectados" se construye con un `Map` por `employeeId` por proyecto, de modo que cada persona aparece como máximo una vez por proyecto (evita duplicados donde en una fila salía "en deadline" y en otra "no en deadline").
- **Uso en Seguimiento operativo**: Si se pasa **`hideProjectSearch={true}`** (y opcionalmente **`searchQuery`**), el componente no muestra la sección "Filtros y búsqueda" (input de búsqueda y dropdown de proyecto); solo el **filtro por empleado** con control tipo combobox (área clicable, lista con búsqueda). La búsqueda global de Seguimiento operativo se aplica vía `searchQuery`. Así se evita redundancia y el desplegable que obligaba a usar la flecha.
- **Empleados inexistentes**: Si por datos antiguos o fallo de migración quedara algún `employee_id` sin correspondencia en `employees`, no se muestra "Desconocido": se excluyen esas filas (red de seguridad; la solución correcta es la limpieza en BD, ver 10.3).

### 10.5 Robustez en mapeos y búsquedas (find/map)
- **Fallbacks en Contextos/Hooks**: Siempre asume que las listas (`allocations`, `employees`, `pendingTransfers`) pueden ser `undefined` durante la carga inicial o en entornos de prueba/demo.
- **Patrón Recomendado**:
  ```tsx
  // Mal
  const item = list.find(x => x.id === id); 
  
  // Bien
  const item = (list || []).find(x => x.id === id);
  ```
- **DemoContext**: Al crear proveedores de demo, asegúrate de que todas las propiedades requeridas por el contexto original estén presentes (aunque sean arrays vacíos o funciones dummy) para evitar que los componentes hijos fallen al intentar desestructurarlas o llamar a sus métodos.
- **Datos de demo (landing)**: Los datos de la demo viven en `src/data/demoData.ts` (`demoEmployees`, `demoClients`, `demoProjects`, `demoAllocations`, `demoDeadlines`). Las asignaciones usan `weeks[0]`…`weeks[n]` (lunes de cada semana del mes actual). Para que la demo se vea bien en cualquier pestaña del planificador (semana 1 a 4 o 5), `demoAllocations` debe incluir entradas para **todas** las semanas del mes (`weeks[2]`, `weeks[3]` y, si aplica, más); si solo se rellenan las primeras semanas, las pestañas de semanas 3 o 4 quedarán vacías.
- **Fallback en la llamada**: Asegura que el objeto sobre el que llamas a `.find()` o `.map()` no sea undefined: `const myData = (breakdown || []).find(...)`
- **Garantizar arrays en hooks**: En `useAllocationSheet`, las funciones que devuelven datos calculados deben asegurar que el origen de iteración sea siempre un array para evitar crashes durante el re-renderizado: `(Object.entries(breakdownMap) || []).map(...)`

### 11. Mantenimiento de Contenido y Terminología
#### 11.1 Terminología Consistente
Para mantener la coherencia en toda la plataforma y el material de marketing, se deben usar siempre los mismos términos:
- **Weekly Forecast**: Se prefiere este término (en singular) frente a "Weeklys Forecast".
- **Horas Computadas**: El término técnico para las horas validadas tras el proceso de Weekly.
- **Team Pulse**: Nombre del sistema de métricas de salud y carga del equipo.

#### 11.2 Guía de funcionalidades (GuiaPage) y landings de producto
- **Secciones de la guía**: La guía pública (`/guia`, `GuiaPage.tsx`) incluye las secciones definidas en `SECTIONS` y el contenido en `CONTENT_MAP`. Actualmente: planificador, mi-espacio, equipo, **tiempos**, clientes-proyectos, configuracion, informes, etc. La sección **Tiempos** documenta el cronómetro por tarea, la página Tiempos (Equipo), el total del día en sidebar y el flujo iniciar/parar.
- **Consistencia con landings**: Las landings de funcionalidades (`TeamArticle`, `PlannerArticle`, `EmployeeDashboardArticle`, `ReportsArticle`) mencionan y enlazan a la guía donde procede (ej. "Ver guía: Tiempos" → `/guia/tiempos`). El menú desplegable de features (`FeaturesDropdown`) describe "Gestión de Equipos" como "Horarios, ausencias, capacidad y tiempos en vivo". Al añadir una nueva sección de guía o feature, actualizar las landings que la referencien y el dropdown si aplica.

#### 11.3 Alineación del copy con el MVP (Landings y presentaciones)
El copy de landings y presentaciones comerciales debe reflejar exactamente lo que hace el MVP, para evitar expectativas falsas y churn. Taimbox en fase MVP se posiciona como **copiloto inteligente**: pone los datos en pantalla y da sugerencias precisas para que el manager tome la decisión en segundos.

- **Reasignación**: Prometer "Reasignación ágil en 1 clic", no "Drag & drop para reasignar".
- **Dependencias**: "Control estricto de bloqueos", "Identifica qué tareas impiden avanzar", "Gestión de dependencias integrada". Evitar "Mapa visual de dependencias", "Notificaciones en cascada".
- **Weekly Forecast / redistribución**: "Asistente de redistribución rápida"; "El sistema te muestra quién tiene horas libres para que redistribuyas el trabajo en segundos". No prometer redistribución automática por el sistema.
- **Alertas**: "Indicadores visuales de sobrecarga", "Alertas de desviación de presupuesto", "Recordatorios de cierre de mes". En producto: hay **toasts en app** (Sileo) con acción para ir a la pantalla relevante; no prometer **notificaciones push móviles** ni email si no están en el MVP.
- **Informes cliente/PDF**: No mencionar "Informes por cliente" o "Exportar PDF con un clic" en la landing de Reportes si la funcionalidad no está en el MVP; centrar en "Salud Financiera de la Agencia".
- **Sugerencias de asignación**: Destacar el "Asistente inteligente de reasignación": el sistema detecta quién está saturado y sugiere con nombre y apellido a quién pasarle la carga, cruzando los proyectos que tienen en común.
- **Sugerencias de redistribución (Deadlines)**: Comunicado en varias landings para maximizar visibilidad: ficha "Deadlines" del carousel y demo en `LandingPage.tsx`; sección Deadlines ampliada en `ProjectsArticle.tsx` (control-proyectos) con bloque "wow" (sugerencias inteligentes, condicionantes, lista de ventajas); `PlannerArticle.tsx` (asignación con contexto + mención a Deadlines con condicionantes); `ReportsArticle.tsx` (Forecast + bullet "Misma lógica en Deadlines: sugerencias con condicionantes y impacto"); `FeaturesDropdown.tsx` (descripción "Objetivos mensuales y sugerencias de redistribución"). Destacar: solo entre empleados que comparten proyectos; condicionantes (quién cede, techo de carga receptor, suelo de quien cede); resumen de impacto y cargas resultantes. Algoritmo y fórmulas: lógica en DeadlinesPage y hooks de redistribución. No prometer redistribución automática; el manager decide.
- **Webhooks/CRM**: Hablar de "Sincronización de tiempos con tu CRM/ERP" y "Exportación directa a sistemas externos (sujeto a integración)", no de "Webhooks en tiempo real" si no se ofrecen públicamente.

Archivos afectados al cambiar copy: `LandingPage.tsx` (carousel), `ProjectsArticle.tsx`, `PlannerArticle.tsx`, `ReportsArticle.tsx`, `TeamArticle.tsx`, `IntegrationsArticle.tsx`, `PresentationPage.tsx`, `PresentationMockups.tsx`, `DeadlinesTour.tsx`, `FeaturesDropdown.tsx`. Algoritmo de sugerencias: ver lógica en DeadlinesPage y useDeadlines/redistribución.

#### 11.3a Notificaciones, motor de reglas y toasts
- **Campanita (`NotificationBell`)**: Lista del `NotificationContext`, persistida en `tb_inbox_{agencyId}_{userId}` (historial local, máx. 50). Las reglas automáticas añaden entradas con `pushSystemNotification`; al pulsar una fila, enlaces internos (`/`…) se navegan con `pathname` + `search` + `hash`. Las de **presupuesto** incluyen `projectId` y `link` a `/clients?projectId=` o `/projects?projectId=` (misma preferencia que el sidebar: clientes si el permiso lo permite). Si un aviso antiguo no trae query en `link` pero sí `projectId`, se reconstruye el enlace; además se pasa `state.focusProjectId` como respaldo si la URL perdiera la query. `ClientsAndProjectsPage` usa `?projectId=` o ese `state` para filtrar a un proyecto, expandir cliente (real o virtual por aliasing) y scroll a `project-focus-<id>`. Migración one-shot desde la clave legacy `notifications` si aún existía.
- **Reglas en cliente**: `useNotificationEngine` + `NotificationEngineHost` (hijo de `NotificationProvider`). Condiciones: presupuesto superado (equipo/agencia + proyectos); recordatorio semanal solo **jueves**, mínimo **2** tareas `planned` sin horas reales; fin de mes si faltan ≤3 días y permiso a deadlines. Sin toasts para estas reglas. Re-ejecución al cambiar datos y al `focus` / `visibilitychange`.
- **Estado de deduplicación**: `src/lib/notificationState.ts` — `tb_notify_state_{agencyId}_{userId}` (`budgetAlerts`, `deadlineAlerts`, `lastWeeklyReminderWeekKey`); evita repetir el mismo aviso hasta nueva ventana lógica. Migración desde claves legacy (`budget_alert_projects`, etc.).
- **Toasts (Sileo)**: `src/lib/notify.ts` solo para feedback de acciones (login, guardar, errores). Import `toast` desde `@/lib/notify` o `useToast` / `toast` legacy en `@/hooks/use-toast`.
- **Roadmap**: tabla `notifications` en Supabase + Realtime + RLS para campanita sincronizada entre dispositivos; triggers o Edge Functions que inserten filas ante eventos (asignación, etc.).

#### 11.3b Tours guiados (onboarding)
La app incluye tres tours que se muestran una vez por usuario (estado en `employees`: `welcome_tour_completed`, `deadlines_tour_completed`, `planner_tour_completed`) y en `localStorage` para comprobación rápida.

| Tour | Componente | Página / contexto | data-tour (targets) |
|------|------------|-------------------|---------------------|
| **WelcomeTour** | `src/components/employee/WelcomeTour.tsx` | EmployeeDashboard (Mi Semana) | add-tasks, weekly-button, crm-export, internal-tasks, goals, absences, calendar, priority-widget, dependencies-widget, planning-inconsistencies, collaboration-cards, projects-summary, monthly-balance, reliability-index; usa tab y **solo en móvil** abre `actions-dropdown` para CRM/objetivos/ausencias; en escritorio esos targets son botones visibles en cabecera. |
| **DeadlinesTour** | `src/components/deadlines/DeadlinesTour.tsx` | DeadlinesPage | month-selector (DeadlinesPageHeader), filters (DeadlinesFilters), availability-panel (DeadlinesAvailabilityCard), project-list, inline-editing, concurrent-editing (DeadlinesProjectList), global-assignments (DeadlinesSidebar), suggestions (DeadlinesSuggestionsPreview). |
| **PlannerTour** | `src/components/planner/PlannerTour.tsx` | AllocationSheet (al abrir detalle de empleado/semana desde PlannerGrid) | planner-view-toggle, planner-week-nav, planner-projects, planner-task, planner-task-name, planner-checkbox, planner-hours, planner-dependency, planner-sort, planner-add-task. |

Al cambiar la UI de una pantalla (nuevos filtros, reordenación, móvil con Sheet), revisar los pasos del tour y los `data-tour` en los componentes correspondientes para que los targets sigan existiendo y las descripciones sigan siendo correctas. Hooks: `useWelcomeTour`, `useDeadlinesTour`; PlannerTour no tiene hook público, se controla por estado en BD y localStorage (`timeboxing_planner_tour_completed`).

#### 11.4 Calidad del Copy y Ortografía
Al añadir nuevas secciones a las landing pages o guías, se debe prestar especial atención a:
- **Acentos en mayúsculas y minúsculas**: Palabras como *día, más, catálogo, módulo, verás, podrá* deben llevar siempre su tilde correspondiente.
- **Evitar Spanglish innecesario**: Usar "cliente" en lugar de "client" y "horas" en lugar de "hours" en el contenido dirigido al usuario final.
- **Consistencia en Títulos**: Los títulos de secciones en la `GuiaPage` deben seguir una jerarquía lógica y revisarse para evitar errores ortográficos tras actualizaciones.
