-- Compléments suppression personnel : politiques manquantes pour teacher_assignments et classes

DROP POLICY IF EXISTS "user_school_roles_delete" ON user_school_roles;
CREATE POLICY "user_school_roles_delete" ON user_school_roles FOR DELETE
  USING (
    is_super_admin() OR
    has_any_school_role(school_id, ARRAY['PROVISEUR', 'FONDATEUR'])
  );

DROP POLICY IF EXISTS "teacher_assignments_update_staff" ON teacher_assignments;
CREATE POLICY "teacher_assignments_update_staff" ON teacher_assignments FOR UPDATE
  USING (
    is_super_admin() OR
    has_any_school_role(school_id, ARRAY['PROVISEUR', 'FONDATEUR'])
  );
