'use server'

import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAppUrl } from '@/lib/email/client'
import { sendNotificationEmail } from '@/lib/email/send'

type Db = SupabaseClient<any>

type DispatchNotificationInput = {
  userId: string
  schoolId: string
  title: string
  body: string
  type?: string
  actionPath?: string
  sendEmail?: boolean
}

export async function dispatchNotification(input: DispatchNotificationInput) {
  let admin: Db
  try {
    admin = createAdminClient() as Db
  } catch {
    return { error: 'Configuration serveur incomplète.' }
  }

  const { error: notifError } = await admin.from('notifications').insert({
    user_id: input.userId,
    school_id: input.schoolId,
    title: input.title,
    body: input.body,
    type: input.type ?? 'info',
    is_read: false,
  })

  if (notifError) {
    return { error: notifError.message }
  }

  if (input.sendEmail === false) {
    return { success: true }
  }

  const { data: profileRaw } = await admin
    .from('profiles')
    .select('email, full_name')
    .eq('id', input.userId)
    .single()

  const profile = profileRaw as { email: string | null; full_name: string | null } | null
  const email = profile?.email
  if (!email) {
    return { success: true, emailSkipped: true }
  }

  const emailResult = await sendNotificationEmail(email, {
    title: input.title,
    body: input.body,
    actionUrl: input.actionPath ? `${getAppUrl()}${input.actionPath}` : undefined,
    actionLabel: 'Ouvrir dans EduNation',
  })

  if (!emailResult.ok && !('skipped' in emailResult && emailResult.skipped)) {
    return { success: true, emailError: 'error' in emailResult ? emailResult.error : undefined }
  }

  return { success: true }
}
