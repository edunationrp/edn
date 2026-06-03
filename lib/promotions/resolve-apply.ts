import type { PromotionDecisionStatus, PromotionFinalStatus } from '@/lib/promotions/types'

export type ClassMappingRow = {
  source_class_id: string
  target_class_id: string | null
  repeat_target_class_id: string | null
}

export function effectivePromotionStatus(
  proposed: PromotionDecisionStatus,
  final: PromotionFinalStatus,
): PromotionDecisionStatus {
  return final === 'pending' ? proposed : (final as PromotionDecisionStatus)
}

export function resolveTargetClassId(
  status: PromotionDecisionStatus,
  mapping: ClassMappingRow | undefined,
): string | null {
  if (status === 'admitted') return mapping?.target_class_id ?? null
  if (status === 'repeat') return mapping?.repeat_target_class_id ?? null
  return null
}

export function sourceEnrollmentStatusAfterApply(status: PromotionDecisionStatus): string {
  if (status === 'graduate') return 'graduated'
  if (status === 'incomplete') return 'active'
  return 'promoted'
}

export type ApplyPreviewRow = {
  studentId: string
  studentName: string
  iun: string
  sourceClassName: string
  decision: PromotionDecisionStatus
  targetClassName: string | null
  action: 'enroll' | 'graduate' | 'skip_incomplete' | 'error'
  error?: string
}

export type ApplyPreviewSummary = {
  enrollCount: number
  graduateCount: number
  repeatCount: number
  admittedCount: number
  incompleteCount: number
  errorCount: number
  canApply: boolean
  blockers: string[]
}
