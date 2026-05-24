'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ClipboardList, Lock, Search } from 'lucide-react'
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
import { formatDate } from '@/lib/utils'

export type EvaluationRow = {
  id: string
  title: string
  eval_type: string
  max_score: number
  eval_date: string
  is_locked: boolean
}

const COLUMNS = [
  { id: 'title', label: 'Titre' },
  { id: 'type', label: 'Type' },
  { id: 'max', label: 'Note max', align: 'center' as const },
  { id: 'date', label: 'Date' },
  { id: 'status', label: 'Statut', align: 'center' as const },
  { id: 'actions', label: 'Actions', align: 'center' as const },
]

function StatusBadge({ locked }: { locked: boolean }) {
  return locked ? (
    <Badge className="bg-emerald-100 text-emerald-800">
      <Lock className="mr-1 h-3 w-3" />
      Verrouillée
    </Badge>
  ) : (
    <Badge variant="outline" className="border-orange-300 text-orange-600">
      En cours
    </Badge>
  )
}

export function EvaluationsTable({ evaluations }: { evaluations: EvaluationRow[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    let rows = filterBySearch(evaluations, search, e =>
      [e.title, e.eval_type].join(' ')
    )
    if (statusFilter === 'locked') rows = rows.filter(e => e.is_locked)
    if (statusFilter === 'open') rows = rows.filter(e => !e.is_locked)
    return rows
  }, [evaluations, search, statusFilter])

  const hasFilters = !!search || statusFilter !== 'all'

  return (
    <DashboardDataTable
      title="Évaluations récentes"
      columns={COLUMNS}
      data={filtered}
      keyExtractor={e => e.id}
      toolbar={
        <FilterBar className="border-slate-100 bg-white">
          <FilterSearch
            value={search}
            onChange={setSearch}
            placeholder="Rechercher une évaluation…"
            icon={<Search className="h-4 w-4" />}
          />
          <FilterSelect value={statusFilter} onChange={setStatusFilter} className="w-full sm:w-44">
            <option value="all">Tous les statuts</option>
            <option value="open">En cours</option>
            <option value="locked">Verrouillées</option>
          </FilterSelect>
        </FilterBar>
      }
      footer={formatListFooter(filtered.length, evaluations.length, hasFilters)}
      emptyState={{
        icon: <ClipboardList className="h-6 w-6" />,
        title: hasFilters ? 'Aucune évaluation trouvée' : 'Aucune évaluation créée',
        description: hasFilters ? 'Modifiez la recherche ou les filtres.' : 'Commencez par saisir des notes.',
        action: !hasFilters ? (
          <Button variant="brandDark" size="sm" asChild>
            <Link href="/dashboard/grades/entry">Saisir des notes</Link>
          </Button>
        ) : undefined,
      }}
      renderMobileRow={ev => (
        <div className="px-4 py-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900">{ev.title}</p>
            <StatusBadge locked={ev.is_locked} />
          </div>
          <p className="mt-1 text-xs capitalize text-slate-500">
            {ev.eval_type} · Max {ev.max_score} · {formatDate(ev.eval_date)}
          </p>
          <div className="mt-2 flex gap-2">
            <Button variant="link" size="sm" className="h-auto p-0" asChild>
              <Link href={`/dashboard/grades/${ev.id}`}>Voir</Link>
            </Button>
            {!ev.is_locked && (
              <Button variant="link" size="sm" className="h-auto p-0" asChild>
                <Link href={`/dashboard/grades/${ev.id}/entry`}>Saisir</Link>
              </Button>
            )}
          </div>
        </div>
      )}
      renderDesktopRow={ev => (
        <DashboardTableRow key={ev.id}>
          <DashboardTableCell>
            <span className="font-semibold text-slate-900">{ev.title}</span>
          </DashboardTableCell>
          <DashboardTableCell>
            <Badge variant="secondary" className="capitalize">{ev.eval_type}</Badge>
          </DashboardTableCell>
          <DashboardTableCell align="center">{ev.max_score}</DashboardTableCell>
          <DashboardTableCell className="text-slate-500">{formatDate(ev.eval_date)}</DashboardTableCell>
          <DashboardTableCell align="center">
            <StatusBadge locked={ev.is_locked} />
          </DashboardTableCell>
          <DashboardTableCell align="center">
            <div className="flex items-center justify-center gap-1">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/dashboard/grades/${ev.id}`}>Voir</Link>
              </Button>
              {!ev.is_locked && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/grades/${ev.id}/entry`}>Saisir</Link>
                </Button>
              )}
            </div>
          </DashboardTableCell>
        </DashboardTableRow>
      )}
    />
  )
}
