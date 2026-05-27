-- Logos d'établissement (upload proviseur)

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('school-logos', 'school-logos', true, 5242880)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

DROP POLICY IF EXISTS school_logos_insert ON storage.objects;
CREATE POLICY school_logos_insert ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'school-logos'
    AND (
      is_super_admin()
      OR has_any_school_role(
        ((storage.foldername(name))[1])::uuid,
        ARRAY['PROVISEUR', 'FONDATEUR']
      )
    )
  );

DROP POLICY IF EXISTS school_logos_select ON storage.objects;
CREATE POLICY school_logos_select ON storage.objects FOR SELECT
  USING (
    bucket_id = 'school-logos'
    AND (
      is_super_admin()
      OR can_access_school(((storage.foldername(name))[1])::uuid)
    )
  );

DROP POLICY IF EXISTS school_logos_update ON storage.objects;
CREATE POLICY school_logos_update ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'school-logos'
    AND (
      is_super_admin()
      OR has_any_school_role(
        ((storage.foldername(name))[1])::uuid,
        ARRAY['PROVISEUR', 'FONDATEUR']
      )
    )
  );

DROP POLICY IF EXISTS school_logos_delete ON storage.objects;
CREATE POLICY school_logos_delete ON storage.objects FOR DELETE
  USING (
    bucket_id = 'school-logos'
    AND (
      is_super_admin()
      OR has_any_school_role(
        ((storage.foldername(name))[1])::uuid,
        ARRAY['PROVISEUR', 'FONDATEUR']
      )
    )
  );
