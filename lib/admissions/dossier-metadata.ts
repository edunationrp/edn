import type { AdmissionWorkflowStatus } from '@/lib/admissions/workflow'

export const REQUIRED_DOCUMENTS = [
  'birth_certificate',
  'student_photo',
  'parent_id',
] as const

export type DocumentKey = (typeof REQUIRED_DOCUMENTS)[number]
export type DocumentStatus = 'missing' | 'deposed' | 'validated'

export type AdmissionDocumentFile = {
  path: string
  url: string
  name: string
  mime: string
  size: number
  uploaded_at: string
}

export type AdmissionDossierMetadata = {
  workflow_status?: AdmissionWorkflowStatus
  created_by_role?: string
  first_name?: string
  last_name?: string
  birth_date?: string
  birth_place?: string
  gender?: 'M' | 'F'
  nationality?: string
  address?: string
  class_id?: string | null
  class_name?: string | null
  parent_first_name?: string
  parent_last_name?: string
  parent_phone?: string
  documents?: Partial<Record<DocumentKey, DocumentStatus>>
  document_files?: Partial<Record<DocumentKey, AdmissionDocumentFile>>
  submitted_by?: string
  submitted_at?: string
  return_comment?: string
  returned_at?: string
  rejection_reason?: string
  rejected_at?: string
  decided_at?: string
  tracking_ref?: string
}

export const DOCUMENT_LABELS: Record<DocumentKey, string> = {
  birth_certificate: 'Acte de naissance (PDF)',
  student_photo: 'Photo d\'identité (JPG/PNG)',
  parent_id: 'Pièce d\'identité du parent (PDF)',
}

export function getDefaultDocuments(): Record<DocumentKey, DocumentStatus> {
  return {
    birth_certificate: 'missing',
    student_photo: 'missing',
    parent_id: 'missing',
  }
}

export function parseDossierMetadata(raw: Record<string, unknown> | null | undefined): AdmissionDossierMetadata {
  if (!raw || typeof raw !== 'object') return {}
  return raw as AdmissionDossierMetadata
}

export function isDossierIdentityComplete(meta: AdmissionDossierMetadata) {
  return Boolean(
    meta.first_name?.trim() &&
      meta.last_name?.trim() &&
      meta.birth_date &&
      meta.birth_place?.trim() &&
      meta.gender &&
      meta.class_id
  )
}

export function hasDocument(meta: AdmissionDossierMetadata, key: DocumentKey) {
  const file = meta.document_files?.[key]
  if (!file?.url) return false
  if (key === 'student_photo') {
    return (
      file.mime.startsWith('image/')
      || /\.(jpe?g|png|webp)$/i.test(file.name)
    )
  }
  return file.mime === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

export function hasPdfDocument(meta: AdmissionDossierMetadata, key: DocumentKey) {
  return hasDocument(meta, key) && key !== 'student_photo'
}

export function areDocumentsComplete(meta: AdmissionDossierMetadata) {
  const docs = { ...getDefaultDocuments(), ...meta.documents }
  return REQUIRED_DOCUMENTS.every(
    key => hasDocument(meta, key) && docs[key] === 'validated'
  )
}

export function canSubmitToProviseur(meta: AdmissionDossierMetadata) {
  return isDossierIdentityComplete(meta) && areDocumentsComplete(meta)
}

/** Après renvoi proviseur : les pièces validées doivent être revérifiées si modifiées. */
export function resetDocumentsAfterReturn(meta: AdmissionDossierMetadata) {
  const docs = { ...getDefaultDocuments(), ...meta.documents }
  for (const key of REQUIRED_DOCUMENTS) {
    if (docs[key] === 'validated') {
      docs[key] = 'deposed'
    }
  }
  return docs
}

export function isReturnedForCorrection(meta: AdmissionDossierMetadata) {
  return Boolean(meta.return_comment?.trim())
}
