-- Publication progressive des notes : prof → secrétaire → familles

CREATE TABLE IF NOT EXISTS grade_slot_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  term TEXT NOT NULL CHECK (term IN ('T1', 'T2', 'T3')),
  slot TEXT NOT NULL CHECK (slot IN ('devoir1', 'devoir2', 'examen')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'published')),
  submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ,
  published_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  teacher_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (school_id, class_id, subject_id, term, slot)
);

CREATE INDEX IF NOT EXISTS idx_grade_slot_publications_pending
  ON grade_slot_publications (school_id, status)
  WHERE status = 'submitted';

CREATE INDEX IF NOT EXISTS idx_grade_slot_publications_lookup
  ON grade_slot_publications (school_id, class_id, subject_id, term);

ALTER TABLE grade_slot_publications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS grade_slot_publications_select ON grade_slot_publications;
CREATE POLICY grade_slot_publications_select ON grade_slot_publications FOR SELECT
  USING (is_super_admin() OR can_access_school(school_id));

DROP POLICY IF EXISTS grade_slot_publications_insert ON grade_slot_publications;
CREATE POLICY grade_slot_publications_insert ON grade_slot_publications FOR INSERT
  WITH CHECK (
    is_super_admin()
    OR (
      can_access_school(school_id)
      AND (
        has_any_school_role(school_id, ARRAY['PROFESSEUR', 'SECRETAIRE', 'PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT', 'CENSEUR'])
      )
    )
  );

DROP POLICY IF EXISTS grade_slot_publications_update ON grade_slot_publications;
CREATE POLICY grade_slot_publications_update ON grade_slot_publications FOR UPDATE
  USING (
    is_super_admin()
    OR (
      can_access_school(school_id)
      AND has_any_school_role(school_id, ARRAY['SECRETAIRE', 'PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT', 'CENSEUR', 'PROFESSEUR'])
    )
  );

-- Visibilité familles : note publiée par slot
CREATE OR REPLACE FUNCTION is_grade_visible_to_family(p_evaluation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM evaluations e
    INNER JOIN grade_slot_publications gsp
      ON gsp.school_id = e.school_id
     AND gsp.class_id = e.class_id
     AND gsp.subject_id = e.subject_id
     AND gsp.term = e.term
     AND gsp.slot = e.sequence_slot
     AND gsp.status = 'published'
    WHERE e.id = p_evaluation_id
      AND e.sequence_slot IS NOT NULL
  );
$$;

-- Restreindre l'accès parent/élève aux notes publiées
DROP POLICY IF EXISTS "grades_select" ON grades;
CREATE POLICY "grades_select" ON grades FOR SELECT
  USING (
    is_super_admin()
    OR has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'CENSEUR', 'CONSEILLER', 'SECRETAIRE', 'DIRECTEUR_ADJOINT', 'FONDATEUR', 'VIE_SCOLAIRE']
    )
    OR EXISTS (
      SELECT 1 FROM assessments a
      WHERE a.id = assessment_id AND a.teacher_id = auth.uid()
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
  );

DROP POLICY IF EXISTS "grades_select_own_student" ON grades;
CREATE POLICY "grades_select_own_student" ON grades FOR SELECT
  USING (
    is_student_owner(student_id)
    AND evaluation_id IS NOT NULL
    AND is_grade_visible_to_family(evaluation_id)
  );

DROP POLICY IF EXISTS "grades_select_parent_published" ON grades;
CREATE POLICY "grades_select_parent_published" ON grades FOR SELECT
  USING (
    is_parent_of_student(student_id)
    AND evaluation_id IS NOT NULL
    AND is_grade_visible_to_family(evaluation_id)
  );
