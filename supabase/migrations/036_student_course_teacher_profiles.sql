-- ============================================================
-- Migration 036 — Élèves : lire le nom des profs auteurs de cours
-- Idempotent
-- ============================================================

DROP POLICY IF EXISTS "profiles_select_student_course_teachers" ON profiles;
CREATE POLICY "profiles_select_student_course_teachers"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM course_resources cr
      JOIN student_enrollments se ON se.class_id = cr.class_id
      JOIN students s ON s.id = se.student_id
      WHERE s.user_id = auth.uid()
        AND se.status = 'active'
        AND cr.uploaded_by = profiles.id
        AND cr.is_published = TRUE
    )
  );
