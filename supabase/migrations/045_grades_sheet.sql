-- Feuille de notes : slots devoir1/devoir2/examen, historique, RLS secrétaire

ALTER TABLE evaluations
  ADD COLUMN IF NOT EXISTS sequence_slot TEXT
    CHECK (sequence_slot IS NULL OR sequence_slot IN ('devoir1', 'devoir2', 'examen'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_evaluations_sheet_slot
  ON evaluations (school_id, class_id, subject_id, term, sequence_slot)
  WHERE sequence_slot IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_grades_evaluation_student
  ON grades (evaluation_id, student_id)
  WHERE evaluation_id IS NOT NULL;

ALTER TABLE grade_history
  ADD COLUMN IF NOT EXISTS changed_by_role TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'staff',
  ADD COLUMN IF NOT EXISTS evaluation_id UUID REFERENCES evaluations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION log_grade_change()
RETURNS TRIGGER AS $$
DECLARE
  old_val NUMERIC(5,2);
  new_val NUMERIC(5,2);
BEGIN
  old_val := COALESCE(OLD.value, OLD.grade);
  new_val := COALESCE(NEW.value, NEW.grade);

  IF old_val IS DISTINCT FROM new_val AND NEW.updated_by IS NOT NULL THEN
    INSERT INTO grade_history (
      school_id,
      grade_id,
      old_value,
      new_value,
      changed_by,
      evaluation_id,
      student_id
    )
    VALUES (
      NEW.school_id,
      NEW.id,
      old_val,
      new_val,
      NEW.updated_by,
      NEW.evaluation_id,
      NEW.student_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP POLICY IF EXISTS grade_history_select ON grade_history;
CREATE POLICY grade_history_select ON grade_history FOR SELECT
  USING (is_super_admin() OR can_access_school(school_id));

DROP POLICY IF EXISTS "grades_insert" ON grades;
CREATE POLICY "grades_insert" ON grades FOR INSERT
  WITH CHECK (
    NOT COALESCE(is_locked, false)
    AND (
      is_super_admin()
      OR (
        can_access_school(school_id)
        AND (
          evaluation_id IS NULL
          OR NOT COALESCE(
            (SELECT e.is_locked FROM evaluations e WHERE e.id = evaluation_id),
            false
          )
        )
        AND (
          has_any_school_role(
            school_id,
            ARRAY['PROVISEUR', 'FONDATEUR', 'SECRETAIRE', 'DIRECTEUR_ADJOINT', 'CENSEUR']
          )
          OR EXISTS (
            SELECT 1 FROM evaluations e
            WHERE e.id = evaluation_id AND e.created_by = auth.uid()
          )
          OR EXISTS (
            SELECT 1
            FROM evaluations e
            JOIN teacher_assignments ta
              ON ta.class_id = e.class_id
             AND ta.subject_id = e.subject_id
             AND ta.school_id = e.school_id
            WHERE e.id = evaluation_id
              AND ta.teacher_id = auth.uid()
              AND ta.is_active = true
          )
        )
      )
    )
  );

DROP POLICY IF EXISTS "grades_update" ON grades;
CREATE POLICY "grades_update" ON grades FOR UPDATE
  USING (
    NOT COALESCE(is_locked, false)
    AND (
      is_super_admin()
      OR (
        can_access_school(school_id)
        AND (
          evaluation_id IS NULL
          OR NOT COALESCE(
            (SELECT e.is_locked FROM evaluations e WHERE e.id = evaluation_id),
            false
          )
        )
        AND (
          has_any_school_role(
            school_id,
            ARRAY['PROVISEUR', 'FONDATEUR', 'SECRETAIRE', 'DIRECTEUR_ADJOINT', 'CENSEUR']
          )
          OR EXISTS (
            SELECT 1 FROM evaluations e
            WHERE e.id = evaluation_id AND e.created_by = auth.uid()
          )
          OR EXISTS (
            SELECT 1
            FROM evaluations e
            JOIN teacher_assignments ta
              ON ta.class_id = e.class_id
             AND ta.subject_id = e.subject_id
             AND ta.school_id = e.school_id
            WHERE e.id = evaluation_id
              AND ta.teacher_id = auth.uid()
              AND ta.is_active = true
          )
        )
      )
    )
  );

DROP POLICY IF EXISTS "evaluations_insert" ON evaluations;
CREATE POLICY "evaluations_insert" ON evaluations FOR INSERT
  WITH CHECK (
    is_super_admin()
    OR can_access_school(school_id)
    OR created_by = auth.uid()
  );

DROP POLICY IF EXISTS "evaluations_update" ON evaluations;
CREATE POLICY "evaluations_update" ON evaluations FOR UPDATE
  USING (
    is_super_admin()
    OR has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'CENSEUR', 'FONDATEUR', 'SECRETAIRE', 'DIRECTEUR_ADJOINT']
    )
    OR created_by = auth.uid()
  );
