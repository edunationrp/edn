'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PromotionSettingsCard } from '@/features/promotions/promotion-settings-card'
import { computePromotionBilan, deletePromotionSession } from '@/lib/actions/promotions'
import type { PromotionAverageRule } from '@/lib/promotions/types'
import { PROMOTION_AVERAGE_RULE_LABELS } from '@/lib/promotions/types'
import { notify } from '@/lib/feedback/toast'
import { Loader2, Play, Trash2, ChevronRight } from 'lucide-react'

type SessionItem = {
  id: string
  label: string | null
  status: string
  passingAverage: number
  averageRule: PromotionAverageRule
  createdAt: string
  sourceYearName: string
}

export function PromotionsHubClient({
  passingAverage,
  averageRule,
  sessions,
  canManage,
}: {
  passingAverage: number
  averageRule: PromotionAverageRule
  sessions: SessionItem[]
  canManage: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function runCompute(recalculateId?: string) {
    startTransition(async () => {
      const result = await computePromotionBilan(
        recalculateId ? { sessionId: recalculateId } : undefined,
      )
      if ('error' in result) {
        notify.error(result.error)
        return
      }
      notify.success('Bilan calculé')
      router.push(`/dashboard/promotions/${result.sessionId}`)
      router.refresh()
    })
  }

  function onDelete(sessionId: string) {
    if (!confirm('Supprimer ce bilan brouillon ?')) return
    startTransition(async () => {
      const result = await deletePromotionSession(sessionId)
      if ('error' in result) {
        notify.error(result.error)
        return
      }
      notify.success('Session supprimée')
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <PromotionSettingsCard
        passingAverage={passingAverage}
        averageRule={averageRule}
        readOnly={!canManage}
      />

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-2">
          <CardTitle className="text-base">Sessions de bilan</CardTitle>
          {canManage && (
            <Button onClick={() => runCompute()} disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span className="ml-2">Calculer le bilan</span>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun bilan pour l&apos;instant. Configurez la moyenne de passage puis lancez un calcul sur
              l&apos;année scolaire active.
            </p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {sessions.map(session => (
                <li
                  key={session.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium truncate">
                      {session.label ?? `Bilan ${session.sourceYearName}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.sourceYearName} · seuil {session.passingAverage}/20 ·{' '}
                      {PROMOTION_AVERAGE_RULE_LABELS[session.averageRule]} ·{' '}
                      {new Date(session.createdAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={session.status === 'draft' ? 'secondary' : 'default'}>
                      {session.status === 'draft' ? 'Simulation' : 'Appliqué'}
                    </Badge>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/promotions/${session.id}`}>
                        Voir
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                    {canManage && session.status === 'draft' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => runCompute(session.id)}
                          disabled={isPending}
                        >
                          Recalculer
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => onDelete(session.id)}
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
