import type { PromotionDecisionStatus, PromotionFinalStatus } from '@/lib/promotions/types'

export type PromotionResultRow = {
  studentId: string
  firstName: string
  lastName: string
  iun: string
  computedAverage: number | null
  proposedStatus: PromotionDecisionStatus
  finalStatus: PromotionFinalStatus
  overrideReason: string | null
}

export type ClassPromotionSummary = {
  classId: string
  className: string
  levelName: string | null
  total: number
  admitted: number
  repeat: number
  graduate: number
  incomplete: number
  successRate: number | null
  classAverage: number | null
}

export function summarizeClassResults(
  classMeta: { classId: string; className: string; levelName: string | null },
  rows: PromotionResultRow[],
): ClassPromotionSummary {
  const effective = rows.map(r =>
    r.finalStatus === 'pending' ? r.proposedStatus : (r.finalStatus as PromotionDecisionStatus),
  )
  const admitted = effective.filter(s => s === 'admitted').length
  const repeat = effective.filter(s => s === 'repeat').length
  const graduate = effective.filter(s => s === 'graduate').length
  const incomplete = effective.filter(s => s === 'incomplete').length
  const withAverage = rows.filter(r => r.computedAverage !== null)
  const classAverage =
    withAverage.length > 0
      ? Math.round(
          (withAverage.reduce((sum, r) => sum + (r.computedAverage ?? 0), 0) / withAverage.length) * 100,
        ) / 100
      : null
  const decidable = rows.length - incomplete
  const passed = admitted + graduate

  return {
    ...classMeta,
    total: rows.length,
    admitted,
    repeat,
    graduate,
    incomplete,
    successRate: decidable > 0 ? Math.round((passed / decidable) * 1000) / 10 : null,
    classAverage,
  }
}
