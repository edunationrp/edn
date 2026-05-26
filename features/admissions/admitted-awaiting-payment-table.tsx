'use client'

import Link from 'next/link'
import { Wallet } from 'lucide-react'
import {
  DashboardDataTable,
  DashboardTableCell,
  DashboardTableRow,
  formatListFooter,
} from '@/components/dashboard/data-table'
import { Button } from '@/components/ui/button'
import { formatDate, getInitials } from '@/lib/utils'

type Row = {
  studentId: string
  iun: string
  firstName: string
  lastName: string
  createdAt: string
  className: string | null
}

const COLUMNS = [
  { id: 'student', label: 'Élève' },
  { id: 'class', label: 'Classe' },
  { id: 'date', label: 'Admis le' },
  { id: 'actions', label: 'Actions', align: 'center' as const },
]

export function AdmittedAwaitingPaymentTable({
  students,
  canRecordPayment,
}: {
  students: Row[]
  canRecordPayment: boolean
}) {
  return (
    <DashboardDataTable
      columns={COLUMNS}
      data={students}
      keyExtractor={s => s.studentId}
      minWidth="680px"
      footer={formatListFooter(students.length, students.length, false)}
      emptyState={{
        icon: <Wallet className="h-6 w-6" />,
        title: 'Aucun nouveau admis à encaisser',
        description: 'Les élèves fraîchement validés par le proviseur apparaîtront ici jusqu\'au premier encaissement.',
      }}
      renderMobileRow={student => (
        <div className="space-y-3 px-4 py-4">
          <p className="font-semibold text-slate-900">
            {student.lastName} {student.firstName}
          </p>
          <p className="text-xs text-slate-500">{student.className ?? 'Classe non assignée'}</p>
          {canRecordPayment && (
            <Button asChild size="sm">
              <Link href={`/dashboard/finance/payments/new?studentId=${student.studentId}`}>
                Enregistrer paiement
              </Link>
            </Button>
          )}
        </div>
      )}
      renderDesktopRow={student => (
        <DashboardTableRow key={student.studentId}>
          <DashboardTableCell>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EDF7E3] text-xs font-bold text-[#5F941F]">
                {getInitials(`${student.firstName} ${student.lastName}`)}
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  {student.lastName} {student.firstName}
                </p>
                <p className="text-xs text-slate-500">{student.iun}</p>
              </div>
            </div>
          </DashboardTableCell>
          <DashboardTableCell>{student.className ?? '—'}</DashboardTableCell>
          <DashboardTableCell className="text-sm text-slate-600">
            {formatDate(student.createdAt)}
          </DashboardTableCell>
          <DashboardTableCell align="center">
            {canRecordPayment ? (
              <Button asChild size="sm" variant="outline">
                <Link href={`/dashboard/finance/payments/new?studentId=${student.studentId}`}>
                  Encaisser
                </Link>
              </Button>
            ) : (
              <span className="text-xs text-slate-500">En attente caisse</span>
            )}
          </DashboardTableCell>
        </DashboardTableRow>
      )}
    />
  )
}
