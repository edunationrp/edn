import type { TeacherInviteAssignmentInput } from '@/lib/staff/invitation-assignments'

export type TeacherAssignmentRow = {
  id: string
  classId: string
  subjectId: string
  className: string
  subjectName: string
  schoolYearId: string
}

export async function listTeacherAssignmentRows(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  schoolId: string,
  teacherUserId: string,
  assignmentIds?: string[],
): Promise<TeacherAssignmentRow[]> {
  let query = db
    .from('teacher_assignments')
    .select(`
      id, class_id, subject_id, school_year_id,
      classes ( name ),
      subjects ( name )
    `)
    .eq('school_id', schoolId)
    .eq('teacher_id', teacherUserId)
    .eq('is_active', true)

  if (assignmentIds?.length) {
    query = query.in('id', assignmentIds)
  }

  const { data, error } = await query

  if (error) return []

  return ((data ?? []) as Array<{
    id: string
    class_id: string
    subject_id: string
    school_year_id: string
    classes: { name: string } | { name: string }[] | null
    subjects: { name: string } | { name: string }[] | null
  }>).map(row => {
    const classRef = Array.isArray(row.classes) ? row.classes[0] : row.classes
    const subjectRef = Array.isArray(row.subjects) ? row.subjects[0] : row.subjects

    return {
      id: row.id,
      classId: row.class_id,
      subjectId: row.subject_id,
      schoolYearId: row.school_year_id,
      className: classRef?.name ?? 'Classe',
      subjectName: subjectRef?.name ?? 'Matière',
    }
  })
}

export function toTeacherInviteAssignments(
  rows: TeacherAssignmentRow[],
): TeacherInviteAssignmentInput[] {
  const seen = new Set<string>()
  return rows
    .map(row => ({ classId: row.classId, subjectId: row.subjectId }))
    .filter(row => {
      const key = `${row.classId}:${row.subjectId}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

export async function removeTeacherClassAssignments(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  schoolId: string,
  teacherUserId: string,
  assignmentIds: string[],
): Promise<{ error?: string }> {
  if (!assignmentIds.length) return {}

  const { data: rowsRaw, error: loadError } = await db
    .from('teacher_assignments')
    .select('id, class_id')
    .eq('school_id', schoolId)
    .eq('teacher_id', teacherUserId)
    .in('id', assignmentIds)

  if (loadError) return { error: loadError.message }

  const rows = (rowsRaw ?? []) as Array<{ id: string; class_id: string }>
  if (!rows.length) {
    return { error: 'Affectation introuvable.' }
  }

  const classIds = rows.map(row => row.class_id)

  const { error: deleteError } = await db
    .from('teacher_assignments')
    .delete()
    .eq('school_id', schoolId)
    .eq('teacher_id', teacherUserId)
    .in('id', assignmentIds)

  if (deleteError) return { error: deleteError.message }

  const { error: classesError } = await db
    .from('classes')
    .update({ main_teacher_id: null })
    .eq('school_id', schoolId)
    .eq('main_teacher_id', teacherUserId)
    .in('id', classIds)

  if (classesError) return { error: classesError.message }

  return {}
}

export async function transferTeacherClassAssignments(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  params: {
    schoolId: string
    fromTeacherUserId: string
    toTeacherUserId: string
    assignmentIds: string[]
  },
): Promise<{ error?: string }> {
  const rows = await listTeacherAssignmentRows(
    db,
    params.schoolId,
    params.fromTeacherUserId,
    params.assignmentIds,
  )

  if (!rows.length) {
    return { error: 'Aucune affectation à transférer.' }
  }

  for (const row of rows) {
    const { error: upsertError } = await db.from('teacher_assignments').upsert(
      {
        school_id: params.schoolId,
        teacher_id: params.toTeacherUserId,
        class_id: row.classId,
        subject_id: row.subjectId,
        school_year_id: row.schoolYearId,
        is_active: true,
      },
      { onConflict: 'teacher_id,class_id,subject_id,school_year_id' },
    )

    if (upsertError) return { error: upsertError.message }
  }

  const removed = await removeTeacherClassAssignments(
    db,
    params.schoolId,
    params.fromTeacherUserId,
    rows.map(row => row.id),
  )

  if (removed.error) return removed

  return {}
}
