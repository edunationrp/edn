import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { dashboard } from '@/lib/dashboard/ui-classes'

type StatTone = 'navy' | 'green' | 'amber' | 'rose' | 'sky' | 'violet'

const toneStyles: Record<StatTone, { icon: string; ring: string }> = {
  navy: { icon: 'bg-[#EEF3FA] text-[#1B3A6B]', ring: 'ring-[#1B3A6B]/10' },
  green: { icon: 'bg-[#EDF7E3] text-[#5F941F]', ring: 'ring-[#7AB832]/15' },
  amber: { icon: 'bg-amber-50 text-amber-600', ring: 'ring-amber-500/15' },
  rose: { icon: 'bg-rose-50 text-rose-600', ring: 'ring-rose-500/15' },
  sky: { icon: 'bg-sky-50 text-sky-600', ring: 'ring-sky-500/15' },
  violet: { icon: 'bg-violet-50 text-violet-600', ring: 'ring-violet-500/15' },
}

type StatCardProps = {
  title: string
  value: string | number
  subtitle?: ReactNode
  icon: ReactNode
  tone?: StatTone
  className?: string
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  tone = 'navy',
  className,
}: StatCardProps) {
  const styles = toneStyles[tone]

  return (
    <div
      className={cn(
        dashboard.card,
        dashboard.cardHover,
        'p-5 ring-1 ring-inset',
        styles.ring,
        className
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className={dashboard.label}>{title}</p>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', styles.icon)}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
      {subtitle && <div className="mt-1.5 text-xs text-slate-500">{subtitle}</div>}
    </div>
  )
}
