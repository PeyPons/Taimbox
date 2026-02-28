# Decisiones estratégicas: Suscripciones y planes (Producto)

Documento que recoge las decisiones de producto para el sistema de suscripciones Stripe en Taimbox. Complementa el plan técnico (sistema de suscripciones Stripe) y debe mantenerse alineado con él.

**Posicionamiento:** Taimbox es una **herramienta premium**. Los planes y la UX reflejan ese posicionamiento.

---

## 1. Límite de "30 días de histórico" (solo Plan Starter)

**Regla:** El Planner **no se capa**. El límite de 30 días aplica **solo a la capa de Inteligencia/Reportes**.

- **Pueden:** Ver tareas y planificación de hace 3 meses (Planner, Deadlines, listados de asignaciones).
- **No pueden (Starter):** Auditar quién llegó tarde hace 3 meses ni ver cuánto costó (Matriz de Fiabilidad, Tiempos, Rentabilidad en esos meses).

**Implementación técnica:** Filtrar por `month >= (hoy - 30 días)` únicamente en:

- Vistas/reportes de **Matriz de Fiabilidad** (precisión de planificación, histórico).
- Vistas de **Tiempos** (reportes por mes antiguo).
- **Rentabilidad / Salud Financiera** (FinancialHealthPage): solo datos de los últimos 30 días para Starter.
- Cualquier export o API que devuelva métricas de coherencia/rentabilidad por mes.

El Planner, Deadlines, Weekly (si en Pro) y listados de tareas/proyectos **no** aplican este filtro.

---

## 2. Comportamiento post-trial (fin de los 14 días)

**Regla:** **Downgrade a Starter con Soft Lock.**

- Al acabar el trial (o al cancelar suscripción), la agencia pasa a plan **Starter**.
- Si la agencia tiene más de 5 usuarios (ej. 30), **no se borra a nadie**.
- La app entra en **modo Solo Lectura** con un **banner rojo prominente** con el texto:
  - *"Tu agencia excede los límites del Plan Starter. Pasa a Pro o Business para volver a planificar."*
- Hasta que pasen a Pro o Business: no se permiten ediciones (planificador, deadlines, altas de empleados, etc.); solo lectura de datos existentes.

**Implementación técnica:**

- Webhook o job que, al expirar trial o cancelar, ponga `plan_id = starter` y `subscription_status` correspondiente.
- Hook o contexto que calcule: si `currentEmployees > planLimit` (ej. 30 > 5), activar **soft lock**: `isOverLimit = true`.
- Cuando `isOverLimit === true`: mostrar banner global (ej. debajo del header o en layout), y en middlewares/hooks que protegen escritura (crear empleado, editar asignación, etc.) bloquear acción y mostrar CTA a "Plan y facturación".

---

## 3. Planes y límites (recordatorio)

| Plan       | Usuarios | Histórico Inteligencia/Reportes |
|-----------|----------|-----------------------------------|
| Starter   | Hasta 5  | Solo últimos 30 días             |
| Pro       | Hasta 20 | Ilimitado                         |
| Business  | Hasta 50 | Ilimitado                         |

Starter: Planificador + Deadlines (gancho). Pro: Weekly, Matriz de Fiabilidad, EHR básico. Business: Radar de Hemorragias, Ads, API, OKRs.

---

**Plan de implementación completo:** [PLAN-SUSCRIPCIONES-IMPLEMENTACION-COMPLETO.md](./PLAN-SUSCRIPCIONES-IMPLEMENTACION-COMPLETO.md) (BD, backend, app, landings, precios, registro, límites y orden de ejecución).

*Documento creado a partir de la visión estratégica de Producto. Actualizar README/DOCUMENTACION al implementar suscripciones.*
