import type { SupabaseClient } from '@supabase/supabase-js'
import { computeStudentAverage } from '@/lib/grades/sheet-types'
import type { PromotionAverageRule } from '@/lib/promotions/types'
import { BULLETIN_TERM_ORDER, normalizeBulletinTermCode, type BulletinTermCode } from '@/lib/report-cards/bulletin-term'

type TermRow = { id: string; name: string; start_date: string; end_date: string }

type SubjectRow = { subjectId: string; coefficient: number }

async function getClassSubjects(
  admin: SupabaseClient,
  schoolId: string,
  classId: string,
): Promise<SubjectRow[]> {
  const { data: classSubjectsRaw } = await admin
    .from('class_subjects')
    .select('subject_id, coefficient, subjects(id, name)')
    .eq('class_id', classId)
    .eq('school_id', schoolId)

  const mapped = ((classSubjectsRaw ?? []) as unknown as Array<{
    subject_id: string
    coefficient: number
    subjects: { id: string; name: string } | null
  }>).map(row => ({
    subjectId: row.subject_id,
    coefficient: Number(row.coefficient) || 1,
  }))

  if (mapped.length > 0) return mapped

  const { data: subjectsRaw } = await admin
    .from('subjects')
    .select('id, coefficient')
    .eq('school_id', schoolId)
    .eq('is_active', true)

  return ((subjectsRaw ?? []) as Array<{ id: string; coefficient: number }>).map(row => ({
    subjectId: row.id,
    coefficient: Number(row.coefficient) || 1,
  }))
}

async function getSubjectGradesForStudent(
  admin: SupabaseClient,
  params: {
    schoolId: string
    studentId: string
    subjectId: string
    termCode: string
  },
): Promise<{ devoir1: number | null; devoir2: number | null; examen: number | null; average: number | null }> {
  const { data: evaluations } = await admin
    .from('evaluations')
    .select('id, sequence_slot')
    .eq('school_id', params.schoolId)
    .eq('subject_id', params.subjectId)
    .eq('term', params.termCode)
    .not('sequence_slot', 'is', null)

  const evals = (evaluations ?? []) as Array<{ id: string; sequence_slot: string }>
  if (evals.length === 0) {
    return { devoir1: null, devoir2: null, examen: null, average: null }
  }

  const evalIds = evals.map(item => item.id)
  const { data: grades } = await admin
    .from('grades')
    .select('evaluation_id, value, grade')
    .eq('student_id', params.studentId)
    .in('evaluation_id', evalIds)

  const values: { devoir1: number | null; devoir2: number | null; examen: number | null } = {
    devoir1: null,
    devoir2: null,
    examen: null,
  }

  for (const row of (grades ?? []) as Array<{ evaluation_id: string; value: number | null; grade: number | null }>) {
    const slot = evals.find(item => item.id === row.evaluation_id)?.sequence_slot
    const numeric = row.value ?? row.grade
    if (numeric === null || numeric === undefined) continue
    if (slot === 'devoir1') values.devoir1 = Number(numeric)
    if (slot === 'devoir2') values.devoir2 = Number(numeric)
    if (slot === 'examen') values.examen = Number(numeric)
  }

  return { ...values, average: computeStudentAverage(values) }
}

async function computeGeneralFromGrades(
  admin: SupabaseClient,
  params: {
    schoolId: string
    studentId: string
    classId: string
    termCode: string
  },
): Promise<number | null> {
  const subjects = await getClassSubjects(admin, params.schoolId, params.classId)
  if (subjects.length === 0) return null

  let totalCoef = 0
  let weighted = 0
  for (const subject of subjects) {
    const result = await getSubjectGradesForStudent(admin, {
      schoolId: params.schoolId,
      studentId: params.studentId,
      subjectId: subject.subjectId,
      termCode: params.termCode,
    })
    if (result.average !== null) {
      totalCoef += subject.coefficient
      weighted += result.average * subject.coefficient
    }
  }
  if (totalCoef === 0) return null
  return Math.round((weighted / totalCoef) * 100) / 100
}

async function getBulletinAverage(
  admin: SupabaseClient,
  params: {
    schoolId: string
    schoolYearId: string
    studentId: string
    termId: string
  },
): Promise<number | null> {
  const { data } = await admin
    .from('report_cards')
    .select('average')
    .eq('school_id', params.schoolId)
    .eq('school_year_id', params.schoolYearId)
    .eq('student_id', params.studentId)
    .eq('term_id', params.termId)
    .maybeSingle()

  const avg = (data as { average: number | null } | null)?.average
  return avg !== null && avg !== undefined ? Number(avg) : null
}

export async function listSchoolYearTerms(
  admin: SupabaseClient,
  schoolId: string,
  schoolYearId: string,
): Promise<TermRow[]> {
  const { data } = await admin
    .from('terms')
    .select('id, name, start_date, end_date')
    .eq('school_id', schoolId)
    .eq('school_year_id', schoolYearId)
    .order('end_date', { ascending: true })

  return (data as TermRow[] | null) ?? []
}

function termCodeFromName(name: string): BulletinTermCode | null {
  return normalizeBulletinTermCode(name)
}

export function resolveTermCodes(terms: TermRow[]): BulletinTermCode[] {
  const codes: BulletinTermCode[] = []
  for (const term of terms) {
    const code = termCodeFromName(term.name)
    if (code && BULLETIN_TERM_ORDER.includes(code) && !codes.includes(code)) {
      codes.push(code)
    }
  }
  return codes.length > 0 ? codes : ['T3']
}

export async function computeStudentPromotionAverage(
  admin: SupabaseClient,
  params: {
    schoolId: string
    schoolYearId: string
    classId: string
    studentId: string
    rule: PromotionAverageRule
    terms: TermRow[]
  },
): Promise<{ average: number | null; termLabel: string | null }> {
  if (params.terms.length === 0) {
    return { average: null, termLabel: null }
  }

  const termAverages: Array<{ term: TermRow; average: number | null }> = []

  for (const term of params.terms) {
    const termCode = normalizeBulletinTermCode(term.name) ?? termCodeFromName(term.name)
    let average = await getBulletinAverage(admin, {
      schoolId: params.schoolId,
      schoolYearId: params.schoolYearId,
      studentId: params.studentId,
      termId: term.id,
    })
    if (average === null && termCode) {
      average = await computeGeneralFromGrades(admin, {
        schoolId: params.schoolId,
        studentId: params.studentId,
        classId: params.classId,
        termCode,
      })
    }
    termAverages.push({ term, average })
  }

  if (params.rule === 'last_term') {
    const last = termAverages[termAverages.length - 1]
    return { average: last.average, termLabel: last.term.name }
  }

  const values = termAverages.map(item => item.average).filter((v): v is number => v !== null)
  if (values.length === 0) {
    return { average: null, termLabel: null }
  }
  const mean = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100
  return {
    average: mean,
    termLabel: `Moyenne ${values.length} période(s)`,
  }
}
