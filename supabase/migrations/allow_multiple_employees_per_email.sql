-- Migration to allow multiple employees with the same email in different agencies
-- This allows a user to appear in the team of all their agencies simultaneously

-- 1. Remove existing unique constraint on email (if exists)
DO $$
BEGIN
  -- Try to remove unique constraint on email if it exists
  IF EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'employees_email_key' 
    AND conrelid = 'employees'::regclass
  ) THEN
    ALTER TABLE employees DROP CONSTRAINT employees_email_key;
    RAISE NOTICE 'Unique constraint employees_email_key removed';
  END IF;
END $$;

-- 2. Create a composite unique constraint on (email, agency_id)
-- This allows the same email in different agencies, but no duplicates in the same agency
DO $$
BEGIN
  -- Check if composite index already exists
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_indexes 
    WHERE indexname = 'employees_email_agency_unique'
  ) THEN
    -- Create unique composite index
    CREATE UNIQUE INDEX employees_email_agency_unique 
    ON employees(email, agency_id) 
    WHERE email IS NOT NULL;
    
    RAISE NOTICE 'Composite unique constraint (email, agency_id) created';
  ELSE
    RAISE NOTICE 'Composite unique index already exists';
  END IF;
END $$;

-- 3. Create index to improve email searches (without unique constraint)
-- This improves performance of email searches
CREATE INDEX IF NOT EXISTS idx_employees_email 
ON employees(email) 
WHERE email IS NOT NULL;

-- 4. Ensure index exists on (user_id, agency_id) for efficient searches
CREATE INDEX IF NOT EXISTS idx_employees_user_agency 
ON employees(user_id, agency_id) 
WHERE user_id IS NOT NULL;

