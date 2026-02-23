# Informe completo: Módulo de Cronómetro de Tareas (Time Tracking)

**Fecha:** Febrero 2026  
**Estado:** Implementado  
**Objetivo:** Temporizador en tiempo real para tareas (allocations), resiliente a F5, con límite configurable por agencia y persistencia del total del día al parar/reanudar.

Este documento es un **informe de implementación** para compartir con otro desarrollador: plan realizado, decisiones técnicas, archivos tocados y cómo desplegar/mantener el módulo.

---

## 1. Resumen ejecutivo

| Aspecto | Detalle |
|--------|---------|
| **Módulo** | Cronómetro de tareas (time tracker) por asignación (allocation). |
| **Activación** | Opt-in por agencia: `settings.modules.timeTracker` (por defecto `false`). |
| **Visibilidad** | Solo se muestra si el empleado tiene `user_id` (cuenta de acceso) y el módulo está activo. |
| **Persistencia** | Un timer activo por empleado; estado en BD (`active_timers`). Tras F5 se recupera. |
| **Registro** | Al parar se llama la RPC `log_timer_hours`: escribe en `time_entries` (UPSERT), actualiza `allocations.hours_actual`, inserta sesión exacta en `timer_sessions` (para webhooks/Perfex) y borra de `active_timers`. |
| **Límite** | Máximo de horas por sesión configurable por agencia (`timeTrackerMaxHours`, 1–24, por defecto 12). La BD permite hasta 24 h por entrada. |
| **Total del día** | Se muestra y se mantiene al parar: base (horas ya registradas hoy) + sesión actual; al reanudar se sigue sumando sobre ese total. |

---

## 2. Plan en 4 fases (y estado)

El plan original está en **`docs/PLAN-CRONOMETRO-TAREAS.md`**. Resumen del estado:

| Fase | Descripción | Estado |
|------|-------------|--------|
| **1** | Base de datos: `active_timers`, constraint en `time_entries`, RLS, RPC `log_timer_hours`, `timer_sessions` para webhooks | ✅ Hecho (migraciones 1–5) |
| **2** | Hook `useTaskTimer`: estado, reloj, recuperación post-F5, límite, RPC única, `onTimeLogged`, base del día | ✅ Hecho |
| **3** | Componente `TaskTimer`: píldora Play/Stop, tiempo formateado, accesibilidad, `isSaving` | ✅ Hecho |
| **4** | Integración condicional: AllocationSheet/AllocationTaskRow, MyDayView, flag de módulo, ocultar si no hay `user_id` | ✅ Hecho |

Decisiones clave del plan (PM/desarrollo):

- **RPC única** para cerrar y registrar: el frontend no hace insert/update/delete sueltos; todo va por `log_timer_hours`.
- **Opt-in del módulo**: no se activa por defecto para agencias existentes.
- **Ocultar cronómetro** si el empleado no tiene `user_id` (evitar errores de RLS en BD).
- **Edge cases**: `isSaving` para evitar doble clic en Stop; try/catch y toast en error de red sin limpiar estado.

---

## 3. Base de datos

### 3.1 Migraciones (orden obligatorio)

Todas en `supabase/migrations/`:

| Orden | Archivo | Contenido |
|-------|---------|-----------|
| 1 | `20260221000000_create_active_timers_and_log_timer_hours.sql` | Tabla `active_timers`, RLS, constraint `time_entries` (hours ≤ 12), RPC `log_timer_hours` (INSERT, UPDATE allocations, DELETE active_timers). |
| 2 | `20260221100000_time_entries_max_hours_configurable.sql` | Constraint `hours <= 24` en `time_entries`. |
| 3 | `20260221110000_cleanup_employee_data.sql` | Función `cleanup_employee_data(p_employee_id)`: borra active_timers, time_entries, allocations, absences, weekly_feedback, user_routines, professional_goals, task_transfers; actualiza deadlines y team_events. |
| 4 | `20260221130000_time_entries_add_unique_constraint.sql` | UNIQUE (allocation_id, date) en `time_entries` para permitir UPSERT en la RPC. |
| 5 | `20260221140000_create_timer_sessions.sql` | Tabla **`timer_sessions`** (append-only: start_time, end_time por cierre de cronómetro para webhooks/Perfex). RPC `log_timer_hours` actualizada: captura `started_at` antes de borrar active_timers, UPSERT en time_entries, INSERT en timer_sessions, DELETE active_timers. `cleanup_employee_data` actualizada para borrar también `timer_sessions`. |
| 6 | `20260221150000_time_entries_rls.sql` | RLS en `time_entries` y política **SELECT** "Employees can view own time_entries": el empleado solo ve filas donde `employee_id` corresponde a su usuario. **Necesario** para que tras recargar la página las horas guardadas se muestren (sin esta política, el SELECT del frontend devuelve vacío y todo aparece en 0). |
| 7 | `20260221160000_time_entries_unique_per_employee.sql` | UNIQUE pasa a **(employee_id, allocation_id, date)** y la RPC hace UPSERT por esa clave. |
| 8 | `20260221170000_log_timer_hours_conflict_employee.sql` | Solo reemplaza la función para ON CONFLICT (employee_id, allocation_id, date). |
| 9 | `20260221180000_drop_time_entries_allocation_date_key.sql` | **Elimina** el constraint antiguo `time_entries_allocation_id_date_key` (allocation_id, date). Si sigue existiendo junto con el unique por empleado, la tabla solo puede tener una fila por tarea/día y las horas se guardan en la fila equivocada; al recargar se ve 0. |
| 10 | `20260221190000_time_entries_hours_precision.sql` | **Precisión de horas:** `time_entries.hours`, `allocations.hours_actual` y `timer_sessions.hours` pasan a `numeric(10,6)` (6 decimales). Con 2 decimales, intervalos cortos (p. ej. 30 s = 0,00833 h) se redondeaban y no se guardaban bien. |
| 11 | `20260221200000_get_team_active_timers.sql` | Función **`get_team_active_timers()`**: devuelve los cronómetros activos del equipo de la agencia del usuario (employee_id, employee_name, allocation_id, task_name, client_name, started_at). SECURITY DEFINER; filtra por agency_id del empleado del usuario. Usada por la página **Tiempos**. |
| 12 | `20260221210000_time_tables_agency_id.sql` | **agency_id** en las tres tablas de tiempos: `time_entries`, `active_timers`, `timer_sessions`. Backfill desde `employees.agency_id`; NOT NULL y FK a `agencies(id)`. RPC `log_timer_hours` actualizada para rellenar `agency_id` en INSERTs. Trigger en `active_timers` que rellena `agency_id` desde el empleado en INSERT/UPDATE. Necesario para filtrado por agencia en API. |

### 3.2 Tabla `active_timers`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `employee_id` | uuid PK | FK a `employees(id)` ON DELETE CASCADE. Un solo timer activo por empleado. |
| `allocation_id` | uuid NOT NULL | FK a `allocations(id)` ON DELETE CASCADE. Tarea en la que está el cronómetro. |
| `started_at` | timestamptz | Cuándo se inició; se usa para calcular segundos transcurridos. |
| `agency_id` | uuid NOT NULL | FK a `agencies(id)`. Rellenado por trigger desde el empleado (migración 12). Permite filtrar por agencia en API. |

**RLS:** Todas las políticas usan `auth.uid() IN (SELECT user_id FROM employees WHERE id = employee_id)` (solo el propio empleado). Incluye UPDATE para que el upsert del frontend funcione.

### 3.3 Tabla `time_entries`

- **Columna `hours`:** tipo `numeric(10, 6)` (migración 10) para poder registrar intervalos de segundos (p. ej. 30 s = 0,008333 h). Con solo 2 decimales los tiempos cortos se redondeaban y no se persistían.
- **Columna `agency_id`:** (migración 12) uuid NOT NULL, FK a `agencies(id)`. La RPC `log_timer_hours` la rellena desde el empleado. Permite filtrar por agencia en API.
- **Constraint:** `max_hours_per_entry`: `hours <= 24` (el límite efectivo por sesión lo fija la agencia con `timeTrackerMaxHours`).
- **Unicidad:** UNIQUE `(employee_id, allocation_id, date)` (migración 7; antes era solo `(allocation_id, date)` en migración 4). La RPC hace UPSERT por esa clave (suma horas, concatena notas) para que cada empleado tenga su fila por tarea y día.
- **RLS** (migración 6): ROW LEVEL SECURITY activado; política SELECT "Employees can view own time_entries" para que el usuario vea solo sus filas (`employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())`). Sin esta política, tras F5 el frontend no vería las filas insertadas por la RPC y el total del día aparecería en 0.

### 3.4 Tabla `timer_sessions` (Caja negra para integraciones)

Append-only: una fila por cada "Stop" del cronómetro, con inicio y fin exactos para webhooks (p. ej. Perfex CRM).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid PK | gen_random_uuid() |
| `agency_id` | uuid NOT NULL | (Migración 12) Agencia del empleado. Rellenado por la RPC `log_timer_hours`. Permite filtrar por agencia en API. |
| `employee_id` | uuid NOT NULL | FK employees(id) ON DELETE CASCADE |
| `allocation_id` | uuid NOT NULL | FK allocations(id) ON DELETE CASCADE |
| `start_time` | timestamptz NOT NULL | Inicio de la sesión (desde active_timers.started_at) |
| `end_time` | timestamptz NOT NULL | Fin (now() al cerrar) |
| `hours` | numeric NOT NULL | Horas de esa sesión |
| `created_at` | timestamptz | now() |

**RLS:** SELECT solo para el empleado (`auth.uid()` = employees.user_id). La RPC (SECURITY DEFINER) escribe en nombre del usuario.

### 3.5 RPC `log_timer_hours`

**Firma:**  
`log_timer_hours(p_employee_id uuid, p_allocation_id uuid, p_hours numeric, p_notes text DEFAULT NULL, p_date date DEFAULT CURRENT_DATE)`

**Comportamiento (transacción, SECURITY DEFINER):**

1. Comprueba `auth.uid()` = `user_id` del empleado; si no, `RAISE EXCEPTION 'No autorizado a registrar tiempo para este empleado'`.
2. Si `p_hours` es NULL o ≤ 0, sale sin hacer nada.
3. **Captura** `started_at` desde `active_timers` WHERE employee_id = p_employee_id (antes de borrarlo).
4. UPSERT en `time_entries`: ON CONFLICT (allocation_id, date) DO UPDATE (suma hours, concatena notes).
5. UPDATE `allocations` SET `hours_actual = COALESCE(hours_actual, 0) + p_hours` WHERE id = p_allocation_id.
6. Si `v_started_at` IS NOT NULL, INSERT en `timer_sessions` (employee_id, allocation_id, start_time, end_time=now(), hours).
7. DELETE FROM `active_timers` WHERE employee_id = p_employee_id.

### 3.6 RPC `get_team_active_timers`

**Firma:** `get_team_active_timers()` (sin parámetros).

**Comportamiento (SECURITY DEFINER):** Obtiene la agencia del empleado asociado a `auth.uid()` y devuelve una fila por cada cronómetro activo de empleados de esa agencia, con: `employee_id`, `employee_name`, `allocation_id`, `task_name`, `client_name`, `started_at`. Usada por la página **Tiempos** para mostrar en qué está cada miembro del equipo y permitir parar el propio cronómetro.

---

## 4. Frontend

### 4.1 Tipos (`src/types/index.ts`)

- **AgencyModules:** `timeTracker?: boolean`
- **AgencySettings:** `timeTrackerMaxHours?: number` (1–24, por defecto 12 en UI)

### 4.2 Hook `useTaskTimer` (`src/hooks/useTaskTimer.ts`)

**Entrada:**  
`employeeId`, `allocationId`, `options?: { maxHours?, onTimeLogged? }`

**Estado principal:**

- `isRunning`, `elapsedSeconds` (sesión actual), `baseSecondsToday` (horas ya registradas hoy para esta tarea, en segundos).
- `isLoading` (carga inicial), `isSaving` (Stop pulsado, esperando RPC).

**Comportamiento:**

- **Al montar:** Pide en paralelo `active_timers` (por employee_id) y `time_entries` (por allocation_id y fecha de hoy). Inicializa `baseSecondsToday` y, si hay timer activo para esta allocation, `elapsedSeconds` y `isRunning` (recuperación post-F5). Si el timer activo supera `maxHours`, auto-pausa vía RPC y toast.
- **Display:** `formattedTime` = total del día en HH:MM:SS; `formattedTimeShort` = total en HH:MM (menos intrusivo para "total registrado"). En **TaskTimer** se muestra HH:MM cuando está parado y HH:MM:SS cuando está en curso.
- **Start:** Si hay timer en otra tarea, cierra esa con la RPC y luego upsert del timer actual. Si no, upsert directo. `elapsedSeconds` a 0 para la nueva sesión.
- **Stop:** Llama a `log_timer_hours` con los segundos de la sesión; en éxito hace `baseSecondsToday += elapsedSeconds`, `elapsedSeconds = 0`, `onTimeLogged?.(allocationId, hours)`. Botón deshabilitado con `isSaving` hasta que termine. En error: toast con mensaje de Supabase, no se limpia estado (EC2).
- **Intervalo (cada 1 s):** Incrementa `elapsedSeconds`; al llegar a `maxSeconds` llama a `forceStop` (auto-pausa) y actualiza `baseSecondsToday`.

**Dependencias:** `@/lib/supabase`, `@/hooks/use-toast`.

**Hook auxiliar para sidebar:** `useActiveTimerForSidebar(employeeId)` (`src/hooks/useActiveTimerForSidebar.ts`): consulta `active_timers` y `time_entries` (hoy), devuelve `{ isActive, elapsedSeconds, allocationId, formattedTime }`. Se actualiza por polling (cada 5 s) y al evento `timeboxing_timer_started`. Solo se usa cuando el módulo timeTracker está activo.

### 4.3 Componente `TaskTimer` (`src/components/employee/TaskTimer.tsx`)

- **Props:** `employeeId`, `allocationId`, `disabled?`, `onTimeLogged?`
- **Comportamiento:** Usa `useAgency()` para `timeTrackerMaxHours` (default 12) y `useTaskTimer(employeeId, allocationId, { maxHours, onTimeLogged })`. Muestra **HH:MM** cuando está parado (total registrado hoy) y **HH:MM:SS** cuando está en curso; botón Play (verde) o Stop (rojo); Stop deshabilitado cuando `isSaving`. Loading = skeleton.
- **Accesibilidad:** `role="timer"`, `aria-live="polite"`, `aria-label` en tiempo y botones.

### 4.4 Integración

| Ubicación | Condición para mostrar | Cómo se usa |
|-----------|------------------------|-------------|
| **AllocationSheet** (vista **semanal** y **mensual**) | `modules.timeTracker` y `currentUser?.id === employeeId` y `currentUser?.user_id != null` | Pasa `showTaskTimer` y `onTimeLogged` a **AllocationTaskRow** en todas las semanas visibles; el cronómetro se muestra en ambas vistas del planificador (semanal = una semana, mensual = varias semanas). |
| **MyDayView** | `modules.timeTracker` y `currentUser?.user_id != null` | Por cada tarea del día, `<TaskTimer ... />`. |
| **Sidebar** | `modules.timeTracker` y `currentUser?.user_id != null` | Bloque "Cronómetro": si hay timer activo muestra nombre de tarea, cliente, tiempo en curso, botón Parar y "Hoy en total"; si no, total registrado hoy. Usa `useActiveTimerForSidebar(employeeId)`. Sin enlace al planificador. |
| **Página Tiempos** (`/tiempos`) | `modules.timeTracker` y permiso `/team` | Lista de cronómetros activos del equipo (RPC `get_team_active_timers`): tarjetas por persona con tarea, cliente y tiempo transcurrido (actualizado cada segundo). En la fila del usuario actual: botón "Parar" y "Hoy en total". Polling cada 5 s y escucha de `timeboxing_timer_started`. Ruta en menú **Equipo** → **Tiempos** (icono Clock). |

En AllocationSheet y MyDayView, `onTimeLogged` sirve para refrescar datos (p. ej. `loadDataForMonth`) y que se vean los nuevos `hours_actual`.

### 4.5 Configuración de agencia (`src/pages/AgencySettingsPage.tsx`)

- Toggle del módulo: "Cronómetro de tareas" (`modules.timeTracker`).
- Si el módulo está activo: select "Máximo horas por sesión" con opciones 4, 6, 8, 10, 12, 16, 24 (`timeTrackerMaxHours`). Se persiste en `currentAgency.settings`.

---

## 5. Comportamiento de usuario y edge cases

- **Varias paradas el mismo día en la misma tarea:** La RPC hace UPSERT en `time_entries`; no hay 409. El total del día se muestra y se mantiene al parar (base + sesión). Para datos legacy que pudieron tener múltiples entradas, el frontend recupera el total sumando `.select('hours')` mediante `.reduce()` en vez de `.maybeSingle()`.
- **Timer en otra tarea:** Al pulsar Play en la tarea B con timer en A, primero se cierra A con la RPC y luego se inicia el timer en B. Adicionalmente, se despacha un evento global (`timeboxing_timer_started`) para que la interfaz de la tarea A deje de contar visualmente en el frontend.
- **F5 con timer activo:** Al cargar se lee `active_timers` y `time_entries` (hoy); se restaura el tiempo transcurrido y el total del día.
- **Doble clic en Stop:** `isSaving` deshabilita el botón hasta que termina la RPC (EC1).
- **Error de red al parar:** Toast con mensaje; no se limpia `isRunning` ni `elapsedSeconds`; el usuario puede reintentar (EC2).
- **Auto-pausa por límite:** Al llegar a `maxSeconds` se llama la RPC con esas horas y se muestra toast "Cronómetro auto-pausado".
- **Empleado sin `user_id`:** El cronómetro no se muestra (evita error de autorización en la RPC).
- **Evitado bucle de renderizados:** Se envuelven las llamadas a `onTimeLogged` con `useCallback` en `AllocationSheet.tsx` y `MyDayView.tsx` para evitar que el estado cambie la referencia del prop e induzca re-montajes erráticos en el cronómetro que reseteen a 0:00:00 en la vista.

---

## 6. Despliegue y migraciones en servidor

- **No hay Edge Functions nuevas.** Solo migraciones SQL.
- **Aplicar migraciones:** Ver **`docs/MIGRACIONES-SERVIDOR.md`**. Resumen:
  - **Supabase Cloud:** SQL Editor, ejecutar en orden los 4 archivos de `supabase/migrations/` (1 → 2 → 3 → 4).
  - **Self-hosted (Docker):** Mismas rutas que en `supabase/scripts/README-deploy.md` (~/Timeboxing, ~/supabase-pi/supabase/docker). Subir `supabase/migrations/` al servidor y ejecutar con `docker compose exec` o `docker exec` sobre el contenedor de Postgres (ver comandos en MIGRACIONES-SERVIDOR.md).

---

## 7. Documentación de referencia

| Documento | Contenido |
|-----------|-----------|
| **docs/PLAN-CRONOMETRO-TAREAS.md** | Plan original en 4 fases, decisiones PM, edge cases, checklist (parcialmente marcado). |
| **docs/MIGRACIONES-SERVIDOR.md** | Comandos para aplicar migraciones (Cloud y self-hosted). |
| **supabase/scripts/README-deploy.md** | Deploy de Edge Functions; al final enlaza a MIGRACIONES-SERVIDOR para BD. |
| **README.md** | Limpieza de empleado y enlace a MIGRACIONES-SERVIDOR. |
| **DOCUMENTACION.md** | Función `cleanup_employee_data`, tabla `active_timers`, módulos, RLS. |
| **src/pages/api-docs/data/tables.ts** | Referencia API: `time_entries` (con `agency_id`), `active_timers`, `timer_sessions`; horas 0–24, precisión 6 decimales, límite configurable. |
| **src/pages/api-docs/sections/RestSection.tsx** | Ejemplos de llamadas RPC: `log_timer_hours` y `get_team_active_timers`. |
| **src/pages/api-docs/data/changelog.ts** | Changelog API: agency_id en tablas de tiempos y RPCs documentadas (2026-02-21). |

---

## 8. Checklist para otro desarrollador

- [ ] Tener aplicadas las 4 migraciones en el entorno (dev/producción).
- [ ] Activar el módulo en Configuración de agencia si se quiere probar.
- [ ] Empleado de prueba con `user_id` vinculado (cuenta de acceso).
- [ ] Al tocar la RPC o `time_entries`/`active_timers`, revisar DOCUMENTACION y README por impacto en limpieza de empleado e informes.
- [ ] Si se añaden permisos por rol al cronómetro, documentar en DOCUMENTACION y en este informe.

---

## 9. Referencia rápida de archivos

| Ámbito | Ruta |
|--------|------|
| Plan original | `docs/PLAN-CRONOMETRO-TAREAS.md` |
| Migraciones (orden 1→5) | `supabase/migrations/20260221000000_*.sql`, `20260221100000_*.sql`, `20260221110000_*.sql`, `20260221130000_*.sql`, `20260221140000_create_timer_sessions.sql` |
| Hook del cronómetro | `src/hooks/useTaskTimer.ts` |
| Componente UI | `src/components/employee/TaskTimer.tsx` |
| Integración planificador | `src/components/planner/AllocationSheet.tsx`, `src/components/planner/allocation/AllocationTaskRow.tsx` |
| Integración Mi día | `src/components/employee/MyDayView.tsx` |
| Configuración módulo + máximo horas | `src/pages/AgencySettingsPage.tsx` |
| Tipos (módulo, settings) | `src/types/index.ts` (AgencyModules.timeTracker, AgencySettings.timeTrackerMaxHours) |
| Aplicar migraciones en servidor | `docs/MIGRACIONES-SERVIDOR.md` |

---

*Informe generado a partir del plan en PLAN-CRONOMETRO-TAREAS.md y del estado actual del código (Febrero 2026).*
