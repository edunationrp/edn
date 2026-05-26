'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { FileText, Loader2, Upload, CheckCircle, ExternalLink } from 'lucide-react'
import {
  DOCUMENT_LABELS,
  type AdmissionDocumentFile,
  type DocumentKey,
  type DocumentStatus,
} from '@/lib/admissions/dossier-metadata'
import { uploadAdmissionDocumentPdf } from '@/lib/admissions/upload'
import { registerAdmissionDocument, validateAdmissionDocument } from '@/lib/actions/admissions'
import { notify } from '@/lib/feedback/toast'

type Props = {
  schoolId: string
  requestId: string
  documentKey: DocumentKey
  status: DocumentStatus
  file?: AdmissionDocumentFile
  readOnly?: boolean
  allowValidate?: boolean
}

export function AdmissionDocumentField({
  schoolId,
  requestId,
  documentKey,
  status,
  file,
  readOnly,
  allowValidate = true,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleUpload(selected: File | null) {
    if (!selected || readOnly) return

    startTransition(async () => {
      const uploaded = await uploadAdmissionDocumentPdf(schoolId, requestId, documentKey, selected)
      if ('error' in uploaded) {
        notify.error(uploaded.error)
        return
      }

      const result = await registerAdmissionDocument(requestId, documentKey, {
        path: uploaded.path,
        url: uploaded.url,
        name: uploaded.name,
        mime: uploaded.mime,
        size: uploaded.size,
        uploaded_at: uploaded.uploadedAt,
      })

      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }

      notify.success(`${DOCUMENT_LABELS[documentKey]} enregistré`)
      router.refresh()
    })
  }

  function handleValidate() {
    startTransition(async () => {
      const result = await validateAdmissionDocument(requestId, documentKey)
      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }
      notify.success('Pièce validée')
      router.refresh()
    })
  }

  const statusLabel =
    status === 'validated' ? 'Validé' : status === 'deposed' ? 'PDF déposé' : 'Manquant'

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{DOCUMENT_LABELS[documentKey]}</p>
          <p className={`text-xs mt-0.5 ${status === 'validated' ? 'text-green-600' : status === 'deposed' ? 'text-amber-600' : 'text-slate-500'}`}>
            {statusLabel}
          </p>
          {file?.name && (
            <p className="text-xs text-slate-500 mt-1 truncate max-w-[260px]">{file.name}</p>
          )}
        </div>
        {file?.url && (
          <Button asChild size="sm" variant="outline">
            <a href={file.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              Voir le PDF
            </a>
          </Button>
        )}
      </div>

      {file?.url && (
        <div className="overflow-hidden rounded-md border bg-slate-50">
          <iframe
            title={DOCUMENT_LABELS[documentKey]}
            src={file.url}
            className="h-64 w-full"
          />
        </div>
      )}

      {!readOnly && (
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={e => {
              handleUpload(e.target.files?.[0] ?? null)
              e.target.value = ''
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => inputRef.current?.click()}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {file ? 'Remplacer le PDF' : 'Téléverser PDF'}
          </Button>
          {allowValidate && file && status !== 'validated' && (
            <Button type="button" size="sm" disabled={isPending} onClick={handleValidate}>
              <CheckCircle className="h-4 w-4" />
              Valider la pièce
            </Button>
          )}
        </div>
      )}

      {readOnly && !file?.url && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <FileText className="h-4 w-4" />
          Aucun PDF téléversé
        </div>
      )}
    </div>
  )
}
