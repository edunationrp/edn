-- ============================================================
-- Migration 016 — Demandes de rattachement parent ↔ élève
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

-- Un parent ne peut avoir qu'une demande en cours par élève
CREATE UNIQUE INDEX IF NOT EXISTS parent_link_requests_pending_unique
  ON parent_link_requests(parent_user_id, student_iun)
  WHERE status = 'pending';

-- Trigger updated_at
CREATE TRIGGER update_parent_link_requests_updated_at
  BEFORE UPDATE ON parent_link_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE parent_link_requests ENABLE ROW LEVEL SECURITY;

-- Le parent voit ses propres demandes
CREATE POLICY "plr_parent_select"
  ON parent_link_requests FOR SELECT
  USING (parent_user_id = auth.uid());

-- Le parent peut créer une demande
CREATE POLICY "plr_parent_insert"
  ON parent_link_requests FOR INSERT
  WITH CHECK (parent_user_id = auth.uid());

-- La secrétaire peut voir toutes les demandes de son école
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

-- La secrétaire peut approuver/rejeter (UPDATE status)
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
