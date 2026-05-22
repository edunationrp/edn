-- Fix: "Database error saving new user" on signup
-- Pre-requis: migrations 001 et 002 appliquees

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
    NEW.email,
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), ''),
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'phone', '')), ''),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'country'), ''), 'BF'),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'preferred_language'), ''), 'fr'),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'default_role'), ''), 'PROVISEUR'),
    TRUE
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
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

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO postgres, service_role;
