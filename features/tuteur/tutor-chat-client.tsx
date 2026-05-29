'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  Bot,
  ChevronLeft,
  GraduationCap,
  History,
  Lightbulb,
  Loader2,
  LogIn,
  MessageSquarePlus,
  Send,
  Shield,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  createTutorConversation,
  deleteTutorConversation,
  getTutorMessages,
  saveTutorExchange,
  type TutorConversationSummary,
  type TutorMessageRow,
} from '@/lib/actions/student-tutor'
import { formatTutorResponse } from '@/lib/eleve/tutor-format-response'
import {
  createGuestConversation,
  deleteGuestConversation,
  getGuestConversation,
  listGuestConversations,
  saveGuestExchange,
  type GuestTutorConversation,
} from '@/lib/eleve/tutor-guest-storage'

const SUGGESTED_PROMPTS = [
  'Comment bien réviser avant un contrôle ?',
  'Explique-moi une notion difficile pas à pas',
  'Donne-moi une astuce pour mieux mémoriser',
  'Aide-moi à organiser mon travail cette semaine',
]

type LocalMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  streaming?: boolean
}

export type TutorChatClientProps = {
  mode: 'guest' | 'student'
  firstName: string
  className: string
  schoolName: string
  subjects: string[]
  initialConversations?: TutorConversationSummary[]
  aiConfigured: boolean
  isAuthenticated?: boolean
  embedded?: boolean
}

function makeId() {
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function deriveTitle(text: string) {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= 48) return clean
  return `${clean.slice(0, 45)}…`
}

function guestToSummary(c: GuestTutorConversation): TutorConversationSummary {
  return {
    id: c.id,
    title: c.title,
    updated_at: c.updated_at,
    last_preview: c.last_preview,
  }
}

export function TutorChatClient({
  mode,
  firstName,
  className: studentClass,
  schoolName,
  subjects,
  initialConversations = [],
  aiConfigured,
  isAuthenticated = false,
  embedded = false,
}: TutorChatClientProps) {
  const isGuest = mode === 'guest'

  const [conversations, setConversations] = useState<TutorConversationSummary[]>(
    initialConversations,
  )
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<LocalMessage[]>([])
  const [input, setInput] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [loadingConv, setLoadingConv] = useState(false)
  const [sending, setSending] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const showWelcome = messages.length === 0 && !loadingConv

  const subjectChips = useMemo(() => {
    if (subjects.length > 0) return subjects.slice(0, 8)
    return ['Mathématiques', 'Français', 'Sciences', 'Histoire-Géo', 'Anglais', 'SVT']
  }, [subjects])

  useEffect(() => {
    if (isGuest) {
      setConversations(listGuestConversations().map(guestToSummary))
    }
  }, [isGuest])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, sending])

  const loadConversation = useCallback(
    async (id: string) => {
      setLoadingConv(true)
      setError(null)

      if (isGuest) {
        const conv = getGuestConversation(id)
        if (!conv) {
          setError('Conversation introuvable.')
          setMessages([])
        } else {
          setMessages(conv.messages)
        }
      } else {
        const { messages: rows, error: loadError } = await getTutorMessages(id)
        if (loadError) {
          setError(loadError)
          setMessages([])
        } else {
          setMessages(
            rows.map((m: TutorMessageRow) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              created_at: m.created_at,
            })),
          )
        }
      }

      setActiveId(id)
      setLoadingConv(false)
      setHistoryOpen(false)
    },
    [isGuest],
  )

  async function ensureConversation(): Promise<string | null> {
    if (activeId) return activeId

    if (isGuest) {
      const conv = createGuestConversation()
      setConversations(prev => [guestToSummary(conv), ...prev])
      setActiveId(conv.id)
      return conv.id
    }

    const { conversationId, error: createError } = await createTutorConversation()
    if (createError || !conversationId) {
      setError(createError ?? 'Impossible de démarrer la conversation.')
      return null
    }
    setConversations(prev => [
      {
        id: conversationId,
        title: 'Nouvelle conversation',
        updated_at: new Date().toISOString(),
        last_preview: null,
      },
      ...prev,
    ])
    setActiveId(conversationId)
    return conversationId
  }

  async function handleNewConversation() {
    setActiveId(null)
    setMessages([])
    setInput('')
    setSelectedSubject(null)
    setError(null)
    setHistoryOpen(false)
  }

  async function handleDeleteConversation(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (isGuest) {
      deleteGuestConversation(id)
      setConversations(prev => prev.filter(c => c.id !== id))
    } else {
      await deleteTutorConversation(id)
      setConversations(prev => prev.filter(c => c.id !== id))
    }
    if (activeId === id) {
      setActiveId(null)
      setMessages([])
    }
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    if (!aiConfigured) {
      setError(
        "L'assistant n'est pas configuré sur ce serveur (OPENAI_API_KEY).",
      )
      return
    }

    const convId = await ensureConversation()
    if (!convId) return

    setSending(true)
    setError(null)
    setInput('')

    const userMsg: LocalMessage = {
      id: makeId(),
      role: 'user',
      content: trimmed,
      created_at: new Date().toISOString(),
    }
    const assistantId = makeId()
    const assistantPlaceholder: LocalMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
      streaming: true,
    }

    setMessages(prev => [...prev, userMsg, assistantPlaceholder])

    const history = messages
      .filter(m => !m.streaming && m.content)
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }))

    let fullAssistant = ''

    try {
      const res = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history,
          ...(isGuest ? {} : { conversationId: convId }),
        }),
      })

      if (!res.ok) {
        const errJson = (await res.json().catch(() => null)) as {
          message?: string
          error?: string
        } | null
        throw new Error(errJson?.message ?? errJson?.error ?? `Erreur ${res.status}`)
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('Réponse vide')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''

        for (const part of parts) {
          const line = part.trim()
          if (!line.startsWith('data:')) continue
          try {
            const payload = JSON.parse(line.slice(5).trim()) as {
              type: string
              text?: string
              full?: string
              message?: string
            }
            if (payload.type === 'delta' && payload.text) {
              fullAssistant += payload.text
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId ? { ...m, content: fullAssistant } : m,
                ),
              )
            }
            if (payload.type === 'done' && payload.full) {
              fullAssistant = formatTutorResponse(payload.full)
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId
                    ? { ...m, content: fullAssistant, streaming: false }
                    : m,
                ),
              )
            }
            if (payload.type === 'error') {
              throw new Error(payload.message ?? 'Erreur IA')
            }
          } catch (parseErr) {
            if (parseErr instanceof SyntaxError) continue
            throw parseErr
          }
        }
      }

      const finalContent = formatTutorResponse(
        fullAssistant || "Je n'ai pas pu formuler de réponse.",
      )

      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: finalContent, streaming: false }
            : m,
        ),
      )

      const title = deriveTitle(trimmed)

      if (isGuest) {
        saveGuestExchange(convId, trimmed, finalContent, title)
        setConversations(listGuestConversations().map(guestToSummary))
      } else {
        await saveTutorExchange(convId, trimmed, finalContent, {
          conversationTitle: title,
        })
        setConversations(prev =>
          prev.map(c =>
            c.id === convId
              ? {
                  ...c,
                  title:
                    c.title === 'Nouvelle conversation' ? title : c.title,
                  updated_at: new Date().toISOString(),
                  last_preview: finalContent.slice(0, 80),
                }
              : c,
          ),
        )
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inattendue'
      setError(msg)
      setMessages(prev => prev.filter(m => m.id !== assistantId))
    } finally {
      setSending(false)
      textareaRef.current?.focus()
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const prefix = selectedSubject ? `[${selectedSubject}] ` : ''
    void sendMessage(prefix + input)
  }

  function handlePromptClick(prompt: string) {
    const prefix = selectedSubject ? `En ${selectedSubject} : ` : ''
    void sendMessage(prefix + prompt)
  }

  const headerSubtitle = isGuest
    ? 'Gratuit · collège & lycée · cadre scolaire uniquement'
    : `Salut ${firstName} — ${studentClass} · ${schoolName}`

  const welcomeIntro = isGuest
    ? 'Pose une question sur tes cours, révisions ou méthodes de travail. Aucune connexion requise — EduBot reste dans le cadre scolaire.'
    : 'Explications de cours, astuces de révision, méthodes de travail et organisation — toujours dans le cadre de ton école.'

  function conversationList() {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-slate-200/80 px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Historique{isGuest ? ' (cet appareil)' : ''}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-[#1B3A6B]"
            onClick={() => void handleNewConversation()}
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
            Nouveau
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {conversations.length === 0 ? (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">
              Aucune conversation pour l&apos;instant
            </p>
          ) : (
            <ul className="space-y-1">
              {conversations.map(conv => (
                <li
                  key={conv.id}
                  className={cn(
                    'group flex items-start gap-1 rounded-xl transition-colors',
                    activeId === conv.id
                      ? 'bg-[#1B3A6B]/10 text-[#1B3A6B]'
                      : 'hover:bg-slate-100 text-slate-700',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => void loadConversation(conv.id)}
                    className="min-w-0 flex-1 rounded-xl px-3 py-2.5 text-left"
                  >
                    <p className="truncate text-sm font-medium">{conv.title}</p>
                    {conv.last_preview && (
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {conv.last_preview}
                      </p>
                    )}
                  </button>
                  <button
                    type="button"
                    aria-label="Supprimer"
                    className="mr-1 mt-2 shrink-0 rounded-lg p-1 text-slate-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                    onClick={e => void handleDeleteConversation(conv.id, e)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    )
  }

  const rootClass = embedded
    ? 'flex min-h-[min(68dvh,680px)] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm'
    : 'flex min-h-[calc(100dvh-10rem)] flex-col sm:min-h-[calc(100dvh-11rem)]'

  return (
    <div className={rootClass}>
      <div
        className={cn(
          'shrink-0 bg-gradient-to-br from-[#1B3A6B] via-[#234a82] to-[#1B3A6B] px-4 text-white',
          embedded ? 'rounded-t-2xl py-3' : 'rounded-t-2xl border border-slate-200/80 py-4 shadow-sm',
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'relative flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#7AB832] to-[#5F941F] shadow-lg ring-2 ring-white/20',
              embedded ? 'h-10 w-10' : 'h-12 w-12 rounded-2xl',
            )}
          >
            <Bot className={embedded ? 'h-5 w-5' : 'h-6 w-6'} />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[#1B3A6B] shadow">
              <Sparkles className="h-2.5 w-2.5" />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {!embedded && <h1 className="text-lg font-bold tracking-tight">EduBot</h1>}
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium">
                <Shield className="h-3 w-3" />
                Cadre scolaire uniquement
              </span>
              {isGuest && (
                <span className="rounded-full bg-[#7AB832]/90 px-2 py-0.5 text-[10px] font-semibold">
                  Accès libre
                </span>
              )}
            </div>
            <p className={cn('text-white/80', embedded ? 'text-xs' : 'mt-0.5 text-sm')}>
              {headerSubtitle}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 text-white hover:bg-white/15 lg:hidden"
            onClick={() => setHistoryOpen(v => !v)}
          >
            <History className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isGuest && !isAuthenticated && !embedded && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-x border-slate-200/80 bg-[#7AB832]/10 px-4 py-2.5 text-sm text-[#1B3A6B]">
          <span>
            Connecte-toi pour lier EduBot à ta classe, tes matières et tes notes.
          </span>
          <Button asChild size="sm" variant="outline" className="shrink-0 border-[#1B3A6B]/30 bg-white">
            <Link href="/login/eleve">
              <LogIn className="mr-1 h-3.5 w-3.5" />
              Connexion élève
            </Link>
          </Button>
        </div>
      )}

      <div
        className={cn(
          'relative flex min-h-0 flex-1 flex-col bg-white',
          embedded ? 'rounded-b-2xl' : 'rounded-b-2xl border border-t-0 border-slate-200/80 shadow-sm',
        )}
      >
        {historyOpen && (
          <div className="absolute inset-0 z-20 flex flex-col rounded-b-2xl bg-white lg:hidden">
            <div className="flex items-center gap-2 border-b px-3 py-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setHistoryOpen(false)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">Conversations</span>
            </div>
            {conversationList()}
          </div>
        )}

        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-52 shrink-0 border-r border-slate-100 lg:flex lg:flex-col">
            {conversationList()}
          </aside>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 sm:px-4">
              {loadingConv ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#1B3A6B]/40" />
                </div>
              ) : showWelcome ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-[#7AB832]/25 bg-gradient-to-br from-[#7AB832]/8 to-[#1B3A6B]/5 p-4">
                    <div className="flex gap-3">
                      <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-[#7AB832]" />
                      <div>
                        <p className="text-sm font-semibold text-[#1B3A6B]">
                          {isGuest ? 'Bienvenue sur EduBot' : 'Comment je peux t&apos;aider ?'}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">
                          {welcomeIntro}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Matière (optionnel)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {subjectChips.map(subject => (
                        <button
                          key={subject}
                          type="button"
                          onClick={() =>
                            setSelectedSubject(prev => (prev === subject ? null : subject))
                          }
                          className={cn(
                            'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                            selectedSubject === subject
                              ? 'border-[#7AB832] bg-[#7AB832] text-white shadow-sm'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-[#1B3A6B]/30',
                          )}
                        >
                          {subject}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <BookOpen className="h-3.5 w-3.5" />
                      Suggestions
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {SUGGESTED_PROMPTS.map(prompt => (
                        <button
                          key={prompt}
                          type="button"
                          disabled={sending || !aiConfigured}
                          onClick={() => handlePromptClick(prompt)}
                          className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3 text-left text-sm text-slate-700 transition-colors hover:border-[#1B3A6B]/25 hover:bg-white disabled:opacity-50"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {!aiConfigured && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
                      L&apos;assistant IA n&apos;est pas encore activé. Ajoutez{' '}
                      <code className="text-xs">OPENAI_API_KEY</code> au serveur.
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                    >
                      {msg.role === 'assistant' && (
                        <div className="mr-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#7AB832] to-[#5F941F] text-white">
                          <GraduationCap className="h-4 w-4" />
                        </div>
                      )}
                      <div
                        className={cn(
                          'max-w-[min(100%,20rem)] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed sm:max-w-[85%]',
                          msg.role === 'user'
                            ? 'rounded-br-md bg-[#1B3A6B] text-white shadow-sm'
                            : 'rounded-bl-md border border-slate-100 bg-slate-50 text-slate-800 shadow-sm',
                        )}
                      >
                        {msg.streaming && !msg.content ? (
                          <span className="inline-flex items-center gap-1 text-slate-500">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            EduBot réfléchit…
                          </span>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              className="shrink-0 border-t border-slate-100 bg-white/95 p-3 backdrop-blur sm:p-4"
            >
              {selectedSubject && (
                <p className="mb-2 text-[11px] text-muted-foreground">
                  Matière :{' '}
                  <span className="font-medium text-[#1B3A6B]">{selectedSubject}</span>
                  <button
                    type="button"
                    className="ml-2 text-[#7AB832] hover:underline"
                    onClick={() => setSelectedSubject(null)}
                  >
                    retirer
                  </button>
                </p>
              )}
              <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50/50 p-2 focus-within:border-[#1B3A6B]/40 focus-within:ring-2 focus-within:ring-[#1B3A6B]/10">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(e)
                    }
                  }}
                  rows={1}
                  placeholder="Pose ta question scolaire…"
                  disabled={sending || !aiConfigured}
                  className="max-h-32 min-h-[2.5rem] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-slate-400 disabled:opacity-50"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || sending || !aiConfigured}
                  className="h-10 w-10 shrink-0 rounded-xl bg-[#7AB832] hover:bg-[#6aa32b]"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="mt-2 text-center text-[10px] text-muted-foreground">
                EduBot reste dans le cadre scolaire · Pas un substitut à tes professeurs
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
