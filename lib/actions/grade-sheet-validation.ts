'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import type { UserRole } from '@/types/roles'
import { dispatchNotification } from '@/lib/notifications/dispatch'
import {
  GRADE_SEQUENCE_SLOTS,
  SLOT_LABELS,
  type GradeSequenceSlot,
  type GradeSubmissionPreview,
  type GradeSheetContext,
} from '@/lib/grades/sheet-types'
import {
  findGradeIdByEvaluationStudent,
  upsertGradeByEvaluationStudent,
} from '@/lib/grades/persist-grade'
import { fetchSlotPublications } from '@/lib/actions/grade-publication'

const ValidateSchema = z.object({
  submissionId: z.string().uuid(),
  items: z.array(
    z.object({
      studentId: z.string().uuid(),
      slot: z.enum(['devoir1', 'devoir2', 'examen']),
      value: z.number().min(0).max(20).nullable(),
    }),
  ),
})

const RejectSchema = z.object({
  submissionId: z.string().uuid(),
  reason: z.string().min(3, 'Indiquez un motif (3 caractères minimum).'),
})

async function requireTeacher() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: 'Session expirée.' }

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) return { ok: false as const, error: 'Aucun établissement associé.' }

  const role = ctx.role_code as UserRole
  if (role !== 'PROFESSEUR') {
    return { ok: false as const, error: 'Réservé aux professeurs.' }
  }

  return { ok: true as const, supabase, user, schoolId: ctx.school_id, role }
}

async function loadSheetContextForSubmission(
  admin: ReturnType<typeof createAdminClient>,
  submission: {
    school_id: string
    class_id: string
    subject_id: string
    term: string
  },
): Promise<{ error: string } | { sheet: GradeSheetContext }> {
  const { data: classRow } = await admin
    .from('classes')
    .select('name')
    .eq('id', submission.class_id)
    .maybeSingle()

  const { data: subjectRow } = await admin
    .from('subjects')
    .select('name, coefficient')
    .eq('id', submission.subject_id)
    .maybeSingle()

  const { data: yearRow } = await admin
    .from('school_years')
    .select('id')
    .eq('school_id', submission.school_id)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  const schoolYearId = (yearRow as { id: string } | null)?.id
  if (!schoolYearId) return { error: 'Aucune année scolaire active.' }

  const evaluationIds = {} as Record<GradeSequenceSlot, string>
  let isLocked = false

  for (const slot of GRADE_SEQUENCE_SLOTS) {
    const { data: evaluation } = await admin
      .from('evaluations')
      .select('id, is_locked')
      .eq('school_id', submission.school_id)
      .eq('class_id', submission.class_id)
      .eq('subject_id', submission.subject_id)
      .eq('term', submission.term)
      .eq('sequence_slot', slot)
      .maybeSingle()

    if (!evaluation) return { error: `Évaluation ${SLOT_LABELS[slot]} introuvable.` }
    evaluationIds[slot] = (evaluation as { id: string }).id
    if ((evaluation as { is_locked: boolean }).is_locked) isLocked = true
  }

  const { data: enrollmentsRaw } = await admin
    .from('student_enrollments')
    .select('student_id')
    .eq('school_id', submission.school_id)
    .eq('class_id', submission.class_id)
    .eq('school_year_id', schoolYearId)

  const studentIds = ((enrollmentsRaw ?? []) as Array<{ student_id: string }>).map(r => r.student_id)

  const { data: studentsRaw } = studentIds.length
    ? await admin
        .from('students')
        .select('id, first_name, last_name, iun')
        .in('id', studentIds)
        .order('last_name')
    : { data: [] }

  const evalIdList = Object.values(evaluationIds)
  const { data: gradesRaw } = evalIdList.length
    ? await admin
        .from('grades')
        .select('id, student_id, value, evaluation_id')
        .in('evaluation_id', evalIdList)
    : { data: [] }

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

  const rows = ((studentsRaw ?? []) as Array<{
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
      gradeIds,
    }
  })

  const slotPublications = await fetchSlotPublications({
    schoolId: submission.school_id,
    classId: submission.class_id,
    subjectId: submission.subject_id,
    term: submission.term,
  })

  return {
    sheet: {
      classId: submission.class_id,
      className: (classRow as { name: string } | null)?.name ?? 'Classe',
      subjectId: submission.subject_id,
      subjectName: (subjectRow as { name: string; coefficient: number } | null)?.name ?? 'Matière',
      subjectCoefficient: (subjectRow as { name: string; coefficient: number } | null)?.coefficient ?? 1,
      term: submission.term,
      evaluationIds,
      slotPublications,
      rows,
      isLocked,
    },
  }
}

async function applyOfficialGrade(
  admin: ReturnType<typeof createAdminClient>,
  params: {
    schoolId: string
    userId: string
    sheet: GradeSheetContext
    studentId: string
    slot: GradeSequenceSlot
    value: number | null
    term: string
  },
) {
  const row = params.sheet.rows.find(r => r.studentId === params.studentId)
  if (!row) return { error: 'Élève introuvable.' }

  const evaluationId = params.sheet.evaluationIds[params.slot]
  const existingGradeId =
    row.gradeIds[params.slot]
    ?? (await findGradeIdByEvaluationStudent(admin, evaluationId, params.studentId))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any

  if (params.value === null) {
    if (existingGradeId) {
      const { error } = await db.from('grades').delete().eq('id', existingGradeId)
      if (error) return { error: error.message as string }
    }
    return { success: true as const }
  }

  const result = await upsertGradeByEvaluationStudent(db, {
    schoolId: params.schoolId,
    evaluationId,
    studentId: params.studentId,
    value: params.value,
    term: params.term,
    userId: params.userId,
  })

  if ('error' in result) return { error: result.error }

  return { success: true as const }
}

export async function getPendingGradeSubmissionsForTeacher() {
  const access = await requireTeacher()
  if (!access.ok) return []

  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('grade_sheet_submissions')
      .select(`
        id,
        class_id,
        subject_id,
        term,
        created_at,
        secretary_note,
        classes(name),
        subjects(name),
        profiles:submitted_by(full_name)
      `)
      .eq('school_id', access.schoolId)
      .eq('teacher_id', access.user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    return ((data ?? []) as Array<{
      id: string
      class_id: string
      subject_id: string
      term: string
      created_at: string
      secretary_note: string | null
      classes: { name: string } | null
      subjects: { name: string } | null
      profiles: { full_name: string | null } | null
    }>).map(row => ({
      id: row.id,
      classId: row.class_id,
      subjectId: row.subject_id,
      term: row.term,
      className: row.classes?.name ?? 'Classe',
      subjectName: row.subjects?.name ?? 'Matière',
      submittedAt: row.created_at,
      submitterName: row.profiles?.full_name ?? null,
      secretaryNote: row.secretary_note,
    }))
  } catch {
    return []
  }
}

export async function loadGradeSubmissionPreview(
  submissionId: string,
): Promise<{ error: string } | { preview: GradeSubmissionPreview }> {
  const access = await requireTeacher()
  if (!access.ok) return { error: access.error }

  try {
    const admin = createAdminClient()
    const { data: submissionRaw } = await admin
      .from('grade_sheet_submissions')
      .select(`
        id,
        school_id,
        class_id,
        subject_id,
        term,
        created_at,
        secretary_note,
        teacher_id,
        classes(name),
        subjects(name),
        profiles:submitted_by(full_name)
      `)
      .eq('id', submissionId)
      .eq('status', 'pending')
      .maybeSingle()

    const submission = submissionRaw as {
      id: string
      school_id: string
      class_id: string
      subject_id: string
      term: string
      created_at: string
      secretary_note: string | null
      teacher_id: string | null
      classes: { name: string } | null
      subjects: { name: string } | null
      profiles: { full_name: string | null } | null
    } | null

    if (!submission) return { error: 'Demande introuvable ou déjà traitée.' }
    if (submission.teacher_id !== access.user.id) {
      return { error: 'Cette demande ne vous est pas destinée.' }
    }

    const sheetResult = await loadSheetContextForSubmission(admin, submission)
    if ('error' in sheetResult) return sheetResult

    const { data: itemsRaw } = await admin
      .from('grade_sheet_submission_items')
      .select('student_id, slot, proposed_value, previous_value')
      .eq('submission_id', submissionId)

    const itemsByStudent = new Map<
      string,
      Partial<Record<GradeSequenceSlot, { proposed: number | null; previous: number | null }>>
    >()

    for (const item of (itemsRaw ?? []) as Array<{
      student_id: string
      slot: GradeSequenceSlot
      proposed_value: number | null
      previous_value: number | null
    }>) {
      if (!itemsByStudent.has(item.student_id)) {
        itemsByStudent.set(item.student_id, {})
      }
      itemsByStudent.get(item.student_id)![item.slot] = {
        proposed: item.proposed_value,
        previous: item.previous_value,
      }
    }

    const rows = sheetResult.sheet.rows.map(row => {
      const proposed = itemsByStudent.get(row.studentId)
      const hasProposal: Partial<Record<GradeSequenceSlot, boolean>> = {}
      for (const slot of GRADE_SEQUENCE_SLOTS) {
        hasProposal[slot] = proposed?.[slot] !== undefined
      }
      return {
        ...row,
        devoir1: proposed?.devoir1?.proposed ?? row.devoir1,
        devoir2: proposed?.devoir2?.proposed ?? row.devoir2,
        examen: proposed?.examen?.proposed ?? row.examen,
        previousDevoir1: proposed?.devoir1?.previous ?? row.devoir1,
        previousDevoir2: proposed?.devoir2?.previous ?? row.devoir2,
        previousExamen: proposed?.examen?.previous ?? row.examen,
        hasProposal,
      }
    })

    return {
      preview: {
        id: submission.id,
        classId: submission.class_id,
        className: submission.classes?.name ?? 'Classe',
        subjectId: submission.subject_id,
        subjectName: submission.subjects?.name ?? 'Matière',
        term: submission.term,
        submittedAt: submission.created_at,
        submitterName: submission.profiles?.full_name ?? null,
        secretaryNote: submission.secretary_note,
        rows,
      },
    }
  } catch {
    return { error: 'Impossible de charger la prévisualisation.' }
  }
}

export async function validateGradeSubmission(input: z.infer<typeof ValidateSchema>) {
  const access = await requireTeacher()
  if (!access.ok) return { error: access.error }

  const parsed = ValidateSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  try {
    const admin = createAdminClient()
    const { data: submissionRaw } = await admin
      .from('grade_sheet_submissions')
      .select('id, school_id, class_id, subject_id, term, status, teacher_id, submitted_by')
      .eq('id', parsed.data.submissionId)
      .maybeSingle()

    const submission = submissionRaw as {
      id: string
      school_id: string
      class_id: string
      subject_id: string
      term: string
      status: string
      teacher_id: string | null
      submitted_by: string
    } | null

    if (!submission || submission.status !== 'pending') {
      return { error: 'Demande introuvable ou déjà traitée.' }
    }
    if (submission.teacher_id !== access.user.id) {
      return { error: 'Cette demande ne vous est pas destinée.' }
    }

    const sheetResult = await loadSheetContextForSubmission(admin, submission)
    if ('error' in sheetResult) return sheetResult

    if (sheetResult.sheet.isLocked) {
      return { error: 'Cette feuille de notes est verrouillée.' }
    }

    for (const item of parsed.data.items) {
      const result = await applyOfficialGrade(admin, {
        schoolId: submission.school_id,
        userId: access.user.id,
        sheet: sheetResult.sheet,
        studentId: item.studentId,
        slot: item.slot,
        value: item.value,
        term: submission.term,
      })
      if ('error' in result) return result
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from('grade_sheet_submissions')
      .update({
        status: 'validated',
        reviewed_by: access.user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', submission.id)

    await dispatchNotification({
      userId: submission.submitted_by,
      schoolId: submission.school_id,
      title: 'Notes validées par le professeur',
      body: `${sheetResult.sheet.className} · ${sheetResult.sheet.subjectName} · ${submission.term} — vos saisies ont été validées et publiées.`,
      type: 'grade',
      actionPath: '/dashboard/grades/entry',
      sendEmail: false,
    })

    revalidatePath('/dashboard/grades/entry')
    return { success: true as const }
  } catch {
    return { error: 'Échec de la validation.' }
  }
}

export async function rejectGradeSubmission(input: z.infer<typeof RejectSchema>) {
  const access = await requireTeacher()
  if (!access.ok) return { error: access.error }

  const parsed = RejectSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  try {
    const admin = createAdminClient()
    const { data: submissionRaw } = await admin
      .from('grade_sheet_submissions')
      .select(`
        id,
        school_id,
        term,
        status,
        teacher_id,
        submitted_by,
        classes(name),
        subjects(name)
      `)
      .eq('id', parsed.data.submissionId)
      .maybeSingle()

    const submission = submissionRaw as {
      id: string
      school_id: string
      status: string
      teacher_id: string | null
      submitted_by: string
      term: string
      classes: { name: string } | null
      subjects: { name: string } | null
    } | null

    if (!submission || submission.status !== 'pending') {
      return { error: 'Demande introuvable ou déjà traitée.' }
    }
    if (submission.teacher_id !== access.user.id) {
      return { error: 'Cette demande ne vous est pas destinée.' }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from('grade_sheet_submissions')
      .update({
        status: 'rejected',
        rejection_reason: parsed.data.reason,
        reviewed_by: access.user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', submission.id)

    await dispatchNotification({
      userId: submission.submitted_by,
      schoolId: submission.school_id,
      title: 'Notes refusées — correction requise',
      body: `${submission.classes?.name ?? 'Classe'} · ${submission.subjects?.name ?? 'Matière'} · ${submission.term} — Motif : ${parsed.data.reason}`,
      type: 'grade',
      actionPath: '/dashboard/grades/entry',
      sendEmail: false,
    })

    revalidatePath('/dashboard/grades/entry')
    return { success: true as const }
  } catch {
    return { error: 'Échec du refus.' }
  }
}
