-- Realtime sur chat_participant_state pour les accusés de lecture (style WhatsApp)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_participant_state'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_participant_state;
  END IF;
END $$;

ALTER TABLE chat_participant_state REPLICA IDENTITY FULL;
