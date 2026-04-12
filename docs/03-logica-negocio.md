
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
