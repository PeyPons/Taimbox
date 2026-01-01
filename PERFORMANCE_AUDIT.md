# Auditoría de Rendimiento - Timeboxing App

## Resumen Ejecutivo

Esta auditoría identifica los problemas de rendimiento más críticos que causan lentitud en la aplicación. Los problemas se clasifican por impacto (Crítico, Alto, Medio).

---

## Problemas Críticos

### 1. Context API Monolítico (`AppContext.tsx`)

**Archivo:** `src/contexts/AppContext.tsx` (1050+ líneas)

**Problema:** Un único contexto gigante maneja TODO el estado de la aplicación:
- 12+ estados independientes (employees, clients, projects, allocations, absences, etc.)
- 30+ funciones de mutación
- Cualquier cambio en cualquier estado causa re-render de TODOS los consumidores

**Impacto:** Cada vez que se actualiza una allocation, TODOS los componentes que usan `useApp()` se re-renderizan, incluso si solo necesitan `employees`.

**Líneas afectadas:**
- `src/contexts/AppContext.tsx:1015-1041` - El `useMemo` del value tiene 25+ dependencias
- Cada función CRUD dispara `setState` que causa cascada de re-renders

**Solución recomendada:**
```typescript
// Dividir en contextos separados:
// - AuthContext (ya existe) ✓
// - EmployeeContext
// - ProjectContext
// - AllocationContext
// - AbsenceContext
// etc.
```

### 2. Cálculos Costosos Sin Memoización

**Archivo:** `src/contexts/AppContext.tsx`

**Problema:** Las funciones de query realizan filtrado/mapeo de arrays en cada llamada:

```typescript
// Línea 871-873: Se ejecuta en cada render
const getEmployeeAllocationsForWeek = useCallback((employeeId, weekStart) => {
  return allocations.filter(a => a.employeeId === employeeId && a.weekStartDate === weekStart);
}, [allocations]);
```

**Impacto:** 60+ operaciones de array (filter/map/reduce/forEach) se ejecutan repetidamente.

**Funciones afectadas:**
- `getEmployeeAllocationsForWeek` (línea 871)
- `getEmployeeLoadForWeek` (línea 875-938) - cálculo muy complejo
- `getEmployeeMonthlyLoad` (línea 940-971)
- `getProjectHoursForMonth` (línea 973-991)
- `getClientTotalHoursForMonth` (línea 993-1010)

**Solución recomendada:**
```typescript
// Usar selectores memoizados o crear índices pre-computados
const allocationsByEmployee = useMemo(() => {
  const index = new Map<string, Allocation[]>();
  allocations.forEach(a => {
    if (!index.has(a.employeeId)) index.set(a.employeeId, []);
    index.get(a.employeeId)!.push(a);
  });
  return index;
}, [allocations]);
```

### 3. Componentes Gigantes Sin División (`AllocationSheet.tsx`)

**Archivo:** `src/components/planner/AllocationSheet.tsx` (135KB, 1200+ líneas)

**Problema:** Componente monolítico con:
- 25+ estados locales (líneas 88-228)
- 7+ useEffects (líneas 94, 146, 244, 303, 308, 314)
- Múltiples funciones inline que se recrean en cada render
- JSX masivo sin memoización

**Impacto:** Cualquier cambio de estado causa re-render del componente completo.

**Solución recomendada:**
```typescript
// Extraer sub-componentes memoizados:
const ProjectHeader = React.memo(({ project, budgetStatus, ... }) => ...);
const TaskRow = React.memo(({ allocation, onUpdate, ... }) => ...);
const WeekColumn = React.memo(({ week, tasks, ... }) => ...);
```

---

## Problemas de Alto Impacto

### 4. React Query Sin Configuración de Cache

**Archivo:** `src/App.tsx:74`

**Problema:**
```typescript
const queryClient = new QueryClient(); // Sin configuración
```

**Impacto:** Sin `staleTime` ni `cacheTime`, React Query refetch automáticamente en cada mount.

**Solución recomendada:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 30 * 60 * 1000, // 30 minutos
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

### 5. Duplicación de Lógica de Carga de Datos

**Archivos afectados:**
- `src/components/planner/AllocationSheet.tsx:146-187`
- `src/components/planner/PlannerGrid.tsx:60-101`

**Problema:** Lógica idéntica de `loadDataForMonth` duplicada en múltiples componentes con refs locales `loadedMonthsRef`.

**Solución recomendada:** Centralizar en un custom hook:
```typescript
function useMonthData(month: Date) {
  // Lógica centralizada con cache global
}
```

### 6. Llamadas Directas a Supabase en Componentes

**Archivo:** `src/components/employee/GlobalPlanningInconsistencies.tsx:62-67`

**Problema:**
```typescript
useEffect(() => {
  const { data } = await supabase
    .from('deadlines')
    .select('*')
    .eq('month', monthKey);
  // ...
}, [monthKey]);
```

**Impacto:** Bypass del sistema de cache, llamadas redundantes a la BD.

**Estadísticas:** 54 llamadas `supabase.from()` distribuidas en 4 archivos.

---

## Problemas de Medio Impacto

### 7. Falta de React.memo en Componentes de Lista

**Problema:** Solo 23 archivos usan `React.memo` o `useMemo` de los ~50 componentes.

**Componentes que deberían usar memo:**
- `EmployeeRow` en PlannerGrid
- Items de lista en AllocationSheet
- Cards en dashboards

### 8. useCallback con Dependencias Innecesarias

**Archivo:** `src/hooks/useAllocationSheet.ts:113-182`

**Problema:**
```typescript
const getProjectBudgetStatus = useMemo(() => {
  return (projectId: string): ProjectBudgetStatus => {
    // ... función que depende de projects, allocations, employees
  };
}, [projects, allocations, employees, viewDate]);
```

**Impacto:** Función se recrea cuando cualquiera de las 4 dependencias cambia.

### 9. Inline Functions en Event Handlers

**Archivo:** `src/components/planner/AllocationSheet.tsx`

**Problema:** Funciones creadas inline en cada render:
```tsx
onClick={() => setAutoExpand(!autoExpand)}
onChange={(e) => setSearchTerm(e.target.value)}
```

**Solución:** Extraer a funciones estables con useCallback.

### 10. WeeklyReportDialog Computaciones Pesadas

**Archivo:** `src/components/employee/WeeklyReportDialog.tsx:66-133`

**Problema:** El `useMemo` de `openTasks` y `transferredTasks` hace múltiples iteraciones sobre allocations con lógica compleja de filtrado.

---

## Métricas de la Auditoría

| Métrica | Valor | Estado |
|---------|-------|--------|
| Líneas en AppContext.tsx | 1050+ | Crítico |
| Líneas en AllocationSheet.tsx | 1200+ | Crítico |
| Operaciones de array en AppContext | 60+ | Alto |
| Componentes con React.memo | 23/~50 | Medio |
| Llamadas a Supabase directas | 54 | Alto |
| Estados en AllocationSheet | 25+ | Alto |

---

## Plan de Acción Recomendado

### Fase 1: Quick Wins (1-2 días)
1. Configurar QueryClient con staleTime y cacheTime
2. Agregar React.memo a componentes de lista
3. Extraer funciones inline a useCallback

### Fase 2: Refactorización Media (1 semana)
1. Dividir AppContext en contextos más pequeños
2. Crear índices pre-computados para lookups frecuentes
3. Centralizar lógica de carga de datos en hooks

### Fase 3: Refactorización Mayor (2-3 semanas)
1. Dividir AllocationSheet en componentes más pequeños
2. Dividir WeeklyReportDialog
3. Migrar llamadas Supabase directas al sistema de cache

---

## Herramientas Recomendadas para Monitoreo

1. **React DevTools Profiler** - Identificar componentes lentos
2. **why-did-you-render** - Detectar re-renders innecesarios
3. **Chrome Performance Tab** - Medir tiempo de renderizado

---

*Auditoría realizada: 2026-01-01*
