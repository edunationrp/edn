-- Demandes d'annulation de suspension (réservées aux proviseurs)

CREATE TABLE IF NOT EXISTS suspension_appeal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  appeal_scope TEXT NOT NULL CHECK (appeal_scope IN ('ACCOUNT', 'SCHOOL')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  message TEXT NOT NULL,
  review_note TEXT,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suspension_appeals_requester
  ON suspension_appeal_requests (requester_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_suspension_appeals_status
  ON suspension_appeal_requests (status, created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_suspension_appeals_updated_at'
  ) THEN
    CREATE TRIGGER trg_suspension_appeals_updated_at
      BEFORE UPDATE ON suspension_appeal_requests
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

ALTER TABLE suspension_appeal_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "suspension_appeals_requester_select_own" ON suspension_appeal_requests;
CREATE POLICY "suspension_appeals_requester_select_own"
  ON suspension_appeal_requests FOR SELECT
  USING (requester_id = auth.uid());

DROP POLICY IF EXISTS "suspension_appeals_requester_insert_proviseur_only" ON suspension_appeal_requests;
CREATE POLICY "suspension_appeals_requester_insert_proviseur_only"
  ON suspension_appeal_requests FOR INSERT
  WITH CHECK (
    requester_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM user_school_roles usr
      WHERE usr.user_id = auth.uid()
        AND usr.role_code = 'PROVISEUR'
        AND usr.is_active = TRUE
        AND (
          (appeal_scope = 'ACCOUNT')
          OR (appeal_scope = 'SCHOOL' AND usr.school_id = suspension_appeal_requests.school_id)
        )
    )
  );

DROP POLICY IF EXISTS "suspension_appeals_super_admin_select" ON suspension_appeal_requests;
CREATE POLICY "suspension_appeals_super_admin_select"
  ON suspension_appeal_requests FOR SELECT
  USING (is_super_admin());

DROP POLICY IF EXISTS "suspension_appeals_super_admin_update" ON suspension_appeal_requests;
CREATE POLICY "suspension_appeals_super_admin_update"
  ON suspension_appeal_requests FOR UPDATE
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE OR REPLACE FUNCTION public.submit_my_suspension_appeal(
  p_message TEXT,
  p_school_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requester UUID := auth.uid();
  v_profile RECORD;
  v_scope TEXT;
  v_school_id UUID;
  v_request_id UUID;
BEGIN
  IF v_requester IS NULL THEN
    RAISE EXCEPTION 'Session invalide';
  END IF;

  IF NULLIF(TRIM(p_message), '') IS NULL THEN
    RAISE EXCEPTION 'Message requis';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM user_school_roles usr
    WHERE usr.user_id = v_requester
      AND usr.role_code = 'PROVISEUR'
      AND usr.is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'Seul le proviseur peut demander une annulation';
  END IF;

  SELECT id, is_active, account_status, suspended_until
  INTO v_profile
  FROM profiles
  WHERE id = v_requester
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profil introuvable';
  END IF;

  IF
    (v_profile.is_active = FALSE)
    OR (v_profile.account_status = 'SUSPENDED_TOTAL')
    OR (v_profile.account_status = 'SUSPENDED_TEMPORARY' AND (v_profile.suspended_until IS NULL OR v_profile.suspended_until > NOW()))
  THEN
    v_scope := 'ACCOUNT';
    v_school_id := NULL;
  ELSE
    v_scope := 'SCHOOL';
    v_school_id := p_school_id;

    IF v_school_id IS NULL THEN
      SELECT usr.school_id
      INTO v_school_id
      FROM user_school_roles usr
      JOIN schools s ON s.id = usr.school_id
      WHERE usr.user_id = v_requester
        AND usr.role_code = 'PROVISEUR'
        AND usr.is_active = TRUE
        AND (s.platform_status = 'SUSPENDED' OR s.platform_status = 'DISABLED' OR s.is_active = FALSE)
      ORDER BY usr.created_at ASC
      LIMIT 1;
    END IF;

    IF v_school_id IS NULL THEN
      RAISE EXCEPTION 'Aucune suspension active détectée';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM user_school_roles usr
      WHERE usr.user_id = v_requester
        AND usr.school_id = v_school_id
        AND usr.role_code = 'PROVISEUR'
        AND usr.is_active = TRUE
    ) THEN
      RAISE EXCEPTION 'Accès refusé pour cet établissement';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM suspension_appeal_requests sar
    WHERE sar.requester_id = v_requester
      AND sar.status = 'PENDING'
      AND sar.appeal_scope = v_scope
      AND (
        (v_scope = 'ACCOUNT' AND sar.school_id IS NULL)
        OR (v_scope = 'SCHOOL' AND sar.school_id = v_school_id)
      )
  ) THEN
    RAISE EXCEPTION 'Une demande en attente existe déjà';
  END IF;

  INSERT INTO suspension_appeal_requests (requester_id, school_id, appeal_scope, message)
  VALUES (v_requester, v_school_id, v_scope, TRIM(p_message))
  RETURNING id INTO v_request_id;

  RETURN v_request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_suspension_appeal(
  p_request_id UUID,
  p_status TEXT,
  p_review_note TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status TEXT;
  v_request RECORD;
BEGIN
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Accès refusé: super admin requis';
  END IF;

  v_status := UPPER(TRIM(COALESCE(p_status, '')));
  IF v_status NOT IN ('APPROVED', 'REJECTED') THEN
    RAISE EXCEPTION 'Statut invalide';
  END IF;

  SELECT id, requester_id, school_id, appeal_scope, status
  INTO v_request
  FROM suspension_appeal_requests
  WHERE id = p_request_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demande introuvable';
  END IF;

  UPDATE suspension_appeal_requests
  SET
    status = v_status,
    review_note = NULLIF(TRIM(p_review_note), ''),
    reviewed_by = auth.uid(),
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_request_id;

  PERFORM public.log_platform_admin_action(
    'REVIEW_SUSPENSION_APPEAL',
    'SUSPENSION_APPEAL',
    p_request_id,
    p_review_note,
    jsonb_build_object(
      'status', v_status,
      'requester_id', v_request.requester_id,
      'scope', v_request.appeal_scope,
      'school_id', v_request.school_id
    )
  );
END;
$$;
