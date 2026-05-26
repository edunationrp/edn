-- Permettre au personnel de mettre à jour les demandes d'inscription (workflow secrétariat)

DROP POLICY IF EXISTS "student_registration_requests_update" ON student_registration_requests;
CREATE POLICY "student_registration_requests_update" ON student_registration_requests FOR UPDATE
  USING (
    is_super_admin() OR
    has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'SECRETAIRE', 'SUPER_ADMIN_EDUNATION', 'DIRECTEUR_ADJOINT', 'FONDATEUR']
    )
  );
