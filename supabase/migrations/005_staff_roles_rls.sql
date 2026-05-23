-- EduNation - Migration 005 : invitations personnel + gestion roles

ALTER TABLE staff_invitations ADD COLUMN IF NOT EXISTS invited_email TEXT;
ALTER TABLE staff_invitations ADD COLUMN IF NOT EXISTS invited_name TEXT;

-- Invitations personnel
DROP POLICY IF EXISTS "staff_invitations_select" ON staff_invitations;
CREATE POLICY "staff_invitations_select" ON staff_invitations FOR SELECT
  USING (
    is_super_admin() OR
    has_any_school_role(school_id, ARRAY['PROVISEUR', 'FONDATEUR', 'SECRETAIRE'])
  );

DROP POLICY IF EXISTS "staff_invitations_insert" ON staff_invitations;
CREATE POLICY "staff_invitations_insert" ON staff_invitations FOR INSERT
  WITH CHECK (
    is_super_admin() OR
    has_any_school_role(school_id, ARRAY['PROVISEUR', 'FONDATEUR'])
  );

DROP POLICY IF EXISTS "staff_invitations_update" ON staff_invitations;
CREATE POLICY "staff_invitations_update" ON staff_invitations FOR UPDATE
  USING (
    is_super_admin() OR
    has_any_school_role(school_id, ARRAY['PROVISEUR', 'FONDATEUR'])
  );

-- Gestion des roles (activation / desactivation)
DROP POLICY IF EXISTS "user_school_roles_update" ON user_school_roles;
CREATE POLICY "user_school_roles_update" ON user_school_roles FOR UPDATE
  USING (
    is_super_admin() OR
    has_any_school_role(school_id, ARRAY['PROVISEUR', 'FONDATEUR'])
  );

DROP POLICY IF EXISTS "user_school_roles_insert" ON user_school_roles;
CREATE POLICY "user_school_roles_insert" ON user_school_roles FOR INSERT
  WITH CHECK (
    is_super_admin() OR
    has_any_school_role(school_id, ARRAY['PROVISEUR', 'FONDATEUR'])
  );
