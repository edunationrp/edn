-- ============================================================
-- Migration 041 — Portail parent MVP2 : convocations + accès communications
-- Idempotent
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_parent_in_school(p_school_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM parent_student_relations
    WHERE parent_user_id = auth.uid()
      AND school_id = p_school_id
  );
$$;

CREATE TABLE IF NOT EXISTS parent_convocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  parent_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  convocation_date TIMESTAMPTZ,
  location TEXT,
  sent_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  read_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS parent_convocations_parent_idx
  ON parent_convocations(parent_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS parent_convocations_student_idx
  ON parent_convocations(student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS parent_convocations_school_idx
  ON parent_convocations(school_id, created_at DESC);

DROP TRIGGER IF EXISTS update_parent_convocations_updated_at ON parent_convocations;
CREATE TRIGGER update_parent_convocations_updated_at
  BEFORE UPDATE ON parent_convocations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE parent_convocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "parent_convocations_select_parent" ON parent_convocations;
CREATE POLICY "parent_convocations_select_parent"
  ON parent_convocations FOR SELECT
  USING (parent_user_id = auth.uid());

DROP POLICY IF EXISTS "parent_convocations_select_staff" ON parent_convocations;
CREATE POLICY "parent_convocations_select_staff"
  ON parent_convocations FOR SELECT
  USING (
    is_super_admin()
    OR has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'CENSEUR', 'SECRETAIRE', 'DIRECTEUR_ADJOINT', 'VIE_SCOLAIRE', 'CONSEILLER']
    )
  );

DROP POLICY IF EXISTS "parent_convocations_insert_staff" ON parent_convocations;
CREATE POLICY "parent_convocations_insert_staff"
  ON parent_convocations FOR INSERT
  WITH CHECK (
    is_super_admin()
    OR has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'CENSEUR', 'SECRETAIRE', 'DIRECTEUR_ADJOINT', 'VIE_SCOLAIRE', 'CONSEILLER']
    )
  );

DROP POLICY IF EXISTS "parent_convocations_update_parent" ON parent_convocations;
CREATE POLICY "parent_convocations_update_parent"
  ON parent_convocations FOR UPDATE
  USING (parent_user_id = auth.uid())
  WITH CHECK (parent_user_id = auth.uid());

DROP POLICY IF EXISTS "announcements_select" ON announcements;
CREATE POLICY "announcements_select" ON announcements FOR SELECT
  USING (can_access_school(school_id) OR is_parent_in_school(school_id));

DROP POLICY IF EXISTS "calendar_events_select" ON calendar_events;
CREATE POLICY "calendar_events_select" ON calendar_events FOR SELECT
  USING (is_super_admin() OR can_access_school(school_id) OR is_parent_in_school(school_id));
