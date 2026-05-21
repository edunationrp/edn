-- ============================================================
-- EduNation - Migration initiale
-- Schéma complet PostgreSQL avec RLS
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLES DE BASE
-- ============================================================

-- Profils utilisateurs (liés à auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  avatar_url TEXT,
  default_role TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rôles du système
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT
);

-- Permissions
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT
);

-- Rôle → Permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Établissements
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  founder_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'lycee',
  address TEXT,
  city TEXT,
  province TEXT,
  country TEXT DEFAULT 'Burkina Faso',
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  motto TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rôles utilisateurs par école
CREATE TABLE IF NOT EXISTS user_school_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  role_code TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, school_id, role_code)
);

-- Années scolaires
CREATE TABLE IF NOT EXISTS school_years (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT FALSE
);

-- Périodes (trimestres/semestres)
CREATE TABLE IF NOT EXISTS terms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  school_year_id UUID NOT NULL REFERENCES school_years(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('trimestre', 'semestre')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT FALSE
);

-- Niveaux de classe
CREATE TABLE IF NOT EXISTS class_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0
);

-- Classes
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  school_year_id UUID NOT NULL REFERENCES school_years(id) ON DELETE CASCADE,
  level_id UUID NOT NULL REFERENCES class_levels(id),
  name TEXT NOT NULL,
  main_teacher_id UUID REFERENCES profiles(id),
  capacity INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matières
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT
);

-- Matières par classe (avec coefficients)
CREATE TABLE IF NOT EXISTS class_subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  coefficient NUMERIC(4,2) NOT NULL DEFAULT 1,
  UNIQUE(class_id, subject_id)
);

-- Affectations enseignants
CREATE TABLE IF NOT EXISTS teacher_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id),
  school_year_id UUID NOT NULL REFERENCES school_years(id),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(teacher_id, class_id, subject_id, school_year_id)
);

-- Séquences IUN par année de naissance
CREATE TABLE IF NOT EXISTS iun_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  birth_year INTEGER UNIQUE NOT NULL,
  current_number INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Élèves
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  iun TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  birth_place TEXT,
  gender TEXT NOT NULL CHECK (gender IN ('M', 'F')),
  cnib_number TEXT,
  phone TEXT,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'transferred', 'inactive')),
  has_personal_phone BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inscriptions élèves
CREATE TABLE IF NOT EXISTS student_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id),
  school_year_id UUID NOT NULL REFERENCES school_years(id),
  status TEXT NOT NULL DEFAULT 'active',
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, school_year_id)
);

-- Profils parents
CREATE TABLE IF NOT EXISTS parent_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cni_number TEXT,
  cni_scan_url TEXT,
  literacy_level TEXT DEFAULT 'alphabetise' CHECK (literacy_level IN ('alphabetise', 'illetre')),
  preferred_language TEXT DEFAULT 'fr' CHECK (preferred_language IN ('fr', 'moore', 'dioula', 'fulfulde')),
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'validated', 'rejected')),
  physical_validation_required BOOLEAN DEFAULT TRUE,
  validated_by UUID REFERENCES profiles(id),
  validated_at TIMESTAMPTZ
);

-- Relations parent-élève
CREATE TABLE IF NOT EXISTS parent_student_relations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  parent_user_id UUID NOT NULL REFERENCES profiles(id),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL CHECK (relation_type IN ('pere', 'mere', 'tuteur_legal', 'autre')),
  is_primary BOOLEAN DEFAULT FALSE,
  birth_certificate_url TEXT,
  validated_by UUID REFERENCES profiles(id),
  validated_at TIMESTAMPTZ,
  UNIQUE(parent_user_id, student_id)
);

-- Invitations personnel
CREATE TABLE IF NOT EXISTS staff_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  role_code TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES profiles(id),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  used_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'expired', 'cancelled'))
);

-- Évaluations
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  school_year_id UUID NOT NULL REFERENCES school_years(id),
  term_id UUID NOT NULL REFERENCES terms(id),
  class_id UUID NOT NULL REFERENCES classes(id),
  subject_id UUID NOT NULL REFERENCES subjects(id),
  teacher_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('devoir', 'interrogation', 'composition', 'examen')),
  coefficient NUMERIC(4,2) NOT NULL DEFAULT 1,
  assessment_date DATE NOT NULL,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notes
CREATE TABLE IF NOT EXISTS grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id),
  grade NUMERIC(5,2) NOT NULL CHECK (grade >= 0 AND grade <= 20),
  appreciation TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assessment_id, student_id)
);

-- Historique des notes
CREATE TABLE IF NOT EXISTS grade_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id),
  grade_id UUID NOT NULL REFERENCES grades(id),
  old_value NUMERIC(5,2),
  new_value NUMERIC(5,2),
  changed_by UUID NOT NULL REFERENCES profiles(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Emplois du temps
CREATE TABLE IF NOT EXISTS timetable_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  school_year_id UUID NOT NULL REFERENCES school_years(id),
  class_id UUID NOT NULL REFERENCES classes(id),
  subject_id UUID NOT NULL REFERENCES subjects(id),
  teacher_id UUID NOT NULL REFERENCES profiles(id),
  room TEXT,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL
);

-- Remplacements
CREATE TABLE IF NOT EXISTS replacements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  timetable_slot_id UUID NOT NULL REFERENCES timetable_slots(id),
  absent_teacher_id UUID NOT NULL REFERENCES profiles(id),
  replacement_teacher_id UUID REFERENCES profiles(id),
  reason TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Absences
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  school_year_id UUID NOT NULL REFERENCES school_years(id),
  class_id UUID NOT NULL REFERENCES classes(id),
  subject_id UUID NOT NULL REFERENCES subjects(id),
  student_id UUID NOT NULL REFERENCES students(id),
  teacher_id UUID NOT NULL REFERENCES profiles(id),
  timetable_slot_id UUID REFERENCES timetable_slots(id),
  status TEXT NOT NULL DEFAULT 'absent' CHECK (status IN ('present', 'absent', 'late', 'sick', 'excused')),
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'web' CHECK (source IN ('web', 'backup_sms', 'manual', 'offline_sync')),
  sync_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Justifications absences
CREATE TABLE IF NOT EXISTS attendance_justifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  attendance_record_id UUID NOT NULL REFERENCES attendance_records(id),
  parent_user_id UUID REFERENCES profiles(id),
  reason TEXT NOT NULL,
  attachment_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ
);

-- File d'attente sync offline
CREATE TABLE IF NOT EXISTS offline_sync_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  school_id UUID NOT NULL REFERENCES schools(id),
  entity_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);

-- Structures de frais
CREATE TABLE IF NOT EXISTS fee_structures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  school_year_id UUID NOT NULL REFERENCES school_years(id),
  class_level_id UUID REFERENCES class_levels(id),
  label TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  due_date DATE,
  is_required BOOLEAN DEFAULT TRUE
);

-- Paiements
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id),
  parent_user_id UUID REFERENCES profiles(id),
  amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'mobile_money', 'bank_transfer', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partial', 'overdue', 'cancelled')),
  reference TEXT,
  paid_at TIMESTAMPTZ,
  recorded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reçus
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES payments(id),
  receipt_number TEXT UNIQUE NOT NULL,
  pdf_url TEXT,
  generated_by UUID NOT NULL REFERENCES profiles(id),
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates bulletins
CREATE TABLE IF NOT EXISTS report_card_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  code TEXT NOT NULL CHECK (code IN ('A_STANDARD', 'B_PREMIUM', 'C_COMPACT')),
  name TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE
);

-- Bulletins
CREATE TABLE IF NOT EXISTS report_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  school_year_id UUID NOT NULL REFERENCES school_years(id),
  term_id UUID NOT NULL REFERENCES terms(id),
  student_id UUID NOT NULL REFERENCES students(id),
  class_id UUID NOT NULL REFERENCES classes(id),
  template_id UUID REFERENCES report_card_templates(id),
  average NUMERIC(5,2),
  rank INTEGER,
  appreciation TEXT,
  pdf_url TEXT,
  qr_hash TEXT,
  serial_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'validated', 'published', 'archived')),
  generated_by UUID REFERENCES profiles(id),
  validated_by UUID REFERENCES profiles(id),
  generated_at TIMESTAMPTZ,
  validated_at TIMESTAMPTZ,
  UNIQUE(student_id, term_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'audio')),
  audio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Destinataires messages
CREATE TABLE IF NOT EXISTS message_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id),
  read_at TIMESTAMPTZ
);

-- Annonces
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_type TEXT DEFAULT 'all' CHECK (target_type IN ('all', 'class', 'parents', 'staff', 'students')),
  target_id UUID,
  published_by UUID NOT NULL REFERENCES profiles(id),
  published_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Incidents disciplinaires
CREATE TABLE IF NOT EXISTS discipline_incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id),
  reported_by UUID NOT NULL REFERENCES profiles(id),
  incident_type TEXT NOT NULL,
  description TEXT,
  incident_date DATE NOT NULL,
  status TEXT DEFAULT 'open'
);

-- Sanctions
CREATE TABLE IF NOT EXISTS sanctions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id),
  incident_id UUID REFERENCES discipline_incidents(id),
  sanction_type TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notes d'orientation
CREATE TABLE IF NOT EXISTS orientation_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id),
  counselor_id UUID NOT NULL REFERENCES profiles(id),
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents officiels
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id),
  parent_user_id UUID REFERENCES profiles(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Logs d'audit
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id),
  actor_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Codes vérification SMS
CREATE TABLE IF NOT EXISTS sms_verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  purpose TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Logs SMS
CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id),
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'simulated',
  provider TEXT DEFAULT 'simulation',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schools_updated_at
  BEFORE UPDATE ON schools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grades_updated_at
  BEFORE UPDATE ON grades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour créer le profil lors de l'inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    TRUE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger pour historique des notes
CREATE OR REPLACE FUNCTION log_grade_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.grade != NEW.grade THEN
    INSERT INTO grade_history (school_id, grade_id, old_value, new_value, changed_by)
    VALUES (NEW.school_id, NEW.id, OLD.grade, NEW.grade, NEW.updated_by);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_grade_updated
  AFTER UPDATE ON grades
  FOR EACH ROW EXECUTE FUNCTION log_grade_change();

-- ============================================================
-- FONCTION GÉNÉRATION IUN (transactionnelle)
-- ============================================================

CREATE OR REPLACE FUNCTION generate_iun(p_birth_year INTEGER)
RETURNS TEXT AS $$
DECLARE
  v_sequence INTEGER;
  v_raw TEXT;
  v_digits INTEGER[];
  v_sum INTEGER := 0;
  v_double BOOLEAN := FALSE;
  v_digit INTEGER;
  v_control INTEGER;
  v_iun TEXT;
  i INTEGER;
BEGIN
  -- Obtenir le prochain numéro de séquence (verrou)
  INSERT INTO iun_sequences (birth_year, current_number)
  VALUES (p_birth_year, 1)
  ON CONFLICT (birth_year) DO UPDATE
    SET current_number = iun_sequences.current_number + 1,
        updated_at = NOW()
  RETURNING current_number INTO v_sequence;

  -- Construire le numéro brut pour Luhn
  v_raw := LPAD(p_birth_year::TEXT, 4, '0') || LPAD(v_sequence::TEXT, 6, '0') || '0';

  -- Algorithme de Luhn
  v_digits := ARRAY(SELECT unnest(string_to_array(v_raw, NULL))::INTEGER);
  FOR i IN REVERSE array_length(v_digits, 1)..1 LOOP
    v_digit := v_digits[i];
    IF v_double THEN
      v_digit := v_digit * 2;
      IF v_digit > 9 THEN v_digit := v_digit - 9; END IF;
    END IF;
    v_sum := v_sum + v_digit;
    v_double := NOT v_double;
  END LOOP;

  v_control := CASE WHEN v_sum % 10 = 0 THEN 0 ELSE 10 - (v_sum % 10) END;

  v_iun := 'BF-' || LPAD(p_birth_year::TEXT, 4, '0') || '-' || LPAD(v_sequence::TEXT, 6, '0') || '-' || v_control::TEXT;

  RETURN v_iun;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FONCTIONS HELPER PERMISSIONS (pour RLS)
-- ============================================================

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_school_roles
    WHERE user_id = auth.uid()
    AND role_code = 'SUPER_ADMIN_EDUNATION'
    AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION has_school_role(p_school_id UUID, p_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_school_roles
    WHERE user_id = auth.uid()
    AND school_id = p_school_id
    AND role_code = p_role
    AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION has_any_school_role(p_school_id UUID, p_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_school_roles
    WHERE user_id = auth.uid()
    AND school_id = p_school_id
    AND role_code = ANY(p_roles)
    AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION can_access_school(p_school_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN is_super_admin() OR EXISTS (
    SELECT 1 FROM user_school_roles
    WHERE user_id = auth.uid()
    AND school_id = p_school_id
    AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_teacher_assigned(p_school_id UUID, p_class_id UUID, p_subject_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM teacher_assignments
    WHERE teacher_id = auth.uid()
    AND school_id = p_school_id
    AND class_id = p_class_id
    AND subject_id = p_subject_id
    AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_parent_of_student(p_student_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM parent_student_relations
    WHERE parent_user_id = auth.uid()
    AND student_id = p_student_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_student_owner(p_student_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM students s
    JOIN profiles p ON p.id = auth.uid()
    WHERE s.id = p_student_id
    AND s.phone = p.phone
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_school_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_student_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE replacements ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_justifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_card_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE discipline_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orientation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- POLICIES : profiles
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  USING (id = auth.uid() OR is_super_admin());

CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  USING (id = auth.uid());

-- POLICIES : schools
CREATE POLICY "schools_select" ON schools FOR SELECT
  USING (is_super_admin() OR can_access_school(id));

CREATE POLICY "schools_insert" ON schools FOR INSERT
  WITH CHECK (is_super_admin() OR founder_id = auth.uid());

CREATE POLICY "schools_update" ON schools FOR UPDATE
  USING (is_super_admin() OR has_any_school_role(id, ARRAY['FONDATEUR', 'PROVISEUR']));

-- POLICIES : user_school_roles
CREATE POLICY "user_school_roles_select" ON user_school_roles FOR SELECT
  USING (user_id = auth.uid() OR is_super_admin() OR
    has_any_school_role(school_id, ARRAY['PROVISEUR', 'FONDATEUR']));

-- POLICIES : students
CREATE POLICY "students_select" ON students FOR SELECT
  USING (
    is_super_admin() OR
    can_access_school(school_id) OR
    is_parent_of_student(id) OR
    is_student_owner(id)
  );

CREATE POLICY "students_insert" ON students FOR INSERT
  WITH CHECK (
    can_access_school(school_id) AND
    has_any_school_role(school_id, ARRAY['PROVISEUR', 'SECRETAIRE', 'SUPER_ADMIN_EDUNATION'])
  );

CREATE POLICY "students_update" ON students FOR UPDATE
  USING (
    has_any_school_role(school_id, ARRAY['PROVISEUR', 'SECRETAIRE', 'SUPER_ADMIN_EDUNATION'])
  );

-- POLICIES : grades
CREATE POLICY "grades_select" ON grades FOR SELECT
  USING (
    is_super_admin() OR
    has_any_school_role(school_id, ARRAY['PROVISEUR', 'CENSEUR', 'CONSEILLER', 'SECRETAIRE']) OR
    EXISTS (
      SELECT 1 FROM assessments a
      WHERE a.id = assessment_id AND a.teacher_id = auth.uid()
    ) OR
    is_parent_of_student(student_id) OR
    is_student_owner(student_id)
  );

CREATE POLICY "grades_insert" ON grades FOR INSERT
  WITH CHECK (
    NOT is_locked AND
    EXISTS (
      SELECT 1 FROM assessments a
      WHERE a.id = assessment_id
      AND a.teacher_id = auth.uid()
      AND NOT a.is_locked
    )
  );

CREATE POLICY "grades_update" ON grades FOR UPDATE
  USING (
    NOT is_locked AND
    (
      EXISTS (
        SELECT 1 FROM assessments a
        WHERE a.id = assessment_id
        AND a.teacher_id = auth.uid()
        AND NOT a.is_locked
      ) OR
      has_any_school_role(school_id, ARRAY['PROVISEUR', 'SUPER_ADMIN_EDUNATION'])
    )
  );

-- POLICIES : attendance_records
CREATE POLICY "attendance_select" ON attendance_records FOR SELECT
  USING (
    is_super_admin() OR
    has_any_school_role(school_id, ARRAY['PROVISEUR', 'CENSEUR', 'VIE_SCOLAIRE', 'SECRETAIRE', 'CONSEILLER']) OR
    teacher_id = auth.uid() OR
    is_parent_of_student(student_id) OR
    is_student_owner(student_id)
  );

CREATE POLICY "attendance_insert" ON attendance_records FOR INSERT
  WITH CHECK (
    teacher_id = auth.uid() OR
    has_any_school_role(school_id, ARRAY['PROVISEUR', 'CENSEUR', 'VIE_SCOLAIRE'])
  );

-- POLICIES : payments
CREATE POLICY "payments_select" ON payments FOR SELECT
  USING (
    is_super_admin() OR
    has_any_school_role(school_id, ARRAY['INTENDANT', 'SECRETAIRE', 'PROVISEUR', 'FONDATEUR']) OR
    parent_user_id = auth.uid()
  );

CREATE POLICY "payments_insert" ON payments FOR INSERT
  WITH CHECK (
    has_any_school_role(school_id, ARRAY['INTENDANT', 'SECRETAIRE', 'PROVISEUR'])
  );

-- POLICIES : report_cards
CREATE POLICY "report_cards_select" ON report_cards FOR SELECT
  USING (
    is_super_admin() OR
    has_any_school_role(school_id, ARRAY['PROVISEUR', 'CENSEUR', 'SECRETAIRE', 'CONSEILLER']) OR
    is_parent_of_student(student_id) OR
    is_student_owner(student_id)
  );

-- POLICIES : notifications (utilisateur voit ses propres)
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  USING (user_id = auth.uid() OR is_super_admin());

-- POLICIES : audit_logs (admins seulement)
CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT
  USING (
    is_super_admin() OR
    has_any_school_role(school_id, ARRAY['PROVISEUR', 'FONDATEUR'])
  );

-- POLICIES : messages
CREATE POLICY "messages_select" ON messages FOR SELECT
  USING (
    sender_id = auth.uid() OR
    can_access_school(school_id)
  );

CREATE POLICY "message_recipients_select" ON message_recipients FOR SELECT
  USING (
    recipient_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM messages m WHERE m.id = message_id AND m.sender_id = auth.uid()
    )
  );

-- POLICIES : announcements (tout le monde dans l'école peut voir)
CREATE POLICY "announcements_select" ON announcements FOR SELECT
  USING (can_access_school(school_id));

CREATE POLICY "announcements_insert" ON announcements FOR INSERT
  WITH CHECK (
    has_any_school_role(school_id, ARRAY['PROVISEUR', 'CENSEUR', 'SECRETAIRE', 'SUPER_ADMIN_EDUNATION'])
  );

-- POLICIES : discipline
CREATE POLICY "discipline_select" ON discipline_incidents FOR SELECT
  USING (
    is_super_admin() OR
    has_any_school_role(school_id, ARRAY['PROVISEUR', 'CENSEUR', 'VIE_SCOLAIRE', 'CONSEILLER']) OR
    is_parent_of_student(student_id)
  );

-- ============================================================
-- INDEX POUR PERFORMANCES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_user_school_roles_user_id ON user_school_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_school_roles_school_id ON user_school_roles(school_id);
CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_iun ON students(iun);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_student_id ON student_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_assessment_id ON grades(assessment_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON attendance_records(class_id);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
