# Documentación Técnica Detallada - Timeboxing

Esta documentación ofrece una visión profunda y técnica de la plataforma Timeboxing. Incluye un **Mapa de Dependencias** (Sección 8) exhaustivo para analizar el impacto de cualquier cambio en el código.

---

## 1. Arquitectura General y Tecnologías

El sistema sigue una arquitectura de **Single Page Application (SPA)** con un backend proporcionado por **Supabase** (BaaS) y trabajadores externos para integraciones de publicidad.

- **Frontend**: React 18 con Vite y TypeScript.
- **Backend / DB**: Supabase (PostgreSQL + Auth + Realtime). La documentación pública de la API de integración está en `/api-docs` (shell en `src/pages/ApiDocsPage.tsx`, contenido modular en `src/pages/api-docs/`). Es una **API selectiva** (no open-source): expone solo 17 tablas de planificación, equipo y proyectos. Excluye tablas internas (ads, audit_logs, user_agencies). La documentación incluye 4 grupos (Overview, Tutoriales, SDK/REST, Referencia de Recursos), 5 tutoriales paso a paso, changelog, búsqueda (Ctrl+K), sidebar con grupos colapsables, y ResponseExample JSON por recurso. Estructura de archivos: `api-docs/data/` (types, tables, toc, changelog), `api-docs/components/` (CodeBlock, SidebarTOC, SearchBar, ResourceCard, TutorialStep, ResponseExample, etc.), `api-docs/sections/` (15 secciones). Consultarla para integraciones externas o partners.
- **Estilos**: Tailwind CSS con componentes de Shadcn UI.
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

> **⚠️ IMPORTANTE**: Si creas un nuevo componente que muestra nombres de proyectos, DEBES usar `useProjectAliasing().formatName()` para mantener consistencia.

### 2.2. Empleado (`Employee`)
Representa a los miembros del equipo.
- `role`: Nombre del rol que determina los permisos.
- `defaultWeeklyCapacity`: Horas base de trabajo por semana (ej. 40).
- `workSchedule`: Objeto que define las horas por día (`monday`: 8, `friday`: 6, etc.).
- `user_id`: Enlace con `auth.users` de Supabase para autenticación.

### 2.3. Proyecto (`Project`)
Contenedores de trabajo facturable o interno.
- `budgetHours`: Horas máximas contratadas por el cliente al mes.
- `minimumHours`: Suelo de horas que el equipo debe cumplir.
- `monthlyFee`: Fee recurrente en euros para cálculos de rentabilidad.
- `status`: `active`, `paused` o `completed`.

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

---

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
  - **Tablas sin uso en la app** (solo API/workers o deprecadas): `google_ads_changes` (no referenciada en el codebase), `time_entries` (solo documentada en ApiDocsPage; no hay CRUD desde la UI). Confirmar uso en workers o integraciones antes de eliminarlas.

- **Row Level Security (RLS) y tokens API**  
  En la base de datos (Supabase), **todas las tablas públicas** tienen RLS habilitado. El acceso se controla mediante la función SQL `requesting_agency_id()`, que:
  1. Primero intenta leer el claim `agency_id` del JWT (para tokens API generados por agencia).
  2. Si no existe, busca la agencia primaria del usuario en `user_agencies`.

  **Tabla `api_tokens`**: Almacena metadatos de tokens API emitidos (hash SHA-256, permisos, expiración). El JWT real solo se muestra una vez al crearlo.

  **Revocación y expiración con efecto inmediato**: Por defecto, al revocar un token solo se pone `is_active = false` en la BD; el JWT sigue siendo válido hasta que expire. Para que la revocación niegue el acceso al instante, la función `requesting_agency_id()` debe comprobar si el token está revocado y devolver `NULL` en ese caso. Además, aunque PostgREST valida el claim `exp` del JWT automáticamente, se puede añadir una verificación adicional de `expires_at` en la BD para mayor consistencia. Script: `supabase/scripts/rls_check_api_token_revoked_and_expired.sql`. **Ejecutar ese script en el SQL Editor de Supabase** para que al revocar un token en el panel deje de funcionar de inmediato y para verificar también la expiración desde la BD (además de la validación automática del JWT).

  **Enforzar permisos readonly/readwrite**: Por defecto, las políticas RLS solo verifican `agency_id`, no el claim `permissions` del JWT. Esto permite que tokens con `permissions='readonly'` puedan hacer INSERT/UPDATE/DELETE cuando no deberían. Para solucionarlo:
  1. **Script completo (recomendado)**: Ejecutar `supabase/scripts/rls_enforce_api_permissions_all_tables_complete.sql` en el SQL Editor de Supabase. Este script:
     - Crea la función `can_write_via_api()` si no existe.
     - Detecta y modifica automáticamente todas las políticas RLS de INSERT/UPDATE/DELETE en todas las tablas principales.
     - Maneja políticas que aplican a ALL (como "tenant_isolation") convirtiéndolas en políticas separadas.
     - Respeta el tipo de tabla (agency_id directo, vía employee_id, vía project_id).
  2. **Scripts individuales** (si prefieres aplicar tabla por tabla):
     - `rls_enforce_api_permissions.sql`: Crea solo la función `can_write_via_api()`.
     - `rls_fix_tenant_isolation_employees.sql`: Ejemplo para `employees` con política ALL.
     - `rls_enforce_api_permissions_employees.sql`: Ejemplo para `employees` con políticas por comando.

  **Edge Functions relacionadas**:
  - `generate-api-token`: Recibe `{ agency_id, name, permissions?, expires_in_days? }` del admin autenticado, firma un JWT con claim `agency_id` y `sub` = id del registro en `api_tokens`, guarda el hash en `api_tokens` y devuelve el JWT.
  - `revoke-api-token`: Recibe `{ token_id }`, verifica que el caller es admin de la agencia dueña y marca `is_active = false`. El acceso se deniega en la siguiente petición solo si está aplicado el script anterior.

  **Políticas RLS por tipo de tabla**:
  | Tipo | Tablas | Política |
  |------|--------|----------|
  | `agency_id` directo | agencies, employees, clients, projects, global_assignments, task_transfers, department_config, ad_accounts_config, ads_sync_logs, meta_sync_logs, google_ads_campaigns, meta_ads_campaigns, team_events, client_settings, segmentation_rules, audit_logs, api_tokens, user_agencies | `agency_id = requesting_agency_id()` |
  | Vía `employee_id` | allocations, absences, professional_goals, user_routines, weekly_feedback, time_entries | `employee_id IN (SELECT id FROM employees WHERE agency_id = requesting_agency_id())` |
  | Vía `project_id` | deadlines, project_editing_locks | `project_id IN (SELECT id FROM projects WHERE agency_id = requesting_agency_id())` |
  | Política “no access” | google_ads_changes | Política `no_access_until_use` con USING (false) y WITH CHECK (false): nadie puede leer ni escribir. Script: `supabase/scripts/rls_google_ads_changes_no_access.sql`. Cuando se confirme uso, sustituir por políticas por agency_id. |

  **Tabla `agencies` (solo lectura vía API)**: Para impedir que integradores creen agencias por API, conviene revocar `INSERT` en `public.agencies` para los roles `anon` y `authenticated`. Script: `supabase/scripts/revoke_agencies_insert.sql`. La creación de agencias debe hacerse desde la app (registro/onboarding) o con service_role.

  **Funciones y `search_path`**: Las funciones en `public` deben tener `search_path` fijado (`pg_catalog`, `public`) para evitar "search path hijacking". Si la auditoría marca "Function Search Path Mutable", ejecutar `supabase/scripts/fix_function_search_path.sql` y añadir al script cualquier función nueva que aparezca.

  **Índices**: Si la auditoría marca "Unindexed foreign keys", ejecutar `supabase/scripts/add_missing_fk_indexes.sql` (crea índices en FKs que no tienen uno). Si marca "Duplicate Index" en una tabla, ejecutar `supabase/scripts/drop_duplicate_index_google_ads_campaigns.sql` (o un script similar para otra tabla) para eliminar índices duplicados.

  **Importante**: El `service_role` key bypasea RLS. Las edge functions y workers que usan `SUPABASE_SERVICE_ROLE_KEY` no se ven afectados.

  **Página de gestión**: `src/pages/ApiKeysPage.tsx` (ruta `/api-keys`, requiere `can_access_agency_settings`). Permite crear, listar y revocar tokens API. Enlace en Sidebar bajo "Configuración".

- **Modificar permisos**:
    - Editar `src/hooks/usePermissions.ts` y añadir la nueva clave de permiso al objeto `RESTRICTED_PERMISSIONS`.
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
| `AppContext.tsx` (ensureMonthLoaded) | `usePlannerData.ts`, `AllocationSheet.tsx` |
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
| `src/utils/aiReportUtils.ts` | Generación de resúmenes IA para Ads | `AIService`, `logger`, `CONSTANTS` |
| `src/utils/logger.ts` | Sistema de logging estructurado | Usado en `aiReportUtils`, `PlannerGrid` |
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
- [ ] ¿Las edge functions `generate-api-token` y `revoke-api-token` verifican permisos del caller (`can_access_agency_settings`)?
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
- **Función en BD**: `cleanup_employee_data(p_employee_id uuid)` debe existir en Supabase. Elimina o actualiza: `allocations`, `absences`, `weekly_feedback`, `user_routines`, `task_transfers`, quita la clave del empleado en `deadlines.employee_hours` y lo elimina de `team_events.affected_employee_ids`.
- **Flujo**: En `AppContext.deleteEmployee` se llama primero a `supabase.rpc('cleanup_employee_data', { p_employee_id: id })` y después al `DELETE` en `employees`. Si la migración no está aplicada, el usuario verá un toast indicándolo.
- **Estado local**: Tras el cleanup se actualizan también `weeklyFeedback`, `userRoutines` y `teamEvents` en el estado para que la UI no muestre datos huérfanos.

### 10.4 Informe de coherencia (GlobalPlanningInconsistencies)
- **Un empleado, una fila por proyecto**: La lista "Empleados afectados" se construye con un `Map` por `employeeId` por proyecto, de modo que cada persona aparece como máximo una vez por proyecto (evita duplicados donde en una fila salía "en deadline" y en otra "no en deadline").
- **Empleados inexistentes**: Si por datos antiguos o fallo de migración quedara algún `employee_id` sin correspondencia en `employees`, no se muestra "Desconocido": se excluyen esas filas (red de seguridad; la solución correcta es la limpieza en BD, ver 10.3).
