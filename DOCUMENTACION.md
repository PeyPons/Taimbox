# Documentación Técnica Detallada - Taimbox

Esta documentación ofrece una visión profunda y técnica de la plataforma Taimbox. Incluye un **Mapa de Dependencias** (Sección 8) exhaustivo para analizar el impacto de cualquier cambio en el código.

---

## 1. Arquitectura General y Tecnologías

El sistema sigue una arquitectura de **Single Page Application (SPA)** con un backend proporcionado por **Supabase** (BaaS) y trabajadores externos para integraciones de publicidad.

- **Frontend**: React 18 con Vite y TypeScript.
- **Backend / DB**: Supabase (PostgreSQL + Auth + Realtime). La documentación pública de la API de integración está en `/api-docs` (shell en `src/pages/ApiDocsPage.tsx`, contenido modular en `src/pages/api-docs/`). La landing pública (`LandingPage.tsx`) incluye footer (`LandingFooter`) con enlace al artículo "Por qué Taimbox", enlace Cookies (preferencias RGPD), header sticky con Login y schema JSON-LD SoftwareApplication. El banner de cookies (`CookieBanner.tsx`) cumple RGPD (consentimiento explícito, categorías necesarias/analíticas/marketing, preferencias en `localStorage`); se monta en `App.tsx` y el footer dispara el evento `open-cookie-preferences` para reabrir el panel. **Google Consent Mode v2 para GTM**: al guardar consentimiento se escriben 4 cookies (`timeboxing_gtm_analytics_storage`, `timeboxing_gtm_ad_storage`, `timeboxing_gtm_ad_user_data`, `timeboxing_gtm_ad_personalization`) con valor `granted`/`denied` y se hace push al dataLayer con evento `cookie_consent_update`. Ver `src/lib/cookieConsent.ts` y `docs/GTM-CONSENT-MODE.md`. Los artículos largos orientados a SEO están en páginas aparte `/por-que-timeboxing` (`ArticlePage.tsx`) y `/que-es-timeboxing` (`WhatIsTimeboxingPage.tsx`), ambos con schema Article + SoftwareApplication. Es una **API selectiva** (no open-source): expone solo 17 tablas de planificación, equipo y proyectos. Excluye tablas internas (ads, audit_logs, user_agencies). La documentación incluye 4 grupos (Overview, Tutoriales, SDK/REST, Referencia de Recursos), 5 tutoriales paso a paso, changelog, búsqueda (Ctrl+K), sidebar con grupos colapsables, y ResponseExample JSON por recurso. Estructura de archivos: `api-docs/data/` (types, tables, toc, changelog), `api-docs/components/` (CodeBlock, SidebarTOC, SearchBar, ResourceCard, TutorialStep, ResponseExample, etc.), `api-docs/sections/` (15 secciones). Consultarla para integraciones externas o partners.
- **Estilos**: Tailwind CSS con componentes de Shadcn UI. El color primario por defecto (`--primary` en `src/index.css`) es indigo, alineado con la landing y la página de login/registro; modificar ahí para cambiar botones, acentos y sidebar en toda la app.
- **Texto en navegación por mes**: En vistas que trabajan por mes (dashboard, reportes, proyectos, planificador, Gantt), el botón para volver al mes actual se etiqueta **"Mes actual"** (no "Hoy"), para mantener consistencia con el modelo mensual de la herramienta. Archivos afectados: `EmployeeDashboard.tsx`, `ReportsPage.tsx`, `ProjectsPage.tsx`, `ClientsAndProjectsPage.tsx`, `PlannerGrid.tsx`, `GanttView.tsx`.
- **Estado Global**: React Context API con persistencia reactiva.
- **Lógica de Datos**: TanStack Query (React Query) para sincronización de servidor.
- **Workers**: Scripts independientes en Node.js para sincronización de APIs externas (Google/Meta Ads).

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
| AllocationFormDialog | `src/components/planner/allocation/AllocationFormDialog.tsx` | ~100 |
| GanttView | `src/components/planner/GanttView.tsx` | ~95 |
| BatchTaskRow | `src/components/planner/BatchTaskRow.tsx` | ~65. Selector de proyecto en "Añadir tareas": lista ordenada con primero los proyectos que tienen deadline asignado al empleado de la tarea (o actual), luego el resto. |
| ProjectImpactSummary | `src/components/planner/ProjectImpactSummary.tsx` | ~45 |
| DashboardWidgets | `src/components/employee/DashboardWidgets.tsx` | ~120 |
| WeeklyReportDialog | `src/components/employee/WeeklyReportDialog.tsx` | ~85 |
| PlanningInconsistenciesCard | `src/components/employee/PlanningInconsistenciesCard.tsx` | ~60 |
| GlobalPlanningInconsistencies | `src/components/employee/GlobalPlanningInconsistencies.tsx` | ~380 |
| MyWeekView | `src/components/employee/MyWeekView.tsx` | ~150 |
| DeadlinesPage | `src/pages/DeadlinesPage.tsx` | ~1905 |
| ReportsPage | `src/pages/ReportsPage.tsx` | ~1510, 1948 |
| ClientReportsPage | `src/pages/ClientReportsPage.tsx` | ~160 |
| WeeklyForecastPage | `src/pages/WeeklyForecastPage.tsx` | ~380 |
| EmployeeDashboard | `src/pages/EmployeeDashboard.tsx` | ~220 |
| OperationsRadarPage | `src/pages/OperationsRadarPage.tsx` | ~540 (nombre en fila de proyecto; búsqueda por nombre formateado o crudo) |

> **⚠️ IMPORTANTE**: Si creas un nuevo componente que muestra nombres de proyectos, DEBES usar `useProjectAliasing().formatName()` para mantener consistencia.

#### Exclusiones del cálculo de precisión de planificación
- `AgencySettings.planningPrecisionExclusions`: Opcional. Permite excluir tareas de **proyectos** y/o **clientes** concretos del cálculo del **índice de fiabilidad** (precisión de planificación).
- **Campos**: `projectIds?: string[]`, `clientIds?: string[]`. Si un cliente está en `clientIds`, se excluyen todas las tareas de proyectos de ese cliente.
- **Dónde se aplica**:
  - **Dashboard del empleado → pestaña "Mis métricas"**: la tarjeta "Precisión de planificación" es `ReliabilityIndexCard`, que ya aplica las exclusiones (las tareas de proyectos/clientes excluidos no entran en el índice).
  - **Reportes** (`ReportsPage`): el índice de fiabilidad por empleado usa las mismas exclusiones.
  - Utilidad compartida: `src/utils/planningPrecisionUtils.ts` → `getExcludedProjectIds(projects, exclusions)`.
- **Configuración**: En Configuración de agencia (`AgencySettingsPage`), pestaña **Módulos y métricas** → bloque "Precisión de planificación": selectores con búsqueda para elegir proyectos y clientes a excluir. La página está organizada en secciones (General, Equipo, Departamentos, Proyectos, Módulos y métricas, Integraciones, Apariencia) para facilitar la localización de opciones.

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
- `hourlyRate`: En la UI (Team, EmployeeDialog) se edita como "Coste mensual (nómina) €" y se persiste en BD en `hourly_rate`. **En el módulo Salud Financiera** (`FinancialHealthPage`) este valor se interpreta como **coste por hora (€/h)** para la fórmula F1: Coste laboral = Σ (horas reales del empleado en proyecto × coste/h del empleado). No se calcula €/h dividiendo nómina entre horas del mes; es un dato fijo por empleado. En otros reportes puede usarse de forma distinta; ver documentación de cada módulo.
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
- `budgetOverride`: Sobrescribe `project.budgetHours` solo para este mes (Regularización).
- `isHidden`: Si el proyecto se oculta en la planificación de este mes.

**Multi-tenant**: La tabla `deadlines` no tiene `agency_id`; la agencia se deduce por `project_id` (proyectos son por agencia). Cuando varias agencias comparten el mismo Supabase, **todas** las lecturas de deadlines deben filtrar por agencia usando join con `projects` y `projects.agency_id`. La utilidad centralizada es `fetchDeadlinesForMonth(monthKey, agencyId)` en `src/utils/deadlineUtils.ts`. El hook `useDeadlines({ agencyId })` y todos los componentes que cargan deadlines usan esta función para no mezclar datos entre agencias. "Resetear mes" y "Copiar del mes anterior" en DeadlinesPage también están acotados a la agencia actual.

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
Para permitir regularizaciones mensuales (ej. restar horas porque el mes pasado nos pasamos), el sistema usa `getEffectiveBudget`.
- **Lógica**: Si el `Deadline` del mes tiene `budgetOverride >= 0`, usa ese valor. Si no, usa el `Project.budgetHours` general.
- **Uso**: Todos los semáforos de planificación (`DeadlinesPage`, `WeeklyForecastPage`, `ClientsAndProjectsPage`) deben usar este helper en lugar de leer `project.budgetHours` directamente.

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
| `sync-google-ads` | `supabase/functions/sync-google-ads/index.ts` | Sincroniza campañas. Usa credenciales plataforma (env vars) + refresh token (DB/JSON). |
| `oauth-google-ads` | `supabase/functions/oauth-google-ads/index.ts` | **(Nuevo)** Intercambia código OAuth y guarda `refresh_token` en columna de agencia. |
| `exchange-google-token` | `supabase/functions/exchange-google-token/index.ts` | *(Legacy)* Versión anterior que guardaba en JSON. |
| `sync-meta-ads` | `supabase/functions/sync-meta-ads/index.ts` | Sincroniza campañas y costes de Meta/Facebook Ads. |
| `generate-api-token` | `supabase/functions/generate-api-token/index.ts` | Genera JWT con claim `agency_id` para acceso API. |
| `revoke-api-token` | `supabase/functions/revoke-api-token/index.ts` | Revoca un token API (marca `is_active = false`). |
| `create-user` | `supabase/functions/create-user/index.ts` | Crea usuario en Auth + `employees`. |
| `update-user` | `supabase/functions/update-user/index.ts` | Actualiza usuario en Auth. |
| `delete-user` | `supabase/functions/delete-user/index.ts` | Elimina usuario de Auth. |
| `invite-user-to-agency` | `supabase/functions/invite-user-to-agency/index.ts` | Invita a un usuario existente a una agencia. |
| `register-agency` | `supabase/functions/register-agency/index.ts` | Registra una nueva agencia (onboarding). |
| `add-platform-admin` | `supabase/functions/add-platform-admin/index.ts` | Añade un usuario como admin de plataforma. |

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
2. Introduce el MCC Customer ID y hace clic en "Conectar con Google".
3. El frontend redirige a Google con `VITE_GOOGLE_CLIENT_ID` → pantalla de consentimiento.
4. Google redirige a `/google-callback?code=...` → `GoogleCallbackPage.tsx` captura el código.
5. El frontend invoca `oauth-google-ads` con `{ code, redirect_uri, agency_id }`.
6. La Edge Function intercambia el código por tokens usando `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`.
7. Guarda el `refresh_token` en la columna `agencies.google_ads_refresh_token`.
8. `sync-google-ads` usa `GOOGLE_DEVELOPER_TOKEN` + credenciales plataforma + `refresh_token` (columna) + `customer_id` (columna) para sincronizar.

**URIs de redirección autorizadas en Google Cloud Console:**
- `http://localhost:8080/google-callback` (desarrollo)
- `https://taimbox.com/google-callback` (producción)

#### Variables de entorno requeridas

**En el contenedor `supabase-edge-functions`** (Docker):
```
SUPABASE_URL=http://kong:8000
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
GOOGLE_CLIENT_ID=<client_id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-<secret>
GOOGLE_DEVELOPER_TOKEN=<developer_token>
```

**En el frontend** (`.env` de Vite):
```
VITE_GOOGLE_CLIENT_ID=<mismo_client_id>.apps.googleusercontent.com
```

#### Despliegue de Edge Functions (self-hosted)

El entorno usa Supabase self-hosted con Docker. El contenedor `supabase-edge-functions` lee las funciones desde un volumen montado:

```
~/Taimbox/supabase/functions/          ← código fuente (repo git)
        ↓  cp
~/supabase-pi/supabase/docker/volumes/functions/  ← volumen que lee el contenedor
        ↓  docker restart
supabase-edge-functions                   ← recarga el código
```

**Comandos para desplegar:**
```bash
# 1. Copiar todas las funciones al volumen
cp -r ~/Taimbox/supabase/functions/* ~/supabase-pi/supabase/docker/volumes/functions/

# 2. Reiniciar el edge runtime
docker restart supabase-edge-functions

# 3. Verificar que arrancó
docker logs supabase-edge-functions --tail 5
```

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

Si al vincular Google Ads o listar cuentas aparece **503 (Service Unavailable)** en `oauth-google-ads` o `list-google-accounts`, suele deberse a:

1. **Funciones no desplegadas o desactualizadas**  
   Asegúrate de haber copiado las funciones al volumen y reiniciado el contenedor (ver comandos de despliegue arriba).

2. **Variables de entorno faltantes en el contenedor**  
   Las funciones necesitan en el contenedor `supabase-edge-functions`:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (para `oauth-google-ads`)
   - `GOOGLE_DEVELOPER_TOKEN` (para `list-google-accounts`)  
   Si falta alguna, la función puede fallar antes de devolver una respuesta controlada y el runtime devuelve 503.

3. **Crash no capturado**  
   Si el body de la petición está vacío o no es JSON válido, las funciones devuelven **400** con mensaje claro. Si aun así ves 503, revisa los logs del contenedor para ver el stack trace.

**Comprobar en el servidor:**
- Que existan las carpetas `oauth-google-ads` y `list-google-accounts` dentro del volumen de functions.
- Que el contenedor tenga las variables anteriores (`docker inspect ... | grep GOOGLE` y comprobar SUPABASE_*).
- Reproducir el error y ejecutar `docker logs supabase-edge-functions --tail 100` para ver el error exacto.

#### Solución de problemas: Google OAuth y API Google Ads

- **`unauthorized_client` / "Refresh token no válido para este Client ID/Secret"**  
  El refresh token guardado en la agencia se generó con **otro** OAuth Client (otro Client ID/Secret en Google Cloud) distinto al configurado en las variables de entorno del contenedor. Solución: en la app, **desvincular** la cuenta de Google Ads y **volver a vincular**; así se obtiene un refresh token con el Client ID/Secret actual. Asegúrate de que en el contenedor solo haya un juego de credenciales y que coincidan con el proyecto OAuth usado en el flujo de consentimiento.

- **"Google devolvió una página HTML" / "Unexpected token '<', \"<!DOCTYPE\"..."**  
  La llamada a Google (intercambio de token o Google Ads API) está devolviendo una página de error HTML en lugar de JSON. Posibles causas:
  - **Intercambio de token**: mismo origen que `unauthorized_client`; desvincular y vincular de nuevo.
  - **Google Ads API (listAccessibleCustomers)**: comprueba que `GOOGLE_DEVELOPER_TOKEN` sea el token de **cuenta de desarrollador de Google Ads** (aprobado o en modo test) y que la cuenta de Google que vinculaste tenga acceso a la API. Si usas cuenta Manager (MCC), puede ser necesario configurar el header `login-customer-id` en la función (no implementado por defecto).

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

- **Aislamiento por agencia (multi-tenant)**  
  Todas las lecturas/escrituras deben acotarse a la agencia actual para no mostrar datos de una agencia en otra.
  - **Tablas con columna `agency_id`** (filtrar siempre por `agency_id` en queries e inserts): `agencies`, `employees`, `clients`, `projects`, `ad_accounts_config`, `ads_sync_logs`, `meta_sync_logs`, `meta_ads_campaigns`, `google_ads_campaigns`, `global_assignments`, `task_transfers`, `department_config`, `user_agencies`, `audit_logs`, `team_events`, `client_settings`, `segmentation_rules`.
  - **Tablas sin `agency_id` que se filtran por join**: `deadlines` (join con `projects.agency_id` vía `fetchDeadlinesForMonth(monthKey, agencyId)`), `professional_goals` (join con `employees.agency_id` en GoalsContext), `user_routines` (join con `employees.agency_id` en AppContext), `allocations` y `absences` (join con `employees.agency_id`).  
  - **Tablas sin uso en la app** (solo API/workers o deprecadas): `google_ads_changes` (no referenciada en el codebase). La tabla `time_entries` se usa desde la UI con el módulo **Cronómetro de tareas** (RPC `log_timer_hours`); máximo 24 h por entrada (límite efectivo por agencia). La tabla `active_timers` almacena el timer activo por empleado (1 fila por empleado); RLS por `auth.uid()`. La tabla **`timer_sessions`** (append-only) guarda cada cierre de cronómetro con `start_time`/`end_time` exactos para webhooks e integraciones (p. ej. Perfex CRM).

- **Row Level Security (RLS) y tokens API**  
  En la base de datos (Supabase), **todas las tablas públicas** tienen RLS habilitado. El acceso se controla mediante la función SQL `requesting_agency_id()`, que:
  1. Primero intenta leer el claim `agency_id` del JWT (para tokens API generados por agencia).
  2. Si no existe, busca la agencia primaria del usuario en `user_agencies`.

  **Tabla `api_tokens`**: Almacena metadatos de tokens API emitidos (hash SHA-256, permisos, expiración). El JWT real solo se muestra una vez al crearlo.

  **Revocación y expiración con efecto inmediato**: Por defecto, al revocar un token solo se pone `is_active = false` en la BD; el JWT sigue siendo válido hasta que expire. Para que la revocación niegue el acceso al instante, la función `requesting_agency_id()` debe comprobar si el token está revocado y devolver `NULL` en ese caso. También puede verificarse `expires_at` en la BD además de la validación automática del claim `exp` del JWT.

  **Aplicar permisos readonly/readwrite**: Por defecto, las políticas RLS solo verifican `agency_id`, no el claim `permissions` del JWT. Para que tokens con `permissions='readonly'` no puedan hacer INSERT/UPDATE/DELETE, la BD debe tener la función `can_write_via_api()` y las políticas RLS de INSERT/UPDATE/DELETE deben comprobarla. Las tablas con `agency_id` directo, vía `employee_id` o vía `project_id` deben tener políticas coherentes con ese tipo.

  **Edge Functions relacionadas**:
  - `generate-api-token`: Recibe `{ agency_id, name, permissions?, expires_in_days? }` del admin autenticado, firma un JWT con claim `agency_id` y `sub` = id del registro en `api_tokens`, guarda el hash en `api_tokens` y devuelve el JWT.
  - `revoke-api-token`: Recibe `{ token_id }`, verifica que el caller es admin de la agencia dueña y marca `is_active = false`. El acceso se deniega en la siguiente petición solo si está aplicado el script anterior.

  **Políticas RLS por tipo de tabla**:
  | Tipo | Tablas | Política |
  |------|--------|----------|
  | `agency_id` directo | agencies, employees, clients, projects, global_assignments, task_transfers, department_config, ad_accounts_config, ads_sync_logs, meta_sync_logs, google_ads_campaigns, meta_ads_campaigns, team_events, client_settings, segmentation_rules, audit_logs, api_tokens, user_agencies | `agency_id = requesting_agency_id()` |
  | Vía `employee_id` | allocations, absences, professional_goals, user_routines, weekly_feedback, time_entries, active_timers, timer_sessions | allocations/absences/time_entries: por agency. active_timers y timer_sessions: políticas por usuario (`auth.uid()` = employees.user_id). |
  | Vía `project_id` | deadlines, project_editing_locks | `project_id IN (SELECT id FROM projects WHERE agency_id = requesting_agency_id())` |
  | Política “no access” | google_ads_changes | Política `no_access_until_use` con USING (false) y WITH CHECK (false): nadie puede leer ni escribir. Cuando se confirme uso, sustituir por políticas por agency_id. |

  **Tabla `agencies` (solo lectura vía API)**: Para impedir que integradores creen agencias por API, conviene revocar `INSERT` en `public.agencies` para los roles `anon` y `authenticated`. La creación de agencias debe hacerse desde la app (registro/onboarding) o con service_role.

  **Funciones y `search_path`**: Las funciones en `public` deben tener `search_path` fijado (`pg_catalog`, `public`) para evitar "search path hijacking".

  **Índices**: Las claves foráneas sin índice pueden generar "Unindexed foreign keys" en auditorías; conviene añadir índices donde haga falta. Revisar también índices duplicados por tabla.

  **Importante**: El `service_role` key bypasea RLS. Las edge functions y workers que usan `SUPABASE_SERVICE_ROLE_KEY` no se ven afectados.

  **Supabase self-hosted (sin Supabase Cloud)**  
  No se usa `supabase login` ni `supabase functions deploy`: el login es solo para la cuenta de Supabase Cloud. **Convención del proyecto para self-hosted:** generar el script de deploy en el servidor con un **heredoc** (crear el archivo pegando el bloque en la consola) y luego ejecutar ese script para copiar `supabase/functions/` al volumen del Edge Runtime y reiniciar el servicio. Documentación completa (bloque heredoc listo para pegar, rutas, variables): **`supabase/scripts/README-deploy.md`** (secciones "Crear el script de deploy en el servidor (heredoc)" y "Servidor con Taimbox en ~/Taimbox y Supabase en ~/supabase-pi"). Script: `supabase/scripts/deploy-edge-functions-supabase-pi.sh`; rutas por defecto: Taimbox `$HOME/Taimbox`, Supabase docker `$HOME/supabase-pi/supabase/docker`, servicio `functions`. Flujo: (1) Crear el script en el servidor con el heredoc de README-deploy.md; (2) Tener `supabase/functions/` en el servidor (p. ej. `~/Taimbox/supabase/functions/`); (3) Ejecutar `./supabase/scripts/deploy-edge-functions-supabase-pi.sh` desde `~/Taimbox`.
  Alternativa manual: (1) Copiar la carpeta `supabase/functions/` al host del Edge Runtime; (2) Arrancar el Edge Runtime con esa ruta (p. ej. Docker: `docker run ... -v /ruta/functions:/usr/services supabase/edge-runtime start --main-service /usr/services` o script [edge-runtime](https://github.com/supabase/edge-runtime)); (3) Configurar el proxy para `.../functions/v1/<nombre-funcion>`; (4) Definir `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`. Tras cambios, actualizar archivos y reiniciar el contenedor.

  **Página de gestión**: `src/pages/ApiKeysPage.tsx` (ruta `/api-keys`, requiere permiso `can_access_api_keys`). Permite crear, listar y revocar tokens API. Enlace en Sidebar bajo "Configuración" (visible solo si el rol tiene ese permiso). La ruta `/soporte` (ContactSupportPage) requiere `can_access_support`. Ambos permisos son configurables por rol en Configuración de agencia → Equipo y permisos → sección "Configuración y soporte" (junto con Configuración de Agencia).
  **Menú Configuración (Sidebar)**: El grupo "Configuración" del Sidebar (`Sidebar.tsx`) unifica todo lo relacionado con la agencia: Mis Agencias, Gestionar miembros, Configuración de agencia, API & Integraciones, Contactar soporte, Crear nueva agencia (los tres primeros y el último solo si `can_access_agency_settings`). **Footer del Sidebar**: Con una sola agencia no hay dropdown de agencia; el nombre de la agencia y el selector "Vista por departamento" (Vista Global / departamentos) van en un único bloque integrado (nombre + vista en la misma línea; el nombre es enlace a `/agency` si el usuario tiene `can_access_agency_settings`). Con varias agencias, `AgencySelectorCompact` muestra solo la lista para cambiar de agencia (sin menú "Ir a Configuración"). `DepartmentViewSelector` admite prop `inline` para integrarse en esa fila cuando hay una sola agencia.

- **Área administrativa de plataforma (God Mode)**  
  Panel interno para la empresa (Taimbox), no para las agencias cliente.
  - **Tabla `platform_admins`**: `user_id` (PK), `role`, `created_at`. RLS habilitado pero **sin políticas** de lectura/escritura para `authenticated`/`anon`; nadie puede listar ni escribirse como admin desde el cliente. Solo accesible vía RPC con SECURITY DEFINER o con service_role.
  - **Semilla platform admin**: La tabla `platform_admins` y la RPC `is_platform_admin` deben existir en la BD. El primer admin se añade insertando su `auth.users.id` en `platform_admins` (INSERT idempotente con `ON CONFLICT (user_id) DO NOTHING`).
  - **AdminLayout**: Layout independiente que **no** usa AgencyContext ni AppContext. Rutas `/admin/*` se sirven con este layout y el guard `PlatformAdminRoute` (sesión + RPC `is_platform_admin`). No reutilizar componentes de la app principal que usen `useAgency()` en el área admin sin refactor presentacional.
  - **RPCs SECURITY DEFINER**: `is_platform_admin()`, `admin_list_agencies(p_search, p_status)`, `admin_update_agency_status(p_agency_id, p_status)`, `admin_list_platform_admins()`, `admin_add_platform_admin_by_email(p_email, p_role)`, `admin_remove_platform_admin(p_user_id)`. Toda lectura/escritura de datos "globales" (listar agencias, cambiar estado, gestionar admins de plataforma) se hace mediante estas RPCs, no con consultas directas (RLS ocultaría los datos).
  - **Gestión de administradores de plataforma**: Página `/admin/admins` (AdminAdminsPage). Listar admins (email, rol, fecha), añadir por email o crear cuenta nueva con contraseña, quitar acceso. No se puede quitar al último admin. **Añadir admin**: la app llama a la Edge Function `add-platform-admin` (body: `email`, `role`, opcionales `password`, `name`). Si se envía `password` (mín. 6 caracteres), se crea el usuario en Auth con `auth.admin.createUser` y se añade a `platform_admins`; si el email ya existe, se localiza al usuario y solo se añade a `platform_admins`. Sin contraseña, el usuario debe existir en auth. La función verifica que el caller es platform admin (RPC `is_platform_admin`). Migración: `supabase/migrations/20260218000000_platform_admin_management.sql` define las RPCs; la tabla `platform_admins` debe existir con `user_id`, `role`, `created_at`.
  - **Estado `suspended` en `agencies`**: Columna `status` (`active` | `suspended`). Si la agencia está suspendida, `ProtectedRoute` redirige a `/suspended` (excepto si la ruta es `/admin/*`, ya que esas rutas no exigen agencia). La página `/suspended` muestra mensaje y botón "Cerrar sesión". No documentar las RPCs `admin_*` ni `is_platform_admin` en la API pública (`/api-docs`).
  - **Dependencias**: `usePlatformAdmin`, `PlatformAdminRoute`, `AdminLayout`, `AdminAgenciesPage`, `AdminAdminsPage`, `AdminSupportPage`, `AdminMetricsPage`, `AdminDocsPage`, `SuspendedPage`, `ContactSupportPage`. Sidebar muestra "Administración" solo cuando `usePlatformAdmin().isPlatformAdmin` es true.

  - **Soporte (support_tickets):** Tabla `support_tickets` y tabla de respuestas con columna `is_internal`: respuestas con `is_internal = true` solo las ve el admin; `false` las ve la agencia. **Admin:** listado, crear ticket, cambiar estado; "Ver" abre Sheet con detalle, historial de respuestas (con etiqueta Interno / Al usuario) y formulario para añadir comentario interno o respuesta al usuario (`admin_add_support_ticket_reply` con `p_internal`). **App de usuario:** ruta `/soporte` (ContactSupportPage): "Nueva solicitud" (`create_support_ticket_from_app`); "Mis tickets" lista tickets de la agencia (`list_my_support_tickets`), "Ver" abre detalle con conversación (`get_my_support_ticket`, `list_my_support_ticket_replies` — solo respuestas no internas) y formulario para responder (`add_support_ticket_reply_from_app`). **Formato de mensajes:** Los mensajes se guardan como texto (Markdown); en UI se muestran con formato. En los formularios se usa un editor WYSIWYG (`SupportMessageEditor`, `src/components/support/SupportMessageEditor.tsx`) con barra de herramientas (negrita, cursiva, código) basado en Tiptap (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/markdown`, `@tiptap/extension-placeholder`). Al mostrar mensajes ya guardados se usa `SupportMessageContent` (`src/components/support/SupportMessageContent.tsx`) con `react-markdown` y `remark-breaks`.

  - **Métricas:** RPC `admin_platform_metrics()`; página `/admin/metrics`. Página estática `/admin/docs` con procedimientos internos.

  - **Acceder como agencia:** Para soporte o debugging, un platform admin puede "entrar" en la app con el contexto de una agencia. Columna `is_impersonation` en `user_agencies`; RPCs `admin_impersonate_agency(p_agency_id)` (añade/actualiza fila con `is_primary = true` para que `requesting_agency_id()` devuelva esa agencia) y `admin_stop_impersonate(p_agency_id)` (borra la fila de impersonación y restaura `is_primary` en otra). En Admin → Agencias, botón "Entrar" llama a la RPC y redirige a `/dashboard?agency=<id>`. **AgencyContext** prioriza la agencia con `is_primary` en `user_agencies` y, si no hay empleado para esa agencia, carga la agencia solo por `user_agencies` (y opcionalmente `?agency=` en la URL). **ImpersonationBanner** (`src/components/admin/ImpersonationBanner.tsx`) en AppLayout muestra "Viendo la app como agencia: [nombre]" y "Salir de vista" (llama a `admin_stop_impersonate` y redirige a `/admin/agencies`). La tabla `user_agencies` debe tener UNIQUE (user_id, agency_id). RPC `repair_user_agencies_from_employees()` repara membresías perdidas recreando filas desde la tabla `employees`. **Ver datos sin perfil de empleado:** Si el platform admin no tiene perfil en esa agencia (`currentUser` indefinido), **PermissionProtectedRoute** permite el acceso (no redirige a dashboard): se considera `isPlatformAdmin` y se deja pasar a Planificador, Deadlines, Weekly, etc. Los datos se cargan por `currentAgency.id`. En **usePlannerData**, el filtro "Solo yo" solo se aplica cuando existe `currentUser`; si no hay empleado vinculado, se muestran todos los empleados de la agencia. En **WeeklyForecastPage**, la carga de transferencias usa `currentUser?.agencyId ?? currentAgency?.id` cuando el usuario es platform admin para poder ver datos de la agencia actual.

- **Seguimiento operativo (`OperationsRadarPage.tsx`)**
  - **Filtro por departamento (una sola fuente de verdad)**: Usa exclusivamente **DepartmentViewContext** (el mismo que el Sidebar "Vista por departamento"). No hay override local en la página ni selectores adicionales de departamento en Coherencia. La selección en el Sidebar afecta tanto a la card de Coherencia como a Proyectos en alerta. Opcionalmente se puede abrir la página con `?depto=<id|nombre>` para inicializar la vista, pero Seguimiento operativo no escribe de vuelta ese parámetro.
  - **Navegación por mes**: Estado `viewDate` inicializado desde `?mes=YYYY-MM`; cabecera con anterior / "Mes actual" (MMM yyyy) / siguiente. Al montar y al cambiar mes se llama **`ensureMonthLoaded(viewDate)`** desde `useApp()` para que AppContext tenga las asignaciones de ese mes en memoria.
  - **URL persistente**: `?mes=` se lee al montar y se actualiza al cambiar de mes; el enlace es compartible y se restaura al recargar. `?depto=` solo se lee en el arranque para ajustar `DepartmentViewContext`, pero no se mantiene sincronizado automáticamente.
  - **Departamentos**: Lista desde `normalizeDepartments(currentAgency?.settings?.departments)`. Al seleccionar un departamento se aplican **dos criterios**: (1) solo se consideran proyectos con asignaciones del mes de **empleados de ese departamento** (`employeeBelongsToDepartment`); (2) de esos, solo se muestran proyectos cuyo **`responsibleDepartmentId`** coincide con el departamento seleccionado (id o nombre). Los proyectos **sin** `responsibleDepartmentId` sí se muestran si tienen horas de empleados del departamento (para no ocultar proyectos aún no asignados a un área). Así, al filtrar por SEO solo aparecen proyectos de SEO (y no de SEM u otros).
  - **Búsqueda global única (UX unificada)**: En la cabecera hay una sola barra **"Buscar proyecto o cliente..."** (Input con icono de lupa). No hay dropdown de proyecto: el usuario escribe directamente y la búsqueda aplica a **ambos paneles** (Coherencia y Estado de proyectos). Así se evita tener filtros dispersos y se alinea con el patrón de búsqueda por texto.
  - **Coherencia**: `GlobalPlanningInconsistencies` recibe `viewDate`, **`searchQuery`** y **`hideProjectSearch`**. En Seguimiento operativo se pasa `hideProjectSearch={true}`: no se muestran búsqueda ni dropdown de proyecto (evita redundancia con la barra global); solo el **filtro por empleado**, con control tipo combobox (campo "Filtrar por empleado..." clicable en toda el área, se abre lista con búsqueda). La búsqueda global filtra por nombre de proyecto o cliente. **Sin paginación**. "Expandir todo" / "Colapsar todo". Si hay más de `COHERENCE_AUTO_EXPAND_MAX` proyectos no se expanden todos por defecto.
  - **Estado de proyectos** (panel derecho): Título "Estado de proyectos". **Filtros al estilo cartera** (mismo diseño que Cartera/Proyectos): **Todos** | **Sin actividad** | **Falta planificar** | **Retrasados** | **Exceso horas** | **En regla**, con iconos y tooltips. Cada proyecto tiene **un único estado** (excluyentes, prioridad: exceso horas > retrasados > falta planificar > sin actividad > en regla). **"En regla"** solo cuando está realmente al día: sin exceso de presupuesto, sin retraso (ritmo/avance), **sin tareas pendientes de planificar** (si hay "X sin planificar" no puede estar En regla) y no "sin actividad". Lista con desplegables (Collapsible): trigger con nombre, cliente, badge del estado (Exceso horas, Retrasados, Falta planificar, Sin actividad, En regla), métricas (Contratadas, Computadas, Por computar), barra de avance y opcionalmente "X sin planificar". Al expandir: proyección, barras Estimado/Real/Computado, frase accionable. **Sin paginación**.
  - **Diferencia con otros reportes**: Reportes clásicos, Team Pulse y otros módulos también respetan `DepartmentViewContext`, pero Seguimiento operativo se centra en **riesgos operativos diarios** (coherencia planificación vs ejecución y proyectos en alerta) con explicaciones accionables en una sola vista.

- **Reportes (`ReportsPage.tsx`)**  
  - **Alertas del equipo**: Las horas planificadas y capacidad en alertas se formatean con `round2()` para evitar decimales flotantes largos (ej. 158.41 en lugar de 158.4100000000002).
  - **Predicción de carga**: La sección "Predicción de carga - Mes siguiente" prioriza el **mes siguiente** (objetivo: ver cómo puede estar el mes que viene). El "mes actual" se muestra como "Contexto: mes actual" en la segunda columna. Descripción de la card: "El objetivo es ver cómo puede estar el mes que viene."
  - **Mes actual sin doble conteo**: El "mes actual" (y la inercia/histórico para la estimación) usa **solo** `allocations` + `global_assignments`. No se suman las horas de **deadlines**, porque los deadlines son el objetivo por proyecto que ya queda reflejado en las tareas planificadas (allocations); sumar ambos producía doble conteo y cifras irreales (ej. 282h para 150h de capacidad).
  - **Vacaciones y eventos**: Tanto el **mes actual** como el **mes siguiente** usan capacidad **neta**: se resta de la capacidad base las ausencias (`getAbsenceHoursInRange`) y los eventos de equipo (`getTeamEventHoursInRange`) en ese mes, de modo que el porcentaje y las "horas libres" reflejan la realidad (vacaciones, bajas, formaciones, etc.).

- **Rentabilidad / Salud Financiera (`FinancialHealthPage.tsx`, ruta `/finanzas`)**
  - Lógica inquebrantable (contabilidad analítica, no fiscal): **F1** Coste laboral = Σ (horas reales del empleado en proyecto × coste/h del empleado). **F2** Ingreso = `monthly_fee` del proyecto (no se prorratea). **F3** Margen = Ingreso − Coste laboral (y − ads si aplica); margen % = (Margen € / Ingreso) × 100. **F4** EHR = Ingreso / Total horas reales del proyecto; si horas = 0 se muestra "Sin datos" o "--- €/h". Las fórmulas se documentan también en la landing `/reportes-rentabilidad` (sección "Cómo calculamos la rentabilidad", id `#formulas`).
  - **Buscador** único en cabecera; **toggle** "Incluir todos los proyectos"; vista por departamento aplicada. **Horas**: selector Real / Computada (horas trackeadas = computed).
  - **Coste**: En esta página el campo del empleado `hourly_rate` se usa como **coste por hora (€/h)**. El coste por proyecto es F1 (suma por empleado de horas en proyecto × su €/h). El KPI "Coste interno" global es la suma F1 de todos los empleados en vista (no la suma de nóminas).
  - **KPIs**: EHR efectivo global, Margen neto global (F3). **Radar de hemorragias**: proyectos facturables con actividad; columnas Coste (F1) y Margen (€); desglose expandible por empleado: solo **Horas (reales)** y **Coste laboral (€)** (F1 por fila). **Inversión interna**: proyectos con fee 0 € (horas, coste).
  - **Tabs**: **Resumen** (KPIs, Radar, Inversión interna, Rentabilidad por departamento, lista Rentabilidad por empleado), **Proyectos** (tabla con Ingreso F2, horas, EHR F4, Coste F1, Margen F3; desglose por empleado: horas + coste), **Empleados** (tabla: Horas, Coste laboral F1; desglose por proyecto: horas + coste). No hay "ingreso atribuido" por empleado (F2 es a nivel proyecto).
  - **EHR** se calcula a nivel proyecto (F4). Proyectos internos (fee 0): margen negativo en rojo; EHR 0 o "Sin datos".

- **Modificar permisos**:
    - Añadir el flag en `UserPermissions` y en `ROUTE_PERMISSIONS` (si protege una ruta) en `src/types/permissions.ts`.
    - Añadir etiqueta en `PERMISSION_LABELS` y valor por defecto en `DEFAULT_PERMISSIONS`.
    - Editar `src/hooks/usePermissions.ts`: añadir la clave en `RESTRICTED_PERMISSIONS` y, si aplica, lógica de compatibilidad para roles ya guardados (ej. nuevos permisos que se derivan de uno existente hasta que se edite el rol).
    - Añadir el permiso en la lista por sección en Configuración de agencia → Equipo (`AgencySettingsPage.tsx`).
    - **Seguimiento operativo** (`/operaciones`) y **Rentabilidad** (`/finanzas`) tienen permisos propios: `can_access_operations_radar` y `can_access_financial_health`. El permiso "Reportes" pasó a etiquetarse como "Reportes clásicos" y solo controla `/reportes-clasicos`.
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
| `dateUtils.ts` → `isAllocationInEffectiveMonth()` | `AppContext.tsx`, `usePlannerData.ts`, `useProjectMetrics.ts` |
| `budgetUtils.ts` → `getEffectiveBudget()` | `DeadlinesPage`, `WeeklyForecastPage`, `ClientsAndProjectsPage`, `useAllocationSheet` |
| `deadlineUtils.ts` → `fetchDeadlinesForMonth(monthKey, agencyId)` | `useDeadlines`, `DeadlinesPage`, `AllocationSheet`, `EmployeeDashboard`, `ReportsPage`, `WeeklyForecastPage`, `ClientsAndProjectsPage`, `PlanningInconsistenciesCard`, `MyWeekView`, `GlobalPlanningInconsistencies` |
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
| `useProjectMetrics.ts` | `ReportsPage.tsx`, `ProjectImpactSummary.tsx` |
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
| `src/hooks/use-mobile.tsx` | Detección de dispositivo móvil (breakpoint 768px) | UI responsiva: `AppLayout` (ya no bloquea móvil), `PlannerGrid` → `MobilePlannerView`, `AllocationSheet` (vista semanal/mensual en cards, toggles Semana/Mes ≥44px), `AllocationTaskRow` (isMobile), `DeadlinesPage` (filtros/edición en Sheet), `Sidebar` |
| `src/hooks/useProjectAliasing.ts` | Formateo de nombres de proyectos según reglas de agencia | `AgencyContext`, `formatProjectName`, usado en 15+ componentes |
| `src/utils/deadlineUtils.ts` | Carga de deadlines por mes filtrando por agencia (multi-tenant) | `fetchDeadlinesForMonth(monthKey, agencyId)`; join con `projects.agency_id`. Usado por `useDeadlines`, DeadlinesPage, AllocationSheet, EmployeeDashboard, ReportsPage, WeeklyForecastPage, ClientsAndProjectsPage, PlanningInconsistenciesCard, MyWeekView, GlobalPlanningInconsistencies |
| `src/hooks/useDeadlines.ts` | Carga y estado de deadlines; opción `agencyId` para filtrar por agencia | `deadlineUtils.fetchDeadlinesForMonth` |

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
- **Función en BD**: `cleanup_employee_data(p_employee_id uuid)` está definida en `20260221110000_cleanup_employee_data.sql` y actualizada en `20260221140000_create_timer_sessions.sql`. Elimina: `active_timers`, `timer_sessions`, `time_entries`, `allocations`, `absences`, `weekly_feedback`, `user_routines`, `professional_goals`, `task_transfers`; actualiza `deadlines.employee_hours` y `team_events.affected_employee_ids`.
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

#### 11.3 Calidad del Copy y Ortografía
Al añadir nuevas secciones a las landing pages o guías, se debe prestar especial atención a:
- **Acentos en mayúsculas y minúsculas**: Palabras como *día, más, catálogo, módulo, verás, podrá* deben llevar siempre su tilde correspondiente.
- **Evitar Spanglish innecesario**: Usar "cliente" en lugar de "client" y "horas" en lugar de "hours" en el contenido dirigido al usuario final.
- **Consistencia en Títulos**: Los títulos de secciones en la `GuiaPage` deben seguir una jerarquía lógica y revisarse para evitar errores ortográficos tras actualizaciones.
