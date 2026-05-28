'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  BookOpen,
  Calendar,
  CheckCheck,
  FileText,
  GraduationCap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { markAllNotificationsRead, markNotificationRead } from '@/lib/actions/notifications'
import { formatRelativeDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { StudentNotificationItem } from '@/features/eleve/student-notifications-panel'

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string; href: string }> = {
  timetable: {
    icon: <Calendar className="h-4 w-4" />,
    color: 'bg-indigo-100 text-indigo-700',
    label: 'Emploi du temps',
    href: '/eleve/emploi-du-temps',
  },
  course: {
    icon: <GraduationCap className="h-4 w-4" />,
    color: 'bg-emerald-100 text-emerald-700',
    label: 'Cours',
    href: '/eleve/cours',
  },
  report_card: {
    icon: <FileText className="h-4 w-4" />,
    color: 'bg-blue-100 text-blue-700',
    label: 'Bulletin',
    href: '/eleve/bulletins',
  },
  grade: {
    icon: <BookOpen className="h-4 w-4" />,
    color: 'bg-violet-100 text-violet-700',
    label: 'Notes',
    href: '/eleve/notes',
  },
}

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] ?? {
    icon: <Bell className="h-4 w-4" />,
    color: 'bg-slate-100 text-slate-700',
    label: 'Info',
    href: '/eleve',
  }
}

export function StudentNotificationsList({
  notifications,
}: {
  notifications: StudentNotificationItem[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const unreadCount = notifications.filter(n => !n.is_read).length

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsRead()
      router.refresh()
    })
  }

  function handleOpen(item: StudentNotificationItem) {
    startTransition(async () => {
      if (!item.is_read) await markNotificationRead(item.id)
      router.push(getTypeConfig(item.type).href)
      router.refresh()
    })
  }

  if (notifications.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center">
        <Bell className="mx-auto h-8 w-8 text-slate-300" />
        <p className="mt-3 text-sm font-medium text-gray-700">Aucune notification pour le moment</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {unreadCount > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={handleMarkAllRead}
          className="gap-2"
        >
          <CheckCheck className="h-4 w-4" />
          Tout marquer comme lu ({unreadCount})
        </Button>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <ul className="divide-y divide-slate-100">
          {notifications.map(item => {
            const config = getTypeConfig(item.type)
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => handleOpen(item)}
                  className={cn(
                    'flex w-full gap-3 px-3 py-3 text-left transition hover:bg-slate-50 sm:px-4',
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
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.body}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground/80">
                      {config.label} · {formatRelativeDate(item.created_at)}
                    </p>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
