import { createAdminClient } from '@/lib/supabase/admin'
import { computeStudentAverage } from '@/lib/grades/sheet-types'
import type { GradeSequenceSlot } from '@/lib/grades/sheet-types'

export type ClassAverageHintMap = Record<string, number>

function hintKey(term: string, subjectId: string) {
  return `${term}:${subjectId}`
}

/**
 * Moyennes de classe par matière/trimestre (agrégat anonyme, sans classement nominatif).
 */
export async function fetchClassAverageHintsForStudent(studentId: string): Promise<ClassAverageHintMap> {
  let admin
  try {
    admin = createAdminClient()
  } catch {
    return {}
  }

  const { data: enrollmentRaw } = await admin
    .from('student_enrollments')
    .select('class_id, school_id, school_year_id, school_years!inner(is_active)')
    .eq('student_id', studentId)
    .eq('status', 'active')

  const enrollment = (enrollmentRaw as Array<{
    class_id: string
    school_id: string
    school_year_id: string
    school_years: { is_active: boolean } | null
  }> | null)?.find(e => e.school_years?.is_active)

  if (!enrollment) return {}

  const { data: classmatesRaw } = await admin
    .from('student_enrollments')
    .select('student_id')
    .eq('class_id', enrollment.class_id)
    .eq('school_year_id', enrollment.school_year_id)
    .eq('status', 'active')

  const classStudentIds = ((classmatesRaw ?? []) as Array<{ student_id: string }>).map(r => r.student_id)
  if (classStudentIds.length === 0) return {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: publishedSlotsRaw } = await (admin as any)
    .from('grade_slot_publications')
    .select('term, subject_id, slot')
    .eq('school_id', enrollment.school_id)
    .eq('class_id', enrollment.class_id)
    .eq('status', 'published')

  const publishedKeys = new Set<string>()
  for (const row of (publishedSlotsRaw ?? []) as Array<{
    term: string
    subject_id: string
    slot: GradeSequenceSlot
  }>) {
    publishedKeys.add(`${row.term}:${row.subject_id}:${row.slot}`)
  }

  if (publishedKeys.size === 0) return {}

  const { data: evaluationsRaw } = await admin
    .from('evaluations')
    .select('id, term, sequence_slot, subject_id')
    .eq('school_id', enrollment.school_id)
    .eq('class_id', enrollment.class_id)

  const evaluationIds: string[] = []
  const evalMeta = new Map<string, { term: string; subjectId: string; slot: GradeSequenceSlot }>()

  for (const ev of (evaluationsRaw ?? []) as Array<{
    id: string
    term: string
    sequence_slot: GradeSequenceSlot | null
    subject_id: string
  }>) {
    if (!ev.sequence_slot) continue
    const key = `${ev.term}:${ev.subject_id}:${ev.sequence_slot}`
    if (!publishedKeys.has(key)) continue
    evaluationIds.push(ev.id)
    evalMeta.set(ev.id, { term: ev.term, subjectId: ev.subject_id, slot: ev.sequence_slot })
  }

  if (evaluationIds.length === 0) return {}

  const { data: gradesRaw } = await admin
    .from('grades')
    .select('student_id, evaluation_id, value')
    .in('student_id', classStudentIds)
    .in('evaluation_id', evaluationIds)

  const byStudentTermSubject = new Map<
    string,
    Map<string, Map<string, Partial<Record<GradeSequenceSlot, number>>>>
  >()

  for (const grade of (gradesRaw ?? []) as Array<{
    student_id: string
    evaluation_id: string
    value: number
  }>) {
    const meta = evalMeta.get(grade.evaluation_id)
    if (!meta) continue

    if (!byStudentTermSubject.has(grade.student_id)) {
      byStudentTermSubject.set(grade.student_id, new Map())
    }
    const byTerm = byStudentTermSubject.get(grade.student_id)!
    if (!byTerm.has(meta.term)) byTerm.set(meta.term, new Map())
    const bySubject = byTerm.get(meta.term)!
    if (!bySubject.has(meta.subjectId)) {
      bySubject.set(meta.subjectId, {})
    }
    bySubject.get(meta.subjectId)![meta.slot] = grade.value
  }

  const sums = new Map<string, { total: number; count: number }>()

  for (const [, byTerm] of byStudentTermSubject) {
    for (const [term, bySubject] of byTerm) {
      for (const [subjectId, slots] of bySubject) {
        const avg = computeStudentAverage({
          devoir1: slots.devoir1 ?? null,
          devoir2: slots.devoir2 ?? null,
          examen: slots.examen ?? null,
        })
        if (avg === null) continue
        const key = hintKey(term, subjectId)
        const entry = sums.get(key) ?? { total: 0, count: 0 }
        entry.total += avg
        entry.count += 1
        sums.set(key, entry)
      }
    }
  }

  const result: ClassAverageHintMap = {}
  for (const [key, { total, count }] of sums) {
    if (count > 0) {
      result[key] = Math.round((total / count) * 10) / 10
    }
  }

  return result
}

export function getClassAverageHint(
  hints: ClassAverageHintMap,
  term: string,
  subjectId: string,
): number | null {
  return hints[hintKey(term, subjectId)] ?? null
}

export function formatClassComparison(studentAverage: number | null, classAverage: number | null): string | null {
  if (studentAverage === null || classAverage === null) return null

  const diff = studentAverage - classAverage
  const classLabel = `~${classAverage.toFixed(1)}/20`

  if (Math.abs(diff) < 0.5) {
    return `Proche de la moyenne de ta classe (${classLabel})`
  }
  if (diff >= 0.5) {
    return `Légèrement au-dessus de la moyenne de classe (${classLabel})`
  }
  return `Légèrement en dessous de la moyenne de classe (${classLabel})`
}
