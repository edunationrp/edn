'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Bot, Sparkles } from 'lucide-react'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { EduBotDialogPanel } from '@/components/tuteur/edubot-dialog'

const HIDDEN_ON_FULL_PAGE = '/eleve/tuteur'

function shouldHideFab(pathname: string) {
  return pathname === HIDDEN_ON_FULL_PAGE || pathname.startsWith(`${HIDDEN_ON_FULL_PAGE}/`)
}

export function EduBotFloatingButton() {
  const pathname = usePathname() ?? ''
  const [open, setOpen] = useState(false)

  if (shouldHideFab(pathname)) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          title="EduBot — Assistant scolaire gratuit"
          aria-label="Ouvrir EduBot, assistant scolaire gratuit"
          className="group fixed z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#1B3A6B] to-[#234a82] text-white shadow-[0_10px_32px_-6px_rgba(27,58,107,0.55)] ring-2 ring-white/90 transition-transform active:scale-95 hover:scale-105 bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] sm:h-[3.75rem] sm:w-auto sm:gap-2 sm:rounded-full sm:px-4"
        >
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center sm:h-10 sm:w-10">
            <span className="absolute inset-0 rounded-full bg-[#7AB832]/30 opacity-75 animate-ping" />
            <span className="relative flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#7AB832] to-[#5F941F]">
              <Bot className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <Sparkles
              className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 text-[#7AB832]"
              aria-hidden
            />
          </span>
          <span className="hidden pr-1 text-sm font-semibold sm:inline">EduBot</span>
        </button>
      </DialogTrigger>

      <EduBotDialogPanel open={open} />
    </Dialog>
  )
}
