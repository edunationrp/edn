-- Profil : email de contact (pas l'email technique Auth) + lookup auth.users pour reprise d'inscription.

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

CREATE OR REPLACE FUNCTION public.get_auth_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT id
  FROM auth.users
  WHERE lower(trim(email)) = lower(trim(p_email))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_auth_user_id_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_auth_user_id_by_email(text) TO service_role;
