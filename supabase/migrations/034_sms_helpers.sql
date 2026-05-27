-- ============================================================
-- Migration 034 — Helpers SMS + table sms_verification_codes
-- Idempotent : la table existe déjà en 001, on complète le schéma
-- ============================================================

CREATE TABLE IF NOT EXISTS sms_verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  purpose TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Colonne attempts absente ou nullable sur les bases créées via 001
ALTER TABLE sms_verification_codes
  ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 0;

UPDATE sms_verification_codes
SET attempts = 0
WHERE attempts IS NULL;

CREATE INDEX IF NOT EXISTS sms_codes_phone_purpose_idx
  ON sms_verification_codes(phone, purpose)
  WHERE verified_at IS NULL;

CREATE OR REPLACE FUNCTION increment_sms_attempts(p_phone TEXT, p_purpose TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE sms_verification_codes
  SET attempts = COALESCE(attempts, 0) + 1
  WHERE phone = p_phone
    AND purpose = p_purpose
    AND verified_at IS NULL;
END;
$$;

ALTER TABLE sms_verification_codes ENABLE ROW LEVEL SECURITY;
