-- Bulletin BF officiel, photos élèves, retraits de points

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('student-photos', 'student-photos', true, 5242880)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

DROP POLICY IF EXISTS student_photos_insert ON storage.objects;
CREATE POLICY student_photos_insert ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'student-photos'
    AND (
      is_super_admin()
      OR has_any_school_role(
        ((storage.foldername(name))[1])::uuid,
        ARRAY['SECRETAIRE', 'PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT', 'CENSEUR', 'VIE_SCOLAIRE']
      )
    )
  );

DROP POLICY IF EXISTS student_photos_select ON storage.objects;
CREATE POLICY student_photos_select ON storage.objects FOR SELECT
  USING (
    bucket_id = 'student-photos'
    AND (
      is_super_admin()
      OR can_access_school(((storage.foldername(name))[1])::uuid)
    )
  );

DROP POLICY IF EXISTS student_photos_update ON storage.objects;
CREATE POLICY student_photos_update ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'student-photos'
    AND (
      is_super_admin()
      OR has_any_school_role(
        ((storage.foldername(name))[1])::uuid,
        ARRAY['SECRETAIRE', 'PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT', 'CENSEUR', 'VIE_SCOLAIRE']
      )
    )
  );

DROP POLICY IF EXISTS student_photos_delete ON storage.objects;
CREATE POLICY student_photos_delete ON storage.objects FOR DELETE
  USING (
    bucket_id = 'student-photos'
    AND (
      is_super_admin()
      OR has_any_school_role(
        ((storage.foldername(name))[1])::uuid,
        ARRAY['SECRETAIRE', 'PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT', 'CENSEUR', 'VIE_SCOLAIRE']
      )
    )
  );

CREATE TABLE IF NOT EXISTS conduct_point_deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES school_years(id) ON DELETE SET NULL,
  term TEXT CHECK (term IS NULL OR term IN ('T1', 'T2', 'T3')),
  points NUMERIC(4,2) NOT NULL CHECK (points > 0),
  reason TEXT NOT NULL,
  deducted_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conduct_deductions_student_term
  ON conduct_point_deductions (student_id, term);

ALTER TABLE conduct_point_deductions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS conduct_deductions_select ON conduct_point_deductions;
CREATE POLICY conduct_deductions_select ON conduct_point_deductions FOR SELECT
  USING (is_super_admin() OR can_access_school(school_id));

DROP POLICY IF EXISTS conduct_deductions_write ON conduct_point_deductions;
CREATE POLICY conduct_deductions_write ON conduct_point_deductions FOR ALL
  USING (
    is_super_admin()
    OR has_any_school_role(
      school_id,
      ARRAY['SECRETAIRE', 'PROVISEUR', 'CENSEUR', 'VIE_SCOLAIRE', 'DIRECTEUR_ADJOINT', 'FONDATEUR']
    )
  )
  WITH CHECK (
    is_super_admin()
    OR has_any_school_role(
      school_id,
      ARRAY['SECRETAIRE', 'PROVISEUR', 'CENSEUR', 'VIE_SCOLAIRE', 'DIRECTEUR_ADJOINT', 'FONDATEUR']
    )
  );

ALTER TABLE report_cards
  ADD COLUMN IF NOT EXISTS snapshot_json JSONB,
  ADD COLUMN IF NOT EXISTS class_size INTEGER,
  ADD COLUMN IF NOT EXISTS period TEXT,
  ADD COLUMN IF NOT EXISTS council_decision TEXT;

ALTER TABLE report_card_templates
  DROP CONSTRAINT IF EXISTS report_card_templates_code_check;

ALTER TABLE report_card_templates
  ADD CONSTRAINT report_card_templates_code_check
  CHECK (code IN ('A_STANDARD', 'B_PREMIUM', 'C_COMPACT', 'BF_OFFICIAL_V1'));
