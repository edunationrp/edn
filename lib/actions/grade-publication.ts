'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { dispatchNotification } from '@/lib/notifications/dispatch'
import { notifyStudent } from '@/lib/notifications/notify-students'
import {
  GRADE_SEQUENCE_SLOTS,
  SLOT_LABELS,
  type GradeSequenceSlot,
  type GradeSlotPublication,
  type GradeSlotPublicationStatus,
} from '@/lib/grades/sheet-types'

const SlotActionSchema = z.object({
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  term: z.enum(['T1', 'T2', 'T3']),
  slot: z.enum(['devoir1', 'devoir2', 'examen']),
  teacherNote: z.string().max(500).optional(),
})

export async function fetchSlotPublications(params: {
  schoolId: string
  classId: string
  subjectId: string
  term: string
}): Promise<Partial<Record<GradeSequenceSlot, GradeSlotPublication>>> {
  try {
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (admin as any)
      .from('grade_slot_publications')
      .select('slot, status, submitted_at, published_at, teacher_note')
      .eq('school_id', params.schoolId)
      .eq('class_id', params.classId)
      .eq('subject_id', params.subjectId)
      .eq('term', params.term)

    const result: Partial<Record<GradeSequenceSlot, GradeSlotPublication>> = {}
    for (const row of (data ?? []) as Array<{
      slot: GradeSequenceSlot
      status: GradeSlotPublicationStatus
      submitted_at: string | null
      published_at: string | null
      teacher_note: string | null
    }>) {
      result[row.slot] = {
        status: row.status,
        submittedAt: row.submitted_at,
        publishedAt: row.published_at,
        teacherNote: row.teacher_note,
      }
    }
    return result
  } catch {
    return {}
  }
}

async function slotHasGrades(
  schoolId: string,
  evaluationId: string,
): Promise<boolean> {
  const admin = createAdminClient()
  const { count } = await admin
    .from('grades')
    .select('id', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .eq('evaluation_id', evaluationId)

  return (count ?? 0) > 0
}

async function notifyFamiliesOfPublishedSlot(params: {
  schoolId: string
  classId: string
  subjectName: string
  term: string
  slot: GradeSequenceSlot
}) {
  const admin = createAdminClient()
  const slotLabel = SLOT_LABELS[params.slot]
  const termLabel = params.term === 'T1' ? 'Trimestre 1' : params.term === 'T2' ? 'Trimestre 2' : 'Trimestre 3'

  const { data: enrollmentsRaw } = await admin
    .from('student_enrollments')
    .select('student_id, students(user_id, first_name, last_name)')
    .eq('school_id', params.schoolId)
    .eq('class_id', params.classId)

  const studentIds = new Set<string>()
  for (const row of (enrollmentsRaw ?? []) as Array<{
    student_id: string
    students: { user_id: string | null; first_name: string; last_name: string } | null
  }>) {
    studentIds.add(row.student_id)
    if (row.students?.user_id) {
      await notifyStudent({
        userId: row.students.user_id,
        schoolId: params.schoolId,
        title: 'Nouvelle note disponible',
        body: `${params.subjectName} · ${slotLabel} · ${termLabel} — consultez vos notes.`,
        type: 'grade',
        actionPath: '/eleve/notes',
      })
    }
  }

  if (studentIds.size === 0) return

  const { data: relationsRaw } = await admin
    .from('parent_student_relations')
    .select('parent_user_id, student_id')
    .eq('school_id', params.schoolId)
    .in('student_id', Array.from(studentIds))

  const notifiedParents = new Set<string>()
  for (const rel of (relationsRaw ?? []) as Array<{ parent_user_id: string; student_id: string }>) {
    if (notifiedParents.has(rel.parent_user_id)) continue
    notifiedParents.add(rel.parent_user_id)
    await dispatchNotification({
      userId: rel.parent_user_id,
      schoolId: params.schoolId,
      title: 'Nouvelle note publiée',
      body: `${params.subjectName} · ${slotLabel} · ${termLabel} — la note est disponible dans l'espace parent.`,
      type: 'grade',
      actionPath: '/parent/notes',
      sendEmail: false,
    })
  }
}

export async function submitGradeSlotToSecretary(input: z.infer<typeof SlotActionSchema>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' }

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx || ctx.role_code !== 'PROFESSEUR') {
    return { error: 'Seul le professeur peut envoyer les notes à la secrétaire.' }
  }

  const parsed = SlotActionSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { data: evaluationRaw } = await supabase
    .from('evaluations')
    .select('id')
    .eq('school_id', ctx.school_id)
    .eq('class_id', parsed.data.classId)
    .eq('subject_id', parsed.data.subjectId)
    .eq('term', parsed.data.term)
    .eq('sequence_slot', parsed.data.slot)
    .maybeSingle()

  const evaluation = evaluationRaw as { id: string } | null
  if (!evaluation) {
    return { error: 'Aucune note enregistrée pour ce devoir. Enregistrez d\'abord la saisie.' }
  }

  const hasGrades = await slotHasGrades(ctx.school_id, evaluation.id)
  if (!hasGrades) {
    return { error: 'Aucune note enregistrée pour ce devoir. Enregistrez d\'abord la saisie.' }
  }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('grade_slot_publications')
    .upsert(
      {
        school_id: ctx.school_id,
        class_id: parsed.data.classId,
        subject_id: parsed.data.subjectId,
        term: parsed.data.term,
        slot: parsed.data.slot,
        status: 'submitted',
        submitted_by: user.id,
        submitted_at: new Date().toISOString(),
        teacher_note: parsed.data.teacherNote?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'school_id,class_id,subject_id,term,slot' },
    )

  if (error) return { error: error.message as string }

  revalidatePath('/dashboard/grades/entry')
  return { success: true as const }
}

export async function publishGradeSlotToFamilies(input: z.infer<typeof SlotActionSchema>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' }

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx || !['SECRETAIRE', 'PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT', 'CENSEUR'].includes(ctx.role_code)) {
    return { error: 'Seul le secrétariat peut publier les notes aux familles.' }
  }

  const parsed = SlotActionSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin as any)
    .from('grade_slot_publications')
    .select('status')
    .eq('school_id', ctx.school_id)
    .eq('class_id', parsed.data.classId)
    .eq('subject_id', parsed.data.subjectId)
    .eq('term', parsed.data.term)
    .eq('slot', parsed.data.slot)
    .maybeSingle()

  if (!existing || (existing as { status: string }).status !== 'submitted') {
    return { error: 'Ce devoir n\'a pas été envoyé par le professeur ou est déjà publié.' }
  }

  const { data: subjectRaw } = await supabase
    .from('subjects')
    .select('name')
    .eq('id', parsed.data.subjectId)
    .maybeSingle()

  const subjectName = (subjectRaw as { name: string } | null)?.name ?? 'Matière'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('grade_slot_publications')
    .update({
      status: 'published',
      published_by: user.id,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('school_id', ctx.school_id)
    .eq('class_id', parsed.data.classId)
    .eq('subject_id', parsed.data.subjectId)
    .eq('term', parsed.data.term)
    .eq('slot', parsed.data.slot)

  if (error) return { error: error.message as string }

  await notifyFamiliesOfPublishedSlot({
    schoolId: ctx.school_id,
    classId: parsed.data.classId,
    subjectName,
    term: parsed.data.term,
    slot: parsed.data.slot,
  })

  revalidatePath('/dashboard/grades/entry')
  revalidatePath('/parent/notes')
  revalidatePath('/eleve/notes')
  return { success: true as const }
}

export async function getPendingGradePublicationsForSecretary() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx || ctx.role_code !== 'SECRETAIRE') return []

  try {
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (admin as any)
      .from('grade_slot_publications')
      .select(`
        id, class_id, subject_id, term, slot, submitted_at, teacher_note,
        classes(name),
        subjects(name)
      `)
      .eq('school_id', ctx.school_id)
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: false })

    return ((data ?? []) as Array<{
      id: string
      class_id: string
      subject_id: string
      term: string
      slot: GradeSequenceSlot
      submitted_at: string | null
      teacher_note: string | null
      classes: { name: string } | null
      subjects: { name: string } | null
    }>).map(row => ({
      id: row.id,
      classId: row.class_id,
      subjectId: row.subject_id,
      term: row.term,
      slot: row.slot,
      submittedAt: row.submitted_at,
      teacherNote: row.teacher_note,
      className: row.classes?.name ?? 'Classe',
      subjectName: row.subjects?.name ?? 'Matière',
    }))
  } catch {
    return []
  }
}
