-- Élargir la plage d'opacité et relever les valeurs trop faibles
-- Ordre : retirer la contrainte → corriger les données → réappliquer la contrainte

ALTER TABLE schools DROP CONSTRAINT IF EXISTS schools_logo_watermark_opacity_range;

UPDATE schools
SET logo_watermark_opacity = CASE
  WHEN logo_watermark_opacity IS NULL OR logo_watermark_opacity < 0.06 THEN 0.11
  WHEN logo_watermark_opacity > 0.18 THEN 0.18
  ELSE logo_watermark_opacity
END;

ALTER TABLE schools ALTER COLUMN logo_watermark_opacity SET DEFAULT 0.11;

ALTER TABLE schools ADD CONSTRAINT schools_logo_watermark_opacity_range
  CHECK (logo_watermark_opacity >= 0.06 AND logo_watermark_opacity <= 0.18);
