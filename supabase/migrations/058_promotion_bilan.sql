-- Bilan de passage fin d'année (phase 1 : simulation, sans application des inscriptions)

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS promotion_passing_average NUMERIC(5,2) NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS promotion_average_rule TEXT NOT NULL DEFAULT 'last_term'
    CHECK (promotion_average_rule IN ('last_term', 'mean_of_terms'));

CREATE TABLE IF NOT EXISTS promotion_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  source_school_year_id UUID NOT NULL REFERENCES school_years(id) ON DELETE CASCADE,
  target_school_year_id UUID REFERENCES school_years(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'applied')),
  label TEXT,
  passing_average NUMERIC(5,2) NOT NULL,
  average_rule TEXT NOT NULL
    CHECK (average_rule IN ('last_term', 'mean_of_terms')),
  reference_term_id UUID REFERENCES terms(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promotion_sessions_school_year
  ON promotion_sessions (school_id, source_school_year_id);

CREATE TABLE IF NOT EXISTS promotion_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES promotion_sessions(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  source_class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  computed_average NUMERIC(5,2),
  proposed_status TEXT NOT NULL
    CHECK (proposed_status IN ('admitted', 'repeat', 'graduate', 'incomplete')),
  final_status TEXT NOT NULL
    CHECK (final_status IN ('admitted', 'repeat', 'graduate', 'incomplete', 'pending')),
  override_reason TEXT,
  overridden_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  overridden_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_promotion_results_session_class
  ON promotion_results (session_id, source_class_id);

CREATE INDEX IF NOT EXISTS idx_promotion_results_session_status
  ON promotion_results (session_id, final_status);

ALTER TABLE promotion_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS promotion_sessions_select ON promotion_sessions;
CREATE POLICY promotion_sessions_select ON promotion_sessions FOR SELECT
  USING (is_super_admin() OR can_access_school(school_id));

DROP POLICY IF EXISTS promotion_sessions_insert ON promotion_sessions;
CREATE POLICY promotion_sessions_insert ON promotion_sessions FOR INSERT
  WITH CHECK (
    is_super_admin()
    OR has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT', 'CENSEUR']
    )
  );

DROP POLICY IF EXISTS promotion_sessions_update ON promotion_sessions;
CREATE POLICY promotion_sessions_update ON promotion_sessions FOR UPDATE
  USING (
    is_super_admin()
    OR has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT']
    )
  );

DROP POLICY IF EXISTS promotion_sessions_delete ON promotion_sessions;
CREATE POLICY promotion_sessions_delete ON promotion_sessions FOR DELETE
  USING (
    is_super_admin()
    OR has_any_school_role(school_id, ARRAY['PROVISEUR', 'FONDATEUR'])
  );

DROP POLICY IF EXISTS promotion_results_select ON promotion_results;
CREATE POLICY promotion_results_select ON promotion_results FOR SELECT
  USING (is_super_admin() OR can_access_school(school_id));

DROP POLICY IF EXISTS promotion_results_insert ON promotion_results;
CREATE POLICY promotion_results_insert ON promotion_results FOR INSERT
  WITH CHECK (
    is_super_admin()
    OR has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT', 'CENSEUR']
    )
  );

DROP POLICY IF EXISTS promotion_results_update ON promotion_results;
CREATE POLICY promotion_results_update ON promotion_results FOR UPDATE
  USING (
    is_super_admin()
    OR has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT']
    )
  );

DROP POLICY IF EXISTS promotion_results_delete ON promotion_results;
CREATE POLICY promotion_results_delete ON promotion_results FOR DELETE
  USING (
    is_super_admin()
    OR has_any_school_role(school_id, ARRAY['PROVISEUR', 'FONDATEUR'])
  );
