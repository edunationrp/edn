'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Lock } from 'lucide-react'
import { lockEvaluation } from '@/lib/actions/grades'
import { notify } from '@/lib/feedback/toast'
import { formatDate } from '@/lib/utils'

type Evaluation = {
  id: string
  title: string
  eval_type: string
  eval_date: string
  is_locked: boolean
}

export function GradesValidateClient({ evaluations }: { evaluations: Evaluation[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const pending = evaluations.filter(e => !e.is_locked)
  const locked = evaluations.filter(e => e.is_locked)

  function handleLock(id: string) {
    startTransition(async () => {
      const result = await lockEvaluation(id)
      if (result.error) {
        notify.error(result.error, 'grades_lock')
        return
      }
      notify.success('Évaluation verrouillée')
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {pending.length === 0 ? (
        <p className="rounded-xl border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
          Toutes les évaluations sont verrouillées ou aucune évaluation n&apos;existe encore.
        </p>
      ) : (
        <div className="space-y-2">
          {pending.map(ev => (
            <div key={ev.id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium text-sm">{ev.title}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {ev.eval_type} · {formatDate(ev.eval_date)}
                </p>
              </div>
              <Button size="sm" variant="outline" disabled={isPending} onClick={() => handleLock(ev.id)} className="w-full sm:w-auto">
                <Lock className="h-4 w-4 mr-1" />
                Verrouiller
              </Button>
            </div>
          ))}
        </div>
      )}

      {locked.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Déjà verrouillées</p>
          {locked.map(ev => (
            <div key={ev.id} className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50/50 px-4 py-3">
              <div>
                <p className="text-sm font-medium">{ev.title}</p>
                <p className="text-xs text-muted-foreground">{formatDate(ev.eval_date)}</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Verrouillée</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
