import type { GradeSequenceSlot } from '@/lib/grades/sheet-types'
import { SLOT_LABELS, SLOT_WEIGHTS } from '@/lib/grades/sheet-types'

export type GradeSlots = {
  devoir1: number | null
  devoir2: number | null
  examen: number | null
}

export function getNextMissingSlot(slots: GradeSlots): GradeSequenceSlot | null {
  if (slots.devoir1 === null) return 'devoir1'
  if (slots.devoir2 === null) return 'devoir2'
  if (slots.examen === null) return 'examen'
  return null
}

export function computeRequiredGradeForTarget(
  slots: GradeSlots,
  targetAverage: number,
): { slot: GradeSequenceSlot; requiredGrade: number; feasible: boolean } | null {
  const slot = getNextMissingSlot(slots)
  if (!slot) return null

  const parts: Array<{ value: number; weight: number }> = []
  if (slots.devoir1 !== null) parts.push({ value: slots.devoir1, weight: SLOT_WEIGHTS.devoir1 })
  if (slots.devoir2 !== null) parts.push({ value: slots.devoir2, weight: SLOT_WEIGHTS.devoir2 })
  if (slots.examen !== null) parts.push({ value: slots.examen, weight: SLOT_WEIGHTS.examen })

  const weightedSum = parts.reduce((sum, part) => sum + part.value * part.weight, 0)
  const totalWeight = parts.reduce((sum, part) => sum + part.weight, 0)
  const nextWeight = SLOT_WEIGHTS[slot]

  const required = (targetAverage * (totalWeight + nextWeight) - weightedSum) / nextWeight
  const rounded = Math.round(required * 10) / 10

  return {
    slot,
    requiredGrade: rounded,
    feasible: rounded >= 0 && rounded <= 20,
  }
}

export function getGradeLevel(value: number, max = 20) {
  const ratio = value / max
  if (ratio >= 0.7) return 'high' as const
  if (ratio >= 0.5) return 'mid' as const
  return 'low' as const
}

export const GRADE_LEVEL_STYLES = {
  high: {
    text: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800',
    ring: 'ring-emerald-200',
  },
  mid: {
    text: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-800',
    ring: 'ring-amber-200',
  },
  low: {
    text: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-800',
    ring: 'ring-red-200',
  },
} as const

export function formatGradeValue(value: number | null) {
  if (value === null) return '—'
  return value.toFixed(2).replace(/\.?0+$/, '')
}

export function targetStorageKey(term: string, subjectId: string) {
  return `${term}:${subjectId}`
}

export { SLOT_LABELS }
