-- RLS pour niveaux, classes et matières (accès proviseur / direction)

-- ============================================================
-- NIVEAUX SCOLAIRES
-- ============================================================
DROP POLICY IF EXISTS "class_levels_select" ON class_levels;
CREATE POLICY "class_levels_select" ON class_levels FOR SELECT
  USING (is_super_admin() OR can_access_school(school_id));

DROP POLICY IF EXISTS "class_levels_insert" ON class_levels;
CREATE POLICY "class_levels_insert" ON class_levels FOR INSERT
  WITH CHECK (
    is_super_admin() OR
    has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT', 'SUPER_ADMIN_EDUNATION']
    )
  );

DROP POLICY IF EXISTS "class_levels_update" ON class_levels;
CREATE POLICY "class_levels_update" ON class_levels FOR UPDATE
  USING (
    is_super_admin() OR
    has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT', 'SUPER_ADMIN_EDUNATION']
    )
  );

DROP POLICY IF EXISTS "class_levels_delete" ON class_levels;
CREATE POLICY "class_levels_delete" ON class_levels FOR DELETE
  USING (
    is_super_admin() OR
    has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT', 'SUPER_ADMIN_EDUNATION']
    )
  );

-- ============================================================
-- CLASSES
-- ============================================================
DROP POLICY IF EXISTS "classes_select" ON classes;
CREATE POLICY "classes_select" ON classes FOR SELECT
  USING (is_super_admin() OR can_access_school(school_id));

DROP POLICY IF EXISTS "classes_insert" ON classes;
CREATE POLICY "classes_insert" ON classes FOR INSERT
  WITH CHECK (
    is_super_admin() OR
    has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT', 'SUPER_ADMIN_EDUNATION']
    )
  );

DROP POLICY IF EXISTS "classes_update" ON classes;
CREATE POLICY "classes_update" ON classes FOR UPDATE
  USING (
    is_super_admin() OR
    has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT', 'SUPER_ADMIN_EDUNATION']
    )
  );

DROP POLICY IF EXISTS "classes_delete" ON classes;
CREATE POLICY "classes_delete" ON classes FOR DELETE
  USING (
    is_super_admin() OR
    has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT', 'SUPER_ADMIN_EDUNATION']
    )
  );

-- ============================================================
-- MATIÈRES
-- ============================================================
DROP POLICY IF EXISTS "subjects_select" ON subjects;
CREATE POLICY "subjects_select" ON subjects FOR SELECT
  USING (is_super_admin() OR can_access_school(school_id));

DROP POLICY IF EXISTS "subjects_insert" ON subjects;
CREATE POLICY "subjects_insert" ON subjects FOR INSERT
  WITH CHECK (
    is_super_admin() OR
    has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'FONDATEUR', 'SUPER_ADMIN_EDUNATION']
    )
  );

DROP POLICY IF EXISTS "subjects_update" ON subjects;
CREATE POLICY "subjects_update" ON subjects FOR UPDATE
  USING (
    is_super_admin() OR
    has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'FONDATEUR', 'SUPER_ADMIN_EDUNATION']
    )
  );

DROP POLICY IF EXISTS "subjects_delete" ON subjects;
CREATE POLICY "subjects_delete" ON subjects FOR DELETE
  USING (
    is_super_admin() OR
    has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'FONDATEUR', 'SUPER_ADMIN_EDUNATION']
    )
  );
