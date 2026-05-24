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

export type AuditLogRow = {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  ip_address: string
  created_at: string
  actorName: string
  actorEmail: string
}

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
  const type = action.split('_')[0].toLowerCase()
  return ACTION_COLORS[type] ?? 'bg-gray-100 text-gray-800'
}

const COLUMNS = [
  { id: 'date', label: 'Date / Heure' },
  { id: 'actor', label: 'Acteur' },
  { id: 'action', label: 'Action' },
  { id: 'entity', label: 'Entité' },
  { id: 'ip', label: 'IP' },
]

export function AuditLogsTable({ logs }: { logs: AuditLogRow[] }) {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')

  const filtered = useMemo(() => {
    let rows = filterBySearch(logs, search, log =>
      [log.action, log.actorName, log.actorEmail, log.entity_type, log.entity_id].filter(Boolean).join(' ')
    )
    if (actionFilter !== 'all') {
      rows = rows.filter(log => log.action.split('_')[0].toLowerCase() === actionFilter)
    }
    return rows
  }, [logs, search, actionFilter])

  const hasFilters = !!search || actionFilter !== 'all'

  return (
    <DashboardDataTable
      columns={COLUMNS}
      data={filtered}
      keyExtractor={log => log.id}
      minWidth="880px"
      toolbar={
        <FilterBar className="border-slate-100 bg-white">
          <FilterSearch
            value={search}
            onChange={setSearch}
            placeholder="Rechercher action, acteur, entité…"
            icon={<Search className="h-4 w-4" />}
          />
          <FilterSelect value={actionFilter} onChange={setActionFilter} className="w-full sm:w-44">
            <option value="all">Toutes les actions</option>
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
        title: hasFilters ? 'Aucun log trouvé' : 'Aucun log d\'audit',
        description: hasFilters ? 'Modifiez la recherche ou les filtres.' : 'Les actions seront enregistrées ici.',
      }}
      renderMobileRow={log => (
        <div className="px-4 py-4">
          <div className="flex items-start justify-between gap-2">
            <Badge className={actionBadgeClass(log.action)}>{log.action}</Badge>
            <span className="whitespace-nowrap text-[11px] text-slate-500">
              {formatDateTime(log.created_at)}
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-900">{log.actorName}</p>
          <p className="text-xs text-slate-500">
            {log.entity_type}
            {log.entity_id ? ` · #${log.entity_id.slice(0, 8)}` : ''}
          </p>
        </div>
      )}
      renderDesktopRow={log => (
        <DashboardTableRow key={log.id}>
          <DashboardTableCell className="whitespace-nowrap text-xs text-slate-500">
            {formatDateTime(log.created_at)}
          </DashboardTableCell>
          <DashboardTableCell>
            <p className="text-sm font-medium text-slate-900">{log.actorName}</p>
            {log.actorEmail && <p className="text-xs text-slate-500">{log.actorEmail}</p>}
          </DashboardTableCell>
          <DashboardTableCell>
            <Badge className={actionBadgeClass(log.action)}>{log.action}</Badge>
          </DashboardTableCell>
          <DashboardTableCell className="text-xs text-slate-500">
            {log.entity_type}
            {log.entity_id && (
              <span className="ml-1 font-mono opacity-60">#{log.entity_id.slice(0, 8)}</span>
            )}
          </DashboardTableCell>
          <DashboardTableCell className="font-mono text-xs text-slate-500">
            {log.ip_address || '—'}
          </DashboardTableCell>
        </DashboardTableRow>
      )}
    />
  )
}
