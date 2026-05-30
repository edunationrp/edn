'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { hasPermission } from '@/types/permissions'
import type { UserRole } from '@/types/roles'
import { notifyStudent } from '@/lib/notifications/notify-students'
import { dispatchNotification } from '@/lib/notifications/dispatch'
import {
  canProviseurValidate,
  canSecretaryPublish,
  resolveReportCardStatus,
  type ReportCardWorkflowStatus,
} from '@/lib/report-cards/workflow'

type ReportCardRow = {
  id: string
  school_id: string
  student_id: string
  term: string | null
  period: string | null
  status: string | null
  is_published: boolean | null
  correction_note: string | null
  students: { user_id: string | null; first_name: string; last_name: string } | null
  terms: { name: string } | null
}

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' as const }

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx) return { error: 'Accès refusé.' as const }

  return { supabase, user, ctx, role: ctx.role_code as UserRole }
}

async function fetchReportCard(reportCardId: string, schoolId: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('report_cards')
    .select(`
      id, school_id, student_id, term, period, status, is_published, correction_note,
      students(user_id, first_name, last_name),
      terms(name)
    `)
    .eq('id', reportCardId)
    .eq('school_id', schoolId)
    .maybeSingle()

  return data as ReportCardRow | null
}

async function notifyParentsOfReportCard(params: {
  schoolId: string
  studentId: string
  periodLabel: string
  reportCardId: string
}) {
  let admin
  try {
    admin = createAdminClient()
  } catch {
    return
  }

  const { data: relationsRaw } = await admin
    .from('parent_student_relations')
    .select('parent_user_id')
    .eq('school_id', params.schoolId)
    .eq('student_id', params.studentId)

  for (const rel of (relationsRaw ?? []) as Array<{ parent_user_id: string }>) {
    await dispatchNotification({
      userId: rel.parent_user_id,
      schoolId: params.schoolId,
      title: 'Bulletin disponible',
      body: `Le bulletin (${params.periodLabel}) de votre enfant est disponible en PDF.`,
      type: 'report_card',
      actionPath: `/parent/bulletins/${params.reportCardId}`,
      sendEmail: false,
    })
  }
}

async function notifySecretaryReportCardValidated(params: {
  schoolId: string
  studentName: string
  periodLabel: string
  reportCardId: string
}) {
  let admin
  try {
    admin = createAdminClient()
  } catch {
    return
  }

  const { data: staffRaw } = await admin
    .from('user_school_roles')
    .select('user_id')
    .eq('school_id', params.schoolId)
    .eq('role_code', 'SECRETAIRE')
    .eq('is_active', true)

  for (const row of (staffRaw ?? []) as Array<{ user_id: string }>) {
    await dispatchNotification({
      userId: row.user_id,
      schoolId: params.schoolId,
      title: 'Bulletin validé',
      body: `${params.studentName} · ${params.periodLabel} — vous pouvez le publier aux familles.`,
      type: 'report_card',
      actionPath: `/dashboard/report-cards/${params.reportCardId}`,
      sendEmail: false,
    })
  }
}

async function notifyProviseurBulletinsGenerated(params: {
  schoolId: string
  count: number
  className?: string
  termLabel?: string
}) {
  let admin
  try {
    admin = createAdminClient()
  } catch {
    return
  }

  const { data: staffRaw } = await admin
    .from('user_school_roles')
    .select('user_id')
    .eq('school_id', params.schoolId)
    .in('role_code', ['PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT'])
    .eq('is_active', true)

  const label = [params.className, params.termLabel].filter(Boolean).join(' · ')
  for (const row of (staffRaw ?? []) as Array<{ user_id: string }>) {
    await dispatchNotification({
      userId: row.user_id,
      schoolId: params.schoolId,
      title: 'Bulletins à valider',
      body: `${params.count} bulletin(s)${label ? ` (${label})` : ''} attendent votre validation.`,
      type: 'report_card',
      actionPath: '/dashboard/report-cards',
      sendEmail: false,
    })
  }
}

export async function notifyProviseurAfterReportCardsGenerated(input: {
  schoolId: string
  count: number
  classId: string
  termId: string
}) {
  let admin
  try {
    admin = createAdminClient()
  } catch {
    return
  }

  const [{ data: classRow }, { data: termRow }] = await Promise.all([
    admin.from('classes').select('name').eq('id', input.classId).maybeSingle(),
    admin.from('terms').select('name').eq('id', input.termId).maybeSingle(),
  ])

  await notifyProviseurBulletinsGenerated({
    schoolId: input.schoolId,
    count: input.count,
    className: (classRow as { name: string } | null)?.name,
    termLabel: (termRow as { name: string } | null)?.name,
  })
}

const CorrectionSchema = z.object({
  reportCardId: z.string().uuid(),
  note: z.string().trim().min(3, 'Indiquez le motif de correction.'),
})

export async function validateReportCard(reportCardId: string) {
  const access = await requireAuth()
  if ('error' in access) return access

  if (!hasPermission(access.role, 'report_cards:validate')) {
    return { error: 'Seul le proviseur peut valider les bulletins.' }
  }

  const card = await fetchReportCard(reportCardId, access.ctx.school_id)
  if (!card) return { error: 'Bulletin introuvable.' }

  const status = resolveReportCardStatus(card.status, card.is_published)
  if (!canProviseurValidate(status)) {
    return { error: 'Ce bulletin ne peut pas être validé dans son état actuel.' }
  }

  let admin
  try {
    admin = createAdminClient()
  } catch {
    return { error: 'Configuration serveur incomplète.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('report_cards')
    .update({
      status: 'validated',
      validated_by: access.user.id,
      validated_at: new Date().toISOString(),
      correction_note: null,
      correction_requested_at: null,
      correction_requested_by: null,
      is_published: false,
    })
    .eq('id', reportCardId)

  if (error) return { error: error.message as string }

  const studentName = card.students
    ? `${card.students.last_name} ${card.students.first_name}`
    : 'Élève'
  const periodLabel = card.period ?? card.terms?.name ?? card.term ?? 'Bulletin'

  await notifySecretaryReportCardValidated({
    schoolId: access.ctx.school_id,
    studentName,
    periodLabel,
    reportCardId,
  })

  revalidateReportCardPaths(reportCardId)
  return { success: true as const }
}

export async function requestReportCardCorrection(input: z.infer<typeof CorrectionSchema>) {
  const access = await requireAuth()
  if ('error' in access) return access

  if (!hasPermission(access.role, 'report_cards:validate')) {
    return { error: 'Seul le proviseur peut demander une correction.' }
  }

  const parsed = CorrectionSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const card = await fetchReportCard(parsed.data.reportCardId, access.ctx.school_id)
  if (!card) return { error: 'Bulletin introuvable.' }

  const status = resolveReportCardStatus(card.status, card.is_published)
  if (!canProviseurValidate(status) && status !== 'validated') {
    return { error: 'Ce bulletin ne peut pas faire l\'objet d\'une demande de correction.' }
  }

  let admin
  try {
    admin = createAdminClient()
  } catch {
    return { error: 'Configuration serveur incomplète.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('report_cards')
    .update({
      status: 'correction_requested',
      correction_note: parsed.data.note,
      correction_requested_at: new Date().toISOString(),
      correction_requested_by: access.user.id,
      is_published: false,
    })
    .eq('id', parsed.data.reportCardId)

  if (error) return { error: error.message as string }

  const studentName = card.students
    ? `${card.students.last_name} ${card.students.first_name}`
    : 'Élève'

  await notifySecretaryReportCardValidated({
    schoolId: access.ctx.school_id,
    studentName: `${studentName} (correction)`,
    periodLabel: card.period ?? card.terms?.name ?? card.term ?? 'Bulletin',
    reportCardId: parsed.data.reportCardId,
  })

  revalidateReportCardPaths(parsed.data.reportCardId)
  return { success: true as const }
}

export async function publishReportCard(reportCardId: string) {
  const access = await requireAuth()
  if ('error' in access) return access

  if (!hasPermission(access.role, 'report_cards:publish')) {
    return { error: 'Vous n\'avez pas la permission de publier ce bulletin.' }
  }

  const card = await fetchReportCard(reportCardId, access.ctx.school_id)
  if (!card) return { error: 'Bulletin introuvable.' }

  const status = resolveReportCardStatus(card.status, card.is_published)
  if (!canSecretaryPublish(status)) {
    return { error: 'Ce bulletin doit d\'abord être validé par le proviseur.' }
  }

  let admin
  try {
    admin = createAdminClient()
  } catch {
    return { error: 'Configuration serveur incomplète.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('report_cards')
    .update({
      status: 'published',
      is_published: true,
    })
    .eq('id', reportCardId)

  if (error) return { error: error.message as string }

  const studentUserId = card.students?.user_id
  const periodLabel = card.period ?? card.terms?.name ?? card.term ?? 'Bulletin'

  if (studentUserId) {
    await notifyStudent({
      userId: studentUserId,
      schoolId: card.school_id,
      title: 'Bulletin disponible',
      body: `Votre bulletin (${periodLabel}) est disponible en PDF.`,
      type: 'report_card',
      actionPath: `/eleve/bulletins/${reportCardId}`,
    })
  }

  await notifyParentsOfReportCard({
    schoolId: card.school_id,
    studentId: card.student_id,
    periodLabel,
    reportCardId,
  })

  revalidateReportCardPaths(reportCardId)
  return { success: true as const }
}

function revalidateReportCardPaths(reportCardId: string) {
  revalidatePath('/dashboard/report-cards')
  revalidatePath(`/dashboard/report-cards/${reportCardId}`)
  revalidatePath('/parent/bulletins')
  revalidatePath('/eleve/bulletins')
  revalidatePath('/eleve')
}

export type ReportCardQueueItem = {
  id: string
  studentName: string
  term: string
  status: ReportCardWorkflowStatus
  correctionNote: string | null
  average: number | null
  submittedAt: string | null
}

export async function getReportCardsForValidationQueue(): Promise<ReportCardQueueItem[]> {
  const access = await requireAuth()
  if ('error' in access) return []
  if (!hasPermission(access.role, 'report_cards:validate')) return []

  try {
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (admin as any)
      .from('report_cards')
      .select(`
        id, term, period, status, is_published, correction_note, average, generated_at,
        students(first_name, last_name)
      `)
      .eq('school_id', access.ctx.school_id)
      .in('status', ['generated', 'correction_requested'])
      .order('generated_at', { ascending: false })
      .limit(30)

    return ((data ?? []) as Array<{
      id: string
      term: string | null
      period: string | null
      status: string | null
      is_published: boolean | null
      correction_note: string | null
      average: number | null
      generated_at: string | null
      students: { first_name: string; last_name: string } | null
    }>).map(row => ({
      id: row.id,
      studentName: row.students
        ? `${row.students.last_name} ${row.students.first_name}`
        : 'Élève',
      term: row.period ?? row.term ?? '—',
      status: resolveReportCardStatus(row.status, row.is_published),
      correctionNote: row.correction_note,
      average: row.average,
      submittedAt: row.generated_at,
    }))
  } catch {
    return []
  }
}

export async function getReportCardsAwaitingPublication(): Promise<ReportCardQueueItem[]> {
  const access = await requireAuth()
  if ('error' in access) return []
  if (!hasPermission(access.role, 'report_cards:publish')) return []

  try {
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (admin as any)
      .from('report_cards')
      .select(`
        id, term, period, status, is_published, correction_note, average, validated_at,
        students(first_name, last_name)
      `)
      .eq('school_id', access.ctx.school_id)
      .eq('status', 'validated')
      .eq('is_published', false)
      .order('validated_at', { ascending: false })
      .limit(30)

    return ((data ?? []) as Array<{
      id: string
      term: string | null
      period: string | null
      status: string | null
      is_published: boolean | null
      correction_note: string | null
      average: number | null
      validated_at: string | null
      students: { first_name: string; last_name: string } | null
    }>).map(row => ({
      id: row.id,
      studentName: row.students
        ? `${row.students.last_name} ${row.students.first_name}`
        : 'Élève',
      term: row.period ?? row.term ?? '—',
      status: 'validated' as const,
      correctionNote: null,
      average: row.average,
      submittedAt: row.validated_at,
    }))
  } catch {
    return []
  }
}
