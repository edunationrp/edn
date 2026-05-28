-- ============================================================
-- Migration 042 — Portail parent MVP3 : justifications d'absence
-- Idempotent
-- ============================================================

ALTER TABLE attendance_justifications
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS attendance_justifications_pending_unique
  ON attendance_justifications(attendance_record_id)
  WHERE status = 'pending';

DROP POLICY IF EXISTS "attendance_justifications_parent_select" ON attendance_justifications;
CREATE POLICY "attendance_justifications_parent_select"
  ON attendance_justifications FOR SELECT
  USING (
    parent_user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM attendance_records ar
      WHERE ar.id = attendance_justifications.attendance_record_id
        AND is_parent_of_student(ar.student_id)
    )
  );

DROP POLICY IF EXISTS "attendance_justifications_parent_insert" ON attendance_justifications;
CREATE POLICY "attendance_justifications_parent_insert"
  ON attendance_justifications FOR INSERT
  WITH CHECK (
    parent_user_id = auth.uid()
    AND status = 'pending'
    AND EXISTS (
      SELECT 1
      FROM attendance_records ar
      WHERE ar.id = attendance_record_id
        AND is_parent_of_student(ar.student_id)
        AND ar.status IN ('absent', 'late')
    )
  );

DROP POLICY IF EXISTS "attendance_justifications_staff_select" ON attendance_justifications;
CREATE POLICY "attendance_justifications_staff_select"
  ON attendance_justifications FOR SELECT
  USING (
    is_super_admin()
    OR has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'CENSEUR', 'SECRETAIRE', 'VIE_SCOLAIRE', 'SURVEILLANT_GENERAL', 'CONSEILLER', 'DIRECTEUR_ADJOINT']
    )
  );

DROP POLICY IF EXISTS "attendance_justifications_staff_update" ON attendance_justifications;
CREATE POLICY "attendance_justifications_staff_update"
  ON attendance_justifications FOR UPDATE
  USING (
    is_super_admin()
    OR has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'CENSEUR', 'SECRETAIRE', 'VIE_SCOLAIRE', 'SURVEILLANT_GENERAL', 'CONSEILLER', 'DIRECTEUR_ADJOINT']
    )
  );

-- Parents liés à l'école peuvent démarrer une conversation chat (can_access_school via rôle PARENT)
-- Aucun changement chat requis si user_school_roles PARENT existe déjà.
