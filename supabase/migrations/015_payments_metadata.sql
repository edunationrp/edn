-- Métadonnées paiement : lignes de frais, sélection tarifaire, notes
ALTER TABLE payments ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN payments.metadata IS 'line_items, fee_selection, total_due snapshot';
