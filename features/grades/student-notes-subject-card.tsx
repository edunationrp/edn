'use client'

import { useEffect, useState } from 'react'
import { Target, Lightbulb, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { PublishedSubjectGrades } from '@/lib/grades/published-notes'
import {
  computeRequiredGradeForTarget,
  formatGradeValue,
  getGradeLevel,
  getNextMissingSlot,
  GRADE_LEVEL_STYLES,
  SLOT_LABELS,
  targetStorageKey,
} from '@/lib/grades/grade-target'
import { formatClassComparison } from '@/lib/grades/class-average-hints'
import type { GradeSequenceSlot } from '@/lib/grades/sheet-types'

const STORAGE_KEY = 'edn-grade-targets'

type Props = {
  term: string
  subject: PublishedSubjectGrades
  enableGoalPlanner?: boolean
  classAverage?: number | null
}

function loadTargets(): Record<string, number> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, number>) : {}
  } catch {
    return {}
  }
}

function saveTarget(key: string, value: number | null) {
  const all = loadTargets()
  if (value === null || Number.isNaN(value)) {
    delete all[key]
  } else {
    all[key] = value
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

const SLOTS: GradeSequenceSlot[] = ['devoir1', 'devoir2', 'examen']

export function StudentNotesSubjectCard({
  term,
  subject,
  enableGoalPlanner = false,
  classAverage = null,
}: Props) {
  const storageKey = targetStorageKey(term, subject.subjectId)
  const [targetInput, setTargetInput] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = loadTargets()[storageKey]
    if (saved !== undefined) setTargetInput(String(saved))
  }, [storageKey])

  const average = subject.average
  const avgLevel = average !== null ? getGradeLevel(average) : null
  const avgStyles = avgLevel ? GRADE_LEVEL_STYLES[avgLevel] : null

  const targetValue = mounted && targetInput !== '' ? Number.parseFloat(targetInput) : null
  const validTarget = targetValue !== null && !Number.isNaN(targetValue) && targetValue >= 0 && targetValue <= 20

  const suggestion =
    validTarget && enableGoalPlanner
      ? computeRequiredGradeForTarget(subject, targetValue)
      : null

  const nextSlot = getNextMissingSlot(subject)
  const allSlotsFilled = nextSlot === null
  const classComparison = formatClassComparison(average, classAverage ?? null)

  function handleTargetChange(value: string) {
    setTargetInput(value)
    const parsed = Number.parseFloat(value)
    if (value === '' || Number.isNaN(parsed)) {
      saveTarget(storageKey, null)
      return
    }
    if (parsed >= 0 && parsed <= 20) saveTarget(storageKey, parsed)
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* En-tête matière + moyenne */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/50 px-4 py-4 sm:px-5">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-gray-900 sm:text-lg">{subject.subjectName}</h3>
          {subject.appreciation !== '—' && avgStyles && (
            <span
              className={cn(
                'mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
                avgStyles.badge,
              )}
            >
              {subject.appreciation}
            </span>
          )}
          {classComparison && (
            <p className="mt-2 text-xs text-slate-500">{classComparison}</p>
          )}
        </div>
        {average !== null && avgStyles && (
          <div
            className={cn(
              'flex shrink-0 flex-col items-center justify-center rounded-2xl border-2 px-4 py-2.5',
              avgStyles.bg,
              avgStyles.border,
            )}
          >
            <span className={cn('text-[10px] font-medium uppercase tracking-wide opacity-70', avgStyles.text)}>
              Moyenne
            </span>
            <span className={cn('text-2xl font-bold tabular-nums sm:text-3xl', avgStyles.text)}>
              {average.toFixed(1)}
            </span>
            <span className={cn('text-xs font-medium', avgStyles.text)}>/20</span>
          </div>
        )}
      </div>

      {/* Grille des notes */}
      <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-3 sm:gap-3 sm:p-5">
        {SLOTS.map(slot => {
          const value = subject[slot]
          const hasGrade = value !== null
          const level = hasGrade ? getGradeLevel(value) : null
          const styles = level ? GRADE_LEVEL_STYLES[level] : null
          const isNext = nextSlot === slot

          return (
            <div
              key={slot}
              className={cn(
                'flex flex-col rounded-xl border p-3 transition-shadow',
                hasGrade && styles
                  ? cn(styles.bg, styles.border)
                  : 'border-dashed border-slate-200 bg-slate-50/50',
                isNext && enableGoalPlanner && 'ring-2 ring-[#1B3A6B]/25',
              )}
            >
              <div className="mb-1 flex items-center justify-between gap-1">
                <span className="text-xs font-medium text-muted-foreground">{SLOT_LABELS[slot]}</span>
                {isNext && enableGoalPlanner && (
                  <span className="rounded bg-[#1B3A6B]/10 px-1.5 py-0.5 text-[9px] font-semibold text-[#1B3A6B]">
                    Prochain
                  </span>
                )}
              </div>
              {hasGrade && styles ? (
                <p className={cn('text-2xl font-bold tabular-nums sm:text-3xl', styles.text)}>
                  {formatGradeValue(value)}
                  <span className="ml-0.5 text-sm font-normal opacity-60">/20</span>
                </p>
              ) : (
                <p className="text-lg font-medium text-slate-300">—</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Objectif & suggestion */}
      {enableGoalPlanner && (
        <div className="border-t border-slate-100 bg-gradient-to-br from-[#1B3A6B]/5 to-transparent px-4 py-4 sm:px-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1B3A6B]">
            <Target className="h-4 w-4" />
            Mon objectif de moyenne
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <div className="relative w-28">
              <Input
                type="number"
                min={0}
                max={20}
                step={0.5}
                placeholder="ex. 14"
                value={targetInput}
                onChange={e => handleTargetChange(e.target.value)}
                className="h-10 pr-10 text-center font-semibold tabular-nums"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                /20
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Saisis la moyenne que tu vises pour cette matière.
            </p>
          </div>

          {validTarget && average !== null && (
            <div className="mt-3">
              {allSlotsFilled ? (
                <div
                  className={cn(
                    'flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm',
                    average >= targetValue!
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-amber-200 bg-amber-50 text-amber-900',
                  )}
                >
                  {average >= targetValue! ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  <p>
                    {average >= targetValue!
                      ? `Objectif atteint : ta moyenne (${average.toFixed(1)}) est au niveau ou au-dessus de ${targetValue!.toFixed(1)}/20.`
                      : `Toutes les notes sont publiées. Ta moyenne est ${average.toFixed(1)}/20, en dessous de ton objectif ${targetValue!.toFixed(1)}/20.`}
                  </p>
                </div>
              ) : suggestion ? (
                <div
                  className={cn(
                    'flex items-start gap-2.5 rounded-xl border px-3 py-3',
                    suggestion.feasible
                      ? 'border-[#1B3A6B]/20 bg-white'
                      : 'border-red-200 bg-red-50',
                  )}
                >
                  <Lightbulb
                    className={cn(
                      'mt-0.5 h-4 w-4 shrink-0',
                      suggestion.feasible ? 'text-[#7AB832]' : 'text-red-500',
                    )}
                  />
                  <div className="min-w-0 text-sm">
                    {suggestion.feasible ? (
                      <>
                        <p className="font-medium text-gray-900">
                          Pour viser <span className="text-[#1B3A6B]">{targetValue!.toFixed(1)}/20</span>
                          {average !== null && (
                            <span className="text-muted-foreground">
                              {' '}
                              (actuellement {average.toFixed(1)})
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-gray-700">
                          Vise environ{' '}
                          <span className="text-lg font-bold tabular-nums text-[#1B3A6B]">
                            {formatGradeValue(suggestion.requiredGrade)}
                          </span>
                          <span className="font-medium">/20</span> au{' '}
                          <span className="font-semibold">{SLOT_LABELS[suggestion.slot]}</span>.
                        </p>
                        {suggestion.requiredGrade > 18 && (
                          <p className="mt-1 text-xs text-amber-700">
                            C&apos;est un objectif exigeant — continue à réviser régulièrement.
                          </p>
                        )}
                      </>
                    ) : suggestion.requiredGrade > 20 ? (
                      <p className="text-red-800">
                        Avec les notes actuelles, il faudrait plus de 20/20 au{' '}
                        {SLOT_LABELS[suggestion.slot]} pour atteindre {targetValue!.toFixed(1)}.
                        Choisis un objectif plus réaliste ou concentre-toi sur les prochaines évaluations.
                      </p>
                    ) : (
                      <p className="text-red-800">
                        Objectif déjà dépassé pour cette étape — ta moyenne actuelle dépasse {targetValue!.toFixed(1)}/20.
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {validTarget && average === null && suggestion && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-[#1B3A6B]/20 bg-white px-3 py-3 text-sm">
              <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-[#1B3A6B]" />
              <p className="text-gray-700">
                Vise environ{' '}
                <span className="font-bold text-[#1B3A6B]">{formatGradeValue(suggestion.requiredGrade)}/20</span>{' '}
                au {SLOT_LABELS[suggestion.slot]} pour tendre vers {targetValue!.toFixed(1)}/20.
              </p>
            </div>
          )}
        </div>
      )}
    </article>
  )
}
