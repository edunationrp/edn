'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Bell, CheckCircle, CreditCard, FileCheck, Megaphone, Search, Settings, UserX,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DashboardDataTable,
  DashboardTableCell,
  DashboardTableRow,
  FilterBar,
  FilterSearch,
  FilterSelect,
  formatListFooter,
  filterBySearch,
} from '@/components/dashboard/data-table'
import { formatRelativeDate } from '@/lib/utils'
import { markAllNotificationsRead, markNotificationRead } from '@/lib/actions/notifications'
import { cn } from '@/lib/utils'

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
  announcement: { icon: <Megaphone className="h-4 w-4" />, color: 'bg-purple-100 text-purple-700', label: 'Annonce' },
  system: { icon: <Bell className="h-4 w-4" />, color: 'bg-gray-100 text-gray-700', label: 'Système' },
}

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] ?? TYPE_CONFIG.system
}

const COLUMNS = [
  { id: 'notification', label: 'Notification' },
  { id: 'type', label: 'Type' },
  { id: 'date', label: 'Date', align: 'right' as const },
  { id: 'actions', label: '', align: 'center' as const },
]

export function NotificationsTable({ notifications }: { notifications: NotificationItem[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [readFilter, setReadFilter] = useState('all')

  const filtered = useMemo(() => {
    let rows = filterBySearch(notifications, search, n =>
      [n.title, n.body, getTypeConfig(n.type).label].join(' ')
    )
    if (readFilter === 'unread') rows = rows.filter(n => !n.is_read)
    if (readFilter === 'read') rows = rows.filter(n => n.is_read)
    return rows
  }, [notifications, search, readFilter])

  const unreadCount = notifications.filter(n => !n.is_read).length
  const hasFilters = !!search || readFilter !== 'all'

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
          <p className="mt-0.5 text-xs text-slate-500">
            {unreadCount > 0
              ? `${unreadCount} alerte${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
              : 'Vous êtes à jour'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {unreadCount > 0 && (
            <Button size="sm" variant="outline" disabled={isPending} onClick={handleMarkAll}>
              <CheckCircle className="mr-1 h-4 w-4" />
              Tout marquer lu
            </Button>
          )}
          <Button size="sm" variant="ghost" asChild>
            <Link href="/dashboard/settings"><Settings className="mr-1 h-4 w-4" />Paramètres</Link>
          </Button>
        </div>
      </div>

      <DashboardDataTable
        columns={COLUMNS}
        data={filtered}
        keyExtractor={n => n.id}
        toolbar={
          <FilterBar className="border-slate-100 bg-white">
            <FilterSearch
              value={search}
              onChange={setSearch}
              placeholder="Rechercher une notification…"
              icon={<Search className="h-4 w-4" />}
            />
            <FilterSelect value={readFilter} onChange={setReadFilter} className="w-full sm:w-40">
              <option value="all">Toutes</option>
              <option value="unread">Non lues</option>
              <option value="read">Lues</option>
            </FilterSelect>
          </FilterBar>
        }
        footer={formatListFooter(filtered.length, notifications.length, hasFilters)}
        emptyState={{
          icon: <Bell className="h-6 w-6" />,
          title: hasFilters ? 'Aucune notification' : 'Aucune notification',
          description: 'Les alertes sur notes, absences et paiements apparaîtront ici.',
        }}
        renderMobileRow={notif => {
          const cfg = getTypeConfig(notif.type)
          return (
            <div className={cn('px-4 py-4', !notif.is_read && 'bg-blue-50/40')}>
              <div className="flex gap-3">
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', cfg.color)}>
                  {cfg.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-sm', !notif.is_read ? 'font-semibold text-slate-900' : 'font-medium')}>
                      {notif.title}
                    </p>
                    <span className="shrink-0 text-xs text-slate-500">{formatRelativeDate(notif.created_at)}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{notif.body}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{cfg.label}</Badge>
                    {!notif.is_read && (
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" disabled={isPending} onClick={() => handleMarkOne(notif.id)}>
                        Marquer lu
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        }}
        renderDesktopRow={notif => {
          const cfg = getTypeConfig(notif.type)
          return (
            <DashboardTableRow key={notif.id} className={!notif.is_read ? 'bg-blue-50/30' : undefined}>
              <DashboardTableCell>
                <div className="flex items-start gap-3">
                  <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', cfg.color)}>
                    {cfg.icon}
                  </div>
                  <div className="min-w-0">
                    <p className={cn('text-sm', !notif.is_read ? 'font-semibold text-slate-900' : 'font-medium')}>
                      {notif.title}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">{notif.body}</p>
                  </div>
                </div>
              </DashboardTableCell>
              <DashboardTableCell>
                <Badge variant="outline">{cfg.label}</Badge>
              </DashboardTableCell>
              <DashboardTableCell align="right" className="whitespace-nowrap text-xs text-slate-500">
                {formatRelativeDate(notif.created_at)}
              </DashboardTableCell>
              <DashboardTableCell align="center">
                {!notif.is_read && (
                  <Button size="sm" variant="ghost" disabled={isPending} onClick={() => handleMarkOne(notif.id)}>
                    Lu
                  </Button>
                )}
              </DashboardTableCell>
            </DashboardTableRow>
          )
        }}
      />
    </div>
  )
}
