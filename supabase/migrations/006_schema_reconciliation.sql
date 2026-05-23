-- EduNation - Migration 006 : réconciliation schéma application ↔ migrations 001–005
-- Aligne la base avec le code Next.js (evaluations, messages, frais, profils, parents)

-- ============================================================
-- PROFILS : prénom / nom
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name TEXT;

CREATE OR REPLACE FUNCTION sync_profile_name_parts()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.full_name IS NOT NULL AND (NEW.first_name IS NULL OR NEW.last_name IS NULL) THEN
    NEW.first_name := COALESCE(NEW.first_name, split_part(trim(NEW.full_name), ' ', 1));
    NEW.last_name := COALESCE(
      NEW.last_name,
      NULLIF(trim(substring(trim(NEW.full_name) FROM length(split_part(trim(NEW.full_name), ' ', 1)) + 1)), ''),
      split_part(trim(NEW.full_name), ' ', 1)
    );
  END IF;
  IF NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL AND (NEW.full_name IS NULL OR NEW.full_name = '') THEN
    NEW.full_name := trim(NEW.first_name || ' ' || NEW.last_name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_sync_names ON profiles;
CREATE TRIGGER profiles_sync_names
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION sync_profile_name_parts();

UPDATE profiles
SET
  first_name = COALESCE(first_name, split_part(trim(full_name), ' ', 1)),
  last_name = COALESCE(
    last_name,
    NULLIF(trim(substring(trim(full_name) FROM length(split_part(trim(full_name), ' ', 1)) + 1)), ''),
    split_part(trim(full_name), ' ', 1)
  )
WHERE full_name IS NOT NULL AND (first_name IS NULL OR last_name IS NULL);

-- ============================================================
-- ÉLÈVES : champs inscription
-- ============================================================
ALTER TABLE students ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT 'Burkinabè';
ALTER TABLE students ADD COLUMN IF NOT EXISTS address TEXT;

-- IUN généré côté serveur : autoriser NULL temporairement à l'insert
ALTER TABLE students ALTER COLUMN iun DROP NOT NULL;

-- ============================================================
-- NIVEAUX / MATIÈRES / FRAIS
-- ============================================================
ALTER TABLE class_levels ADD COLUMN IF NOT EXISTS order_num INTEGER;
UPDATE class_levels SET order_num = order_index WHERE order_num IS NULL;

ALTER TABLE subjects ADD COLUMN IF NOT EXISTS coefficient NUMERIC(4,2) DEFAULT 1;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS is_mandatory BOOLEAN DEFAULT TRUE;
UPDATE fee_structures SET name = label WHERE name IS NULL;
UPDATE fee_structures SET is_mandatory = COALESCE(is_required, TRUE) WHERE is_mandatory IS NULL;

-- ============================================================
-- ÉVALUATIONS (modèle utilisé par l'application)
-- ============================================================
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES school_years(id),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id),
  title TEXT NOT NULL,
  eval_type TEXT NOT NULL DEFAULT 'devoir'
    CHECK (eval_type IN ('devoir', 'interrogation', 'composition', 'examen')),
  max_score NUMERIC(5,2) NOT NULL DEFAULT 20,
  eval_date DATE NOT NULL DEFAULT CURRENT_DATE,
  term TEXT NOT NULL DEFAULT 'T1',
  created_by UUID NOT NULL REFERENCES profiles(id),
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evaluations_school_id ON evaluations(school_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_class_id ON evaluations(class_id);

-- Notes : colonnes compatibles application
ALTER TABLE grades ADD COLUMN IF NOT EXISTS evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE;
ALTER TABLE grades ADD COLUMN IF NOT EXISTS value NUMERIC(5,2);
ALTER TABLE grades ADD COLUMN IF NOT EXISTS max_value NUMERIC(5,2) DEFAULT 20;
ALTER TABLE grades ADD COLUMN IF NOT EXISTS period TEXT;
ALTER TABLE grades ADD COLUMN IF NOT EXISTS term TEXT;

ALTER TABLE grades ALTER COLUMN assessment_id DROP NOT NULL;
ALTER TABLE grades ALTER COLUMN grade DROP NOT NULL;
ALTER TABLE grades ALTER COLUMN created_by DROP NOT NULL;

-- Sync grade ↔ value
CREATE OR REPLACE FUNCTION sync_grade_value_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.value IS NOT NULL AND NEW.grade IS NULL THEN
    NEW.grade := NEW.value;
  ELSIF NEW.grade IS NOT NULL AND NEW.value IS NULL THEN
    NEW.value := NEW.grade;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS grades_sync_value ON grades;
CREATE TRIGGER grades_sync_value
  BEFORE INSERT OR UPDATE ON grades
  FOR EACH ROW EXECUTE FUNCTION sync_grade_value_columns();

-- ============================================================
-- PRÉ-INSCRIPTIONS PARENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS parent_pre_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  has_phone BOOLEAN DEFAULT TRUE,
  linked_student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DEMANDES INSCRIPTION ÉLÈVE (web public)
-- ============================================================
CREATE TABLE IF NOT EXISTS student_registration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  channel TEXT DEFAULT 'web' CHECK (channel IN ('web', 'secretariat', 'import')),
  has_student_phone BOOLEAN DEFAULT FALSE,
  parent_phone TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BULLETINS : colonnes UI
-- ============================================================
ALTER TABLE report_cards ADD COLUMN IF NOT EXISTS term TEXT;
ALTER TABLE report_cards ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;
ALTER TABLE report_cards ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE report_cards ADD COLUMN IF NOT EXISTS hash TEXT;
ALTER TABLE report_cards ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

UPDATE report_cards SET is_published = (status = 'published') WHERE is_published IS NULL;
UPDATE report_cards SET hash = qr_hash WHERE hash IS NULL AND qr_hash IS NOT NULL;

-- ============================================================
-- RLS nouvelles tables
-- ============================================================
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_pre_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_registration_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "evaluations_select" ON evaluations;
CREATE POLICY "evaluations_select" ON evaluations FOR SELECT
  USING (is_super_admin() OR can_access_school(school_id));

DROP POLICY IF EXISTS "evaluations_insert" ON evaluations;
CREATE POLICY "evaluations_insert" ON evaluations FOR INSERT
  WITH CHECK (
    is_super_admin() OR
    can_access_school(school_id) OR
    created_by = auth.uid()
  );

DROP POLICY IF EXISTS "evaluations_update" ON evaluations;
CREATE POLICY "evaluations_update" ON evaluations FOR UPDATE
  USING (
    is_super_admin() OR
    has_any_school_role(school_id, ARRAY['PROVISEUR', 'CENSEUR', 'FONDATEUR']) OR
    created_by = auth.uid()
  );

DROP POLICY IF EXISTS "parent_pre_registrations_select" ON parent_pre_registrations;
CREATE POLICY "parent_pre_registrations_select" ON parent_pre_registrations FOR SELECT
  USING (is_super_admin() OR can_access_school(school_id));

DROP POLICY IF EXISTS "parent_pre_registrations_insert" ON parent_pre_registrations;
CREATE POLICY "parent_pre_registrations_insert" ON parent_pre_registrations FOR INSERT
  WITH CHECK (can_access_school(school_id) OR is_super_admin());

DROP POLICY IF EXISTS "student_registration_requests_select" ON student_registration_requests;
CREATE POLICY "student_registration_requests_select" ON student_registration_requests FOR SELECT
  USING (is_super_admin() OR can_access_school(school_id));

DROP POLICY IF EXISTS "student_registration_requests_insert" ON student_registration_requests;
CREATE POLICY "student_registration_requests_insert" ON student_registration_requests FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "terms_insert" ON terms;
CREATE POLICY "terms_insert" ON terms FOR INSERT
  WITH CHECK (
    is_super_admin() OR
    has_any_school_role(school_id, ARRAY['PROVISEUR', 'FONDATEUR', 'SUPER_ADMIN_EDUNATION'])
  );

-- ============================================================
-- RPC IUN accessible aux utilisateurs authentifiés + service
-- ============================================================
GRANT EXECUTE ON FUNCTION generate_iun(INTEGER) TO authenticated, service_role;
