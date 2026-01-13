-- =====================================================
-- Migration: Add User Priority to Allocations
-- Description: Allows employees to set personal task priorities
-- =====================================================

-- 1. Add user_priority column to allocations table
-- NULL = use default ordering (by hours assigned)
-- Lower numbers = higher priority
DO $$ BEGIN
    ALTER TABLE public.allocations 
    ADD COLUMN user_priority integer DEFAULT NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- 2. Create index for faster ordering queries
CREATE INDEX IF NOT EXISTS idx_allocations_user_priority 
ON public.allocations(employee_id, week_start_date, user_priority)
WHERE user_priority IS NOT NULL;

-- Done!
COMMENT ON COLUMN public.allocations.user_priority IS 'User-defined priority order. NULL means use default ordering. Lower values = higher priority.';
