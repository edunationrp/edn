'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Loader2,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn, formatRelativeDate } from '@/lib/utils'
import { notify } from '@/lib/feedback/toast'
import {
  loadGradeSubmissionPreview,
  rejectGradeSubmission,
  validateGradeSubmission,
} from '@/lib/actions/grade-sheet-validation'
import {
  computeStudentAverage,
  shortAppreciation,
  type GradeSequenceSlot,
  type GradeSubmissionPreview,
} from '@/lib/grades/sheet-types'

type SubmissionSummary = {
  id: string
  classId: string
  subjectId: string
  term: string
  className: string
  subjectName: string
  submittedAt: string
  submitterName: string | null
  secretaryNote: string | null
}

type PreviewRow = GradeSubmissionPreview['rows'][number] & {
  devoir1Input: string
  devoir2Input: string
  examenInput: string
}

const TERMS: Record<string, string> = {
  T1: 'Trimestre 1',
  T2: 'Trimestre 2',
  T3: 'Trimestre 3',
}

function parseGradeInput(raw: string): number | null | 'invalid' {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const num = parseFloat(trimmed.replace(',', '.'))
  if (Number.isNaN(num) || num < 0 || num > 20) return 'invalid'
  return Math.round(num * 4) / 4
}

function SubmissionPreviewPanel({
  submissionId,
  onDone,
}: {
  submissionId: string
  onDone: () => void
}) {
  const [preview, setPreview] = useState<GradeSubmissionPreview | null>(null)
  const [rows, setRows] = useState<PreviewRow[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [pending, startTransition] = useTransition()

  const loadPreview = useCallback(async () => {
    setLoading(true)
    const result = await loadGradeSubmissionPreview(submissionId)
    setLoading(false)
    if ('error' in result) {
      notify.error(result.error)
      return
    }
    setPreview(result.preview)
    setRows(
      result.preview.rows.map(row => ({
        ...row,
        devoir1Input: row.devoir1 !== null ? String(row.devoir1) : '',
        devoir2Input: row.devoir2 !== null ? String(row.devoir2) : '',
        examenInput: row.examen !== null ? String(row.examen) : '',
      })),
    )
  }, [submissionId])

  useEffect(() => {
    loadPreview()
  }, [loadPreview])

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
        average,
        appreciation: shortAppreciation(average),
        invalid: devoir1 === 'invalid' || devoir2 === 'invalid' || examen === 'invalid',
      }
    })
  }, [rows])

  function updateCell(studentId: string, field: 'devoir1Input' | 'devoir2Input' | 'examenInput', value: string) {
    setRows(prev =>
      prev.map(row => (row.studentId === studentId ? { ...row, [field]: value } : row)),
    )
  }

  function buildValidationItems() {
    const items: Array<{ studentId: string; slot: GradeSequenceSlot; value: number | null }> = []
    for (const row of rows) {
      const cells = [
        { slot: 'devoir1' as const, input: row.devoir1Input },
        { slot: 'devoir2' as const, input: row.devoir2Input },
        { slot: 'examen' as const, input: row.examenInput },
      ]
      for (const cell of cells) {
        const parsed = parseGradeInput(cell.input)
        if (parsed === 'invalid') continue
        const previous =
          cell.slot === 'devoir1'
            ? row.previousDevoir1
            : cell.slot === 'devoir2'
              ? row.previousDevoir2
              : row.previousExamen
        if (!row.hasProposal?.[cell.slot] && parsed === previous) continue
        items.push({ studentId: row.studentId, slot: cell.slot, value: parsed })
      }
    }
    return items
  }

  function handleValidate() {
    if (computedRows.some(row => row.invalid)) {
      notify.error('Corrigez les notes invalides avant de valider.')
      return
    }

    startTransition(async () => {
      const items = buildValidationItems()
      if (items.length === 0) {
        notify.error('Aucune note à valider.')
        return
      }
      const result = await validateGradeSubmission({
        submissionId,
        items,
      })
      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }
      notify.success('Notes validées et publiées.')
      onDone()
    })
  }

  function handleReject() {
    if (!rejectReason.trim()) {
      notify.error('Indiquez un motif de refus.')
      return
    }
    startTransition(async () => {
      const result = await rejectGradeSubmission({ submissionId, reason: rejectReason.trim() })
      if ('error' in result && result.error) {
        notify.error(result.error)
        return
      }
      notify.success('Demande refusée — le secrétariat sera notifié.')
      setRejectOpen(false)
      onDone()
    })
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement de la prévisualisation…
      </div>
    )
  }

  if (!preview) return null

  return (
    <div className="space-y-4 border-t border-amber-100 pt-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-700">
            Soumis par {preview.submitterName ?? 'le secrétariat'}
            {' · '}
            {formatRelativeDate(preview.submittedAt)}
          </p>
          {preview.secretaryNote && (
            <p className="mt-1 text-sm text-muted-foreground">Note : {preview.secretaryNote}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => setRejectOpen(true)}
            className="border-red-200 text-red-700 hover:bg-red-50"
          >
            <XCircle className="mr-1.5 h-4 w-4" />
            Notes incorrectes
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={pending}
            onClick={handleValidate}
            className="bg-emerald-700 hover:bg-emerald-800"
          >
            <CheckCircle2 className="mr-1.5 h-4 w-4" />
            Valider et publier
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Vous pouvez corriger les notes ci-dessous avant validation. Les notes officielles ne seront
        mises à jour qu&apos;après votre validation.
      </p>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-600">
              <th className="px-3 py-2.5 font-semibold">Élève</th>
              <th className="px-3 py-2.5 text-center font-semibold">Devoir 1</th>
              <th className="px-3 py-2.5 text-center font-semibold">Devoir 2</th>
              <th className="px-3 py-2.5 text-center font-semibold">Examen</th>
              <th className="px-3 py-2.5 text-center font-semibold">Moyenne</th>
              <th className="px-3 py-2.5 font-semibold">Appréciation</th>
            </tr>
          </thead>
          <tbody>
            {computedRows.map((row, index) => (
              <tr key={row.studentId} className={cn('border-t', index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50')}>
                <td className="px-3 py-2.5">
                  <p className="font-medium">{row.lastName} {row.firstName}</p>
                </td>
                {(['devoir1Input', 'devoir2Input', 'examenInput'] as const).map(field => {
                  const slotKey = field.replace('Input', '') as 'devoir1' | 'devoir2' | 'examen'
                  const previous =
                    slotKey === 'devoir1'
                      ? row.previousDevoir1
                      : slotKey === 'devoir2'
                        ? row.previousDevoir2
                        : row.previousExamen
                  return (
                    <td key={field} className="px-3 py-2.5 text-center">
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={row[field]}
                        onChange={event => updateCell(row.studentId, field, event.target.value)}
                        className={cn(
                          'mx-auto h-8 w-16 text-center tabular-nums',
                          parseGradeInput(row[field]) === 'invalid' && 'border-red-400',
                        )}
                      />
                      {previous !== null && previous !== parseGradeInput(row[field]) && (
                        <p className="mt-0.5 text-[10px] text-muted-foreground line-through">
                          {previous}
                        </p>
                      )}
                    </td>
                  )
                })}
                <td className="px-3 py-2.5 text-center font-semibold tabular-nums">
                  {row.average !== null ? row.average.toFixed(1) : '—'}
                </td>
                <td className="px-3 py-2.5 text-slate-600">{row.appreciation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notes incorrectes</DialogTitle>
            <DialogDescription>
              Indiquez le motif du refus. Le secrétariat sera notifié et pourra corriger sa saisie.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={rejectReason}
            onChange={event => setRejectReason(event.target.value)}
            rows={3}
            placeholder="Ex. : notes incohérentes avec le cahier de textes"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRejectOpen(false)}>
              Annuler
            </Button>
            <Button type="button" variant="destructive" disabled={pending} onClick={handleReject}>
              Refuser la saisie
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function GradeValidationPanel({
  submissions,
  initialSubmissionId,
}: {
  submissions: SubmissionSummary[]
  initialSubmissionId?: string
}) {
  const [expandedId, setExpandedId] = useState<string | null>(
    initialSubmissionId ?? submissions[0]?.id ?? null,
  )
  const [list, setList] = useState(submissions)

  useEffect(() => {
    setList(submissions)
    if (initialSubmissionId) setExpandedId(initialSubmissionId)
  }, [submissions, initialSubmissionId])

  if (list.length === 0) return null

  function handleDone(submissionId: string) {
    setList(prev => prev.filter(item => item.id !== submissionId))
    setExpandedId(null)
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-950">
        <ClipboardCheck className="h-4 w-4" />
        Demandes de validation du secrétariat ({list.length})
      </div>

      <div className="space-y-2">
        {list.map(submission => {
          const isOpen = expandedId === submission.id
          return (
            <div key={submission.id} className="rounded-xl border border-amber-100 bg-white shadow-sm">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                onClick={() => setExpandedId(isOpen ? null : submission.id)}
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {submission.className} · {submission.subjectName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {TERMS[submission.term] ?? submission.term}
                    {' · '}
                    {submission.submitterName ?? 'Secrétariat'}
                    {' · '}
                    {formatRelativeDate(submission.submittedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">
                    En attente
                  </Badge>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4">
                  <SubmissionPreviewPanel
                    submissionId={submission.id}
                    onDone={() => handleDone(submission.id)}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
