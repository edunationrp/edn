-- Masquage parent (convocations, annonces, réunions) + gestion staff annonces

ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS parent_communication_hides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('announcement', 'convocation', 'meeting')),
  item_id UUID NOT NULL,
  hidden_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (parent_user_id, student_id, item_type, item_id)
);

CREATE INDEX IF NOT EXISTS idx_parent_comm_hides_lookup
  ON parent_communication_hides (parent_user_id, student_id, item_type);

ALTER TABLE parent_communication_hides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS parent_comm_hides_select ON parent_communication_hides;
CREATE POLICY parent_comm_hides_select ON parent_communication_hides FOR SELECT
  USING (parent_user_id = auth.uid() OR is_super_admin());

DROP POLICY IF EXISTS parent_comm_hides_insert ON parent_communication_hides;
CREATE POLICY parent_comm_hides_insert ON parent_communication_hides FOR INSERT
  WITH CHECK (parent_user_id = auth.uid());

DROP POLICY IF EXISTS parent_comm_hides_delete ON parent_communication_hides;
CREATE POLICY parent_comm_hides_delete ON parent_communication_hides FOR DELETE
  USING (parent_user_id = auth.uid());

DROP POLICY IF EXISTS "announcements_delete" ON announcements;
CREATE POLICY "announcements_delete" ON announcements FOR DELETE
  USING (
    is_super_admin()
    OR has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'FONDATEUR', 'SECRETAIRE', 'VIE_SCOLAIRE', 'SURVEILLANT_GENERAL', 'DIRECTEUR_ADJOINT']
    )
  );

COMMENT ON TABLE parent_communication_hides IS 'Éléments masqués par un parent pour un enfant donné (non visible dans son fil)';
