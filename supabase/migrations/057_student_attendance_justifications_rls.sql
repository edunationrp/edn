-- Élève : lecture des justifications liées à ses propres absences (statut uniquement, lecture seule)

DROP POLICY IF EXISTS "attendance_justifications_student_select" ON attendance_justifications;
CREATE POLICY "attendance_justifications_student_select"
  ON attendance_justifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM attendance_records ar
      JOIN students s ON s.id = ar.student_id
      WHERE ar.id = attendance_justifications.attendance_record_id
        AND s.user_id = auth.uid()
    )
  );
