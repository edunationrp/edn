'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getChatConversations,
  getOrCreateConversation,
  listStaffMessageRecipients,
  markConversationRead,
  searchStaffMessageRecipients,
  sendChatMessage,
  type ChatConversationSummary,
  type ChatMessageRow,
} from '@/lib/actions/messages'
import { inferMessageTypeFromFile, uploadMessageAttachment } from '@/lib/messaging/upload'
import { dedupeStaffRecipients } from '@/lib/messaging/staff-eligible'
import { ROLE_LABELS, normalizeRole, type UserRole } from '@/types/roles'
import { notify } from '@/lib/feedback/toast'
import { Loader2, MessageCircle, Plus, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ChatComposer,
  ChatHeader,
  ConversationRow,
  DateSeparator,
  EmptyInbox,
  InboxHeader,
  MessageBubble,
  SearchField,
  StaffRow,
} from '@/features/messages/messages-ui'

interface MessagesClientProps {
  currentUserId: string
  schoolId: string
  initialConversations: ChatConversationSummary[]
  initialConversationId?: string
}

type MobileView = 'inbox' | 'chat' | 'newChat'

function roleLabel(roleCode: string | null) {
  if (!roleCode) return 'Personnel'
  const normalized = normalizeRole(roleCode) as UserRole
  return ROLE_LABELS[normalized] ?? roleCode.replace(/_/g, ' ')
}

function formatDateLabel(iso: string) {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'Aujourd\'hui'
  if (date.toDateString() === yesterday.toDateString()) return 'Hier'
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function groupMessagesByDate(messages: ChatMessageRow[]) {
  const groups: Array<{ label: string; messages: ChatMessageRow[] }> = []
  let currentLabel = ''

  for (const message of messages) {
    const label = formatDateLabel(message.created_at)
    if (label !== currentLabel) {
      currentLabel = label
      groups.push({ label, messages: [message] })
    } else {
      groups[groups.length - 1].messages.push(message)
    }
  }

  return groups
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
  const [mobileView, setMobileView] = useState<MobileView>(
    initialConversationId ? 'chat' : 'inbox'
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
  const messageGroups = useMemo(() => groupMessagesByDate(messages), [messages])

  const filteredConversations = conversations.filter(c => {
    const q = searchQuery.toLowerCase()
    return (
      c.other_user.display_name.toLowerCase().includes(q) ||
      (c.last_message_preview ?? '').toLowerCase().includes(q)
    )
  })

  const uniqueStaffResults = useMemo(
    () => dedupeStaffRecipients(staffResults),
    [staffResults]
  )

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
      setMobileView('chat')
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

      setStaffSearch('')
      await openConversation(conversationId)
    },
    [conversations, openConversation, schoolId, staffResults]
  )

  const loadStaffList = useCallback(async () => {
    if (!schoolId) {
      setStaffResults([])
      return
    }
    setIsSearchingStaff(true)
    const results = await listStaffMessageRecipients(schoolId)
    setStaffResults(dedupeStaffRecipients(results))
    setIsSearchingStaff(false)
  }, [schoolId])

  const openNewChat = useCallback(() => {
    setMobileView('newChat')
    setActiveConversationId(null)
    setStaffSearch('')
    void loadStaffList()
  }, [loadStaffList])

  const backToInbox = useCallback(() => {
    setMobileView('inbox')
    setActiveConversationId(null)
  }, [])

  useEffect(() => {
    if (initialConversationId) void openConversation(initialConversationId)
  }, [initialConversationId, openConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (mobileView === 'newChat' && schoolId) void loadStaffList()
  }, [mobileView, schoolId, loadStaffList])

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
          setMessages(prev => (prev.some(m => m.id === incoming.id) ? prev : [...prev, incoming]))
          if (incoming.sender_id !== currentUserId) void markConversationRead(activeConversationId)
          setConversations(prev =>
            [...prev]
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
                      unread_count: incoming.sender_id === currentUserId ? c.unread_count : 0,
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

  useEffect(() => {
    const channel = supabase
      .channel(`chat-inbox:${currentUserId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        payload => {
          const incoming = payload.new as ChatMessageRow
          if (incoming.sender_id === currentUserId) return
          if (incoming.conversation_id === activeConversationId) return

          setConversations(prev => {
            if (!prev.some(c => c.id === incoming.conversation_id)) {
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
        { event: 'INSERT', schema: 'public', table: 'chat_conversations' },
        () => void getChatConversations(schoolId).then(setConversations)
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [activeConversationId, currentUserId, schoolId, supabase])

  async function searchStaff(query: string) {
    setStaffSearch(query)
    if (!schoolId) {
      setStaffResults([])
      return
    }
    setIsSearchingStaff(true)
    const results = await searchStaffMessageRecipients(schoolId, query, 50)
    setStaffResults(dedupeStaffRecipients(results))
    setIsSearchingStaff(false)
  }

  async function handleSend() {
    if (!activeConversationId || (!draft.trim() && !pendingAttachment)) return
    setIsSending(true)

    try {
      let attachmentUrl: string | undefined
      let attachmentName: string | undefined
      let attachmentMime: string | undefined
      let attachmentSize: number | undefined
      let messageType: 'text' | 'audio' | 'image' | 'file' = 'text'

      if (pendingAttachment) {
        const upload = await uploadMessageAttachment(schoolId, activeConversationId, pendingAttachment.file)
        if ('error' in upload) {
          notify.error(upload.error, 'chat_upload')
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
        return
      }

      const sentMessage = result.message
      setMessages(prev => (prev.some(m => m.id === sentMessage.id) ? prev : [...prev, sentMessage]))
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
            (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
          )
      )
    } finally {
      setIsSending(false)
    }
  }

  function handleFileSelect(file: File) {
    const messageType = inferMessageTypeFromFile(file)
    setPendingAttachment({
      file,
      previewUrl: messageType === 'image' ? URL.createObjectURL(file) : undefined,
      messageType,
    })
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
        setPendingAttachment({
          file: new File([audioBlob], `vocal-${Date.now()}.webm`, { type: 'audio/webm' }),
          messageType: 'audio',
        })
      }
      mediaRecorder.start()
      setIsRecording(true)
    } catch {
      notify.error('Microphone inaccessible', 'microphone')
    }
  }

  const showInbox = mobileView === 'inbox'
  const showChatPanel = mobileView === 'chat' || mobileView === 'newChat'

  return (
    <div className="fixed inset-x-0 bottom-0 top-14 z-10 flex flex-col overflow-hidden bg-white lg:static lg:z-auto lg:h-full lg:min-h-0">
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

      <div className="flex min-h-0 flex-1 overflow-hidden lg:grid lg:grid-cols-[340px_1fr] lg:gap-0 lg:rounded-3xl lg:border lg:border-slate-200/80 lg:bg-white lg:shadow-[0_8px_40px_-16px_rgba(15,23,42,0.15)]">
        {/* INBOX */}
        <section
          className={cn(
            'flex min-h-0 flex-col bg-white lg:border-r lg:border-slate-200/70',
            !showInbox && 'hidden lg:flex'
          )}
        >
          <InboxHeader unreadCount={totalUnread} onNewChat={openNewChat} />
          <div className="border-b border-slate-100 px-4 py-3">
            <SearchField
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Rechercher…"
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {filteredConversations.length === 0 ? (
              <EmptyInbox onNewChat={openNewChat} />
            ) : (
              <div className="divide-y divide-slate-100/80">
                {filteredConversations.map(conv => (
                  <ConversationRow
                    key={conv.id}
                    conversation={conv}
                    active={activeConversationId === conv.id}
                    roleLabel={roleLabel(conv.other_user.role_code)}
                    onClick={() => void openConversation(conv.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CHAT / NEW */}
        <section
          className={cn(
            'flex min-h-0 flex-1 flex-col bg-white',
            !showChatPanel && 'hidden lg:flex'
          )}
        >
          {mobileView === 'newChat' ? (
            <>
              <ChatHeader title="Nouveau message" subtitle="Personnel de l'établissement" onBack={backToInbox} />
              <div className="border-b border-slate-100 bg-white px-4 py-3">
                <SearchField
                  value={staffSearch}
                  onChange={v => void searchStaff(v)}
                  placeholder="Rechercher un collègue…"
                />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white">
                {isSearchingStaff ? (
                  <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin text-[#1B3A6B]" />
                    Recherche…
                  </div>
                ) : uniqueStaffResults.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <Sparkles className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                    <p className="text-sm font-medium text-slate-700">
                      {!schoolId
                        ? 'Aucun établissement actif'
                        : 'Aucun membre du personnel trouvé'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100/80">
                    {uniqueStaffResults.map(staff => (
                      <StaffRow
                        key={staff.id}
                        name={staff.display_name}
                        roleLabel={roleLabel(staff.role_code)}
                        avatarUrl={staff.avatar_url}
                        onClick={() => void startConversationWith(staff.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : activeConversation ? (
            <>
              <ChatHeader
                title={activeConversation.other_user.display_name}
                subtitle={roleLabel(activeConversation.other_user.role_code)}
                avatarName={activeConversation.other_user.display_name}
                avatarUrl={activeConversation.other_user.avatar_url}
                onBack={backToInbox}
              />

              <div
                className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain bg-[#F0F4F8] px-3 py-4 sm:px-5"
              >
                {isLoadingMessages ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="h-7 w-7 animate-spin text-[#1B3A6B]" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-center">
                    <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
                      <MessageCircle className="h-8 w-8 text-[#1B3A6B]/30" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">Démarrez la conversation</p>
                    <p className="mt-1 max-w-xs text-xs text-slate-500">
                      Texte, vocal, photo ou fichier — livraison instantanée.
                    </p>
                  </div>
                ) : (
                  messageGroups.map(group => (
                    <div key={group.label} className="space-y-2">
                      <DateSeparator label={group.label} />
                      {group.messages.map(msg => (
                        <MessageBubble
                          key={msg.id}
                          message={msg}
                          isOwn={msg.sender_id === currentUserId}
                        />
                      ))}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} className="h-1" />
              </div>

              <ChatComposer
                draft={draft}
                onDraftChange={setDraft}
                onSend={() => void handleSend()}
                isSending={isSending}
                isRecording={isRecording}
                onToggleRecording={() => void toggleRecording()}
                onPickImage={() => imageInputRef.current?.click()}
                onPickFile={() => fileInputRef.current?.click()}
                pendingAttachment={pendingAttachment}
                onClearAttachment={() => {
                  if (pendingAttachment?.previewUrl) URL.revokeObjectURL(pendingAttachment.previewUrl)
                  setPendingAttachment(null)
                }}
              />
            </>
          ) : (
            <div className="hidden flex-1 flex-col items-center justify-center bg-gradient-to-b from-white to-[#F0F4F8] p-8 text-center lg:flex">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#EEF3FA] shadow-inner">
                <MessageCircle className="h-10 w-10 text-[#1B3A6B]/35" />
              </div>
              <p className="text-lg font-semibold text-slate-800">Sélectionnez une conversation</p>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Vos messages avec le personnel s&apos;affichent ici en temps réel.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* FAB mobile */}
      {showInbox && (
        <button
          type="button"
          onClick={openNewChat}
          className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#1a4d2e] to-[#14532d] text-white shadow-[0_8px_24px_-4px_rgba(20,83,45,0.55)] transition active:scale-95 lg:hidden"
          aria-label="Nouvelle conversation"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
    </div>
  )
}
