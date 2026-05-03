
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
Para permitir regularizaciones mensuales (ej. restar o sumar horas en un mes concreto vía Deadlines), el sistema usa `getEffectiveBudget` (objetivo de horas del mes coherente con Deadlines cuando se conoce el deadline del mes).
- **Lógica**: Si el `Deadline` del mes tiene `budgetOverride >= 0`, usa ese valor. Si no, usa el `Project.budgetHours` general.
- **`getEffectiveMinimum`**: El mínimo de horas del proyecto no puede superar el `budgetOverride` del mes cuando existe.
- **`getEffectiveBudgetForMonth`**: En **Rentabilidad** y métricas derivadas (`computeProjectMetricsForMonth`), para **Entregables** con fase fechada el presupuesto de horas del mes se **prorratea por días de fase** (misma base que `getEffectiveMonthlyFee`), salvo que el deadline del mes fije `budgetOverride`.
- **Uso**: Pantallas tipo Deadlines / coherencia siguen con `getEffectiveBudget` + deadlines. **KPIs de rentabilidad** usan `getEffectiveBudgetForMonth` vía `useProjectMetrics` para alinear fee €/h y horas del mes en entregables multi-mes.

### 3.4. Fee mensual efectivo (`getEffectiveMonthlyFee`)
Para **proyectos con `projectType === 'Entregable'`** con `deliverable_start_date` y `deliverable_due_date`, el ingreso en € atribuido a un mes calendario es el **prorrateo por días de calendario** del total del contrato (`deliverable_contract_fee` si existe y es ≥ 0; si no, `monthly_fee` como total) entre inicio y fin de fase. Si faltan fechas, se usa `monthly_fee` como fee fijo del mes (mismo criterio que retainers). La lógica vive en `budgetUtils.ts` y `computeProjectMetricsForMonth` recibe la `Date` del mes.

### 3.5. Métricas de Rentabilidad (`useProjectMetrics.ts`)
Calcula el rendimiento financiero en tiempo real.
- `progressOperational`: `(Horas Computadas / Presupuesto de Horas del mes) * 100` (presupuesto del mes = `getEffectiveBudgetForMonth` salvo override en deadline).
- `hoursValue`: `Horas Computadas * (Fee efectivo del mes / Horas presupuesto del mes)`. El fee efectivo viene de `getEffectiveMonthlyFee`.
- `isPacing`: Compara el avance operativo con el **progreso esperado del mes**: mes en curso → proporción de días calendario transcurridos; mes ya cerrado → 100 %; mes futuro → 0 %; se puede forzar con `pacingReferenceDate` (p. ej. informe burnout con fin de mes).
- **Carga de empleado**: `useProjectMetrics` puede pasar capacidad neta del mes (calendario − ausencias − eventos de equipo), alineada con Deadlines.

### 3.6. Ciclo de vida del entregable (vista agregada)
Además de la vista **mensual** anterior, existe una vista de **fase completa** (consumo frente a `Project.budgetHours` total, ingreso devengado lineal por días de fase, coste y estados `on-track` / `at-risk` / `over-budget`). Detalle de fórmulas, asimetría días naturales vs laborables y coexistencia con el radar en **[docs/14-ciclo-vida-entregables.md](14-ciclo-vida-entregables.md)**.

---
