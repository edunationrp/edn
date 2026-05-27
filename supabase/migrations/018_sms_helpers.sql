-- ============================================================
-- Migration 018 — Helpers SMS + table sms_verification_codes
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

CREATE INDEX IF NOT EXISTS sms_codes_phone_purpose_idx
  ON sms_verification_codes(phone, purpose)
  WHERE verified_at IS NULL;

-- Fonction increment_sms_attempts — fix bug verify-sms-code edge function
CREATE OR REPLACE FUNCTION increment_sms_attempts(p_phone TEXT, p_purpose TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE sms_verification_codes
  SET attempts = attempts + 1
  WHERE phone = p_phone
    AND purpose = p_purpose
    AND verified_at IS NULL;
END;
$$;

-- RLS sur sms_verification_codes : accès admin uniquement (via service role)
ALTER TABLE sms_verification_codes ENABLE ROW LEVEL SECURITY;
-- Pas de politique SELECT/INSERT/UPDATE publique — tout passe par le service role
