'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { dispatchNotification } from '@/lib/notifications/dispatch'

export async function notifyAdmissionStaff(
  schoolId: string,
  input: {
    roles: string[]
    title: string
    body: string
    actionPath: string
    excludeUserId?: string
  }
) {
  let admin
  try {
    admin = createAdminClient()
  } catch {
    return { notified: 0 }
  }

  const { data: rolesRaw } = await admin
    .from('user_school_roles')
    .select('user_id')
    .eq('school_id', schoolId)
    .in('role_code', input.roles)
    .eq('is_active', true)

  const userIds = [
    ...new Set(
      ((rolesRaw ?? []) as Array<{ user_id: string }>)
        .map(r => r.user_id)
        .filter(id => id !== input.excludeUserId)
    ),
  ]

  let notified = 0
  for (const userId of userIds) {
    const result = await dispatchNotification({
      userId,
      schoolId,
      title: input.title,
      body: input.body,
      type: 'admission',
      actionPath: input.actionPath,
      sendEmail: true,
    })
    if (!('error' in result && result.error)) notified += 1
  }

  return { notified }
}
