'use client'

import {
  REQUIRED_DOCUMENTS,
  getDefaultDocuments,
  type AdmissionDossierMetadata,
} from '@/lib/admissions/dossier-metadata'
import { AdmissionDocumentField } from '@/features/admissions/admission-document-field'

type Props = {
  schoolId: string
  requestId: string
  meta: AdmissionDossierMetadata
  readOnly?: boolean
  allowValidate?: boolean
}

export function AdmissionDocumentsSection({
  schoolId,
  requestId,
  meta,
  readOnly = false,
  allowValidate = true,
}: Props) {
  const documents = { ...getDefaultDocuments(), ...meta.documents }

  return (
    <div className="space-y-3">
      {REQUIRED_DOCUMENTS.map(key => (
        <AdmissionDocumentField
          key={key}
          schoolId={schoolId}
          requestId={requestId}
          documentKey={key}
          status={documents[key]}
          file={meta.document_files?.[key]}
          readOnly={readOnly}
          allowValidate={allowValidate && !readOnly}
        />
      ))}
    </div>
  )
}
