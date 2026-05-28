import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ParentShell } from '@/components/parent/parent-shell'
import { requireParentPortalAccess } from '@/lib/parent/parent-context'
import { excludeMessagingNotificationTypes } from '@/lib/notifications/categories'

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/parent')

  const { data: studentRow } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (studentRow) redirect('/eleve')

  try {
    const { parentName, children: parentChildren, activeChild } = await requireParentPortalAccess(user.id)

    const { count: unreadNotifications } = await excludeMessagingNotificationTypes(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false),
    )

    const { data: recentNotificationsRaw } = await excludeMessagingNotificationTypes(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from('notifications')
        .select('id, title, body, type, is_read, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30),
    )

    return (
      <ParentShell
        userId={user.id}
        parentName={parentName}
        parentChildren={parentChildren}
        activeChild={activeChild}
        notifications={(recentNotificationsRaw ?? []) as Array<{
          id: string
          title: string
          body: string
          type: string
          is_read: boolean
          created_at: string
        }>}
        unreadNotifications={unreadNotifications ?? 0}
      >
        {children}
      </ParentShell>
    )
  } catch {
    redirect('/dashboard')
  }
}
