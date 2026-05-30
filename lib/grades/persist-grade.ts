import type { createClient } from '@/lib/supabase/server'

type Db = Awaited<ReturnType<typeof createClient>> | ReturnType<typeof import('@/lib/supabase/admin').createAdminClient>

export type UpsertGradeInput = {
  schoolId: string
  evaluationId: string
  studentId: string
  value: number
  maxValue?: number
  term: string
  userId: string
}

export async function findGradeIdByEvaluationStudent(
  db: Db,
  evaluationId: string,
  studentId: string,
): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (db as any)
    .from('grades')
    .select('id')
    .eq('evaluation_id', evaluationId)
    .eq('student_id', studentId)
    .maybeSingle()

  return (data as { id: string } | null)?.id ?? null
}

/** Insère ou met à jour une note (évite la violation idx_grades_evaluation_student). */
export async function upsertGradeByEvaluationStudent(
  db: Db,
  input: UpsertGradeInput,
): Promise<{ error: string } | { gradeId: string }> {
  const existingId = await findGradeIdByEvaluationStudent(db, input.evaluationId, input.studentId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = db as any

  if (existingId) {
    const { error } = await client
      .from('grades')
      .update({
        value: input.value,
        max_value: input.maxValue ?? 20,
        updated_by: input.userId,
      })
      .eq('id', existingId)

    if (error) return { error: error.message as string }
    return { gradeId: existingId }
  }

  const { data, error } = await client
    .from('grades')
    .insert({
      school_id: input.schoolId,
      evaluation_id: input.evaluationId,
      student_id: input.studentId,
      value: input.value,
      max_value: input.maxValue ?? 20,
      period: input.term,
      term: input.term,
      created_by: input.userId,
      updated_by: input.userId,
    })
    .select('id')
    .single()

  if (error) {
    if (error.message.includes('idx_grades_evaluation_student') || error.code === '23505') {
      const retryId = await findGradeIdByEvaluationStudent(db, input.evaluationId, input.studentId)
      if (retryId) {
        const { error: updateError } = await client
          .from('grades')
          .update({
            value: input.value,
            max_value: input.maxValue ?? 20,
            updated_by: input.userId,
          })
          .eq('id', retryId)
        if (updateError) return { error: updateError.message as string }
        return { gradeId: retryId }
      }
    }
    return { error: error.message as string }
  }

  return { gradeId: (data as { id: string }).id }
}

/** Fusionne les notes d'une évaluation doublon vers l'évaluation canonique, puis supprime la source. */
export async function mergeEvaluationInto(
  db: Db,
  fromEvaluationId: string,
  toEvaluationId: string,
): Promise<{ error: string } | { success: true }> {
  if (fromEvaluationId === toEvaluationId) return { success: true }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = db as any

  const { data: fromGrades, error: fetchError } = await client
    .from('grades')
    .select('id, student_id')
    .eq('evaluation_id', fromEvaluationId)

  if (fetchError) return { error: fetchError.message as string }

  for (const grade of (fromGrades ?? []) as Array<{ id: string; student_id: string }>) {
    const existingId = await findGradeIdByEvaluationStudent(db, toEvaluationId, grade.student_id)
    if (existingId) {
      const { error } = await client.from('grades').delete().eq('id', grade.id)
      if (error) return { error: error.message as string }
    } else {
      const { error } = await client
        .from('grades')
        .update({ evaluation_id: toEvaluationId })
        .eq('id', grade.id)
      if (error) return { error: error.message as string }
    }
  }

  await client
    .from('grade_history')
    .update({ evaluation_id: toEvaluationId })
    .eq('evaluation_id', fromEvaluationId)

  const { error: deleteError } = await client
    .from('evaluations')
    .delete()
    .eq('id', fromEvaluationId)

  if (deleteError) return { error: deleteError.message as string }
  return { success: true }
}
