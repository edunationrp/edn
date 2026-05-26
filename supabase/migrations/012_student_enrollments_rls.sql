-- Policies RLS manquantes sur student_enrollments (RLS activé sans policy = aucune ligne visible)

DROP POLICY IF EXISTS "student_enrollments_select" ON student_enrollments;
CREATE POLICY "student_enrollments_select" ON student_enrollments FOR SELECT
  USING (
    is_super_admin() OR
    can_access_school(school_id) OR
    is_parent_of_student(student_id) OR
    is_student_owner(student_id)
  );

DROP POLICY IF EXISTS "student_enrollments_insert" ON student_enrollments;
CREATE POLICY "student_enrollments_insert" ON student_enrollments FOR INSERT
  WITH CHECK (
    is_super_admin() OR
    has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'SECRETAIRE', 'SUPER_ADMIN_EDUNATION']
    )
  );

DROP POLICY IF EXISTS "student_enrollments_update" ON student_enrollments;
CREATE POLICY "student_enrollments_update" ON student_enrollments FOR UPDATE
  USING (
    is_super_admin() OR
    has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'SECRETAIRE', 'SUPER_ADMIN_EDUNATION']
    )
  );

DROP POLICY IF EXISTS "student_enrollments_delete" ON student_enrollments;
CREATE POLICY "student_enrollments_delete" ON student_enrollments FOR DELETE
  USING (
    is_super_admin() OR
    has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'SECRETAIRE', 'SUPER_ADMIN_EDUNATION']
    )
  );
