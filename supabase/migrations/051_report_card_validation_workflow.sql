-- Workflow validation proviseur avant publication aux familles

ALTER TABLE report_cards
  ADD COLUMN IF NOT EXISTS correction_note TEXT,
  ADD COLUMN IF NOT EXISTS correction_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS correction_requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE report_cards DROP CONSTRAINT IF EXISTS report_cards_status_check;
ALTER TABLE report_cards ADD CONSTRAINT report_cards_status_check
  CHECK (status IN (
    'draft',
    'generated',
    'correction_requested',
    'validated',
    'published',
    'archived'
  ));

CREATE INDEX IF NOT EXISTS idx_report_cards_pending_validation
  ON report_cards (school_id, status)
  WHERE status IN ('generated', 'correction_requested');

CREATE INDEX IF NOT EXISTS idx_report_cards_validated_unpublished
  ON report_cards (school_id, status)
  WHERE status = 'validated';
