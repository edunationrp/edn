'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bot, Loader2, Sparkles } from 'lucide-react'
import {
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { TutorChatClient } from '@/features/tuteur/tutor-chat-client'
import type { TutorConversationSummary } from '@/lib/actions/student-tutor'
import { PUBLIC_TUTOR_CONTEXT } from '@/lib/eleve/tutor-types'
import { cn } from '@/lib/utils'

type TutorInitPayload = {
  mode: 'guest' | 'student'
  firstName: string
  className: string
  schoolName: string
  subjects: string[]
  conversations: TutorConversationSummary[]
  aiConfigured: boolean
  isAuthenticated: boolean
}

const GUEST_FALLBACK: TutorInitPayload = {
  mode: 'guest',
  firstName: PUBLIC_TUTOR_CONTEXT.firstName,
  className: PUBLIC_TUTOR_CONTEXT.className,
  schoolName: PUBLIC_TUTOR_CONTEXT.schoolName,
  subjects: [],
  conversations: [],
  aiConfigured: true,
  isAuthenticated: false,
}

type EduBotDialogPanelProps = {
  open: boolean
}

export function EduBotDialogPanel({ open }: EduBotDialogPanelProps) {
  const [init, setInit] = useState<TutorInitPayload | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const loadInit = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)

      const res = await fetch('/api/tutor/init', {
        cache: 'no-store',
        signal: controller.signal,
      })
      clearTimeout(timeout)

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? `Erreur ${res.status}`)
      }
      const data = (await res.json()) as TutorInitPayload
      setInit(data)
    } catch (err) {
      const isAbort = err instanceof Error && err.name === 'AbortError'
      setFetchError(
        isAbort
          ? 'Le chargement a pris trop de temps. Réessaie.'
          : err instanceof Error
            ? err.message
            : 'Impossible de joindre le serveur EduBot.',
      )
      setInit(GUEST_FALLBACK)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) {
      setInit(null)
      setFetchError(null)
      setLoading(false)
      return
    }
    void loadInit()
  }, [open, loadInit])

  if (!open) return null

  const payload = init

  return (
    <DialogContent
      className={cn(
        'flex max-h-[min(720px,92dvh)] flex-col gap-0 overflow-hidden border-0 p-0 shadow-2xl',
        'w-[calc(100vw-1rem)] max-w-2xl',
        'max-sm:fixed max-sm:inset-0 max-sm:h-dvh max-sm:max-h-dvh max-sm:w-full max-sm:max-w-none',
        'max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none',
        '[&>button]:right-3 [&>button]:top-3 [&>button]:z-20 [&>button]:rounded-full [&>button]:bg-white/90 [&>button]:shadow-sm',
      )}
      onOpenAutoFocus={e => e.preventDefault()}
    >
      <DialogTitle className="sr-only">EduBot — Assistant scolaire</DialogTitle>
      <DialogDescription className="sr-only">
        Pose tes questions scolaires à EduBot, dans le cadre de l&apos;école uniquement.
      </DialogDescription>

      {fetchError && !loading && (
        <div className="shrink-0 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900">
          {fetchError}
          <button
            type="button"
            className="ml-2 font-semibold underline"
            onClick={() => void loadInit()}
          >
            Réessayer
          </button>
        </div>
      )}

      {loading || !payload ? (
        <div className="flex min-h-[min(420px,70dvh)] flex-col items-center justify-center gap-4 bg-gradient-to-br from-[#F0F4F8] to-white px-6">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7AB832] to-[#5F941F] shadow-lg">
            <Bot className="h-8 w-8 text-white" />
            <Sparkles className="absolute -right-1 -top-1 h-4 w-4 text-[#1B3A6B]" />
          </div>
          <div className="flex items-center gap-2 text-sm text-[#1B3A6B]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Préparation d&apos;EduBot…
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <TutorChatClient
            key={`${payload.mode}-${payload.isAuthenticated}-${payload.aiConfigured}`}
            mode={payload.mode}
            inDialog
            firstName={payload.firstName}
            className={payload.className}
            schoolName={payload.schoolName}
            subjects={payload.subjects}
            initialConversations={payload.conversations}
            aiConfigured={payload.aiConfigured}
            isAuthenticated={payload.isAuthenticated}
          />
        </div>
      )}
    </DialogContent>
  )
}
