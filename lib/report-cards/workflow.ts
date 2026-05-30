export type ReportCardWorkflowStatus =
  | 'draft'
  | 'generated'
  | 'correction_requested'
  | 'validated'
  | 'published'
  | 'archived'

export const REPORT_CARD_STATUS_LABELS: Record<ReportCardWorkflowStatus, string> = {
  draft: 'Brouillon',
  generated: 'En attente validation',
  correction_requested: 'Correction demandée',
  validated: 'Validé — prêt à publier',
  published: 'Publié aux familles',
  archived: 'Archivé',
}

export function resolveReportCardStatus(
  status: string | null | undefined,
  isPublished: boolean | null | undefined,
): ReportCardWorkflowStatus {
  if (isPublished || status === 'published') return 'published'
  if (status && status in REPORT_CARD_STATUS_LABELS) {
    return status as ReportCardWorkflowStatus
  }
  return 'draft'
}

export function canProviseurValidate(status: ReportCardWorkflowStatus) {
  return status === 'generated' || status === 'correction_requested'
}

export function canSecretaryPublish(status: ReportCardWorkflowStatus) {
  return status === 'validated'
}
