# Impacto de Mover Horas en Weekly - Análisis Técnico

## Escenario de Ejemplo

**Situación inicial:**
- Tarea: "HD Hotels - Tarea X"
- Empleado: Juan
- Semana 3: `hoursAssigned = 5h`, `hoursActual = 2.5h`, `status = 'planned'`

**Acción en Weekly:**
- Juan selecciona "Mover resto a la semana siguiente"
- Sistema ejecuta:
  1. Actualiza tarea original: `hoursAssigned = 2.5h`, `status = 'completed'`
  2. Crea nueva tarea semana 4: `hoursAssigned = 2.5h`, `status = 'planned'`

## Cómo se Refleja en los Cálculos

### 1. **Estimaciones del Proyecto (ProjectsPage)**

```typescript
const totalAssigned = monthTasks.reduce((sum, t) => sum + t.hoursAssigned, 0);
```

**Resultado:**
- Tarea completada (semana 3): 2.5h
- Tarea planificada (semana 4): 2.5h
- **Total: 5h** ✅ **CORRECTO** - Se mantiene el presupuesto total

**Impacto en presupuesto:**
- `planningPct = (totalAssigned / budget) * 100` → Incluye las 5h correctamente
- `overBudget` → Detecta correctamente si se excede el presupuesto

### 2. **Previsión Mensual (WeeklyForecastPage)**

```typescript
// Tareas completadas
const completedHours = completed.reduce((sum, a) => 
  sum + ((a.hoursActual || 0) > 0 ? (a.hoursActual || 0) : a.hoursAssigned), 0
);

// Tareas planificadas
const plannedHours = planned.reduce((sum, a) => sum + a.hoursAssigned, 0);

const realized = completedHours + plannedHours;
```

**Resultado:**
- `completedHours`: 2.5h (de la tarea completada con hoursActual)
- `plannedHours`: 2.5h (de la nueva tarea planificada)
- **Realized: 5h** ✅ **CORRECTO** - Mantiene el total contratado

**Semáforo de proyectos:**
- Si `contracted = 5h` y `realized = 5h` → Estado: **VERDE** ✅

### 3. **Carga de Trabajo del Empleado (getEmployeeLoadForWeek)**

```typescript
const totalHours = employeeAllocations.reduce((sum, a) => 
  sum + (a.status === 'completed' && (a.hoursActual || 0) > 0 
    ? Number(a.hoursActual) 
    : Number(a.hoursAssigned)), 0
);
```

**Resultado por semana:**
- **Semana 3**: 2.5h (tarea completada, usa hoursActual)
- **Semana 4**: 2.5h (tarea planificada, usa hoursAssigned)
- **Total mensual**: 5h ✅ **CORRECTO**

**Capacidad disponible:**
- Se calcula correctamente considerando ausencias y eventos
- Las 2.5h de la semana 4 se cuentan en la carga futura

### 4. **Reportes (ReportsPage)**

```typescript
const plannedHours = empAllocations.reduce((sum, a) => sum + a.hoursAssigned, 0);
const realHours = completedTasks.reduce((sum, a) => sum + (a.hoursActual || 0), 0);
```

**Resultado:**
- `plannedHours`: Suma todas las horas asignadas (incluye completadas y planificadas)
- `realHours`: Solo suma hoursActual de tareas completadas
- **Refleja correctamente** el trabajo realizado vs planificado

### 5. **Disponibilidad y Horarios**

**Cálculo de capacidad:**
```typescript
const baseCapacity = employee.defaultWeeklyCapacity;
const absenceHours = getAbsenceHoursInRange(...);
const eventHours = getTeamEventHoursInRange(...);
const available = baseCapacity - absenceHours - eventHours;
```

**Impacto:**
- ✅ Las horas movidas se cuentan en la semana destino
- ✅ La capacidad disponible se calcula correctamente
- ✅ Las ausencias y eventos se consideran en ambas semanas

## Caso Especial: Mover a Otro Empleado

**⚠️ ACTUALMENTE NO IMPLEMENTADO**

El código actual solo mueve horas a la **semana siguiente del mismo empleado**. Si necesitas mover a otro empleado, hay dos opciones:

### Opción A: Usar "Redistribución Rápida" (Manager)
- En WeeklyForecastPage, el manager puede redistribuir horas
- Crea una nueva asignación para el otro empleado
- La tarea original se mantiene (debe completarse o justificarse)

### Opción B: Implementar "Mover a otro empleado" (Futuro)
- Añadir selector de empleado en WeeklyReportDialog
- Crear nueva asignación para el empleado destino
- Mantener integridad de datos

## Recomendaciones

### ✅ Lo que funciona bien:
1. **Presupuesto del proyecto**: Se mantiene correctamente (5h total)
2. **Carga de trabajo**: Se distribuye correctamente entre semanas
3. **Reportes**: Reflejan correctamente horas reales vs planificadas
4. **Capacidad**: Se calcula considerando ausencias y eventos

### ⚠️ Consideraciones:
1. **Trazabilidad**: No hay registro histórico de que se movieron horas
2. **Mover a otro empleado**: Requiere usar redistribución manual
3. **Auditoría**: No se guarda quién movió las horas ni cuándo

## Conclusión

**El sistema maneja correctamente el movimiento de horas** en términos de:
- ✅ Presupuesto del proyecto
- ✅ Carga de trabajo
- ✅ Reportes y estimaciones
- ✅ Disponibilidad y capacidad

**Las horas se reflejan correctamente** en todos los cálculos porque:
- La tarea original se completa con las horas reales
- La nueva tarea planificada mantiene las horas restantes
- El total siempre suma correctamente

**Si necesitas mover a otro empleado**, actualmente debes:
1. Completar la tarea original (o justificarla)
2. Usar "Redistribución Rápida" en WeeklyForecastPage para asignar al otro empleado

