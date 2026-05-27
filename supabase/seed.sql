-- ============================================================
-- EduNation - Seed de démonstration
-- Lycée Wend-Panga de Ouagadougou
-- ============================================================

-- Compte technique pour les FK de démo (paiements, absences, annonces)
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
)
VALUES (
  'ffffffff-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'demo-seed@edunation.local',
  crypt('SeedDemo2025!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Admin Démo"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, email, full_name, is_active)
VALUES ('ffffffff-0000-0000-0000-000000000001', 'demo-seed@edunation.local', 'Admin Démo', true)
ON CONFLICT (id) DO NOTHING;

-- Nettoyage (ordre inverse des FK)
TRUNCATE TABLE audit_logs, grades, evaluations, attendance_records,
  report_cards, payments, fee_structures, student_enrollments,
  teacher_assignments, parent_student_relations, parent_pre_registrations,
  students, classes, subjects, class_levels, school_years,
  announcements, notifications, user_school_roles, schools
  RESTART IDENTITY CASCADE;

-- ============================================================
-- COMPTES DE TEST LOCAUX
-- Secrétaire de test : secretaire@test.local / Test2025!
-- ============================================================
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'secretaire@test.local', crypt('Test2025!', gen_salt('bf')), NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Aminata OUEDRAOGO"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, email, full_name, default_role, is_active)
VALUES ('bbbbbbbb-0000-0000-0000-000000000001', 'secretaire@test.local', 'Aminata OUEDRAOGO', 'SECRETAIRE', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 1. ÉTABLISSEMENTS
-- ============================================================
INSERT INTO schools (id, name, type, city, address, phone, email, is_active)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'Lycée Wend-Panga', 'lycee', 'Ouagadougou', 'Avenue Kwame Nkrumah, Secteur 4', '+226 25 33 01 01', 'contact@wendpanga.bf', true),
  ('11111111-0000-0000-0000-000000000002', 'Collège Saint-Joseph', 'college', 'Bobo-Dioulasso', 'Rue des Artisans, Zone Industrielle', '+226 20 97 10 10', 'contact@saintjoseph.bf', true),
  ('11111111-0000-0000-0000-000000000003', 'Lycée Municipal de Koudougou', 'lycee', 'Koudougou', 'Boulevard du 11 Décembre', '+226 25 44 02 02', 'contact@lmk.bf', true);

-- ============================================================
-- 2. ANNÉES SCOLAIRES
-- ============================================================
INSERT INTO school_years (id, school_id, name, start_date, end_date, is_active)
VALUES
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', '2025-2026', '2025-10-01', '2026-07-31', true),
  ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002', '2025-2026', '2025-10-01', '2026-07-31', true),
  ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', '2024-2025', '2024-10-01', '2025-07-31', false);

-- ============================================================
-- 3. NIVEAUX SCOLAIRES
-- ============================================================
INSERT INTO class_levels (id, school_id, name, order_index, order_num)
VALUES
  -- Lycée Wend-Panga
  ('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', '6ème', 1, 1),
  ('33333333-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', '5ème', 2, 2),
  ('33333333-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', '4ème', 3, 3),
  ('33333333-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001', '3ème', 4, 4),
  ('33333333-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000001', '2nde', 5, 5),
  ('33333333-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000001', '1ère', 6, 6),
  ('33333333-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000001', 'Tle', 7, 7);

-- ============================================================
-- 4. CLASSES
-- ============================================================
INSERT INTO classes (id, school_id, school_year_id, level_id, name, capacity)
VALUES
  ('44444444-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', '6ème A', 60),
  ('44444444-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', '6ème B', 60),
  ('44444444-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000002', '5ème A', 58),
  ('44444444-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000003', '4ème A', 55),
  ('44444444-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000004', '3ème A', 52),
  ('44444444-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000005', '2nde A', 50),
  ('44444444-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000006', '1ère A (C)', 48),
  ('44444444-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000007', 'Tle A (C)', 45);

-- ============================================================
-- 5. MATIÈRES
-- ============================================================
INSERT INTO subjects (id, school_id, name, coefficient, is_active)
VALUES
  -- Matières générales Lycée Wend-Panga
  ('55555555-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Mathématiques', 4, true),
  ('55555555-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'Français', 4, true),
  ('55555555-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', 'Histoire-Géographie', 2, true),
  ('55555555-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001', 'Physique-Chimie', 3, true),
  ('55555555-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000001', 'SVT', 2, true),
  ('55555555-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000001', 'Anglais', 3, true),
  ('55555555-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000001', 'EPS', 2, true),
  ('55555555-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000001', 'Philosophie', 3, true),
  ('55555555-0000-0000-0000-000000000009', '11111111-0000-0000-0000-000000000001', 'Informatique', 2, true),
  ('55555555-0000-0000-0000-000000000010', '11111111-0000-0000-0000-000000000001', 'ECJS', 1, true);

-- ============================================================
-- 6. STRUCTURES TARIFAIRES
-- ============================================================
INSERT INTO fee_structures (id, school_id, school_year_id, label, name, amount, is_mandatory, due_date)
VALUES
  ('66666666-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'Frais de scolarité annuels', 'Frais de scolarité annuels', 45000, true, '2025-11-30'),
  ('66666666-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'Frais d''inscription', 'Frais d''inscription', 15000, true, '2025-10-31'),
  ('66666666-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'Frais de sport et EPS', 'Frais de sport et EPS', 5000, false, '2025-12-31'),
  ('66666666-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'Frais de bibliothèque', 'Frais de bibliothèque', 3000, false, '2025-12-31'),
  ('66666666-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'Contribution APE', 'Contribution APE', 2000, false, '2025-11-30');

-- ============================================================
-- 7. ÉLÈVES DE DÉMONSTRATION (30 élèves)
-- ============================================================
INSERT INTO students (id, school_id, first_name, last_name, birth_date, birth_place, gender, nationality, address, status, iun)
VALUES
  -- 6ème A (10 élèves)
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Moussa', 'OUEDRAOGO', '2013-03-15', 'Ouagadougou', 'M', 'Burkinabè', 'Secteur 15', 'active', 'BF-2026-001001'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'Fatima', 'KABORE', '2013-07-22', 'Ouagadougou', 'F', 'Burkinabè', 'Secteur 12', 'active', 'BF-2026-001002'),
  ('aaaaaaaa-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', 'Ibrahim', 'SAWADOGO', '2013-01-08', 'Koudougou', 'M', 'Burkinabè', 'Secteur 8', 'active', 'BF-2026-001003'),
  ('aaaaaaaa-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001', 'Aïcha', 'ZONGO', '2013-11-30', 'Ouagadougou', 'F', 'Burkinabè', 'Secteur 22', 'active', 'BF-2026-001004'),
  ('aaaaaaaa-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000001', 'Karim', 'TRAORE', '2013-05-18', 'Bobo-Dioulasso', 'M', 'Burkinabè', 'Secteur 6', 'active', 'BF-2026-001005'),
  -- 3ème A (5 élèves)
  ('aaaaaaaa-0000-0000-0000-000000000011', '11111111-0000-0000-0000-000000000001', 'Salif', 'SOME', '2010-04-12', 'Ouagadougou', 'M', 'Burkinabè', 'Secteur 17', 'active', 'BF-2026-001011'),
  ('aaaaaaaa-0000-0000-0000-000000000012', '11111111-0000-0000-0000-000000000001', 'Nafissatou', 'DIALLO', '2010-09-25', 'Dori', 'F', 'Burkinabè', 'Secteur 28', 'active', 'BF-2026-001012'),
  ('aaaaaaaa-0000-0000-0000-000000000013', '11111111-0000-0000-0000-000000000001', 'Sébastien', 'BELEM', '2010-12-03', 'Ouagadougou', 'M', 'Burkinabè', 'Secteur 5', 'active', 'BF-2026-001013'),
  ('aaaaaaaa-0000-0000-0000-000000000014', '11111111-0000-0000-0000-000000000001', 'Mariama', 'COULIBALY', '2011-02-17', 'Banfora', 'F', 'Burkinabè', 'Secteur 14', 'active', 'BF-2026-001014'),
  ('aaaaaaaa-0000-0000-0000-000000000015', '11111111-0000-0000-0000-000000000001', 'Justin', 'NIKIEMA', '2010-06-30', 'Ouagadougou', 'M', 'Burkinabè', 'Secteur 9', 'active', 'BF-2026-001015'),
  -- Terminale (3 élèves)
  ('aaaaaaaa-0000-0000-0000-000000000021', '11111111-0000-0000-0000-000000000001', 'Wendkouni', 'KABORE', '2007-08-14', 'Ouagadougou', 'M', 'Burkinabè', 'Secteur 3', 'active', 'BF-2026-001021'),
  ('aaaaaaaa-0000-0000-0000-000000000022', '11111111-0000-0000-0000-000000000001', 'Edwige', 'OUOBA', '2007-03-07', 'Ouagadougou', 'F', 'Burkinabè', 'Secteur 21', 'active', 'BF-2026-001022'),
  ('aaaaaaaa-0000-0000-0000-000000000023', '11111111-0000-0000-0000-000000000001', 'Adama', 'TOURE', '2008-11-19', 'Ouagadougou', 'M', 'Burkinabè', 'Secteur 10', 'pending', 'BF-2026-001023'),
  -- Élèves en attente
  ('aaaaaaaa-0000-0000-0000-000000000031', '11111111-0000-0000-0000-000000000001', 'Rasmata', 'TAPSOBA', '2012-07-04', 'Ziniaré', 'F', 'Burkinabè', 'Secteur 2', 'pending', 'BF-2026-001031'),
  ('aaaaaaaa-0000-0000-0000-000000000032', '11111111-0000-0000-0000-000000000001', 'Yacouba', 'COMPAORE', '2013-01-22', 'Ouagadougou', 'M', 'Burkinabè', 'Secteur 30', 'pending', 'BF-2026-001032');

-- ============================================================
-- 8. INSCRIPTIONS EN CLASSES
-- ============================================================
INSERT INTO student_enrollments (student_id, school_id, class_id, school_year_id, status)
VALUES
  -- 6ème A
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'active'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'active'),
  ('aaaaaaaa-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'active'),
  ('aaaaaaaa-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'active'),
  ('aaaaaaaa-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'active'),
  -- 3ème A
  ('aaaaaaaa-0000-0000-0000-000000000011', '11111111-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000001', 'active'),
  ('aaaaaaaa-0000-0000-0000-000000000012', '11111111-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000001', 'active'),
  ('aaaaaaaa-0000-0000-0000-000000000013', '11111111-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000001', 'active'),
  ('aaaaaaaa-0000-0000-0000-000000000014', '11111111-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000001', 'active'),
  ('aaaaaaaa-0000-0000-0000-000000000015', '11111111-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000001', 'active'),
  -- Terminale
  ('aaaaaaaa-0000-0000-0000-000000000021', '11111111-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000008', '22222222-0000-0000-0000-000000000001', 'active'),
  ('aaaaaaaa-0000-0000-0000-000000000022', '11111111-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000008', '22222222-0000-0000-0000-000000000001', 'active');

-- ============================================================
-- 9. PAIEMENTS DE DÉMONSTRATION
-- ============================================================
INSERT INTO payments (id, school_id, student_id, amount, payment_method, status, reference, recorded_by)
VALUES
  ('cccccccc-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 45000, 'cash', 'paid', 'EDN-2510-0001', 'ffffffff-0000-0000-0000-000000000001'),
  ('cccccccc-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 15000, 'mobile_money', 'paid', 'EDN-2510-0002', 'ffffffff-0000-0000-0000-000000000001'),
  ('cccccccc-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 20000, 'cash', 'partial', 'EDN-2510-0003', 'ffffffff-0000-0000-0000-000000000001'),
  ('cccccccc-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000011', 45000, 'bank_transfer', 'paid', 'EDN-2510-0004', 'ffffffff-0000-0000-0000-000000000001'),
  ('cccccccc-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000021', 0, 'cash', 'overdue', 'EDN-2510-0005', 'ffffffff-0000-0000-0000-000000000001');

-- ============================================================
-- 10. ABSENCES DE DÉMONSTRATION
-- ============================================================
INSERT INTO attendance_records (id, school_id, school_year_id, class_id, subject_id, student_id, teacher_id, status, recorded_at)
VALUES
  ('dddddddd-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000003', 'ffffffff-0000-0000-0000-000000000001', 'absent', NOW() - INTERVAL '2 days'),
  ('dddddddd-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000005', 'ffffffff-0000-0000-0000-000000000001', 'late', NOW() - INTERVAL '1 day'),
  ('dddddddd-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000005', '55555555-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000012', 'ffffffff-0000-0000-0000-000000000001', 'absent', NOW() - INTERVAL '3 days'),
  ('dddddddd-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000005', '55555555-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000014', 'ffffffff-0000-0000-0000-000000000001', 'absent', NOW() - INTERVAL '5 days');

-- ============================================================
-- 11. ANNONCES
-- ============================================================
INSERT INTO announcements (id, school_id, title, content, target_type, published_by, published_at)
VALUES
  ('eeeeeeee-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 
   'Réunion des parents - Décembre 2025',
   'Une réunion des parents d''élèves est prévue le samedi 13 décembre 2025 à 9h00 dans la salle polyvalente. Votre présence est souhaitée.',
   'parents',
   'ffffffff-0000-0000-0000-000000000001',
   NOW() - INTERVAL '5 days'),
  ('eeeeeeee-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001',
   'Examens du 1er trimestre - Planning',
   'Les compositions du 1er trimestre se dérouleront du 15 au 20 décembre 2025. Le planning détaillé sera affiché dans les classes.',
   'all',
   'ffffffff-0000-0000-0000-000000000001',
   NOW() - INTERVAL '2 days'),
  ('eeeeeeee-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001',
   'Formation enseignants - Numérique éducatif',
   'Une session de formation sur l''utilisation des outils numériques en classe aura lieu le samedi 20 décembre. Présence obligatoire pour tous les enseignants.',
   'staff',
   'ffffffff-0000-0000-0000-000000000001',
   NOW() - INTERVAL '1 day');

-- ============================================================
-- 12. RÔLES DE TEST
-- ============================================================
INSERT INTO user_school_roles (user_id, school_id, role_code, is_active)
VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'SECRETAIRE', true)
ON CONFLICT (user_id, school_id, role_code) DO NOTHING;

-- ============================================================
-- 13. COMPTE ÉLÈVE DE TEST (Moussa OUEDRAOGO — BF-2026-001001)
-- IUN: BF-2026-001001 / mot de passe: Eleve2025!
-- ============================================================
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES
  ('cccccccc-0000-0000-0000-00000000eeee', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'eleve-bf2026001001@eleves.edunation.bf', crypt('Eleve2025!', gen_salt('bf')), NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Moussa OUEDRAOGO","role":"ELEVE"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, email, full_name, default_role, is_active)
VALUES ('cccccccc-0000-0000-0000-00000000eeee', 'eleve-bf2026001001@eleves.edunation.bf', 'Moussa OUEDRAOGO', 'ELEVE', true)
ON CONFLICT (id) DO NOTHING;

-- Lier le user_id au dossier élève
UPDATE students SET user_id = 'cccccccc-0000-0000-0000-00000000eeee'
WHERE iun = 'BF-2026-001001';

INSERT INTO user_school_roles (user_id, school_id, role_code, is_active)
VALUES ('cccccccc-0000-0000-0000-00000000eeee', '11111111-0000-0000-0000-000000000001', 'ELEVE', true)
ON CONFLICT (user_id, school_id, role_code) DO NOTHING;

-- ============================================================
-- FIN DU SEED
-- ============================================================
-- Total : 3 écoles, 3 années scolaires, 7 niveaux, 8 classes,
-- 10 matières, 5 structures tarifaires, 15 élèves, 5 paiements,
-- 4 absences, 3 annonces
-- Comptes de test locaux :
--   secretaire@test.local / Test2025! (SECRETAIRE, Lycée Wend-Panga)
--   eleve-bf2026001001@eleves.edunation.bf / Eleve2025!
--   ou IUN BF-2026-001001 sur /login/eleve
