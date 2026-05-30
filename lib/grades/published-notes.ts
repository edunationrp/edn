import type { createClient } from '@/lib/supabase/server'
import {
  computeStudentAverage,
  shortAppreciation,
  SLOT_LABELS,
  type GradeSequenceSlot,
} from '@/lib/grades/sheet-types'

export type PublishedSubjectGrades = {
  subjectId: string
  subjectName: string
  devoir1: number | null
  devoir2: number | null
  examen: number | null
  average: number | null
  appreciation: string
}

export type PublishedTermGrades = {
  term: string
  termLabel: string
  subjects: PublishedSubjectGrades[]
}

const TERM_LABELS: Record<string, string> = {
  T1: 'Trimestre 1',
  T2: 'Trimestre 2',
  T3: 'Trimestre 3',
}

function termLabel(term: string) {
  return TERM_LABELS[term] ?? term
}

export async function fetchPublishedStudentGrades(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentId: string,
): Promise<PublishedTermGrades[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: gradesRaw } = await (supabase as any)
    .from('grades')
    .select(`
      value,
      evaluations!inner(
        term,
        sequence_slot,
        subjects(id, name)
      )
    `)
    .eq('student_id', studentId)
    .not('evaluation_id', 'is', null)

  type GradeRow = {
    value: number
    evaluations: {
      term: string
      sequence_slot: GradeSequenceSlot | null
      subjects: { id: string; name: string } | null
    } | null
  }

  const byTermSubject = new Map<
    string,
    Map<string, { name: string; grades: Partial<Record<GradeSequenceSlot, number>> }>
  >()

  for (const row of (gradesRaw ?? []) as GradeRow[]) {
    const evaluation = row.evaluations
    if (!evaluation?.sequence_slot || !evaluation.subjects) continue

    const term = evaluation.term
    const subjectId = evaluation.subjects.id
    const subjectName = evaluation.subjects.name

    if (!byTermSubject.has(term)) byTermSubject.set(term, new Map())
    const subjectMap = byTermSubject.get(term)!
    if (!subjectMap.has(subjectId)) {
      subjectMap.set(subjectId, { name: subjectName, grades: {} })
    }
    subjectMap.get(subjectId)!.grades[evaluation.sequence_slot] = row.value
  }

  const terms = Array.from(byTermSubject.keys()).sort()
  return terms.map(termKey => {
    const subjectMap = byTermSubject.get(termKey)!
    const subjects = Array.from(subjectMap.entries())
      .map(([subjectId, data]) => {
        const devoir1 = data.grades.devoir1 ?? null
        const devoir2 = data.grades.devoir2 ?? null
        const examen = data.grades.examen ?? null
        const average = computeStudentAverage({ devoir1, devoir2, examen })
        return {
          subjectId,
          subjectName: data.name,
          devoir1,
          devoir2,
          examen,
          average,
          appreciation: shortAppreciation(average),
        }
      })
      .sort((a, b) => a.subjectName.localeCompare(b.subjectName, 'fr'))

    return {
      term: termKey,
      termLabel: termLabel(termKey),
      subjects,
    }
  })
}

export type PublishedGradeEntry = {
  subjectName: string
  slotLabel: string
  value: number
  termLabel: string
}

export function recentPublishedGradeEntries(
  terms: PublishedTermGrades[],
  limit = 5,
): PublishedGradeEntry[] {
  const entries: PublishedGradeEntry[] = []

  for (let termIndex = terms.length - 1; termIndex >= 0; termIndex -= 1) {
    const term = terms[termIndex]
    for (const subject of term.subjects) {
      for (const slot of ['devoir1', 'devoir2', 'examen'] as const) {
        const value = subject[slot]
        if (value !== null) {
          entries.push({
            subjectName: subject.subjectName,
            slotLabel: SLOT_LABELS[slot],
            value,
            termLabel: term.termLabel,
          })
        }
      }
    }
    if (entries.length >= limit) break
  }

  return entries.slice(0, limit)
}

export function latestPublishedTermAverage(terms: PublishedTermGrades[]): number | null {
  if (terms.length === 0) return null

  for (let termIndex = terms.length - 1; termIndex >= 0; termIndex -= 1) {
    const averages = terms[termIndex].subjects
      .map(subject => subject.average)
      .filter((value): value is number => value !== null)

    if (averages.length > 0) {
      const sum = averages.reduce((acc, value) => acc + value, 0)
      return Math.round((sum / averages.length) * 10) / 10
    }
  }

  return null
}

export { SLOT_LABELS }
