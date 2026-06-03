'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GraduationCap, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { markNotificationRead } from '@/lib/actions/notifications'
import type { StudentNotificationItem } from '@/features/eleve/student-notifications-panel'

const SESSION_KEY = 'edn-course-alerts-dismissed'

type Props = {
  notifications: StudentNotificationItem[]
}

function getDismissedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function addDismissedIds(ids: string[]) {
  const current = getDismissedIds()
  for (const id of ids) current.add(id)
  sessionStorage.setItem(SESSION_KEY, JSON.stringify([...current]))
}

export function StudentCourseWelcomeAlert({ notifications }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState<StudentNotificationItem[]>([])

  useEffect(() => {
    const unread = notifications.filter(n => n.type === 'course' && !n.is_read)
    const dismissed = getDismissedIds()
    const toShow = unread.filter(n => !dismissed.has(n.id))
    if (toShow.length > 0) {
      setPending(toShow)
      setOpen(true)
    }
  }, [notifications])

  async function dismiss(markRead: boolean) {
    const ids = pending.map(n => n.id)
    addDismissedIds(ids)
    if (markRead) {
      await Promise.all(ids.map(id => markNotificationRead(id)))
    }
    setOpen(false)
    setPending([])
  }

  async function handleViewCourses() {
    await dismiss(true)
    router.push('/eleve/cours')
  }

  if (pending.length === 0) return null

  const primary = pending[0]

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) void dismiss(false) }}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden border-0 p-0 sm:max-w-xl [&>button.absolute]:hidden">
        <div className="relative bg-gradient-to-br from-emerald-700 via-emerald-600 to-[#1B3A6B] px-6 pb-6 pt-8 text-white sm:px-8 sm:pt-10">
          <button
            type="button"
            aria-label="Fermer"
            className="absolute right-4 top-4 rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            onClick={() => void dismiss(false)}
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 shadow-lg backdrop-blur-sm">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>

          <DialogTitle className="text-left text-2xl font-bold leading-tight text-white sm:text-3xl">
            {pending.length > 1 ? 'Nouveaux documents de cours' : primary.title}
          </DialogTitle>
          <DialogDescription className="mt-3 text-left text-base leading-relaxed text-white/90">
            {pending.length > 1
              ? `${pending.length} ressources viennent d'être publiées par tes professeurs.`
              : primary.body}
          </DialogDescription>

          {pending.length > 1 && (
            <ul className="mt-4 max-h-36 space-y-2 overflow-y-auto rounded-xl bg-white/10 p-3 text-sm text-white/95">
              {pending.slice(0, 5).map(n => (
                <li key={n.id} className="flex gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-200" />
                  <span>{n.body}</span>
                </li>
              ))}
              {pending.length > 5 && (
                <li className="text-xs text-white/60">+ {pending.length - 5} autre(s)</li>
              )}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-2 bg-white px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
          <Button
            type="button"
            variant="outline"
            className="order-2 sm:order-1"
            onClick={() => void dismiss(false)}
          >
            Plus tard
          </Button>
          <Button
            type="button"
            className="order-1 bg-emerald-600 hover:bg-emerald-700 sm:order-2"
            onClick={() => void handleViewCourses()}
          >
            Voir les cours
          </Button>
          <Button type="button" variant="ghost" className="order-3 sm:hidden" asChild>
            <Link href="/eleve/notifications" onClick={() => void dismiss(false)}>
              Toutes les notifications
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
