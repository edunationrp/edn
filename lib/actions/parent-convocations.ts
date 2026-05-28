'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { dispatchNotification } from '@/lib/notifications/dispatch'

const STAFF_ROLES = [
  'PROVISEUR',
  'CENSEUR',
  'SECRETAIRE',
  'DIRECTEUR_ADJOINT',
  'VIE_SCOLAIRE',
  'CONSEILLER',
  'FONDATEUR',
] as const

async function assertStaffCanManageSchool(userId: string, schoolId: string) {
  const admin = createAdminClient()
  const { data: roleRow } = await admin
    .from('user_school_roles')
    .select('role_code')
    .eq('user_id', userId)
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .in('role_code', [...STAFF_ROLES])
    .limit(1)
    .maybeSingle()

  if (!roleRow) {
    return { error: 'Permission insuffisante.' as const }
  }
  return { success: true as const }
}

const SendConvocationSchema = z.object({
  studentId: z.string().uuid(),
  parentUserId: z.string().uuid(),
  title: z.string().min(3, 'Titre requis'),
  message: z.string().min(10, 'Message requis'),
  convocationDate: z.string().optional(),
  location: z.string().optional(),
})

export async function sendParentConvocation(formData: {
  studentId: string
  parentUserId: string
  title: string
  message: string
  convocationDate?: string
  location?: string
}) {
  const parsed = SendConvocationSchema.safeParse({
    ...formData,
    title: formData.title.trim(),
    message: formData.message.trim(),
    location: formData.location?.trim() || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any

  const { data: student } = await db
    .from('students')
    .select('id, school_id, first_name, last_name')
    .eq('id', parsed.data.studentId)
    .maybeSingle()

  if (!student) return { error: 'Élève introuvable.' }

  const staffCheck = await assertStaffCanManageSchool(user.id, student.school_id as string)
  if ('error' in staffCheck) return staffCheck

  const { data: relation } = await db
    .from('parent_student_relations')
    .select('id')
    .eq('parent_user_id', parsed.data.parentUserId)
    .eq('student_id', parsed.data.studentId)
    .maybeSingle()

  if (!relation) {
    return { error: 'Ce parent n\'est pas rattaché à cet élève.' }
  }

  const convocationDate = parsed.data.convocationDate
    ? new Date(parsed.data.convocationDate).toISOString()
    : null

  const { data: inserted, error: insertErr } = await db
    .from('parent_convocations')
    .insert({
      school_id: student.school_id,
      student_id: parsed.data.studentId,
      parent_user_id: parsed.data.parentUserId,
      title: parsed.data.title,
      message: parsed.data.message,
      convocation_date: convocationDate,
      location: parsed.data.location ?? null,
      sent_by: user.id,
    })
    .select('id')
    .single()

  if (insertErr || !inserted) {
    return { error: insertErr?.message ?? 'Envoi impossible.' }
  }

  await dispatchNotification({
    userId: parsed.data.parentUserId,
    schoolId: student.school_id as string,
    title: `Convocation : ${parsed.data.title}`,
    body: `Concernant ${student.first_name} ${student.last_name}. ${parsed.data.message.slice(0, 120)}`,
    type: 'convocation',
    actionPath: '/parent/communications',
    sendEmail: true,
  })

  revalidatePath('/parent')
  revalidatePath('/parent/communications')
  revalidatePath(`/dashboard/students/${parsed.data.studentId}`)

  return { success: true as const }
}

export async function markParentConvocationRead(convocationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { error } = await (supabase as any)
    .from('parent_convocations')
    .update({ read_at: new Date().toISOString() })
    .eq('id', convocationId)
    .eq('parent_user_id', user.id)
    .is('read_at', null)

  if (error) return { error: error.message }

  revalidatePath('/parent')
  revalidatePath('/parent/communications')
  return { success: true as const }
}

export async function acknowledgeParentConvocation(convocationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const now = new Date().toISOString()
  const { error } = await (supabase as any)
    .from('parent_convocations')
    .update({
      read_at: now,
      acknowledged_at: now,
    })
    .eq('id', convocationId)
    .eq('parent_user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/parent')
  revalidatePath('/parent/communications')
  return { success: true as const }
}
