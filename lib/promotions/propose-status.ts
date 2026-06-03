import type { PromotionDecisionStatus } from '@/lib/promotions/types'

export function proposePromotionStatus(input: {
  average: number | null
  passingAverage: number
  hasNextLevel: boolean
}): PromotionDecisionStatus {
  if (input.average === null) return 'incomplete'
  if (!input.hasNextLevel) {
    return input.average >= input.passingAverage ? 'graduate' : 'repeat'
  }
  return input.average >= input.passingAverage ? 'admitted' : 'repeat'
}
