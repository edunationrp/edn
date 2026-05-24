import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { dashboard } from '@/lib/dashboard/ui-classes'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  change?: number
  changeLabel?: string
  icon: React.ReactNode
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'teal' | 'gold' | 'navy'
  progress?: number
  progressLabel?: string
  className?: string
}

const colorConfig = {
  navy: { icon: 'bg-[#EEF3FA] text-[#1B3A6B]', value: 'text-[#1B3A6B]', bar: 'bg-[#1B3A6B]' },
  blue: { icon: 'bg-blue-50 text-blue-600', value: 'text-blue-900', bar: 'bg-blue-500' },
  green: { icon: 'bg-[#EDF7E3] text-[#5F941F]', value: 'text-green-900', bar: 'bg-[#7AB832]' },
  orange: { icon: 'bg-orange-50 text-orange-600', value: 'text-orange-900', bar: 'bg-orange-500' },
  red: { icon: 'bg-red-50 text-red-600', value: 'text-red-900', bar: 'bg-red-500' },
  purple: { icon: 'bg-purple-50 text-purple-600', value: 'text-purple-900', bar: 'bg-purple-500' },
  teal: { icon: 'bg-teal-50 text-teal-600', value: 'text-teal-900', bar: 'bg-teal-500' },
  gold: { icon: 'bg-yellow-50 text-yellow-600', value: 'text-yellow-900', bar: 'bg-yellow-500' },
}

export function KPICard({
  title,
  value,
  subtitle,
  change,
  changeLabel,
  icon,
  color = 'navy',
  progress,
  progressLabel,
  className,
}: KPICardProps) {
  const colors = colorConfig[color]

  return (
    <div className={cn(dashboard.card, dashboard.cardHover, 'p-5', className)}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className={dashboard.label}>{title}</p>
          <p className={cn('mt-1 text-2xl font-extrabold tracking-tight', colors.value)}>{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', colors.icon)}>
          {icon}
        </div>
      </div>

      {progress !== undefined && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs text-slate-500">
            <span>{progressLabel ?? 'Progression'}</span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn('h-full rounded-full transition-all duration-500', colors.bar)}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}

      {change !== undefined && (
        <div
          className={cn(
            'mt-3 flex items-center gap-1 text-xs font-semibold',
            change > 0 ? 'text-green-600' : change < 0 ? 'text-red-500' : 'text-slate-500'
          )}
        >
          {change > 0 ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : change < 0 ? (
            <TrendingDown className="h-3.5 w-3.5" />
          ) : (
            <Minus className="h-3.5 w-3.5" />
          )}
          <span>
            {change > 0 ? '+' : ''}
            {change}% {changeLabel ?? 'ce mois'}
          </span>
        </div>
      )}
    </div>
  )
}
