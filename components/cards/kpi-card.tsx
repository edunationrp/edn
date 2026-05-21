import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  change?: number
  changeLabel?: string
  icon: React.ReactNode
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'teal' | 'gold'
  progress?: number
  progressLabel?: string
  className?: string
}

const colorConfig = {
  blue: { bg: 'bg-blue-50', icon: 'bg-blue-100 text-blue-600', value: 'text-blue-900' },
  green: { bg: 'bg-green-50', icon: 'bg-green-100 text-green-600', value: 'text-green-900' },
  orange: { bg: 'bg-orange-50', icon: 'bg-orange-100 text-orange-600', value: 'text-orange-900' },
  red: { bg: 'bg-red-50', icon: 'bg-red-100 text-red-600', value: 'text-red-900' },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600', value: 'text-purple-900' },
  teal: { bg: 'bg-teal-50', icon: 'bg-teal-100 text-teal-600', value: 'text-teal-900' },
  gold: { bg: 'bg-yellow-50', icon: 'bg-yellow-100 text-yellow-600', value: 'text-yellow-900' },
}

export function KPICard({
  title,
  value,
  subtitle,
  change,
  changeLabel,
  icon,
  color = 'blue',
  progress,
  progressLabel,
  className,
}: KPICardProps) {
  const colors = colorConfig[color]

  return (
    <div className={cn('bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition-shadow', className)}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className={cn('text-2xl font-bold mt-1', colors.value)}>{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <div className={cn('p-2.5 rounded-xl', colors.icon)}>
          {icon}
        </div>
      </div>

      {progress !== undefined && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{progressLabel ?? 'Progression'}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                color === 'green' ? 'bg-green-500' :
                color === 'orange' ? 'bg-orange-500' :
                color === 'red' ? 'bg-red-500' :
                'bg-blue-500'
              )}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}

      {change !== undefined && (
        <div className={cn(
          'mt-3 flex items-center gap-1 text-xs font-medium',
          change > 0 ? 'text-green-600' : change < 0 ? 'text-red-500' : 'text-muted-foreground'
        )}>
          {change > 0 ? <TrendingUp className="h-3 w-3" /> :
           change < 0 ? <TrendingDown className="h-3 w-3" /> :
           <Minus className="h-3 w-3" />}
          <span>
            {change > 0 ? '+' : ''}{change}% {changeLabel ?? 'ce mois'}
          </span>
        </div>
      )}
    </div>
  )
}
