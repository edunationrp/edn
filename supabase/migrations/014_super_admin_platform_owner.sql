-- Super admin = propriétaire SaaS EduNation (pas rattaché à un établissement)
-- Reconnu via profiles.default_role, sans obligation de user_school_roles

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND default_role = 'SUPER_ADMIN_EDUNATION'
      AND is_active = TRUE
  )
  OR EXISTS (
    SELECT 1 FROM user_school_roles
    WHERE user_id = auth.uid()
      AND role_code = 'SUPER_ADMIN_EDUNATION'
      AND is_active = TRUE
  );
END;
$$;
