-- Helper centralisé pour détecter le contexte de suspension
-- (compte + établissement), sans dépendre des policies RLS.

CREATE OR REPLACE FUNCTION public.get_my_suspension_context()
RETURNS TABLE (
  account_blocked BOOLEAN,
  account_status TEXT,
  account_reason TEXT,
  account_suspended_until TIMESTAMPTZ,
  school_blocked BOOLEAN,
  school_id UUID,
  school_name TEXT,
  school_reason TEXT,
  school_suspended_until TIMESTAMPTZ,
  is_proviseur BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_profile RECORD;
  v_school RECORD;
BEGIN
  IF v_uid IS NULL THEN
    RETURN QUERY SELECT
      FALSE, 'ACTIVE'::TEXT, NULL::TEXT, NULL::TIMESTAMPTZ,
      FALSE, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TIMESTAMPTZ,
      FALSE;
    RETURN;
  END IF;

  SELECT
    p.is_active,
    p.account_status,
    p.suspension_reason,
    p.suspended_until
  INTO v_profile
  FROM profiles p
  WHERE p.id = v_uid
  LIMIT 1;

  SELECT
    s.id,
    s.name,
    s.status_reason,
    s.suspended_until
  INTO v_school
  FROM user_school_roles usr
  JOIN schools s ON s.id = usr.school_id
  WHERE usr.user_id = v_uid
    AND usr.is_active = TRUE
    AND (
      s.is_active = FALSE
      OR s.platform_status = 'DISABLED'
      OR (
        s.platform_status = 'SUSPENDED'
        AND (s.suspended_until IS NULL OR s.suspended_until > NOW())
      )
    )
  ORDER BY usr.created_at ASC
  LIMIT 1;

  RETURN QUERY SELECT
    (
      v_profile IS NULL
      OR v_profile.is_active = FALSE
      OR v_profile.account_status = 'SUSPENDED_TOTAL'
      OR (
        v_profile.account_status = 'SUSPENDED_TEMPORARY'
        AND (v_profile.suspended_until IS NULL OR v_profile.suspended_until > NOW())
      )
    ) AS account_blocked,
    COALESCE(v_profile.account_status, 'ACTIVE')::TEXT AS account_status,
    v_profile.suspension_reason::TEXT AS account_reason,
    v_profile.suspended_until::TIMESTAMPTZ AS account_suspended_until,
    (v_school.id IS NOT NULL) AS school_blocked,
    v_school.id::UUID AS school_id,
    v_school.name::TEXT AS school_name,
    v_school.status_reason::TEXT AS school_reason,
    v_school.suspended_until::TIMESTAMPTZ AS school_suspended_until,
    EXISTS (
      SELECT 1
      FROM user_school_roles usr2
      WHERE usr2.user_id = v_uid
        AND usr2.role_code = 'PROVISEUR'
        AND usr2.is_active = TRUE
    ) AS is_proviseur;
END;
$$;
