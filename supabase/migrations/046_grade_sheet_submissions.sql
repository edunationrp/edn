-- Soumissions secrétariat en attente de validation professeur

CREATE TABLE IF NOT EXISTS grade_sheet_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  term TEXT NOT NULL CHECK (term IN ('T1', 'T2', 'T3')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'validated', 'rejected')),
  submitted_by UUID NOT NULL REFERENCES profiles(id),
  teacher_id UUID REFERENCES profiles(id),
  secretary_note TEXT,
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_grade_sheet_submissions_one_pending
  ON grade_sheet_submissions (school_id, class_id, subject_id, term)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_grade_sheet_submissions_teacher_pending
  ON grade_sheet_submissions (teacher_id, status)
  WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS grade_sheet_submission_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES grade_sheet_submissions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  slot TEXT NOT NULL CHECK (slot IN ('devoir1', 'devoir2', 'examen')),
  proposed_value NUMERIC(5,2),
  previous_value NUMERIC(5,2),
  UNIQUE (submission_id, student_id, slot)
);

CREATE INDEX IF NOT EXISTS idx_grade_sheet_submission_items_submission
  ON grade_sheet_submission_items (submission_id);

ALTER TABLE grade_sheet_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_sheet_submission_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS grade_sheet_submissions_select ON grade_sheet_submissions;
CREATE POLICY grade_sheet_submissions_select ON grade_sheet_submissions FOR SELECT
  USING (
    is_super_admin()
    OR can_access_school(school_id)
  );

DROP POLICY IF EXISTS grade_sheet_submissions_insert ON grade_sheet_submissions;
CREATE POLICY grade_sheet_submissions_insert ON grade_sheet_submissions FOR INSERT
  WITH CHECK (
    is_super_admin()
    OR (
      can_access_school(school_id)
      AND has_any_school_role(school_id, ARRAY['SECRETAIRE', 'PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT', 'CENSEUR'])
    )
  );

DROP POLICY IF EXISTS grade_sheet_submissions_update ON grade_sheet_submissions;
CREATE POLICY grade_sheet_submissions_update ON grade_sheet_submissions FOR UPDATE
  USING (
    is_super_admin()
    OR (
      can_access_school(school_id)
      AND (
        has_any_school_role(school_id, ARRAY['SECRETAIRE', 'PROVISEUR', 'PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT', 'CENSEUR'])
        OR teacher_id = auth.uid()
        OR submitted_by = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS grade_sheet_submission_items_select ON grade_sheet_submission_items;
CREATE POLICY grade_sheet_submission_items_select ON grade_sheet_submission_items FOR SELECT
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM grade_sheet_submissions s
      WHERE s.id = submission_id AND can_access_school(s.school_id)
    )
  );

DROP POLICY IF EXISTS grade_sheet_submission_items_insert ON grade_sheet_submission_items;
CREATE POLICY grade_sheet_submission_items_insert ON grade_sheet_submission_items FOR INSERT
  WITH CHECK (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM grade_sheet_submissions s
      WHERE s.id = submission_id
        AND can_access_school(s.school_id)
        AND has_any_school_role(s.school_id, ARRAY['SECRETAIRE', 'PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT', 'CENSEUR'])
    )
  );

DROP POLICY IF EXISTS grade_sheet_submission_items_update ON grade_sheet_submission_items;
CREATE POLICY grade_sheet_submission_items_update ON grade_sheet_submission_items FOR UPDATE
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM grade_sheet_submissions s
      WHERE s.id = submission_id
        AND can_access_school(s.school_id)
        AND has_any_school_role(s.school_id, ARRAY['SECRETAIRE', 'PROFESSEUR', 'PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT', 'CENSEUR'])
    )
  );

DROP POLICY IF EXISTS grade_sheet_submission_items_delete ON grade_sheet_submission_items;
CREATE POLICY grade_sheet_submission_items_delete ON grade_sheet_submission_items FOR DELETE
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM grade_sheet_submissions s
      WHERE s.id = submission_id
        AND can_access_school(s.school_id)
        AND has_any_school_role(s.school_id, ARRAY['SECRETAIRE', 'PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT', 'CENSEUR'])
    )
  );
