-- ============================================================
-- Row-Level Security (RLS) Policies
-- Multi-Tenant Isolation at Database Level
-- ============================================================

-- Create application role for RLS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
        CREATE ROLE app_user;
    END IF;
END $$;

-- ============================================================
-- Enable RLS on all tenant-bound tables
-- ============================================================
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies: company_users
-- ============================================================
CREATE POLICY company_users_tenant_isolation ON company_users
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY company_users_insert ON company_users
    FOR INSERT WITH CHECK (company_id = current_setting('app.current_company_id')::UUID);

-- ============================================================
-- RLS Policies: fiscal_periods
-- ============================================================
CREATE POLICY fiscal_periods_tenant_isolation ON fiscal_periods
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY fiscal_periods_insert ON fiscal_periods
    FOR INSERT WITH CHECK (company_id = current_setting('app.current_company_id')::UUID);

-- ============================================================
-- RLS Policies: chart_of_accounts
-- ============================================================
CREATE POLICY coa_tenant_isolation ON chart_of_accounts
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY coa_insert ON chart_of_accounts
    FOR INSERT WITH CHECK (company_id = current_setting('app.current_company_id')::UUID);

-- ============================================================
-- RLS Policies: journal_entries
-- ============================================================
CREATE POLICY journal_entries_tenant_isolation ON journal_entries
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY journal_entries_insert ON journal_entries
    FOR INSERT WITH CHECK (company_id = current_setting('app.current_company_id')::UUID);

-- ============================================================
-- RLS Policies: journal_lines
-- ============================================================
CREATE POLICY journal_lines_tenant_isolation ON journal_lines
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY journal_lines_insert ON journal_lines
    FOR INSERT WITH CHECK (company_id = current_setting('app.current_company_id')::UUID);

-- ============================================================
-- RLS Policies: contacts
-- ============================================================
CREATE POLICY contacts_tenant_isolation ON contacts
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY contacts_insert ON contacts
    FOR INSERT WITH CHECK (company_id = current_setting('app.current_company_id')::UUID);

-- ============================================================
-- RLS Policies: invoices
-- ============================================================
CREATE POLICY invoices_tenant_isolation ON invoices
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY invoices_insert ON invoices
    FOR INSERT WITH CHECK (company_id = current_setting('app.current_company_id')::UUID);

-- ============================================================
-- RLS Policies: invoice_lines
-- ============================================================
CREATE POLICY invoice_lines_tenant_isolation ON invoice_lines
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY invoice_lines_insert ON invoice_lines
    FOR INSERT WITH CHECK (company_id = current_setting('app.current_company_id')::UUID);

-- ============================================================
-- RLS Policies: payments
-- ============================================================
CREATE POLICY payments_tenant_isolation ON payments
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY payments_insert ON payments
    FOR INSERT WITH CHECK (company_id = current_setting('app.current_company_id')::UUID);

-- ============================================================
-- RLS Policies: audit_logs
-- ============================================================
CREATE POLICY audit_logs_tenant_isolation ON audit_logs
    USING (company_id = current_setting('app.current_company_id')::UUID);

CREATE POLICY audit_logs_insert ON audit_logs
    FOR INSERT WITH CHECK (company_id = current_setting('app.current_company_id')::UUID);

-- ============================================================
-- Grant permissions to app_user
-- ============================================================
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Explicitly prevent DELETE on audit_logs for app_user
REVOKE DELETE ON audit_logs FROM app_user;
