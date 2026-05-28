-- ============================================================
-- Migration 040 — Portail parent : RLS parent_student_relations + paiements
-- Idempotent
-- ============================================================

DROP POLICY IF EXISTS "psr_parent_select_own" ON parent_student_relations;
CREATE POLICY "psr_parent_select_own"
  ON parent_student_relations FOR SELECT
  USING (parent_user_id = auth.uid());

DROP POLICY IF EXISTS "psr_staff_select_school" ON parent_student_relations;
CREATE POLICY "psr_staff_select_school"
  ON parent_student_relations FOR SELECT
  USING (
    is_super_admin()
    OR has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'CENSEUR', 'SECRETAIRE', 'CONSEILLER', 'VIE_SCOLAIRE', 'DIRECTEUR_ADJOINT']
    )
  );

DROP POLICY IF EXISTS "payments_select" ON payments;
CREATE POLICY "payments_select" ON payments FOR SELECT
  USING (
    is_super_admin()
    OR has_any_school_role(school_id, ARRAY['INTENDANT', 'SECRETAIRE', 'PROVISEUR', 'FONDATEUR'])
    OR parent_user_id = auth.uid()
    OR is_parent_of_student(student_id)
  );
