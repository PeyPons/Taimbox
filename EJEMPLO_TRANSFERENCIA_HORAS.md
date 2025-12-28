# Ejemplo Detallado: Transferencia de Horas entre Empleados

## Escenario Inicial

**Proyecto:** Abuelos  
**Presupuesto mensual:** 10 horas  
**Empleado:** Miguel  
**Semana 3 (15-21 de Enero):**
- Tarea: "Desarrollo funcionalidad X"
- `hoursAssigned = 10h`
- `hoursActual = 8h` (ha trabajado 8 horas)
- `status = 'planned'`
- `hoursComputed = 0h` (aún no computado)

**Deadline del proyecto Abuelos:**
- `employeeHours = { "miguel_id": 10 }`

**Estado de otros componentes:**
- Marta: 0h asignadas al proyecto Abuelos
- Capacidad Miguel semana 3: 40h (sin ausencias/eventos)
- Capacidad Marta semana 4: 40h (sin ausencias/eventos)

---

## Acción: Weekly - Mover 2h a Marta

**Miguel selecciona en Weekly:**
- Opción: "Mover 2h a otro empleado"
- Empleado destino: **Marta**
- Semana destino: **Semana 4 (22-28 de Enero)**

---

## Cambios en la Base de Datos

### 1. Actualización de la tarea original (Miguel, Semana 3)

```sql
UPDATE allocations SET
  hours_assigned = 8,  -- Ajustado a lo realmente hecho
  status = 'completed'
WHERE id = 'tarea_miguel_semana3_id';
```

**Resultado:**
- `hoursAssigned = 8h` ✅
- `hoursActual = 8h` (sin cambios)
- `status = 'completed'` ✅

### 2. Creación de nueva tarea (Marta, Semana 4)

```sql
INSERT INTO allocations (
  employee_id,
  project_id,
  week_start_date,
  hours_assigned,
  task_name,
  status
) VALUES (
  'marta_id',
  'abuelos_project_id',
  '2024-01-22',  -- Lunes semana 4
  2,
  'Desarrollo funcionalidad X (transferida de Miguel)',
  'planned'
);
```

**Resultado:**
- Nueva tarea creada para Marta con 2h planificadas

### 3. Registro de feedback (trazabilidad)

```sql
INSERT INTO weekly_feedback (
  employee_id,
  week_start_date,
  project_id,
  allocation_id,
  reason,
  comments
) VALUES (
  'miguel_id',
  '2024-01-15',
  'abuelos_project_id',
  'tarea_miguel_semana3_id',
  'other',
  'Tarea transferida a Marta (2h restantes)'
);
```

---

## Impacto en Cada Componente del Sistema

### 1. **Presupuesto del Proyecto (ProjectsPage)**

**Cálculo:**
```typescript
const monthTasks = allocations.filter(a => 
  a.projectId === 'abuelos_project_id' && 
  isSameMonth(parseISO(a.weekStartDate), currentMonth)
);

const totalAssigned = monthTasks.reduce((sum, t) => sum + t.hoursAssigned, 0);
```

**Antes:**
- Tarea Miguel semana 3: 10h
- **Total: 10h**

**Después:**
- Tarea Miguel semana 3 (completada): 8h
- Tarea Marta semana 4 (planificada): 2h
- **Total: 10h** ✅ **SE MANTIENE CORRECTO**

**Métricas del proyecto:**
- `planningPct = (10 / 10) * 100 = 100%` ✅
- `overBudget = false` ✅
- `needsPlanning = false` ✅

**Conclusión:** El presupuesto se mantiene intacto. El proyecto sigue teniendo 10h asignadas.

---

### 2. **Previsión Mensual (WeeklyForecastPage)**

**Cálculo:**
```typescript
const completed = monthAllocations.filter(a => a.status === 'completed');
const planned = monthAllocations.filter(a => a.status !== 'completed');

const completedHours = completed.reduce((sum, a) => 
  sum + ((a.hoursActual || 0) > 0 ? (a.hoursActual || 0) : a.hoursAssigned), 0
);

const plannedHours = planned.reduce((sum, a) => sum + a.hoursAssigned, 0);

const realized = completedHours + plannedHours;
```

**Antes:**
- `completedHours = 0h` (ninguna tarea completada)
- `plannedHours = 10h` (tarea de Miguel)
- `realized = 10h`

**Después:**
- `completedHours = 8h` (tarea de Miguel completada con 8h reales)
- `plannedHours = 2h` (tarea de Marta planificada)
- `realized = 10h` ✅ **SE MANTIENE CORRECTO**

**Semáforo:**
- `contracted = 10h`
- `realized = 10h`
- `difference = 0h`
- **Estado: VERDE** ✅

**Conclusión:** La previsión mensual se mantiene correcta. El proyecto sigue cumpliendo el contrato.

---

### 3. **Carga de Trabajo del Empleado (getEmployeeLoadForWeek)**

#### **Miguel - Semana 3:**

**Cálculo:**
```typescript
const employeeAllocations = allocations.filter(a => 
  a.employeeId === 'miguel_id' && 
  a.weekStartDate === '2024-01-15'
);

const totalHours = employeeAllocations.reduce((sum, a) => 
  sum + (a.status === 'completed' && (a.hoursActual || 0) > 0 
    ? Number(a.hoursActual)  // Usa hoursActual para completadas
    : Number(a.hoursAssigned)  // Usa hoursAssigned para planificadas
  ), 0
);
```

**Antes:**
- Tarea: 10h planificadas
- `totalHours = 10h`
- `capacity = 40h`
- `percentage = (10 / 40) * 100 = 25%` (healthy)

**Después:**
- Tarea completada: 8h (usa `hoursActual`)
- `totalHours = 8h` ✅
- `capacity = 40h`
- `percentage = (8 / 40) * 100 = 20%` (healthy)

**Conclusión:** La carga de Miguel se reduce correctamente a 8h (lo que realmente trabajó).

#### **Marta - Semana 4:**

**Antes:**
- `totalHours = 0h` (sin tareas)
- `capacity = 40h`
- `percentage = 0%` (empty)

**Después:**
- Nueva tarea: 2h planificadas
- `totalHours = 2h` ✅
- `capacity = 40h`
- `percentage = (2 / 40) * 100 = 5%` (healthy)

**Conclusión:** La carga de Marta aumenta correctamente con las 2h transferidas.

---

### 4. **Reportes (ReportsPage)**

#### **Miguel - Métricas del Mes:**

**Cálculo:**
```typescript
const empAllocations = monthAllocations.filter(a => a.employeeId === 'miguel_id');
const completedTasks = empAllocations.filter(a => a.status === 'completed');

const plannedHours = empAllocations.reduce((sum, a) => sum + a.hoursAssigned, 0);
const realHours = completedTasks.reduce((sum, a) => sum + (a.hoursActual || 0), 0);
const computedHours = completedTasks.reduce((sum, a) => sum + (a.hoursComputed || 0), 0);

const percentage = (plannedHours / capacity) * 100;
const efficiency = realHours > 0 ? (computedHours / realHours) * 100 : 0;
```

**Antes:**
- `plannedHours = 10h` (tarea planificada)
- `realHours = 0h` (ninguna completada)
- `computedHours = 0h`
- `percentage = (10 / 160) * 100 = 6.25%` (capacidad mensual 160h)

**Después:**
- `plannedHours = 8h` (tarea completada con 8h asignadas)
- `realHours = 8h` (tarea completada con 8h reales)
- `computedHours = 0h` (aún no computado)
- `percentage = (8 / 160) * 100 = 5%` ✅
- `efficiency = 0%` (sin horas computadas aún)

**Conclusión:** Los reportes reflejan correctamente que Miguel completó 8h reales.

#### **Marta - Métricas del Mes:**

**Antes:**
- `plannedHours = 0h`
- `realHours = 0h`
- `computedHours = 0h`

**Después:**
- `plannedHours = 2h` (nueva tarea planificada)
- `realHours = 0h` (aún no completada)
- `computedHours = 0h`
- `percentage = (2 / 160) * 100 = 1.25%` ✅

**Conclusión:** Los reportes reflejan correctamente que Marta tiene 2h planificadas.

---

### 5. **Deadlines (DeadlinesPage)**

**Cálculo:**
```typescript
const getEmployeeAssignedHours = (employeeId: string) => {
  let total = 0;
  
  // Sumar horas de deadlines
  deadlines.forEach(deadline => {
    total += deadline.employeeHours[employeeId] || 0;
  });
  
  // Sumar asignaciones globales
  globalAssignments.forEach(assignment => {
    if (assignment.affectsAll || assignment.affectedEmployeeIds?.includes(employeeId)) {
      total += assignment.hours;
    }
  });
  
  return total;
};
```

**⚠️ IMPORTANTE:** Los deadlines NO se actualizan automáticamente. Siguen mostrando:
- Deadline Abuelos: `employeeHours = { "miguel_id": 10 }`

**Miguel:**
- Deadline horas: 10h
- Allocations reales: 8h (completada) + 0h (planificadas) = 8h
- **Diferencia: -2h** ⚠️ **INCONSISTENCIA DETECTADA**

**Marta:**
- Deadline horas: 0h
- Allocations reales: 2h (planificadas)
- **Diferencia: +2h** ⚠️ **INCONSISTENCIA DETECTADA**

**PlanningInconsistenciesCard mostrará:**
- Para Miguel: "Tienes 2h menos asignadas que el deadline"
- Para Marta: "Tienes 2h más asignadas que el deadline"

**Conclusión:** El sistema detecta la inconsistencia correctamente. El manager debe actualizar manualmente el deadline si quiere mantener coherencia.

---

### 6. **Productividad y Fiabilidad (ReliabilityIndexCard)**

**Cálculo:**
```typescript
const completedTasks = allocations.filter(a => 
  a.employeeId === employeeId && 
  a.status === 'completed' && 
  a.hoursAssigned > 0 && 
  (a.hoursActual || 0) > 0
);

const totalEstimated = completedTasks.reduce((sum, a) => sum + a.hoursAssigned, 0);
const totalReal = completedTasks.reduce((sum, a) => sum + (a.hoursActual || 0), 0);
const index = totalReal > 0 ? (totalEstimated / totalReal) * 100 : 0;
```

**Miguel - Antes:**
- Tarea no completada → No se cuenta en fiabilidad

**Miguel - Después:**
- Tarea completada: `hoursAssigned = 8h`, `hoursActual = 8h`
- `totalEstimated = 8h`
- `totalReal = 8h`
- `index = (8 / 8) * 100 = 100%` ✅ **PERFECTO**
- **Tendencia: "Preciso"** ✅

**Conclusión:** La transferencia no afecta negativamente la fiabilidad de Miguel. De hecho, mejora porque ahora tiene una tarea completada con estimación perfecta.

---

### 7. **Disponibilidad Total del Empleado**

#### **Miguel - Semana 3:**

**Cálculo:**
```typescript
const baseCapacity = 40h;
const absenceHours = 0h;
const eventHours = 0h;
const available = baseCapacity - absenceHours - eventHours; // 40h

const assignedHours = 8h; // De la tarea completada
const availableForNewTasks = available - assignedHours; // 32h
```

**Antes:**
- `assignedHours = 10h`
- `availableForNewTasks = 30h`

**Después:**
- `assignedHours = 8h` ✅
- `availableForNewTasks = 32h` ✅

**Conclusión:** Miguel tiene 2h más disponibles para nuevas tareas.

#### **Marta - Semana 4:**

**Antes:**
- `assignedHours = 0h`
- `availableForNewTasks = 40h`

**Después:**
- `assignedHours = 2h` ✅
- `availableForNewTasks = 38h` ✅

**Conclusión:** Marta tiene 2h menos disponibles (ahora tiene trabajo asignado).

---

### 8. **PlannerGrid (Vista Manager)**

**Visualización por semana:**

**Semana 3:**
- **Miguel:** Muestra 8h (tarea completada) ✅
- **Marta:** 0h

**Semana 4:**
- **Miguel:** 0h
- **Marta:** Muestra 2h (nueva tarea planificada) ✅

**Conclusión:** El planner muestra correctamente la distribución de horas entre empleados y semanas.

---

### 9. **MyWeekView (Vista Empleado)**

#### **Miguel - Vista Semana 3:**

**Antes:**
- Proyecto Abuelos: 10h asignadas, 8h realizadas, 2h faltantes
- Tarea aparece en "deviatedTasks"

**Después:**
- Proyecto Abuelos: 8h asignadas, 8h realizadas, 0h faltantes ✅
- Tarea completada, no aparece en "deviatedTasks"
- **Balance:** 0h (perfecto) ✅

**Conclusión:** Miguel ve correctamente que su tarea está completada.

#### **Marta - Vista Semana 4:**

**Antes:**
- Proyecto Abuelos: 0h

**Después:**
- Proyecto Abuelos: 2h asignadas, 0h realizadas
- Nueva tarea visible: "Desarrollo funcionalidad X (transferida de Miguel)"
- Aparece en su planificación ✅

**Conclusión:** Marta ve correctamente la nueva tarea asignada.

---

### 10. **Coherencia de Datos (PlanningInconsistenciesCard)**

**Cálculo:**
```typescript
const deadlineHours = deadline.employeeHours[employeeId] || 0;
const projectAllocs = allocationsByProject[projectId];
const totalPlanned = projectAllocs.planned + projectAllocs.computed;
const difference = totalPlanned - deadlineHours;
```

**Miguel:**
- Deadline: 10h
- Allocations: 8h (completada)
- `difference = 8 - 10 = -2h` ⚠️
- **Muestra:** "Tienes 2h menos que el deadline"

**Marta:**
- Deadline: 0h
- Allocations: 2h (planificada)
- `difference = 2 - 0 = +2h` ⚠️
- **Muestra:** "Tienes 2h más que el deadline"

**Conclusión:** El sistema detecta correctamente la inconsistencia. Esto es **esperado y correcto** porque:
1. Los deadlines son planificación inicial
2. Las transferencias son ajustes operativos
3. El manager puede actualizar el deadline si quiere mantener coherencia

---

## Resumen del Impacto

### ✅ **Componentes que se mantienen correctos:**

1. **Presupuesto del proyecto:** 10h total (8h Miguel + 2h Marta) ✅
2. **Previsión mensual:** 10h realizadas (8h completadas + 2h planificadas) ✅
3. **Carga de trabajo:** 
   - Miguel semana 3: 8h ✅
   - Marta semana 4: 2h ✅
4. **Reportes:**
   - Miguel: 8h planificadas, 8h reales ✅
   - Marta: 2h planificadas, 0h reales ✅
5. **Productividad:** Miguel tiene estimación perfecta (8h/8h) ✅
6. **Disponibilidad:**
   - Miguel: +2h disponibles ✅
   - Marta: -2h disponibles ✅
7. **PlannerGrid:** Muestra correctamente la distribución ✅
8. **MyWeekView:** Ambos empleados ven sus tareas correctamente ✅

### ⚠️ **Componentes que muestran inconsistencia (esperada):**

1. **Deadlines:** 
   - Miguel: -2h vs deadline
   - Marta: +2h vs deadline
   - **Solución:** Manager actualiza deadline manualmente si quiere coherencia

2. **PlanningInconsistenciesCard:**
   - Detecta correctamente las diferencias
   - **Es correcto:** Las transferencias operativas pueden diferir de la planificación inicial

---

## Conclusión General

**El sistema maneja correctamente la transferencia de horas** en términos de:
- ✅ Integridad de datos
- ✅ Presupuesto del proyecto
- ✅ Carga de trabajo
- ✅ Reportes y métricas
- ✅ Disponibilidad
- ✅ Visualización en todas las vistas

**La única "inconsistencia" es con los deadlines**, que es **esperada y correcta** porque:
- Los deadlines son planificación inicial
- Las transferencias son ajustes operativos
- El sistema detecta y muestra estas diferencias para que el manager las gestione

**Recomendación:** Si el manager quiere mantener coherencia total, debe actualizar el deadline después de la transferencia:
- Deadline Abuelos: `employeeHours = { "miguel_id": 8, "marta_id": 2 }`
