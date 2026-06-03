'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, CheckCircle, RotateCcw, GraduationCap, AlertCircle, Percent } from 'lucide-react'
import { KPICard } from '@/components/cards/kpi-card'
import { PromotionStatusBadge } from '@/features/promotions/promotion-status-badge'
import { PromotionApplyPanel } from '@/features/promotions/promotion-apply-panel'
import { overridePromotionResult, computePromotionBilan } from '@/lib/actions/promotions'
import type { PromotionAverageRule, PromotionDecisionStatus } from '@/lib/promotions/types'
import { PROMOTION_AVERAGE_RULE_LABELS, PROMOTION_STATUS_LABELS } from '@/lib/promotions/types'
import type { ClassPromotionSummary } from '@/lib/promotions/class-summary'
import { notify } from '@/lib/feedback/toast'
import { getMention } from '@/lib/grades'
import { ArrowLeft, Loader2, RefreshCw, School } from 'lucide-react'
type StudentRow = {
  id: string
  studentId: string
  sourceClassId: string
  firstName: string
  lastName: string
  iun: string
  className: string
  computedAverage: number | null
  proposedStatus: PromotionDecisionStatus
  finalStatus: PromotionDecisionStatus | 'pending'
  overrideReason: string | null
}

export function PromotionSessionClient({
  session,
  classSummaries,
  classOptions,
  students,
  schoolSummary,
  canManage,
}: {
  session: {
    id: string
    label: string | null
    status: string
    passingAverage: number
    averageRule: PromotionAverageRule
    sourceYearName: string
    targetYearName?: string | null
    structureReady?: boolean
    mappingsReady?: boolean
  }
  classSummaries: ClassPromotionSummary[]
  classOptions: Array<{ id: string; name: string; levelName: string | null }>
  students: StudentRow[]
  schoolSummary: {
    total: number
    admitted: number
    repeat: number
    graduate: number
    incomplete: number
    successRate: number | null
  }
  canManage: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const classFilter = searchParams.get('class') ?? ''
  const [isPending, startTransition] = useTransition()
  const [overrideId, setOverrideId] = useState<string | null>(null)
  const [overrideStatus, setOverrideStatus] = useState<PromotionDecisionStatus>('admitted')
  const [overrideReason, setOverrideReason] = useState('')

  const filteredStudents = useMemo(
    () => (classFilter ? students.filter(s => s.sourceClassId === classFilter) : students),
    [students, classFilter],
  )

  const activeClassSummary = classFilter
    ? classSummaries.find(c => c.classId === classFilter)
    : null

  function setClassFilter(classId: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (classId) params.set('class', classId)
    else params.delete('class')
    router.push(`?${params.toString()}`)
  }

  function recalculate() {
    startTransition(async () => {
      const result = await computePromotionBilan({ sessionId: session.id })
      if ('error' in result) {
        notify.error(result.error)
        return
      }
      notify.success('Bilan recalculé')
      router.refresh()
    })
  }

  function submitOverride(resultId: string) {
    startTransition(async () => {
      const result = await overridePromotionResult({
        resultId,
        finalStatus: overrideStatus,
        reason: overrideReason,
      })
      if ('error' in result) {
        notify.error(result.error)
        return
      }
      notify.success('Décision mise à jour')
      setOverrideId(null)
      router.refresh()
    })
  }

  const displaySummary = activeClassSummary ?? {
    total: schoolSummary.total,
    admitted: schoolSummary.admitted,
    repeat: schoolSummary.repeat,
    graduate: schoolSummary.graduate,
    incomplete: schoolSummary.incomplete,
    successRate: schoolSummary.successRate,
    classAverage: null,
    classId: '',
    className: 'Établissement',
    levelName: null,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/promotions">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Link>
        </Button>
        {canManage && session.status === 'draft' && students.length > 0 && (
          <Button variant="outline" size="sm" onClick={recalculate} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2">Recalculer</span>
          </Button>
        )}
        {canManage && session.status === 'draft' && (
          <Button size="sm" asChild>
            <Link href={`/dashboard/promotions/${session.id}/structure`}>
              <School className="h-4 w-4 mr-1" />
              Préparer la rentrée
              {session.mappingsReady && (
                <span className="ml-1 text-xs opacity-80">✓</span>
              )}
            </Link>
          </Button>
        )}
      </div>

      {session.status === 'applied' ? (
        <PromotionApplyPanel
          sessionId={session.id}
          sessionStatus={session.status}
          mappingsReady={!!session.mappingsReady}
          targetYearName={session.targetYearName ?? null}
          canManage={canManage}
        />
      ) : (
        session.mappingsReady &&
        canManage && (
          <PromotionApplyPanel
            sessionId={session.id}
            sessionStatus={session.status}
            mappingsReady
            targetYearName={session.targetYearName ?? null}
            canManage={canManage}
          />
        )
      )}

      <div>
        <h2 className="text-lg font-semibold">{session.label ?? `Bilan ${session.sourceYearName}`}</h2>
        <p className="text-sm text-muted-foreground">
          {session.sourceYearName}
          {session.targetYearName ? ` → ${session.targetYearName}` : ''} · seuil {session.passingAverage}/20 ·{' '}
          {PROMOTION_AVERAGE_RULE_LABELS[session.averageRule]}
          {session.status === 'draft' ? ' · simulation' : ' · appliqué'}
          {session.structureReady && !session.mappingsReady && session.status === 'draft' && ' · rentrée à mapper'}
          {session.mappingsReady && session.status === 'draft' && ' · prêt à appliquer'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={classFilter === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setClassFilter('')}
        >
          Tout l&apos;établissement
        </Button>
        {classOptions.map(c => (
          <Button
            key={c.id}
            variant={classFilter === c.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setClassFilter(c.id)}
          >
            {c.name}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KPICard title="Effectif" value={String(displaySummary.total)} icon={<Users className="h-4 w-4" />} color="navy" />
        <KPICard title="Admis" value={String(displaySummary.admitted)} icon={<CheckCircle className="h-4 w-4" />} color="green" />
        <KPICard title="Redoublants" value={String(displaySummary.repeat)} icon={<RotateCcw className="h-4 w-4" />} color="orange" />
        <KPICard title="Sortants" value={String(displaySummary.graduate)} icon={<GraduationCap className="h-4 w-4" />} color="teal" />
        <KPICard title="Incomplets" value={String(displaySummary.incomplete)} icon={<AlertCircle className="h-4 w-4" />} color="red" />
        <KPICard
          title="Taux de réussite"
          value={displaySummary.successRate !== null ? `${displaySummary.successRate}%` : '—'}
          icon={<Percent className="h-4 w-4" />}
          color="blue"
        />
      </div>

      {!classFilter && classSummaries.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Bilan par classe</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Classe</th>
                  <th className="py-2 pr-4 text-right font-medium">Effectif</th>
                  <th className="py-2 pr-4 text-right font-medium">Admis</th>
                  <th className="py-2 pr-4 text-right font-medium">Redouble</th>
                  <th className="py-2 pr-4 text-right font-medium">Taux</th>
                  <th className="py-2 pr-4 text-right font-medium">Moy. classe</th>
                  <th className="py-2 text-right font-medium" />
                </tr>
              </thead>
              <tbody>
                {classSummaries.map(row => (
                  <tr key={row.classId} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">
                      {row.className}
                      {row.levelName && (
                        <span className="ml-1 text-xs text-muted-foreground">({row.levelName})</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-right">{row.total}</td>
                    <td className="py-2 pr-4 text-right">{row.admitted + row.graduate}</td>
                    <td className="py-2 pr-4 text-right">{row.repeat}</td>
                    <td className="py-2 pr-4 text-right">
                      {row.successRate !== null ? `${row.successRate}%` : '—'}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      {row.classAverage !== null ? row.classAverage.toFixed(2) : '—'}
                    </td>
                    <td className="py-2 text-right">
                      <Button variant="link" size="sm" asChild>
                        <Link href={`?class=${row.classId}`}>Détail</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {classFilter
              ? `Élèves — ${classOptions.find(c => c.id === classFilter)?.name ?? 'Classe'}`
              : 'Tous les élèves'}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Élève</th>
                <th className="py-2 pr-4 font-medium">IUN</th>
                {!classFilter && <th className="py-2 pr-4 font-medium">Classe</th>}
                <th className="py-2 pr-4 text-right font-medium">Moyenne</th>
                <th className="py-2 pr-4 font-medium">Mention</th>
                <th className="py-2 pr-4 font-medium">Statut</th>
                {canManage && session.status === 'draft' && <th className="py-2 font-medium" />}
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-muted-foreground">
                    Aucun élève pour ce filtre.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(row => {
                  const effective =
                    row.finalStatus === 'pending'
                      ? row.proposedStatus
                      : (row.finalStatus as PromotionDecisionStatus)
                  const isOverridden = row.finalStatus !== row.proposedStatus
                  return (
                    <tr key={row.id} className="border-b last:border-0 align-top">
                      <td className="py-2 pr-4 font-medium">
                        {row.lastName} {row.firstName}
                      </td>
                      <td className="py-2 pr-4 text-xs text-muted-foreground">{row.iun}</td>
                      {!classFilter && <td className="py-2 pr-4">{row.className}</td>}
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {row.computedAverage !== null ? row.computedAverage.toFixed(2) : '—'}
                      </td>
                      <td className="py-2 pr-4 text-xs">
                        {row.computedAverage !== null ? getMention(row.computedAverage) : '—'}
                      </td>
                      <td className="py-2 pr-4">
                        <PromotionStatusBadge status={effective} />
                        {isOverridden && (
                          <p className="mt-1 text-[10px] text-muted-foreground">Décision manuelle</p>
                        )}
                      </td>
                      {canManage && session.status === 'draft' && (
                        <td className="py-2 text-right">
                          {overrideId === row.id ? (
                            <div className="flex flex-col items-end gap-2 min-w-[200px]">
                              <select
                                value={overrideStatus}
                                onChange={e =>
                                  setOverrideStatus(e.target.value as PromotionDecisionStatus)
                                }
                                className="h-9 w-full rounded-md border px-2 text-sm"
                              >
                                {(Object.keys(PROMOTION_STATUS_LABELS) as PromotionDecisionStatus[]).map(
                                  key => (
                                    <option key={key} value={key}>
                                      {PROMOTION_STATUS_LABELS[key]}
                                    </option>
                                  ),
                                )}
                              </select>
                              <input
                                placeholder="Motif (optionnel)"
                                value={overrideReason}
                                onChange={e => setOverrideReason(e.target.value)}
                                className="h-9 w-full rounded-md border px-2 text-sm"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => submitOverride(row.id)}
                                  disabled={isPending}
                                >
                                  OK
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setOverrideId(null)}>
                                  Annuler
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => {
                              setOverrideId(row.id)
                              setOverrideStatus(effective)
                              setOverrideReason(row.overrideReason ?? '')
                            }}>
                              Corriger
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
