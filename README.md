# ⏳ Taimbox - Plataforma de Gestión de Agencia

![React](https://img.shields.io/badge/React-18-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase)
![Vite](https://img.shields.io/badge/Vite-Build-yellow?logo=vite)

**Taimbox** es un sistema integral para la gestión de recursos, planificación de proyectos y control financiero de agencias de marketing. Esta documentación sirve como bitácora técnica completa y mapa de dependencias.

---

> [!IMPORTANT]
> **Para Agentes de IA y Desarrolladores**: Este archivo es un resumen de alto nivel. Para detalles técnicos profundos, flujos de datos complejos y guías de implementación, **consultar obligatoriamente** [`DOCUMENTACION.md`](./DOCUMENTACION.md). **Documentación del proyecto:** solo estos dos archivos (README.md y DOCUMENTACION.md); no hay otros `.md` de documentación en el repo — mantener toda la información aquí o en DOCUMENTACION para evitar documentación dispersa.

---

## 🗺️ Mapa del Territorio

El proyecto se divide en **Módulos Funcionales**. Haz clic en cada sección para desplegar el análisis detallado **Archivo por Archivo**.

<details open>
<summary><h2>🏗️ Fase 1: Fundamentos & Tipos</h2></summary>

### 1.1 `src/types/index.ts` - Contratos de Datos
**Ubicación**: `src/types/index.ts` | **Interfaces**: 35+

El archivo más importante para contratos de datos.

#### Tipos Principales

| Interface | Campos Clave | Descripción |
|-----------|--------------|-------------|
| **`Allocation`** | `id`, `employeeId`, `projectId`, `hoursAssigned`, `hoursActual`, `status` | **CORE**: Tarea asignada. Unidad atómica del calendario. |
| **`Deadline`** | `projectId`, `month`, `employeeHours`, `budgetOverride` | Configuración mensual por proyecto (distribución y ajuste de budget). En multi-tenant se cargan filtrando por agencia vía join con `projects`. |
| **`Employee`** | `id`, `defaultWeeklyCapacity`, `workSchedule`, `role`, `department` | Define horario base (horas por día); la capacidad semanal se deriva del horario, no es campo editable en la UI. `department`: id del departamento principal. |
| **`Project`** | `id`, `budgetHours`, `monthlyFee`, `status`, `responsibleDepartmentId` | Contenedor de asignaciones. `responsibleDepartmentId` opcional para filtrado en reportes por departamento. |
| **`AgencySettings`** | `roles`, `modules`, `departments`, `integrations`, `projectAliasingRules`, `planningPrecisionExclusions`, `radarLowProgressExcludeKeywords` | Configuración multi-tenant. `departments`: lista de áreas (id, nombre, color) para **Vistas por Departamento**. Exclusiones para precisión de planificación. Palabras clave para excluir proyectos del riesgo «Poco avance» en Radar operativo. |
| **`RolePermissions`** | `name`, `is_system_role`, `permissions` | Rol con permisos configurables por agencia. |
| **`ProjectAliasingRule`** | `displayPrefix`, `matchPatterns`, `virtualClientName` | Regla para renombrar proyectos (ej: Kit Digital → KD:). |
| **`WorkSchedule`** | `monday`...`sunday` | Horas laborables por día (0-24). |
| **`UserPermissions`** | `can_access_planner`, `can_edit_tasks`, etc. | 18 flags de permisos granulares. |

#### Relaciones
- `Allocation` -> pertenece a `Employee` y `Project`.
- `Project` -> pertenece a `Client`.
- Todos pertenecen a `Agency`.

### 1.2 `src/App.tsx` - Entry Point
**Ubicación**: `src/App.tsx`

Configura la jerarquía de **Providers** y el Router con las rutas de la aplicación.
- **Jerarquía**: `Helmet` > `QueryClient` > `Auth` > `Agency` > `App` > `Goals` > `Notification` > `Tooltip`.
- **Protección**: Usa `ProtectedRoute` (Auth) y `PermissionProtectedRoute` (RBAC).

### 1.3 `src/lib/supabase.ts`
Cliente singleton de Supabase. Requiere `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

</details>

<details>
<summary><h2>🧠 Fase 2: Gestión de Estado (Contexts)</h2></summary>

### 2.1 `AppContext.tsx` (Core Data)
**Líneas**: ~1500 | **Estado**: Crítico

Gestiona la carga de la base de datos principal (`employees`, `projects`, `allocations`).

#### Lógica de Carga y UPSERT (Anti-Stale)
Cuando se cargan nuevos datos (ej. navegar a otro mes), NO reemplazamos todo. Hacemos un **merge inteligente**:
```typescript
// Ejemplo simplificado de lógica de merge
setAllocations(prev => {
  const incomingMap = new Map(newAllocations.map(a => [a.id, a]));
  // 1. Actualizar existentes
  const updated = prev.map(p => incomingMap.has(p.id) ? incomingMap.get(p.id) : p);
  // 2. Añadir nuevos
  const newItems = newAllocations.filter(a => !prevMap.has(a.id));
  return [...updated, ...newItems];
});
```

#### Lazy Loading de Meses
Para optimizar rendimiento, usamos `loadedMonthsRef`.
- `ensureMonthLoaded(date)`: Verifica si el mes ya está en memoria.
- Si ya existe en `loadedMonthsRef` -> **Retorno inmediato** (0 latencia).
- Si no -> Fetch a Supabase -> Merge -> Añadir a Ref.

#### Realtime Optimizado
- Estrategia de **Canales Unificados** por sala (mes/contexto) para reducir conexiones.
- Sistema de **Locking** para evitar conflictos de edición.
- Ver detalle técnico en `DOCUMENTACION.md` Sección 4.3.

### 2.2 `AgencyContext.tsx` (Multi-Tenant)
- **Propósito**: Aisla datos por agencia.
- **Key Function**: `switchAgency(id)` limpia todo el estado y recarga.

### 2.3 `DepartmentViewContext.tsx` (Vistas por Departamento)
- **Propósito**: Gestiona la vista activa: **Vista Global** (todo) o un departamento concreto (ej. Marketing).
- **Estado**: `selectedDepartmentId` (null = global, string = id del departamento).
- **Persistencia**: `localStorage` por agencia (`timeboxing_department_view_${agencyId}`).
- **Consumidores**: Sidebar (selector), barra de aviso bajo el header, Planificador, Team Pulse, Reportes.

### 2.4 Otros Contextos
- **`GoalsContext`**: OKRs y Objetivos Profesionales.
- **`NotificationContext`**: Centro de notificaciones.
- **`AuthContext`**: Sesión de usuario Supabase.
- **`DemoContext`**: Datos mock para modo demostración.

</details>

<details>
<summary><h2>🛠️ Fase 3: Utilidades Críticas</h2></summary>

Archivos de lógica pura que son dependencias de todo el sistema.

### 3.1 `src/utils/dateUtils.ts` (Split Weeks)
**CRÍTICO**: Implementa la lógica de "Semanas Partidas".

Taimbox fuerza una separación estricta de meses.
- **Problema**: La semana del 29 Dic (Lun) al 4 Ene (Dom) pertenece a dos meses fiscales diferentes.
- **Solución (`getWeeksForMonth`)**:
    1. Genera la semana visual normal.
    2. Calcula `effectiveStart` y `effectiveEnd` recortando los días que no son del mes actual.
    3. **Resultado**: La misma semana física aparece visualmente en Diciembre (29-31) y en Enero (1-4).

### 3.2 `src/utils/capacityUtils.ts` (Anti-Double-Counting)
**CRÍTICO**: Cálculo exacto de disponibilidad.

Evita restar horas dos veces cuando coinciden eventos.
**Fórmula**:
```typescript
function getDailyReduction(date, employee, absences, teamEvents) {
  const scheduled = getScheduledHours(date, employee); // Ej. 8h
  const absHours = getAbsenceHours(date, absences);    // Ej. 8h (Baja)
  const evtHours = getEventHours(date, teamEvents);    // Ej. 8h (Festivo)
  
  // NO sumar (8+8=16). Tomar el MAYOR impacto.
  return Math.min(scheduled, Math.max(absHours, evtHours));
}
```

### 3.3 `src/utils/taskPermissions.ts` (Reglas de Editabilidad)
Centraliza la lógica de quién puede tocar qué.
- `canEditTask(allocation, user, agencySettings)`:
    - Retorna `false` si la tarea tiene `isLocked: true`.
    - Retorna `false` si el departamento cerró (ej. Viernes 14:00), no es admin, **y `weeklyEnabled !== false`**.
    - Retorna `true` si es el propio usuario o tiene permiso `can_assign_tasks_to_others`.
- `isWeekEditable(weekStartDate, config, now, weeklyEnabled)`: Si `weeklyEnabled` es `false`, siempre retorna `true`.

### 3.4 `src/utils/logger.ts` (Logging)
- Sistema centralizado de logs (`info`, `warn`, `error`) con soporte para entornos dev/prod.

</details>

<details>
<summary><h2>🎣 Fase 4: Custom Hooks</h2></summary>

Lógica reutilizable de UI.

### 4.1 `src/hooks/useAllocationSheet.ts`
**Lógica de Negocio de Allocations**.
- **Input**: `employeeId`, `viewDate`.
- **Output**:
    - `projects`: Lista filtrada y ordenada.
    - `getProjectBudgetStatus(projectId)`: Retorna `{ totalPlanned, totalComputed, budgetMax, isPacing }`.
    - `updateInlineHours`: Función optimista para editar horas en la grilla.

### 4.2 `src/hooks/useAllocationActions.ts` (Nuevo)
**Lógica CRUD de Asignaciones**.
- Centraliza operaciones: `addTask`, `updateTask`, `deleteTask`, `inlineEditing`.
- Gestiona el estado del formulario modal y ediciones en línea.

### 4.2b `src/hooks/usePermissions.ts` (Seguridad)
**Sistema Central de Seguridad**.
- `canAccess(route)`: Valida contra `ROUTE_PERMISSIONS`.
- `hasPermission(flag)`: Valida contra `UserPermissions`.
- **Fallbacks**: Si `agencySettings.roles` está vacío, usa `RESTRICTED_PERMISSIONS`.

### 4.3 `src/hooks/useTasksImpact.ts` (Simulación)
**Pre-Cálculo de Presupuesto**.
- Antes de guardar, simula:
    - ¿El proyecto X se pasará de presupuesto?
    - ¿El empleado Y tendrá carga > 100%?
- Retorna `tasksImpact` con arrays de `projects` y `weeks` afectados.

### 4.4 Otros Hooks
- **`usePlannerData`**: Controla `currentMonth` y `loadedMonths`. Aplica filtro por **departamento** (empleados visibles) cuando hay vista por departamento activa.
- **`useProjectMetrics`**: Centraliza fórmulas de rentabilidad (`hoursValue`, `progressOperational`).
- **`useTaskTransfers`**: Máquina de estados para transferencias (`pending` -> `accepted/rejected`).
- **`use-mobile.tsx`**: Detecta viewport (mobile vs desktop) para Layouts adaptativos.
- **`useAppOrDemo`**: Selecciona contexto real o demo automáticamente.
- **`useDashboardView`**: Gestiona la configuración de vista del dashboard del empleado por departamento (siempre vista semanal; modo Zen eliminado).
- **`useDeadlines`**: Lógica de carga y gestión de deadlines. Acepta `{ agencyId }` para multi-tenant; usa `fetchDeadlinesForMonth()` de `utils/deadlineUtils.ts` para filtrar por agencia cuando varias comparten el mismo Supabase.
- **`useIntegration`**: Detecta integraciones habilitadas por agencia.
- **`useProjectFilters`**: Filtros personalizados de proyectos por agencia.
- **`useWeeklyCloseDay`**: Calcula el día de cierre semanal configurable.

### 4.5 `src/hooks/useProjectAliasing.ts` (Formateo de Nombres)
**Sistema de Aliasing de Proyectos**.
- **Propósito**: Formatea nombres de proyectos según reglas configurables por agencia.
- **Uso**: Centraliza la lógica de `formatProjectName` usando las reglas de `currentAgency.settings.projectAliasingRules`.
- **Ejemplo**: Proyectos "Kit Digital" → "KD: [Cliente]"
- **Hook**:
```typescript
const { formatName: formatProjectName } = useProjectAliasing();
// Usar: formatProjectName(project.name)
```
- **Consumidores**: `DeadlinesPage`, `EmployeeDashboard`, `AllocationSheet`, `WeeklyForecastPage`, y todos los componentes que muestran nombres de proyectos.

</details>

<details>
<summary><h2>🧩 Fase 5: Componentes Complejos</h2></summary>

### 5.1 Planificación (`src/components/planner`)
- **`PlannerGrid.tsx`**:
    - Grilla virtualizada (renderiza solo lo visible).
    - Gestiona selección de celdas (`selectedCell`) y navegación con teclado.
    - **Móvil**: Si `useIsMobile()` es true, renderiza `MobilePlannerView` (tarjetas por empleado, selector de semana anterior/siguiente, celdas táctiles ≥44px). No se reutiliza la tabla desktop.
- **`MobilePlannerView.tsx`** (vista móvil del planner):
    - Una Card por empleado con cabecera (avatar, nombre, carga mensual). Selector de semana con Anterior/Siguiente. Una `WeekCell` por semana seleccionada con `touchTarget` (área mínima 44×44px).
- **`WeekCell.tsx`**:
    - Prop opcional `touchTarget`: en móvil aplica `min-h-[44px] min-w-[44px]` y refuerzo visual de overload (AlertTriangle + AlertCircle). Horas en `text-base font-mono`.
- **`AllocationSheet.tsx`** (detalles móvil: padding `px-3`, botones ≥44px, sidebar oculto, cards semana `w-[85vw]`):
    - **Vista semanal/mensual en móvil**: Lista de tareas como cards (no tabla); texto base `text-sm`, horas en `text-base font-mono`; área táctil y `touch-manipulation`. Carrusel mensual con `pr-4` en móvil; toggles Semana/Mes con etiqueta y altura ≥44px.
    - **Modo Batch**: Permite editar múltiples semanas a la vez.
    - **Validación Visual**: Muestra barras de progreso de presupuesto en tiempo real.
    - **Refactorizado**: Dividido en subcomponentes (`AllocationProjectHeader`, `AllocationTaskRow`, `AllocationFormDialog`) y hook lógico (`useAllocationActions`) para mejorar mantenibilidad.

### 5.2 Equipo (`src/components/team`)
- **`EmployeeDialog.tsx`**:
    - **Dual Write**: Crea registro en `public.employees` Y usuario en `auth.users` (vía Edge Function).
- **`AbsencesSheet.tsx`**:
    - Calendario visual para marcar rangos de fechas.
    - Valida que la fecha fin > fecha inicio.
    - Calcula días hábiles afectados usando `capacityUtils`.

</details>

<details>
<summary><h2>📄 Fase 6: Páginas (24 archivos)</h2></summary>

Todas las páginas principales de la aplicación.

### Planificación y Operaciones
| Página | Tamaño | Descripción |
|--------|--------|-------------|
| `EmployeeDashboard.tsx` | 40KB | Vista personal del empleado ("Mi Semana"). **Móvil**: Dialog→Sheet para "Gestión interna" y "Añadir tareas"; navegación mes con botones ≥44px. |
| `DeadlinesPage.tsx` | ~670 líneas | Gestión de fechas límite mensuales. **Datos**: `useDeadlinesPageData.ts` (carga, Realtime, locks, filtros, capacidad). **Edición inline**: `useDeadlinesEditing.ts` (locks, formulario inline, autoSave). **Sugerencias**: `useDeadlinesRedistribution.ts`. **Filtros** en `DeadlinesFilters.tsx`; **listado** en `DeadlinesProjectList.tsx`. **Extraídos**: `DeadlinesPageHeader.tsx`, `DeadlinesSidebar.tsx`, `DeadlinesProjectEditSheet.tsx`, `DeadlinesConfirmDialog.tsx`. Ver DOCUMENTACION.md. **Móvil**: filtros y edición en Sheet. |
| `WeeklyForecastPage.tsx` | 94KB | Previsión y confirmación semanal |
| `TeamCapacityPage.tsx` | 26KB | Vista de carga del equipo completo |
| `TeamPage.tsx` | 4KB | Listado de empleados |
| `TeamPulsePage.tsx` | 14KB | Métricas de salud del equipo |

### Clientes y Proyectos
| Página | Tamaño | Descripción |
|--------|--------|-------------|
| `ClientsAndProjectsPage.tsx` | ~2280 líneas | Gestión dual cliente/proyecto. **Filtros** en `ClientsAndProjectsFilters.tsx` (búsqueda, estado, tipo, empleado, análisis); página usa `filterSnapshot` vía `onFiltersChange`. |
| `ProjectsPage.tsx` | 58KB | Gestión de proyectos con OKRs |
| `ClientsPage.tsx` | 38KB | CRUD de clientes |
| `OkrsPage.tsx` | 41KB | Objetivos y resultados clave |

### Reportes y Analytics
| Página | Tamaño | Descripción |
|--------|--------|-------------|
| `FinancialHealthPage.tsx` | ~35KB | Rentabilidad (ruta `/finanzas`): Buscador, KPIs, Radar de hemorragias, tabs Resumen/Proyectos/Empleados. Incluye **contexto mes** (badge Mes en curso / Mes cerrado), **ingreso devengado** en mes en curso, columna **Ritmo (pacing)** y fallback de coste dinámico cuando &lt;25% del mes. |
| `OperationsRadarPage.tsx` | — | Seguimiento operativo: **una sola búsqueda** en cabecera (aplica a ambos paneles). Coherencia sin filtros locales de proyecto (solo filtro por empleado tipo combobox). Estado de proyectos: **por defecto Todos**; modos Todos | Aviso bajo y en regla | Solo con avisos; desplegables con ritmo necesario (h/día) y enlace a Deadlines. Vista por departamento del Sidebar. |
### Publicidad (Ads)
| Página | Tamaño | Descripción |
|--------|--------|-------------|
| `AdsPage.tsx` | 67KB | Integración Google Ads |
| `MetaAdsPage.tsx` | 46KB | Integración Meta/Facebook Ads |

### Configuración
| Página | Tamaño | Descripción |
|--------|--------|-------------|
| `AgencySettingsPage.tsx` | 60KB+ | Configuración de agencia por secciones: General, Equipo (roles), **Departamentos** (nombre + color por área), Proyectos (filtros/aliasing), Módulos, Integraciones (Google Ads OAuth + Meta Ads), Apariencia, **Plan y facturación** (Stripe). Navegación lateral; pestaña activa por `?tab=`. |
| `SettingsPage.tsx` | 6KB | Preferencias de usuario |
| `AgenciesPage.tsx` | 8KB | Selector de agencias |
| `AgencyManagementPage.tsx` | 19KB | Administración avanzada de agencia |
| `ApiKeysPage.tsx` | ~15KB | Gestión de tokens API por agencia (crear, listar, revocar). Ruta `/api-keys`. |
| `GoogleCallbackPage.tsx` | ~2KB | Página de transición OAuth. Captura `?code=` de Google, invoca `exchange-google-token`, redirige a `/agency`. Sin AppLayout. |

### Área administrativa (solo plataforma)
| Página / Ruta | Descripción |
|---------------|-------------|
| `/admin` | Redirige a `/admin/agencies`. Solo accesible si el usuario está en `platform_admins` (RPC `is_platform_admin`). |
| `/admin/agencies` | Listado de agencias con columnas Plan, Suscripción y Trial hasta; filtros por estado y por plan (Starter/Pro/Business). Suspender/Reactivar. **Forzar plan**: menú por fila (icono tarjeta) para asignar Starter/Pro/Business (RPC `admin_set_agency_plan`). Botón **Entrar**: acceder a la app como esa agencia (ver deadlines, planner, etc. con su contexto). |
| `/admin/admins` | **Administradores de plataforma**: listado de usuarios con acceso a /admin (no vinculados a agencia). Añadir por email (el usuario debe existir en el sistema), quitar acceso. No se puede quitar al último admin. |
| `/admin/support` | Tickets de soporte: listado, filtros, crear ticket, cambiar estado. Botón "Ver" abre detalle con comentarios internos y formulario para añadir respuestas. |
| `/admin/metrics` | Métricas de plataforma: total agencias (activas/suspendidas), empleados, usuarios con agencia, tickets por estado. |
| `/admin/docs` | Documentación interna con procedimientos para el equipo admin. |
| `/suspended` | Página estática cuando la agencia del usuario tiene `status = suspended`. Mensaje y botón "Cerrar sesión". Fuera de AppLayout. |

**App de usuario (soporte):** Ruta `/soporte`: (1) Formulario "Nueva solicitud" que crea un ticket (RPC `create_support_ticket_from_app`). (2) "Mis tickets": listado de tickets de la agencia con estado y fecha; botón "Ver" abre detalle con conversación (respuestas visibles) y formulario para responder (RPCs `list_my_support_tickets`, `get_my_support_ticket`, `list_my_support_ticket_replies`, `add_support_ticket_reply_from_app`). Los mensajes admiten formato con un editor WYSIWYG (barra de herramientas: negrita, cursiva, código); el contenido se guarda como Markdown y se muestra formateado con `SupportMessageContent`. En Configuración hay tarjeta y en Sidebar enlace "Contactar soporte".

**Nota:** Las rutas `/admin/*` no dependen de agencia; el panel usa RPCs con SECURITY DEFINER. **Acceder como agencia:** RPCs `admin_impersonate_agency(p_agency_id)` y `admin_stop_impersonate(p_agency_id)`; columna `is_impersonation` en `user_agencies`. Al entrar en una agencia de la que no eres miembro se muestra un banner "Viendo como [Agencia]" con botón "Salir de vista".

### Otros
| Página | Tamaño | Descripción |
|--------|--------|-------------|
| `PreciosPage.tsx` | — | Página pública de precios (`/precios`): planes Starter, Pro y Business con CTAs a registro. |
| `PrivacyPolicyPage.tsx` | ~11KB | Página pública de Política de Privacidad (`/privacidad`). |
| `TermsOfServicePage.tsx` | ~12KB | Página pública de Condiciones del Servicio (`/condiciones`). |
| `LandingPage.tsx` | ~80KB | Página pública de marketing (home). Usa `LandingHeader` (header fijo unificado con mega-menú `FeaturesDropdown`, enlaces Guía/API/Login, menú hamburguesa móvil). **Footer** con enlace a "Por qué Taimbox" (`/por-que-timeboxing`), **Blog** (`/blog`), demo, guía, API y **Cookies** (abre preferencias RGPD). **Banner de cookies** (`CookieBanner.tsx`): barra intrusiva con overlay RGPD, "Aceptar todas" / "Solo necesarias" / "Personalizar", persistencia en `localStorage` (`timeboxing_cookie_consent`), modal de preferencias. **Google Consent Mode v2 para GTM**: 4 cookies `timeboxing_gtm_analytics_storage`, `timeboxing_gtm_ad_storage`, etc. (valor `granted`/`denied`) + dataLayer evento `cookie_consent_update`. Ver DOCUMENTACION.md (Google Consent Mode v2). **Demo interactiva** (Planificador, Dashboard, Weekly, Deadlines): barra de navegación destacada con fondo indigo, texto "Elige qué explorar:" e iconos por módulo; responsive y usable en móvil y escritorio. Carousel de features con enlaces a landings comerciales. Schema JSON-LD SoftwareApplication en Helmet. Componentes: `LandingHeader.tsx`, `FeaturesDropdown.tsx`, `LandingFooter.tsx`, `CookieBanner.tsx`, `CalendarPreview.tsx`. Utilidad: `src/lib/cookieConsent.ts`. |
| `ArticlePage.tsx` | ~3KB | Página pública del artículo largo en `/por-que-timeboxing`. Usa `LandingHeader`. Renderiza `LandingArticle` (6 bloques: Gancho, Teoría, Problema en agencias, Solución con DemoPlanner lazy, Arquitectura/API, CTA). Schema JSON-LD Article + SoftwareApplication. Enlazada desde el footer de la home. |
| `BlogPage.tsx` | ~3KB | Página pública índice del blog en `/blog`. Listado de artículos (datos en `src/data/blogPosts.ts`). Solo enlazada desde el footer (no en menú principal). |
| `WhatIsTimeboxingPage.tsx` | ~2KB | Artículo "Qué es el timeboxing" en `/blog/que-es-timeboxing`. La ruta antigua `/que-es-timeboxing` redirige aquí (301). Usa `WhatIsTimeboxingArticle`, `LandingHeader`, `LandingFooter`. |
| `PlanificacionProyectosCronogramaRecursosPage.tsx` | ~3KB | Artículo "Planificación de proyectos: cronograma, presupuesto y recursos" en `/blog/planificacion-proyectos-cronograma-recursos`. Usa `PlanificacionProyectosArticle` en `src/components/landing/blog/`. |
| `EmployeeDashboardLandingPage.tsx` | ~3KB | Landing comercial pública en `/dashboard-empleado`. Usa `LandingHeader`. Presenta las funcionalidades del dashboard del empleado con 6 secciones y mockups CSS. Componentes: `LandingHeader.tsx`, `EmployeeDashboardArticle.tsx`, `LandingFooter.tsx`. |
| `PlannerLandingPage.tsx` | ~3KB | Landing comercial pública en `/planificador-recursos`. Usa `LandingHeader`. Grid de planificación semanal, asignación con vista de impacto, dependencias y semanas partidas. Componentes: `LandingHeader.tsx`, `PlannerArticle.tsx`, `LandingFooter.tsx`. |
| `TeamLandingPage.tsx` | ~3KB | Landing comercial pública en `/gestion-equipos`. Usa `LandingHeader`. Perfiles de equipo, calendario de ausencias, capacidad mensual y Team Pulse. Componentes: `LandingHeader.tsx`, `TeamArticle.tsx`, `LandingFooter.tsx`. |
| `ReportsLandingPage.tsx` | ~3KB | Landing comercial pública en `/reportes-rentabilidad`. Usa `LandingHeader`. Dashboard de rentabilidad, informes de cliente, weekly forecast y exportaciones. Componentes: `LandingHeader.tsx`, `ReportsArticle.tsx`, `LandingFooter.tsx`. |
| `ProjectsLandingPage.tsx` | ~3KB | Landing comercial pública en `/control-proyectos`. Usa `LandingHeader`. Gestión de proyectos, deadlines mensuales, OKRs y control de coherencia. Componentes: `LandingHeader.tsx`, `ProjectsArticle.tsx`, `LandingFooter.tsx`. |
| `IntegrationsLandingPage.tsx` | ~3KB | Landing comercial pública en `/integraciones`. Usa `LandingHeader`. Google Ads, Meta Ads, API REST y sistema weekly. Componentes: `LandingHeader.tsx`, `IntegrationsArticle.tsx`, `LandingFooter.tsx`. |
| `GuiaPage.tsx` | ~18KB | Guía de funcionalidades pública (`/guia`, `/guia/:section`). Usa `LandingHeader`. Contiene 6 componentes de contenido reutilizables (FeatureCard, ExampleBox, TipBox, WarningBox, StepList, InfoGrid), navegación prev/next entre secciones y contenido detallado para las secciones del producto (planificador, mi-espacio, equipo, tiempos, clientes-proyectos, configuracion, informes, etc.). |
| `ApiDocsPage.tsx` + `api-docs/` | Shell ~3KB + ~30 archivos | Documentación pública de la API (`/api-docs`). Header propio con sidebar lateral (desktop) y Sheet hamburguesa (mobile con enlaces Inicio/Guía para navegar fuera). **Arquitectura modular** en `src/pages/api-docs/` (data, components, sections). Sidebar colapsable con búsqueda (Ctrl+K), 4 grupos: Overview (5), Tutoriales (5), SDK y REST (4), Referencia (17 tablas con ResponseExample JSON). Incluye 5 tutoriales paso a paso, changelog, buenas prácticas de seguridad y ejemplos SDK+cURL por recurso. |
| `PresentationPage.tsx` | ~18KB | **Herramienta de ventas (pitch de ROI)** en `/pitch` (noindex). 15 slides fullscreen: Portada, Contexto, Problema, Coste (15.000€/mes), Before/After, Solución (3 pilares), 6 feature slides, Seguridad, ROI (180.000€/año) y CTA. Enlazada desde: **Hero** de la landing ("El coste de no medir (3 min)"), **CTA final** ("Ver presentación de ROI"), **Footer** (Producto + anclaje de valor "¿Te parece caro? Mira cómo recuperas la inversión") y **Sidebar** de la app (banner para administradores con agencia recién creada). Mockups en `PresentationMockups.tsx`. Navegación ← → teclado, clic lateral, swipe táctil y dots. |
| `Login.tsx` | 16KB | Autenticación con Supabase |
| `Index.tsx` | <1KB | Redirección inicial |
| `NotFound.tsx` | <1KB | Error 404 |

**Uso del pitch como herramienta de ventas (outreach)**  
URL directa para LinkedIn / email en frío: `https://[tu-dominio]/pitch`.  
Mensaje sugerido para Alex: *"Hola [Nombre], he analizado la rentabilidad media de agencias como la tuya y los datos son alarmantes. Te dejo una presentación interactiva de 2 minutos donde desgloso dónde se están perdiendo los márgenes: [enlace a /pitch]"*. Enviar el enlace a la presentación en lugar de la home posiciona consultoría financiera envuelta en software.

</details>

<details>
<summary><h2>⚙️ Fase 7: Servicios Core</h2></summary>

### `src/services/errorService.ts`
Manejo centralizado de errores.
- **`handle(error, context, options)`**: Loggea, muestra toast, y opcionalmente reporta a servicio externo.
- **Integración**: Preparado para Sentry/LogRocket (comentado).

### `src/services/auditService.ts`
Sistema de auditoría para cambios críticos.
- **Registra**: Quién hizo qué, cuándo, en qué entidad.
- **Uso**: Cambios críticos que requieren auditoría (configuración, etc.).

### Edge Functions (Supabase)
**Supabase self-hosted:** no se usa `supabase login` ni `supabase functions deploy`. Para estos casos:
1. **Crear el script de deploy en el servidor** con un heredoc (copiar/pegar el bloque completo ver DOCUMENTACION.md, sección Despliegue de Edge Functions (self-hosted)).
2. **Tener la carpeta** `supabase/functions/` en el servidor (p. ej. en `~/Taimbox/supabase/functions/`, por rsync o clonando el repo).
3. **Ejecutar el deploy:** `cd ~/Taimbox && ./supabase/scripts/deploy-edge-functions-supabase-pi.sh`

Detalle completo: DOCUMENTACION.md (sección 7 "Supabase self-hosted" y subsección Despliegue de Edge Functions).

| Función | Archivo | Descripción |
|---------|---------|-------------|
| `create-user` | `supabase/functions/create-user/index.ts` | Crear usuarios de Auth (requiere admin). |
| `delete-user` | `supabase/functions/delete-user/index.ts` | Eliminar usuarios de Auth. |
| `update-user` | `supabase/functions/update-user/index.ts` | Actualizar usuarios de Auth. |
| `register-agency` | `supabase/functions/register-agency/index.ts` | Registro de nueva agencia. |
| `invite-user-to-agency` | `supabase/functions/invite-user-to-agency/index.ts` | Invitar usuario a agencia. |
| `sync-google-ads` | `supabase/functions/sync-google-ads/index.ts` | Sincronizar datos de Google Ads. |
| `sync-meta-ads` | `supabase/functions/sync-meta-ads/index.ts` | Sincronizar datos de Meta Ads. |
| **`generate-api-token`** | `supabase/functions/generate-api-token/index.ts` | Genera JWT firmado con claim `agency_id` para acceso API. Verifica permisos admin. Guarda hash en `api_tokens`. |
| **`revoke-api-token`** | `supabase/functions/revoke-api-token/index.ts` | Revoca un token API (`is_active = false`). Verifica permisos admin. |
| **`add-platform-admin`** | `supabase/functions/add-platform-admin/index.ts` | Añade un administrador de plataforma (body: email, role; opc. password, name). Si se envía contraseña, crea el usuario en Auth y lo añade a `platform_admins`; si no, el usuario debe existir. Verifica caller con `is_platform_admin`. Usado desde `/admin/admins`. |
| **`create-checkout-session`** | `supabase/functions/create-checkout-session/index.ts` | Crea sesión de Stripe Checkout para suscripción (Pro/Business). Requiere `STRIPE_SECRET_KEY`. Crea o recupera Customer en Stripe, devuelve URL de pago. Ver **Suscripciones (Stripe)** en DOCUMENTACION.md. |
| **`create-billing-portal-session`** | `supabase/functions/create-billing-portal-session/index.ts` | Crea sesión del Customer Portal de Stripe (body: `agency_id`). El usuario puede gestionar método de pago, facturas o cancelar la suscripción. Requiere `STRIPE_SECRET_KEY`. Redirige de vuelta a `/agency?tab=billing`. |
| **`stripe-webhook`** | `supabase/functions/stripe-webhook/index.ts` | Webhook de Stripe: actualiza `agencies` (plan_id, subscription_status, trial_ends_at) según eventos de suscripción. Requiere `STRIPE_WEBHOOK_SECRET`. |

### Suscripciones (Stripe)
- Planes **Starter** (gratis), **Pro** (49 €/mes) y **Business** (149 €/mes). Nuevos registros reciben trial Business 14 días. Límites por plan (empleados, histórico 30 días en Starter), soft lock al exceder. Flujo: Checkout Stripe → webhook actualiza `agencies`. Ver DOCUMENTACION.md sección Suscripciones (Stripe).

### Base de datos (Supabase)
- **RLS**: Todas las tablas públicas usan Row Level Security con la función `requesting_agency_id()` (JWT o `user_agencies`). Si añades una tabla, definir política coherente.
- **Suscripciones**: tabla `agencies` incluye `plan_id`, `subscription_status`, `stripe_customer_id`, `stripe_subscription_id`, `trial_ends_at`.
- **api_tokens**: Tabla para tokens API por agencia; gestión en `/api-keys` (ApiKeysPage). Edge functions: `generate-api-token`, `revoke-api-token`.
- **Limpieza empleado**: La app llama a `cleanup_employee_data(uuid)` antes de borrar un empleado. La función elimina active_timers, **timer_sessions**, time_entries, allocations, absences, feedback, rutinas, professional_goals, task_transfers y actualiza deadlines/team_events. Módulo Cronómetro (plan, BD, timer_sessions, frontend): ver DOCUMENTACION.md (Cronómetro / limpieza empleado).

</details>

<details>
<summary><h2>🔧 Fase 8: Configuración y UI Library</h2></summary>

### `src/config/constants.ts`
Centraliza TODOS los valores mágicos del sistema.
- **`TIMEOUTS`**: Delays de autosave, locks, sync (ej. `AUTO_SAVE_DEBOUNCE: 800`).
- **`LIMITS`**: Máximos para paginación/cache (ej. `MAX_LOGS: 50`, `TOP_CAMPAIGNS: 10`).
- **`UI`**: Dimensiones de modales, impresión, charts.
- **`COLORS`**: Semáforos de carga (`HEALTHY`, `WARNING`, `CRITICAL`).
- **`AI`**: Configuración de prompts (temperatura, reintentos).
- **`SYNC`**: Timeouts de sincronización con APIs externas.

### `src/config/integrations.ts`
Define las integraciones disponibles para activar por agencia.
- **`weekly_feedback`**: Modal Weekly con layout master-detail (sidebar de tareas + panel de detalle); progress bar, estados por tarea (○/✓/⚠), tokens del design system. Semanas futuras = mes visible + siguiente; carga del mes siguiente al abrir.
- **`crm_export`**: Exportación de tareas a CRM.
- **`crm_user_id`**: Campo de ID de usuario CRM para empleados.

### `src/components/ui/` (49 archivos)
**Biblioteca UI**: Componentes de Shadcn UI.
- No contienen lógica de negocio.
- Incluyen: `Button`, `Dialog`, `Sheet`, `Table`, `Card`, `Tabs`, etc.
- **`Sidebar.tsx`** (23KB) es el más complejo (navegación principal).

</details>

---

## 🔗 Mapa de Dependencias (Análisis de Impacto)

**⚠️ CRÍTICO**: Consulta esta sección antes de modificar código para evitar efectos secundarios.

### 8.1 Dependencias de Tipos de Datos

| Si modificas (Type) | Revisa estos archivos (Consumidores) |
|-------------------|--------------------------------------|
| **`Allocation`** | `AppContext`, `AllocationSheet`, `useAllocationSheet`, `PlannerGrid`, `useProjectMetrics` |
| **`Employee`** | `AppContext`, `AgencyContext`, `EmployeeRow`, `TeamPage`, `capacityUtils` |
| **`Project`** | `AppContext`, `ProjectsPage`, `useProjectMetrics`, `ClientProjectPage` |
| **`AgencySettings`** | `AgencyContext`, `usePermissions`, `AgencySettingsPage`, `ReliabilityIndexCard`, `planningPrecisionUtils` (planningPrecisionExclusions), `OperationsRadarPage` (radarLowProgressExcludeKeywords) |

### 8.2 Dependencias de Lógica Core (Contexts & Utils)

| Si modificas (Logic) | Revisa estos efectos |
|--------------------|----------------------|
| **`dateUtils.getWeeksForMonth`** | Afecta visualización de TODO el calendario y cálculo de reportes mensuales. |
| **`capacityUtils.getDailyReduction`** | Afecta métricas de capacidad de equipo. Un error aquí falsea la disponibilidad. |
| **`AppContext.fetchData`** | Afecta la carga inicial. Verifica el manejo de caché (`ensureMonthLoaded`). |
| **`AgencyContext.switchAgency`** | Afecta el limpiado de datos. Verifica que no queden datos de la agencia anterior. |

### 8.3 Dependencias de Componentes UI

| Si modificas (UI) | Revisa... |
|-----------------|-----------|
| **`AllocationSheet`** | `useAllocationSheet`, `useTasksImpact`, `useTaskTransfers`. Es muy sensible a cambios de estado. |
| **`EmployeeDialog`** | Interactúa con `Supabase Auth` y tabla `employees` simultáneamente. |

---

## 🔄 Flujos de Datos Críticos

### Flujo: Cambio de Agencia
```
1. Usuario cambia agencia -> AgencyContext.switchAgency()
2. AppContext detecta cambio de ID
3. LIMPIEZA TOTAL: Allocations, Employees, Projects y CACHÉ (loadedMonths)
4. Nueva carga de datos (Fetch)
```

### Flujo: Carga de Mes (Planner)
```
1. Usuario navega a "Febrero" -> usePlannerData
2. AppContext.ensureMonthLoaded('2026-02')
3. ¿Está en caché? -> SÍ: Usar memoria | NO: Fetch Supabase + UPSERT
```

---

## ✅ Checklist de Mantenimiento

Antes de deployar cambios críticos:

- [ ] **Types**: Si cambiaste un Type, ¿actualizaste los mappers en `AppContext`?
- [ ] **Permisos**: Si añadiste una funcionalidad, ¿requiere un nuevo flag en `UserPermissions`?
- [ ] **Split Weeks**: Si tocaste fechas, ¿probaste el cambio de año (Dic-Ene)?
- [ ] **Mobile**: ¿Verificaste que el cambio se ve bien en `use-mobile`? El panel ya no bloquea acceso en móvil; PlannerGrid y DeadlinesPage tienen vistas específicas (Cards, Sheets). EmployeeDashboard usa Sheet en vez de Dialog en móvil. AllocationSheet tiene padding, botones ≥44px y sidebar oculto en móvil. WeeklyForecast y Reports usan widths responsive. En tamaños intermedios (768–1024px): calendario de Mi espacio con columnas `minmax(140px, 1fr)` y columna empleado 200px para que el contenido quepa sin truncar (scroll horizontal si hace falta); nombre del empleado en 2 líneas (`line-clamp-2`); WeekCell sin ellipsis en datos críticos (etiquetas cortas Gan./Pérd. con tooltip, ratio y horas con `whitespace-nowrap`); bloque Real/Comp en dos líneas para evitar solapamiento numérico; tabs con `min-w` para que "Mis métricas" etc. se lean completos. En `AllocationSheet`, el menú derecho es contextual: en **vista semanal** se muestra como **Ordenar** (sin opciones de visualización) y en **vista mensual** como **Vistas** (incluye "Proyectos expandidos").
- [ ] **Deadlines multi-tenant**: Si tocaste carga de deadlines, ¿usan `fetchDeadlinesForMonth(monthKey, currentAgency?.id)` o `useDeadlines({ agencyId })` para no mezclar datos entre agencias?
- [ ] **Aislamiento por agencia**: Las tablas con `agency_id` (team_events, client_settings, segmentation_rules, global_assignments, meta_ads_campaigns, ad_accounts_config, sync_logs, etc.) deben filtrarse siempre por `currentAgency.id` en selects e incluir `agency_id` en inserts/upserts. Las que no tienen columna (professional_goals, user_routines) se filtran por join con `employees.agency_id`. Ver DOCUMENTACION.md sección 7 "Aislamiento por agencia".
- [ ] **RLS**: Todas las tablas públicas tienen RLS con `user_agency_ids()` (devuelve todas las agencias del usuario). Si añades una tabla, habilitar RLS y crear política usando `IN (SELECT user_agency_ids())`. El `service_role` bypasea RLS. Si un usuario no puede guardar ediciones de tareas (solo a él, no a admins), ver DOCUMENTACION.md → "Solución de problemas: Un usuario no puede guardar cambios al editar tareas (allocations)" (RLS UPDATE de `allocations` y vinculación `user_agencies`).
- [ ] **Tokens API**: Los tokens se gestionan desde `/api-keys` (ApiKeysPage). Edge functions: `generate-api-token` (firma JWT con claim `agency_id` y `permissions`) y `revoke-api-token`. Para que los permisos `readonly`/`readwrite` funcionen correctamente, la BD debe tener la función `can_write_via_api()` y políticas RLS que la usen. Ver DOCUMENTACION.md sección 7 para detalles de la arquitectura.
- [ ] **Overlays (Select/Dialog)**: Para evitar el desplazamiento del contenido al abrir desplegables, las **páginas** usan **Popover + Command** en lugar de Select (Radix). Patrón de referencia: DeadlinesPage (filtros), BatchTaskRow (selector de proyecto). Si añades un nuevo filtro o selector en una página, usa Popover+Command. Los componentes compartidos (EmployeeDialog, AbsencesSheet, etc.) pueden seguir usando Select dentro de Dialogs/Sheets; si en algún caso se aprecia el mismo salto, aplicar el mismo patrón.
- [ ] **Edge Functions (self-hosted)**: Si añadiste o modificaste una Edge Function y el backend es Supabase self-hosted, desplegar siguiendo la convención del proyecto: crear el script en el servidor (ver DOCUMENTACION.md, Despliegue Edge Functions) si no existe, tener `supabase/functions/` en el servidor, ejecutar `./supabase/scripts/deploy-edge-functions-supabase-pi.sh`. No usar `supabase login` ni `supabase functions deploy`.
- [ ] **Emails (Resend)**: Si no llegan bienvenidas, invitaciones o reset de contraseña, verificar `RESEND_API_KEY` y `RESEND_FROM_EMAIL` en el contenedor. Ver DOCUMENTACION.md → "Solución de problemas: Emails (Resend)".

### Limpieza de base de datos

**Al eliminar un empleado**: La app llama a `supabase.rpc('cleanup_employee_data', { p_employee_id: id })` antes del DELETE en `employees`. Esa función debe existir en Supabase (elimina asignaciones, ausencias, feedback, rutinas, transferencias, **active_timers**, actualiza `deadlines.employee_hours` y `team_events.affected_employee_ids`). Sin ella puede aparecer "Desconocido" en informes.

---

> *Documentación Generada: Febrero 2026 - Proyecto Taimbox*
