'use client'

import { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { approveLinkRequest, rejectLinkRequest } from '@/lib/actions/parent-link'
import { useRouter } from 'next/navigation'

export function LinkRequestActions({ requestId }: { requestId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleApprove() {
    setLoading('approve')
    setError('')
    const result = await approveLinkRequest(requestId)
    setLoading(null)
    if (result.error) { setError(result.error); return }
    setDone(true)
    router.refresh()
  }

  async function handleReject() {
    setLoading('reject')
    setError('')
    const result = await rejectLinkRequest(requestId)
    setLoading(null)
    if (result.error) { setError(result.error); return }
    setDone(true)
    router.refresh()
  }

  if (done) {
    return <span className="text-xs text-muted-foreground">Traité</span>
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button
        size="sm"
        onClick={handleApprove}
        disabled={loading !== null}
        className="gap-1.5 bg-green-600 hover:bg-green-700"
      >
        <CheckCircle className="h-4 w-4" />
        {loading === 'approve' ? 'Traitement…' : 'Approuver'}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={handleReject}
        disabled={loading !== null}
        className="gap-1.5 text-destructive hover:text-destructive"
      >
        <XCircle className="h-4 w-4" />
        {loading === 'reject' ? 'Traitement…' : 'Refuser'}
      </Button>
    </div>
  )
}
