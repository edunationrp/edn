-- ============================================================
-- Migration 043 — Assistant IA tuteur (portail élève)
-- Idempotent
-- ============================================================

CREATE TABLE IF NOT EXISTS tutor_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Nouvelle conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tutor_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES tutor_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tutor_conversations_user_updated
  ON tutor_conversations(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_tutor_messages_conversation_created
  ON tutor_messages(conversation_id, created_at ASC);

ALTER TABLE tutor_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tutor_conversations_select_own" ON tutor_conversations;
CREATE POLICY "tutor_conversations_select_own"
  ON tutor_conversations FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "tutor_conversations_insert_own" ON tutor_conversations;
CREATE POLICY "tutor_conversations_insert_own"
  ON tutor_conversations FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    AND school_id IN (SELECT school_id FROM students WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "tutor_conversations_update_own" ON tutor_conversations;
CREATE POLICY "tutor_conversations_update_own"
  ON tutor_conversations FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "tutor_conversations_delete_own" ON tutor_conversations;
CREATE POLICY "tutor_conversations_delete_own"
  ON tutor_conversations FOR DELETE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "tutor_messages_select_own" ON tutor_messages;
CREATE POLICY "tutor_messages_select_own"
  ON tutor_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM tutor_conversations WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "tutor_messages_insert_own" ON tutor_messages;
CREATE POLICY "tutor_messages_insert_own"
  ON tutor_messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM tutor_conversations WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "tutor_messages_delete_own" ON tutor_messages;
CREATE POLICY "tutor_messages_delete_own"
  ON tutor_messages FOR DELETE
  USING (
    conversation_id IN (
      SELECT id FROM tutor_conversations WHERE user_id = auth.uid()
    )
  );
