'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Clock, FileText, MessageSquareWarning, QrCode, Search } from 'lucide-react'
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
import {
  REPORT_CARD_STATUS_LABELS,
  type ReportCardWorkflowStatus,
} from '@/lib/report-cards/workflow'

export type ReportCardRow = {
  id: string
  term: string
  average: number | null
  rank: number | null
  is_locked: boolean
  is_published: boolean
  workflowStatus: ReportCardWorkflowStatus
  hash: string | null
  studentName: string
}

const COLUMNS = [
  { id: 'student', label: 'Élève' },
  { id: 'term', label: 'Trimestre', align: 'center' as const },
  { id: 'average', label: 'Moyenne', align: 'center' as const },
  { id: 'rank', label: 'Rang', align: 'center' as const },
  { id: 'status', label: 'Statut', align: 'center' as const },
  { id: 'auth', label: 'Auth.', align: 'center' as const },
  { id: 'actions', label: 'Actions', align: 'center' as const },
]

function ReportCardStatus({ row }: { row: ReportCardRow }) {
  if (row.workflowStatus === 'published') {
    return (
      <Badge className="bg-emerald-100 text-emerald-800">
        <CheckCircle className="mr-1 h-3 w-3" />
        {REPORT_CARD_STATUS_LABELS.published}
      </Badge>
    )
  }
  if (row.workflowStatus === 'validated') {
    return (
      <Badge className="bg-blue-100 text-blue-800">
        <CheckCircle className="mr-1 h-3 w-3" />
        {REPORT_CARD_STATUS_LABELS.validated}
      </Badge>
    )
  }
  if (row.workflowStatus === 'correction_requested') {
    return (
      <Badge className="bg-amber-100 text-amber-900">
        <MessageSquareWarning className="mr-1 h-3 w-3" />
        {REPORT_CARD_STATUS_LABELS.correction_requested}
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="border-orange-300 text-orange-600">
      <Clock className="mr-1 h-3 w-3" />
      {REPORT_CARD_STATUS_LABELS[row.workflowStatus] ?? 'En attente'}
    </Badge>
  )
}

export function ReportCardsTable({ reportCards }: { reportCards: ReportCardRow[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    let rows = filterBySearch(reportCards, search, rc => [rc.studentName, rc.term].join(' '))
    if (statusFilter === 'published') rows = rows.filter(r => r.workflowStatus === 'published')
    if (statusFilter === 'validated') rows = rows.filter(r => r.workflowStatus === 'validated')
    if (statusFilter === 'pending') rows = rows.filter(
      r => r.workflowStatus === 'generated' || r.workflowStatus === 'correction_requested',
    )
    return rows
  }, [reportCards, search, statusFilter])

  const hasFilters = !!search || statusFilter !== 'all'

  return (
    <DashboardDataTable
      title="Bulletins récents"
      columns={COLUMNS}
      data={filtered}
      keyExtractor={rc => rc.id}
      minWidth="900px"
      toolbar={
        <FilterBar className="border-slate-100 bg-white">
          <FilterSearch
            value={search}
            onChange={setSearch}
            placeholder="Rechercher élève, trimestre…"
            icon={<Search className="h-4 w-4" />}
          />
          <FilterSelect value={statusFilter} onChange={setStatusFilter} className="w-full sm:w-44">
            <option value="all">Tous les statuts</option>
            <option value="published">Publiés</option>
            <option value="validated">Validés</option>
            <option value="pending">En attente proviseur</option>
          </FilterSelect>
        </FilterBar>
      }
      footer={formatListFooter(filtered.length, reportCards.length, hasFilters)}
      emptyState={{
        icon: <FileText className="h-6 w-6" />,
        title: hasFilters ? 'Aucun bulletin trouvé' : 'Aucun bulletin généré',
        description: hasFilters ? 'Modifiez la recherche ou les filtres.' : undefined,
        action: !hasFilters ? (
          <Button variant="brandDark" size="sm" asChild>
            <Link href="/dashboard/report-cards/generate">Générer les bulletins</Link>
          </Button>
        ) : undefined,
      }}
      renderMobileRow={rc => (
        <div className="px-4 py-4">
          <p className="text-sm font-semibold text-slate-900">{rc.studentName}</p>
          <p className="mt-1 text-xs text-slate-500">
            {rc.term} · {rc.average !== null ? `${rc.average.toFixed(2)}/20` : '—'}
            {rc.rank ? ` · Rang ${rc.rank}` : ''}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <ReportCardStatus row={rc} />
            {rc.hash && (
              <Badge className="bg-purple-100 text-purple-800">
                <QrCode className="mr-1 h-3 w-3" />
                QR
              </Badge>
            )}
          </div>
          <Button variant="link" size="sm" className="mt-2 h-auto p-0" asChild>
            <Link href={`/dashboard/report-cards/${rc.id}`}>Voir le bulletin</Link>
          </Button>
        </div>
      )}
      renderDesktopRow={rc => (
        <DashboardTableRow key={rc.id}>
          <DashboardTableCell>
            <span className="font-semibold text-slate-900">{rc.studentName}</span>
          </DashboardTableCell>
          <DashboardTableCell align="center">
            <Badge variant="outline">{rc.term}</Badge>
          </DashboardTableCell>
          <DashboardTableCell align="center" className="font-bold">
            {rc.average !== null ? `${rc.average.toFixed(2)}/20` : '—'}
          </DashboardTableCell>
          <DashboardTableCell align="center">{rc.rank ?? '—'}</DashboardTableCell>
          <DashboardTableCell align="center">
            <ReportCardStatus row={rc} />
          </DashboardTableCell>
          <DashboardTableCell align="center">
            {rc.hash ? (
              <Badge className="bg-purple-100 text-purple-800">
                <QrCode className="mr-1 h-3 w-3" />
                QR
              </Badge>
            ) : '—'}
          </DashboardTableCell>
          <DashboardTableCell align="center">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/dashboard/report-cards/${rc.id}`}>Voir</Link>
            </Button>
          </DashboardTableCell>
        </DashboardTableRow>
      )}
    />
  )
}
