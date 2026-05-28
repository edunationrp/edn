'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell,
  BookOpen,
  Calendar,
  CheckCheck,
  CreditCard,
  FileText,
  Mail,
  MailWarning,
  Megaphone,
  UserX,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { markAllNotificationsRead, markNotificationRead } from '@/lib/actions/notifications'
import { createClient } from '@/lib/supabase/client'
import { isMessagingNotificationType } from '@/lib/notifications/categories'
import { formatRelativeDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

export type ParentNotificationItem = {
  id: string
  title: string
  body: string
  type: string
  is_read: boolean
  created_at: string
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string; href?: string }> = {
  convocation: {
    icon: <MailWarning className="h-4 w-4" />,
    color: 'bg-red-100 text-red-700',
    label: 'Convocation',
    href: '/parent/communications',
  },
  announcement: {
    icon: <Megaphone className="h-4 w-4" />,
    color: 'bg-amber-100 text-amber-800',
    label: 'Annonce',
    href: '/parent/communications',
  },
  meeting: {
    icon: <Calendar className="h-4 w-4" />,
    color: 'bg-indigo-100 text-indigo-700',
    label: 'Réunion',
    href: '/parent/communications',
  },
  report_card: {
    icon: <FileText className="h-4 w-4" />,
    color: 'bg-blue-100 text-blue-700',
    label: 'Bulletin',
    href: '/parent/bulletins',
  },
  grade: {
    icon: <BookOpen className="h-4 w-4" />,
    color: 'bg-violet-100 text-violet-700',
    label: 'Notes',
    href: '/parent/notes',
  },
  payment: {
    icon: <CreditCard className="h-4 w-4" />,
    color: 'bg-emerald-100 text-emerald-700',
    label: 'Paiement',
    href: '/parent/paiements',
  },
  attendance_justification: {
    icon: <UserX className="h-4 w-4" />,
    color: 'bg-orange-100 text-orange-700',
    label: 'Absence',
    href: '/parent/absences',
  },
  message: {
    icon: <Mail className="h-4 w-4" />,
    color: 'bg-sky-100 text-sky-700',
    label: 'Message',
    href: '/parent/messages',
  },
}

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] ?? {
    icon: <Bell className="h-4 w-4" />,
    color: 'bg-slate-100 text-slate-700',
    label: 'Info',
    href: '/parent',
  }
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  initialNotifications: ParentNotificationItem[]
  initialUnreadCount: number
  onUnreadChange?: (count: number) => void
}

export function ParentNotificationsPanel({
  open,
  onOpenChange,
  userId,
  initialNotifications,
  initialUnreadCount,
  onUnreadChange,
}: Props) {
  const router = useRouter()
  const [notifications, setNotifications] = useState(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setNotifications(initialNotifications)
    setUnreadCount(initialUnreadCount)
  }, [initialNotifications, initialUnreadCount])

  useEffect(() => {
    onUnreadChange?.(unreadCount)
  }, [unreadCount, onUnreadChange])

  useEffect(() => {
    if (!userId) return
    const supabase = createClient()

    const channel = supabase
      .channel(`parent-notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        payload => {
          const row = payload.new as ParentNotificationItem
          if (row.type && isMessagingNotificationType(row.type)) return
          setNotifications(prev => [row, ...prev].slice(0, 50))
          if (!row.is_read) setUnreadCount(prev => prev + 1)
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        payload => {
          const row = payload.new as ParentNotificationItem
          if (row.type && isMessagingNotificationType(row.type)) return
          setNotifications(prev => prev.map(item => (item.id === row.id ? row : item)))
          if (row.is_read) setUnreadCount(prev => Math.max(0, prev - 1))
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId])

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsRead()
      setNotifications(prev => prev.map(item => ({ ...item, is_read: true })))
      setUnreadCount(0)
      router.refresh()
    })
  }

  function handleOpenNotification(item: ParentNotificationItem) {
    startTransition(async () => {
      if (!item.is_read) {
        await markNotificationRead(item.id)
        setNotifications(prev =>
          prev.map(n => (n.id === item.id ? { ...n, is_read: true } : n)),
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
      onOpenChange(false)
      const href = getTypeConfig(item.type).href
      if (href) router.push(href)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(85dvh,640px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b px-4 py-4 pr-12 text-left">
          <div className="flex items-start justify-between gap-2">
            <div>
              <DialogTitle>Notifications</DialogTitle>
              <DialogDescription>
                {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est à jour'}
              </DialogDescription>
            </div>
            {unreadCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 shrink-0 text-xs"
                disabled={isPending}
                onClick={handleMarkAllRead}
              >
                <CheckCheck className="mr-1 h-3.5 w-3.5" />
                Tout lire
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {notifications.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Bell className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-gray-700">Aucune notification</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Convocations, annonces et mises à jour scolaires apparaîtront ici.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {notifications.map(item => {
                const config = getTypeConfig(item.type)
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleOpenNotification(item)}
                      className={cn(
                        'flex w-full gap-3 px-4 py-3 text-left transition hover:bg-slate-50',
                        !item.is_read && 'bg-[#1B3A6B]/[0.03]',
                      )}
                    >
                      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', config.color)}>
                        {config.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn('text-sm leading-snug', item.is_read ? 'font-medium text-gray-800' : 'font-semibold text-gray-900')}>
                            {item.title}
                          </p>
                          {!item.is_read && (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#7AB832]" />
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.body}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground/80">
                          {config.label} · {formatRelativeDate(item.created_at)}
                        </p>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="border-t px-4 py-3">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href="/parent/notifications" onClick={() => onOpenChange(false)}>
              Voir tout l&apos;historique
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ParentNotificationBell({
  unreadCount,
  onClick,
}: {
  unreadCount: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label="Notifications"
      onClick={onClick}
      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100"
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}
