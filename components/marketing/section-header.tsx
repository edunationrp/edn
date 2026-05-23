import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type SectionHeaderProps = {
  badge: string
  badgeIcon?: ReactNode
  title: ReactNode
  description: string
  align?: 'center' | 'left'
  className?: string
}

export function SectionHeader({
  badge,
  badgeIcon,
  title,
  description,
  align = 'center',
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'mb-14 max-w-3xl',
        align === 'center' && 'mx-auto text-center',
        className
      )}
    >
      <span className="inline-flex items-center gap-2 rounded-full border border-[#1a4d2e]/15 bg-[#f0f9e8] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#1a4d2e]">
        {badgeIcon}
        {badge}
      </span>
      <h2 className="mt-5 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg">{description}</p>
    </div>
  )
}

export function AccentUnderline({ children }: { children: ReactNode }) {
  return (
    <span className="relative inline-block text-[#1a4d2e]">
      {children}
      <svg
        className="absolute -bottom-1 left-0 w-full"
        viewBox="0 0 200 8"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M2 5.5C40 2 80 7 120 4.5C150 2.5 175 5 198 3.5"
          stroke="#7AB832"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}

export function SectionBackdrop() {
  return (
    <>
      <div className="pointer-events-none absolute -left-32 top-16 h-80 w-80 rounded-full bg-[#7AB832]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-[#1B3A6B]/8 blur-3xl" />
    </>
  )
}
