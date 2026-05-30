'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { hasPermission } from '@/types/permissions'
import type { UserRole } from '@/types/roles'
import { dispatchNotification } from '@/lib/notifications/dispatch'
import {
  GRADE_SEQUENCE_SLOTS,
  SLOT_LABELS,
  type GradeSequenceSlot,
  type GradeSheetContext,
  type StudentGradeRow,
} from '@/lib/grades/sheet-types'
import {
  findGradeIdByEvaluationStudent,
  mergeEvaluationInto,
  upsertGradeByEvaluationStudent,
} from '@/lib/grades/persist-grade'
import { fetchSlotPublications } from '@/lib/actions/grade-publication'

const SheetQuerySchema = z.object({
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  term: z.enum(['T1', 'T2', 'T3']),
})

const SaveCellSchema = z.object({
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  term: z.enum(['T1', 'T2', 'T3']),
  studentId: z.string().uuid(),
  slot: z.enum(['devoir1', 'devoir2', 'examen']),
  value: z.number().min(0).max(20).nullable(),
  reason: z.string().optional(),
})

async function requireGradeEditor():
  Promise<
    | { ok: false; error: string }
    | {
        ok: true
        supabase: Awaited<ReturnType<typeof createClient>>
        user: { id: string }
        ctx: NonNullable<Awaited<ReturnType<typeof getUserSchoolContext>>>
        role: UserRole
        schoolId: string
      }
  > {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Session expirée.' }

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) return { ok: false, error: 'Aucun établissement associé.' }

  const role = ctx.role_code as UserRole
  const canCreate = hasPermission(role, 'grades:create')
  const canUpdate = hasPermission(role, 'grades:update')
  if (!canCreate && !canUpdate) {
    return { ok: false, error: 'Vous n\'avez pas les droits pour saisir les notes.' }
  }

  return { ok: true, supabase, user, ctx, role, schoolId: ctx.school_id }
}

async function getActiveSchoolYearId(supabase: Awaited<ReturnType<typeof createClient>>, schoolId: string) {
  const { data } = await supabase
    .from('school_years')
    .select('id')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  return (data as { id: string } | null)?.id ?? null
}

async function ensureEvaluation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    schoolId: string
    schoolYearId: string | null
    classId: string
    subjectId: string
    term: string
    slot: GradeSequenceSlot
    userId: string
  },
) {
  const { data: slotted } = await supabase
    .from('evaluations')
    .select('id, is_locked')
    .eq('school_id', params.schoolId)
    .eq('class_id', params.classId)
    .eq('subject_id', params.subjectId)
    .eq('term', params.term)
    .eq('sequence_slot', params.slot)
    .maybeSingle()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: legacyEvals } = await (supabase as any)
    .from('evaluations')
    .select('id, is_locked, title, eval_type')
    .eq('school_id', params.schoolId)
    .eq('class_id', params.classId)
    .eq('subject_id', params.subjectId)
    .eq('term', params.term)
    .is('sequence_slot', null)

  const legacyMatch = ((legacyEvals ?? []) as Array<{
    id: string
    is_locked: boolean
    title: string
    eval_type: string
  }>).find(row => {
    const title = row.title.toLowerCase()
    if (params.slot === 'examen') {
      return row.eval_type === 'examen' || title.includes('examen')
    }
    if (params.slot === 'devoir2') {
      return title.includes('devoir 2') || title.includes('devoir2')
    }
    return (
      row.eval_type === 'devoir'
      || title.includes('devoir 1')
      || title.includes('devoir1')
      || title.includes('devoir')
    )
  })

  if (slotted && legacyMatch && legacyMatch.id !== (slotted as { id: string }).id) {
    const merged = await mergeEvaluationInto(
      supabase,
      legacyMatch.id,
      (slotted as { id: string }).id,
    )
    if ('error' in merged) return { error: merged.error }
    return slotted as { id: string; is_locked: boolean }
  }

  if (slotted) {
    return slotted as { id: string; is_locked: boolean }
  }

  if (legacyMatch) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('evaluations')
      .update({ sequence_slot: params.slot })
      .eq('id', legacyMatch.id)

    if (error) {
      const isSlotConflict =
        error.code === '23505'
        || (error.message as string).includes('idx_evaluations_sheet_slot')

      if (isSlotConflict) {
        const { data: conflict } = await supabase
          .from('evaluations')
          .select('id, is_locked')
          .eq('school_id', params.schoolId)
          .eq('class_id', params.classId)
          .eq('subject_id', params.subjectId)
          .eq('term', params.term)
          .eq('sequence_slot', params.slot)
          .maybeSingle()

        if (conflict) {
          const merged = await mergeEvaluationInto(supabase, legacyMatch.id, (conflict as { id: string }).id)
          if ('error' in merged) return { error: merged.error }
          return conflict as { id: string; is_locked: boolean }
        }
      }

      return { error: error.message as string }
    }

    return { id: legacyMatch.id, is_locked: legacyMatch.is_locked }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: created, error } = await (supabase as any)
    .from('evaluations')
    .insert({
      school_id: params.schoolId,
      school_year_id: params.schoolYearId,
      class_id: params.classId,
      subject_id: params.subjectId,
      title: SLOT_LABELS[params.slot],
      eval_type: params.slot === 'examen' ? 'examen' : 'devoir',
      sequence_slot: params.slot,
      max_score: 20,
      term: params.term,
      created_by: params.userId,
      is_locked: false,
    })
    .select('id, is_locked')
    .single()

  if (error) return { error: error.message as string }
  return created as { id: string; is_locked: boolean }
}

async function findTeacherForClassSubject(
  schoolId: string,
  classId: string,
  subjectId: string,
): Promise<string | null> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('teacher_assignments')
      .select('teacher_id')
      .eq('school_id', schoolId)
      .eq('class_id', classId)
      .eq('subject_id', subjectId)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    return (data as { teacher_id: string } | null)?.teacher_id ?? null
  } catch {
    return null
  }
}

async function fetchLastRejectedSubmission(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: { schoolId: string; classId: string; subjectId: string; term: string },
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('grade_sheet_submissions')
    .select('rejection_reason, reviewed_at')
    .eq('school_id', params.schoolId)
    .eq('class_id', params.classId)
    .eq('subject_id', params.subjectId)
    .eq('term', params.term)
    .eq('status', 'rejected')
    .order('reviewed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data as { rejection_reason: string | null; reviewed_at: string | null } | null
}

async function fetchPendingSubmission(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: { schoolId: string; classId: string; subjectId: string; term: string },
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('grade_sheet_submissions')
    .select('id, status, rejection_reason')
    .eq('school_id', params.schoolId)
    .eq('class_id', params.classId)
    .eq('subject_id', params.subjectId)
    .eq('term', params.term)
    .eq('status', 'pending')
    .maybeSingle()

  return data as {
    id: string
    status: 'pending'
    rejection_reason: string | null
  } | null
}

async function fetchSubmissionItems(submissionId: string) {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('grade_sheet_submission_items')
      .select('student_id, slot, proposed_value, previous_value')
      .eq('submission_id', submissionId)

    return (data ?? []) as Array<{
      student_id: string
      slot: GradeSequenceSlot
      proposed_value: number | null
      previous_value: number | null
    }>
  } catch {
    return []
  }
}

async function getOrCreatePendingSubmission(params: {
  schoolId: string
  classId: string
  subjectId: string
  term: string
  submittedBy: string
  teacherId: string | null
  secretaryNote?: string
}) {
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any

  const { data: existing } = await db
    .from('grade_sheet_submissions')
    .select('id')
    .eq('school_id', params.schoolId)
    .eq('class_id', params.classId)
    .eq('subject_id', params.subjectId)
    .eq('term', params.term)
    .eq('status', 'pending')
    .maybeSingle()

  if (existing) {
    return { id: existing.id as string, isNew: false }
  }

  const { data: created, error } = await db
    .from('grade_sheet_submissions')
    .insert({
      school_id: params.schoolId,
      class_id: params.classId,
      subject_id: params.subjectId,
      term: params.term,
      status: 'pending',
      submitted_by: params.submittedBy,
      teacher_id: params.teacherId,
      secretary_note: params.secretaryNote ?? null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message as string }
  return { id: created.id as string, isNew: true }
}

async function saveSecretaryProposedGrade(params: {
  access: Extract<Awaited<ReturnType<typeof requireGradeEditor>>, { ok: true }>
  sheet: GradeSheetContext
  parsed: z.infer<typeof SaveCellSchema>
  row: StudentGradeRow
  oldValue: number | null
}) {
  const teacherId = await findTeacherForClassSubject(
    params.access.schoolId,
    params.parsed.classId,
    params.parsed.subjectId,
  )

  if (!teacherId) {
    return { error: 'Aucun professeur assigné à cette classe et matière.' }
  }

  const submissionResult = await getOrCreatePendingSubmission({
    schoolId: params.access.schoolId,
    classId: params.parsed.classId,
    subjectId: params.parsed.subjectId,
    term: params.parsed.term,
    submittedBy: params.access.user.id,
    teacherId,
    secretaryNote: params.parsed.reason,
  })

  if ('error' in submissionResult) return submissionResult

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any

  const { error: itemError } = await db
    .from('grade_sheet_submission_items')
    .upsert(
      {
        submission_id: submissionResult.id,
        student_id: params.parsed.studentId,
        slot: params.parsed.slot,
        proposed_value: params.parsed.value,
        previous_value: params.oldValue,
      },
      { onConflict: 'submission_id,student_id,slot' },
    )

  if (itemError) return { error: itemError.message as string }

  if (submissionResult.isNew) {
    await dispatchNotification({
      userId: teacherId,
      schoolId: params.access.schoolId,
      title: 'Validation de notes requise',
      body: `${params.sheet.className} · ${params.sheet.subjectName} · ${params.parsed.term} — le secrétariat a saisi des notes. Prévisualisez et validez.`,
      type: 'grade',
      actionPath: `/dashboard/grades/entry?submission=${submissionResult.id}`,
      sendEmail: false,
    })
  } else {
    await dispatchNotification({
      userId: teacherId,
      schoolId: params.access.schoolId,
      title: 'Mise à jour des notes à valider',
      body: `${params.sheet.className} · ${params.sheet.subjectName} — ${params.row.lastName} ${params.row.firstName} · ${SLOT_LABELS[params.parsed.slot]} : ${params.oldValue ?? '—'} → ${params.parsed.value ?? '—'}`,
      type: 'grade',
      actionPath: `/dashboard/grades/entry?submission=${submissionResult.id}`,
      sendEmail: false,
    })
  }

  revalidatePath('/dashboard/grades/entry')
  return { success: true as const, pending: true as const }
}

export async function loadGradeSheet(input: z.infer<typeof SheetQuerySchema>): Promise<
  { error: string } | { sheet: GradeSheetContext }
> {
  const access = await requireGradeEditor()
  if (!access.ok) return { error: access.error }

  const parsed = SheetQuerySchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const schoolYearId = await getActiveSchoolYearId(access.supabase, access.schoolId)
  if (!schoolYearId) return { error: 'Aucune année scolaire active.' }

  const evaluationIds = {} as Record<GradeSequenceSlot, string>
  let isLocked = false

  for (const slot of GRADE_SEQUENCE_SLOTS) {
    const evaluation = await ensureEvaluation(access.supabase, {
      schoolId: access.schoolId,
      schoolYearId,
      classId: parsed.data.classId,
      subjectId: parsed.data.subjectId,
      term: parsed.data.term,
      slot,
      userId: access.user.id,
    })

    if ('error' in evaluation) return { error: evaluation.error }
    evaluationIds[slot] = evaluation.id
    if (evaluation.is_locked) isLocked = true
  }

  const [{ data: classRow }, { data: subjectRow }, { data: enrollmentsRaw }] = await Promise.all([
    access.supabase.from('classes').select('name').eq('id', parsed.data.classId).maybeSingle(),
    access.supabase.from('subjects').select('name, coefficient').eq('id', parsed.data.subjectId).maybeSingle(),
    access.supabase
      .from('student_enrollments')
      .select('student_id')
      .eq('school_id', access.schoolId)
      .eq('class_id', parsed.data.classId)
      .eq('school_year_id', schoolYearId),
  ])

  const studentIds = ((enrollmentsRaw ?? []) as Array<{ student_id: string }>).map(row => row.student_id)

  const pendingSubmissionEarly = await fetchPendingSubmission(access.supabase, {
    schoolId: access.schoolId,
    classId: parsed.data.classId,
    subjectId: parsed.data.subjectId,
    term: parsed.data.term,
  })

  if (studentIds.length === 0) {
    const slotPublicationsEmpty = await fetchSlotPublications({
      schoolId: access.schoolId,
      classId: parsed.data.classId,
      subjectId: parsed.data.subjectId,
      term: parsed.data.term,
    })
    return {
      sheet: {
        classId: parsed.data.classId,
        className: (classRow as { name: string } | null)?.name ?? 'Classe',
        subjectId: parsed.data.subjectId,
        subjectName: (subjectRow as { name: string; coefficient: number } | null)?.name ?? 'Matière',
        subjectCoefficient: (subjectRow as { name: string; coefficient: number } | null)?.coefficient ?? 1,
        term: parsed.data.term,
        evaluationIds,
        slotPublications: slotPublicationsEmpty,
        rows: [],
        isLocked,
        pendingSubmission: pendingSubmissionEarly
          ? {
              id: pendingSubmissionEarly.id,
              status: pendingSubmissionEarly.status,
              rejectionReason: pendingSubmissionEarly.rejection_reason,
            }
          : null,
      },
    }
  }

  const { data: studentsRaw } = await access.supabase
    .from('students')
    .select('id, first_name, last_name, iun')
    .in('id', studentIds)
    .order('last_name')

  const evalIdList = Object.values(evaluationIds)
  const { data: gradesRaw } = await access.supabase
    .from('grades')
    .select('id, student_id, value, evaluation_id')
    .in('evaluation_id', evalIdList)

  const gradeByStudentSlot = new Map<GradeSequenceSlot, Map<string, { id: string; value: number }>>()
  for (const slot of GRADE_SEQUENCE_SLOTS) {
    gradeByStudentSlot.set(slot, new Map())
  }

  for (const grade of (gradesRaw ?? []) as Array<{
    id: string
    student_id: string
    value: number
    evaluation_id: string
  }>) {
    const slot = GRADE_SEQUENCE_SLOTS.find(s => evaluationIds[s] === grade.evaluation_id)
    if (!slot) continue
    gradeByStudentSlot.get(slot)?.set(grade.student_id, { id: grade.id, value: grade.value })
  }

  const rows: StudentGradeRow[] = ((studentsRaw ?? []) as Array<{
    id: string
    first_name: string
    last_name: string
    iun: string | null
  }>).map(student => {
    const gradeIds: Partial<Record<GradeSequenceSlot, string>> = {}
    const values: Partial<Record<GradeSequenceSlot, number | null>> = {}

    for (const slot of GRADE_SEQUENCE_SLOTS) {
      const cell = gradeByStudentSlot.get(slot)?.get(student.id)
      gradeIds[slot] = cell?.id
      values[slot] = cell?.value ?? null
    }

    return {
      studentId: student.id,
      firstName: student.first_name,
      lastName: student.last_name,
      iun: student.iun,
      devoir1: values.devoir1 ?? null,
      devoir2: values.devoir2 ?? null,
      examen: values.examen ?? null,
      officialDevoir1: values.devoir1 ?? null,
      officialDevoir2: values.devoir2 ?? null,
      officialExamen: values.examen ?? null,
      gradeIds,
    }
  })

  const pendingSubmission = pendingSubmissionEarly
  const slotPublications = await fetchSlotPublications({
    schoolId: access.schoolId,
    classId: parsed.data.classId,
    subjectId: parsed.data.subjectId,
    term: parsed.data.term,
  })

  const lastRejected =
    access.role === 'SECRETAIRE' && !pendingSubmission
      ? await fetchLastRejectedSubmission(access.supabase, {
          schoolId: access.schoolId,
          classId: parsed.data.classId,
          subjectId: parsed.data.subjectId,
          term: parsed.data.term,
        })
      : null

  let mergedRows = rows
  if (pendingSubmission && access.role === 'SECRETAIRE') {
    const items = await fetchSubmissionItems(pendingSubmission.id)
    const proposedByStudent = new Map<string, Partial<Record<GradeSequenceSlot, number | null>>>()

    for (const item of items) {
      if (!proposedByStudent.has(item.student_id)) {
        proposedByStudent.set(item.student_id, {})
      }
      proposedByStudent.get(item.student_id)![item.slot] = item.proposed_value
    }

    mergedRows = rows.map(row => {
      const proposed = proposedByStudent.get(row.studentId)
      if (!proposed) return row
      return {
        ...row,
        devoir1: proposed.devoir1 !== undefined ? proposed.devoir1 : row.devoir1,
        devoir2: proposed.devoir2 !== undefined ? proposed.devoir2 : row.devoir2,
        examen: proposed.examen !== undefined ? proposed.examen : row.examen,
      }
    })
  }

  return {
    sheet: {
      classId: parsed.data.classId,
      className: (classRow as { name: string } | null)?.name ?? 'Classe',
      subjectId: parsed.data.subjectId,
      subjectName: (subjectRow as { name: string; coefficient: number } | null)?.name ?? 'Matière',
      subjectCoefficient: (subjectRow as { name: string; coefficient: number } | null)?.coefficient ?? 1,
      term: parsed.data.term,
      evaluationIds,
      slotPublications,
      rows: mergedRows,
      isLocked,
      pendingSubmission: pendingSubmission
        ? {
            id: pendingSubmission.id,
            status: pendingSubmission.status,
            rejectionReason: pendingSubmission.rejection_reason,
          }
        : null,
      lastRejected: lastRejected
        ? {
            rejectionReason: lastRejected.rejection_reason,
            reviewedAt: lastRejected.reviewed_at,
          }
        : null,
    },
  }
}

export async function saveGradeSheetCell(input: z.infer<typeof SaveCellSchema>) {
  const access = await requireGradeEditor()
  if (!access.ok) return { error: access.error }

  const parsed = SaveCellSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const loaded = await loadGradeSheet({
    classId: parsed.data.classId,
    subjectId: parsed.data.subjectId,
    term: parsed.data.term,
  })

  if ('error' in loaded) return loaded
  const { sheet } = loaded
  if (sheet.isLocked) return { error: 'Cette feuille de notes est verrouillée.' }

  const evaluationId = sheet.evaluationIds[parsed.data.slot]
  const row = sheet.rows.find(r => r.studentId === parsed.data.studentId)
  if (!row) return { error: 'Élève introuvable.' }

  const existingGradeId =
    row.gradeIds[parsed.data.slot]
    ?? (await findGradeIdByEvaluationStudent(access.supabase, evaluationId, parsed.data.studentId))
  const oldValue =
    parsed.data.slot === 'devoir1'
      ? (row.officialDevoir1 ?? row.devoir1)
      : parsed.data.slot === 'devoir2'
        ? (row.officialDevoir2 ?? row.devoir2)
        : (row.officialExamen ?? row.examen)

  if (parsed.data.value === null) {
    if (access.role === 'SECRETAIRE') {
      if (existingGradeId && !parsed.data.reason?.trim()) {
        return { error: 'Indiquez un motif pour effacer une note existante.' }
      }
      return saveSecretaryProposedGrade({
        access,
        sheet,
        parsed: parsed.data,
        row,
        oldValue,
      })
    }

    if (existingGradeId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (access.supabase as any)
        .from('grades')
        .delete()
        .eq('id', existingGradeId)
      if (error) return { error: error.message }
    }
    revalidatePath('/dashboard/grades/entry')
    return { success: true as const }
  }

  if (access.role === 'SECRETAIRE') {
    if (existingGradeId && oldValue !== parsed.data.value && !parsed.data.reason?.trim()) {
      return { error: 'Indiquez un motif pour modifier une note existante.' }
    }
    return saveSecretaryProposedGrade({
      access,
      sheet,
      parsed: parsed.data,
      row,
      oldValue,
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = access.supabase as any

  const result = await upsertGradeByEvaluationStudent(db, {
    schoolId: access.schoolId,
    evaluationId,
    studentId: parsed.data.studentId,
    value: parsed.data.value,
    term: parsed.data.term,
    userId: access.user.id,
  })

  if ('error' in result) return { error: result.error }

  revalidatePath('/dashboard/grades/entry')
  return { success: true as const }
}

export async function getRecentSecretaryGradeAlerts(limit = 8) {
  const access = await requireGradeEditor()
  if (!access.ok) return []

  if (access.role === 'PROFESSEUR') {
    try {
      const admin = createAdminClient()

      const { data: assignments } = await admin
        .from('teacher_assignments')
        .select('class_id, subject_id')
        .eq('school_id', access.schoolId)
        .eq('teacher_id', access.user.id)
        .eq('is_active', true)

      const assignmentKeys = new Set(
        ((assignments ?? []) as Array<{ class_id: string; subject_id: string }>).map(
          row => `${row.class_id}:${row.subject_id}`,
        ),
      )

      if (assignmentKeys.size === 0) return []

      const { data } = await admin
        .from('grade_history')
        .select(`
          id,
          old_value,
          new_value,
          created_at,
          reason,
          profiles:changed_by(full_name),
          students:student_id(first_name, last_name),
          evaluations:evaluation_id(title, class_id, subject_id, subjects(name))
        `)
        .eq('school_id', access.schoolId)
        .eq('source', 'secretary')
        .order('created_at', { ascending: false })
        .limit(limit * 3)

      const filtered = ((data ?? []) as Array<{
        id: string
        old_value: number | null
        new_value: number | null
        created_at: string
        reason: string | null
        profiles: { full_name: string | null } | null
        students: { first_name: string; last_name: string } | null
        evaluations: {
          title: string
          class_id: string
          subject_id: string
          subjects: { name: string } | null
        } | null
      }>).filter(alert => {
        const evaluation = alert.evaluations
        if (!evaluation) return false
        return assignmentKeys.has(`${evaluation.class_id}:${evaluation.subject_id}`)
      })

      return filtered.slice(0, limit)
    } catch {
      return []
    }
  }

  return []
}
