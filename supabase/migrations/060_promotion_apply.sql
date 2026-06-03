-- Phase 3 : application des passages (inscriptions année cible)

ALTER TABLE promotion_results
  ADD COLUMN IF NOT EXISTS applied_target_class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS promotion_apply_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES promotion_sessions(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  source_enrollment_id UUID REFERENCES student_enrollments(id) ON DELETE SET NULL,
  target_enrollment_id UUID REFERENCES student_enrollments(id) ON DELETE SET NULL,
  decision TEXT NOT NULL,
  source_class_id UUID NOT NULL REFERENCES classes(id),
  target_class_id UUID REFERENCES classes(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promotion_apply_logs_session
  ON promotion_apply_logs (session_id);

ALTER TABLE promotion_apply_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS promotion_apply_logs_select ON promotion_apply_logs;
CREATE POLICY promotion_apply_logs_select ON promotion_apply_logs FOR SELECT
  USING (is_super_admin() OR can_access_school(school_id));

DROP POLICY IF EXISTS promotion_apply_logs_insert ON promotion_apply_logs;
CREATE POLICY promotion_apply_logs_insert ON promotion_apply_logs FOR INSERT
  WITH CHECK (
    is_super_admin()
    OR has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT']
    )
  );
