-- EduNation - Migration 008 : visibilité profils / rôles pour la messagerie

-- Les membres d'une école peuvent voir les rôles actifs de leurs collègues
DROP POLICY IF EXISTS "user_school_roles_select_school" ON user_school_roles;
CREATE POLICY "user_school_roles_select_school" ON user_school_roles FOR SELECT
  USING (can_access_school(school_id));

-- Les membres d'une école peuvent voir les profils de leurs collègues
DROP POLICY IF EXISTS "profiles_select_school_peers" ON profiles;
CREATE POLICY "profiles_select_school_peers" ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM user_school_roles mine
      JOIN user_school_roles theirs ON mine.school_id = theirs.school_id
      WHERE mine.user_id = auth.uid()
        AND theirs.user_id = profiles.id
        AND mine.is_active = true
        AND theirs.is_active = true
    )
  );
