'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
  getChatConversations,
  getOrCreateConversation,
  markConversationRead,
  searchStaffMessageRecipients,
  sendChatMessage,
  type ChatConversationSummary,
  type ChatMessageRow,
} from '@/lib/actions/messages'
import { inferMessageTypeFromFile, uploadMessageAttachment } from '@/lib/messaging/upload'
import { ROLE_LABELS, normalizeRole, type UserRole } from '@/types/roles'
import { notify } from '@/lib/feedback/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  MessageCircle,
  Send,
  Search,
  Mic,
  MicOff,
  Plus,
  ArrowLeft,
  Paperclip,
  ImageIcon,
  FileText,
  Loader2,
  X,
  Download,
} from 'lucide-react'
import { cn, formatRelativeDate, getInitials } from '@/lib/utils'

interface MessagesClientProps {
  currentUserId: string
  schoolId: string
  initialConversations: ChatConversationSummary[]
  initialConversationId?: string
}

function roleLabel(roleCode: string | null) {
  if (!roleCode) return 'Personnel'
  const normalized = normalizeRole(roleCode) as UserRole
  return ROLE_LABELS[normalized] ?? roleCode.replace(/_/g, ' ')
}

function MessageBubble({
  message,
  isOwn,
}: {
  message: ChatMessageRow
  isOwn: boolean
}) {
  const time = new Date(message.created_at).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3 py-2 shadow-sm sm:max-w-[70%]',
          isOwn
            ? 'rounded-br-md bg-primary text-primary-foreground'
            : 'rounded-bl-md border bg-white text-gray-900'
        )}
      >
        {message.message_type === 'text' && message.body && (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.body}</p>
        )}

        {message.message_type === 'audio' && message.attachment_url && (
          <audio controls src={message.attachment_url} className="max-w-full min-w-[220px]" preload="metadata">
            <track kind="captions" />
          </audio>
        )}

        {message.message_type === 'image' && message.attachment_url && (
          <a href={message.attachment_url} target="_blank" rel="noopener noreferrer" className="block">
            <Image
              src={message.attachment_url}
              alt={message.attachment_name ?? 'Photo'}
              width={320}
              height={240}
              className="max-h-60 w-auto rounded-lg object-cover"
              unoptimized
            />
          </a>
        )}

        {message.message_type === 'file' && message.attachment_url && (
          <a
            href={message.attachment_url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm',
              isOwn ? 'border-white/30 bg-white/10' : 'border-gray-200 bg-gray-50'
            )}
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span className="truncate">{message.attachment_name ?? 'Fichier'}</span>
            <Download className="h-3.5 w-3.5 shrink-0 opacity-70" />
          </a>
        )}

        {message.body && message.message_type !== 'text' && (
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed opacity-90">{message.body}</p>
        )}

        <p className={cn('mt-1 text-[10px]', isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
          {time}
        </p>
      </div>
    </div>
  )
}

export function MessagesClient({
  currentUserId,
  schoolId,
  initialConversations,
  initialConversationId,
}: MessagesClientProps) {
  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const imageInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [conversations, setConversations] = useState(initialConversations)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    initialConversationId ?? null
  )
  const [messages, setMessages] = useState<ChatMessageRow[]>([])
  const [draft, setDraft] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [staffSearch, setStaffSearch] = useState('')
  const [staffResults, setStaffResults] = useState<
    Array<{
      id: string
      display_name: string
      first_name: string
      last_name: string
      avatar_url: string | null
      role_code: string | null
    }>
  >([])
  const [showNewChat, setShowNewChat] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isSearchingStaff, setIsSearchingStaff] = useState(false)
  const [pendingAttachment, setPendingAttachment] = useState<{
    file: File
    previewUrl?: string
    messageType: 'audio' | 'image' | 'file'
  } | null>(null)

  const activeConversation = conversations.find(c => c.id === activeConversationId) ?? null

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const loadMessages = useCallback(async (conversationId: string) => {
    setIsLoadingMessages(true)
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(200)

    if (error) {
      notify.error('Impossible de charger les messages', 'chat_load')
    } else {
      setMessages((data ?? []) as ChatMessageRow[])
    }
    setIsLoadingMessages(false)
  }, [supabase])

  const openConversation = useCallback(
    async (conversationId: string) => {
      setActiveConversationId(conversationId)
      setShowNewChat(false)
      await loadMessages(conversationId)
      await markConversationRead(conversationId)
      setConversations(prev =>
        prev.map(c => (c.id === conversationId ? { ...c, unread_count: 0 } : c))
      )
    },
    [loadMessages]
  )

  const startConversationWith = useCallback(
    async (staffId: string) => {
      const result = await getOrCreateConversation(schoolId, staffId)
      if ('error' in result) {
        notify.error(result.error, 'chat_create')
        return
      }

      const conversationId = result.conversationId
      const existing = conversations.find(c => c.id === conversationId)
      if (!existing) {
        const staff = staffResults.find(s => s.id === staffId)
        if (staff) {
          setConversations(prev => [
            {
              id: conversationId,
              other_user_id: staff.id,
              other_user: {
                first_name: staff.first_name,
                last_name: staff.last_name,
                display_name: staff.display_name,
                avatar_url: staff.avatar_url,
                role_code: staff.role_code,
              },
              last_message_at: new Date().toISOString(),
              last_message_preview: null,
              unread_count: 0,
            },
            ...prev,
          ])
        }
      }

      setShowNewChat(false)
      setStaffSearch('')
      setStaffResults([])
      await openConversation(conversationId)
    },
    [conversations, openConversation, schoolId, staffResults]
  )

  useEffect(() => {
    if (initialConversationId) {
      void openConversation(initialConversationId)
    }
  }, [initialConversationId, openConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Realtime: messages in active conversation
  useEffect(() => {
    if (!activeConversationId) return

    const channel = supabase
      .channel(`chat-messages:${activeConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        payload => {
          const incoming = payload.new as ChatMessageRow
          setMessages(prev => {
            if (prev.some(m => m.id === incoming.id)) return prev
            return [...prev, incoming]
          })

          if (incoming.sender_id !== currentUserId) {
            void markConversationRead(activeConversationId)
          }

          setConversations(prev =>
            prev
              .map(c =>
                c.id === activeConversationId
                  ? {
                      ...c,
                      last_message_at: incoming.created_at,
                      last_message_preview:
                        incoming.message_type === 'text'
                          ? (incoming.body?.slice(0, 120) ?? '')
                          : incoming.message_type === 'audio'
                            ? '🎤 Message vocal'
                            : incoming.message_type === 'image'
                              ? '📷 Photo'
                              : `📎 ${incoming.attachment_name ?? 'Fichier'}`,
                      unread_count:
                        incoming.sender_id === currentUserId ? c.unread_count : 0,
                    }
                  : c
              )
              .sort(
                (a, b) =>
                  new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
              )
          )
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [activeConversationId, currentUserId, supabase])

  // Realtime: conversation list updates (new conv / preview)
  useEffect(() => {
    const channel = supabase
      .channel(`chat-conversations:${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_conversations',
        },
        payload => {
          const updated = payload.new as {
            id: string
            last_message_at: string
            last_message_preview: string | null
            participant_one: string
            participant_two: string
          }

          const isParticipant =
            updated.participant_one === currentUserId ||
            updated.participant_two === currentUserId
          if (!isParticipant) return

          setConversations(prev => {
            const exists = prev.some(c => c.id === updated.id)
            if (!exists) return prev
            return [...prev]
              .map(c =>
                c.id === updated.id
                  ? {
                      ...c,
                      last_message_at: updated.last_message_at,
                      last_message_preview: updated.last_message_preview,
                      unread_count:
                        activeConversationId === updated.id ? 0 : c.unread_count,
                    }
                  : c
              )
              .sort(
                (a, b) =>
                  new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
              )
          })
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [activeConversationId, currentUserId, supabase])

  // Realtime: inbox — nouveaux messages dans les autres conversations
  useEffect(() => {
    const channel = supabase
      .channel(`chat-inbox:${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        payload => {
          const incoming = payload.new as ChatMessageRow
          if (incoming.sender_id === currentUserId) return
          if (incoming.conversation_id === activeConversationId) return

          setConversations(prev => {
            const exists = prev.some(c => c.id === incoming.conversation_id)
            if (!exists) {
              void getChatConversations(schoolId).then(setConversations)
              return prev
            }

            const preview =
              incoming.message_type === 'text'
                ? (incoming.body?.slice(0, 120) ?? '')
                : incoming.message_type === 'audio'
                  ? '🎤 Message vocal'
                  : incoming.message_type === 'image'
                    ? '📷 Photo'
                    : `📎 ${incoming.attachment_name ?? 'Fichier'}`

            return [...prev]
              .map(c =>
                c.id === incoming.conversation_id
                  ? {
                      ...c,
                      unread_count: c.unread_count + 1,
                      last_message_at: incoming.created_at,
                      last_message_preview: preview,
                    }
                  : c
              )
              .sort(
                (a, b) =>
                  new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
              )
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_conversations',
        },
        () => {
          void getChatConversations(schoolId).then(setConversations)
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [activeConversationId, currentUserId, schoolId, supabase])

  async function searchStaff(query: string) {
    setStaffSearch(query)
    setIsSearchingStaff(true)
    const results = await searchStaffMessageRecipients(schoolId, query, 20)
    setStaffResults(results)
    setIsSearchingStaff(false)
  }

  async function handleSend() {
    if (!activeConversationId) return
    if (!draft.trim() && !pendingAttachment) return

    setIsSending(true)

    try {
      let attachmentUrl: string | undefined
      let attachmentName: string | undefined
      let attachmentMime: string | undefined
      let attachmentSize: number | undefined
      let messageType: 'text' | 'audio' | 'image' | 'file' = 'text'

      if (pendingAttachment) {
        const upload = await uploadMessageAttachment(
          schoolId,
          activeConversationId,
          pendingAttachment.file
        )
        if ('error' in upload) {
          notify.error(upload.error, 'chat_upload')
          setIsSending(false)
          return
        }
        attachmentUrl = upload.publicUrl
        attachmentName = upload.name
        attachmentMime = upload.mime
        attachmentSize = upload.size
        messageType = pendingAttachment.messageType
      }

      const result = await sendChatMessage({
        conversationId: activeConversationId,
        schoolId,
        body: draft.trim() || undefined,
        messageType: pendingAttachment ? messageType : 'text',
        attachmentUrl,
        attachmentName,
        attachmentMime,
        attachmentSize,
      })

      if ('error' in result) {
        notify.error(result.error, 'chat_send')
        setIsSending(false)
        return
      }

      const sentMessage = result.message

      setMessages(prev => {
        if (prev.some(m => m.id === sentMessage.id)) return prev
        return [...prev, sentMessage]
      })

      setDraft('')
      if (pendingAttachment?.previewUrl) URL.revokeObjectURL(pendingAttachment.previewUrl)
      setPendingAttachment(null)

      setConversations(prev =>
        [...prev]
          .map(c =>
            c.id === activeConversationId
              ? {
                  ...c,
                  last_message_at: sentMessage.created_at,
                  last_message_preview:
                    sentMessage.message_type === 'text'
                      ? (sentMessage.body?.slice(0, 120) ?? '')
                      : sentMessage.message_type === 'audio'
                        ? '🎤 Message vocal'
                        : sentMessage.message_type === 'image'
                          ? '📷 Photo'
                          : `📎 ${sentMessage.attachment_name ?? 'Fichier'}`,
                }
              : c
          )
          .sort(
            (a, b) =>
              new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
          )
      )
    } finally {
      setIsSending(false)
    }
  }

  function handleFileSelect(file: File) {
    const messageType = inferMessageTypeFromFile(file)
    const previewUrl = messageType === 'image' ? URL.createObjectURL(file) : undefined
    setPendingAttachment({ file, previewUrl, messageType })
  }

  async function toggleRecording() {
    if (!activeConversationId) {
      notify.error('Sélectionnez une conversation d\'abord', 'chat_record')
      return
    }

    if (isRecording) {
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = e => audioChunksRef.current.push(e.data)
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const file = new File([audioBlob], `vocal-${Date.now()}.webm`, { type: 'audio/webm' })
        setPendingAttachment({ file, messageType: 'audio' })
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch {
      notify.error('Microphone inaccessible', 'microphone')
    }
  }

  const filteredConversations = conversations.filter(c => {
    const q = searchQuery.toLowerCase()
    return (
      c.other_user.display_name.toLowerCase().includes(q) ||
      (c.last_message_preview ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="flex h-[calc(100dvh-8rem)] min-h-[520px] flex-col gap-4 animate-fade-in">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 sm:text-2xl">
            <MessageCircle className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
            Messagerie
            {totalUnread > 0 && (
              <Badge className="ml-1 bg-primary text-white">
                {totalUnread} non lu{totalUnread > 1 ? 's' : ''}
              </Badge>
            )}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Temps réel · Personnel de l&apos;école uniquement
          </p>
        </div>
        <Button
          className="w-full sm:w-auto"
          onClick={() => {
            setShowNewChat(true)
            setActiveConversationId(null)
            void searchStaff('')
          }}
        >
          <Plus className="mr-1 h-4 w-4" />
          Nouvelle conversation
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 overflow-hidden rounded-xl border bg-white shadow-sm xl:grid-cols-3">
        {/* Liste conversations */}
        <div
          className={cn(
            'flex min-h-0 flex-col border-r xl:col-span-1',
            (activeConversationId || showNewChat) && 'hidden xl:flex'
          )}
        >
          <div className="border-b p-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une conversation…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="px-4 py-10 text-center text-muted-foreground">
                <MessageCircle className="mx-auto mb-2 h-10 w-10 opacity-30" />
                <p className="text-sm">Aucune conversation</p>
                <button
                  type="button"
                  className="mt-2 text-sm font-medium text-primary hover:underline"
                  onClick={() => {
                    setShowNewChat(true)
                    void searchStaff('')
                  }}
                >
                  Contacter un membre du personnel
                </button>
              </div>
            ) : (
              filteredConversations.map(conv => (
                <button
                  key={conv.id}
                  type="button"
                  className={cn(
                    'flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-muted/40',
                    activeConversationId === conv.id && 'bg-primary/5',
                    conv.unread_count > 0 && 'bg-blue-50/40'
                  )}
                  onClick={() => void openConversation(conv.id)}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {getInitials(conv.other_user.display_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          'truncate text-sm',
                          conv.unread_count > 0 ? 'font-bold' : 'font-medium'
                        )}
                      >
                        {conv.other_user.display_name}
                      </p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {formatRelativeDate(conv.last_message_at)}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {roleLabel(conv.other_user.role_code)}
                    </p>
                    <p
                      className={cn(
                        'truncate text-sm',
                        conv.unread_count > 0 ? 'font-semibold text-gray-800' : 'text-muted-foreground'
                      )}
                    >
                      {conv.last_message_preview || 'Nouvelle conversation'}
                    </p>
                  </div>
                  {conv.unread_count > 0 && (
                    <Badge className="h-5 min-w-5 shrink-0 justify-center bg-primary px-1.5 text-[10px] text-white">
                      {conv.unread_count}
                    </Badge>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Zone chat / nouvelle conversation */}
        <div
          className={cn(
            'flex min-h-0 flex-col xl:col-span-2',
            !activeConversationId && !showNewChat && 'hidden xl:flex'
          )}
        >
          {showNewChat ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-center gap-2 border-b px-4 py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="xl:hidden"
                  onClick={() => setShowNewChat(false)}
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Retour
                </Button>
                <h2 className="text-base font-semibold">Contacter le personnel</h2>
              </div>
              <div className="border-b p-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom…"
                    value={staffSearch}
                    onChange={e => void searchStaff(e.target.value)}
                    className="pl-9"
                    autoFocus
                  />
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {isSearchingStaff ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Recherche…
                  </div>
                ) : staffResults.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    Aucun membre du personnel trouvé
                  </p>
                ) : (
                  staffResults.map(staff => (
                    <button
                      key={staff.id}
                      type="button"
                      className="flex w-full items-center gap-3 border-b px-4 py-3 text-left hover:bg-muted/40"
                      onClick={() => void startConversationWith(staff.id)}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {getInitials(staff.display_name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{staff.display_name}</p>
                        <p className="text-xs text-muted-foreground">{roleLabel(staff.role_code)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : activeConversation ? (
            <>
              <div className="flex items-center gap-3 border-b px-4 py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="xl:hidden"
                  onClick={() => setActiveConversationId(null)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {getInitials(activeConversation.other_user.display_name)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {activeConversation.other_user.display_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {roleLabel(activeConversation.other_user.role_code)}
                  </p>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-muted/20 px-3 py-4 sm:px-4">
                {isLoadingMessages ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    Démarrez la conversation — messages texte, vocal, photo ou fichier.
                  </p>
                ) : (
                  messages.map(msg => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isOwn={msg.sender_id === currentUserId}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {pendingAttachment && (
                <div className="flex items-center gap-2 border-t bg-muted/30 px-4 py-2">
                  {pendingAttachment.messageType === 'image' && pendingAttachment.previewUrl && (
                    <Image
                      src={pendingAttachment.previewUrl}
                      alt="Aperçu"
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded object-cover"
                      unoptimized
                    />
                  )}
                  {pendingAttachment.messageType === 'audio' && (
                    <Mic className="h-4 w-4 text-primary" />
                  )}
                  {pendingAttachment.messageType === 'file' && (
                    <FileText className="h-4 w-4 text-primary" />
                  )}
                  <span className="flex-1 truncate text-sm">{pendingAttachment.file.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      if (pendingAttachment.previewUrl) URL.revokeObjectURL(pendingAttachment.previewUrl)
                      setPendingAttachment(null)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="border-t bg-white p-3">
                <div className="flex items-end gap-2">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) handleFileSelect(file)
                      e.target.value = ''
                    }}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) handleFileSelect(file)
                      e.target.value = ''
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => imageInputRef.current?.click()}
                    title="Envoyer une photo"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                    title="Joindre un fichier"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn('shrink-0', isRecording && 'text-red-500')}
                    onClick={() => void toggleRecording()}
                    title={isRecording ? 'Arrêter l\'enregistrement' : 'Message vocal'}
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  <textarea
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        void handleSend()
                      }
                    }}
                    placeholder="Écrivez un message…"
                    rows={1}
                    className="max-h-32 min-h-[40px] flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <Button
                    type="button"
                    size="icon"
                    className="shrink-0"
                    disabled={isSending || (!draft.trim() && !pendingAttachment)}
                    onClick={() => void handleSend()}
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center bg-muted/10 p-6 text-center">
              <MessageCircle className="mx-auto mb-3 h-16 w-16 text-muted-foreground opacity-30" />
              <p className="font-medium text-muted-foreground">Sélectionnez une conversation</p>
              <p className="mt-1 text-sm text-muted-foreground">
                ou{' '}
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
                  onClick={() => {
                    setShowNewChat(true)
                    void searchStaff('')
                  }}
                >
                  contactez un membre du personnel
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
