import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/dashboard/page-header'
import { NotificationsClient } from '@/features/notifications/notifications-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Notifications — EduNation',
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notificationsRaw } = await supabase
    .from('notifications')
    .select('id, title, body, type, is_read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const notifications = (notificationsRaw as Array<{
    id: string; title: string; body: string; type: string; is_read: boolean; created_at: string
  }> | null) ?? []

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="mx-auto max-w-3xl space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title="Notifications"
        description={
          unreadCount > 0
            ? `${unreadCount} alerte${unreadCount > 1 ? 's' : ''} en attente de lecture`
            : 'Historique de vos alertes et rappels'
        }
      />
      <NotificationsClient notifications={notifications} />
    </div>
  )
}
