-- Fix Weekly Feedback RLS Policies

-- Ensure RLS is enabled
ALTER TABLE weekly_feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON weekly_feedback;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON weekly_feedback;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON weekly_feedback;

-- Create comprehensive policies for authenticated users
-- These policies allow any logged-in user to read, insert, and update feedback
-- This is necessary for the Weekly Report dialog to function correctly

CREATE POLICY "Enable read access for authenticated users" ON weekly_feedback
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON weekly_feedback
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON weekly_feedback
    FOR UPDATE
    TO authenticated
    USING (true);

-- Also allow delete just in case
CREATE POLICY "Enable delete access for authenticated users" ON weekly_feedback
    FOR DELETE
    TO authenticated
    USING (true);
