-- Add agency_id to meta_ads_campaigns
ALTER TABLE IF EXISTS meta_ads_campaigns 
ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_meta_ads_campaigns_agency_id ON meta_ads_campaigns(agency_id);

-- Add agency_id to google_ads_campaigns
ALTER TABLE IF EXISTS google_ads_campaigns 
ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_google_ads_campaigns_agency_id ON google_ads_campaigns(agency_id);

-- Add agency_id to meta_sync_logs
ALTER TABLE IF EXISTS meta_sync_logs 
ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_meta_sync_logs_agency_id ON meta_sync_logs(agency_id);

-- Add agency_id to ads_sync_logs
ALTER TABLE IF EXISTS ads_sync_logs 
ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_ads_sync_logs_agency_id ON ads_sync_logs(agency_id);

-- Enable RLS and add policies (Strict Isolation)

-- Meta & Google Campaigns Policies
ALTER TABLE meta_ads_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_ads_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agencies can view their own meta campaigns" ON meta_ads_campaigns
    FOR SELECT USING (
        agency_id IN (
            SELECT agency_id FROM employees WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Agencies can view their own google campaigns" ON google_ads_campaigns
    FOR SELECT USING (
        agency_id IN (
            SELECT agency_id FROM employees WHERE user_id = auth.uid()
        )
    );

-- Logs Policies
ALTER TABLE meta_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agencies can view their own meta logs" ON meta_sync_logs
    FOR SELECT USING (
        agency_id IN (
            SELECT agency_id FROM employees WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Agencies can view their own ads logs" ON ads_sync_logs
    FOR SELECT USING (
        agency_id IN (
            SELECT agency_id FROM employees WHERE user_id = auth.uid()
        )
    );
