-- ============================================================
-- Migration 039 — Inscription parent : profil idempotent + email unique
-- Idempotent
-- ============================================================

-- Garantir un seul trigger et un upsert sur profiles (évite profiles_pkey)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contact_email text;
BEGIN
  v_contact_email := NULLIF(
    TRIM(COALESCE(NEW.raw_user_meta_data->>'contact_email', NEW.email)),
    ''
  );

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    country,
    preferred_language,
    default_role,
    is_active
  )
  VALUES (
    NEW.id,
    v_contact_email,
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), ''),
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'phone', '')), ''),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'country'), ''), 'BF'),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'preferred_language'), ''), 'fr'),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'default_role'), ''), 'PROVISEUR'),
    TRUE
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    country = COALESCE(EXCLUDED.country, public.profiles.country),
    preferred_language = COALESCE(EXCLUDED.preferred_language, public.profiles.preferred_language),
    default_role = COALESCE(EXCLUDED.default_role, public.profiles.default_role),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Mise à jour profil parent sans second INSERT côté application
CREATE OR REPLACE FUNCTION public.finalize_parent_profile(
  p_user_id UUID,
  p_full_name TEXT,
  p_email TEXT,
  p_phone TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    full_name = p_full_name,
    email = p_email,
    phone = p_phone,
    default_role = 'PARENT',
    is_active = TRUE,
    updated_at = NOW()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.profiles (id, full_name, email, phone, default_role, is_active)
    VALUES (p_user_id, p_full_name, p_email, p_phone, 'PARENT', TRUE)
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      default_role = 'PARENT',
      is_active = TRUE,
      updated_at = NOW();
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_parent_profile(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_parent_profile(UUID, TEXT, TEXT, TEXT) TO service_role;

-- Un même Gmail ne peut pas créer plusieurs comptes parent
DROP INDEX IF EXISTS parent_accounts_contact_email_idx;
CREATE UNIQUE INDEX IF NOT EXISTS parent_accounts_contact_email_lower_idx
  ON parent_accounts (lower(trim(contact_email)))
  WHERE contact_email IS NOT NULL;

-- Reprise d'inscription interrompue (auth créé, parent_accounts pas encore inséré)
ALTER TABLE parent_registration_sessions
  ADD COLUMN IF NOT EXISTS pending_auth_user_id UUID,
  ADD COLUMN IF NOT EXISTS pending_parent_code TEXT,
  ADD COLUMN IF NOT EXISTS pending_auth_email TEXT;
