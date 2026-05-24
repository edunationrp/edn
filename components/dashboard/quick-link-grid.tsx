import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { dashboard } from '@/lib/dashboard/ui-classes'

export type QuickLinkItem = {
  href: string
  label: string
  desc: string
  icon: LucideIcon
}

type QuickLinkGridProps = {
  links: QuickLinkItem[]
  columns?: 2 | 3
  className?: string
}

export function QuickLinkGrid({ links, columns = 3, className }: QuickLinkGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-3',
        columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 xl:grid-cols-3',
        className
      )}
    >
      {links.map(link => {
        const Icon = link.icon
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'group flex items-center gap-3.5 p-4',
              dashboard.card,
              dashboard.cardHover
            )}
          >
            <div className={dashboard.iconBox}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900">{link.label}</p>
              <p className="truncate text-xs text-slate-500">{link.desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#7AB832]" />
          </Link>
        )
      })}
    </div>
  )
}
