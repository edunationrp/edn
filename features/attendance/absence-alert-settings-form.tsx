'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateAbsenceAlertSettings } from '@/lib/actions/attendance-alerts'
import { notify } from '@/lib/feedback/toast'
import type { AbsenceAlertConfig } from '@/lib/attendance/absence-alerts'

type AbsenceAlertSettingsFormProps = {
  initial: AbsenceAlertConfig
  canEdit: boolean
}

export function AbsenceAlertSettingsForm({ initial, canEdit }: AbsenceAlertSettingsFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [threshold, setThreshold] = useState(String(initial.threshold))
  const [windowDays, setWindowDays] = useState(String(initial.windowDays))

  function handleSave() {
    startTransition(async () => {
      const result = await updateAbsenceAlertSettings({
        threshold: Number(threshold),
        windowDays: Number(windowDays),
      })
      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }
      notify.success('Seuil d\'alerte enregistré')
      router.refresh()
    })
  }

  if (!canEdit) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Paramètres du seuil</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Seuil actuel : <strong>{initial.threshold}</strong> absences non justifiées sur{' '}
          <strong>{initial.windowDays}</strong> jours.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Paramètres du seuil</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="alert-threshold">Nombre d&apos;absences non justifiées</Label>
          <Input
            id="alert-threshold"
            type="number"
            min={1}
            max={50}
            value={threshold}
            onChange={e => setThreshold(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="alert-window">Période (jours)</Label>
          <Input
            id="alert-window"
            type="number"
            min={7}
            max={180}
            value={windowDays}
            onChange={e => setWindowDays(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="button" size="sm" disabled={isPending} onClick={handleSave}>
            {isPending ? 'Enregistrement…' : 'Enregistrer le seuil'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
