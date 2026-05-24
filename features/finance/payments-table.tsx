'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { CreditCard, Search } from 'lucide-react'
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
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'

export type PaymentRow = {
  id: string
  reference: string | null
  amount: number
  payment_method: string
  status: string
  created_at: string
  studentName: string
}

const COLUMNS = [
  { id: 'student', label: 'Élève' },
  { id: 'reference', label: 'Référence' },
  { id: 'amount', label: 'Montant', align: 'right' as const },
  { id: 'status', label: 'Statut' },
  { id: 'date', label: 'Date' },
  { id: 'receipt', label: 'Reçu', align: 'center' as const },
]

type PaymentsTableProps = {
  payments: PaymentRow[]
  embedded?: boolean
}

export function PaymentsTable({ payments, embedded }: PaymentsTableProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    let rows = filterBySearch(payments, search, p =>
      [p.studentName, p.reference, p.payment_method, getStatusLabel(p.status)].filter(Boolean).join(' ')
    )
    if (statusFilter !== 'all') rows = rows.filter(p => p.status === statusFilter)
    return rows
  }, [payments, search, statusFilter])

  const hasFilters = !!search || statusFilter !== 'all'

  return (
    <DashboardDataTable
      title={embedded ? undefined : 'Historique des paiements'}
      columns={COLUMNS}
      data={filtered}
      keyExtractor={p => p.id}
      minWidth="760px"
      toolbar={
        <FilterBar className="border-slate-100 bg-white">
          <FilterSearch
            value={search}
            onChange={setSearch}
            placeholder="Rechercher élève, référence…"
            icon={<Search className="h-4 w-4" />}
          />
          <FilterSelect value={statusFilter} onChange={setStatusFilter} className="w-full sm:w-44">
            <option value="all">Tous les statuts</option>
            <option value="paid">Payé</option>
            <option value="partial">Partiel</option>
            <option value="pending">En attente</option>
            <option value="overdue">En retard</option>
          </FilterSelect>
        </FilterBar>
      }
      footer={formatListFooter(filtered.length, payments.length, hasFilters)}
      emptyState={{
        icon: <CreditCard className="h-6 w-6" />,
        title: hasFilters ? 'Aucun paiement trouvé' : 'Aucun paiement enregistré',
        description: hasFilters ? 'Modifiez la recherche ou les filtres.' : undefined,
      }}
      renderMobileRow={p => (
        <div className="px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{p.studentName}</p>
              <p className="mt-0.5 font-mono text-xs text-slate-500">{p.reference ?? '—'}</p>
            </div>
            <p className="shrink-0 text-sm font-bold text-[#1a4d2e]">{formatCurrency(p.amount)}</p>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
            <Badge className={getStatusColor(p.status)}>{getStatusLabel(p.status)}</Badge>
            <span className="text-xs text-slate-500">{formatDate(p.created_at)}</span>
          </div>
          <Button variant="link" size="sm" className="mt-2 h-auto p-0" asChild>
            <Link href={`/dashboard/finance/payments/${p.id}/receipt`}>Voir le reçu</Link>
          </Button>
        </div>
      )}
      renderDesktopRow={p => (
        <DashboardTableRow key={p.id}>
          <DashboardTableCell>
            <span className="font-semibold text-slate-900">{p.studentName}</span>
          </DashboardTableCell>
          <DashboardTableCell>
            <code className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
              {p.reference ?? '—'}
            </code>
          </DashboardTableCell>
          <DashboardTableCell align="right">
            <span className="font-bold text-[#1a4d2e]">{formatCurrency(p.amount)}</span>
          </DashboardTableCell>
          <DashboardTableCell>
            <Badge className={getStatusColor(p.status)}>{getStatusLabel(p.status)}</Badge>
          </DashboardTableCell>
          <DashboardTableCell className="text-slate-500">{formatDate(p.created_at)}</DashboardTableCell>
          <DashboardTableCell align="center">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/finance/payments/${p.id}/receipt`}>Reçu</Link>
            </Button>
          </DashboardTableCell>
        </DashboardTableRow>
      )}
    />
  )
}
