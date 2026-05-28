-- ============================================================
-- Migration 037 — Notifications : marquer comme lues (propre compte)
-- Idempotent
-- ============================================================

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
