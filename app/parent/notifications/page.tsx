import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ParentNotificationsList } from '@/features/parent/parent-notifications-list'
import { excludeMessagingNotificationTypes } from '@/lib/notifications/categories'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Notifications — Espace parent' }
export const dynamic = 'force-dynamic'

export default async function ParentNotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/parent')

  const { data: notificationsRaw } = await excludeMessagingNotificationTypes(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('notifications')
      .select('id, title, body, type, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100),
  )

  const notifications = (notificationsRaw ?? []) as Array<{
    id: string
    title: string
    body: string
    type: string
    is_read: boolean
    created_at: string
  }>

  return (
    <div className="w-full min-w-0 space-y-4">
      <div>
        <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Convocations, annonces et autres mises à jour concernant vos enfants.
        </p>
      </div>
      <ParentNotificationsList notifications={notifications} />
    </div>
  )
}
