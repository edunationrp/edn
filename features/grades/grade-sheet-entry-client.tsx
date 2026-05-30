'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import {
  AlertTriangle,
  Loader2,
  Save,
  Send,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { notify } from '@/lib/feedback/toast'
import { loadGradeSheet, saveGradeSheetCell } from '@/lib/actions/grade-sheet'
import { submitGradeSlotToSecretary } from '@/lib/actions/grade-publication'
import {
  computeClassStats,
  computeStudentAverage,
  GRADE_SEQUENCE_SLOTS,
  shortAppreciation,
  shouldShowDropAlert,
  SLOT_LABELS,
  type GradeSequenceSlot,
  type GradeSheetContext,
  type StudentGradeRow,
} from '@/lib/grades/sheet-types'

const TERMS = [
  { value: 'T1', label: 'Trimestre 1' },
  { value: 'T2', label: 'Trimestre 2' },
  { value: 'T3', label: 'Trimestre 3' },
] as const

type Props = {
  schoolId: string
  userRole: string
  classes: Array<{ id: string; name: string }>
  subjects: Array<{ id: string; name: string; coefficient: number }>
}

type LocalRow = StudentGradeRow & {
  devoir1Input: string
  devoir2Input: string
  examenInput: string
  dirty: boolean
  saving: boolean
}

type ComputedRow = LocalRow & {
  average: number | null
  appreciation: string
  alert: boolean
  invalid: boolean
}

function parseGradeInput(raw: string): number | null | 'invalid' {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const num = parseFloat(trimmed.replace(',', '.'))
  if (Number.isNaN(num) || num < 0 || num > 20) return 'invalid'
  return Math.round(num * 4) / 4
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'good' | 'bad' | 'neutral'
}) {
  return (
    <div className="rounded-xl border border-emerald-100 bg-white px-4 py-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className={cn(
          'mt-1 text-2xl font-bold tabular-nums',
          tone === 'good' && 'text-emerald-600',
          tone === 'bad' && 'text-red-600',
          tone === 'neutral' && 'text-slate-900',
        )}
      >
        {value}
      </p>
    </div>
  )
}

export function GradeSheetEntryClient({ userRole, classes, subjects }: Props) {
  const [classId, setClassId] = useState(classes[0]?.id ?? '')
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? '')
  const [term, setTerm] = useState<'T1' | 'T2' | 'T3'>('T1')
  const [sheet, setSheet] = useState<GradeSheetContext | null>(null)
  const [rows, setRows] = useState<LocalRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const [reasonModalOpen, setReasonModalOpen] = useState(false)
  const [reasonText, setReasonText] = useState('')
  const [pendingSave, setPendingSave] = useState<
    { mode: 'row'; row: ComputedRow } | { mode: 'all' } | null
  >(null)
  const isSecretary = userRole === 'SECRETAIRE'
  const isTeacher = userRole === 'PROFESSEUR'
  const [submittingSlot, setSubmittingSlot] = useState<GradeSequenceSlot | null>(null)

  const loadSheet = useCallback(async () => {
    if (!classId || !subjectId) return
    setLoading(true)
    setError('')
    const result = await loadGradeSheet({ classId, subjectId, term })
    setLoading(false)

    if ('error' in result) {
      setError(result.error)
      setSheet(null)
      setRows([])
      return
    }

    setSheet(result.sheet)
    setRows(
      result.sheet.rows.map(row => ({
        ...row,
        devoir1Input: row.devoir1 !== null ? String(row.devoir1) : '',
        devoir2Input: row.devoir2 !== null ? String(row.devoir2) : '',
        examenInput: row.examen !== null ? String(row.examen) : '',
        dirty: false,
        saving: false,
      })),
    )
  }, [classId, subjectId, term])

  useEffect(() => {
    loadSheet()
  }, [loadSheet])

  const computedRows = useMemo(() => {
    return rows.map(row => {
      const devoir1 = parseGradeInput(row.devoir1Input)
      const devoir2 = parseGradeInput(row.devoir2Input)
      const examen = parseGradeInput(row.examenInput)

      const average = computeStudentAverage({
        devoir1: devoir1 === 'invalid' ? null : devoir1,
        devoir2: devoir2 === 'invalid' ? null : devoir2,
        examen: examen === 'invalid' ? null : examen,
      })

      return {
        ...row,
        devoir1: devoir1 === 'invalid' ? null : devoir1,
        devoir2: devoir2 === 'invalid' ? null : devoir2,
        examen: examen === 'invalid' ? null : examen,
        average,
        appreciation: shortAppreciation(average),
        alert: shouldShowDropAlert(average, devoir1 === 'invalid' ? null : devoir1),
        invalid:
          devoir1 === 'invalid' || devoir2 === 'invalid' || examen === 'invalid',
      }
    })
  }, [rows])

  const rankedRows = useMemo(() => {
    return [...computedRows]
      .sort((a, b) => (b.average ?? -1) - (a.average ?? -1))
      .map((row, index) => ({ ...row, rank: row.average !== null ? index + 1 : null }))
  }, [computedRows])

  const rankByStudentId = useMemo(() => {
    return new Map(rankedRows.map(row => [row.studentId, row.rank]))
  }, [rankedRows])

  const stats = useMemo(() => {
    const averages = computedRows.map(row => row.average).filter((v): v is number => v !== null)
    return computeClassStats(averages)
  }, [computedRows])

  function updateCell(studentId: string, field: 'devoir1Input' | 'devoir2Input' | 'examenInput', value: string) {
    setRows(prev =>
      prev.map(row =>
        row.studentId === studentId ? { ...row, [field]: value, dirty: true } : row,
      ),
    )
  }

  function rowNeedsSecretaryReason(row: ComputedRow) {
    if (!isSecretary) return false
    const original = rows.find(item => item.studentId === row.studentId)
    if (!original) return false

    const checks = [
      { slot: 'devoir1' as const, input: row.devoir1Input, official: original.officialDevoir1 ?? original.devoir1 },
      { slot: 'devoir2' as const, input: row.devoir2Input, official: original.officialDevoir2 ?? original.devoir2 },
      { slot: 'examen' as const, input: row.examenInput, official: original.officialExamen ?? original.examen },
    ]

    return checks.some(cell => {
      const parsed = parseGradeInput(cell.input)
      if (parsed === 'invalid') return false
      if (cell.official === null) return false
      return parsed !== cell.official
    })
  }

  async function saveRow(row: ComputedRow, reason?: string) {
    if (!sheet || sheet.isLocked) return

    if (isSecretary && rowNeedsSecretaryReason(row) && !reason?.trim()) {
      setPendingSave({ mode: 'row', row })
      setReasonText('')
      setReasonModalOpen(true)
      return
    }

    const original = rows.find(item => item.studentId === row.studentId)
    const slots = [
      { slot: 'devoir1' as const, input: row.devoir1Input, loaded: original?.devoir1 ?? null },
      { slot: 'devoir2' as const, input: row.devoir2Input, loaded: original?.devoir2 ?? null },
      { slot: 'examen' as const, input: row.examenInput, loaded: original?.examen ?? null },
    ]

    setRows(prev =>
      prev.map(r => (r.studentId === row.studentId ? { ...r, saving: true } : r)),
    )

    for (const cell of slots) {
      const parsed = parseGradeInput(cell.input)
      if (parsed === 'invalid') continue
      if (parsed === cell.loaded) continue

      const result = await saveGradeSheetCell({
        classId,
        subjectId,
        term,
        studentId: row.studentId,
        slot: cell.slot,
        value: parsed,
        reason: isSecretary ? reason?.trim() : undefined,
      })

      if ('error' in result && result.error) {
        notify.error(result.error)
        setRows(prev =>
          prev.map(r => (r.studentId === row.studentId ? { ...r, saving: false } : r)),
        )
        return
      }
    }

    setRows(prev =>
      prev.map(r =>
        r.studentId === row.studentId ? { ...r, dirty: false, saving: false } : r,
      ),
    )
    notify.success(
      isSecretary ? 'Notes soumises au professeur pour validation' : 'Notes enregistrées',
    )
    startTransition(() => loadSheet())
  }

  async function saveAllDirty(reason?: string) {
    const dirtyRows = computedRows.filter(row => row.dirty && !row.invalid)
    const needsReason = isSecretary && dirtyRows.some(rowNeedsSecretaryReason)

    if (needsReason && !reason?.trim()) {
      setPendingSave({ mode: 'all' })
      setReasonText('')
      setReasonModalOpen(true)
      return
    }

    for (const row of dirtyRows) {
      await saveRow(row, reason)
    }
  }

  async function confirmReasonSave() {
    if (!reasonText.trim()) {
      notify.error('Indiquez un motif pour la modification.')
      return
    }

    setReasonModalOpen(false)
    const reason = reasonText.trim()
    setReasonText('')

    if (pendingSave?.mode === 'row') {
      await saveRow(pendingSave.row, reason)
    } else if (pendingSave?.mode === 'all') {
      await saveAllDirty(reason)
    }

    setPendingSave(null)
  }

  const subject = subjects.find(item => item.id === subjectId)

  function sheetSlotHasGrades(currentSheet: GradeSheetContext, slot: GradeSequenceSlot) {
    const key = slot === 'devoir1' ? 'devoir1' : slot === 'devoir2' ? 'devoir2' : 'examen'
    return currentSheet.rows.some(row => row[key] !== null)
  }

  function publicationBadge(slot: GradeSequenceSlot) {
    const pub = sheet?.slotPublications?.[slot]
    if (!pub || pub.status === 'draft') {
      return <Badge variant="outline">Non envoyé</Badge>
    }
    if (pub.status === 'submitted') {
      return <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">Chez la secrétaire</Badge>
    }
    return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Publié aux familles</Badge>
  }

  async function handleSubmitSlot(slot: GradeSequenceSlot) {
    if (!sheet) return
    setSubmittingSlot(slot)
    const result = await submitGradeSlotToSecretary({ classId, subjectId, term, slot })
    setSubmittingSlot(null)
    if ('error' in result && result.error) {
      notify.error(result.error)
      return
    }
    notify.success(`${SLOT_LABELS[slot]} envoyé à la secrétaire pour publication`)
    startTransition(() => loadSheet())
  }

  return (
    <div className="space-y-4">
      {isSecretary && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p>
              Vos saisies sont soumises au professeur pour validation avant publication.
              Les notes officielles ne sont pas modifiées tant qu&apos;il n&apos;a pas validé.
            </p>
            {sheet?.pendingSubmission && (
              <p className="mt-1 font-medium">
                Statut : en attente de validation professeur
              </p>
            )}
            {sheet?.lastRejected?.rejectionReason && (
              <p className="mt-1 text-red-800">
                Dernier refus : {sheet.lastRejected.rejectionReason}
              </p>
            )}
          </div>
        </div>
      )}

      <Card className="border-slate-200/90 shadow-sm">
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5 lg:col-span-1">
            <Label>Classe</Label>
            <select
              value={classId}
              onChange={event => setClassId(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {classes.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 lg:col-span-1">
            <Label>Matière</Label>
            <select
              value={subjectId}
              onChange={event => setSubjectId(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {subjects.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 lg:col-span-1">
            <Label>Période</Label>
            <select
              value={term}
              onChange={event => setTerm(event.target.value as 'T1' | 'T2' | 'T3')}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {TERMS.map(item => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 lg:col-span-1">
            <Label>Type</Label>
            <div className="flex h-10 items-center rounded-md border border-input bg-slate-50 px-3 text-sm text-slate-600">
              Devoir + Examen (optionnel)
            </div>
          </div>
          <div className="flex items-end lg:col-span-1">
            <Badge variant="outline" className="h-10 w-full justify-center text-sm">
              Coefficient : {subject?.coefficient ?? 1}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Chargement de la feuille de notes…
        </div>
      ) : sheet ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Moyenne classe"
              value={stats.average !== null ? stats.average.toFixed(1) : '—'}
              tone="good"
            />
            <StatCard
              label="Note max"
              value={stats.max !== null ? stats.max.toFixed(1) : '—'}
              tone="good"
            />
            <StatCard
              label="Note min"
              value={stats.min !== null ? stats.min.toFixed(1) : '—'}
              tone="bad"
            />
            <StatCard
              label="Médiane"
              value={stats.median !== null ? stats.median.toFixed(1) : '—'}
              tone="neutral"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {sheet.className} · {sheet.subjectName} · {TERMS.find(t => t.value === term)?.label}
              {sheet.isLocked && ' · Verrouillée'}
            </p>
            <Button
              type="button"
              size="sm"
              disabled={pending || sheet.isLocked || !computedRows.some(row => row.dirty)}
              onClick={() => saveAllDirty()}
              className="bg-[#1B3A6B] hover:bg-[#1B3A6B]/90"
            >
              <Save className="mr-1.5 h-4 w-4" />
              Enregistrer les modifications
            </Button>
          </div>

          {isTeacher && (
            <div className="rounded-xl border border-[#1B3A6B]/15 bg-[#EEF3FA]/40 p-4">
              <p className="mb-3 text-sm font-medium text-[#1B3A6B]">
                Publication aux familles — enregistrez puis envoyez chaque devoir à la secrétaire
              </p>
              <div className="flex flex-wrap gap-2">
                {GRADE_SEQUENCE_SLOTS.map(slot => {
                  const pub = sheet.slotPublications?.[slot]
                  const canSubmit =
                    sheetSlotHasGrades(sheet, slot)
                    && (!pub || pub.status === 'draft')
                  return (
                    <div
                      key={slot}
                      className="flex flex-wrap items-center gap-2 rounded-lg border border-white bg-white px-3 py-2 shadow-sm"
                    >
                      <span className="text-sm font-medium">{SLOT_LABELS[slot]}</span>
                      {publicationBadge(slot)}
                      {canSubmit && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={submittingSlot === slot || pending}
                          onClick={() => handleSubmitSlot(slot)}
                        >
                          {submittingSlot === slot ? (
                            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Send className="mr-1 h-3.5 w-3.5" />
                          )}
                          Envoyer à la secrétaire
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Une seule note publiée suffit pour que l&apos;élève et le parent la voient. Lorsque les trois
                évaluations sont saisies et publiées, la secrétaire peut générer le bulletin complet.
              </p>
            </div>
          )}

          {isSecretary && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-900">
              Les notes enregistrées par le professeur apparaissent ici en temps réel. Publiez-les aux familles
              depuis le panneau « Notes en attente de publication » ci-dessus, ou générez les bulletins lorsque
              toutes les évaluations du trimestre sont complètes.
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-emerald-100 bg-emerald-50/80 text-left text-xs uppercase tracking-wide text-slate-600">
                    <th className="px-3 py-3 font-semibold">Rang</th>
                    <th className="px-3 py-3 font-semibold">Élève</th>
                    <th className="px-3 py-3 text-center font-semibold">Devoir 1 (30%)</th>
                    <th className="px-3 py-3 text-center font-semibold">Devoir 2 (30%)</th>
                    <th className="px-3 py-3 text-center font-semibold">Examen (40%)</th>
                    <th className="px-3 py-3 text-center font-semibold">Moyenne</th>
                    <th className="px-3 py-3 font-semibold">Appréciation</th>
                    <th className="px-3 py-3 text-center font-semibold">Alerte</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {computedRows.map((row, index) => {
                    const rank = rankByStudentId.get(row.studentId)
                    return (
                      <tr
                        key={row.studentId}
                        className={cn(
                          'border-b border-emerald-50/80',
                          index % 2 === 0 ? 'bg-emerald-50/35' : 'bg-white',
                        )}
                      >
                        <td className="px-3 py-3 font-semibold text-slate-500">
                          {rank ?? '—'}
                        </td>
                        <td className="px-3 py-3">
                          <p className="font-medium text-slate-900">
                            {row.lastName} {row.firstName}
                          </p>
                          <p className="text-xs text-muted-foreground">{row.iun ?? '—'}</p>
                        </td>
                        {(['devoir1Input', 'devoir2Input', 'examenInput'] as const).map(field => (
                          <td key={field} className="px-3 py-3 text-center">
                            <Input
                              type="text"
                              inputMode="decimal"
                              disabled={sheet.isLocked}
                              value={row[field]}
                              onChange={event => updateCell(row.studentId, field, event.target.value)}
                              className={cn(
                                'mx-auto h-9 w-20 text-center tabular-nums',
                                parseGradeInput(row[field]) === 'invalid' && 'border-red-400',
                              )}
                              placeholder="—"
                            />
                          </td>
                        ))}
                        <td className="px-3 py-3 text-center">
                          <span
                            className={cn(
                              'inline-flex min-w-12 justify-center rounded-md px-2 py-1 font-bold tabular-nums',
                              row.average !== null && row.average >= 10
                                ? 'bg-emerald-100 text-emerald-800'
                                : row.average !== null
                                  ? 'bg-red-100 text-red-700'
                                  : 'text-slate-400',
                            )}
                          >
                            {row.average !== null ? row.average.toFixed(1) : '—'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-slate-700">{row.appreciation}</td>
                        <td className="px-3 py-3 text-center">
                          {row.alert ? (
                            <Badge variant="destructive" className="gap-1">
                              <TrendingDown className="h-3 w-3" />
                              Baisse
                            </Badge>
                          ) : row.average !== null && row.average >= 14 ? (
                            <Badge className="gap-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                              <TrendingUp className="h-3 w-3" />
                              OK
                            </Badge>
                          ) : null}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={sheet.isLocked || !row.dirty || row.saving || row.invalid}
                            onClick={() => saveRow(row)}
                          >
                            {row.saving ? '…' : 'OK'}
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      <Dialog open={reasonModalOpen} onOpenChange={setReasonModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Motif de la modification</DialogTitle>
            <DialogDescription>
              Cette note existante sera modifiée. Le professeur sera notifié avec ce motif.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={reasonText}
            onChange={event => setReasonText(event.target.value)}
            placeholder="Ex. : erreur de saisie corrigée sur demande du professeur"
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setReasonModalOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={confirmReasonSave} className="bg-[#1B3A6B] hover:bg-[#1B3A6B]/90">
              Confirmer et enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
