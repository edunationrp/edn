'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function lockEvaluation(evaluationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('evaluations')
    .update({ is_locked: true })
    .eq('id', evaluationId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/grades')
  revalidatePath('/dashboard/grades/validate')
  return { success: true }
}

export async function generateReportCardsForClass(input: {
  schoolId: string
  schoolYearId: string
  termId: string
  classId: string
  userId: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' }

  const { data: enrollmentsRaw } = await supabase
    .from('student_enrollments')
    .select('student_id')
    .eq('school_id', input.schoolId)
    .eq('class_id', input.classId)
    .eq('school_year_id', input.schoolYearId)

  const studentIds = ((enrollmentsRaw as Array<{ student_id: string }> | null) ?? []).map(e => e.student_id)
  if (studentIds.length === 0) {
    return { error: 'Aucun élève inscrit dans cette classe.' }
  }

  let created = 0
  const { data: termRaw } = await supabase.from('terms').select('name').eq('id', input.termId).limit(1)
  const termName = (termRaw as Array<{ name: string }> | null)?.[0]?.name ?? 'T1'

  for (const studentId of studentIds) {
    const { data: gradesRaw } = await supabase
      .from('grades')
      .select('value, max_value')
      .eq('school_id', input.schoolId)
      .eq('student_id', studentId)
      .eq('term', termName)

    const grades = (gradesRaw ?? []) as Array<{ value: number; max_value: number }>
    let average: number | null = null
    if (grades.length > 0) {
      const normalized = grades.map(g => (g.value / (g.max_value || 20)) * 20)
      average = Math.round((normalized.reduce((a, b) => a + b, 0) / normalized.length) * 100) / 100
    }

    const serial = `RC-${Date.now().toString(36).toUpperCase()}-${studentId.slice(0, 4).toUpperCase()}`
    const qrHash = serial.replace(/[^A-Z0-9]/gi, '').slice(0, 24)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('report_cards').upsert(
      {
        school_id: input.schoolId,
        school_year_id: input.schoolYearId,
        term_id: input.termId,
        student_id: studentId,
        class_id: input.classId,
        serial_number: serial,
        status: 'draft',
        term: termName,
        average,
        is_published: false,
        is_locked: false,
        hash: qrHash,
        qr_hash: qrHash,
        generated_by: input.userId,
        generated_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,term_id' }
    )
    if (!error) created += 1
  }

  revalidatePath('/dashboard/report-cards')
  return { success: true, created }
}
