'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Check, ChevronDown, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { setActiveParentChild } from '@/lib/actions/parent-portal'
import type { ParentChildSummary } from '@/lib/parent/parent-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type ChildSwitcherProps = {
  linkedChildren: ParentChildSummary[]
  activeChild: ParentChildSummary | null
  compact?: boolean
}

export function ChildSwitcher({ linkedChildren, activeChild, compact = false }: ChildSwitcherProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  if (linkedChildren.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/20 bg-white/5 px-3 py-2 text-xs text-white/60">
        Aucun enfant rattaché
      </div>
    )
  }

  async function handleSelect(studentId: string) {
    if (studentId === activeChild?.studentId) return

    startTransition(async () => {
      const result = await setActiveParentChild(studentId)
      if (!result.error) {
        router.refresh()
      }
    })
  }

  const label = activeChild?.fullName ?? 'Choisir un enfant'
  const subtitle = activeChild
    ? [activeChild.className, activeChild.schoolName].filter(Boolean).join(' · ')
    : 'Sélectionnez un enfant'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={pending || linkedChildren.length <= 1}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-xl border text-left transition-colors',
          compact
            ? 'border-slate-200 bg-white px-3 py-2 hover:bg-slate-50'
            : 'border-white/10 bg-white/10 px-3 py-2.5 hover:bg-white/15',
          linkedChildren.length <= 1 && 'cursor-default',
        )}
      >
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
            compact ? 'bg-[#1B3A6B]/10 text-[#1B3A6B]' : 'bg-[#7AB832]/20 text-[#7AB832]',
          )}
        >
          {activeChild?.schoolLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={activeChild.schoolLogoUrl} alt="" className="h-full w-full rounded-lg object-contain p-0.5" />
          ) : (
            <Users className="h-4 w-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className={cn('truncate text-xs font-semibold', compact ? 'text-gray-900' : 'text-white')}>
            {label}
          </div>
          <div className={cn('truncate text-[10px]', compact ? 'text-muted-foreground' : 'text-white/50')}>
            {subtitle}
          </div>
        </div>
        {linkedChildren.length > 1 && (
          <ChevronDown className={cn('h-3.5 w-3.5 shrink-0', compact ? 'text-gray-400' : 'text-white/40')} />
        )}
      </DropdownMenuTrigger>
      {linkedChildren.length > 1 && (
        <DropdownMenuContent align="start" className="w-[min(92vw,320px)]">
          <DropdownMenuLabel>Mes enfants</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {linkedChildren.map(child => {
            const selected = child.studentId === activeChild?.studentId
            return (
              <DropdownMenuItem
                key={child.studentId}
                className="flex items-start gap-2 py-2.5"
                onClick={() => handleSelect(child.studentId)}
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#1B3A6B]/10 text-[10px] font-bold text-[#1B3A6B]">
                  {child.firstName[0]?.toUpperCase()}
                  {child.lastName[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{child.fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[child.className, child.schoolName].filter(Boolean).join(' · ')}
                  </p>
                </div>
                {selected && <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7AB832]" />}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  )
}
