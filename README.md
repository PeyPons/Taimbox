# ⏳ Timeboxing - Plataforma de Gestión de Agencia

![React](https://img.shields.io/badge/React-18-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase)
![Vite](https://img.shields.io/badge/Vite-Build-yellow?logo=vite)

**Timeboxing** es un sistema integral para la gestión de recursos, planificación de proyectos y control financiero de agencias de marketing. Esta documentación sirve como bitácora técnica completa y mapa de dependencias.

---

> [!IMPORTANT]
> **Para Agentes de IA y Desarrolladores**: Este archivo es un resumen de alto nivel. Para detalles técnicos profundos, flujos de datos complejos y guías de implementación, **consultar obligatoriamente** [`DOCUMENTACION.md`](./DOCUMENTACION.md).

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
| **`Employee`** | `id`, `defaultWeeklyCapacity`, `workSchedule`, `role` | Define capacidad y horario base. |
| **`Project`** | `id`, `budgetHours`, `monthlyFee`, `status` (`active/archived/completed`) | Contenedor de asignaciones. |
| **`AgencySettings`** | `roles`, `modules`, `integrations`, `projectAliasingRules` | Configuración multi-tenant. |
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

Configura la jerarquía de **9 Providers** y el Router con **24+ rutas**.
- **Jerarquía**: `Helmet` > `QueryClient` > `Auth` > `Agency` > `App` > `Marketing` > `Goals` > `Notification` > `Tooltip`.
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
// Ejemplo simplificado de lógica de mergew
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

### 2.3 `MarketingContext.tsx` (Finanzas)
- **Propósito**: Presupuestos jerárquicos y gastos.
- **Estructura**: `AgencyBudget` -> `BudgetCategory` -> `MarketingPlan` -> `PlanMovement`.

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

Timeboxing fuerza una separación estricta de meses.
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

### 3.4 `src/utils/aiReportUtils.ts` (IA & Reporting)
- Generación de textos con IA para reportes de Ads. Integra `AIService`.

### 3.5 `src/utils/logger.ts` (Logging)
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
- **`usePlannerData`**: Controla `currentMonth` y `loadedMonths`.
- **`useProjectMetrics`**: Centraliza fórmulas de rentabilidad (`hoursValue`, `progressOperational`).
- **`useTaskTransfers`**: Máquina de estados para transferencias (`pending` -> `accepted/rejected`).
- **`use-mobile.tsx`**: Detecta viewport (mobile vs desktop) para Layouts adaptativos.
- **`useAppOrDemo`**: Selecciona contexto real o demo automáticamente.
- **`useDashboardView`**: Controla la vista del dashboard del empleado.
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
- **Consumidores**: `DeadlinesPage`, `ReportsPage`, `ClientReportsPage`, `EmployeeDashboard`, `AllocationSheet`, `WeeklyForecastPage`, y todos los componentes que muestran nombres de proyectos.

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

### 5.2 Marketing (`src/components/marketing`)
- **`MarketingMatrix.tsx`**:
    - **Pivote Dinámico**: Filas (Categorías) vs Columnas (Meses).
    - **Celdas Interactivas**: Click abre `ExpensesModal` o `BudgetDialog`.
- **`CategoryDetailPanel.tsx`**:
    - Panel lateral para gestión granular de una categoría.
    - Muestra gráfico de "Evolución de Gasto".

### 5.3 Equipo (`src/components/team`)
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
| `DeadlinesPage.tsx` | 106KB | Gestión de fechas límite mensuales. **Móvil**: filtros en Sheet "Filtros", edición de proyecto en Sheet desde abajo; selector de mes sticky con botones grandes. |
| `WeeklyForecastPage.tsx` | 94KB | Previsión y confirmación semanal |
| `TeamCapacityPage.tsx` | 26KB | Vista de carga del equipo completo |
| `TeamPage.tsx` | 4KB | Listado de empleados |
| `TeamPulsePage.tsx` | 14KB | Métricas de salud del equipo |

### Clientes y Proyectos
| Página | Tamaño | Descripción |
|--------|--------|-------------|
| `ClientsAndProjectsPage.tsx` | **116KB** | Página más grande. Gestión dual cliente/proyecto |
| `ProjectsPage.tsx` | 58KB | Gestión de proyectos con OKRs |
| `ClientsPage.tsx` | 38KB | CRUD de clientes |
| `OkrsPage.tsx` | 41KB | Objetivos y resultados clave |

### Reportes y Analytics
| Página | Tamaño | Descripción |
|--------|--------|-------------|
| `ReportsPage.tsx` | 105KB | Dashboard de métricas de rentabilidad |
| `ClientReportsPage.tsx` | 11KB | Reportes orientados al cliente |
| `DashboardAI.tsx` | 26KB | Análisis con IA de rendimiento |

### Publicidad (Ads)
| Página | Tamaño | Descripción |
|--------|--------|-------------|
| `AdsPage.tsx` | 67KB | Integración Google Ads |
| `MetaAdsPage.tsx` | 46KB | Integración Meta/Facebook Ads |

### Configuración
| Página | Tamaño | Descripción |
|--------|--------|-------------|
| `AgencySettingsPage.tsx` | 60KB | Configuración completa de agencia (roles, módulos) |
| `SettingsPage.tsx` | 6KB | Preferencias de usuario |
| `AgenciesPage.tsx` | 8KB | Selector de agencias |
| `AgencyManagementPage.tsx` | 19KB | Administración avanzada de agencia |

### Otros
| Página | Tamaño | Descripción |
|--------|--------|-------------|
| `LandingPage.tsx` | 78KB | Página pública de marketing |
| `GuiaPage.tsx` | ~18KB | Guía de funcionalidades pública (`/guia`, `/guia/:section`). Contiene 6 componentes de contenido reutilizables (FeatureCard, ExampleBox, TipBox, WarningBox, StepList, InfoGrid), navegación prev/next entre secciones y contenido detallado para las 9 secciones del producto. |
| `Login.tsx` | 16KB | Autenticación con Supabase |
| `MarketingPage.tsx` | 4KB | Wrapper del módulo Marketing |
| `Index.tsx` | <1KB | Redirección inicial |
| `NotFound.tsx` | <1KB | Error 404 |

</details>

<details>
<summary><h2>⚙️ Fase 7: Servicios Core</h2></summary>

### `src/services/aiService.ts`
Sistema centralizado de IA con fallback.
- **Providers**: Gemini (primario) → OpenRouter (secundario) → Coco (fallback local).
- **Función Principal**: `callWithFallback(prompt, context)`.
- **Uso**: Generación de reportes en `AdsPage` y `DashboardAI`.

### `src/services/errorService.ts`
Manejo centralizado de errores.
- **`handle(error, context, options)`**: Loggea, muestra toast, y opcionalmente reporta a servicio externo.
- **Integración**: Preparado para Sentry/LogRocket (comentado).

### `src/services/auditService.ts`
Sistema de auditoría para cambios críticos.
- **Registra**: Quién hizo qué, cuándo, en qué entidad.
- **Uso**: Cambios en presupuestos de marketing (`MarketingContext`).

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
- **`weekly_feedback`**: Sistema Weekly de confirmación.
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
| **`AgencySettings`** | `AgencyContext`, `usePermissions`, `AgencySettingsPage` |
| **`MarketingBudget`** | `MarketingContext`, `MarketingMatrix`, `BudgetPlanner` |

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
| **`MarketingMatrix`** | Depende fuertemente de la estructura de árbol de `MarketingContext`. |
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
- [ ] **Mobile**: ¿Verificaste que el cambio se ve bien en `use-mobile`? El panel ya no bloquea acceso en móvil; PlannerGrid y DeadlinesPage tienen vistas específicas (Cards, Sheets). EmployeeDashboard usa Sheet en vez de Dialog en móvil. AllocationSheet tiene padding, botones ≥44px y sidebar oculto en móvil. WeeklyForecast y Reports usan widths responsive.
- [ ] **Deadlines multi-tenant**: Si tocaste carga de deadlines, ¿usan `fetchDeadlinesForMonth(monthKey, currentAgency?.id)` o `useDeadlines({ agencyId })` para no mezclar datos entre agencias?

---

> *Documentación Generada: Febrero 2026 - Proyecto Timeboxing*
