-- Corriger les doublons grades(evaluation_id, student_id) et evaluations(sheet slot)

-- 1. Doublons de notes sur la même évaluation
DELETE FROM grades a
USING grades b
WHERE a.evaluation_id IS NOT NULL
  AND a.evaluation_id = b.evaluation_id
  AND a.student_id = b.student_id
  AND a.id < b.id;

-- 2. Fusionner les évaluations en double pour un même slot feuille de notes
CREATE TEMP TABLE eval_slot_dedupe ON COMMIT DROP AS
WITH inferred AS (
  SELECT
    e.id,
    e.school_id,
    e.class_id,
    e.subject_id,
    e.term,
    e.sequence_slot AS current_slot,
    CASE
      WHEN e.sequence_slot IS NOT NULL THEN e.sequence_slot
      WHEN lower(e.title) LIKE '%examen%' OR e.eval_type = 'examen' THEN 'examen'
      WHEN lower(e.title) LIKE '%devoir 2%' OR lower(e.title) LIKE '%devoir2%' THEN 'devoir2'
      WHEN lower(e.title) LIKE '%devoir 1%' OR lower(e.title) LIKE '%devoir1%' OR e.eval_type = 'devoir' THEN 'devoir1'
      ELSE NULL
    END AS inferred_slot,
    (SELECT COUNT(*)::int FROM grades g WHERE g.evaluation_id = e.id) AS grade_count
  FROM evaluations e
  WHERE e.class_id IS NOT NULL
    AND e.subject_id IS NOT NULL
    AND e.term IS NOT NULL
),
ranked AS (
  SELECT
    id,
    school_id,
    class_id,
    subject_id,
    term,
    inferred_slot,
    current_slot,
    ROW_NUMBER() OVER (
      PARTITION BY school_id, class_id, subject_id, term, inferred_slot
      ORDER BY
        CASE WHEN current_slot IS NOT NULL THEN 0 ELSE 1 END,
        grade_count DESC,
        id ASC
    ) AS rn
  FROM inferred
  WHERE inferred_slot IS NOT NULL
)
SELECT
  r.id,
  c.id AS canonical_id
FROM ranked r
JOIN ranked c
  ON c.school_id = r.school_id
 AND c.class_id = r.class_id
 AND c.subject_id = r.subject_id
 AND c.term = r.term
 AND c.inferred_slot = r.inferred_slot
 AND c.rn = 1
WHERE r.rn > 1;

-- Déplacer les notes sans conflit vers l'évaluation canonique
UPDATE grades g
SET evaluation_id = d.canonical_id
FROM eval_slot_dedupe d
WHERE g.evaluation_id = d.id
  AND NOT EXISTS (
    SELECT 1
    FROM grades g2
    WHERE g2.evaluation_id = d.canonical_id
      AND g2.student_id = g.student_id
  );

-- Supprimer les notes restantes sur les évaluations doublons (la canonique garde la sienne)
DELETE FROM grades g
USING eval_slot_dedupe d
WHERE g.evaluation_id = d.id;

UPDATE grade_history gh
SET evaluation_id = d.canonical_id
FROM eval_slot_dedupe d
WHERE gh.evaluation_id = d.id;

DELETE FROM evaluations e
USING eval_slot_dedupe d
WHERE e.id = d.id;

-- 3. Rattacher les évaluations legacy restantes (une seule par slot après fusion)
UPDATE evaluations e
SET sequence_slot = CASE
  WHEN lower(e.title) LIKE '%examen%' OR e.eval_type = 'examen' THEN 'examen'
  WHEN lower(e.title) LIKE '%devoir 2%' OR lower(e.title) LIKE '%devoir2%' THEN 'devoir2'
  WHEN lower(e.title) LIKE '%devoir 1%' OR lower(e.title) LIKE '%devoir1%' OR e.eval_type = 'devoir' THEN 'devoir1'
  ELSE NULL
END
WHERE e.sequence_slot IS NULL
  AND e.class_id IS NOT NULL
  AND e.subject_id IS NOT NULL
  AND e.term IS NOT NULL
  AND (
    lower(e.title) LIKE '%examen%'
    OR e.eval_type = 'examen'
    OR lower(e.title) LIKE '%devoir%'
    OR e.eval_type = 'devoir'
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_grades_evaluation_student
  ON grades (evaluation_id, student_id)
  WHERE evaluation_id IS NOT NULL;
