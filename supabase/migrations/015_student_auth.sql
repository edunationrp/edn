-- ============================================================
-- Migration 015 — Authentification élèves par IUN
-- Ajoute user_id + champs code d'activation à students
-- Réécrit is_student_owner() pour utiliser user_id
-- ============================================================

-- 1. Colonnes d'authentification sur students
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS activation_code_hash TEXT,
  ADD COLUMN IF NOT EXISTS activation_code_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS activation_code_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS activation_code_generated_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Index pour lookup rapide par user_id
CREATE UNIQUE INDEX IF NOT EXISTS students_user_id_idx ON students(user_id) WHERE user_id IS NOT NULL;

-- Index pour lookup par IUN (déjà UNIQUE mais créons un index partiel actifs)
CREATE INDEX IF NOT EXISTS students_iun_active_idx ON students(iun) WHERE status = 'active';

-- 2. Réécriture de is_student_owner() — utilise user_id, plus le téléphone
CREATE OR REPLACE FUNCTION is_student_owner(student_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM students
    WHERE id = student_id
      AND user_id = auth.uid()
  );
END;
$$;

-- 3. Politique RLS pour que l'élève lise ses propres données
-- (La politique existante peut rester ; on s'assure qu'elle est correcte)
-- Sur students : SELECT propre rangée
DROP POLICY IF EXISTS "students_select_own" ON students;
CREATE POLICY "students_select_own"
  ON students FOR SELECT
  USING (user_id = auth.uid());

-- L'élève ne peut pas modifier ses propres données
DROP POLICY IF EXISTS "students_no_self_update" ON students;

-- 4. Politique RLS sur student_enrollments pour lecture par l'élève lui-même
DROP POLICY IF EXISTS "enrollments_select_own_student" ON student_enrollments;
CREATE POLICY "enrollments_select_own_student"
  ON student_enrollments FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- 5. Politique sur grades pour lecture par l'élève concerné
DROP POLICY IF EXISTS "grades_select_own_student" ON grades;
CREATE POLICY "grades_select_own_student"
  ON grades FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- 6. Politique sur report_cards pour lecture par l'élève concerné
DROP POLICY IF EXISTS "report_cards_select_own_student" ON report_cards;
CREATE POLICY "report_cards_select_own_student"
  ON report_cards FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- 7. Politique sur attendance_records pour lecture par l'élève concerné
DROP POLICY IF EXISTS "attendance_select_own_student" ON attendance_records;
CREATE POLICY "attendance_select_own_student"
  ON attendance_records FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- 8. Helper : retourne le student_id de l'utilisateur connecté (élève)
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
