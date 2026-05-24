import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type PageHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
  badge?: string
}

export function PageHeader({ title, description, actions, className, badge }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-2xl border border-slate-200/60 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5',
        className
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
          {badge && (
            <span className="rounded-full bg-[#EDF7E3] px-2.5 py-0.5 text-[11px] font-semibold text-[#5F941F]">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
