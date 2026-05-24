import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type WelcomeBannerProps = {
  eyebrow: string
  title: string
  description: ReactNode
  actions?: ReactNode
  icon?: ReactNode
  className?: string
}

export function WelcomeBanner({
  eyebrow,
  title,
  description,
  actions,
  icon,
  className,
}: WelcomeBannerProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B3A6B] via-[#183560] to-[#122847] p-5 text-white shadow-[0_12px_40px_-16px_rgba(27,58,107,0.55)] sm:p-7',
        className
      )}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#7AB832]/12 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#A8DA63]">
            {eyebrow}
          </p>
          <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">{title}</h2>
          <div className="mt-2 max-w-xl text-sm leading-relaxed text-white/78">{description}</div>
          {actions && <div className="mt-5 flex flex-wrap gap-2.5">{actions}</div>}
        </div>

        {icon && (
          <div className="hidden shrink-0 sm:flex h-24 w-24 items-center justify-center rounded-2xl border border-white/10 bg-white/8 backdrop-blur-sm">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
