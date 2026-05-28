'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { excludeMessagingNotificationTypes } from '@/lib/notifications/categories'

export async function markAllNotificationsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await excludeMessagingNotificationTypes(
    (supabase as any)
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
  )

  if (error) return { error: error.message }
  revalidatePath('/dashboard/notifications')
  revalidatePath('/eleve')
  revalidatePath('/eleve/notifications')
  revalidatePath('/parent')
  revalidatePath('/parent/notifications')
  return { success: true }
}

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/notifications')
  revalidatePath('/eleve')
  revalidatePath('/eleve/notifications')
  revalidatePath('/parent')
  revalidatePath('/parent/notifications')
  return { success: true }
}
