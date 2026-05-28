-- ============================================================
-- Migration 038 — Comptes parents (identifiant E0… + inscription)
-- Idempotent
-- ============================================================

CREATE TABLE IF NOT EXISTS parent_registration_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel TEXT NOT NULL CHECK (channel IN ('phone', 'gmail')),
  phone TEXT,
  email TEXT,
  code_hash TEXT NOT NULL,
  otp_verified BOOLEAN NOT NULL DEFAULT FALSE,
  otp_attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT parent_reg_session_destination CHECK (
    (channel = 'phone' AND phone IS NOT NULL)
    OR (channel = 'gmail' AND email IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS parent_reg_sessions_phone_idx
  ON parent_registration_sessions(phone, channel)
  WHERE consumed_at IS NULL AND otp_verified = FALSE;

CREATE INDEX IF NOT EXISTS parent_reg_sessions_email_idx
  ON parent_registration_sessions(email, channel)
  WHERE consumed_at IS NULL AND otp_verified = FALSE;

CREATE TABLE IF NOT EXISTS parent_accounts (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  parent_code TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  phone_primary TEXT NOT NULL,
  phone_secondary TEXT,
  contact_email TEXT,
  registration_channel TEXT NOT NULL CHECK (registration_channel IN ('phone', 'gmail')),
  auth_email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS parent_accounts_phone_primary_idx
  ON parent_accounts(phone_primary);

CREATE INDEX IF NOT EXISTS parent_accounts_contact_email_idx
  ON parent_accounts(contact_email)
  WHERE contact_email IS NOT NULL;

DROP TRIGGER IF EXISTS update_parent_accounts_updated_at ON parent_accounts;
CREATE TRIGGER update_parent_accounts_updated_at
  BEFORE UPDATE ON parent_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE parent_registration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "parent_accounts_select_own" ON parent_accounts;
CREATE POLICY "parent_accounts_select_own"
  ON parent_accounts FOR SELECT
  USING (id = auth.uid());
