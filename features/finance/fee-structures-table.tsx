'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { FileText, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DashboardDataTable,
  DashboardTableCell,
  DashboardTableRow,
  FilterBar,
  FilterSearch,
  formatListFooter,
  filterBySearch,
} from '@/components/dashboard/data-table'
import { formatCurrency, formatDate } from '@/lib/utils'

export type FeeStructureRow = {
  id: string
  name: string
  amount: number
  is_mandatory: boolean
  due_date: string | null
}

const COLUMNS = [
  { id: 'name', label: 'Frais' },
  { id: 'due', label: 'Échéance' },
  { id: 'amount', label: 'Montant', align: 'right' as const },
  { id: 'mandatory', label: 'Type', align: 'center' as const },
]

export function FeeStructuresTable({ fees }: { fees: FeeStructureRow[] }) {
  const [search, setSearch] = useState('')
  const filtered = useMemo(
    () => filterBySearch(fees, search, f => f.name),
    [fees, search],
  )

  return (
    <DashboardDataTable
      title={`Frais scolaires (${fees.length})`}
      columns={COLUMNS}
      data={filtered}
      keyExtractor={f => f.id}
      toolbar={
        <FilterBar className="border-slate-100 bg-white p-3">
          <FilterSearch value={search} onChange={setSearch} placeholder="Rechercher…" icon={<Search className="h-4 w-4" />} />
          <Button variant="outline" size="sm" className="shrink-0" asChild>
            <Link href="/dashboard/finance/tuition">Configurer</Link>
          </Button>
        </FilterBar>
      }
      footer={formatListFooter(filtered.length, fees.length, !!search)}
      emptyState={{
        icon: <FileText className="h-6 w-6" />,
        title: 'Aucune structure tarifaire',
        action: <Button variant="link" size="sm" asChild><Link href="/dashboard/finance/tuition">Configurer les tarifs</Link></Button>,
      }}
      renderMobileRow={fee => (
        <div className="flex items-start justify-between gap-3 px-4 py-4">
          <div>
            <p className="font-semibold text-slate-900">{fee.name}</p>
            {fee.due_date && (
              <p className="mt-0.5 text-xs text-slate-500">Échéance : {formatDate(fee.due_date)}</p>
            )}
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-900">{formatCurrency(fee.amount)}</p>
            {fee.is_mandatory && (
              <Badge className="mt-1 bg-red-100 text-red-700">Obligatoire</Badge>
            )}
          </div>
        </div>
      )}
      renderDesktopRow={fee => (
        <DashboardTableRow key={fee.id}>
          <DashboardTableCell className="font-semibold text-slate-900">{fee.name}</DashboardTableCell>
          <DashboardTableCell className="text-slate-500">
            {fee.due_date ? formatDate(fee.due_date) : '—'}
          </DashboardTableCell>
          <DashboardTableCell align="right" className="font-bold">
            {formatCurrency(fee.amount)}
          </DashboardTableCell>
          <DashboardTableCell align="center">
            {fee.is_mandatory ? (
              <Badge className="bg-red-100 text-red-700">Obligatoire</Badge>
            ) : (
              <Badge variant="secondary">Optionnel</Badge>
            )}
          </DashboardTableCell>
        </DashboardTableRow>
      )}
    />
  )
}
