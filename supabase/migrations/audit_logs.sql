-- Audit Logs Migration
-- Run this SQL in Supabase SQL Editor or via CLI

-- Create the audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  agency_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
  resource TEXT NOT NULL CHECK (resource IN ('ALLOCATION', 'PROJECT', 'EMPLOYEE', 'CLIENT', 'ABSENCE', 'TEAM_EVENT')),
  resource_id UUID NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_agency ON audit_logs(agency_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);

-- Enable Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see logs from their agency
CREATE POLICY "Users can view agency audit logs" ON audit_logs
  FOR SELECT USING (
    agency_id IN (
      SELECT agency_id FROM employees WHERE user_id = auth.uid()
    )
  );

-- Policy: Insert allowed for authenticated users from same agency
CREATE POLICY "Users can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (
    agency_id IN (
      SELECT agency_id FROM employees WHERE user_id = auth.uid()
    )
  );

-- Comment on table
COMMENT ON TABLE audit_logs IS 'Audit trail for tracking all CRUD operations on critical resources';
COMMENT ON COLUMN audit_logs.action IS 'Type of action: CREATE, UPDATE, DELETE';
COMMENT ON COLUMN audit_logs.resource IS 'Resource type being audited';
COMMENT ON COLUMN audit_logs.details IS 'JSON containing previous and new values for the changed resource';
