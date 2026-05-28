'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import { submitAbsenceJustification } from '@/lib/actions/parent-attendance'
import type { ParentAbsenceRecord } from '@/lib/parent/attendance'

const JUSTIFICATION_LABELS: Record<string, string> = {
  pending: 'En attente',
  approved: 'Acceptée',
  rejected: 'Refusée',
}

function justificationVariant(status: string) {
  if (status === 'approved') return 'default' as const
  if (status === 'rejected') return 'destructive' as const
  return 'secondary' as const
}

type Props = {
  records: ParentAbsenceRecord[]
  childName: string
}

export function ParentAbsencesView({ records, childName }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [selectedRecord, setSelectedRecord] = useState<ParentAbsenceRecord | null>(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const absences = records.filter(record => record.status === 'absent').length
  const lates = records.filter(record => record.status === 'late').length

  function openJustification(record: ParentAbsenceRecord) {
    setSelectedRecord(record)
    setReason(record.justification?.status === 'rejected' ? '' : record.justification?.reason ?? '')
    setError('')
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!selectedRecord) return

    startTransition(async () => {
      const result = await submitAbsenceJustification({
        attendanceRecordId: selectedRecord.id,
        reason,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      setSelectedRecord(null)
      setReason('')
      router.refresh()
    })
  }

  function canJustify(record: ParentAbsenceRecord) {
    if (!record.justification) return true
    if (record.justification.status === 'rejected') return true
    return false
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <span className="text-2xl font-bold text-red-500">{absences}</span>
            <span className="text-sm text-muted-foreground">Absences</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <span className="text-2xl font-bold text-orange-500">{lates}</span>
            <span className="text-sm text-muted-foreground">Retards</span>
          </CardContent>
        </Card>
      </div>

      {records.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune absence enregistrée.</p>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Historique — {childName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {records.map(record => (
              <div
                key={record.id}
                className="rounded-lg border border-slate-100 bg-white px-3 py-3"
              >
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-800">
                      {record.subjectName ?? 'Cours'}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(record.recordedAt)}</p>
                  </div>
                  <Badge variant={record.status === 'absent' ? 'destructive' : 'secondary'}>
                    {record.status === 'absent' ? 'Absent' : 'Retard'}
                  </Badge>
                </div>

                {record.justification && (
                  <div className="mt-2 space-y-1 rounded-md bg-slate-50 px-2.5 py-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-700">Justification</span>
                      <Badge variant={justificationVariant(record.justification.status)}>
                        {JUSTIFICATION_LABELS[record.justification.status]}
                      </Badge>
                    </div>
                    <p className="text-slate-600">{record.justification.reason}</p>
                  </div>
                )}

                {canJustify(record) && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => openJustification(record)}
                  >
                    {record.justification?.status === 'rejected'
                      ? 'Soumettre une nouvelle justification'
                      : 'Justifier cette absence'}
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={Boolean(selectedRecord)} onOpenChange={open => !open && setSelectedRecord(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Justifier l&apos;absence</DialogTitle>
            <DialogDescription>
              {selectedRecord && (
                <>
                  {selectedRecord.subjectName ?? 'Cours'} — {formatDate(selectedRecord.recordedAt)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="justification-reason">Motif</Label>
              <textarea
                id="justification-reason"
                value={reason}
                onChange={event => setReason(event.target.value)}
                rows={4}
                required
                minLength={10}
                placeholder="Ex. Certificat médical, raison familiale…"
                className={cn(
                  'flex min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
                  'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                )}
              />
              <p className="text-[11px] text-muted-foreground">
                La secrétaire ou la vie scolaire examinera votre demande.
              </p>
            </div>

            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setSelectedRecord(null)}>
                Annuler
              </Button>
              <Button type="submit" disabled={pending} className="bg-[#1B3A6B] hover:bg-[#1B3A6B]/90">
                {pending ? 'Envoi…' : 'Envoyer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
