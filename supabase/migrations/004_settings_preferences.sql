-- EduNation - Migration 004 : preferences utilisateur + RLS calendrier scolaire

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- Années scolaires
DROP POLICY IF EXISTS "school_years_select" ON school_years;
CREATE POLICY "school_years_select" ON school_years FOR SELECT
  USING (is_super_admin() OR can_access_school(school_id));

DROP POLICY IF EXISTS "school_years_insert" ON school_years;
CREATE POLICY "school_years_insert" ON school_years FOR INSERT
  WITH CHECK (
    is_super_admin() OR
    has_any_school_role(school_id, ARRAY['PROVISEUR', 'FONDATEUR', 'SUPER_ADMIN_EDUNATION'])
  );

DROP POLICY IF EXISTS "school_years_update" ON school_years;
CREATE POLICY "school_years_update" ON school_years FOR UPDATE
  USING (
    is_super_admin() OR
    has_any_school_role(school_id, ARRAY['PROVISEUR', 'FONDATEUR', 'SUPER_ADMIN_EDUNATION'])
  );

-- Périodes (trimestres / semestres)
DROP POLICY IF EXISTS "terms_select" ON terms;
CREATE POLICY "terms_select" ON terms FOR SELECT
  USING (is_super_admin() OR can_access_school(school_id));

DROP POLICY IF EXISTS "terms_update" ON terms;
CREATE POLICY "terms_update" ON terms FOR UPDATE
  USING (
    is_super_admin() OR
    has_any_school_role(school_id, ARRAY['PROVISEUR', 'FONDATEUR', 'SUPER_ADMIN_EDUNATION'])
  );
