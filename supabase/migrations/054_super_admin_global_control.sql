-- Super admin : contrôle global plateforme
-- Objectifs:
-- 1) Suspension utilisateur totale / temporaire
-- 2) Désactivation / suspension d'un établissement
-- 3) Vue et pouvoir global super admin, sans casser les policies existantes

-- ============================================================
-- 1) Colonnes de statut (additives)
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_account_status_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_account_status_check
  CHECK (account_status IN ('ACTIVE', 'SUSPENDED_TOTAL', 'SUSPENDED_TEMPORARY'));

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS platform_status TEXT NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS status_reason TEXT,
  ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status_updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;

ALTER TABLE schools DROP CONSTRAINT IF EXISTS schools_platform_status_check;
ALTER TABLE schools
  ADD CONSTRAINT schools_platform_status_check
  CHECK (platform_status IN ('ACTIVE', 'SUSPENDED', 'DISABLED'));

-- ============================================================
-- 2) Helpers de contrôle d'accès global
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_profile_operational(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_ok BOOLEAN;
BEGIN
  SELECT
    p.is_active
    AND CASE
      WHEN p.account_status = 'ACTIVE' THEN TRUE
      WHEN p.account_status = 'SUSPENDED_TOTAL' THEN FALSE
      WHEN p.account_status = 'SUSPENDED_TEMPORARY' THEN
        p.suspended_until IS NOT NULL AND p.suspended_until <= NOW()
      ELSE TRUE
    END
  INTO v_ok
  FROM profiles p
  WHERE p.id = p_user_id;

  RETURN COALESCE(v_ok, FALSE);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_school_operational(p_school_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_ok BOOLEAN;
BEGIN
  SELECT
    s.is_active
    AND s.platform_status = 'ACTIVE'
  INTO v_ok
  FROM schools s
  WHERE s.id = p_school_id;

  RETURN COALESCE(v_ok, FALSE);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_user_super_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = p_user_id
      AND p.default_role = 'SUPER_ADMIN_EDUNATION'
  )
  OR EXISTS (
    SELECT 1
    FROM user_school_roles usr
    WHERE usr.user_id = p_user_id
      AND usr.role_code = 'SUPER_ADMIN_EDUNATION'
      AND usr.is_active = TRUE
  );
END;
$$;

-- Super admin opérationnel uniquement (si suspendu, il perd ses privilèges)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN public.is_profile_operational(auth.uid())
    AND public.is_user_super_admin(auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION public.has_school_role(p_school_id UUID, p_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN public.is_super_admin()
    OR (
      public.is_profile_operational(auth.uid())
      AND public.is_school_operational(p_school_id)
      AND EXISTS (
        SELECT 1
        FROM user_school_roles usr
        WHERE usr.user_id = auth.uid()
          AND usr.school_id = p_school_id
          AND usr.role_code = p_role
          AND usr.is_active = TRUE
      )
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.has_any_school_role(p_school_id UUID, p_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN public.is_super_admin()
    OR (
      public.is_profile_operational(auth.uid())
      AND public.is_school_operational(p_school_id)
      AND EXISTS (
        SELECT 1
        FROM user_school_roles usr
        WHERE usr.user_id = auth.uid()
          AND usr.school_id = p_school_id
          AND usr.role_code = ANY(p_roles)
          AND usr.is_active = TRUE
      )
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.can_access_school(p_school_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN public.is_super_admin()
    OR (
      public.is_profile_operational(auth.uid())
      AND public.is_school_operational(p_school_id)
      AND EXISTS (
        SELECT 1
        FROM user_school_roles usr
        WHERE usr.user_id = auth.uid()
          AND usr.school_id = p_school_id
          AND usr.is_active = TRUE
      )
    );
END;
$$;

-- ============================================================
-- 3) Journal central des actions sensibles plateforme
-- ============================================================

CREATE TABLE IF NOT EXISTS platform_admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_admin_actions_created_at
  ON platform_admin_actions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_admin_actions_target
  ON platform_admin_actions (target_type, target_id, created_at DESC);

ALTER TABLE platform_admin_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_admin_actions_super_admin_select" ON platform_admin_actions;
CREATE POLICY "platform_admin_actions_super_admin_select"
  ON platform_admin_actions FOR SELECT
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "platform_admin_actions_super_admin_insert" ON platform_admin_actions;
CREATE POLICY "platform_admin_actions_super_admin_insert"
  ON platform_admin_actions FOR INSERT
  WITH CHECK (public.is_super_admin() AND actor_id = auth.uid());

CREATE OR REPLACE FUNCTION public.log_platform_admin_action(
  p_action TEXT,
  p_target_type TEXT,
  p_target_id UUID,
  p_reason TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO platform_admin_actions (actor_id, action, target_type, target_id, reason, metadata)
  VALUES (auth.uid(), p_action, p_target_type, p_target_id, p_reason, COALESCE(p_metadata, '{}'::jsonb));
END;
$$;

-- ============================================================
-- 4) Actions super admin : suspension utilisateur
-- ============================================================

CREATE OR REPLACE FUNCTION public.super_admin_suspend_user_total(
  p_target_user_id UUID,
  p_reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_active_super_admins INTEGER;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Accès refusé: super admin requis';
  END IF;

  IF p_target_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur cible requis';
  END IF;

  IF auth.uid() = p_target_user_id THEN
    RAISE EXCEPTION 'Auto-suspension interdite';
  END IF;

  IF public.is_user_super_admin(p_target_user_id) THEN
    SELECT COUNT(*)
    INTO v_active_super_admins
    FROM profiles p
    WHERE public.is_user_super_admin(p.id)
      AND public.is_profile_operational(p.id);

    IF v_active_super_admins <= 1 THEN
      RAISE EXCEPTION 'Impossible de suspendre le dernier super admin actif';
    END IF;
  END IF;

  UPDATE profiles
  SET
    account_status = 'SUSPENDED_TOTAL',
    suspension_reason = NULLIF(TRIM(p_reason), ''),
    suspended_at = NOW(),
    suspended_until = NULL,
    suspended_by = auth.uid(),
    updated_at = NOW()
  WHERE id = p_target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Utilisateur introuvable';
  END IF;

  PERFORM public.log_platform_admin_action(
    'SUSPEND_USER_TOTAL',
    'PROFILE',
    p_target_user_id,
    p_reason,
    jsonb_build_object('mode', 'total')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.super_admin_suspend_user_temporary(
  p_target_user_id UUID,
  p_reason TEXT,
  p_until TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_active_super_admins INTEGER;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Accès refusé: super admin requis';
  END IF;

  IF p_target_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur cible requis';
  END IF;

  IF auth.uid() = p_target_user_id THEN
    RAISE EXCEPTION 'Auto-suspension interdite';
  END IF;

  IF p_until IS NULL OR p_until <= NOW() THEN
    RAISE EXCEPTION 'Date de fin de suspension temporaire invalide';
  END IF;

  IF public.is_user_super_admin(p_target_user_id) THEN
    SELECT COUNT(*)
    INTO v_active_super_admins
    FROM profiles p
    WHERE public.is_user_super_admin(p.id)
      AND public.is_profile_operational(p.id);

    IF v_active_super_admins <= 1 THEN
      RAISE EXCEPTION 'Impossible de suspendre le dernier super admin actif';
    END IF;
  END IF;

  UPDATE profiles
  SET
    account_status = 'SUSPENDED_TEMPORARY',
    suspension_reason = NULLIF(TRIM(p_reason), ''),
    suspended_at = NOW(),
    suspended_until = p_until,
    suspended_by = auth.uid(),
    updated_at = NOW()
  WHERE id = p_target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Utilisateur introuvable';
  END IF;

  PERFORM public.log_platform_admin_action(
    'SUSPEND_USER_TEMPORARY',
    'PROFILE',
    p_target_user_id,
    p_reason,
    jsonb_build_object('mode', 'temporary', 'until', p_until)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.super_admin_reactivate_user(
  p_target_user_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Accès refusé: super admin requis';
  END IF;

  IF p_target_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur cible requis';
  END IF;

  UPDATE profiles
  SET
    account_status = 'ACTIVE',
    suspension_reason = NULL,
    suspended_at = NULL,
    suspended_until = NULL,
    suspended_by = NULL,
    is_active = TRUE,
    updated_at = NOW()
  WHERE id = p_target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Utilisateur introuvable';
  END IF;

  PERFORM public.log_platform_admin_action(
    'REACTIVATE_USER',
    'PROFILE',
    p_target_user_id,
    p_reason,
    jsonb_build_object('mode', 'reactivation')
  );
END;
$$;

-- ============================================================
-- 5) Action super admin : statut établissement
-- ============================================================

CREATE OR REPLACE FUNCTION public.super_admin_set_school_status(
  p_school_id UUID,
  p_status TEXT,
  p_reason TEXT DEFAULT NULL,
  p_suspended_until TIMESTAMPTZ DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status TEXT;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Accès refusé: super admin requis';
  END IF;

  IF p_school_id IS NULL THEN
    RAISE EXCEPTION 'Établissement cible requis';
  END IF;

  v_status := UPPER(TRIM(COALESCE(p_status, '')));

  IF v_status NOT IN ('ACTIVE', 'SUSPENDED', 'DISABLED') THEN
    RAISE EXCEPTION 'Statut établissement invalide: %', p_status;
  END IF;

  IF v_status = 'SUSPENDED' AND p_suspended_until IS NOT NULL AND p_suspended_until <= NOW() THEN
    RAISE EXCEPTION 'Date de fin de suspension établissement invalide';
  END IF;

  UPDATE schools
  SET
    platform_status = v_status,
    status_reason = NULLIF(TRIM(p_reason), ''),
    status_updated_at = NOW(),
    status_updated_by = auth.uid(),
    suspended_until = CASE WHEN v_status = 'SUSPENDED' THEN p_suspended_until ELSE NULL END,
    is_active = (v_status = 'ACTIVE'),
    updated_at = NOW()
  WHERE id = p_school_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Établissement introuvable';
  END IF;

  PERFORM public.log_platform_admin_action(
    'SET_SCHOOL_STATUS',
    'SCHOOL',
    p_school_id,
    p_reason,
    jsonb_build_object(
      'status', v_status,
      'suspended_until', p_suspended_until
    )
  );
END;
$$;

-- ============================================================
-- 6) Compatibilité données existantes
-- ============================================================

-- Harmonise les statuts ajoutés avec l'existant
UPDATE profiles
SET account_status = 'ACTIVE'
WHERE account_status IS NULL;

UPDATE schools
SET platform_status = CASE WHEN is_active THEN 'ACTIVE' ELSE 'DISABLED' END
WHERE platform_status IS NULL;

-- ============================================================
-- 7) Vue globale super admin (KPI plateforme)
-- ============================================================

CREATE OR REPLACE FUNCTION public.super_admin_platform_overview()
RETURNS TABLE (
  total_users BIGINT,
  users_active BIGINT,
  users_suspended_total BIGINT,
  users_suspended_temporary BIGINT,
  total_schools BIGINT,
  schools_active BIGINT,
  schools_suspended BIGINT,
  schools_disabled BIGINT,
  total_students BIGINT,
  total_attendance_records BIGINT,
  total_justifications BIGINT,
  generated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Accès refusé: super admin requis';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM profiles)::BIGINT AS total_users,
    (SELECT COUNT(*) FROM profiles WHERE is_profile_operational(id))::BIGINT AS users_active,
    (SELECT COUNT(*) FROM profiles WHERE account_status = 'SUSPENDED_TOTAL')::BIGINT AS users_suspended_total,
    (SELECT COUNT(*) FROM profiles WHERE account_status = 'SUSPENDED_TEMPORARY' AND suspended_until > NOW())::BIGINT AS users_suspended_temporary,
    (SELECT COUNT(*) FROM schools)::BIGINT AS total_schools,
    (SELECT COUNT(*) FROM schools WHERE platform_status = 'ACTIVE')::BIGINT AS schools_active,
    (SELECT COUNT(*) FROM schools WHERE platform_status = 'SUSPENDED')::BIGINT AS schools_suspended,
    (SELECT COUNT(*) FROM schools WHERE platform_status = 'DISABLED')::BIGINT AS schools_disabled,
    (SELECT COUNT(*) FROM students)::BIGINT AS total_students,
    (SELECT COUNT(*) FROM attendance_records)::BIGINT AS total_attendance_records,
    (SELECT COUNT(*) FROM attendance_justifications)::BIGINT AS total_justifications,
    NOW() AS generated_at;
END;
$$;

-- ============================================================
-- 8) Enforcement global RLS (anti-régression des anciennes policies)
-- ============================================================

-- 8.1 Bloque tout utilisateur suspendu sur toutes les tables RLS
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT n.nspname AS schema_name, c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r'
      AND n.nspname = 'public'
      AND c.relrowsecurity = TRUE
      AND c.relname NOT LIKE 'pg_%'
      AND c.relname NOT LIKE 'sql_%'
  LOOP
    BEGIN
      EXECUTE format(
        'CREATE POLICY %I ON %I.%I AS RESTRICTIVE FOR ALL USING (public.is_profile_operational(auth.uid())) WITH CHECK (public.is_profile_operational(auth.uid()))',
        '__active_profile_guard',
        r.schema_name,
        r.table_name
      );
    EXCEPTION
      WHEN duplicate_object THEN
        NULL;
    END;
  END LOOP;
END $$;

-- 8.2 Bloque les accès des non-super-admin aux écoles non opérationnelles
--     (uniquement sur tables contenant school_id + RLS actif)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT n.nspname AS schema_name, c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'school_id' AND a.attisdropped = FALSE
    WHERE c.relkind = 'r'
      AND n.nspname = 'public'
      AND c.relrowsecurity = TRUE
      AND c.relname NOT LIKE 'pg_%'
      AND c.relname NOT LIKE 'sql_%'
  LOOP
    BEGIN
      EXECUTE format(
        'CREATE POLICY %I ON %I.%I AS RESTRICTIVE FOR ALL USING (public.is_super_admin() OR public.is_school_operational(school_id)) WITH CHECK (public.is_super_admin() OR public.is_school_operational(school_id))',
        '__school_operational_guard',
        r.schema_name,
        r.table_name
      );
    EXCEPTION
      WHEN duplicate_object THEN
        NULL;
    END;
  END LOOP;
END $$;
