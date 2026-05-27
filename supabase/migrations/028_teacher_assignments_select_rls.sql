-- Les professeurs doivent lire leurs affectations classes/matières (RLS activé sans SELECT = dashboard vide).

DROP POLICY IF EXISTS "teacher_assignments_select" ON teacher_assignments;
CREATE POLICY "teacher_assignments_select" ON teacher_assignments FOR SELECT
  USING (
    is_super_admin() OR
    teacher_id = auth.uid() OR
    has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'FONDATEUR', 'SECRETAIRE', 'CENSEUR', 'DIRECTEUR_ADJOINT']
    )
  );

DROP POLICY IF EXISTS "teacher_assignments_insert_staff" ON teacher_assignments;
CREATE POLICY "teacher_assignments_insert_staff" ON teacher_assignments FOR INSERT
  WITH CHECK (
    is_super_admin() OR
    has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'FONDATEUR', 'SECRETAIRE', 'CENSEUR']
    )
  );
