-- ============================================
-- Migración: Agregar setup_completed a agencies
-- Objetivo: Controlar si una agencia ha completado el onboarding
-- ============================================

-- Agregar columna setup_completed
ALTER TABLE agencies 
ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT false;

-- Actualizar agencias existentes como completadas
UPDATE agencies SET setup_completed = true WHERE setup_completed IS NULL OR setup_completed = false;

-- Comentario
COMMENT ON COLUMN agencies.setup_completed IS 'Indica si la agencia completó el wizard de onboarding inicial';
