-- Permettre la suppression d'un profil (personnage) depuis Supabase :
-- les références historiques passent en SET NULL, les données propres à l'utilisateur en CASCADE.

CREATE OR REPLACE FUNCTION public._edn_relink_profile_fk(
  p_table text,
  p_column text,
  p_on_delete text
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_constraint name;
  v_col_not_null boolean;
BEGIN
  IF p_on_delete NOT IN ('SET NULL', 'CASCADE') THEN
    RAISE EXCEPTION 'Invalid on_delete action: %', p_on_delete;
  END IF;

  SELECT c.conname INTO v_constraint
  FROM pg_constraint c
  JOIN pg_class rel ON rel.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = rel.relnamespace
  JOIN pg_attribute a ON a.attrelid = c.conrelid
    AND a.attnum = ANY (c.conkey)
    AND NOT a.attisdropped
  WHERE c.contype = 'f'
    AND c.confrelid = 'public.profiles'::regclass
    AND n.nspname = 'public'
    AND rel.relname = p_table
    AND a.attname = p_column;

  IF v_constraint IS NULL THEN
    RAISE NOTICE 'Skipping %.% (no FK to profiles)', p_table, p_column;
    RETURN;
  END IF;

  IF p_on_delete = 'SET NULL' THEN
    SELECT a.attnotnull INTO v_col_not_null
    FROM pg_attribute a
    JOIN pg_class rel ON rel.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
    WHERE n.nspname = 'public'
      AND rel.relname = p_table
      AND a.attname = p_column
      AND NOT a.attisdropped;

    IF v_col_not_null THEN
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I DROP NOT NULL', p_table, p_column);
    END IF;
  END IF;

  EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', p_table, v_constraint);
  EXECUTE format(
    'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.profiles(id) ON DELETE %s',
    p_table,
    v_constraint,
    p_column,
    p_on_delete
  );
END;
$$;

-- Données propres à l'utilisateur : suppression en cascade
SELECT public._edn_relink_profile_fk('user_school_roles', 'user_id', 'CASCADE');
SELECT public._edn_relink_profile_fk('parent_profiles', 'user_id', 'CASCADE');
SELECT public._edn_relink_profile_fk('parent_student_relations', 'parent_user_id', 'CASCADE');
SELECT public._edn_relink_profile_fk('teacher_assignments', 'teacher_id', 'CASCADE');
SELECT public._edn_relink_profile_fk('notifications', 'user_id', 'CASCADE');
SELECT public._edn_relink_profile_fk('message_recipients', 'recipient_id', 'CASCADE');
SELECT public._edn_relink_profile_fk('offline_sync_queue', 'user_id', 'CASCADE');
SELECT public._edn_relink_profile_fk('chat_participant_state', 'user_id', 'CASCADE');
SELECT public._edn_relink_profile_fk('chat_conversations', 'participant_one', 'CASCADE');
SELECT public._edn_relink_profile_fk('chat_conversations', 'participant_two', 'CASCADE');

-- Références historiques / audit : conserver l'enregistrement, retirer le lien
SELECT public._edn_relink_profile_fk('schools', 'founder_id', 'SET NULL');
SELECT public._edn_relink_profile_fk('classes', 'main_teacher_id', 'SET NULL');
SELECT public._edn_relink_profile_fk('parent_profiles', 'validated_by', 'SET NULL');
SELECT public._edn_relink_profile_fk('parent_student_relations', 'validated_by', 'SET NULL');
SELECT public._edn_relink_profile_fk('staff_invitations', 'invited_by', 'SET NULL');
SELECT public._edn_relink_profile_fk('assessments', 'teacher_id', 'SET NULL');
SELECT public._edn_relink_profile_fk('evaluations', 'created_by', 'SET NULL');
SELECT public._edn_relink_profile_fk('grades', 'created_by', 'SET NULL');
SELECT public._edn_relink_profile_fk('grades', 'updated_by', 'SET NULL');
SELECT public._edn_relink_profile_fk('grade_history', 'changed_by', 'SET NULL');
SELECT public._edn_relink_profile_fk('timetable_slots', 'teacher_id', 'SET NULL');
SELECT public._edn_relink_profile_fk('replacements', 'absent_teacher_id', 'SET NULL');
SELECT public._edn_relink_profile_fk('replacements', 'replacement_teacher_id', 'SET NULL');
SELECT public._edn_relink_profile_fk('replacements', 'created_by', 'SET NULL');
SELECT public._edn_relink_profile_fk('attendance_records', 'teacher_id', 'SET NULL');
SELECT public._edn_relink_profile_fk('attendance_justifications', 'parent_user_id', 'SET NULL');
SELECT public._edn_relink_profile_fk('attendance_justifications', 'reviewed_by', 'SET NULL');
SELECT public._edn_relink_profile_fk('payments', 'parent_user_id', 'SET NULL');
SELECT public._edn_relink_profile_fk('payments', 'recorded_by', 'SET NULL');
SELECT public._edn_relink_profile_fk('receipts', 'generated_by', 'SET NULL');
SELECT public._edn_relink_profile_fk('report_cards', 'generated_by', 'SET NULL');
SELECT public._edn_relink_profile_fk('report_cards', 'validated_by', 'SET NULL');
SELECT public._edn_relink_profile_fk('messages', 'sender_id', 'SET NULL');
SELECT public._edn_relink_profile_fk('announcements', 'published_by', 'SET NULL');
SELECT public._edn_relink_profile_fk('discipline_incidents', 'reported_by', 'SET NULL');
SELECT public._edn_relink_profile_fk('sanctions', 'created_by', 'SET NULL');
SELECT public._edn_relink_profile_fk('orientation_notes', 'counselor_id', 'SET NULL');
SELECT public._edn_relink_profile_fk('documents', 'parent_user_id', 'SET NULL');
SELECT public._edn_relink_profile_fk('documents', 'created_by', 'SET NULL');
SELECT public._edn_relink_profile_fk('audit_logs', 'actor_id', 'SET NULL');
SELECT public._edn_relink_profile_fk('official_tuition_rates', 'created_by', 'SET NULL');
SELECT public._edn_relink_profile_fk('chat_messages', 'sender_id', 'SET NULL');

-- organizations.founder_id : déjà ON DELETE CASCADE (supprime l'organisation si le fondateur est effacé)
SELECT public._edn_relink_profile_fk('organizations', 'founder_id', 'CASCADE');

-- Filet de sécurité : toute FK restante vers profiles → SET NULL
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT
      rel.relname AS table_name,
      a.attname AS column_name,
      c.conname AS constraint_name,
      a.attnotnull AS not_null,
      c.confdeltype AS delete_action
    FROM pg_constraint c
    JOIN pg_class rel ON rel.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.conrelid
      AND a.attnum = ANY (c.conkey)
      AND NOT a.attisdropped
    WHERE c.contype = 'f'
      AND c.confrelid = 'public.profiles'::regclass
      AND n.nspname = 'public'
      AND c.confdeltype NOT IN ('n', 'c') -- n = SET NULL, c = CASCADE
  LOOP
    IF r.not_null THEN
      EXECUTE format(
        'ALTER TABLE public.%I ALTER COLUMN %I DROP NOT NULL',
        r.table_name,
        r.column_name
      );
    END IF;

    EXECUTE format(
      'ALTER TABLE public.%I DROP CONSTRAINT %I',
      r.table_name,
      r.constraint_name
    );
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.profiles(id) ON DELETE SET NULL',
      r.table_name,
      r.constraint_name,
      r.column_name
    );

    RAISE NOTICE 'Patched remaining FK: %.%', r.table_name, r.column_name;
  END LOOP;
END;
$$;

DROP FUNCTION public._edn_relink_profile_fk(text, text, text);
