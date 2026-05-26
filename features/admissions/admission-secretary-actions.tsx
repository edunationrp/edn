'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { FileEdit, Send } from 'lucide-react'
import { markAdmissionReady, submitAdmissionForValidation } from '@/lib/actions/admissions'
import type { AdmissionWorkflowStatus } from '@/lib/admissions/workflow'
import { notify } from '@/lib/feedback/toast'

type Props = {
  requestId: string
  workflowStatus: AdmissionWorkflowStatus
}

export function AdmissionSecretaryActions({ requestId, workflowStatus }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function markReady() {
    startTransition(async () => {
      const result = await markAdmissionReady(requestId)
      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }
      notify.success('Dossier marqué prêt pour validation')
      router.refresh()
    })
  }

  function submit() {
    startTransition(async () => {
      const result = await submitAdmissionForValidation(requestId)
      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }
      notify.success('Dossier transmis au proviseur')
      router.refresh()
    })
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button asChild size="sm" variant="outline">
        <Link href={`/dashboard/admissions/${requestId}`}>
          <FileEdit className="h-4 w-4" />
          Compléter le dossier
        </Link>
      </Button>
      {workflowStatus !== 'PRET_VALIDATION' && workflowStatus !== 'EN_ATTENTE_PROVISEUR' && (
        <Button size="sm" variant="secondary" disabled={isPending} onClick={markReady}>
          Marquer prêt
        </Button>
      )}
      {workflowStatus === 'PRET_VALIDATION' && (
        <Button size="sm" disabled={isPending} onClick={submit}>
          <Send className="h-4 w-4" />
          Soumettre au proviseur
        </Button>
      )}
    </div>
  )
}
