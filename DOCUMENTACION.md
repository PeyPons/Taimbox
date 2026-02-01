# Documentación Técnica Detallada - Timeboxing

Esta documentación ofrece una visión profunda y técnica de la plataforma Timeboxing, diseñada para la gestión de recursos, presupuestos de marketing y planificación de agencias.

---

## 1. Arquitectura General y Tecnologías

El sistema sigue una arquitectura de **Single Page Application (SPA)** con un backend proporcionado por **Supabase** (BaaS) y trabajadores externos para integraciones de publicidad.

- **Frontend**: React 18 con Vite y TypeScript.
- **Backend / DB**: Supabase (PostgreSQL + Auth + Realtime).
- **Estilos**: Tailwind CSS con componentes de Shadcn UI.
- **Estado Global**: React Context API con persistencia reactiva.
- **Lógica de Datos**: TanStack Query (React Query) para sincronización de servidor.
- **Workers**: Scripts independientes en Node.js para sincronización de APIs externas (Google/Meta Ads).

---

## 2. Glosario de Entidades y Modelos de Datos

A continuación se detallan las entidades principales del sistema, sus variables clave y su propósito.

### 2.1. Agencia (`Agency`)
El núcleo del modelo **multi-tenant**. Cada usuario pertenece a una o más agencias.
- `id`: UUID único.
- `settings`: Objeto JSON que define la configuración de la agencia.
    - `roles`: Definición de permisos RBAC específicos para la agencia.
    - `modules`: Módulos habilitados (Marketing, Ads, etc.).
    - `branding`: Colores y logotipos personalizados.

### 2.2. Empleado (`Employee`)
Representa a los miembros del equipo.
- `role`: Nombre del rol que determina los permisos.
- `defaultWeeklyCapacity`: Horas base de trabajo por semana (ej. 40).
- `workSchedule`: Objeto que define las horas por día (`monday`: 8, `friday`: 6, etc.).
- `user_id`: Enlace con `auth.users` de Supabase para autenticación.

### 2.3. Proyecto (`Project`)
Contenedores de trabajo facturable o interno.
- `budgetHours`: Horas máximas contratadas por el cliente al mes.
- `minimumHours`: Suelo de horas que el equipo debe cumplir.
- `monthlyFee`: Fee recurrente en euros para cálculos de rentabilidad.
- `status`: `active`, `paused` o `completed`.

### 2.4. Asignación (`Allocation`)
La unidad fundamental de planificación semanal.
- `hoursAssigned`: Horas planificadas por el manager.
- `hoursActual`: Horas reportadas por el empleado.
- `hoursComputed`: Horas validadas o calculadas (usadas en métricas finales).
- `weekStartDate`: Fecha (Lunes) o primer día laborable del mes (en semanas partidas).
- `status`: `planned`, `completed`, `pending_transfer`.

---

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

### 3.3. Métricas de Rentabilidad (`useProjectMetrics.ts`)
Calcula el rendimiento financiero en tiempo real.
- `progressOperational`: `(Horas Computadas / Presupuesto de Horas) * 100`.
- `hoursValue`: `Horas Computadas * (Fee Mensual / Horas Presupuestadas)`. Representa el valor monetario del trabajo realizado.
- `isPacing`: Indica si el ritmo de trabajo actual permite completar el presupuesto al final del mes.

---

## 4. Gestión del Estado Global (Contextos)

### 4.1. AppContext: El Motor de Datos
Gestiona la carga de la base de datos principal (`employees`, `projects`, `allocations`).
- **Patrón Upsert**: En lugar de recargar todo, utiliza funciones que mezclan los datos nuevos con los existentes, manteniendo la integridad de la UI.
- **`loadedMonthsRef`**: Un Set que registra qué meses ya están en memoria para evitar llamadas redundantes a la base de datos.

### 4.2. MarketingContext: Finanzas de Marketing
Maneja una estructura jerárquica de presupuestos.
- **Árbol de Categorías**: Permite agrupar gastos (ej. "Social Media" -> "Instagram Ads").
- **Proyecciones Inteligentes**: 
    - Si hay gastos reales (`realSpent`), se usan esos.
    - Si no, se usa el último "Gasto Estimado" (`isEstimated: true`).
- **Trasvases (`Movements`)**: Registra el movimiento de dinero entre planes mensuales para auditoría.

---

## 5. Integraciones y Automatización (Workers)

El sistema sincroniza datos de Google Ads y Meta Ads mediante procesos externos.

### 5.1. Arquitectura de los Workers (`ads-worker.js` / `meta-worker.js`)
- Corren de forma independiente en un entorno Node.js.
- Utilizan `generic-pool` para manejar conexiones a la base de datos de manera eficiente.
- **Unidad de Medida**: Google Ads entrega el coste en `micros` (millonésimas de moneda), el worker lo convierte dividiendo por `1,000,000` antes de guardarlo.
- **Sincronización**: Utilizan `Supabase Realtime` para reaccionar a cambios en la tabla de configuración y ejecutar sincronizaciones bajo demanda.

---

## 6. Glosario de Variables y Términos Técnicos

| Término | Ubicación Común | Significado |
|:--- |:--- |:--- |
| `RLS` | Supabase / DB | Row Level Security. Filtra datos para que cada agencia solo vea los suyos. |
| `RBAC` | `usePermissions.ts` | Role-Based Access Control. Control de acceso por nombre de rol configurado. |
| `micros` | `ads-worker.js` | Formato monetario de Google (1€ = 1,000,000 micros). |
| `slug` | `agencies` | Nombre único en la URL para identificar una agencia. |
| `weekStartsOn: 1` | `dateUtils.ts` | Configura el Lunes como primer día de la semana. |
| `budgetAllocated` | `MarketingContext` | Dinero asignado a un concepto para un mes específico. |
| `hoursComputed` | `AppContext` | Horas finales validadas que impactan en la rentabilidad. |

---

## 7. Mantenimiento y Extensión

- **Añadir una nueva tabla**: 
    1. Crear en Supabase.
    2. Habilitar RLS con `agency_id`.
    3. Actualizar `src/types/index.ts`.
    4. Añadir lógica de carga en `AppContext.tsx`.
- **Modificar permisos**:
    - Editar `src/hooks/usePermissions.ts` y añadir la nueva clave de permiso al objeto `RESTRICTED_PERMISSIONS`.
- **Actualizar Workers**:
    - Los workers consumen tokens de `ad_accounts_config`. Si falla el refresco de token, el worker registrará el error en `ads_sync_logs`.
