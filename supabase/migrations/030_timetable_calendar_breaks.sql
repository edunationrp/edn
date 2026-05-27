-- Pauses configurables, événements calendrier, description sur les créneaux

ALTER TABLE timetable_slots
  ADD COLUMN IF NOT EXISTS description TEXT;

CREATE TABLE IF NOT EXISTS timetable_breaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES school_years(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  break_type TEXT NOT NULL CHECK (break_type IN ('pause', 'lunch')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  order_num INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  school_year_id UUID NOT NULL REFERENCES school_years(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (
    event_type IN ('homework', 'exam', 'holiday', 'event', 'meeting', 'replacement', 'note')
  ),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  end_date DATE,
  all_day BOOLEAN NOT NULL DEFAULT TRUE,
  start_time TIME,
  end_time TIME,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  room TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE timetable_breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "timetable_breaks_select" ON timetable_breaks;
CREATE POLICY "timetable_breaks_select" ON timetable_breaks FOR SELECT
  USING (is_super_admin() OR can_access_school(school_id));

DROP POLICY IF EXISTS "timetable_breaks_manage" ON timetable_breaks;
CREATE POLICY "timetable_breaks_manage" ON timetable_breaks FOR ALL
  USING (
    is_super_admin() OR
    has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'FONDATEUR', 'CENSEUR', 'DIRECTEUR_ADJOINT']
    )
  )
  WITH CHECK (
    is_super_admin() OR
    has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'FONDATEUR', 'CENSEUR', 'DIRECTEUR_ADJOINT']
    )
  );

DROP POLICY IF EXISTS "calendar_events_select" ON calendar_events;
CREATE POLICY "calendar_events_select" ON calendar_events FOR SELECT
  USING (is_super_admin() OR can_access_school(school_id));

DROP POLICY IF EXISTS "calendar_events_insert_staff" ON calendar_events;
CREATE POLICY "calendar_events_insert_staff" ON calendar_events FOR INSERT
  WITH CHECK (
    is_super_admin() OR
    has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'FONDATEUR', 'CENSEUR', 'DIRECTEUR_ADJOINT', 'PROFESSEUR']
    )
  );

DROP POLICY IF EXISTS "calendar_events_update_staff" ON calendar_events;
CREATE POLICY "calendar_events_update_staff" ON calendar_events FOR UPDATE
  USING (
    is_super_admin() OR
    has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'FONDATEUR', 'CENSEUR', 'DIRECTEUR_ADJOINT']
    ) OR
    (teacher_id = auth.uid() AND created_by = auth.uid())
  );

DROP POLICY IF EXISTS "calendar_events_delete_staff" ON calendar_events;
CREATE POLICY "calendar_events_delete_staff" ON calendar_events FOR DELETE
  USING (
    is_super_admin() OR
    has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'FONDATEUR', 'CENSEUR', 'DIRECTEUR_ADJOINT']
    ) OR
    (teacher_id = auth.uid() AND created_by = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_calendar_events_school_date
  ON calendar_events(school_id, event_date);

CREATE INDEX IF NOT EXISTS idx_timetable_breaks_school
  ON timetable_breaks(school_id, order_num);
