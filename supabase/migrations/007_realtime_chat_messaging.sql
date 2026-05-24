-- EduNation - Migration 007 : messagerie temps réel (chat staff)

-- ============================================================
-- TABLES CHAT
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  participant_one UUID NOT NULL REFERENCES profiles(id),
  participant_two UUID NOT NULL REFERENCES profiles(id),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_preview TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chat_participants_ordered CHECK (participant_one < participant_two),
  UNIQUE (school_id, participant_one, participant_two)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  body TEXT,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'audio', 'image', 'file')),
  attachment_url TEXT,
  attachment_name TEXT,
  attachment_mime TEXT,
  attachment_size BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_participant_state (
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_school_last ON chat_conversations (school_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_participants ON chat_conversations (participant_one, participant_two);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_created ON chat_messages (conversation_id, created_at ASC);

-- ============================================================
-- HELPERS
-- ============================================================

CREATE OR REPLACE FUNCTION is_chat_participant(conv_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM chat_conversations c
    WHERE c.id = conv_id
      AND (c.participant_one = auth.uid() OR c.participant_two = auth.uid())
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION is_school_messaging_staff(p_user_id UUID, p_school_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_school_roles usr
    WHERE usr.user_id = p_user_id
      AND usr.school_id = p_school_id
      AND usr.is_active = true
      AND usr.role_code NOT IN ('ELEVE', 'PARENT', 'PARENT_ILLETRE')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION get_my_unread_chat_count()
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM chat_messages cm
  INNER JOIN chat_conversations cc ON cc.id = cm.conversation_id
  INNER JOIN chat_participant_state cps
    ON cps.conversation_id = cm.conversation_id AND cps.user_id = auth.uid()
  WHERE (cc.participant_one = auth.uid() OR cc.participant_two = auth.uid())
    AND cm.sender_id != auth.uid()
    AND cm.created_at > cps.last_read_at;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_chat_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_conversations
  SET
    last_message_at = NEW.created_at,
    last_message_preview = COALESCE(
      CASE NEW.message_type
        WHEN 'text' THEN LEFT(COALESCE(NEW.body, ''), 120)
        WHEN 'audio' THEN '🎤 Message vocal'
        WHEN 'image' THEN '📷 Photo'
        WHEN 'file' THEN '📎 ' || COALESCE(NEW.attachment_name, 'Fichier')
        ELSE LEFT(COALESCE(NEW.body, ''), 120)
      END,
      ''
    )
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS chat_messages_update_conversation ON chat_messages;
CREATE TRIGGER chat_messages_update_conversation
  AFTER INSERT ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_chat_conversation_last_message();

-- ============================================================
-- RLS CHAT
-- ============================================================

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participant_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chat_conversations_select ON chat_conversations;
CREATE POLICY chat_conversations_select ON chat_conversations FOR SELECT
  USING (participant_one = auth.uid() OR participant_two = auth.uid());

DROP POLICY IF EXISTS chat_conversations_insert ON chat_conversations;
CREATE POLICY chat_conversations_insert ON chat_conversations FOR INSERT
  WITH CHECK (
    can_access_school(school_id)
    AND (participant_one = auth.uid() OR participant_two = auth.uid())
  );

DROP POLICY IF EXISTS chat_messages_select ON chat_messages;
CREATE POLICY chat_messages_select ON chat_messages FOR SELECT
  USING (is_chat_participant(conversation_id));

DROP POLICY IF EXISTS chat_messages_insert ON chat_messages;
CREATE POLICY chat_messages_insert ON chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND is_chat_participant(conversation_id)
  );

DROP POLICY IF EXISTS chat_participant_state_select ON chat_participant_state;
CREATE POLICY chat_participant_state_select ON chat_participant_state FOR SELECT
  USING (user_id = auth.uid() OR is_chat_participant(conversation_id));

DROP POLICY IF EXISTS chat_participant_state_insert ON chat_participant_state;
CREATE POLICY chat_participant_state_insert ON chat_participant_state FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND is_chat_participant(conversation_id)
  );

DROP POLICY IF EXISTS chat_participant_state_update ON chat_participant_state;
CREATE POLICY chat_participant_state_update ON chat_participant_state FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================
-- RLS ANCIEN SYSTÈME MESSAGES (compléter)
-- ============================================================

DROP POLICY IF EXISTS messages_insert ON messages;
CREATE POLICY messages_insert ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid() AND can_access_school(school_id));

DROP POLICY IF EXISTS message_recipients_insert ON message_recipients;
CREATE POLICY message_recipients_insert ON message_recipients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = message_id AND m.sender_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS message_recipients_update ON message_recipients;
CREATE POLICY message_recipients_update ON message_recipients FOR UPDATE
  USING (recipient_id = auth.uid());

-- ============================================================
-- REALTIME
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_conversations;
  END IF;
END $$;

-- ============================================================
-- STORAGE : pièces jointes messagerie
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('message-attachments', 'message-attachments', true, 52428800)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 52428800;

DROP POLICY IF EXISTS message_attachments_insert ON storage.objects;
CREATE POLICY message_attachments_insert ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'message-attachments'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM chat_conversations cc
      WHERE cc.id = ((storage.foldername(name))[2])::uuid
        AND cc.school_id = ((storage.foldername(name))[1])::uuid
        AND (cc.participant_one = auth.uid() OR cc.participant_two = auth.uid())
    )
  );

DROP POLICY IF EXISTS message_attachments_select ON storage.objects;
CREATE POLICY message_attachments_select ON storage.objects FOR SELECT
  USING (
    bucket_id = 'message-attachments'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM chat_conversations cc
      WHERE cc.id = ((storage.foldername(name))[2])::uuid
        AND (cc.participant_one = auth.uid() OR cc.participant_two = auth.uid())
    )
  );
