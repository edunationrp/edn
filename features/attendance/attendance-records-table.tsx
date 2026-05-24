'use client'

import { useMemo, useState } from 'react'
import { Search, UserX } from 'lucide-react'
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
import { cn, formatDate } from '@/lib/utils'

export type AttendanceRecordRow = {
  id: string
  status: string
  recorded_at: string
  studentName: string
  className: string
}

function statusLabel(status: string) {
  if (status === 'absent') return 'Absent'
  if (status === 'late') return 'Retard'
  if (status === 'present') return 'Présent'
  return status
}

function statusBadgeClass(status: string) {
  if (status === 'absent') return 'bg-red-100 text-red-800'
  if (status === 'late') return 'bg-orange-100 text-orange-800'
  if (status === 'present') return 'bg-emerald-100 text-emerald-800'
  return 'bg-slate-100 text-slate-700'
}

const COLUMNS = [
  { id: 'student', label: 'Élève' },
  { id: 'class', label: 'Classe' },
  { id: 'status', label: 'Statut', align: 'center' as const },
  { id: 'date', label: 'Date' },
]

type AttendanceRecordsTableProps = {
  records: AttendanceRecordRow[]
  title?: string
  compact?: boolean
}

export function AttendanceRecordsTable({
  records,
  title = 'Enregistrements de présence',
  compact = false,
}: AttendanceRecordsTableProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    let rows = filterBySearch(records, search, r =>
      [r.studentName, r.className, statusLabel(r.status)].join(' ')
    )
    if (statusFilter !== 'all') rows = rows.filter(r => r.status === statusFilter)
    return rows
  }, [records, search, statusFilter])

  const hasFilters = !!search || statusFilter !== 'all'

  return (
    <DashboardDataTable
      title={title}
      columns={COLUMNS}
      data={filtered}
      keyExtractor={r => r.id}
      toolbar={
        <FilterBar className={cn('border-slate-100 bg-white', compact && 'p-3')}>
          <FilterSearch
            value={search}
            onChange={setSearch}
            placeholder="Rechercher élève, classe…"
            icon={<Search className="h-4 w-4" />}
          />
          <FilterSelect value={statusFilter} onChange={setStatusFilter} className="w-full sm:w-40">
            <option value="all">Tous</option>
            <option value="present">Présents</option>
            <option value="absent">Absents</option>
            <option value="late">Retards</option>
          </FilterSelect>
        </FilterBar>
      }
      footer={formatListFooter(filtered.length, records.length, hasFilters)}
      emptyState={{
        icon: <UserX className="h-6 w-6" />,
        title: hasFilters ? 'Aucun enregistrement' : 'Aucun enregistrement',
        description: hasFilters ? 'Modifiez la recherche ou les filtres.' : 'Les appels apparaîtront ici.',
      }}
      renderMobileRow={r => (
        <div className="px-4 py-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{r.studentName}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {r.className} · {formatDate(r.recorded_at)}
              </p>
            </div>
            <Badge className={statusBadgeClass(r.status)}>{statusLabel(r.status)}</Badge>
          </div>
        </div>
      )}
      renderDesktopRow={r => (
        <DashboardTableRow key={r.id}>
          <DashboardTableCell>
            <span className="font-semibold text-slate-900">{r.studentName}</span>
          </DashboardTableCell>
          <DashboardTableCell className="text-slate-600">{r.className}</DashboardTableCell>
          <DashboardTableCell align="center">
            <Badge className={statusBadgeClass(r.status)}>{statusLabel(r.status)}</Badge>
          </DashboardTableCell>
          <DashboardTableCell className="text-slate-500">{formatDate(r.recorded_at)}</DashboardTableCell>
        </DashboardTableRow>
      )}
    />
  )
}
