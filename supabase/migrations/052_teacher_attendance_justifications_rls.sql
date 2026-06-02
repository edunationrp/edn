-- Professeurs : lecture des justifications liées à leurs appels

DROP POLICY IF EXISTS "attendance_justifications_teacher_select" ON attendance_justifications;
CREATE POLICY "attendance_justifications_teacher_select"
  ON attendance_justifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM attendance_records ar
      WHERE ar.id = attendance_justifications.attendance_record_id
        AND ar.teacher_id = auth.uid()
    )
  );
