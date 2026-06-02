'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { notify } from '@/lib/feedback/toast'
import { submitSuspensionAppeal } from '@/lib/actions/suspension-appeals'

export function SuspensionAppealForm({ schoolId }: { schoolId?: string | null }) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState('')

  function onSubmit() {
    if (!message.trim()) {
      notify.error('Explique brièvement votre demande.')
      return
    }
    startTransition(async () => {
      const result = await submitSuspensionAppeal(message, schoolId)
      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }
      setMessage('')
      notify.success('Demande envoyée à la super administration')
    })
  }

  return (
    <div className="space-y-3 rounded-xl border bg-white p-4">
      <p className="text-sm font-semibold text-slate-900">Demander l&apos;annulation de la suspension</p>
      <textarea
        className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        placeholder="Expliquez pourquoi la suspension doit être levée..."
        value={message}
        onChange={e => setMessage(e.target.value)}
      />
      <div className="flex justify-end">
        <Button type="button" onClick={onSubmit} loading={isPending}>
          Envoyer la demande
        </Button>
      </div>
    </div>
  )
}
