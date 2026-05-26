'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserCheck } from 'lucide-react'
import { decideAdmission, returnAdmissionForCorrection } from '@/lib/actions/admissions'
import { notify } from '@/lib/feedback/toast'

type Props = {
  requestId: string
  studentId: string
}

export function AdmissionDecisionActions({ requestId, studentId }: Props) {
  const [isPending, startTransition] = useTransition()
  const [showReturn, setShowReturn] = useState(false)
  const [comment, setComment] = useState('')
  const router = useRouter()

  function decide(decision: 'active' | 'rejected') {
    startTransition(async () => {
      const result = await decideAdmission(requestId, studentId, decision)
      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }
      notify.success(decision === 'active' ? 'Admission validée' : 'Admission refusée')
      router.refresh()
    })
  }

  function returnForCorrection() {
    startTransition(async () => {
      const result = await returnAdmissionForCorrection(requestId, comment)
      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }
      notify.success('Dossier renvoyé au secrétariat')
      setShowReturn(false)
      setComment('')
      router.refresh()
    })
  }

  if (showReturn) {
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Motif de retour…"
          className="h-8 text-sm"
        />
        <Button size="sm" variant="outline" disabled={isPending} onClick={() => setShowReturn(false)}>
          Annuler
        </Button>
        <Button size="sm" disabled={isPending} onClick={returnForCorrection}>
          Renvoyer
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button
        size="sm"
        variant="outline"
        className="text-red-600"
        disabled={isPending}
        onClick={() => decide('rejected')}
      >
        Refuser
      </Button>
      <Button size="sm" variant="outline" disabled={isPending} onClick={() => setShowReturn(true)}>
        Corriger
      </Button>
      <Button
        size="sm"
        className="bg-green-600 hover:bg-green-700"
        disabled={isPending}
        onClick={() => decide('active')}
      >
        <UserCheck className="h-4 w-4" />
        Valider
      </Button>
    </div>
  )
}
