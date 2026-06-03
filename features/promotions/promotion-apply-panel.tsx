'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { applyPromotionSession, getPromotionApplyPreview } from '@/lib/actions/promotion-apply'
import { notify } from '@/lib/feedback/toast'
import { AlertTriangle, CheckCircle2, Loader2, PlayCircle } from 'lucide-react'

type PreviewSummary = {
  enrollCount: number
  graduateCount: number
  repeatCount: number
  admittedCount: number
  incompleteCount: number
  errorCount: number
  canApply: boolean
  blockers: string[]
}

export function PromotionApplyPanel({
  sessionId,
  sessionStatus,
  mappingsReady,
  targetYearName,
  canManage,
}: {
  sessionId: string
  sessionStatus: string
  mappingsReady: boolean
  targetYearName: string | null
  canManage: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [summary, setSummary] = useState<PreviewSummary | null>(null)
  const [targetYear, setTargetYear] = useState(targetYearName)

  const isApplied = sessionStatus === 'applied'
  const editable = canManage && !isApplied

  useEffect(() => {
    if (!mappingsReady || isApplied) return
    setLoadingPreview(true)
    getPromotionApplyPreview(sessionId).then(result => {
      setLoadingPreview(false)
      if ('error' in result) return
      setSummary(result.summary)
      setTargetYear(result.targetYearName)
    })
  }, [sessionId, mappingsReady, isApplied])

  function refreshPreview() {
    setLoadingPreview(true)
    getPromotionApplyPreview(sessionId).then(result => {
      setLoadingPreview(false)
      if ('error' in result) {
        notify.error(result.error)
        return
      }
      setSummary(result.summary)
      setTargetYear(result.targetYearName)
    })
  }

  function onApply() {
    const msg = summary
      ? `Confirmer le passage de ${summary.enrollCount} élève(s) vers ${targetYear ?? 'la rentrée'} et clôturer ${summary.graduateCount + summary.enrollCount} inscription(s) sur l'année en cours ?`
      : 'Confirmer l\'application des passages ?'
    if (!confirm(msg)) return

    startTransition(async () => {
      const result = await applyPromotionSession(sessionId)
      if ('error' in result) {
        notify.error(result.error)
        return
      }
      notify.success(
        `Passage appliqué : ${result.enrolled} inscription(s) créée(s), ${result.graduated} sortant(s).`,
      )
      router.refresh()
    })
  }

  if (isApplied) {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="flex items-center gap-3 py-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-medium text-emerald-900">Passage appliqué</p>
            <p className="text-sm text-emerald-800/80">
              Les inscriptions ont été mises à jour. Cette session est archivée et ne peut plus être modifiée.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!mappingsReady) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Étape 4 — Appliquer les passages</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Enregistrez d&apos;abord les correspondances de classes dans « Préparer la rentrée ».
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
            4
          </span>
          Appliquer les passages
        </CardTitle>
        {editable && (
          <Button variant="ghost" size="sm" onClick={refreshPreview} disabled={loadingPreview || isPending}>
            Actualiser l&apos;aperçu
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Crée les inscriptions sur <strong>{targetYear ?? 'l\'année cible'}</strong> et clôture les
          inscriptions de l&apos;année du bilan (statut <code className="text-xs">promoted</code> ou{' '}
          <code className="text-xs">graduated</code>). Action irréversible.
        </p>

        {loadingPreview && !summary ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Calcul de l&apos;aperçu…
          </p>
        ) : summary ? (
          <>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{summary.enrollCount} nouvelle(s) inscription(s)</Badge>
              <Badge variant="outline">{summary.admittedCount} admis</Badge>
              <Badge variant="outline">{summary.repeatCount} redoublant(s)</Badge>
              <Badge variant="outline">{summary.graduateCount} sortant(s)</Badge>
              {summary.incompleteCount > 0 && (
                <Badge variant="destructive">{summary.incompleteCount} incomplet(s)</Badge>
              )}
              {summary.errorCount > 0 && (
                <Badge variant="destructive">{summary.errorCount} erreur(s)</Badge>
              )}
            </div>

            {summary.blockers.length > 0 && (
              <ul className="text-sm text-amber-800 space-y-1">
                {summary.blockers.map((b, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>
            )}

            {editable && (
              <Button
                onClick={onApply}
                disabled={!summary.canApply || isPending || loadingPreview}
                className="w-full sm:w-auto"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PlayCircle className="h-4 w-4" />
                )}
                <span className="ml-2">Appliquer les passages</span>
              </Button>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
