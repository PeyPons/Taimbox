# Análisis del Sistema de Marketing - Problemas y Propuestas

## 📋 Problemas Identificados

### 1. Gastos Estimados No Se Reflejan en la Tabla Global

**Problema:**
- Los gastos estimados no afectan el cálculo del campo "Disponible"
- Solo los gastos finales (reales) se reflejan en los totales globales
- Esto dificulta la planificación y comprensión del presupuesto proyectado

**Ubicación del código:**
- `src/components/marketing/MarketingMatrix.tsx` línea 235: `remainder: budgetBase - totalSpent`
- `src/contexts/MarketingContext.tsx` línea 768-772: `getRealSpentForPlan` excluye estimados

**Impacto:**
- No se puede ver el impacto de los gastos estimados en el presupuesto disponible
- La planificación se vuelve más difícil

---

### 2. Nombres de Categorías Truncados

**Problema:**
- La columna de categorías tiene un ancho fijo de 200px
- Los nombres largos se cortan con `truncate`
- Ejemplos: "Marketing4E...", "Prorrateo So...", "Branding - Of..."

**Ubicación del código:**
- `src/components/marketing/MarketingMatrix.tsx` línea 381: `min-w-[200px] w-[200px]`
- Línea 404: `truncate` en el span del nombre

**Impacto:**
- Dificulta identificar categorías
- Reduce la usabilidad

---

### 3. Vista Tipo Excel Enorme

**Problema:**
- La vista mensual muestra todas las columnas (12 meses × 2 columnas = 24 columnas) en una sola fila
- Requiere scroll horizontal extenso
- Dificulta la comprensión general del presupuesto
- A medida que se añaden más categorías, se vuelve más difícil de usar

**Ubicación del código:**
- `src/components/marketing/MarketingMatrix.tsx` líneas 698-782: Vista mensual

**Impacto:**
- Mala experiencia de usuario
- Dificulta la comprensión del presupuesto global
- No escala bien con más datos

---

### 4. Inconsistencia en el Cálculo de "Disponible"

**Problema:**
- El cálculo de `budgetBase` es inconsistente:
  - Si existe `assignedBudget` → usa `assignedBudget`
  - Si no existe → usa `totalEstimated`
- Esto causa comportamientos diferentes según si hay presupuesto asignado

**Ubicación del código:**
- `src/components/marketing/MarketingMatrix.tsx` línea 228: 
  ```typescript
  const budgetBase = (category.assignedBudget && category.assignedBudget > 0) 
    ? category.assignedBudget 
    : totalEstimated;
  ```

**Impacto:**
- Comportamiento confuso para el usuario
- Dificulta entender qué representa "Disponible"

---

### 5. Trigger de Base de Datos Actualiza `real_spent` para Gastos Estimados

**Problema:**
- El trigger en Supabase actualiza `real_spent` para TODOS los gastos (incluidos estimados)
- El frontend filtra los estimados con `getRealSpentForPlan`
- Puede haber inconsistencias entre BD y UI

**Ubicación del código:**
- `supabase/migrations/create_marketing_ledger.sql` líneas 346-389: Trigger `update_monthly_plan_spent`
- No verifica `is_estimated` antes de actualizar `real_spent`

**Impacto:**
- Posibles inconsistencias entre base de datos y frontend
- El campo `real_spent` en BD puede incluir gastos estimados

---

## ❓ Preguntas para Clarificar Requisitos

### 1. Gastos Estimados
**¿Cómo deberían reflejarse los gastos estimados en la tabla global?**

- **Opción A:** Mostrar dos columnas: "Disponible Real" y "Disponible Proyectado" (incluyendo estimados)
- **Opción B:** Mostrar estimados en una columna separada "Proyectado" sin afectar "Disponible"
- **Opción C:** Incluir estimados en el cálculo de "Disponible" pero con indicador visual (ej: color diferente)

### 2. Presupuesto Anual vs Trimestral
**¿Cómo funciona el flujo de asignación de presupuesto?**

- ¿Se asigna primero el presupuesto anual a categorías y luego se desglosa en trimestres/meses?
- ¿O se trabaja directamente mes a mes y se agregan trimestres?
- ¿Los ajustes trimestrales afectan el presupuesto anual o son independientes?

### 3. Vista Alternativa
**¿Qué tipo de vista preferirías para mejorar la comprensión?**

- **Opción A:** Dashboard con tarjetas por trimestre (similar a la vista trimestral actual pero mejorada)
- **Opción B:** Tabla más compacta con agrupación por trimestres (expandible)
- **Opción C:** Mantener tabla pero con mejoras UX (tooltips, modales, filtros, búsqueda)
- **Opción D:** Vista híbrida: resumen por trimestre + detalle mensual en modal/panel lateral

### 4. Ancho de Nombres de Categorías
**¿Cómo prefieres manejar los nombres largos?**

- **Opción A:** Aumentar el ancho de la columna (ej: 250-300px)
- **Opción B:** Tooltips al hover para ver nombre completo
- **Opción C:** Permitir expandir/colapsar la columna
- **Opción D:** Mostrar nombre completo en múltiples líneas (wrap)

### 5. Campo "Disponible"
**¿Qué debería mostrar exactamente el campo "Disponible"?**

- ¿Presupuesto asignado - gastos reales?
- ¿Presupuesto asignado - (gastos reales + estimados)?
- ¿Presupuesto asignado - gastos reales, pero con indicador de estimados?
- ¿O algo diferente?

---

## 💡 Propuestas de Mejora

### Propuesta 1: Mejorar Visualización de Gastos Estimados

**Cambios:**
1. Agregar columna "Proyectado" que muestre gastos estimados
2. Mostrar "Disponible Real" y "Disponible Proyectado" (o combinado con indicador)
3. Incluir tooltip explicativo

**Beneficios:**
- Mejor planificación
- Claridad sobre impacto de estimados
- Transparencia en el presupuesto

---

### Propuesta 2: Mejorar Espacio para Nombres

**Cambios:**
1. Aumentar ancho de columna a 250-300px
2. Agregar tooltip con nombre completo al hover
3. Permitir ajuste manual del ancho (opcional)

**Beneficios:**
- Mejor legibilidad
- No se pierde información
- Mejor UX

---

### Propuesta 3: Rediseñar Vista de Control

**Opción A: Vista por Trimestres (Recomendada)**
- Agrupar meses por trimestres
- Mostrar resumen trimestral expandible
- Al expandir, mostrar meses individuales
- Reducir scroll horizontal

**Opción B: Vista Dashboard**
- Tarjetas por trimestre con resumen
- Click para ver detalle mensual
- Filtros y búsqueda
- Gráficos de tendencias

**Opción C: Vista Híbrida**
- Panel izquierdo: resumen por trimestre
- Panel derecho: detalle del trimestre seleccionado
- Navegación más intuitiva

**Beneficios:**
- Mejor comprensión del presupuesto
- Menos scroll
- Escalable con más datos
- Mejor UX general

---

### Propuesta 4: Corregir Cálculo de "Disponible"

**Cambios:**
1. Definir lógica clara y consistente
2. Documentar qué representa "Disponible"
3. Aplicar misma lógica en todos los casos

**Lógica propuesta:**
- Si hay `assignedBudget`: `Disponible = assignedBudget - totalSpent`
- Si no hay `assignedBudget`: `Disponible = totalEstimated - totalSpent`
- Agregar columna "Sin Asignar" si `assignedBudget > totalEstimated`

---

### Propuesta 5: Corregir Trigger de Base de Datos

**Cambios:**
1. Modificar trigger para verificar `is_estimated`
2. Solo actualizar `real_spent` si `is_estimated = false`
3. Mantener consistencia entre BD y frontend

**Código propuesto:**
```sql
-- En el trigger, verificar is_estimated antes de actualizar
IF NEW.is_estimated = false THEN
  -- Actualizar real_spent
END IF;
```

---

## 🎯 Priorización Sugerida

1. **Alta Prioridad:**
   - Corregir trigger de BD (consistencia)
   - Mejorar espacio para nombres
   - Clarificar cálculo de "Disponible"

2. **Media Prioridad:**
   - Mejorar visualización de gastos estimados
   - Rediseñar vista de control

3. **Baja Prioridad:**
   - Mejoras adicionales de UX
   - Gráficos y visualizaciones avanzadas

---

## 📝 Próximos Pasos

1. Responder preguntas de clarificación
2. Priorizar mejoras según necesidades
3. Implementar mejoras seleccionadas
4. Probar y validar cambios
5. Documentar cambios realizados
