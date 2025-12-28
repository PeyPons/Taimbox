# 📅 Timeboxing Manager

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-B73C9D?style=for-the-badge&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=3ECF8E)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-8E75B2?style=for-the-badge&logo=google-bard&logoColor=white)

Sistema integral de gestión de recursos y planificación para agencias digitales. Combina timeboxing mensual, control de horas, gestión de equipos, reportes de rendimiento, sistema de cierre semanal, gestión de deadlines e integración con plataformas de publicidad (Google Ads, Meta Ads).

---

## 📖 Índice

- [Visión General](#-visión-general)
- [Características Principales](#-características-principales)
- [Manual de Usuario Completo](#-manual-de-usuario-completo)
  - [1. Dashboard Personal (Mi Espacio)](#1-dashboard-personal-mi-espacio)
  - [2. Sistema Weekly - Cierre Semanal](#2-sistema-weekly---cierre-semanal)
  - [3. Planificador Mensual](#3-planificador-mensual)
  - [4. Sistema de Deadlines](#4-sistema-de-deadlines)
  - [5. Gestión de Proyectos](#5-gestión-de-proyectos)
  - [6. Gestión de Equipo](#6-gestión-de-equipo)
  - [7. Reportes y Métricas](#7-reportes-y-métricas)
  - [8. Copiloto IA (Minguito)](#8-copiloto-ia-minguito)
  - [9. Módulo PPC](#9-módulo-ppc-google-ads--meta-ads)
  - [10. Weekly Forecast (Previsión Semanal)](#10-weekly-forecast-previsión-semanal)
- [Documentación Técnica](#-documentación-técnica)
  - [Stack Tecnológico](#stack-tecnológico)
  - [Arquitectura del Proyecto](#arquitectura-del-proyecto)
  - [Base de Datos Completa](#base-de-datos-completa)
  - [Sistema de Permisos](#sistema-de-permisos)
  - [Autenticación y Seguridad](#autenticación-y-seguridad)
  - [Instalación y Despliegue](#instalación-y-despliegue)
  - [Variables de Entorno](#variables-de-entorno)
  - [Workers de Sincronización](#workers-de-sincronización)
  - [Edge Functions](#edge-functions)
  - [Lógica de Fechas y Capacidad](#lógica-de-fechas-y-capacidad)
- [Guías de Desarrollo](#-guías-de-desarrollo)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Visión General

**Timeboxing Manager** es una aplicación web completa diseñada para agencias digitales que necesitan:

- **Planificación mensual precisa** con control estricto de horas por mes
- **Cierre semanal** para detectar desviaciones y redistribuir trabajo
- **Gestión de deadlines** con asignaciones por proyecto y empleado
- **Control de presupuestos** por proyecto con alertas visuales
- **Gestión de equipos** con horarios personalizados, ausencias y eventos
- **Reportes analíticos** con métricas de rendimiento y fiabilidad
- **Integración con IA** para análisis inteligente y recomendaciones
- **Sincronización automática** con Google Ads y Meta Ads
- **Sistema de permisos granular** por usuario

### Principios de Diseño

1. **Separación Mensual Estricta**: Las semanas que cruzan meses se tratan como semanas separadas para garantizar reportes mensuales exactos
2. **Carga Perezosa (Lazy Loading)**: Los datos se cargan bajo demanda al navegar entre meses
3. **Permisos Granulares**: Control de acceso por usuario, no por rol
4. **Trazabilidad Completa**: Rastreo de transferencias y distribuciones de tareas
5. **UX Intuitiva**: Tours interactivos, tooltips informativos, feedback visual constante

---

## ✨ Características Principales

### 🏠 Dashboard Personal
- Vista mensual de carga de trabajo
- Planificación rápida de múltiples tareas
- Gestión de tareas internas (reuniones, formaciones)
- Objetivos profesionales (OKRs)
- Exportación al CRM
- Tour de bienvenida interactivo

### 📊 Sistema Weekly - Cierre Semanal
- **Para Empleados**: Revisión de tareas abiertas de la semana anterior y tareas transferidas por compañeros
- **Acciones disponibles**:
  - Mover a semana futura propia
  - Transferir a otro compañero (con validación de capacidad)
  - Distribuir en múltiples tareas
  - Mantener la misma tarea
- **Validaciones estrictas**: Horas exactas, capacidad, presupuesto
- **Notas obligatorias** para justificar transferencias

### 📋 Planificador Mensual
- Vista de equipo completa semana a semana
- Carga masiva de tareas
- Edición inline de nombres
- Dependencias entre tareas
- Control de horas: Estimadas, Reales, Computadas
- Alertas visuales de desvíos
- Vista semanal y mensual
- Tour interactivo del planificador

### 🎯 Sistema de Deadlines
- Asignación de horas por proyecto y empleado
- Asignaciones globales (afectan a todos o a empleados específicos)
- Filtros avanzados (SEO/PPC, empleado, cliente)
- Edición inline con auto-guardado
- Sistema de bloqueos para edición concurrente
- Realtime updates
- Tour interactivo de deadlines

### 📁 Gestión de Proyectos
- Filtros inteligentes por estado
- OKRs por proyecto
- Métricas en tiempo real
- Estados de salud visuales
- Ocultar/mostrar proyectos

### 👥 Gestión de Equipo
- Perfiles completos de empleados
- Horarios personalizados por día
- Gestión de ausencias (vacaciones, bajas)
- Eventos de equipo (festivos)
- Objetivos profesionales individuales
- Permisos granulares por usuario
- Creación de cuentas de acceso

### 📈 Reportes y Métricas
- KPIs del mes (capacidad, planificado, real, computado)
- Tasa de ocupación y rentabilidad
- Índice de fiabilidad histórica
- Desglose por equipo y proyectos
- Coherencia de planificación (deadlines vs planificador)

### 🤖 Copiloto IA (Minguito)
- Análisis inteligente con contexto dinámico
- Detección automática de problemas
- Multi-modelo con fallback
- Preguntas sugeridas
- Historial de conversaciones

### 📢 Módulo PPC
- Dashboard unificado Google Ads + Meta Ads
- Sincronización automática diaria
- Segmentación virtual de campañas
- Generador de informes con IA
- Configuración de cuentas

### 🔮 Weekly Forecast (Previsión Semanal)
- **Semáforo de Proyectos**: Estado mensual vs horas contratadas
- **Transferencias de Horas**: Historial completo de transferencias entre compañeros
- **Redistribución Rápida**: Herramienta para managers para redistribuir horas
- Filtros avanzados (proyecto, tipo, estado)
- Agrupación por proyecto

---

## 📖 Manual de Usuario Completo

### 1. Dashboard Personal (Mi Espacio)

**Ruta**: `/` (página de inicio después del login)

#### Funcionalidades Principales

##### Vista Mensual de Carga
- Calendario visual con tareas organizadas por semana
- Cada semana muestra: horas planificadas, horas reales, horas computadas
- Indicadores de estado: verde (OK), amarillo (ajuste), rojo (sobrecarga)
- Clic en semana para ver detalle en el planificador

##### Planificación Rápida
- Botón **"Añadir tareas"** en el header
- Dialog que permite añadir múltiples tareas simultáneamente
- Para cada tarea:
  - Selección de proyecto (con búsqueda)
  - Nombre de la tarea
  - Horas asignadas
  - Semana de destino
  - Descripción opcional
- Validaciones automáticas:
  - Presupuesto del proyecto
  - Capacidad del empleado
  - Alertas visuales si se excede

##### Botón Weekly
- **Siempre visible** para todos los empleados
- Indicador visual cuando hay tareas pendientes:
  - **Normal**: Badge azul con icono de check
  - **Pendientes**: Badge ámbar con animación de pulso y icono de alerta
- Al hacer clic, abre el dialog de Weekly (ver sección 2)

##### Gestión Interna
- Botón **"Gestión interna"** para registrar:
  - Reuniones
  - Formaciones
  - Tareas administrativas
  - Deadlines internos
- Se registra automáticamente como completado
- No cuenta para presupuestos de clientes

##### Objetivos (OKRs)
- Visualización de objetivos profesionales
- Key Results configurables (booleanos o numéricos)
- Progreso visual
- Fechas de inicio y vencimiento
- Enlaces a recursos de formación

##### Ausencias
- Solicitud de vacaciones, bajas médicas, permisos
- La capacidad se ajusta automáticamente
- Visualización en el planificador

##### Exportar al CRM
- Genera archivo CSV con formato específico
- **Solo exporta tareas NO completadas** del mes actual
- Formato: `"Nombre tarea",user_id,project,external_id,horas`
- Requiere `crmUserId` configurado en el perfil

##### Tour de Bienvenida
- Tutorial interactivo que guía por todas las funciones
- Se muestra automáticamente la primera vez
- Puede reiniciarse desde ajustes
- Incluye paso del Weekly

---

### 2. Sistema Weekly - Cierre Semanal

**Acceso**: Botón "Weekly" en el Dashboard Personal (siempre visible)

#### Propósito
Revisar y gestionar tareas que quedaron abiertas de la semana anterior y tareas transferidas por compañeros.

#### Tareas que Aparecen

##### Tareas Abiertas (Open Tasks)
- Tareas de semanas pasadas o la semana actual (hasta el viernes)
- Que no están completadas (`status !== 'completed'`)
- Que no han sido procesadas previamente
- Excluye:
  - Tareas con feedback de "mantener"
  - Tareas ya distribuidas
  - Tareas creadas desde distribuciones de transferencias

##### Tareas Transferidas (Transferred Tasks)
- Tareas recibidas de otros compañeros
- Identificadas por:
  - Campo `transferredFromAllocationId` (preferido)
  - O formato en `taskName`: `(transferida de [nombre])`
- Que no han sido procesadas

#### Acciones Disponibles

##### 1. Mover a Mi Semana Siguiente
- **Descripción**: Mueve la tarea a una semana futura propia
- **Validaciones**:
  - Capacidad disponible en la semana seleccionada
  - Panel de disponibilidad muestra horas libres/ocupadas
- **Notas**: Opcionales
- **Resultado**: La tarea se mueve a la semana seleccionada, se crea feedback

##### 2. Transferir a Otro Compañero
- **Descripción**: Transfiere la tarea a otro empleado
- **Validaciones**:
  - Capacidad del compañero destino en la semana seleccionada
  - Panel muestra disponibilidad detallada del compañero
  - Alertas si excede capacidad
- **Notas**: **Obligatorias** (debe explicar por qué no llegó)
- **Resultado**: 
  - Se crea nueva tarea para el compañero con `transferredFromAllocationId` apuntando a la original
  - Se crea feedback de transferencia
  - La tarea original puede eliminarse o mantenerse según la acción

##### 3. Distribuir en Múltiples Tareas
- **Descripción**: Divide la tarea en varias subtareas
- **Proceso**:
  1. Seleccionar acción "Distribuir"
  2. Añadir filas de distribución (botón "+")
  3. Para cada fila: nombre, horas, semana
  4. Validar que la suma de horas = horas de la tarea original
- **Validaciones**:
  - Suma exacta de horas (tolerancia 0.01h)
  - Capacidad del empleado en cada semana
  - Presupuesto del proyecto
- **Notas**: Obligatorias
- **Resultado**:
  - Se crean nuevas tareas con `distributionSourceAllocationId` apuntando a la original
  - Si la tarea original era transferida, se propaga `transferredFromAllocationId`
  - Se crea feedback para cada nueva tarea
  - La tarea original se elimina

##### 4. Mantener la Misma Tarea
- **Descripción**: Mantiene la tarea tal cual está
- **Notas**: Opcionales
- **Resultado**: Se crea feedback de "mantener", la tarea no vuelve a aparecer

#### Validaciones Estrictas

El botón **"Enviar Reporte"** está deshabilitado hasta que:

1. ✅ Todas las horas distribuidas sumen exactamente las horas de la tarea original
2. ✅ No se exceda la capacidad del empleado en ninguna semana
3. ✅ No se exceda el presupuesto del proyecto
4. ✅ Si se transfiere a compañero: no exceda su capacidad
5. ✅ Si se transfiere o distribuye: notas obligatorias presentes

#### Interfaz

- Dialog grande (`max-w-4xl`, `max-h-[90vh]`)
- Contenido scrollable, footer fijo
- Panel de disponibilidad dinámico al seleccionar semana/empleado
- Indicadores de color:
  - 🔴 Rojo: Excede capacidad/presupuesto
  - 🟡 Amarillo: Cerca del límite
  - ⚪ Gris: OK

---

### 3. Planificador Mensual

**Ruta**: `/planner` (requiere permiso `can_access_planner`)

#### Vista General

Vista de equipo completa que muestra todas las asignaciones de tareas organizadas por semana y empleado.

#### Lógica Mensual Estricta

El sistema usa **"Cajas Mensuales"** para garantizar reportes exactos:

- **Semanas que cruzan meses**: Se muestran como dos semanas separadas
  - Ejemplo: Semana del 29 Ene - 4 Feb
    - En vista de Enero: muestra solo días 29-31 Ene
    - En vista de Febrero: muestra solo días 1-4 Feb
- **Storage Keys**: Fuerzan la asociación al mes visible
- **Horas se asignan al mes visible**: Garantiza reportes mensuales exactos

#### Modos de Visualización

##### Vista Semanal
- Muestra solo la semana seleccionada
- **Por defecto**: Semana actual (no semana 1)
- Navegación con flechas entre semanas
- Vista tabular con proyectos expandibles
- Detalles de cada tarea: nombre, horas (Est/Real/Comp), estado

##### Vista Mensual
- Muestra todas las semanas del mes
- Vista compacta tipo tabla
- Cada proyecto muestra resumen por semana
- Botón para expandir/colapsar proyectos
- Filtro: "Solo mis proyectos" o "Todos"

#### Herramientas de Productividad

##### Carga Masiva
- Botón `+` en cada semana
- Dialog para añadir múltiples tareas
- Validaciones en tiempo real

##### Edición Inline
- **Doble clic** sobre el nombre de una tarea para renombrarla
- Guardado automático al perder foco o presionar Enter
- Feedback visual de guardado

##### Menú Contextual
- Tres puntos (`...`) en cada tarea
- Opciones:
  - Editar tarea completa
  - Mover a otra semana
  - Eliminar tarea
  - Ver dependencias

##### Dependencias
- Campo `dependencyId` en cada tarea
- Sistema alerta si hay bloqueos
- Badge visual: "Listo" (verde) o "Dep: [tarea]" (amarillo)
- Muestra el propietario de la tarea dependiente

#### Control de Horas

Cada tarea tiene tres tipos de horas:

- **Estimadas (Est)**: Horas planificadas al crear la tarea
- **Reales (Real)**: Horas trabajadas (se introducen al completar)
- **Computadas (Comp)**: Horas facturables al cliente

**Estados**:
- `planned`: Solo tiene horas estimadas
- `active`: En progreso
- `completed`: Tiene horas reales y computadas

**Alertas Visuales**:
- Indicador de desvío cuando `Real > Est`
- Colores: verde (OK), amarillo (ajuste), rojo (sobrecarga)

#### Badge "Weekly"

Las tareas gestionadas vía Weekly muestran un badge azul "Weekly" con tooltip que muestra:
- Si fue transferida: "Transferida de [compañero]\nTarea original: [nombre]"
- Si fue distribuida: "Distribuida desde transferencia de [compañero]\nTarea original: [nombre]"
- Si fue gestionada: "Tarea gestionada vía Weekly"

#### Protección de Edición

- **Tareas de semanas pasadas**: No se pueden editar directamente
- **Forzar uso de Weekly**: Obliga a usar el sistema Weekly para gestionar tareas atrasadas
- **Vista reducida**: Si se usa la vista semanal, aún se puede editar (pero no recomendado)

#### Tour Interactivo

- Tutorial que explica todas las funciones del planificador
- Se muestra automáticamente la primera vez
- Puede reiniciarse

---

### 4. Sistema de Deadlines

**Ruta**: `/deadlines` (requiere permiso `can_access_deadlines`)

#### Propósito

Gestionar asignaciones de horas por proyecto y empleado de forma mensual, independiente del planificador.

#### Funcionalidades Principales

##### Asignaciones por Proyecto
- Cada proyecto tiene un deadline mensual
- Asignación de horas por empleado (JSONB: `{"employee_id": horas}`)
- Notas por proyecto
- Ocultar proyectos del mes

##### Asignaciones Globales
- Asignaciones que afectan a todos o a empleados específicos
- Ejemplos: "Deadline afecta a todos", "Creación timeboxing"
- Campo `employeeId` para rastrear quién creó la asignación

##### Filtros Avanzados
- **Búsqueda**: Por nombre de proyecto o cliente
- **Tipo de proyecto**: Solo SEO, Solo PPC, Todos
- **Empleado**: Filtrar por empleado específico
- **Estado**: Sin asignar, Con asignación
- **Ordenación**: Por cliente, por horas asignadas, por horas restantes

##### Edición Inline
- Doble clic en proyecto para editar
- Auto-guardado con indicador visual
- Sistema de bloqueos para evitar edición concurrente

##### Sistema de Bloqueos
- Tabla `project_editing_locks` rastrea quién está editando
- Realtime updates vía Supabase
- Expiración automática de bloqueos
- Broadcast Channel para sincronización entre pestañas

##### Realtime Updates
- Suscripción a cambios en `deadlines`
- Suscripción a cambios en `global_assignments`
- Suscripción a cambios en `project_editing_locks`
- Actualización automática sin recargar

##### Coherencia de Planificación
- Compara horas en deadlines vs horas en planificador
- Muestra inconsistencias
- Sugiere intercambios de tareas entre compañeros

##### Tour Interactivo
- Tutorial completo del sistema de deadlines
- Se muestra automáticamente la primera vez

---

### 5. Gestión de Proyectos

**Ruta**: `/projects` o `/clients` (requiere permisos correspondientes)

#### Funcionalidades

##### Vista de Proyectos
- Lista de todos los proyectos activos
- Filtros por estado:
  - Sin actividad
  - Falta planificar
  - Retrasados
  - Sobre presupuesto
  - En riesgo
- Vista de progreso con barras visuales

##### OKRs por Proyecto
- Objetivos específicos del proyecto
- Seguimiento de progreso
- Key Results configurables

##### Métricas en Tiempo Real
- Horas planificadas vs ejecutadas
- Balance (ganancia/pérdida de horas)
- Tareas completadas vs pendientes
- Estados de salud: Healthy, Needs Attention, At Risk

##### Gestión de Clientes
- Crear, editar, eliminar clientes
- Asignar colores a clientes
- Vista de proyectos por cliente

---

### 6. Gestión de Equipo

**Ruta**: `/team` (requiere permiso `can_access_team`)

#### Funcionalidades

##### Perfil del Empleado
- **Datos básicos**: Nombre, email, rol, departamento
- **Tarifa por hora**: Para cálculos de coste
- **ID de usuario CRM**: Para exportaciones
- **Avatar**: URL personalizada o generado automáticamente

##### Horario Personalizado
- Configuración de horas por día de la semana
- Recalcula capacidad semanal automáticamente
- Editor visual con sliders

##### Acceso al Sistema
- Crear credenciales de Supabase Auth desde el panel
- Edge Function `create-user` maneja la creación
- Vinculación automática con `user_id`

##### Permisos Granulares
- Control de acceso por usuario (no por rol)
- Permisos disponibles:
  - `can_access_planner`: Planificador
  - `can_access_projects`: Proyectos
  - `can_access_clients`: Clientes
  - `can_access_team`: Equipo
  - `can_access_reports`: Reportes
  - `can_access_client_reports`: Informes de clientes
  - `can_access_google_ads`: Google Ads
  - `can_access_meta_ads`: Meta Ads
  - `can_access_ads_reports`: Informes automatizados
  - `can_access_deadlines`: Deadlines
  - `can_access_weekly_forecast`: Weekly Forecast (managers)
  - `can_access_settings`: Configuración

##### Festivos y Eventos
- Gestiona días festivos que afectan la capacidad
- Puede afectar a todos o a empleados específicos
- Reducción de horas configurable

##### Ausencias
- Vacaciones, bajas médicas, permisos personales
- Rango de fechas
- Tipo de ausencia
- Horas específicas (opcional, si es ausencia parcial)

##### Objetivos Profesionales
- OKRs individuales
- Key Results booleanos o numéricos
- Progreso visual
- Fechas de inicio y vencimiento
- Enlaces a recursos de formación

---

### 7. Reportes y Métricas

**Ruta**: `/reports` (requiere permiso `can_access_reports`)

#### Tres Vistas Principales

##### Visión General
- **KPIs del Mes**:
  - Capacidad total del equipo
  - Horas planificadas
  - Horas reales trabajadas
  - Horas computadas (facturables)
- **Tasa de Ocupación**: % de capacidad utilizada
- **Tasa de Rentabilidad**: Ratio Computado vs Real
  - `< 100%`: Trabajamos más de lo que facturamos
  - `> 100%`: Facturamos más de lo trabajado

##### Desglose por Equipo
- **Ocupación Individual**: Barra de progreso por empleado
- **Rentabilidad Individual**: Comparativa Real vs Computado
- **Índice de Fiabilidad**: Métrica histórica de precisión en estimaciones
  - Fórmula: `(Total Horas Estimadas / Total Horas Reales) × 100`
  - `100%` = Estimaciones perfectas
  - `< 100%` = Subestima (estima menos de lo que tarda)
  - `> 100%` = Sobreestima
  - Badge con código de colores y tooltip detallado
  - Requiere mínimo 5 tareas completadas para ser significativo

##### Desglose por Proyectos
- Tarjetas con estado visual (verde/amarillo/rojo)
- Progreso sobre presupuesto
- Balance de horas (ganancia/pérdida)
- Filtros por cliente, empleado, estado

##### Coherencia de Planificación
- Compara horas en deadlines vs horas en planificador
- Detecta inconsistencias
- Sugiere intercambios de tareas

---

### 8. Copiloto IA (Minguito)

**Ruta**: `/dashboard-ai` (accesible para todos)

#### Características

##### Preguntas Inteligentes
- "¿Cómo está la carga del equipo?"
- "¿Hay dependencias bloqueantes?"
- "¿Qué proyectos van lentos?"
- "¿Qué tareas arrastramos de semanas pasadas?"
- "¿Quién suele fallar en sus estimaciones?"

##### Contexto Dinámico
- Solo carga en memoria los datos relevantes a tu pregunta
- Analiza la pregunta buscando nombres de empleados/proyectos
- Inyecta datos **detallados** solo para las coincidencias
- El resto se inyecta como **resumen** para ahorrar tokens

##### Detección Automática
- **Tareas Zombie**: Pendientes de semanas anteriores
- **Bloqueos de dependencias**: Tareas que no pueden avanzar
- **Proyectos con bajo ritmo**: Ejecución lenta vs planificado
- **Conflictos vacacionales**: Solapamientos de ausencias

##### Multi-Modelo con Fallback
1. **Primario**: Google Gemini 2.0 Flash
2. **Fallback 1**: Gemini Flash Experimental (gratis)
3. **Fallback 2**: Gemma 3 27B (gratis)
4. **Fallback 3**: Otros modelos gratuitos vía OpenRouter

##### Interfaz
- Historial de conversaciones
- Preguntas sugeridas
- Indicador de modelo usado
- Parsing de markdown básico
- Botón para limpiar conversación

---

### 9. Módulo PPC (Google Ads + Meta Ads)

#### Google Ads
**Ruta**: `/ads` (requiere permiso `can_access_google_ads`)

##### Funcionalidades
- Dashboard de cuentas unificado
- Métricas clave: Inversión, Conversiones, CPA, CTR
- Segmentación virtual de campañas
- Sincronización automática diaria (worker)
- Configuración de cuentas desde Settings

#### Meta Ads
**Ruta**: `/meta-ads` (requiere permiso `can_access_meta_ads`)

##### Funcionalidades
- Dashboard similar a Google Ads
- Sincronización automática diaria (worker)
- Agrupación de cuentas (Holding)
- Configuración de cuentas desde Settings

#### Informes Automatizados
**Ruta**: `/ads-reports` (requiere permiso `can_access_ads_reports`)

##### Funcionalidades
- Generador de informes ejecutivos
- Análisis IA integrado
- Comparativas históricas
- Exportación en múltiples formatos

---

### 10. Weekly Forecast (Previsión Semanal)

**Ruta**: `/weekly-forecast` (requiere permiso `can_access_weekly_forecast`)

#### Propósito

Herramienta para managers/responsables para:
- Ver estado mensual de proyectos vs horas contratadas
- Revisar transferencias de horas entre compañeros
- Redistribuir horas rápidamente

#### Secciones

##### 1. Semáforo de Proyectos
- **Cálculo**:
  - Total Contratado: `budgetHours` del proyecto
  - Realizado: `hours_actual` (pasadas) + `hours_assigned` (futuras) del mes
  - Diferencia: Contratado - Realizado
- **Estados Visuales**:
  - 🔴 Rojo: Diferencia < 0 (nos pasamos)
  - 🟡 Amarillo: Diferencia > 0 (faltan horas)
  - 🟢 Verde: Diferencia ~ 0 (on track)
- **Filtros**:
  - Búsqueda por nombre de proyecto (input escribible)
  - Filtro por cliente (dropdown)
  - Filtro por tipo (SEO/PPC) con switches
  - Ordenación: nombre, estado, diferencia, contratado
- **Explicación**: "En línea con el contrato" aparece cuando hay 0 horas planificadas pero horas contratadas > 0

##### 2. Transferencias de Horas
- **Agrupación**: Por proyecto (con header visual)
- **Información mostrada**:
  - Layout: `[Avatar + Nombre] → [Flecha + Horas] → [Avatar + Nombre]`
  - Tarea original (nombre limpio)
  - Lista de tareas distribuidas (si aplica) con horas
  - Notas del feedback
  - Fecha de procesamiento
- **Filtros rápidos**:
  - Todas
  - Pendientes (aún no procesadas)
  - Mantenidas (acción "mantener")
  - Redistribuidas (acción "distribuir")
- **Indicador de cantidad**: Badge en el título con total de transferencias
- **Colores sutiles**: Fondos con opacidad 50/30, bordes suaves

##### 3. Redistribución Rápida
- **Flujo mejorado**:
  1. Seleccionar proyecto
  2. Seleccionar compañero origen (muestra tareas abiertas)
  3. Seleccionar tareas específicas a redistribuir
  4. Seleccionar compañero destino
  5. Seleccionar semana destino
- **Validaciones**:
  - Capacidad del destino
  - Presupuesto del proyecto
- **Resultado**: Crea nuevas tareas para el destino

---

## 💻 Documentación Técnica

### Stack Tecnológico

| Categoría | Tecnología | Versión | Propósito |
|-----------|-----------|---------|-----------|
| **Frontend Framework** | React | 18.3.1 | UI Framework |
| **Lenguaje** | TypeScript | 5.8.3 | Type Safety |
| **Build Tool** | Vite | 5.4.19 | Bundling y Dev Server |
| **Estilos** | Tailwind CSS | 3.4.17 | Utility-first CSS |
| **Componentes UI** | Shadcn/ui | Latest | Componentes accesibles |
| **Backend** | Supabase | Latest | PostgreSQL + Auth + Edge Functions |
| **IA** | Google Gemini API | 2.0 Flash | Análisis inteligente |
| **IA Fallback** | OpenRouter | Latest | Modelos alternativos |
| **Fechas** | date-fns | 3.6.0 | Manipulación de fechas |
| **Routing** | React Router | 6.30.1 | Navegación |
| **State Management** | React Context | Built-in | Estado global |
| **Data Fetching** | TanStack Query | 5.83.0 | Cache y sincronización |
| **Formularios** | React Hook Form | 7.61.1 | Gestión de formularios |
| **Validación** | Zod | 3.25.76 | Schema validation |
| **Gráficos** | Recharts | 2.15.4 | Visualización de datos |
| **Notificaciones** | Sonner | 1.7.4 | Toast notifications |
| **Iconos** | Lucide React | 0.462.0 | Iconografía |

### Arquitectura del Proyecto

```
src/
├── components/
│   ├── auth/
│   │   ├── ProtectedRoute.tsx          # Protección por sesión
│   │   └── PermissionProtectedRoute.tsx # Protección por permisos
│   ├── employee/
│   │   ├── WeeklyReportDialog.tsx      # Dialog de Weekly (empleado)
│   │   ├── WelcomeTour.tsx             # Tour de bienvenida
│   │   ├── DashboardWidgets.tsx        # Widgets del dashboard
│   │   ├── ReliabilityIndexCard.tsx    # Índice de fiabilidad
│   │   ├── PlanningInconsistenciesCard.tsx # Coherencia planificación
│   │   ├── CollaborationCards.tsx       # Colaboración entre compañeros
│   │   ├── MonthlyBalanceCard.tsx      # Balance mensual
│   │   └── MyWeekView.tsx              # Vista semanal personal
│   ├── planner/
│   │   ├── PlannerGrid.tsx             # Grid principal del planificador
│   │   ├── AllocationSheet.tsx         # Modal de detalle de tareas
│   │   ├── EmployeeRow.tsx            # Fila de empleado
│   │   ├── WeekCell.tsx                # Celda de semana
│   │   └── PlannerTour.tsx             # Tour del planificador
│   ├── deadlines/
│   │   └── DeadlinesTour.tsx           # Tour de deadlines
│   ├── team/
│   │   ├── EmployeeDialog.tsx          # Dialog de empleado
│   │   ├── EmployeeCard.tsx            # Tarjeta de empleado
│   │   ├── ScheduleEditor.tsx          # Editor de horarios
│   │   ├── AbsencesSheet.tsx           # Gestión de ausencias
│   │   ├── ProfessionalGoalsSheet.tsx  # Gestión de OKRs
│   │   ├── ProjectsSheet.tsx           # Proyectos del empleado
│   │   └── TeamEventManager.tsx        # Gestión de eventos
│   ├── layout/
│   │   ├── AppLayout.tsx               # Layout principal
│   │   └── Sidebar.tsx                 # Barra lateral de navegación
│   └── ui/                              # Componentes Shadcn/ui
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── card.tsx
│       └── ... (40+ componentes)
├── contexts/
│   ├── AppContext.tsx                  # Estado global de la app
│   └── AuthContext.tsx                  # Estado de autenticación
├── pages/
│   ├── EmployeeDashboard.tsx           # Dashboard personal (/)
│   ├── Index.tsx                        # Planificador (/planner)
│   ├── WeeklyForecastPage.tsx          # Weekly Forecast (/weekly-forecast)
│   ├── DeadlinesPage.tsx               # Deadlines (/deadlines)
│   ├── ClientsAndProjectsPage.tsx      # Clientes y Proyectos
│   ├── TeamPage.tsx                    # Gestión de equipo
│   ├── ReportsPage.tsx                 # Reportes y métricas
│   ├── DashboardAI.tsx                  # Copiloto IA
│   ├── AdsPage.tsx                     # Google Ads
│   ├── MetaAdsPage.tsx                 # Meta Ads
│   ├── AdsReportGenerator.tsx          # Generador de informes
│   ├── SettingsPage.tsx                # Configuración
│   └── Login.tsx                       # Página de login
├── hooks/
│   ├── usePermissions.ts               # Hook de permisos
│   ├── use-mobile.tsx                  # Detección de móvil
│   └── use-toast.ts                    # Hook de toasts
├── services/
│   ├── aiService.ts                    # Servicio de IA
│   └── errorService.ts                 # Manejo de errores
├── utils/
│   ├── dateUtils.ts                    # Utilidades de fechas
│   ├── absenceUtils.ts                 # Cálculo de ausencias
│   ├── teamEventUtils.ts               # Cálculo de eventos
│   ├── aiReportUtils.ts                # Generación de informes IA
│   └── logger.ts                       # Sistema de logging
├── types/
│   ├── index.ts                        # Interfaces principales
│   └── permissions.ts                  # Tipos de permisos
├── lib/
│   ├── supabase.ts                     # Cliente Supabase
│   └── utils.ts                        # Utilidades generales
└── App.tsx                             # Router principal

supabase/
├── functions/
│   ├── create-user/
│   │   └── index.ts                    # Edge Function: crear usuario
│   └── update-user/
│       └── index.ts                    # Edge Function: actualizar usuario
└── migrations/
    ├── create_weekly_feedback_table.sql
    ├── add_transfer_tracking_to_allocations.sql
    ├── create_deadlines_table.sql
    ├── add_permissions_to_employees.sql
    └── ... (10+ migraciones)

Workers (Node.js):
├── ads-worker.js                       # Sincronización Google Ads
└── meta-worker.js                      # Sincronización Meta Ads
```

### Base de Datos Completa

El sistema usa **Supabase (PostgreSQL)** con las siguientes tablas:

#### Tablas Core

##### `employees`
```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  user_id UUID REFERENCES auth.users(id), -- Vinculación con Supabase Auth
  role TEXT, -- 'Responsable' | 'Coordinador' | 'SEO' | 'PPC'
  department TEXT, -- 'SEO' | 'PPC'
  default_weekly_capacity NUMERIC NOT NULL DEFAULT 40,
  work_schedule JSONB DEFAULT '{"monday":8,"tuesday":8,"wednesday":8,"thursday":8,"friday":8,"saturday":0,"sunday":0}'::jsonb,
  hourly_rate NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  crm_user_id INTEGER, -- ID en el CRM externo
  avatar_url TEXT,
  welcome_tour_completed BOOLEAN DEFAULT false,
  deadlines_tour_completed BOOLEAN DEFAULT false,
  planner_tour_completed BOOLEAN DEFAULT false,
  permissions JSONB DEFAULT '{"can_access_planner":true,...}'::jsonb
);
```

**Índices**:
- `idx_employees_user_id` (user_id)
- `idx_employees_permissions` (permissions, GIN)
- `idx_employees_welcome_tour_completed`
- `idx_employees_deadlines_tour_completed`

##### `clients`
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6b7280'
);
```

##### `projects`
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active', -- 'active' | 'archived' | 'completed'
  budget_hours NUMERIC DEFAULT 0,
  minimum_hours NUMERIC DEFAULT 0,
  monthly_fee NUMERIC DEFAULT 0,
  external_id INTEGER, -- ID en el CRM externo
  project_type TEXT, -- 'PPC' | 'Entregable' | 'Mensual'
  is_hidden BOOLEAN DEFAULT false,
  okrs JSONB DEFAULT '[]'::jsonb,
  deliverables_log JSONB DEFAULT '{}'::jsonb,
  last_meeting_date DATE
);
```

**Índices**:
- `idx_projects_client_id` (client_id)
- `idx_projects_status` (status)
- `idx_projects_is_hidden` (is_hidden) WHERE is_hidden = false

##### `allocations` (Core del Sistema)
```sql
CREATE TABLE allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL, -- Lunes de la semana (YYYY-MM-DD)
  hours_assigned NUMERIC NOT NULL DEFAULT 0, -- Horas estimadas/planificadas
  hours_actual NUMERIC, -- Horas reales trabajadas
  hours_computed NUMERIC, -- Horas facturables
  status TEXT DEFAULT 'planned', -- 'planned' | 'completed' | 'active'
  description TEXT,
  task_name TEXT,
  dependency_id UUID REFERENCES allocations(id) ON DELETE SET NULL,
  transferred_from_allocation_id UUID REFERENCES allocations(id) ON DELETE SET NULL, -- Rastreo de transferencias
  distribution_source_allocation_id UUID REFERENCES allocations(id) ON DELETE SET NULL, -- Rastreo de distribuciones
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Índices**:
- `idx_allocations_employee_id` (employee_id)
- `idx_allocations_project_id` (project_id)
- `idx_allocations_week_start_date` (week_start_date)
- `idx_allocations_transferred_from` (transferred_from_allocation_id) WHERE transferred_from_allocation_id IS NOT NULL
- `idx_allocations_distribution_source` (distribution_source_allocation_id) WHERE distribution_source_allocation_id IS NOT NULL

**Comentarios**:
- `week_start_date`: Clave para la lógica mensual estricta
- `transferred_from_allocation_id`: ID de la tarea original de la que proviene esta transferencia
- `distribution_source_allocation_id`: ID de la tarea transferida de la que proviene esta distribución

##### `absences`
```sql
CREATE TABLE absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  type TEXT DEFAULT 'vacation', -- 'vacation' | 'sick_leave' | 'personal' | 'other'
  hours NUMERIC, -- Opcional: si es ausencia parcial
  description TEXT
);
```

**Índices**:
- `idx_absences_employee_id` (employee_id)
- `idx_absences_dates` (start_date, end_date)

##### `team_events`
```sql
CREATE TABLE team_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  hours_reduction NUMERIC NOT NULL DEFAULT 8, -- Horas reducidas (8 = día completo)
  affected_employee_ids JSONB DEFAULT 'all', -- 'all' | ['employee_id1', 'employee_id2']
  description TEXT
);
```

**Índices**:
- `idx_team_events_date` (date)

##### `professional_goals`
```sql
CREATE TABLE professional_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  key_results JSONB DEFAULT '[]'::jsonb, -- Array de {title, type, value, target}
  progress NUMERIC DEFAULT 0, -- 0-100
  start_date DATE,
  due_date DATE,
  training_url TEXT
);
```

**Índices**:
- `idx_professional_goals_employee_id` (employee_id)

#### Tablas del Sistema Weekly

##### `weekly_feedback`
```sql
CREATE TABLE weekly_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL, -- Lunes de la semana reportada
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  allocation_id UUID REFERENCES allocations(id) ON DELETE SET NULL, -- Para vincular a una tarea específica
  reason TEXT CHECK (reason IN ('technical_issue', 'client_blocker', 'bad_estimation', 'personal_absence', 'other')),
  comments TEXT, -- Notas del empleado
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Índices**:
- `idx_weekly_feedback_employee_id` (employee_id)
- `idx_weekly_feedback_week_start_date` (week_start_date)
- `idx_weekly_feedback_project_id` (project_id)
- `idx_weekly_feedback_allocation_id` (allocation_id)

**RLS Policies**:
- Empleados pueden insertar y ver sus propios registros
- Managers/Responsables pueden ver todas las entradas

#### Tablas del Sistema Deadlines

##### `deadlines`
```sql
CREATE TABLE deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  notes TEXT,
  employee_hours JSONB DEFAULT '{}'::jsonb, -- {"employee_id": horas}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id)
);
```

**Índices**:
- `idx_deadlines_project_id` (project_id)

**Triggers**:
- `update_updated_at_column`: Actualiza `updated_at` automáticamente

##### `global_assignments`
```sql
CREATE TABLE global_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month TEXT NOT NULL, -- Formato: 'YYYY-MM'
  name TEXT NOT NULL,
  hours NUMERIC NOT NULL,
  affects_all BOOLEAN DEFAULT true,
  affected_employee_ids JSONB DEFAULT '[]'::jsonb, -- Array de employee IDs
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL -- Quién creó la asignación
);
```

**Índices**:
- `idx_global_assignments_month` (month)
- `idx_global_assignments_employee_id` (employee_id)

##### `project_editing_locks`
```sql
CREATE TABLE project_editing_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- Formato: 'YYYY-MM'
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

**Índices**:
- `idx_editing_locks_project_month` (project_id, month)
- `idx_editing_locks_employee` (employee_id)
- `idx_editing_locks_expires` (expires_at)

#### Tablas del Módulo PPC

##### `google_ads_campaigns`
```sql
CREATE TABLE google_ads_campaigns (
  campaign_id TEXT NOT NULL,
  date DATE NOT NULL,
  client_id UUID REFERENCES clients(id),
  client_name TEXT,
  campaign_name TEXT,
  status TEXT,
  cost NUMERIC,
  clicks INTEGER,
  impressions INTEGER,
  conversions NUMERIC,
  conversions_value NUMERIC,
  daily_budget NUMERIC,
  PRIMARY KEY (campaign_id, date)
);
```

##### `meta_ads_campaigns`
```sql
CREATE TABLE meta_ads_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  campaign_id TEXT NOT NULL,
  date DATE NOT NULL,
  campaign_name TEXT,
  status TEXT,
  cost NUMERIC,
  impressions INTEGER,
  clicks INTEGER,
  conversions NUMERIC,
  conversions_value NUMERIC
);
```

##### `ad_accounts_config`
```sql
CREATE TABLE ad_accounts_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL, -- 'google' | 'meta'
  account_id TEXT NOT NULL,
  account_name TEXT,
  is_active BOOLEAN DEFAULT true,
  budget NUMERIC,
  is_sales_objective BOOLEAN DEFAULT false,
  UNIQUE(platform, account_id)
);
```

##### `segmentation_rules`
```sql
CREATE TABLE segmentation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  account_id TEXT NOT NULL,
  keyword TEXT NOT NULL,
  virtual_name TEXT NOT NULL
);
```

#### Relaciones Clave

```
employees (1) ──< (N) allocations
projects (1) ──< (N) allocations
clients (1) ──< (N) projects
employees (1) ──< (N) absences
employees (1) ──< (N) professional_goals
employees (1) ──< (N) weekly_feedback
allocations (1) ──< (N) allocations (dependency_id)
allocations (1) ──< (N) allocations (transferred_from_allocation_id)
allocations (1) ──< (N) allocations (distribution_source_allocation_id)
projects (1) ──< (1) deadlines
projects (1) ──< (N) project_editing_locks
```

### Sistema de Permisos

#### Arquitectura

El sistema de permisos es **granular y por usuario**, no por rol. Cada empleado tiene un objeto `permissions` (JSONB) en la tabla `employees`.

#### Permisos Disponibles

```typescript
interface UserPermissions {
  can_access_planner?: boolean;           // Planificador
  can_access_projects?: boolean;          // Proyectos
  can_access_clients?: boolean;           // Clientes
  can_access_team?: boolean;             // Equipo
  can_access_reports?: boolean;          // Reportes
  can_access_client_reports?: boolean;   // Informes de clientes
  can_access_google_ads?: boolean;       // Google Ads
  can_access_meta_ads?: boolean;          // Meta Ads
  can_access_ads_reports?: boolean;       // Informes automatizados
  can_access_deadlines?: boolean;         // Deadlines
  can_access_weekly_forecast?: boolean;   // Weekly Forecast (managers)
  can_access_weekly?: boolean;           // Botón Weekly (siempre visible, no usado)
  can_access_settings?: boolean;          // Configuración
}
```

#### Mapeo de Rutas

```typescript
const ROUTE_PERMISSIONS: Record<string, keyof UserPermissions> = {
  '/planner': 'can_access_planner',
  '/projects': 'can_access_projects',
  '/clients': 'can_access_clients',
  '/team': 'can_access_team',
  '/reports': 'can_access_reports',
  '/informes-clientes': 'can_access_client_reports',
  '/ads': 'can_access_google_ads',
  '/meta-ads': 'can_access_meta_ads',
  '/ads-reports': 'can_access_ads_reports',
  '/deadlines': 'can_access_deadlines',
  '/weekly-forecast': 'can_access_weekly_forecast',
  '/settings': 'can_access_settings',
};
```

#### Lógica de Validación

- **Por defecto**: Todos los permisos son `true` si no están definidos
- **Si está definido como `false`**: Se deniega el acceso
- **Si la ruta no está en el mapeo**: Se permite el acceso (por defecto)

#### Uso en el Código

```typescript
// Hook de permisos
const { canAccess, hasPermission } = usePermissions();

// Verificar acceso a ruta
if (canAccess('/planner')) {
  // Mostrar enlace al planificador
}

// Verificar permiso específico
if (hasPermission('can_access_weekly_forecast')) {
  // Mostrar página de forecast
}
```

#### Gestión de Permisos

Los permisos se gestionan en:
- **Página de Team** → Editar empleado → Pestaña "Permisos"
- Se organizan en secciones:
  - **Gestión**: Planner, Proyectos, Clientes, Equipo, Configuración
  - **PPC**: Google Ads, Meta Ads, Informes automatizados
  - **Análisis**: Reportes, Informes de clientes
  - **Otros**: Deadlines, Forecast

### Autenticación y Seguridad

#### Flujo de Autenticación

1. **Login**: `/login` → `supabase.auth.signInWithPassword()`
2. **Protección de Rutas**: `<ProtectedRoute>` verifica sesión activa
3. **Vinculación Usuario-Empleado**: 
   - Campo `user_id` en `employees` conecta `auth.users` con datos
   - Se busca automáticamente al cargar la app
4. **Verificación de Permisos**: `<PermissionProtectedRoute>` verifica permisos antes de renderizar

#### Edge Functions

##### `create-user`
- **Propósito**: Crear usuario en Supabase Auth con Service Role Key
- **Endpoint**: `https://[project].supabase.co/functions/v1/create-user`
- **Método**: POST
- **Body**:
  ```json
  {
    "email": "usuario@example.com",
    "password": "contraseña123",
    "name": "Nombre Completo"
  }
  ```
- **Respuesta**:
  ```json
  {
    "user": {
      "id": "uuid-del-usuario",
      "email": "usuario@example.com"
    }
  }
  ```

##### `update-user`
- **Propósito**: Actualizar contraseña de usuario existente
- **Endpoint**: `https://[project].supabase.co/functions/v1/update-user`
- **Método**: POST
- **Body**:
  ```json
  {
    "userId": "uuid-del-usuario",
    "password": "nueva-contraseña",
    "email": "nuevo-email@example.com" // Opcional
  }
  ```

#### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado con políticas específicas:

- **Empleados**: Pueden ver sus propios datos, managers ven todos
- **Asignaciones**: Empleados ven las suyas, managers ven todas
- **Weekly Feedback**: Empleados ven las suyas, managers ven todas
- **Deadlines**: Todos los usuarios autenticados pueden ver/editar
- **Proyectos/Clientes**: Todos los usuarios autenticados

### Instalación y Despliegue

#### 1. Prerrequisitos

- Node.js 18+ y npm/yarn
- Cuenta de Supabase
- (Opcional) API Keys de Google Gemini y OpenRouter
- (Opcional) Credenciales de Google Ads API y Meta Marketing API

#### 2. Clonar e Instalar

```bash
git clone <repo-url>
cd timeboxing
npm install
```

#### 3. Configurar Supabase

##### 3.1. Crear Proyecto
1. Ir a [supabase.com](https://supabase.com)
2. Crear nuevo proyecto
3. Anotar URL y anon key

##### 3.2. Ejecutar Migraciones
Ejecutar todas las migraciones en orden desde `supabase/migrations/`:

```sql
-- 1. Tablas base (employees, clients, projects, allocations, etc.)
-- 2. create_weekly_feedback_table.sql
-- 3. add_transfer_tracking_to_allocations.sql
-- 4. create_deadlines_table.sql
-- 5. add_permissions_to_employees.sql
-- 6. create_project_editing_locks.sql
-- 7. enable_realtime_for_deadlines.sql
-- ... (resto de migraciones)
```

##### 3.3. Configurar RLS
Las políticas RLS están incluidas en las migraciones. Verificar que estén activas:

```sql
-- Verificar RLS habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Ver políticas
SELECT * FROM pg_policies;
```

##### 3.4. Desplegar Edge Functions

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link al proyecto
supabase link --project-ref [tu-project-ref]

# Desplegar funciones
supabase functions deploy create-user
supabase functions deploy update-user
```

#### 4. Variables de Entorno

Crear archivo `.env` en la raíz:

```env
# Supabase (REQUERIDO)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (solo para workers)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# IA (REQUERIDO)
VITE_GEMINI_API_KEY=AIzaSy...

# IA Fallback (OPCIONAL)
VITE_OPENROUTER_API_KEY=sk-or-v1-...

# Google Ads (OPCIONAL - solo si usas workers)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_DEVELOPER_TOKEN=xxx
GOOGLE_REFRESH_TOKEN=xxx
GOOGLE_MCC_ID=xxx-xxx-xxxx

# Meta Ads (OPCIONAL - solo si usas workers)
META_ACCESS_TOKEN=xxx
META_AD_ACCOUNT_IDS=act_xxx,act_yyy
```

#### 5. Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:8080`

#### 6. Build para Producción

```bash
npm run build
npm run preview  # Para probar el build localmente
```

Los archivos se generan en `dist/`

#### 7. Desplegar

##### Opción A: Vercel/Netlify
1. Conectar repositorio
2. Configurar variables de entorno
3. Build command: `npm run build`
4. Output directory: `dist`

##### Opción B: Servidor Propio
1. `npm run build`
2. Subir carpeta `dist/` al servidor
3. Configurar servidor web (nginx, Apache) para servir archivos estáticos
4. Configurar variables de entorno en el servidor

### Workers de Sincronización

#### Google Ads Worker

**Archivo**: `ads-worker.js`

**Propósito**: Sincronizar datos de campañas de Google Ads diariamente

**Configuración**:
1. Obtener credenciales de Google Ads API:
   - Client ID y Secret
   - Developer Token
   - Refresh Token
   - MCC ID (Manager Account)
2. Configurar en `.env`
3. Ejecutar manualmente o programar con cron

**Ejecución**:
```bash
node ads-worker.js
```

**Funcionamiento**:
1. Obtiene access token de Google OAuth
2. Lista todas las cuentas de cliente (MCC)
3. Para cada cuenta:
   - Obtiene campañas del mes anterior hasta hoy
   - Inserta/actualiza en `google_ads_campaigns`
4. Logs detallados de progreso

**Programar con Cron**:
```bash
# Ejecutar diariamente a las 2 AM
0 2 * * * cd /path/to/project && node ads-worker.js >> /var/log/ads-worker.log 2>&1
```

#### Meta Ads Worker

**Archivo**: `meta-worker.js`

**Propósito**: Sincronizar datos de campañas de Meta Ads diariamente

**Configuración**:
1. Obtener Access Token de Meta Marketing API
2. Configurar cuentas en `ad_accounts_config` (tabla) o en `.env`
3. Ejecutar manualmente o programar con cron

**Ejecución**:
```bash
node meta-worker.js
```

**Funcionamiento**:
1. Lee cuentas desde `ad_accounts_config` (preferido) o `.env`
2. Para cada cuenta:
   - Obtiene insights de campañas (últimos 30 días)
   - Inserta/actualiza en `meta_ads_campaigns`
3. Crea registro en `meta_sync_logs` para tracking

**Programar con Cron**:
```bash
# Ejecutar diariamente a las 3 AM
0 3 * * * cd /path/to/project && node meta-worker.js >> /var/log/meta-worker.log 2>&1
```

### Edge Functions

#### Estructura

```
supabase/functions/
├── create-user/
│   └── index.ts
└── update-user/
    └── index.ts
```

#### create-user

**Código**: `supabase/functions/create-user/index.ts`

**Funcionalidad**:
- Crea usuario en Supabase Auth con Service Role Key
- Valida email y contraseña (mínimo 6 caracteres)
- Confirma email automáticamente
- Devuelve `user.id` para vincular con `employees`

**Uso desde Frontend**:
```typescript
const { data, error } = await supabase.functions.invoke('create-user', {
  body: { email, password, name }
});
```

#### update-user

**Código**: `supabase/functions/update-user/index.ts`

**Funcionalidad**:
- Actualiza contraseña de usuario existente
- Opcionalmente actualiza email
- Requiere autenticación del usuario

**Uso desde Frontend**:
```typescript
const { data, error } = await supabase.functions.invoke('update-user', {
  body: { userId, password, email }
});
```

### Lógica de Fechas y Capacidad

#### Funciones Principales

##### `getWeeksForMonth(date: Date)`
Calcula las semanas de un mes, excluyendo semanas sin días laborables.

**Lógica**:
- Semanas que cruzan meses se incluyen parcialmente
- `effectiveStart` y `effectiveEnd` limitan al mes visible
- Solo incluye semanas con al menos un día laborable

##### `getStorageKey(weekStart: Date, viewMonth: Date)`
Genera clave única para asociar semanas al mes visible.

**Lógica**:
- Si la semana está en el mes visible: usa fecha real
- Si la semana está antes del mes: usa inicio del mes
- Si la semana está después del mes: usa fecha real

##### `getMonthlyCapacity(year: number, month: number, schedule: WorkSchedule)`
Calcula capacidad mensual basada en horario personalizado.

**Lógica**:
- Suma horas de cada día según `work_schedule`
- Considera solo días laborables (horas > 0)

##### `getAbsenceHoursInRange(start, end, absences, schedule)`
Calcula horas reducidas por ausencias en un rango.

**Lógica**:
- Itera sobre todas las ausencias
- Para cada día de ausencia:
  - Si `absence.hours` está definido: usa ese valor (topeado por horario)
  - Si no: asume día completo (usa horario del día)
- Maneja solapamientos (máximo = horario del día)

##### `getTeamEventHoursInRange(start, end, employeeId, teamEvents, schedule, absences)`
Calcula horas reducidas por eventos de equipo.

**Lógica**:
- Si `hoursReduction >= 8`: usa horario real del empleado
- Si no: usa valor configurado (topeado por horario)
- **NO cuenta** eventos en días donde el empleado ya tiene ausencia

#### Cálculo de Carga Semanal

```typescript
getEmployeeLoadForWeek(employeeId, weekStart, effectiveStart?, effectiveEnd?) => {
  hours: number;           // Horas asignadas en la semana
  capacity: number;        // Capacidad disponible (considerando ausencias/eventos)
  baseCapacity: number;    // Capacidad base sin reducciones
  status: LoadStatus;       // 'empty' | 'healthy' | 'warning' | 'overload'
  percentage: number;       // % de ocupación
  breakdown: Array<{       // Desglose de reducciones
    reason: string;
    hours: number;
    type: 'absence' | 'event';
  }>;
}
```

**Fórmula**:
```
capacity = baseCapacity - absenceHours - eventHours
percentage = (hours / capacity) × 100
status = 
  - 'empty' si hours === 0
  - 'overload' si hours > capacity
  - 'warning' si percentage > 80
  - 'healthy' en otro caso
```

---

## 🛠️ Guías de Desarrollo

### Estructura de Componentes

#### Componentes de Página
- Ubicados en `src/pages/`
- Usan lazy loading para mejor rendimiento
- Protegidos por `PermissionProtectedRoute`

#### Componentes Reutilizables
- Ubicados en `src/components/`
- Organizados por funcionalidad (employee, planner, team, etc.)
- Usan componentes Shadcn/ui como base

#### Hooks Personalizados
- `usePermissions`: Gestión de permisos
- `useApp`: Acceso al contexto global
- `useAuth`: Estado de autenticación

### Patrones de Código

#### Estado Global
```typescript
// Usar AppContext para datos globales
const { employees, projects, allocations, addAllocation } = useApp();
```

#### Validaciones
```typescript
// Usar Zod para schemas
const schema = z.object({
  name: z.string().min(1),
  hours: z.number().min(0.1)
});
```

#### Manejo de Errores
```typescript
try {
  await addAllocation(data);
  toast.success('Tarea creada');
} catch (error) {
  console.error('Error:', error);
  toast.error('Error al crear tarea');
}
```

### Testing

```bash
# Ejecutar tests
npm test

# Tests con UI
npm run test:ui

# Coverage
npm run test:coverage
```

### Linting

```bash
npm run lint
```

---

## 🔧 Troubleshooting

### Problemas Comunes

#### 1. Error "Cannot access '_' before initialization"
**Causa**: Orden de inicialización incorrecto en componentes
**Solución**: Usar `useMemo` para cálculos dependientes

#### 2. Tooltips no funcionan
**Causa**: Múltiples `TooltipProvider` anidados
**Solución**: Usar solo el provider del nivel superior

#### 3. Tareas no aparecen después de crearlas
**Causa**: Filtros demasiado restrictivos en `useMemo`
**Solución**: Verificar lógica de filtrado, incluir todas las semanas relevantes

#### 4. Permisos no funcionan
**Causa**: Permiso no está en `ROUTE_PERMISSIONS` o está mal mapeado
**Solución**: Verificar mapeo en `src/types/permissions.ts`

#### 5. Weekly no muestra tareas transferidas
**Causa**: Lógica de detección no encuentra `transferredFromAllocationId`
**Solución**: Verificar que el campo se guarde correctamente al transferir

#### 6. Planificador muestra semana 1 en lugar de actual
**Causa**: `selectedWeekIndex` no se resetea o `currentWeekIndex` se calcula mal
**Solución**: Resetear `selectedWeekIndex` a `null` al abrir modal, usar `currentWeekIndex` del hook

### Debugging

#### Logs del Sistema
- Los logs se escriben en consola del navegador
- Prefijos: `[AppContext]`, `[AuthContext]`, `[WelcomeTour]`

#### Verificar Estado
```typescript
// En consola del navegador
console.log(window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
```

#### Verificar Permisos
```typescript
// En componente
const { permissions, canAccess } = usePermissions();
console.log('Permisos:', permissions);
console.log('Puede acceder a /planner:', canAccess('/planner'));
```

---

## 📄 Licencia

MIT License - Desarrollado con ❤️ por el equipo de Timeboxing.

---

## 🙏 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📞 Soporte

Para soporte, contacta al equipo de desarrollo o abre un issue en el repositorio.

---

**Última actualización**: Enero 2025
