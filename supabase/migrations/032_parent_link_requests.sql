-- ============================================================
-- Migration 032 — Demandes de rattachement parent ↔ élève
-- Idempotent : safe à relancer si une exécution partielle a échoué
-- ============================================================

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
