-- Migration to fix Allocations table for V4 System
-- 1. Ensure user_priority column exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'allocations' AND column_name = 'user_priority') THEN
        ALTER TABLE allocations ADD COLUMN user_priority integer DEFAULT 0;
    END IF;
END $$;

-- 2. Update Status Constraint to allow 'active' and 'in_progress' and 'cancelled'
-- First, try to drop the existing constraint if we can guess its name, usually 'allocations_status_check'.
-- If it has a different name, manual intervention might be needed, but this covers 99% of cases.
ALTER TABLE allocations DROP CONSTRAINT IF EXISTS allocations_status_check;

ALTER TABLE allocations 
    ADD CONSTRAINT allocations_status_check 
    CHECK (status IN ('planned', 'completed', 'active', 'in_progress', 'cancelled'));

-- 3. Add index for user_priority if helpful
CREATE INDEX IF NOT EXISTS idx_allocations_user_priority ON allocations(user_priority);
