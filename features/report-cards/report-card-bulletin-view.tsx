'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BfOfficialV1Bulletin } from '@/features/report-cards/templates/bf-official-v1'
import {
  publishReportCard,
  requestReportCardCorrection,
  validateReportCard,
} from '@/lib/actions/report-cards'
import {
  canProviseurValidate,
  canSecretaryPublish,
  REPORT_CARD_STATUS_LABELS,
  resolveReportCardStatus,
} from '@/lib/report-cards/workflow'
import { notify } from '@/lib/feedback/toast'
import type { BulletinSnapshot } from '@/lib/report-cards/snapshot-types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function ReportCardBulletinView({
  reportCardId,
  snapshot,
  status: rawStatus,
  isPublished,
  canValidate,
  canPublish,
  correctionNote,
}: {
  reportCardId: string
  snapshot: BulletinSnapshot
  status: string | null
  isPublished: boolean
  canValidate: boolean
  canPublish: boolean
  correctionNote: string | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [correctionOpen, setCorrectionOpen] = useState(false)
  const [correctionNoteInput, setCorrectionNoteInput] = useState('')

  const status = resolveReportCardStatus(rawStatus, isPublished)

  function handleValidate() {
    startTransition(async () => {
      const result = await validateReportCard(reportCardId)
      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }
      notify.success('Bulletin validé.')
      router.refresh()
    })
  }

  function handlePublish() {
    startTransition(async () => {
      const result = await publishReportCard(reportCardId)
      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }
      notify.success('Bulletin publié aux familles.')
      router.refresh()
    })
  }

  function handleCorrection() {
    startTransition(async () => {
      const result = await requestReportCardCorrection({
        reportCardId,
        note: correctionNoteInput,
      })
      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }
      setCorrectionOpen(false)
      notify.success('Demande de correction envoyée.')
      router.refresh()
    })
  }

  const showValidate = canValidate && canProviseurValidate(status)
  const showPublish = canPublish && canSecretaryPublish(status)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <Badge variant="outline">{REPORT_CARD_STATUS_LABELS[status]}</Badge>
        {correctionNote && status === 'correction_requested' && (
          <p className="text-sm text-amber-800">
            Motif proviseur : {correctionNote}
          </p>
        )}
      </div>

      <BfOfficialV1Bulletin
        snapshot={snapshot}
        showActions
        onPrint={() => window.print()}
        onDownload={() => window.print()}
        actionsPending={pending}
      />

      {(showValidate || showPublish) && (
        <div className="flex flex-wrap justify-center gap-3 print:hidden">
          {showValidate && (
            <>
              <Button
                variant="outline"
                disabled={pending}
                onClick={() => {
                  setCorrectionNoteInput('')
                  setCorrectionOpen(true)
                }}
              >
                Demander une correction
              </Button>
              <Button
                disabled={pending}
                className="bg-[#1B3A6B] hover:bg-[#1B3A6B]/90"
                onClick={handleValidate}
              >
                Valider ce bulletin
              </Button>
            </>
          )}
          {showPublish && (
            <Button
              disabled={pending}
              className="bg-emerald-700 hover:bg-emerald-800"
              onClick={handlePublish}
            >
              Publier aux familles (PDF)
            </Button>
          )}
        </div>
      )}

      <Dialog open={correctionOpen} onOpenChange={setCorrectionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demander une correction</DialogTitle>
          </DialogHeader>
          <textarea
            value={correctionNoteInput}
            onChange={event => setCorrectionNoteInput(event.target.value)}
            placeholder="Motif de la correction pour ce bulletin uniquement…"
            rows={4}
            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCorrectionOpen(false)}>
              Annuler
            </Button>
            <Button
              disabled={pending || correctionNoteInput.trim().length < 3}
              onClick={handleCorrection}
            >
              Envoyer à la secrétaire
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
