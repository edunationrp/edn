'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { dispatchNotification } from '@/lib/notifications/dispatch'

const SubmitJustificationSchema = z.object({
  attendanceRecordId: z.string().uuid(),
  reason: z.string().min(10, 'Expliquez la raison (10 caractères minimum)').max(1000),
})

export async function submitAbsenceJustification(formData: {
  attendanceRecordId: string
  reason: string
}) {
  const parsed = SubmitJustificationSchema.safeParse({
    attendanceRecordId: formData.attendanceRecordId,
    reason: formData.reason.trim(),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { data: recordRaw } = await supabase
    .from('attendance_records')
    .select('id, school_id, student_id, status, students(first_name, last_name)')
    .eq('id', parsed.data.attendanceRecordId)
    .maybeSingle()

  const record = recordRaw as {
    id: string
    school_id: string
    student_id: string
    status: string
    students: { first_name: string; last_name: string } | null
  } | null

  if (!record) return { error: 'Absence introuvable.' }
  if (!['absent', 'late'].includes(record.status)) {
    return { error: 'Seules les absences et retards peuvent être justifiés.' }
  }

  const { data: existing } = await supabase
    .from('attendance_justifications')
    .select('id, status')
    .eq('attendance_record_id', record.id)
    .maybeSingle()

  if (existing?.status === 'pending') {
    return { error: 'Une demande de justification est déjà en cours pour cette absence.' }
  }
  if (existing?.status === 'approved') {
    return { error: 'Cette absence a déjà été justifiée.' }
  }

  const { error: insertErr } = await (supabase as any)
    .from('attendance_justifications')
    .insert({
      school_id: record.school_id,
      attendance_record_id: record.id,
      parent_user_id: user.id,
      reason: parsed.data.reason,
      status: 'pending',
    })

  if (insertErr) {
    if (/unique|duplicate|pending_unique/i.test(insertErr.message)) {
      return { error: 'Une demande est déjà en cours pour cette absence.' }
    }
    return { error: insertErr.message }
  }

  const studentName = record.students
    ? `${record.students.first_name} ${record.students.last_name}`
    : 'votre enfant'

  const admin = createAdminClient()
  const { data: staffRolesRaw } = await admin
    .from('user_school_roles')
    .select('user_id')
    .eq('school_id', record.school_id)
    .eq('is_active', true)
    .in('role_code', ['SECRETAIRE', 'VIE_SCOLAIRE', 'PROVISEUR'])

  const staffIds = new Set(
    ((staffRolesRaw ?? []) as Array<{ user_id: string }>).map(row => row.user_id),
  )

  await Promise.all(
    [...staffIds].map(staffId =>
      dispatchNotification({
        userId: staffId,
        schoolId: record.school_id,
        title: 'Nouvelle justification d\'absence',
        body: `${studentName} — demande à examiner.`,
        type: 'attendance_justification',
        actionPath: '/dashboard/attendance/justifications',
        sendEmail: false,
      }),
    ),
  )

  revalidatePath('/parent/absences')
  revalidatePath('/parent')
  revalidatePath('/dashboard/attendance/justifications')

  return { success: true as const }
}

const ReviewJustificationSchema = z.object({
  justificationId: z.string().uuid(),
  decision: z.enum(['approved', 'rejected']),
})

export async function reviewAbsenceJustification(formData: {
  justificationId: string
  decision: 'approved' | 'rejected'
}) {
  const parsed = ReviewJustificationSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { data: justificationRaw } = await (supabase as any)
    .from('attendance_justifications')
    .select(`
      id,
      school_id,
      parent_user_id,
      status,
      attendance_records(student_id, students(first_name, last_name))
    `)
    .eq('id', parsed.data.justificationId)
    .maybeSingle()

  const justification = justificationRaw as {
    id: string
    school_id: string
    parent_user_id: string | null
    status: string
    attendance_records: {
      student_id: string
      students: { first_name: string; last_name: string } | null
    } | null
  } | null

  if (!justification) return { error: 'Demande introuvable.' }
  if (justification.status !== 'pending') return { error: 'Cette demande a déjà été traitée.' }

  const { error: updateErr } = await (supabase as any)
    .from('attendance_justifications')
    .update({
      status: parsed.data.decision,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.justificationId)

  if (updateErr) return { error: updateErr.message }

  if (justification.parent_user_id) {
    const studentName = justification.attendance_records?.students
      ? `${justification.attendance_records.students.first_name} ${justification.attendance_records.students.last_name}`
      : 'votre enfant'

    await dispatchNotification({
      userId: justification.parent_user_id,
      schoolId: justification.school_id,
      title: parsed.data.decision === 'approved'
        ? 'Justification acceptée'
        : 'Justification refusée',
      body: parsed.data.decision === 'approved'
        ? `L'absence de ${studentName} a été justifiée.`
        : `La justification pour ${studentName} n'a pas été acceptée. Contactez l'école si besoin.`,
      type: 'attendance_justification',
      actionPath: '/parent/absences',
      sendEmail: false,
    })
  }

  revalidatePath('/parent/absences')
  revalidatePath('/dashboard/attendance/justifications')

  return { success: true as const }
}
