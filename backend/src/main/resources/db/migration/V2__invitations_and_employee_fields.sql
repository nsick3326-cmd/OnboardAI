-- ============================================================================
-- V2__invitations_and_employee_fields.sql - Invitations & Employee Extensions
-- ============================================================================

-- 1. Extend employees table with full_name, email, phone_number, employment_type
ALTER TABLE employees ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employment_type VARCHAR(50) DEFAULT 'FULL_TIME';

-- Backfill full_name and email from users table for existing records
UPDATE employees e
SET full_name = u.full_name,
    email = u.email
FROM users u
WHERE e.user_id = u.id AND (e.full_name IS NULL OR e.email IS NULL);

CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(organization_id, email);

-- 2. Invitations table
CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    department VARCHAR(100) NOT NULL,
    job_title VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'EMPLOYEE',
    employment_type VARCHAR(50) DEFAULT 'FULL_TIME',
    token_hash VARCHAR(64) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    invited_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_invitation_token_hash UNIQUE (token_hash)
);

CREATE INDEX IF NOT EXISTS idx_invitations_org ON invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_org_status ON invitations(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(organization_id, email);
CREATE INDEX IF NOT EXISTS idx_invitations_token_hash ON invitations(token_hash);
CREATE INDEX IF NOT EXISTS idx_invitations_emp ON invitations(employee_id);
