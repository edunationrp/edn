-- École bac à sable pour le mode vérification super admin

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS is_qa_demo BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_schools_is_qa_demo ON schools (is_qa_demo) WHERE is_qa_demo = TRUE;

-- ============================================================
-- École démo EduNation (données fictives, idempotentes)
-- ============================================================

INSERT INTO schools (
  id, name, structure_name, type, city, address, email,
  country, currency, evaluation_system, main_language, access_level, academic_format,
  is_active, is_qa_demo, platform_status
)
VALUES (
  'eeeeeeee-0000-0000-0000-000000000001',
  'École démo EduNation',
  'École démo EduNation',
  'lycee',
  'Ouagadougou',
  'Environnement de test — données fictives',
  'demo@edunation.local',
  'Burkina Faso',
  'XOF',
  'sur_20',
  'fr',
  'prive',
  'trimestre',
  TRUE,
  TRUE,
  'ACTIVE'
)
ON CONFLICT (id) DO UPDATE SET
  is_qa_demo = TRUE,
  name = EXCLUDED.name,
  structure_name = EXCLUDED.structure_name,
  is_active = TRUE,
  platform_status = 'ACTIVE';

INSERT INTO school_years (id, school_id, name, start_date, end_date, is_active)
VALUES (
  'eeeeeeee-0000-0000-0000-000000000002',
  'eeeeeeee-0000-0000-0000-000000000001',
  '2025-2026',
  '2025-10-01',
  '2026-07-31',
  TRUE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO class_levels (id, school_id, name, order_index, order_num)
VALUES
  ('eeeeeeee-0000-0000-0000-000000000003', 'eeeeeeee-0000-0000-0000-000000000001', '6ème', 1, 1),
  ('eeeeeeee-0000-0000-0000-000000000004', 'eeeeeeee-0000-0000-0000-000000000001', '5ème', 2, 2),
  ('eeeeeeee-0000-0000-0000-000000000005', 'eeeeeeee-0000-0000-0000-000000000001', '4ème', 3, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO classes (id, school_id, school_year_id, level_id, name, capacity)
VALUES
  ('eeeeeeee-0000-0000-0000-000000000006', 'eeeeeeee-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000002', 'eeeeeeee-0000-0000-0000-000000000003', '6ème A', 40),
  ('eeeeeeee-0000-0000-0000-000000000007', 'eeeeeeee-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000002', 'eeeeeeee-0000-0000-0000-000000000004', '5ème A', 38)
ON CONFLICT (id) DO NOTHING;

INSERT INTO subjects (id, school_id, name, coefficient, is_active)
VALUES
  ('eeeeeeee-0000-0000-0000-000000000008', 'eeeeeeee-0000-0000-0000-000000000001', 'Mathématiques', 4, TRUE),
  ('eeeeeeee-0000-0000-0000-000000000009', 'eeeeeeee-0000-0000-0000-000000000001', 'Français', 4, TRUE),
  ('eeeeeeee-0000-0000-0000-00000000000a', 'eeeeeeee-0000-0000-0000-000000000001', 'Histoire-Géographie', 2, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO students (id, school_id, iun, first_name, last_name, birth_date, birth_place, gender, status)
VALUES
  ('eeeeeeee-0000-0000-0000-00000000000b', 'eeeeeeee-0000-0000-0000-000000000001', 'DEMO-2026-0001', 'Awa', 'DEMBELE', '2013-04-12', 'Ouagadougou', 'F', 'active'),
  ('eeeeeeee-0000-0000-0000-00000000000c', 'eeeeeeee-0000-0000-0000-000000000001', 'DEMO-2026-0002', 'Issa', 'KONATE', '2013-08-03', 'Koudougou', 'M', 'active'),
  ('eeeeeeee-0000-0000-0000-00000000000d', 'eeeeeeee-0000-0000-0000-000000000001', 'DEMO-2026-0003', 'Mariam', 'OUEDRAOGO', '2013-11-20', 'Ouagadougou', 'F', 'active'),
  ('eeeeeeee-0000-0000-0000-00000000000e', 'eeeeeeee-0000-0000-0000-000000000001', 'DEMO-2026-0004', 'Boubacar', 'SANOU', '2012-02-15', 'Bobo-Dioulasso', 'M', 'active'),
  ('eeeeeeee-0000-0000-0000-00000000000f', 'eeeeeeee-0000-0000-0000-000000000001', 'DEMO-2026-0005', 'Rasmata', 'ZABRE', '2013-06-28', 'Ouagadougou', 'F', 'pending')
ON CONFLICT (id) DO NOTHING;

INSERT INTO student_enrollments (id, school_id, student_id, class_id, school_year_id, status)
VALUES
  ('eeeeeeee-0000-0000-0000-000000000010', 'eeeeeeee-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-00000000000b', 'eeeeeeee-0000-0000-0000-000000000006', 'eeeeeeee-0000-0000-0000-000000000002', 'active'),
  ('eeeeeeee-0000-0000-0000-000000000011', 'eeeeeeee-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-00000000000c', 'eeeeeeee-0000-0000-0000-000000000006', 'eeeeeeee-0000-0000-0000-000000000002', 'active'),
  ('eeeeeeee-0000-0000-0000-000000000012', 'eeeeeeee-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-00000000000d', 'eeeeeeee-0000-0000-0000-000000000006', 'eeeeeeee-0000-0000-0000-000000000002', 'active'),
  ('eeeeeeee-0000-0000-0000-000000000013', 'eeeeeeee-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-00000000000e', 'eeeeeeee-0000-0000-0000-000000000007', 'eeeeeeee-0000-0000-0000-000000000002', 'active')
ON CONFLICT (id) DO NOTHING;
