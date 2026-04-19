
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
- **Uso**: Cualquier pantalla que muestre **total de horas**, **presupuesto** o **objetivo del proyecto** para un mes debe usar el presupuesto efectivo (p. ej. pasando los deadlines del mes a `useProjectMetrics({ month, deadlines })` o llamando a `getEffectiveBudget(project, deadlineForMonth)`). Así se respetan los ajustes del Deadline (ej.: proyecto con 30 h contratadas pero 28 h este mes). Afecta a: `DeadlinesPage`, `ClientsAndProjectsPage`, **Rentabilidad** (`FinancialHealthPage`), Seguimiento operativo y cualquier vista con columnas tipo "Xh / Yh" o "budget".

### 3.4. Fee mensual efectivo (`getEffectiveMonthlyFee`)
Para **proyectos con `projectType === 'Entregable'`** con `deliverable_start_date` y `deliverable_due_date`, el ingreso en € atribuido a un mes calendario es el **prorrateo por días de calendario** del total del contrato (`deliverable_contract_fee` si existe y es ≥ 0; si no, `monthly_fee` como total) entre inicio y fin de fase. Si faltan fechas, se usa `monthly_fee` como fee fijo del mes (mismo criterio que retainers). La lógica vive en `budgetUtils.ts` y `computeProjectMetricsForMonth` recibe la `Date` del mes.

### 3.5. Métricas de Rentabilidad (`useProjectMetrics.ts`)
Calcula el rendimiento financiero en tiempo real.
- `progressOperational`: `(Horas Computadas / Presupuesto de Horas) * 100`.
- `hoursValue`: `Horas Computadas * (Fee efectivo del mes / Horas Presupuestadas)`. El fee efectivo viene de `getEffectiveMonthlyFee`.
- `isPacing`: Indica si el ritmo de trabajo actual permite completar el presupuesto al final del mes.

---
