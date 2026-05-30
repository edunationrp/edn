'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { CheckCircle, Loader2, MessageSquareWarning } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { notify } from '@/lib/feedback/toast'
import {
  requestReportCardCorrection,
  validateReportCard,
  type ReportCardQueueItem,
} from '@/lib/actions/report-cards'
import { REPORT_CARD_STATUS_LABELS } from '@/lib/report-cards/workflow'

export function ReportCardValidationPanel({
  items,
}: {
  items: ReportCardQueueItem[]
}) {
  const [pending, startTransition] = useTransition()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [correctionOpen, setCorrectionOpen] = useState(false)
  const [correctionTarget, setCorrectionTarget] = useState<ReportCardQueueItem | null>(null)
  const [correctionNote, setCorrectionNote] = useState('')

  if (items.length === 0) return null

  function handleValidate(id: string) {
    setActiveId(id)
    startTransition(async () => {
      const result = await validateReportCard(id)
      setActiveId(null)
      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }
      notify.success('Bulletin validé — la secrétaire peut le publier.')
      window.location.reload()
    })
  }

  function openCorrection(item: ReportCardQueueItem) {
    setCorrectionTarget(item)
    setCorrectionNote('')
    setCorrectionOpen(true)
  }

  function submitCorrection() {
    if (!correctionTarget) return
    startTransition(async () => {
      const result = await requestReportCardCorrection({
        reportCardId: correctionTarget.id,
        note: correctionNote,
      })
      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }
      setCorrectionOpen(false)
      notify.success('Demande de correction envoyée à la secrétaire.')
      window.location.reload()
    })
  }

  return (
    <>
      <Card className="border-[#1B3A6B]/20 bg-[#EEF3FA]/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#1B3A6B]">
            Bulletins à valider ({items.length})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Visualisez chaque bulletin, validez-le ou demandez une correction individuelle.
            Aucun envoi aux familles tant que vous n&apos;avez pas validé.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map(item => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white bg-white px-4 py-3 shadow-sm"
            >
              <div className="min-w-0 space-y-1">
                <p className="font-medium text-gray-900">{item.studentName}</p>
                <p className="text-sm text-muted-foreground">
                  {item.term}
                  {item.average !== null && ` · Moy. ${item.average.toFixed(2)}/20`}
                </p>
                {item.correctionNote && (
                  <p className="text-xs text-amber-800">Motif précédent : {item.correctionNote}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{REPORT_CARD_STATUS_LABELS[item.status]}</Badge>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/dashboard/report-cards/${item.id}`}>Visualiser</Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => openCorrection(item)}
                >
                  <MessageSquareWarning className="mr-1.5 h-4 w-4" />
                  Correction
                </Button>
                <Button
                  size="sm"
                  disabled={pending && activeId === item.id}
                  className="bg-[#1B3A6B] hover:bg-[#1B3A6B]/90"
                  onClick={() => handleValidate(item.id)}
                >
                  {pending && activeId === item.id ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-1.5 h-4 w-4" />
                  )}
                  Valider
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={correctionOpen} onOpenChange={setCorrectionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demander une correction</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {correctionTarget?.studentName} · {correctionTarget?.term}
          </p>
          <textarea
            value={correctionNote}
            onChange={event => setCorrectionNote(event.target.value)}
            placeholder="Précisez ce qui doit être corrigé sur ce bulletin uniquement…"
            rows={4}
            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCorrectionOpen(false)}>
              Annuler
            </Button>
            <Button disabled={pending || correctionNote.trim().length < 3} onClick={submitCorrection}>
              Envoyer à la secrétaire
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
