-- Migration: Limpieza de funcionalidades eliminadas (sin deuda técnica)
-- - Módulo de control presupuestario (Marketing): eliminar tablas y datos
-- - Modo Zen: normalizar valores 'daily' a 'weekly' en department_config y employees
--
-- Ejecutar en Supabase SQL Editor o con: supabase db push
-- IMPORTANTE: Haz backup de la base de datos antes de ejecutar en producción.

-- =============================================================================
-- 1. ELIMINAR TABLAS DEL MÓDULO MARKETING (control presupuestario)
-- Orden: primero tablas que referencian a otras, al final las raíz
-- =============================================================================

-- 1.1 Tablas que referencian marketing_monthly_plans
DROP TABLE IF EXISTS public.budget_movements CASCADE;
DROP TABLE IF EXISTS public.marketing_expenses CASCADE;

-- 1.2 Planes mensuales (referencian marketing_categories)
DROP TABLE IF EXISTS public.marketing_monthly_plans CASCADE;

-- 1.3 Categorías (referencian marketing_budgets)
DROP TABLE IF EXISTS public.marketing_categories CASCADE;

-- 1.4 Presupuestos de marketing (raíz)
DROP TABLE IF EXISTS public.marketing_budgets CASCADE;

-- =============================================================================
-- 2. NORMALIZAR DATOS DEL MODO ZEN (vista "daily" eliminada)
-- Todas las vistas se tratan como "weekly" en la app; normalizamos en BD
-- =============================================================================

-- 2.1 department_config: si default_view era 'daily', pasar a 'weekly'
UPDATE public.department_config
SET default_view = 'weekly'::view_mode_type,
    updated_at = timezone('utc', now())
WHERE default_view = 'daily'::view_mode_type;

-- 2.2 employees: si preferred_view era 'daily', pasar a 'weekly'
UPDATE public.employees
SET preferred_view = 'weekly'::view_mode_type
WHERE preferred_view = 'daily'::view_mode_type;

-- =============================================================================
-- 3. OPCIONAL: Restringir el tipo enum (evitar que se vuelva a guardar 'daily')
-- Si view_mode_type es un enum con 'daily' y 'weekly', podemos dejarlo por
-- compatibilidad con datos históricos o restringirlo. Comentado por si en tu
-- esquema el tipo se usa en más sitios; descomenta si quieres dejar solo 'weekly'.
-- =============================================================================
-- ALTER TYPE view_mode_type RENAME TO view_mode_type_old;
-- CREATE TYPE view_mode_type AS ENUM ('weekly');
-- ALTER TABLE public.department_config
--   ALTER COLUMN default_view TYPE view_mode_type USING default_view::text::view_mode_type;
-- ALTER TABLE public.employees
--   ALTER COLUMN preferred_view TYPE view_mode_type USING preferred_view::text::view_mode_type;
-- DROP TYPE view_mode_type_old;
