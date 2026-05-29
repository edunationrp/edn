-- Annonces enrichies : catégorie, image de couverture, pièce jointe PDF

ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('general', 'event', 'info', 'urgent')),
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS attachment_url TEXT,
  ADD COLUMN IF NOT EXISTS attachment_name TEXT;

COMMENT ON COLUMN announcements.category IS 'general | event | info | urgent';
COMMENT ON COLUMN announcements.cover_image_url IS 'URL publique image (affiche, photo)';
COMMENT ON COLUMN announcements.attachment_url IS 'URL publique document PDF';

DROP POLICY IF EXISTS "announcements_insert" ON announcements;
CREATE POLICY "announcements_insert" ON announcements FOR INSERT
  WITH CHECK (
    is_super_admin()
    OR has_any_school_role(
      school_id,
      ARRAY[
        'PROVISEUR', 'FONDATEUR', 'SECRETAIRE', 'VIE_SCOLAIRE',
        'SURVEILLANT_GENERAL', 'DIRECTEUR_ADJOINT'
      ]
    )
  );

DROP POLICY IF EXISTS "announcements_update" ON announcements;
CREATE POLICY "announcements_update" ON announcements FOR UPDATE
  USING (
    is_super_admin()
    OR has_any_school_role(
      school_id,
      ARRAY['PROVISEUR', 'FONDATEUR', 'SECRETAIRE', 'VIE_SCOLAIRE', 'SURVEILLANT_GENERAL', 'DIRECTEUR_ADJOINT']
    )
  );

-- Bucket fichiers annonces (public lecture pour parents via URL)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'school-announcements',
  'school-announcements',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS school_announcements_insert ON storage.objects;
CREATE POLICY school_announcements_insert ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'school-announcements'
    AND (
      is_super_admin()
      OR has_any_school_role(
        ((storage.foldername(name))[1])::uuid,
        ARRAY[
          'PROVISEUR', 'FONDATEUR', 'SECRETAIRE', 'VIE_SCOLAIRE',
          'SURVEILLANT_GENERAL', 'DIRECTEUR_ADJOINT'
        ]
      )
    )
  );

DROP POLICY IF EXISTS school_announcements_select ON storage.objects;
CREATE POLICY school_announcements_select ON storage.objects FOR SELECT
  USING (
    bucket_id = 'school-announcements'
    AND (
      is_super_admin()
      OR can_access_school(((storage.foldername(name))[1])::uuid)
      OR is_parent_in_school(((storage.foldername(name))[1])::uuid)
    )
  );

DROP POLICY IF EXISTS school_announcements_delete ON storage.objects;
CREATE POLICY school_announcements_delete ON storage.objects FOR DELETE
  USING (
    bucket_id = 'school-announcements'
    AND (
      is_super_admin()
      OR has_any_school_role(
        ((storage.foldername(name))[1])::uuid,
        ARRAY['PROVISEUR', 'FONDATEUR', 'SECRETAIRE', 'VIE_SCOLAIRE', 'SURVEILLANT_GENERAL', 'DIRECTEUR_ADJOINT']
      )
    )
  );
