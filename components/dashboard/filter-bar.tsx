import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { dashboard } from '@/lib/dashboard/ui-classes'

type FilterBarProps = {
  children: ReactNode
  className?: string
}

export function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center',
        className
      )}
    >
      {children}
    </div>
  )
}

type FilterSearchProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  icon?: ReactNode
}

export function FilterSearch({ value, onChange, placeholder, icon }: FilterSearchProps) {
  return (
    <div className="relative min-w-0 flex-1">
      {icon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
      )}
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? 'Rechercher…'}
        className={cn(
          'h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm transition',
          'placeholder:text-slate-400 focus:border-[#7AB832]/50 focus:outline-none focus:ring-2 focus:ring-[#7AB832]/20',
          icon && 'pl-9'
        )}
      />
    </div>
  )
}

type FilterSelectProps = {
  value: string
  onChange: (value: string) => void
  children: ReactNode
  className?: string
}

export function FilterSelect({ value, onChange, children, className }: FilterSelectProps) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={cn(
        'h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm transition',
        'focus:border-[#7AB832]/50 focus:outline-none focus:ring-2 focus:ring-[#7AB832]/20',
        className
      )}
    >
      {children}
    </select>
  )
}

export function DataTableShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn(dashboard.card, 'overflow-hidden', className)}>
      {children}
    </div>
  )
}
