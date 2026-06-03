-- Phase 2 : correspondance classes N → N+1 pour le passage

CREATE TABLE IF NOT EXISTS promotion_class_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES promotion_sessions(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  source_class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  target_class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  repeat_target_class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, source_class_id)
);

CREATE INDEX IF NOT EXISTS idx_promotion_class_mappings_session
  ON promotion_class_mappings (session_id);

ALTER TABLE promotion_class_mappings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS promotion_class_mappings_select ON promotion_class_mappings;
CREATE POLICY promotion_class_mappings_select ON promotion_class_mappings FOR SELECT
  USING (is_super_admin() OR can_access_school(school_id));

DROP POLICY IF EXISTS promotion_class_mappings_insert ON promotion_class_mappings;
CREATE POLICY promotion_class_mappings_insert ON promotion_class_mappings FOR INSERT
  WITH CHECK (
    is_super_admin()
    OR has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT', 'CENSEUR']
    )
  );

DROP POLICY IF EXISTS promotion_class_mappings_update ON promotion_class_mappings;
CREATE POLICY promotion_class_mappings_update ON promotion_class_mappings FOR UPDATE
  USING (
    is_super_admin()
    OR has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT']
    )
  );

DROP POLICY IF EXISTS promotion_class_mappings_delete ON promotion_class_mappings;
CREATE POLICY promotion_class_mappings_delete ON promotion_class_mappings FOR DELETE
  USING (
    is_super_admin()
    OR has_any_school_role(school_id, ARRAY['PROVISEUR', 'FONDATEUR'])
  );
