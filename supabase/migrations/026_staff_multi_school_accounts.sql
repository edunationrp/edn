-- Comptes personnel : même email de contact, mot de passe distinct par établissement.
-- Chaque adhésion école = un auth.users dédié (email technique staff.*@login.edunation.internal).

CREATE INDEX IF NOT EXISTS idx_profiles_email_lower ON profiles (lower(trim(email)));

CREATE OR REPLACE FUNCTION public.lookup_staff_schools_by_contact_email(p_email text)
RETURNS TABLE (
  school_id uuid,
  school_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT s.id, s.name
  FROM profiles p
  JOIN user_school_roles usr ON usr.user_id = p.id AND usr.is_active = true
  JOIN schools s ON s.id = usr.school_id
  WHERE lower(trim(p.email)) = lower(trim(p_email))
    AND usr.role_code NOT IN ('ELEVE', 'PARENT', 'PARENT_ILLETRE')
  ORDER BY s.name;
$$;

REVOKE ALL ON FUNCTION public.lookup_staff_schools_by_contact_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_staff_schools_by_contact_email(text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.staff_contact_email_used_at_school(
  p_school_id uuid,
  p_email text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles p
    JOIN user_school_roles usr ON usr.user_id = p.id
    WHERE usr.school_id = p_school_id
      AND lower(trim(p.email)) = lower(trim(p_email))
  );
$$;

REVOKE ALL ON FUNCTION public.staff_contact_email_used_at_school(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.staff_contact_email_used_at_school(uuid, text) TO service_role;
