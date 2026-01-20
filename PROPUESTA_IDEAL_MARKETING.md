# Propuesta Ideal - Sistema de Marketing

## 🎯 Solución Propuesta para Mejor Seguimiento

### Problema Principal
- Mucha gente tocando el presupuesto
- Necesidad de ver estimados a mitad de mes y finales a final de mes
- Presupuesto anual → trimestral → mensual
- Ajustes afectan todos los niveles

### Solución: Vista Híbrida + Sistema de Estados

## 📊 Vista Híbrida Propuesta

### 1. Panel Principal: Vista por Trimestres (Resumen)
- **4 tarjetas grandes** (Q1, Q2, Q3, Q4)
- Cada tarjeta muestra:
  - Presupuesto asignado trimestral
  - Total estimado (suma de meses)
  - Total invertido (real)
  - Total proyectado (real + estimados)
  - Disponible Real y Disponible Proyectado
  - Indicador visual de estado (verde/amarillo/rojo)

### 2. Panel de Detalle: Meses Expandibles
- Al hacer click en un trimestre, se expande mostrando los 3 meses
- Cada mes muestra:
  - Columnas: EST | INV | PROY (Estimado | Invertido Real | Proyectado)
  - Por categoría/subcategoría
  - Indicadores de estado del mes

### 3. Vista de Tabla Compacta (Alternativa)
- Tabla con agrupación por trimestres
- Filas expandibles por trimestre
- Columnas: Categoría | Pres. Asig. | Total Est. | Total Inv. | Total Proy. | Disp. Real | Disp. Proy.
- Nombres completos visibles (sin truncar)

## 🔄 Sistema de Estados del Mes

### Estados Propuestos:
1. **Planificación** (inicio de mes): Solo estimados
2. **En Curso** (mitad de mes): Estimados + algunos reales
3. **Cerrado** (final de mes): Solo reales, estimados convertidos

### Indicadores Visuales:
- 🟢 Verde: Mes cerrado, datos finales
- 🟡 Amarillo: Mes en curso, hay estimados
- 🔵 Azul: Mes futuro, solo planificación

## 📈 Campos Propuestos

### Columnas en la Vista:
1. **Pres. Asig.** - Presupuesto asignado anual a la categoría
2. **Total Est.** - Suma de presupuestos estimados mensuales
3. **Total Inv.** - Suma de gastos reales (finales)
4. **Total Proy.** - Total Inv. + gastos estimados pendientes
5. **Disp. Real** - Pres. Asig. - Total Inv. (o Total Est. - Total Inv. si no hay Pres. Asig.)
6. **Disp. Proy.** - Pres. Asig. - Total Proy. (incluye estimados)

### Lógica de "Disponible":
- **Disponible Real**: Lo que realmente queda sin contar estimados
- **Disponible Proyectado**: Lo que quedará si se confirman los estimados
- Ambos se muestran siempre para claridad

## 👥 Gestión Multi-Usuario

### Características Propuestas:
1. **Historial de Cambios**: Ver quién hizo qué y cuándo
2. **Notificaciones**: Alertas cuando alguien modifica presupuesto
3. **Bloqueos Temporales**: Evitar conflictos al editar
4. **Comentarios**: Notas en categorías/meses para comunicación
5. **Estados de Revisión**: Marcar meses como "Revisado" o "Pendiente"

## 🎨 Mejoras de UX

### Nombres de Categorías:
- Ancho mínimo: 300px (expandible)
- Tooltip con nombre completo al hover
- Opción de ver ruta completa (Categoría > Subcategoría)

### Navegación:
- Filtros por trimestre
- Búsqueda de categorías
- Vista rápida de resumen anual
- Exportar a Excel (mantener compatibilidad)

## 🔧 Cambios Técnicos Necesarios

### 1. Base de Datos:
- Corregir trigger para no incluir estimados en `real_spent`
- Agregar tabla de auditoría (opcional pero recomendado)
- Agregar campo `month_status` a `marketing_monthly_plans`

### 2. Frontend:
- Nueva vista híbrida (trimestres + meses)
- Cálculos mejorados para Disponible Real/Proyectado
- Mejoras en visualización de nombres
- Sistema de estados visuales

### 3. Cálculos:
```typescript
// Disponible Real
disponibleReal = (assignedBudget || totalEstimated) - totalSpent

// Disponible Proyectado  
disponibleProyectado = (assignedBudget || totalEstimated) - (totalSpent + totalEstimatedExpenses)

// Total Proyectado
totalProyectado = totalSpent + totalEstimatedExpenses
```

## 📅 Flujo de Trabajo Propuesto

### Inicio de Mes:
1. Planificar gastos estimados para el mes
2. Marcar mes como "Planificación"
3. Ver impacto en Disponible Proyectado

### Mitad de Mes:
1. Actualizar con gastos reales hasta la fecha
2. Añadir estimados para el mes siguiente
3. Marcar mes como "En Curso"
4. Ver Disponible Real vs Proyectado

### Final de Mes:
1. Convertir estimados a reales (o eliminarlos)
2. Cerrar mes
3. Marcar como "Cerrado"
4. Disponible Real = Disponible Proyectado

## ✅ Beneficios

1. **Claridad**: Se ve claramente qué es real vs estimado
2. **Planificación**: Fácil ver impacto de estimados
3. **Trazabilidad**: Historial de cambios
4. **Escalabilidad**: Vista híbrida maneja muchos datos
5. **Colaboración**: Múltiples usuarios pueden trabajar sin conflictos
6. **Comprensión**: Vista trimestral da contexto global
