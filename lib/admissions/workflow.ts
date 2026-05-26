export const ADMISSION_WORKFLOW_STATUSES = [
  'A_COMPLETER',
  'EN_COMPLETION',
  'DOCUMENT_MANQUANT',
  'PRET_VALIDATION',
  'EN_ATTENTE_PROVISEUR',
  'VALIDE',
  'REFUSE',
  'ANNULE',
] as const

export type AdmissionWorkflowStatus = (typeof ADMISSION_WORKFLOW_STATUSES)[number]

export const WORKFLOW_STATUS_LABELS: Record<AdmissionWorkflowStatus, string> = {
  A_COMPLETER: 'À compléter',
  EN_COMPLETION: 'En cours de complétion',
  DOCUMENT_MANQUANT: 'Document manquant',
  PRET_VALIDATION: 'Prêt pour validation',
  EN_ATTENTE_PROVISEUR: 'En attente du proviseur',
  VALIDE: 'Validé',
  REFUSE: 'Refusé',
  ANNULE: 'Annulé',
}

export function getWorkflowStatus(metadata: Record<string, unknown> | null | undefined): AdmissionWorkflowStatus {
  const raw = metadata?.workflow_status
  if (typeof raw === 'string' && (ADMISSION_WORKFLOW_STATUSES as readonly string[]).includes(raw)) {
    return raw as AdmissionWorkflowStatus
  }
  return 'A_COMPLETER'
}

export function isStudentProfileComplete(student: {
  birth_place: string | null
  address?: string | null
  gender: string
}) {
  return Boolean(student.birth_place?.trim() && student.gender)
}
