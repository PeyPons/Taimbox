# 14. Ciclo de vida del entregable

## Las dos vistas y por qué coexisten

- **Vista mensual** (Rentabilidad → tab Proyectos, Seguimiento operativo / radar): el presupuesto de horas del mes y el ingreso en € del mes se obtienen con `getEffectiveBudgetForMonth` y `getEffectiveMonthlyFee` en [`budgetUtils.ts`](../src/utils/budgetUtils.ts): prorrateo por **días de calendario** de la fase sobre el mes visible.
- **Vista de ciclo de vida** (Rentabilidad → tab «Entregables (vida)», badges en listados, tabla colapsable en Seguimiento operativo): la ventana temporal es la **fase completa** (`deliverableStartDate`–`deliverableDueDate`). El techo de horas es el **`budgetHours` total del proyecto** (no el prorrateo mensual). El ingreso devengado hasta «hoy» es proporcional a los días transcurridos en la fase.

**Identidad agregada (intención de producto):** la suma de los presupuestos/ingresos mensuales `getEffectiveBudgetForMonth` / `getEffectiveMonthlyFee` sobre todos los meses calendario que solapan la fase debe ser coherente con el techo total de horas y el importe de contrato a lo largo de la fase. La vista de vida es el **agregado natural** de la mensual en una sola pantalla.

## Cálculos principales (`deliverableLifecycle.ts`)

- **Fase**: solo proyectos `projectType === 'Entregable'` con fechas válidas; si no, estado `no-phase`.
- **Horas consumidas**: allocations cuya semana solapa la fase; prorrateo por **días laborables** dentro de la semana cuando la semana corta los límites de la fase (misma familia que [`projectMetricsCompute.ts`](../src/utils/projectMetricsCompute.ts)). Las horas efectivas usan `getEffectiveAllocationHours` según `hoursTrackingPreference` de la agencia.
- **Coste**: modo estándar (`getRowCost` / coste hora operativo) o dinámico (nómina prorrateada por horas del empleado **en esta fase**, no en el mes).
- **Ingreso devengado**: `contractFee × (daysElapsed / totalDays)` con días de **calendario** en la fase (alineado con `getEffectiveMonthlyFee`).
- **Margen**: `revenueAccrued − costToDate`; si no hay importe de contrato resuelto, margen en `null` (UI muestra «—»).
- **Estados**: `pre-start`, `on-track`, `at-risk` (sobreconsumo o proyección elevada), `over-budget`, `completed`, `no-phase`.

## Días naturales vs días laborables

- **Ingreso** y **días de fase** para devengo: **días de calendario** (como en `budgetUtils`).
- **Horas** en semanas partidas: **días laborables** en el tramo solapado (como en métricas mensuales).

Es una **asimetría intencional** ya presente en el sistema; este módulo no la unifica.

## Mes mensual «en regla» vs vida «over-budget»

El radar y la coherencia del mes usan el **presupuesto/riesgo del mes**. Un entregable puede ir **en regla en el mes visible** (prorrateo mensual) y a la vez **over-budget en vida** si el consumo acumulado en la fase supera el techo global o la proyección a fin de fase supera el umbral.

*Ejemplo:* fase de 6 meses, `budgetHours = 120`. En el mes 4, el prorrateo mensual deja margen aparente en el KPI del mes, pero ya se llevan 100 h consumidas en la fase y la proyección lineal supera 120 h → la vista de vida marca riesgo aunque el bucket mensual siga «en regla».

## Seguimiento operativo

- El **estado mensual** de cada fila (filtros existentes) no se sustituye.
- El filtro **«Riesgo vida (entregables)»** usa solo el estado de ciclo de vida (`at-risk` / `over-budget`).
- Los badges de vida en filas usan datos del **batch** (`useDeliverableLifecycleBatch`) para no multiplicar hooks.

## Datos y caché

- Las queries de allocations por fase pueden cubrir más meses de los cargados en `AppContext`; el hook llama a `ensureMonthsLoadedInRange` y mantiene caché con TTL + firma de allocations en memoria. Ver JSDoc en [`useDeliverableLifecycle.ts`](../src/hooks/useDeliverableLifecycle.ts).

### Consultas Supabase (`allocations`) — columnas reales

Las funciones [`fetchAllocationsForDeliverablePhase` / `fetchAllocationsForDeliverablePhaseBatch`](../src/hooks/useDeliverableLifecycleCore.ts) hacen `.from('allocations').select(...)` **directo** sobre la tabla.

- La tabla **`allocations` no tiene columna `agency_id`** (multi-tenant vía `employee_id` → `employees.agency_id` y `project_id` → `projects`; ver [13-esquema-base-datos.md](13-esquema-base-datos.md) y [`docs/sql/schema-snapshot-context.sql`](sql/schema-snapshot-context.sql)).
- Incluir en `select` un campo que **no exista** en la tabla hace que PostgREST responda **400**; el cliente reintenta / los efectos se disparan con Realtime y la app se percibe **lenta**.
- Patrón correcto para cargar allocations con filtro por agencia en otros flujos: join explícito, p. ej. `employees!allocations_employee_id_fkey!inner(agency_id)` como en [`appDataLoader.ts`](../src/utils/appDataLoader.ts). **No** copiar columnas de ese join al `select` plano de la tabla si no están en `allocations`.

**Regla para nuevos desarrollos:** antes de ampliar el `select` del ciclo de vida, comprobar el DDL de `allocations` en migraciones o en el snapshot.

## Capturas

*(Placeholders para capturas de producto: tab Rentabilidad, radar con filtro y badge.)*
