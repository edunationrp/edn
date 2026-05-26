'use client'

import { useMemo, useState } from 'react'
import { Search, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
import { formatDateTime } from '@/lib/utils'
import type { PlatformAuditLogRow } from '@/lib/platform/types'

const ACTION_COLORS: Record<string, string> = {
  login: 'bg-blue-100 text-blue-800',
  logout: 'bg-gray-100 text-gray-800',
  create: 'bg-green-100 text-green-800',
  update: 'bg-orange-100 text-orange-800',
  delete: 'bg-red-100 text-red-800',
  validate: 'bg-teal-100 text-teal-800',
  generate: 'bg-purple-100 text-purple-800',
}

function actionBadgeClass(action: string) {
  return ACTION_COLORS[action.split('_')[0].toLowerCase()] ?? 'bg-gray-100 text-gray-800'
}

const COLUMNS = [
  { id: 'date', label: 'Date / Heure' },
  { id: 'actor', label: 'Acteur' },
  { id: 'action', label: 'Action' },
  { id: 'entity', label: 'Entité' },
  { id: 'school', label: 'Établissement' },
  { id: 'ip', label: 'IP' },
]

export function PlatformAuditLogsTable({ logs }: { logs: PlatformAuditLogRow[] }) {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')

  const filtered = useMemo(() => {
    let rows = filterBySearch(logs, search, log =>
      [log.action, log.actorName, log.actorEmail, log.entityType, log.entityId, log.schoolName]
        .filter(Boolean)
        .join(' ')
    )
    if (actionFilter !== 'all') {
      rows = rows.filter(log => log.action.split('_')[0].toLowerCase() === actionFilter)
    }
    return rows
  }, [logs, search, actionFilter])

  const hasFilters = !!search || actionFilter !== 'all'

  function renderLog(log: PlatformAuditLogRow, mobile: boolean) {
    if (mobile) {
      return (
        <div className="px-4 py-4">
          <div className="flex items-start justify-between gap-2">
            <Badge className={actionBadgeClass(log.action)}>{log.action}</Badge>
            <span className="text-[11px] text-slate-500 whitespace-nowrap">
              {formatDateTime(log.createdAt)}
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold">{log.actorName}</p>
          <p className="text-xs text-muted-foreground">
            {log.entityType}{log.schoolName ? ` · ${log.schoolName}` : ''}
          </p>
        </div>
      )
    }
    return (
      <DashboardTableRow>
        <DashboardTableCell className="whitespace-nowrap text-xs text-slate-500">
          {formatDateTime(log.createdAt)}
        </DashboardTableCell>
        <DashboardTableCell>
          <p className="text-sm font-medium">{log.actorName}</p>
          {log.actorEmail && <p className="text-xs text-muted-foreground">{log.actorEmail}</p>}
        </DashboardTableCell>
        <DashboardTableCell>
          <Badge className={actionBadgeClass(log.action)}>{log.action}</Badge>
        </DashboardTableCell>
        <DashboardTableCell className="text-xs text-slate-500">
          {log.entityType}
          {log.entityId && (
            <span className="ml-1 font-mono opacity-60">#{log.entityId.slice(0, 8)}</span>
          )}
        </DashboardTableCell>
        <DashboardTableCell>
          <span className="text-sm text-slate-600">{log.schoolName ?? '—'}</span>
        </DashboardTableCell>
        <DashboardTableCell className="font-mono text-xs text-muted-foreground">
          {log.ipAddress || '—'}
        </DashboardTableCell>
      </DashboardTableRow>
    )
  }

  return (
    <DashboardDataTable
      columns={COLUMNS}
      data={filtered}
      keyExtractor={log => log.id}
      minWidth="1000px"
      toolbar={
        <FilterBar className="border-slate-100 bg-white">
          <FilterSearch
            value={search}
            onChange={setSearch}
            placeholder="Rechercher action, acteur, établissement…"
            icon={<Search className="h-4 w-4" />}
          />
          <FilterSelect value={actionFilter} onChange={setActionFilter} className="w-full sm:w-44">
            <option value="all">Toutes actions</option>
            <option value="create">Création</option>
            <option value="update">Modification</option>
            <option value="delete">Suppression</option>
            <option value="login">Connexion</option>
            <option value="validate">Validation</option>
          </FilterSelect>
        </FilterBar>
      }
      footer={formatListFooter(filtered.length, logs.length, hasFilters)}
      emptyState={{
        icon: <Shield className="h-6 w-6" />,
        title: hasFilters ? 'Aucun journal' : 'Aucun journal d\'audit',
        description: hasFilters ? 'Modifiez la recherche.' : 'Les actions plateforme seront enregistrées ici.',
      }}
      renderMobileRow={log => renderLog(log, true)}
      renderDesktopRow={log => renderLog(log, false)}
    />
  )
}
