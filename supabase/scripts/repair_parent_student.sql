-- ============================================================
-- Script de réparation — parent / élève / liaison IUN
-- À coller dans le SQL Editor Supabase si les migrations 031–034
-- ont échoué en cours de route. 100 % idempotent.
-- ============================================================

-- ── 031 : auth élève ─────────────────────────────────────────
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS activation_code_hash TEXT,
  ADD COLUMN IF NOT EXISTS activation_code_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS activation_code_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS activation_code_generated_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS students_user_id_idx ON students(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS students_iun_active_idx ON students(iun) WHERE status = 'active';

CREATE OR REPLACE FUNCTION is_student_owner(p_student_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM students
    WHERE id = p_student_id
      AND user_id = auth.uid()
  );
END;
$$;

DROP POLICY IF EXISTS "students_select_own" ON students;
CREATE POLICY "students_select_own"
  ON students FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "students_no_self_update" ON students;

DROP POLICY IF EXISTS "enrollments_select_own_student" ON student_enrollments;
CREATE POLICY "enrollments_select_own_student"
  ON student_enrollments FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "grades_select_own_student" ON grades;
CREATE POLICY "grades_select_own_student"
  ON grades FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "report_cards_select_own_student" ON report_cards;
CREATE POLICY "report_cards_select_own_student"
  ON report_cards FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "attendance_select_own_student" ON attendance_records;
CREATE POLICY "attendance_select_own_student"
  ON attendance_records FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION get_student_id_for_current_user()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_student_id UUID;
BEGIN
  SELECT id INTO v_student_id FROM students WHERE user_id = auth.uid() LIMIT 1;
  RETURN v_student_id;
END;
$$;

-- ── 032 : demandes de rattachement parent ────────────────────
CREATE TABLE IF NOT EXISTS parent_link_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_iun TEXT NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  relationship TEXT NOT NULL DEFAULT 'parent'
    CHECK (relationship IN ('parent', 'tuteur', 'autre')),
  message TEXT,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS parent_link_requests_pending_unique
  ON parent_link_requests(parent_user_id, student_iun)
  WHERE status = 'pending';

DROP TRIGGER IF EXISTS update_parent_link_requests_updated_at ON parent_link_requests;
CREATE TRIGGER update_parent_link_requests_updated_at
  BEFORE UPDATE ON parent_link_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE parent_link_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plr_parent_select" ON parent_link_requests;
CREATE POLICY "plr_parent_select"
  ON parent_link_requests FOR SELECT
  USING (parent_user_id = auth.uid());

DROP POLICY IF EXISTS "plr_parent_insert" ON parent_link_requests;
CREATE POLICY "plr_parent_insert"
  ON parent_link_requests FOR INSERT
  WITH CHECK (parent_user_id = auth.uid());

DROP POLICY IF EXISTS "plr_secretaire_select" ON parent_link_requests;
CREATE POLICY "plr_secretaire_select"
  ON parent_link_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_school_roles usr
      WHERE usr.user_id = auth.uid()
        AND usr.school_id = parent_link_requests.school_id
        AND usr.role_code IN ('SECRETAIRE', 'PROVISEUR', 'DIRECTEUR_ADJOINT', 'FONDATEUR')
        AND usr.is_active = TRUE
    )
  );

DROP POLICY IF EXISTS "plr_secretaire_update" ON parent_link_requests;
CREATE POLICY "plr_secretaire_update"
  ON parent_link_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_school_roles usr
      WHERE usr.user_id = auth.uid()
        AND usr.school_id = parent_link_requests.school_id
        AND usr.role_code IN ('SECRETAIRE', 'PROVISEUR', 'DIRECTEUR_ADJOINT', 'FONDATEUR')
        AND usr.is_active = TRUE
    )
  )
  WITH CHECK (status IN ('approved', 'rejected'));

-- ── 034 : SMS parent ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sms_verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  purpose TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sms_verification_codes
  ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 0;

UPDATE sms_verification_codes SET attempts = 0 WHERE attempts IS NULL;

CREATE INDEX IF NOT EXISTS sms_codes_phone_purpose_idx
  ON sms_verification_codes(phone, purpose)
  WHERE verified_at IS NULL;

CREATE OR REPLACE FUNCTION increment_sms_attempts(p_phone TEXT, p_purpose TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE sms_verification_codes
  SET attempts = COALESCE(attempts, 0) + 1
  WHERE phone = p_phone
    AND purpose = p_purpose
    AND verified_at IS NULL;
END;
$$;

ALTER TABLE sms_verification_codes ENABLE ROW LEVEL SECURITY;
