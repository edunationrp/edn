-- ============================================================
-- Migration 017 — Ressources de cours (fichiers professeurs)
-- Bucket privé course-resources
-- ============================================================

CREATE TABLE IF NOT EXISTS course_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  school_year_id UUID NOT NULL REFERENCES school_years(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes INTEGER,
  type TEXT NOT NULL DEFAULT 'document'
    CHECK (type IN ('document', 'exercice', 'correction', 'cours', 'autre')),
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS course_resources_class_idx
  ON course_resources(class_id, school_year_id, is_published);

CREATE TRIGGER update_course_resources_updated_at
  BEFORE UPDATE ON course_resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE course_resources ENABLE ROW LEVEL SECURITY;

-- Professeur/staff : voir toutes les ressources de son école
CREATE POLICY "cr_staff_select"
  ON course_resources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_school_roles usr
      WHERE usr.user_id = auth.uid()
        AND usr.school_id = course_resources.school_id
        AND usr.is_active = TRUE
    )
  );

-- Professeur : créer des ressources pour ses classes
CREATE POLICY "cr_staff_insert"
  ON course_resources FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM user_school_roles usr
      WHERE usr.user_id = auth.uid()
        AND usr.school_id = course_resources.school_id
        AND usr.role_code IN ('PROFESSEUR', 'PROVISEUR', 'DIRECTEUR_ADJOINT', 'FONDATEUR', 'CENSEUR')
        AND usr.is_active = TRUE
    )
  );

-- Auteur peut modifier/supprimer ses ressources
CREATE POLICY "cr_staff_update"
  ON course_resources FOR UPDATE
  USING (uploaded_by = auth.uid());

CREATE POLICY "cr_staff_delete"
  ON course_resources FOR DELETE
  USING (uploaded_by = auth.uid());

-- Élève : lecture uniquement des ressources publiées de sa classe
CREATE POLICY "cr_student_select"
  ON course_resources FOR SELECT
  USING (
    is_published = TRUE
    AND class_id IN (
      SELECT se.class_id
      FROM student_enrollments se
      JOIN students s ON s.id = se.student_id
      WHERE s.user_id = auth.uid()
        AND se.status = 'active'
    )
  );

-- ============================================================
-- Bucket privé pour les fichiers (à créer via SQL Storage API)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-resources',
  'course-resources',
  FALSE,
  52428800, -- 50 MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation']
)
ON CONFLICT (id) DO NOTHING;

-- Politique storage : staff upload
CREATE POLICY "cr_storage_staff_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'course-resources'
    AND auth.role() = 'authenticated'
  );

-- Politique storage : staff/élève lecture via signed URL
CREATE POLICY "cr_storage_authenticated_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'course-resources'
    AND auth.role() = 'authenticated'
  );

-- Staff suppression de ses propres fichiers
CREATE POLICY "cr_storage_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'course-resources'
    AND owner = auth.uid()
  );
