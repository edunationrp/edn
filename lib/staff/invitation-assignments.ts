export type TeacherInviteAssignmentInput = {
  classId: string
  subjectId: string
}

export type TeacherInviteAssignmentPreview = TeacherInviteAssignmentInput & {
  className: string
  subjectName: string
}

type InvitationMetadata = {
  teacher_assignments?: Array<{ class_id: string; subject_id: string }>
}

export function parseTeacherAssignmentsFromMetadata(
  metadata: unknown
): TeacherInviteAssignmentInput[] {
  if (!metadata || typeof metadata !== 'object') return []
  const raw = (metadata as InvitationMetadata).teacher_assignments
  if (!Array.isArray(raw)) return []

  const seen = new Set<string>()
  return raw
    .filter(row => row?.class_id && row?.subject_id)
    .filter(row => {
      const key = `${row.class_id}:${row.subject_id}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map(row => ({
      classId: row.class_id,
      subjectId: row.subject_id,
    }))
}

export function buildInvitationMetadata(
  assignments: TeacherInviteAssignmentInput[] | undefined
): InvitationMetadata {
  if (!assignments?.length) return {}
  return {
    teacher_assignments: assignments.map(a => ({
      class_id: a.classId,
      subject_id: a.subjectId,
    })),
  }
}

export async function validateTeacherInviteAssignments(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  schoolId: string,
  assignments: TeacherInviteAssignmentInput[]
): Promise<{ error?: string }> {
  if (assignments.length === 0) {
    return { error: 'Sélectionnez au moins une classe et une matière pour le professeur.' }
  }

  const classIds = [...new Set(assignments.map(a => a.classId))]
  const subjectIds = [...new Set(assignments.map(a => a.subjectId))]

  const [{ data: classesRaw }, { data: subjectsRaw }] = await Promise.all([
    db.from('classes').select('id').eq('school_id', schoolId).in('id', classIds),
    db.from('subjects').select('id').eq('school_id', schoolId).in('id', subjectIds),
  ])

  const validClassIds = new Set(((classesRaw ?? []) as Array<{ id: string }>).map(c => c.id))
  const validSubjectIds = new Set(((subjectsRaw ?? []) as Array<{ id: string }>).map(s => s.id))

  for (const a of assignments) {
    if (!validClassIds.has(a.classId) || !validSubjectIds.has(a.subjectId)) {
      return { error: 'Classe ou matière invalide pour cet établissement.' }
    }
  }

  return {}
}

export async function enrichTeacherAssignments(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  schoolId: string,
  assignments: TeacherInviteAssignmentInput[]
): Promise<TeacherInviteAssignmentPreview[]> {
  if (assignments.length === 0) return []

  const classIds = [...new Set(assignments.map(a => a.classId))]
  const subjectIds = [...new Set(assignments.map(a => a.subjectId))]

  const [{ data: classesRaw }, { data: subjectsRaw }] = await Promise.all([
    db.from('classes').select('id, name').eq('school_id', schoolId).in('id', classIds),
    db.from('subjects').select('id, name').eq('school_id', schoolId).in('id', subjectIds),
  ])

  const classNames = new Map(
    ((classesRaw ?? []) as Array<{ id: string; name: string }>).map(c => [c.id, c.name])
  )
  const subjectNames = new Map(
    ((subjectsRaw ?? []) as Array<{ id: string; name: string }>).map(s => [s.id, s.name])
  )

  return assignments.map(a => ({
    classId: a.classId,
    subjectId: a.subjectId,
    className: classNames.get(a.classId) ?? 'Classe',
    subjectName: subjectNames.get(a.subjectId) ?? 'Matière',
  }))
}

export async function applyTeacherAssignmentsFromInvitation(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  params: {
    schoolId: string
    teacherId: string
    assignments: TeacherInviteAssignmentInput[]
  }
): Promise<{ error?: string }> {
  if (params.assignments.length === 0) return {}

  const validation = await validateTeacherInviteAssignments(db, params.schoolId, params.assignments)
  if (validation.error) return validation

  const { data: yearRaw } = await db
    .from('school_years')
    .select('id')
    .eq('school_id', params.schoolId)
    .eq('is_active', true)
    .limit(1)

  const schoolYearId = (yearRaw as Array<{ id: string }> | null)?.[0]?.id
  if (!schoolYearId) {
    return { error: 'Aucune année scolaire active — affectations non enregistrées.' }
  }

  for (const assignment of params.assignments) {
    const { error } = await db.from('teacher_assignments').upsert(
      {
        school_id: params.schoolId,
        teacher_id: params.teacherId,
        class_id: assignment.classId,
        subject_id: assignment.subjectId,
        school_year_id: schoolYearId,
        is_active: true,
      },
      { onConflict: 'teacher_id,class_id,subject_id,school_year_id' }
    )

    if (error) return { error: error.message }
  }

  return {}
}
