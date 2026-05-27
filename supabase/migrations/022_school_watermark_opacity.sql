-- Opacité du filigrane logo (0.03 – 0.08 recommandé)

ALTER TABLE schools ADD COLUMN IF NOT EXISTS logo_watermark_opacity REAL NOT NULL DEFAULT 0.05;

ALTER TABLE schools DROP CONSTRAINT IF EXISTS schools_logo_watermark_opacity_range;
ALTER TABLE schools ADD CONSTRAINT schools_logo_watermark_opacity_range
  CHECK (logo_watermark_opacity >= 0.03 AND logo_watermark_opacity <= 0.08);
