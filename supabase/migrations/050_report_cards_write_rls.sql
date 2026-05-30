-- RLS écriture bulletins (secrétariat / direction)

DROP POLICY IF EXISTS report_cards_insert ON report_cards;
CREATE POLICY report_cards_insert ON report_cards FOR INSERT
  WITH CHECK (
    is_super_admin()
    OR has_any_school_role(
      school_id,
      ARRAY['SECRETAIRE', 'PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT', 'CENSEUR']
    )
  );

DROP POLICY IF EXISTS report_cards_update ON report_cards;
CREATE POLICY report_cards_update ON report_cards FOR UPDATE
  USING (
    is_super_admin()
    OR has_any_school_role(
      school_id,
      ARRAY['SECRETAIRE', 'PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT', 'CENSEUR']
    )
  );
