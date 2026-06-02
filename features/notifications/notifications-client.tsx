'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Bell, CheckCircle, CreditCard, FileCheck, UserX, Megaphone, Settings,
} from 'lucide-react'
import { formatRelativeDate } from '@/lib/utils'
import { markAllNotificationsRead, markNotificationRead } from '@/lib/actions/notifications'

export type NotificationItem = {
  id: string
  title: string
  body: string
  type: string
  is_read: boolean
  created_at: string
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  payment: { icon: <CreditCard className="h-4 w-4" />, color: 'bg-green-100 text-green-700', label: 'Paiement' },
  grade: { icon: <FileCheck className="h-4 w-4" />, color: 'bg-blue-100 text-blue-700', label: 'Notes' },
  attendance: { icon: <UserX className="h-4 w-4" />, color: 'bg-orange-100 text-orange-700', label: 'Absence' },
  attendance_threshold: { icon: <UserX className="h-4 w-4" />, color: 'bg-red-100 text-red-700', label: 'Alerte assiduité' },
  attendance_justification: { icon: <UserX className="h-4 w-4" />, color: 'bg-amber-100 text-amber-700', label: 'Justification' },
  announcement: { icon: <Megaphone className="h-4 w-4" />, color: 'bg-purple-100 text-purple-700', label: 'Annonce' },
  system: { icon: <Bell className="h-4 w-4" />, color: 'bg-gray-100 text-gray-700', label: 'Système' },
}

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] ?? TYPE_CONFIG.system
}

export function NotificationsClient({ notifications }: { notifications: NotificationItem[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const unreadCount = notifications.filter(n => !n.is_read).length

  function handleMarkAll() {
    startTransition(async () => {
      await markAllNotificationsRead()
      router.refresh()
    })
  }

  function handleMarkOne(id: string) {
    startTransition(async () => {
      await markNotificationRead(id)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#1B3A6B]">Centre de notifications</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} alerte${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
              : 'Vous êtes à jour'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-blue-200 sm:flex-none"
              disabled={isPending}
              onClick={handleMarkAll}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Tout marquer lu
            </Button>
          )}
          <Button size="sm" variant="ghost" asChild className="flex-1 sm:flex-none">
            <Link href="/dashboard/settings">
              <Settings className="h-4 w-4 mr-1" />
              Paramètres
            </Link>
          </Button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-16 text-center">
          <Bell className="mx-auto mb-3 h-10 w-10 text-muted-foreground opacity-40" />
          <p className="font-medium text-gray-700">Aucune notification</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Les alertes sur notes, absences et paiements apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="divide-y rounded-2xl border bg-white shadow-sm">
          {notifications.map(notif => {
            const cfg = getTypeConfig(notif.type)
            return (
              <div
                key={notif.id}
                className={`flex gap-3 p-4 transition-colors sm:gap-4 ${!notif.is_read ? 'bg-blue-50/40' : 'hover:bg-muted/20'}`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cfg.color}`}>
                  {cfg.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <p className={`text-sm ${!notif.is_read ? 'font-semibold text-gray-900' : 'font-medium'}`}>
                      {notif.title}
                    </p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatRelativeDate(notif.created_at)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{notif.body}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs">{cfg.label}</Badge>
                    {!notif.is_read && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleMarkOne(notif.id)}
                        className="text-xs font-semibold text-[#1B3A6B] hover:underline"
                      >
                        Marquer comme lu
                      </button>
                    )}
                  </div>
                </div>
                {!notif.is_read && (
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500 sm:mt-3" />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
