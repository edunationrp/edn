export type PromotionAverageRule = 'last_term' | 'mean_of_terms'

export type PromotionDecisionStatus = 'admitted' | 'repeat' | 'graduate' | 'incomplete'

export type PromotionFinalStatus = PromotionDecisionStatus | 'pending'

export type PromotionSessionStatus = 'draft' | 'applied'

export const PROMOTION_STATUS_LABELS: Record<PromotionDecisionStatus, string> = {
  admitted: 'Admis',
  repeat: 'Redouble',
  graduate: 'Sortant (fin de cycle)',
  incomplete: 'Notes incomplètes',
}

export const PROMOTION_AVERAGE_RULE_LABELS: Record<PromotionAverageRule, string> = {
  last_term: 'Dernier trimestre',
  mean_of_terms: 'Moyenne des trimestres',
}
