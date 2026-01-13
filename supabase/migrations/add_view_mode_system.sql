-- =====================================================
-- Migration: Add View Mode System with Strict/Flexible Control
-- Description: Allows agencies to configure default views per 
--              department with strict/flexible policies
-- =====================================================

-- 1. Create the view_mode ENUM type (if not exists)
DO $$ BEGIN
    CREATE TYPE view_mode_type AS ENUM ('weekly', 'daily');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create department_config table for view settings per department
CREATE TABLE IF NOT EXISTS public.department_config (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    department_name text NOT NULL,
    default_view view_mode_type DEFAULT 'weekly',
    is_view_strict boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Unique constraint: one config per department per agency
    CONSTRAINT department_config_agency_department_unique UNIQUE (agency_id, department_name)
);

-- 3. Add preferred_view column to employees table for user preferences
DO $$ BEGIN
    ALTER TABLE public.employees 
    ADD COLUMN preferred_view view_mode_type DEFAULT NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- 4. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_department_config_agency_id 
ON public.department_config(agency_id);

CREATE INDEX IF NOT EXISTS idx_department_config_department_name 
ON public.department_config(department_name);

-- 5. Enable RLS on department_config
ALTER TABLE public.department_config ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for department_config
-- Allow read access to authenticated users in the same agency
DROP POLICY IF EXISTS "Allow read access to agency members" ON public.department_config;
CREATE POLICY "Allow read access to agency members"
ON public.department_config
FOR SELECT
USING (
    agency_id IN (
        SELECT e.agency_id 
        FROM public.employees e 
        WHERE e.user_id = auth.uid()
    )
);

-- Allow insert/update/delete to agency members (we'll handle permission checks in the app layer)
DROP POLICY IF EXISTS "Allow write access to agency admins" ON public.department_config;
CREATE POLICY "Allow write access to agency admins"
ON public.department_config
FOR ALL
USING (
    agency_id IN (
        SELECT e.agency_id 
        FROM public.employees e 
        WHERE e.user_id = auth.uid()
    )
);

-- 7. Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_department_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS department_config_updated_at ON public.department_config;
CREATE TRIGGER department_config_updated_at
    BEFORE UPDATE ON public.department_config
    FOR EACH ROW
    EXECUTE FUNCTION update_department_config_updated_at();

-- 8. Grant permissions
GRANT ALL ON public.department_config TO authenticated;
GRANT ALL ON public.department_config TO service_role;

-- Done!
COMMENT ON TABLE public.department_config IS 'Stores view mode configuration per department per agency';
COMMENT ON COLUMN public.department_config.default_view IS 'Default view mode: weekly or daily';
COMMENT ON COLUMN public.department_config.is_view_strict IS 'If true, employees cannot override the default view';
COMMENT ON COLUMN public.employees.preferred_view IS 'User preferred view mode (only used if department is not strict)';
