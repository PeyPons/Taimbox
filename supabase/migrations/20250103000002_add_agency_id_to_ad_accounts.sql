-- Migration: Add agency_id to ad_accounts_config
ALTER TABLE IF EXISTS ad_accounts_config
ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE ad_accounts_config ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their agency's ad accounts" ON ad_accounts_config;
CREATE POLICY "Users can view their agency's ad accounts" ON ad_accounts_config
    FOR SELECT
    USING (
        agency_id IN (
            SELECT agency_id FROM employees WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert their agency's ad accounts" ON ad_accounts_config;
CREATE POLICY "Users can insert their agency's ad accounts" ON ad_accounts_config
    FOR INSERT
    WITH CHECK (
        agency_id IN (
            SELECT agency_id FROM employees WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete their agency's ad accounts" ON ad_accounts_config;
CREATE POLICY "Users can delete their agency's ad accounts" ON ad_accounts_config
    FOR DELETE
    USING (
        agency_id IN (
            SELECT agency_id FROM employees WHERE user_id = auth.uid()
        )
    );
