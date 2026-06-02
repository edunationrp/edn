-- Seuils d'alerte absences (vie scolaire) + journal anti-doublon notifications

ALTER TABLE schools ADD COLUMN IF NOT EXISTS absence_alert_threshold INTEGER NOT NULL DEFAULT 5;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS absence_alert_window_days INTEGER NOT NULL DEFAULT 30;

ALTER TABLE schools DROP CONSTRAINT IF EXISTS schools_absence_alert_threshold_positive;
ALTER TABLE schools ADD CONSTRAINT schools_absence_alert_threshold_positive
  CHECK (absence_alert_threshold >= 1 AND absence_alert_threshold <= 50);

ALTER TABLE schools DROP CONSTRAINT IF EXISTS schools_absence_alert_window_positive;
ALTER TABLE schools ADD CONSTRAINT schools_absence_alert_window_positive
  CHECK (absence_alert_window_days >= 7 AND absence_alert_window_days <= 180);

CREATE TABLE IF NOT EXISTS attendance_absence_alert_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  period_key TEXT NOT NULL,
  absence_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (school_id, student_id, period_key)
);

CREATE INDEX IF NOT EXISTS idx_attendance_absence_alert_log_school
  ON attendance_absence_alert_log (school_id, created_at DESC);

ALTER TABLE attendance_absence_alert_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attendance_absence_alert_log_staff_select" ON attendance_absence_alert_log;
CREATE POLICY "attendance_absence_alert_log_staff_select"
  ON attendance_absence_alert_log FOR SELECT
  USING (
    is_super_admin()
    OR has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'CENSEUR', 'SECRETAIRE', 'VIE_SCOLAIRE', 'SURVEILLANT_GENERAL', 'CONSEILLER', 'CONSEILLER_EDUCATION', 'DIRECTEUR_ADJOINT', 'FONDATEUR']
    )
  );

DROP POLICY IF EXISTS "attendance_absence_alert_log_service_insert" ON attendance_absence_alert_log;
CREATE POLICY "attendance_absence_alert_log_service_insert"
  ON attendance_absence_alert_log FOR INSERT
  WITH CHECK (is_super_admin() OR true);
