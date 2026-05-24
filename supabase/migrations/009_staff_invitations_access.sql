-- EduNation - Migration 009 : accès invitations personnel élargi

-- Rôles autorisés à gérer les invitations (aligné avec l'application)
DROP POLICY IF EXISTS "staff_invitations_select" ON staff_invitations;
CREATE POLICY "staff_invitations_select" ON staff_invitations FOR SELECT
  USING (
    is_super_admin() OR
    has_any_school_role(school_id, ARRAY[
      'PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT', 'SECRETAIRE'
    ])
  );

DROP POLICY IF EXISTS "staff_invitations_insert" ON staff_invitations;
CREATE POLICY "staff_invitations_insert" ON staff_invitations FOR INSERT
  WITH CHECK (
    is_super_admin() OR
    has_any_school_role(school_id, ARRAY[
      'PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT', 'SECRETAIRE'
    ])
  );

DROP POLICY IF EXISTS "staff_invitations_update" ON staff_invitations;
CREATE POLICY "staff_invitations_update" ON staff_invitations FOR UPDATE
  USING (
    is_super_admin() OR
    has_any_school_role(school_id, ARRAY[
      'PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT', 'SECRETAIRE'
    ])
  );
