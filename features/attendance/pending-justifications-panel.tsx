'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { reviewAbsenceJustification } from '@/lib/actions/parent-attendance'

export type PendingJustificationRow = {
  id: string
  reason: string
  status: string
  createdAt: string | null
  studentName: string
  subjectName: string | null
  recordedAt: string
  parentName: string | null
}

export function PendingJustificationsPanel({
  justifications,
}: {
  justifications: PendingJustificationRow[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleReview(justificationId: string, decision: 'approved' | 'rejected') {
    startTransition(async () => {
      await reviewAbsenceJustification({ justificationId, decision })
      router.refresh()
    })
  }

  if (justifications.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Aucune justification en attente.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {justifications.map(item => (
        <Card key={item.id}>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <CardTitle className="text-sm">{item.studentName}</CardTitle>
              <Badge variant="secondary">En attente</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {item.subjectName ?? 'Cours'} · {formatDate(item.recordedAt)}
              {item.parentName ? ` · ${item.parentName}` : ''}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="whitespace-pre-wrap text-sm text-gray-700">{item.reason}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={pending}
                onClick={() => handleReview(item.id, 'approved')}
              >
                Accepter
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => handleReview(item.id, 'rejected')}
              >
                Refuser
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
