-- Retrait définitif d'un membre du personnel (lien user_school_roles)

DROP POLICY IF EXISTS "user_school_roles_delete" ON user_school_roles;
CREATE POLICY "user_school_roles_delete" ON user_school_roles FOR DELETE
  USING (
    is_super_admin() OR
    has_any_school_role(school_id, ARRAY['PROVISEUR', 'FONDATEUR'])
  );
