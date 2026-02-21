# Plan: Módulo de Cronómetro (Time Tracking) y Cortafuegos

**Estado:** Planificado (no implementado)  
**Objetivo:** Temporizador en tiempo real para tareas (allocations), resiliente a F5, con límite estricto de 12 h para evitar imputaciones por descuido.

Este documento valida el plan propuesto por el Product Manager, recoge los reajustes del desarrollador y **incorpora las decisiones finales del PM** (RPC `log_timer_hours`, opt-in del módulo, ocultar cronómetro si no hay `user_id`, documentación API, edge cases) para cerrar el debate antes de implementar.

---

## Resumen del plan en 4 fases

| Fase | Descripción |
|------|-------------|
| 1 | Base de datos: tabla `active_timers`, constraint en `time_entries`, RLS |
| 2 | Hook `useTaskTimer` (estado, reloj, recuperación post-F5, límite 12 h) |
| 3 | Componente `TaskTimer` (píldora Play/Stop, tiempo formateado) |
| 4 | Integración condicional en vistas de tareas (flag de módulo) |

---

## Fase 1: Base de datos (Supabase)

### 1.1 Tabla `active_timers`

- **Propuesta:** `employee_id` PK, `allocation_id`, `started_at`.
- **Validación:** Coherente con el esquema actual. `employees(id)` y `allocations(id)` existen; `allocations` tiene `employee_id` y pertenece a un empleado de la agencia.
- **Aislamiento por agencia:** La tabla no tiene `agency_id`. El aislamiento se hace por `employee_id` → `employees.agency_id`. Las políticas RLS basadas en `auth.uid()` y `employees.user_id` restringen correctamente a “solo mis timers”.
- **Empleados sin `user_id` (UX – decisión PM):** Si el empleado no tiene login vinculado (`user_id` nulo o indefinido), `auth.uid()` no coincidirá y la RLS denegará acceso. Además de documentarlo, **ocultar el componente del cronómetro en el frontend** cuando `currentEmployee.user_id` sea nulo o indefinido, para no mostrar un botón que por detrás devolverá error de permisos en la BD.

### 1.2 Constraint en `time_entries`

- **Propuesta:** `ADD CONSTRAINT max_hours_per_entry CHECK (hours <= 12)`.
- **Problema:** En el esquema actual, `time_entries` ya tiene `CHECK (hours >= 0 AND hours <= 24)`. Añadir `hours <= 12` es compatible (queda 0–12), pero **si existe algún registro con `hours > 12`**, la migración fallará.
- **Reajuste:** Antes de aplicar la migración:
  1. Ejecutar `SELECT MAX(hours) FROM time_entries;`.
  2. Si hay valores > 12: decidir si se actualizan/cap a 12 en una migración previa o se pospone el constraint (p. ej. solo para filas nuevas o vía trigger). Documentar en `DOCUMENTACION.md` que `time_entries` pasa a tener máximo 12 h por entrada.

### 1.3 RLS en `active_timers`

- **Propuesta:** Políticas SELECT, INSERT y DELETE con `auth.uid() IN (SELECT user_id FROM employees WHERE id = employee_id)`.
- **Reajuste crítico:** El hook usa **upsert** (`supabase.from('active_timers').upsert(...)`). En PostgreSQL, upsert hace `INSERT ... ON CONFLICT DO UPDATE`. Para que el UPDATE no falle por RLS, hace falta una **política UPDATE** en `active_timers`:

```sql
CREATE POLICY "Employees can update their own active timers"
ON public.active_timers FOR UPDATE
USING (auth.uid() IN (SELECT user_id FROM public.employees WHERE id = employee_id));
```

- **Convención del proyecto:** En `DOCUMENTACION.md` la mayoría de tablas usan `requesting_agency_id()`. Para `active_timers` tiene sentido mantener políticas por usuario (`auth.uid()` + `employees.user_id`) porque cada empleado solo debe ver/modificar su propia fila. No es necesario cambiar a `requesting_agency_id()` para esta tabla.

### 1.4 Limpieza al borrar empleado

- **Reajuste:** La app llama a `cleanup_employee_data(p_employee_id)` antes de borrar un empleado. Esa RPC debe incluir la limpieza de `active_timers` para no dejar filas huérfanas. Añadir en la migración (o en la que define/actualiza la función) algo como:

```sql
DELETE FROM public.active_timers WHERE employee_id = p_employee_id;
```

- Actualizar `README.md` y `DOCUMENTACION.md` en la sección de limpieza de empleado para citar `active_timers`.

### 1.5 RPC `log_timer_hours` (decisión PM)

Para evitar carreras read-modify-write y centralizar la lógica en la base de datos, se crea una **RPC** que el frontend invoca para “cerrar un timer y registrar el tiempo”. El frontend no hace matemáticas financieras; las hace PostgreSQL en una sola transacción.

**Nombre sugerido:** `log_timer_hours` (o equivalente).

**Parámetros (ejemplo):** `p_employee_id uuid`, `p_allocation_id uuid`, `p_hours numeric`, `p_notes text` (opcional), `p_date date` (opcional; por defecto `CURRENT_DATE`).

**Comportamiento (en una transacción):**
1. `INSERT` en `time_entries` (employee_id, allocation_id, date, hours, notes).
2. `UPDATE allocations SET hours_actual = COALESCE(hours_actual, 0) + p_hours WHERE id = p_allocation_id`.
3. `DELETE FROM active_timers WHERE employee_id = p_employee_id`.

**Seguridad:** La RPC debe comprobar que el llamante es el empleado (p. ej. que `auth.uid()` coincide con `user_id` del empleado `p_employee_id`) o usar políticas RLS coherentes si se invoca con el rol del usuario. Documentar en la migración.

Con esta RPC, tanto “Stop del timer actual” como “Cerrar el otro timer al cambiar de tarea” se resuelven en el frontend con una sola llamada: el frontend solo dice “BD, cierra este timer y suma este tiempo” y no ejecuta las 3 operaciones por su cuenta.

### 1.6 Migraciones locales

- **Nota:** En el repo no hay archivos en `supabase/migrations/`. Si el proyecto usa solo migraciones remotas o otro flujo, adaptar los pasos (“generar migración” / “aplicar”) al proceso real (p. ej. SQL ejecutado en el panel de Supabase o en un único archivo de migración versionado).

---

## Fase 2: Hook `useTaskTimer`

### 2.1 Import de toast

- **Propuesta:** `import { useToast } from '@/components/ui/use-toast';`
- **Reajuste:** En el proyecto el hook está en `@/hooks/use-toast` (usado en `useTaskTransfers.ts`, etc.). Usar `import { useToast } from '@/hooks/use-toast';` para consistencia.

### 2.2 `forceStop` y uso de la RPC

- El frontend **no** hace las 3 operaciones (insert time_entries, update allocations, delete active_timers) por su cuenta. Invoca la **RPC `log_timer_hours`** (véase 1.5) con `employee_id`, `allocation_id`, `hours` (y opcionalmente `notes`, `date`). La BD hace insert, suma atómica de `hours_actual` y borrado de `active_timers` en una sola transacción.
- **forceStop** en el Hook: calcular `hoursToLog` desde los segundos transcurridos, llamar a `supabase.rpc('log_timer_hours', { ... })`, y según el resultado limpiar estado local (`isRunning`, `elapsedSeconds`, intervalo) e invocar `onTimeLogged`. Definir la llamada con `useCallback` y dependencias adecuadas para evitar closures obsoletas. En el efecto del intervalo (límite 12 h), al llegar a `MAX_SECONDS` invocar esa misma función fuera del `setState`.

### 2.3 Timer en otra tarea (refactor con RPC – decisión PM)

- Con `employee_id` como PK solo puede haber un timer activo por empleado. Si el usuario pulsa “Play” en la tarea B mientras hay timer en la tarea A, no debe perderse el tiempo de A.
- **Decisión PM:** Parametrizar el cierre delegando en la BD. La mejor forma es usar la **misma RPC `log_timer_hours`**: el frontend no depende del estado local del hook para “cerrar otra asignación”, evita stale closures.
- **Flujo al iniciar en la tarea actual:** Si al hacer “Play” la consulta a `active_timers` devuelve una fila con **otra** `allocation_id`:
  1. Calcular horas desde ese `started_at` hasta ahora (máximo 12 h).
  2. Llamar a `log_timer_hours(p_employee_id, esa_allocation_id, horas_calculadas, notes opcional)`.
  3. Cuando la RPC termine con éxito, hacer upsert del nuevo timer para la tarea actual (allocation_id actual, started_at = now).
- Así el frontend solo dice “BD, cierra este timer y suma este tiempo” y luego inicia el nuevo; toda la lógica de escritura y atomicidad queda en PostgreSQL.

### 2.4 Recarga de allocations tras stop

- Tras una llamada exitosa a `log_timer_hours`, la UI (p. ej. `AppContext`) no tiene por defecto los nuevos valores de `hours_actual`.
- **Reajuste:** Después de éxito, invocar un callback opcional del hook (p. ej. `onTimeLogged?.(allocationId, hoursToLog)`) para que el padre refresque datos (p. ej. `ensureMonthLoaded` o refetch de allocations).

---

## Edge cases (aportes PM)

Estos dos escenarios deben tenerse en cuenta en el Hook y/o en el componente UI.

### EC1. Prevención de doble clic (race conditions)

**Problema:** Al pulsar "Stop", el Hook llama a la RPC `log_timer_hours`. Si el usuario hace doble clic rápido (p. ej. por lag), podría dispararse la llamada dos veces y insertar el bloque de tiempo duplicado antes de que la primera ejecución borre el timer activo.

**Solución:** Introducir un estado intermedio (p. ej. `isSaving`) en el Hook. En cuanto el usuario hace clic en Stop:
- Poner `isSaving = true` de inmediato (o deshabilitar el botón).
- El botón Stop debe quedar deshabilitado o con `pointer-events-none` hasta que termine la llamada a la RPC (éxito o error).
- Al terminar la RPC, poner `isSaving = false` (y solo entonces limpiar `isRunning` y el intervalo si fue éxito).

Implementación posible: el Hook expone `isSaving`; el componente `TaskTimer` deshabilita el botón Stop cuando `isSaving` es true (y opcionalmente muestra un indicador de guardando).

### EC2. Resiliencia ante caída de red (manejo de errores en forceStop)

**Problema:** Si el empleado pulsa "Stop" justo cuando pierde WiFi o está en un túnel/tren, las llamadas `await supabase...` pueden fallar. Con el código actual, el reloj se pararía en pantalla pero en base de datos el timer seguiría activo y no se guardaría el `time_entry`; el empleado perdería el registro.

**Solución:** Envolver la llamada a la RPC (o el cuerpo de `forceStop` que la invoca) en un `try/catch`:
- **Si hay error (red, timeout, etc.):** Mostrar un toast de error (variant destructivo), por ejemplo: *"Error de conexión. El tiempo sigue corriendo. Inténtalo de nuevo cuando tengas conexión."*
- **No** limpiar el estado: no poner `isRunning = false`, no borrar `elapsedSeconds`, no eliminar el intervalo. El cronómetro debe seguir mostrando que está en marcha y el usuario puede pulsar Stop de nuevo cuando recupere conexión.
- **Si todo va bien:** Comportamiento actual (limpiar timer, invocar `onTimeLogged`, etc.).

Así el empleado no pierde el tiempo imputado y puede reintentar al recuperar la red.

---

## Fase 3: Componente `TaskTimer`

- **Propuesta:** Píldora con tiempo `HH:MM:SS`, botón Play (verde) / Stop (rojo), estado de carga.
- **Validación:** Correcta. Usar `@/hooks/use-toast` si el componente u otro código muestra toasts.
- **Accesibilidad:** Añadir `aria-label` a los botones (p. ej. “Iniciar cronómetro”, “Detener cronómetro”) y considerar `role="timer"` o `aria-live="polite"` para el tiempo transcurrido.

---

## Fase 4: Integración condicional

### 4.1 Dónde integrar

- **Propuesta:** “MyDayView o AllocationTaskRow”.
- **Validación en código:**
  - **AllocationTaskRow** (`src/components/planner/allocation/AllocationTaskRow.tsx`): se usa dentro de `AllocationSheet`; recibe `alloc` (con `alloc.employeeId`, `alloc.id`) y no recibe explícitamente el empleado “actual”. El empleado dueño de la fila es `alloc.employeeId`. Para la hoja del empleado actual, ese id coincide con el empleado de la hoja. Hay que pasar `employeeId={alloc.employeeId}` y `allocationId={alloc.id}` al `TaskTimer`, y mostrarlo solo cuando el empleado de la hoja sea el usuario actual (o según reglas de negocio: solo “mis” tareas).
  - **MyDayView** (`src/components/employee/MyDayView.tsx`): vista “Mi día” con tareas del `currentUser`; buen candidato para mostrar el cronómetro por tarea. Aquí el empleado es siempre `currentUser`; se puede usar `currentUser.id` y `allocation.id` por cada tarea.
  - **EmployeeDashboard**: contiene `MyWeekView` / `MyDayView` y posiblemente listas de tareas; la integración puede ser en los mismos componentes de fila de tarea que se reutilicen en el dashboard.

### 4.2 Flag de módulo (decisión PM cerrada)

- **Decisión:** Usar `settings?.modules?.timeTracker ?? false` (desactivado por defecto). Añadir `timeTracker?: boolean` a la interfaz `AgencyModules` en `src/types/index.ts`.
- **Motivo:** En SaaS B2B la regla es **opt-in**: no cambiar la interfaz a clientes existentes activando funciones nuevas sin avisar (evita dudas y tickets de soporte). Cada agencia activa el cronómetro desde Configuración de agencia si lo desea.
- En AgencySettingsPage debe poder activarse/desactivarse el módulo “Cronómetro de tareas” (o nombre equivalente).

### 4.3 Permisos

- Si el cronómetro debe estar restringido por rol (p. ej. solo ciertos roles pueden registrar tiempo), valorar un nuevo flag en `UserPermissions` y comprobarlo donde se renderice `TaskTimer` o dentro del hook. El plan actual no lo exige; se deja como decisión opcional.

---

## Documentación a actualizar tras implementar

- **README.md:** En “Limpieza empleado”, incluir que `cleanup_employee_data` debe borrar `active_timers` para ese empleado.
- **DOCUMENTACION.md:**
  - Sección 7 (Mantenimiento): nueva tabla `active_timers` (filtro por `employee_id` → agencia); política RLS por usuario; `time_entries` con máximo 12 h por entrada; actualizar lista de tablas filtradas por `employee_id` para incluir `active_timers`; mencionar que la función `cleanup_employee_data` debe eliminar de `active_timers`.
  - Si se añade un nuevo módulo o feature: descripción del módulo de cronómetro, dónde se muestra (AllocationTaskRow, MyDayView, etc.) y dependencia del flag de agencia.
- **Mapa de dependencias (README/DOCUMENTACION):** Si se añaden tipos (p. ej. para timer activo), listar consumidores; si se toca `AllocationTaskRow` o `MyDayView`, indicar impacto en AllocationSheet y EmployeeDashboard.
- **API pública:** En `src/pages/api-docs/data/tables.ts`, actualizar la descripción/check de la tabla `time_entries` para reflejar el límite de 12 h por entrada (p. ej. "Horas trabajadas (0–12 por entrada).").

---

## Checklist previo a implementación

- [ ] Decidir si existe dato en `time_entries` con `hours > 12` y cómo tratar el constraint (migración de datos previa o excepción).
- [ ] Añadir política **UPDATE** en RLS de `active_timers` para que el upsert funcione.
- [x] Incluir borrado de `active_timers` en `cleanup_employee_data` (migración `20260221110000_cleanup_employee_data.sql` define la función completa).
- [ ] **Crear RPC `log_timer_hours`** (Fase 1.5): insert time_entries, UPDATE allocations SET hours_actual = hours_actual + p_hours, DELETE active_timers, en una transacción; validar llamante (auth.uid() = empleado).
- [ ] Hook: usar solo la RPC para cerrar/registrar tiempo (no 3 llamadas sueltas); `useCallback` y manejo “timer en otra tarea” llamando a la RPC con la otra allocation_id antes de upsert del nuevo timer.
- [ ] Hook: import de toast desde `@/hooks/use-toast`.
- [ ] UI: flag de módulo `settings?.modules?.timeTracker ?? false`; añadir `timeTracker?: boolean` a `AgencyModules`; toggle en AgencySettingsPage.
- [ ] Integración: pasar `employeeId` y `allocationId` correctos; **ocultar TaskTimer** cuando `currentEmployee.user_id` sea nulo o indefinido.
- [ ] Opcional: callback `onTimeLogged` o mecanismo para refrescar allocations tras parar el timer.
- [ ] **EC1:** Estado `isSaving` al pulsar Stop; deshabilitar botón / `pointer-events-none` hasta que termine la RPC.
- [ ] **EC2:** try/catch en la invocación a la RPC; en error toast y no limpiar `isRunning` ni el intervalo.
- [ ] Actualizar README, DOCUMENTACION y **api-docs (tables.ts: time_entries)** según la lista anterior.

---

*Documento generado a partir del plan del Product Manager y de la revisión del código y la documentación del proyecto (Febrero 2026).*
