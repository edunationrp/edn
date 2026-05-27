-- Niveaux scolaires par défaut pour les établissements sans class_levels

INSERT INTO class_levels (school_id, name, order_index, order_num)
SELECT s.id, v.name, v.ord, v.ord
FROM schools s
CROSS JOIN LATERAL (
  VALUES
    ('CP', 1), ('CE1', 2), ('CE2', 3), ('CM1', 4), ('CM2', 5)
) AS v(name, ord)
WHERE s.type = 'primaire'
  AND NOT EXISTS (SELECT 1 FROM class_levels cl WHERE cl.school_id = s.id);

INSERT INTO class_levels (school_id, name, order_index, order_num)
SELECT s.id, v.name, v.ord, v.ord
FROM schools s
CROSS JOIN LATERAL (
  VALUES
    ('6ème', 1), ('5ème', 2), ('4ème', 3), ('3ème', 4)
) AS v(name, ord)
WHERE s.type = 'secondaire'
  AND NOT EXISTS (SELECT 1 FROM class_levels cl WHERE cl.school_id = s.id);

INSERT INTO class_levels (school_id, name, order_index, order_num)
SELECT s.id, v.name, v.ord, v.ord
FROM schools s
CROSS JOIN LATERAL (
  VALUES
    ('6ème', 1), ('5ème', 2), ('4ème', 3), ('3ème', 4),
    ('2nde', 5), ('1ère', 6), ('Tle', 7)
) AS v(name, ord)
WHERE s.type = 'lycee'
  AND NOT EXISTS (SELECT 1 FROM class_levels cl WHERE cl.school_id = s.id);

INSERT INTO class_levels (school_id, name, order_index, order_num)
SELECT s.id, v.name, v.ord, v.ord
FROM schools s
CROSS JOIN LATERAL (
  VALUES
    ('L1', 1), ('L2', 2), ('L3', 3), ('M1', 4), ('M2', 5)
) AS v(name, ord)
WHERE s.type = 'universite'
  AND NOT EXISTS (SELECT 1 FROM class_levels cl WHERE cl.school_id = s.id);

INSERT INTO class_levels (school_id, name, order_index, order_num)
SELECT s.id, v.name, v.ord, v.ord
FROM schools s
CROSS JOIN LATERAL (
  VALUES
    ('Niveau 1', 1), ('Niveau 2', 2), ('Niveau 3', 3)
) AS v(name, ord)
WHERE s.type = 'formation'
  AND NOT EXISTS (SELECT 1 FROM class_levels cl WHERE cl.school_id = s.id);

INSERT INTO class_levels (school_id, name, order_index, order_num)
SELECT s.id, v.name, v.ord, v.ord
FROM schools s
CROSS JOIN LATERAL (
  VALUES
    ('6ème', 1), ('5ème', 2), ('4ème', 3), ('3ème', 4),
    ('2nde', 5), ('1ère', 6), ('Tle', 7)
) AS v(name, ord)
WHERE s.type NOT IN ('primaire', 'secondaire', 'lycee', 'universite', 'formation')
  AND NOT EXISTS (SELECT 1 FROM class_levels cl WHERE cl.school_id = s.id);
