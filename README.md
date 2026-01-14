# Timeboxing - Agency Resource Planning & AI Reporting

Sistema integral de gestión de recursos, planificación de tiempo (Timeboxing) y reporting automatizado con IA para agencias digitales. Diseñado para optimizar la asignación de equipos, controlar la capacidad real y generar insights de negocio mediante inteligencia artificial.

## 🚀 Overview

**Timeboxing** no es solo un calendario; es un **ERP ligero para agencias de servicios**. Permite gestionar empleados, proyectos, ausencias y entregables, con un fuerte enfoque en la "Capacidad Real" (horas disponibles vs. horas vendidas).

### Core Features

*   **📅 Planner Interactivo**: Grid de asignación semanal/mensual con soporte para Drag & Drop (implícito en la lógica de UI).
*   **🧠 AI Intelligence Layer**: Sistema de reporte automático para Google Ads y Meta Ads usando un sistema de IA en "cascada" (Gemini -> OpenRouter -> Llama).
*   **👥 Gestión de Capacidad (Team Capacity)**: Cálculo matemático preciso de horas disponibles, descontando ausencias (vacaciones, bajas) y festivos automáticamente.
*   **🔐 RBAC (Role-Based Access Control)**: Sistema de permisos granular configurable por agencia.
*   **🏢 Multi-Agency Architecture**: Soporte para múltiples organizaciones y configuraciones independientes.
*   **📈 Módulos Especializados**:
    *   **PPC/Ads**: Dashboard de rendimiento y generación de informes con IA.
    *   **Deadlines**: Gestión de entregables críticos.
    *   **OKRs**: Seguimiento de objetivos trimestrales.
    *   **Weekly**: Control de cierre de horas semanal.

---

## 🛠 Tech Stack

### Frontend Core
*   **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
*   **Language**: TypeScript 100%
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) + `tailwind-merge` + `clsx`
*   **UI Components**: [Radix UI](https://www.radix-ui.com/) (primitives) + Shadcn UI
*   **Icons**: Lucide React

### State & Data
*   **Server State**: [TanStack Query (React Query) v5](https://tanstack.com/query/latest)
*   **Routing**: React Router DOM v6 (Lazy Loading implementado)
*   **Forms**: React Hook Form + Zod (Validación de esquemas)
*   **Backend/Auth**: [Supabase](https://supabase.com/) (PostgreSQL + Auth + Realtime)

### AI Integration
*   **Primary**: Google Gemini 2.0 Flash
*   **Secondary**: OpenRouter (Llama 3, DeepSeek, etc.)
*   **Fallback**: Custom "Coco" internal API

---

## 🧠 Deep Dive: Critical Logic & Architecture

### 1. Sistema de IA en Cascada (`src/services/aiService.ts`)
El sistema no depende de un solo proveedor. Implementa una estrategia de **Fallback Recursivo** para garantizar que los reportes siempre se generen:

1.  **Intento 1**: Llama a **Google Gemini API**.
2.  **Intento 2 (Fallback)**: Si Gemini falla, conecta con **OpenRouter** e intenta iterar sobre una lista de ~20 modelos Open Source (Llama 3.3 70b, DeepSeek-R1, etc.) usando un sistema de lotes (`BATCH_SIZE=3`).
3.  **Intento 3 (Crisis)**: Si todo falla, recurre a la API interna de "Coco Solution".

> **Sanitización**: Todas las respuestas pasan por `cleanAIResponse` para eliminar markdown innecesario y asegurar un tono profesional corporativo.

### 2. Cálculo de Capacidad y Prevención de Doble Conteo (`src/utils/capacityUtils.ts`)
Uno de los puntos más críticos del sistema es calcular cuántas horas reales tiene un empleado.
*   **El Problema**: ¿Qué pasa si un empleado tiene vacaciones el "1 de Mayo" y a la vez hay un festivo nacional ese día? Si restamos ambos, la capacidad sería negativa.
*   **La Solución**: La función `getDailyReduction` calcula día por día:
    ```typescript
    MaxReduction = Math.max(HorasAusencia, HorasEventoEquipo)
    ```
    Nunca se suman reducciones superpuestas. Esto garantiza una precisión del 100% en los informes de disponibilidad.

### 3. Sistema de Permisos Dinámicos (`src/hooks/usePermissions.ts`)
La seguridad no está "hardcodeada" en el código cliente de forma estática.
*   Los roles se definen en el JSON de configuración de la agencia (`Settings`).
*   El hook `usePermissions` lee la configuración de la agencia activa.
*   **Fallback Seguro**: Si el rol de un usuario no existe en la configuración, el sistema le asigna automáticamente `RESTRICTED_PERMISSIONS` (solo lectura básica/settings), evitando brechas de seguridad.

### 4. Lazy Loading & Performance (`src/App.tsx`)
Para mantener la aplicación rápida:
*   Todas las rutas principales (`/planner`, `/team`, `/ads`) usan `lazyWithRetry`.
*   Esto divide el bundle de JS en pequeños trozos que se cargan bajo demanda.
*   El wrapper `lazyWithRetry` reintenta la carga si hay un fallo de red momentáneo antes de mostrar un error.

---

## 📂 Estructura del Proyecto

```bash
src/
├── components/       # Componentes UI (100+ archivos)
│   ├── auth/         # Guardias de seguridad (ModuleGuard, ProtectedRoute)
│   ├── planner/      # Grid del planificador y celdas
│   └── ui/           # Primitivas de diseño (Botones, Dialogs)
├── contexts/         # Estado Global
│   ├── AgencyContext.tsx  # Configuración de agencia y migraciones
│   ├── AppContext.tsx     # Datos maestros (Empleados, Proyectos)
│   └── AuthContext.tsx    # Sesión de usuario
├── hooks/            # Lógica reutilizable
│   ├── usePlannerData.ts  # Cerebro del Planificador (Fechas, Filtros)
│   └── usePermissions.ts  # Sistema de seguridad RBAC
├── pages/            # Vistas principales (Lazy Loaded)
├── services/         # Comunicación externa
│   └── aiService.ts  # Integración Gemini/OpenRouter
├── types/            # Definiciones TypeScript (Fuente de la verdad)
└── utils/            # Algoritmos puros
    ├── capacityUtils.ts   # Matemáticas de horas
    └── aiReportUtils.ts   # Generación de prompts
```

---

## 🔧 Configuración y Scripts

### Scripts Disponibles (`package.json`)

*   `npm run dev`: Inicia el servidor de desarrollo (Vite).
*   `npm run build`: Compila para producción.
*   `npm run preview`: Vista previa del build local.
*   `npm run lint`: Análisis estático de código.
*   `npm run test`: Ejecuta tests unitarios (Vitest).

### Variables de Entorno (.env)
El sistema requiere las siguientes keys para funcionar al 100%:
*   `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY`: Backend.
*   `VITE_GEMINI_API_KEY`: Para la IA primaria.
*   `VITE_OPENROUTER_API_KEY`: Para la IA de respaldo.

---

## 🧪 Data Models (Core Types)

*   **Allocation**: La unidad atómica de trabajo. Relaciona `Employee` + `Project` + `Date` + `Hours`.
*   **AgencySettings**: Objeto JSONB que controla qué módulos (`ppc`, `seo`) están activos para cada cliente.
*   **WorkSchedule**: Definición de la jornada laboral estándar (L-D) para cada empleado.

---

> Documentación actualizada automáticamente tras análisis profundo del código fuente.
> **Fecha**: Enero 2026.
