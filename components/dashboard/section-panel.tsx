import Link from 'next/link'
import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { dashboard } from '@/lib/dashboard/ui-classes'

type SectionPanelProps = {
  title: string
  description?: string
  actionHref?: string
  actionLabel?: string
  children: ReactNode
  className?: string
}

export function SectionPanel({
  title,
  description,
  actionHref,
  actionLabel = 'Tout voir',
  children,
  className,
}: SectionPanelProps) {
  return (
    <section className={cn(dashboard.card, 'overflow-hidden', className)}>
      <div className={dashboard.cardHeader}>
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
        </div>
        {actionHref && (
          <Link href={actionHref} className={cn('flex items-center gap-1 text-xs', dashboard.link)}>
            {actionLabel}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      <div className="divide-y divide-slate-100">{children}</div>
    </section>
  )
}

type SectionRowProps = {
  href: string
  title: string
  subtitle?: string
  icon: ReactNode
  iconClassName?: string
}

export function SectionRow({ href, title, subtitle, icon, iconClassName }: SectionRowProps) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3.5 px-5 py-4 transition hover:bg-slate-50/80"
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          iconClassName ?? 'bg-amber-50 text-amber-700'
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800 group-hover:text-[#1B3A6B]">{title}</p>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#7AB832]" />
    </Link>
  )
}
