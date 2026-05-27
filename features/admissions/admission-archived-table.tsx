'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Archive, Eye } from 'lucide-react'
import {
  DashboardDataTable,
  DashboardTableCell,
  DashboardTableRow,
  formatListFooter,
} from '@/components/dashboard/data-table'
import type { ArchivedAdmissionRow } from '@/lib/admissions/queries'
import { formatDate } from '@/lib/utils'

type Props = {
  dossiers: ArchivedAdmissionRow[]
}

const COLUMNS = [
  { id: 'ref', label: 'Référence' },
  { id: 'student', label: 'Élève' },
  { id: 'class', label: 'Classe' },
  { id: 'reason', label: 'Motif' },
  { id: 'date', label: 'Date refus' },
  { id: 'actions', label: 'Actions', align: 'center' as const },
]

export function AdmissionArchivedTable({ dossiers }: Props) {
  return (
    <DashboardDataTable
      columns={COLUMNS}
      data={dossiers}
      keyExtractor={d => d.requestId}
      minWidth="900px"
      footer={formatListFooter(dossiers.length, dossiers.length, false)}
      emptyState={{
        icon: <Archive className="h-6 w-6" />,
        title: 'Aucun dossier refusé',
        description: 'Les admissions refusées définitivement par le proviseur apparaîtront ici.',
      }}
      renderMobileRow={d => (
        <div className="space-y-3 px-4 py-4">
          <div>
            <p className="font-mono text-xs text-slate-500">{d.trackingRef}</p>
            <p className="font-semibold text-slate-900">
              {d.lastName} {d.firstName}
            </p>
            <p className="mt-1 line-clamp-2 text-sm text-slate-600">{d.rejectionReason}</p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/admissions/${d.requestId}`}>Consulter & avis guichet</Link>
          </Button>
        </div>
      )}
      renderDesktopRow={d => (
        <DashboardTableRow key={d.requestId}>
          <DashboardTableCell>
            <span className="font-mono text-xs font-medium text-slate-700">{d.trackingRef}</span>
          </DashboardTableCell>
          <DashboardTableCell>
            <p className="font-semibold text-slate-900">
              {d.lastName} {d.firstName}
            </p>
          </DashboardTableCell>
          <DashboardTableCell className="text-sm text-slate-600">
            {d.className ?? '—'}
          </DashboardTableCell>
          <DashboardTableCell>
            <p className="line-clamp-2 max-w-xs text-sm text-slate-600">{d.rejectionReason}</p>
          </DashboardTableCell>
          <DashboardTableCell className="text-sm text-slate-600">
            {d.rejectedAt ? formatDate(d.rejectedAt) : formatDate(d.createdAt)}
          </DashboardTableCell>
          <DashboardTableCell align="center">
            <Button asChild size="sm" variant="outline">
              <Link href={`/dashboard/admissions/${d.requestId}`}>
                <Eye className="h-4 w-4" />
                Dossier
              </Link>
            </Button>
          </DashboardTableCell>
        </DashboardTableRow>
      )}
    />
  )
}
