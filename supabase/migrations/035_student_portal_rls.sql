-- ============================================================
-- Migration 035 — Portail élève : emploi du temps + ressources
-- Idempotent
-- ============================================================

-- Emploi du temps : l'élève lit les créneaux de sa classe active
DROP POLICY IF EXISTS "timetable_slots_select_student" ON timetable_slots;
CREATE POLICY "timetable_slots_select_student"
  ON timetable_slots FOR SELECT
  USING (
    class_id IN (
      SELECT se.class_id
      FROM student_enrollments se
      JOIN students s ON s.id = se.student_id
      WHERE s.user_id = auth.uid()
        AND se.status = 'active'
    )
  );

-- Pauses : l'élève lit les pauses de son établissement
DROP POLICY IF EXISTS "timetable_breaks_select_student" ON timetable_breaks;
CREATE POLICY "timetable_breaks_select_student"
  ON timetable_breaks FOR SELECT
  USING (
    school_id IN (
      SELECT s.school_id FROM students s WHERE s.user_id = auth.uid()
    )
  );

-- Ressources publiées : inclure l'année scolaire active de l'inscription
DROP POLICY IF EXISTS "cr_student_select" ON course_resources;
CREATE POLICY "cr_student_select"
  ON course_resources FOR SELECT
  USING (
    is_published = TRUE
    AND class_id IN (
      SELECT se.class_id
      FROM student_enrollments se
      JOIN students s ON s.id = se.student_id
      WHERE s.user_id = auth.uid()
        AND se.status = 'active'
    )
    AND school_year_id IN (
      SELECT se.school_year_id
      FROM student_enrollments se
      JOIN students s ON s.id = se.student_id
      WHERE s.user_id = auth.uid()
        AND se.status = 'active'
    )
  );
