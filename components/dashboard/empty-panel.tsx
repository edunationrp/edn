import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyPanel({ icon, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-10 text-center',
        className
      )}
    >
      {icon && <div className="mb-3 text-gray-300">{icon}</div>}
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs leading-relaxed text-gray-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
