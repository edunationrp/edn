import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, CheckCircle } from 'lucide-react'
import { formatRelativeDate } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Notifications',
}

export default async function NotificationsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: notificationsRaw } = await supabase
    .from('notifications')
    .select('id, title, body, type, is_read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const notifications = notificationsRaw as Array<{
    id: string; title: string; body: string; type: string; is_read: boolean; created_at: string;
  }> | null

  const unreadCount = notifications?.filter(n => !n.is_read).length ?? 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Toutes lues'}
          </p>
        </div>
        {unreadCount > 0 && (
          <form action="/api/notifications/mark-all-read" method="POST">
            <button type="submit" className="flex items-center gap-2 text-sm text-primary hover:underline">
              <CheckCircle className="h-4 w-4" />
              Tout marquer comme lu
            </button>
          </form>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {notifications && notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-4 p-4 hover:bg-muted/20 transition-colors ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                >
                  <div className={`p-2 rounded-xl flex-shrink-0 ${!notif.is_read ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <Bell className={`h-4 w-4 ${!notif.is_read ? 'text-blue-600' : 'text-gray-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${!notif.is_read ? 'font-semibold' : 'font-medium'}`}>
                        {notif.title}
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!notif.is_read && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatRelativeDate(notif.created_at)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{notif.body}</p>
                    <Badge variant="outline" className="mt-1 text-xs">{notif.type}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground">Aucune notification</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
