-- Policies RLS pour timetable_slots + demandes de modification.
-- Les professeurs consultent l'emploi du temps officiel et demandent les changements au censeur.

DROP POLICY IF EXISTS "timetable_slots_select" ON timetable_slots;
CREATE POLICY "timetable_slots_select" ON timetable_slots FOR SELECT
  USING (
    is_super_admin() OR
    can_access_school(school_id)
  );

DROP POLICY IF EXISTS "timetable_slots_insert_staff" ON timetable_slots;
CREATE POLICY "timetable_slots_insert_staff" ON timetable_slots FOR INSERT
  WITH CHECK (
    is_super_admin() OR
    has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'FONDATEUR', 'CENSEUR', 'DIRECTEUR_ADJOINT']
    )
  );

DROP POLICY IF EXISTS "timetable_slots_update_staff" ON timetable_slots;
CREATE POLICY "timetable_slots_update_staff" ON timetable_slots FOR UPDATE
  USING (
    is_super_admin() OR
    has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'FONDATEUR', 'CENSEUR', 'DIRECTEUR_ADJOINT']
    )
  );

DROP POLICY IF EXISTS "timetable_slots_delete_staff" ON timetable_slots;
CREATE POLICY "timetable_slots_delete_staff" ON timetable_slots FOR DELETE
  USING (
    is_super_admin() OR
    has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'FONDATEUR', 'CENSEUR', 'DIRECTEUR_ADJOINT']
    )
  );

CREATE TABLE IF NOT EXISTS timetable_change_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  timetable_slot_id UUID REFERENCES timetable_slots(id) ON DELETE SET NULL,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requested_day_of_week INTEGER NOT NULL CHECK (requested_day_of_week BETWEEN 1 AND 7),
  requested_start_time TIME NOT NULL,
  requested_end_time TIME NOT NULL,
  requested_room TEXT,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE timetable_change_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "timetable_change_requests_select" ON timetable_change_requests;
CREATE POLICY "timetable_change_requests_select" ON timetable_change_requests FOR SELECT
  USING (
    is_super_admin() OR
    teacher_id = auth.uid() OR
    has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'FONDATEUR', 'CENSEUR', 'DIRECTEUR_ADJOINT']
    )
  );

DROP POLICY IF EXISTS "timetable_change_requests_insert_teacher" ON timetable_change_requests;
CREATE POLICY "timetable_change_requests_insert_teacher" ON timetable_change_requests FOR INSERT
  WITH CHECK (
    teacher_id = auth.uid() AND
    can_access_school(school_id) AND
    requested_start_time < requested_end_time
  );

DROP POLICY IF EXISTS "timetable_change_requests_update_staff" ON timetable_change_requests;
CREATE POLICY "timetable_change_requests_update_staff" ON timetable_change_requests FOR UPDATE
  USING (
    is_super_admin() OR
    has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'FONDATEUR', 'CENSEUR', 'DIRECTEUR_ADJOINT']
    )
  );

CREATE INDEX IF NOT EXISTS idx_timetable_change_requests_school_status
  ON timetable_change_requests(school_id, status);

CREATE INDEX IF NOT EXISTS idx_timetable_change_requests_teacher
  ON timetable_change_requests(teacher_id, created_at DESC);
