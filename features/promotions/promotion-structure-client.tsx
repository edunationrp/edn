'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  createPromotionTargetYear,
  duplicatePromotionStructure,
  getPromotionClassMappings,
  linkPromotionTargetYear,
  savePromotionClassMappings,
  suggestAndSavePromotionMappings,
} from '@/lib/actions/promotion-structure'
import { notify } from '@/lib/feedback/toast'
import { PromotionApplyPanel } from '@/features/promotions/promotion-apply-panel'
import { ArrowLeft, CheckCircle2, Copy, Link2, Loader2, Sparkles, AlertTriangle } from 'lucide-react'

type Setup = {
  sessionId: string
  sessionStatus: string
  sourceYearName: string
  targetYearId: string | null
  targetYearName: string | null
  suggestedYearName: string
  schoolYears: Array<{ id: string; name: string; isActive: boolean; isSource: boolean }>
  targetClassCount: number
  mappingCount: number
  structureReady: boolean
  mappingsReady: boolean
}

type MappingRow = {
  sourceClassId: string
  sourceClassName: string
  sourceLevelName: string
  hasNextLevel: boolean
  admittedCount: number
  repeatCount: number
  targetClassId: string | null
  repeatTargetClassId: string | null
  warnings: string[]
}

type TargetOption = { id: string; name: string; levelName: string; levelId: string }

export function PromotionStructureClient({
  setup,
  initialMappings,
  canManage,
}: {
  setup: Setup
  initialMappings: {
    rows: MappingRow[]
    targetOptions: TargetOption[]
    allMapped: boolean
    warningCount: number
  } | null
  canManage: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const editable = canManage && setup.sessionStatus === 'draft'

  const [selectedYearId, setSelectedYearId] = useState(setup.targetYearId ?? '')
  const [newYearName, setNewYearName] = useState(setup.suggestedYearName)
  const [mappings, setMappings] = useState<MappingRow[]>(initialMappings?.rows ?? [])
  const [targetOptions] = useState<TargetOption[]>(initialMappings?.targetOptions ?? [])
  const [allMapped, setAllMapped] = useState(initialMappings?.allMapped ?? false)
  const [warningCount, setWarningCount] = useState(initialMappings?.warningCount ?? 0)

  function refreshMappings() {
    startTransition(async () => {
      const result = await getPromotionClassMappings(setup.sessionId)
      if ('error' in result) {
        notify.error(result.error)
        return
      }
      setMappings(result.rows)
      setAllMapped(result.allMapped)
      setWarningCount(result.warningCount)
    })
  }

  function linkYear() {
    if (!selectedYearId) {
      notify.error('Choisissez une année scolaire.')
      return
    }
    startTransition(async () => {
      const result = await linkPromotionTargetYear(setup.sessionId, selectedYearId)
      if ('error' in result) {
        notify.error(result.error)
        return
      }
      notify.success('Année cible associée')
      router.refresh()
    })
  }

  function createYear() {
    startTransition(async () => {
      const result = await createPromotionTargetYear(setup.sessionId, { name: newYearName })
      if ('error' in result) {
        notify.error(result.error)
        return
      }
      notify.success('Année de rentrée créée')
      router.refresh()
    })
  }

  function duplicateStructure() {
    startTransition(async () => {
      const result = await duplicatePromotionStructure(setup.sessionId)
      if ('error' in result) {
        notify.error(result.error)
        return
      }
      if ('message' in result && result.message) notify.success(result.message)
      else notify.success(`${result.created} classe(s) créée(s) pour la rentrée`)
      router.refresh()
    })
  }

  function autoSuggest() {
    startTransition(async () => {
      const result = await suggestAndSavePromotionMappings(setup.sessionId)
      if ('error' in result) {
        notify.error(result.error)
        return
      }
      notify.success('Correspondances enregistrées')
      refreshMappings()
      router.refresh()
    })
  }

  function saveMappings() {
    startTransition(async () => {
      const result = await savePromotionClassMappings(
        setup.sessionId,
        mappings.map(r => ({
          sourceClassId: r.sourceClassId,
          targetClassId: r.targetClassId,
          repeatTargetClassId: r.repeatTargetClassId,
        })),
      )
      if ('error' in result) {
        notify.error(result.error)
        return
      }
      notify.success('Correspondances sauvegardées')
      router.refresh()
    })
  }

  function updateMapping(
    sourceClassId: string,
    field: 'targetClassId' | 'repeatTargetClassId',
    value: string,
  ) {
    setMappings(prev =>
      prev.map(row =>
        row.sourceClassId === sourceClassId
          ? { ...row, [field]: value || null }
          : row,
      ),
    )
  }

  const eligibleYears = setup.schoolYears.filter(y => !y.isSource)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/promotions/${setup.sessionId}`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour au bilan
          </Link>
        </Button>
        {setup.mappingsReady && (
          <Badge variant="outline" className="gap-1 text-emerald-700 border-emerald-500/40">
            <CheckCircle2 className="h-3 w-3" />
            Correspondances enregistrées
          </Badge>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold">Préparer la rentrée</h2>
        <p className="text-sm text-muted-foreground">
          Bilan {setup.sourceYearName}
          {setup.targetYearName ? ` → rentrée ${setup.targetYearName}` : ' — année cible à définir'}
        </p>
      </div>

      {/* Étape 1 — Année cible */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              1
            </span>
            Année scolaire cible
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {setup.targetYearId ? (
            <p className="text-sm">
              Année liée : <strong>{setup.targetYearName}</strong>
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Année existante</Label>
                <select
                  value={selectedYearId}
                  onChange={e => setSelectedYearId(e.target.value)}
                  disabled={!editable || isPending}
                  className="h-10 w-full max-w-md rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">— Choisir —</option>
                  {eligibleYears.map(y => (
                    <option key={y.id} value={y.id}>
                      {y.name}
                      {y.isActive ? ' (active)' : ''}
                    </option>
                  ))}
                </select>
                {editable && (
                  <Button type="button" variant="outline" size="sm" onClick={linkYear} disabled={isPending}>
                    <Link2 className="h-4 w-4 mr-1" />
                    Associer
                  </Button>
                )}
              </div>
              {editable && (
                <div className="space-y-2 border-t pt-4">
                  <Label>Ou créer une nouvelle année</Label>
                  <div className="flex flex-wrap gap-2">
                    <Input
                      value={newYearName}
                      onChange={e => setNewYearName(e.target.value)}
                      className="max-w-xs"
                      disabled={isPending}
                    />
                    <Button type="button" onClick={createYear} disabled={isPending}>
                      Créer et lier
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Étape 2 — Structure */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              2
            </span>
            Classes pour la rentrée
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!setup.targetYearId ? (
            <p className="text-sm text-muted-foreground">Associez d&apos;abord l&apos;année cible.</p>
          ) : (
            <>
              <p className="text-sm">
                {setup.targetClassCount > 0
                  ? `${setup.targetClassCount} classe(s) configurée(s) pour ${setup.targetYearName}.`
                  : 'Aucune classe sur l\'année cible.'}
              </p>
              {editable && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={duplicateStructure}
                  disabled={isPending || !setup.targetYearId}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="ml-2">Dupliquer la structure depuis {setup.sourceYearName}</span>
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                Copie les classes et matières (sans élèves). Ignoré si des classes existent déjà sur l&apos;année
                cible.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Étape 3 — Mappings */}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              3
            </span>
            Correspondance des classes
          </CardTitle>
          {editable && setup.structureReady && (
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={autoSuggest} disabled={isPending}>
                <Sparkles className="h-4 w-4 mr-1" />
                Proposer automatiquement
              </Button>
              <Button type="button" size="sm" onClick={saveMappings} disabled={isPending}>
                Enregistrer
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {!setup.structureReady ? (
            <p className="text-sm text-muted-foreground">
              Dupliquez ou créez les classes de l&apos;année cible avant de définir les correspondances.
            </p>
          ) : mappings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Lancez le calcul du bilan puis revenez ici, ou cliquez sur « Proposer automatiquement ».
            </p>
          ) : (
            <>
              {warningCount > 0 && (
                <p className="mb-3 flex items-center gap-2 text-sm text-amber-700">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {warningCount} alerte(s) — vérifiez les correspondances ci-dessous.
                </p>
              )}
              {allMapped && (
                <p className="mb-3 text-sm text-emerald-700">
                  Toutes les classes sources ont une cible pour les admis et redoublants concernés.
                </p>
              )}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">Classe actuelle</th>
                      <th className="py-2 pr-3 text-right font-medium">Admis</th>
                      <th className="py-2 pr-3 text-right font-medium">Redouble</th>
                      <th className="py-2 pr-3 font-medium">Classe suivante (admis)</th>
                      <th className="py-2 pr-3 font-medium">Classe redoublement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappings.map(row => (
                      <tr key={row.sourceClassId} className="border-b align-top last:border-0">
                        <td className="py-2 pr-3">
                          <span className="font-medium">{row.sourceClassName}</span>
                          <span className="block text-xs text-muted-foreground">{row.sourceLevelName}</span>
                          {row.warnings.map((w, i) => (
                            <span key={i} className="mt-1 block text-xs text-amber-700">
                              {w}
                            </span>
                          ))}
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums">{row.admittedCount}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{row.repeatCount}</td>
                        <td className="py-2 pr-3">
                          {row.hasNextLevel ? (
                            <select
                              value={row.targetClassId ?? ''}
                              onChange={e =>
                                updateMapping(row.sourceClassId, 'targetClassId', e.target.value)
                              }
                              disabled={!editable || isPending}
                              className="h-9 w-full min-w-[140px] rounded-md border px-2 text-sm"
                            >
                              <option value="">—</option>
                              {targetOptions.map(opt => (
                                <option key={opt.id} value={opt.id}>
                                  {opt.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-xs text-muted-foreground">Fin de cycle</span>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          <select
                            value={row.repeatTargetClassId ?? ''}
                            onChange={e =>
                              updateMapping(row.sourceClassId, 'repeatTargetClassId', e.target.value)
                            }
                            disabled={!editable || isPending}
                            className="h-9 w-full min-w-[140px] rounded-md border px-2 text-sm"
                          >
                            <option value="">—</option>
                            {targetOptions
                              .filter(
                                opt =>
                                  opt.levelName === row.sourceLevelName ||
                                  opt.name.startsWith(row.sourceLevelName),
                              )
                              .map(opt => (
                                <option key={opt.id} value={opt.id}>
                                  {opt.name}
                                </option>
                              ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <PromotionApplyPanel
        sessionId={setup.sessionId}
        sessionStatus={setup.sessionStatus}
        mappingsReady={setup.mappingsReady}
        targetYearName={setup.targetYearName}
        canManage={canManage}
      />
    </div>
  )
}
