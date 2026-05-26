'use client'

import { Badge } from '@/components/ui/badge'
import { UserCheck } from 'lucide-react'
import {
  DashboardDataTable,
  DashboardTableCell,
  DashboardTableRow,
  formatListFooter,
} from '@/components/dashboard/data-table'
import { AdmissionDecisionActions } from '@/features/admissions/admission-decision-actions'
import { AdmissionSecretaryActions } from '@/features/admissions/admission-secretary-actions'
import { WORKFLOW_STATUS_LABELS, type AdmissionWorkflowStatus } from '@/lib/admissions/workflow'
import { formatDate, getInitials } from '@/lib/utils'

export type AdmissionQueueRow = {
  requestId: string
  studentId: string
  iun: string
  firstName: string
  lastName: string
  birthDate: string
  createdAt: string
  workflowStatus: AdmissionWorkflowStatus
  className: string | null
  channel: string
}

type AdmissionQueueTableProps = {
  dossiers: AdmissionQueueRow[]
  mode: 'secretary' | 'proviseur'
}

const COLUMNS_SECRETARY = [
  { id: 'student', label: 'Élève' },
  { id: 'class', label: 'Classe' },
  { id: 'status', label: 'Statut dossier' },
  { id: 'actions', label: 'Actions', align: 'center' as const },
]

const COLUMNS_PROVISEUR = [
  { id: 'student', label: 'Élève' },
  { id: 'class', label: 'Classe' },
  { id: 'status', label: 'Statut' },
  { id: 'actions', label: 'Décision', align: 'center' as const },
]

export function AdmissionQueueTable({ dossiers, mode }: AdmissionQueueTableProps) {
  const columns = mode === 'secretary' ? COLUMNS_SECRETARY : COLUMNS_PROVISEUR

  return (
    <DashboardDataTable
      columns={columns}
      data={dossiers}
      keyExtractor={d => d.requestId}
      minWidth="760px"
      footer={formatListFooter(dossiers.length, dossiers.length, false)}
      emptyState={{
        icon: <UserCheck className="h-6 w-6" />,
        title: mode === 'secretary' ? 'Aucun dossier à traiter' : 'Aucune décision en attente',
        description:
          mode === 'secretary'
            ? 'Les nouvelles demandes du proviseur apparaîtront ici.'
            : 'Les dossiers soumis par le secrétariat apparaîtront ici.',
      }}
      renderMobileRow={dossier => (
        <div className="space-y-3 px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDF7E3] text-xs font-bold text-[#5F941F]">
              {getInitials(`${dossier.firstName} ${dossier.lastName}`)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900">
                {dossier.lastName} {dossier.firstName}
              </p>
              <p className="text-xs text-slate-500">{dossier.iun} · {formatDate(dossier.birthDate)}</p>
              <Badge variant="secondary" className="mt-2">
                {WORKFLOW_STATUS_LABELS[dossier.workflowStatus]}
              </Badge>
            </div>
          </div>
          {mode === 'secretary' ? (
            <AdmissionSecretaryActions
              requestId={dossier.requestId}
              workflowStatus={dossier.workflowStatus}
              studentId={dossier.studentId}
            />
          ) : (
            <AdmissionDecisionActions requestId={dossier.requestId} studentId={dossier.studentId} />
          )}
        </div>
      )}
      renderDesktopRow={dossier => (
        <DashboardTableRow key={dossier.requestId}>
          <DashboardTableCell>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EDF7E3] text-xs font-bold text-[#5F941F]">
                {getInitials(`${dossier.firstName} ${dossier.lastName}`)}
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  {dossier.lastName} {dossier.firstName}
                </p>
                <p className="text-xs text-slate-500">{dossier.iun}</p>
              </div>
            </div>
          </DashboardTableCell>
          <DashboardTableCell className="text-sm text-slate-600">
            {dossier.className ?? '—'}
          </DashboardTableCell>
          <DashboardTableCell>
            <Badge variant="secondary">{WORKFLOW_STATUS_LABELS[dossier.workflowStatus]}</Badge>
          </DashboardTableCell>
          <DashboardTableCell align="center">
            {mode === 'secretary' ? (
              <AdmissionSecretaryActions
                requestId={dossier.requestId}
                workflowStatus={dossier.workflowStatus}
                studentId={dossier.studentId}
              />
            ) : (
              <AdmissionDecisionActions requestId={dossier.requestId} studentId={dossier.studentId} />
            )}
          </DashboardTableCell>
        </DashboardTableRow>
      )}
    />
  )
}
