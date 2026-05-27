-- Module finance scolaire : tarifs officiels (proviseur) + dossiers de frais élève

CREATE TABLE IF NOT EXISTS official_tuition_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  school_year_id UUID NOT NULL REFERENCES school_years(id) ON DELETE CASCADE,
  class_level_id UUID NOT NULL REFERENCES class_levels(id) ON DELETE CASCADE,
  series TEXT NOT NULL DEFAULT '',
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (school_id, school_year_id, class_level_id, series)
);

CREATE TABLE IF NOT EXISTS school_extra_fee_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  suggested_amount NUMERIC(12,2) CHECK (suggested_amount IS NULL OR suggested_amount >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_fee_dossiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_year_id UUID NOT NULL REFERENCES school_years(id) ON DELETE CASCADE,
  tuition_rate_id UUID REFERENCES official_tuition_rates(id) ON DELETE SET NULL,
  tuition_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  level_name TEXT,
  series TEXT,
  extra_fees JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, school_year_id)
);

ALTER TABLE classes ADD COLUMN IF NOT EXISTS series TEXT;

CREATE INDEX IF NOT EXISTS idx_tuition_rates_school_year
  ON official_tuition_rates (school_id, school_year_id);
CREATE INDEX IF NOT EXISTS idx_student_fee_dossiers_student
  ON student_fee_dossiers (student_id, school_year_id);

ALTER TABLE official_tuition_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_extra_fee_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_fee_dossiers ENABLE ROW LEVEL SECURITY;

-- Lecture : personnel de l'école
DROP POLICY IF EXISTS "official_tuition_rates_select" ON official_tuition_rates;
CREATE POLICY "official_tuition_rates_select" ON official_tuition_rates FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM user_school_roles
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

DROP POLICY IF EXISTS "extra_fee_templates_select" ON school_extra_fee_templates;
CREATE POLICY "extra_fee_templates_select" ON school_extra_fee_templates FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM user_school_roles
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

DROP POLICY IF EXISTS "student_fee_dossiers_select" ON student_fee_dossiers;
CREATE POLICY "student_fee_dossiers_select" ON student_fee_dossiers FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM user_school_roles
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- Écriture tarifs officiels : direction uniquement
DROP POLICY IF EXISTS "official_tuition_rates_write" ON official_tuition_rates;
CREATE POLICY "official_tuition_rates_write" ON official_tuition_rates FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM user_school_roles
      WHERE user_id = auth.uid() AND is_active = TRUE
        AND role_code IN ('PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT', 'SUPER_ADMIN_EDUNATION')
    )
  )
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM user_school_roles
      WHERE user_id = auth.uid() AND is_active = TRUE
        AND role_code IN ('PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT', 'SUPER_ADMIN_EDUNATION')
    )
  );

DROP POLICY IF EXISTS "extra_fee_templates_write" ON school_extra_fee_templates;
CREATE POLICY "extra_fee_templates_write" ON school_extra_fee_templates FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM user_school_roles
      WHERE user_id = auth.uid() AND is_active = TRUE
        AND role_code IN ('PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT', 'SUPER_ADMIN_EDUNATION')
    )
  )
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM user_school_roles
      WHERE user_id = auth.uid() AND is_active = TRUE
        AND role_code IN ('PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT', 'SUPER_ADMIN_EDUNATION')
    )
  );

-- Dossiers frais : intendant + direction
DROP POLICY IF EXISTS "student_fee_dossiers_write" ON student_fee_dossiers;
CREATE POLICY "student_fee_dossiers_write" ON student_fee_dossiers FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM user_school_roles
      WHERE user_id = auth.uid() AND is_active = TRUE
        AND role_code IN ('INTENDANT', 'PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT', 'SECRETAIRE', 'SUPER_ADMIN_EDUNATION')
    )
  )
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM user_school_roles
      WHERE user_id = auth.uid() AND is_active = TRUE
        AND role_code IN ('INTENDANT', 'PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT', 'SECRETAIRE', 'SUPER_ADMIN_EDUNATION')
    )
  );

-- fee_structures : policies manquantes
DROP POLICY IF EXISTS "fee_structures_select" ON fee_structures;
CREATE POLICY "fee_structures_select" ON fee_structures FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM user_school_roles
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

DROP POLICY IF EXISTS "fee_structures_write" ON fee_structures;
CREATE POLICY "fee_structures_write" ON fee_structures FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM user_school_roles
      WHERE user_id = auth.uid() AND is_active = TRUE
        AND role_code IN ('PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT', 'SUPER_ADMIN_EDUNATION')
    )
  )
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM user_school_roles
      WHERE user_id = auth.uid() AND is_active = TRUE
        AND role_code IN ('PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT', 'SUPER_ADMIN_EDUNATION')
    )
  );
