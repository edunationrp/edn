import { Badge } from '@/components/ui/badge'
import { PROMOTION_STATUS_LABELS, type PromotionDecisionStatus } from '@/lib/promotions/types'
import { cn } from '@/lib/utils'

const STATUS_VARIANT: Record<PromotionDecisionStatus, string> = {
  admitted: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
  repeat: 'bg-amber-500/15 text-amber-800 border-amber-500/30',
  graduate: 'bg-sky-500/15 text-sky-800 border-sky-500/30',
  incomplete: 'bg-slate-500/15 text-slate-700 border-slate-500/30',
}

export function PromotionStatusBadge({ status }: { status: PromotionDecisionStatus }) {
  return (
    <Badge variant="outline" className={cn('font-medium', STATUS_VARIANT[status])}>
      {PROMOTION_STATUS_LABELS[status]}
    </Badge>
  )
}
