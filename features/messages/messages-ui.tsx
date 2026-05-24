'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  ArrowLeft,
  Download,
  FileText,
  ImageIcon,
  Loader2,
  Mic,
  MicOff,
  Paperclip,
  Plus,
  Search,
  Send,
  Sparkles,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn, formatRelativeDateCompact, getInitials } from '@/lib/utils'
import type { ChatConversationSummary, ChatMessageRow } from '@/lib/actions/messages'

export function ChatAvatar({
  name,
  avatarUrl,
  size = 'md',
  unread = false,
  online = false,
}: {
  name: string
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  unread?: boolean
  online?: boolean
}) {
  const sizes = {
    sm: 'h-11 w-11 text-xs',
    md: 'h-12 w-12 text-sm',
    lg: 'h-14 w-14 text-base',
  }

  return (
    <div className="relative shrink-0">
      <div
        className={cn(
          'rounded-full p-[2px]',
          unread
            ? 'bg-gradient-to-br from-[#7AB832] via-[#1B3A6B] to-[#7AB832]'
            : 'bg-gradient-to-br from-slate-200 to-slate-100'
        )}
      >
        <div
          className={cn(
            'flex items-center justify-center overflow-hidden rounded-full bg-white font-bold text-[#1B3A6B]',
            sizes[size]
          )}
        >
          {avatarUrl ? (
            <Image src={avatarUrl} alt={name} width={56} height={56} className="h-full w-full object-cover" unoptimized />
          ) : (
            getInitials(name)
          )}
        </div>
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#7AB832]" />
      )}
    </div>
  )
}

export function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-2">
      <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-slate-500 shadow-sm ring-1 ring-slate-200/60">
        {label}
      </span>
    </div>
  )
}

export function MessageBubble({
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
    <div className={cn('flex px-1', isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'relative max-w-[88%] rounded-[1.25rem] px-3.5 py-2.5 shadow-sm sm:max-w-[72%]',
          isOwn
            ? 'rounded-br-md bg-gradient-to-br from-[#1a4d2e] to-[#14532d] text-white'
            : 'rounded-bl-md border border-slate-200/80 bg-white text-slate-900'
        )}
      >
        {message.message_type === 'text' && message.body && (
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.body}</p>
        )}

        {message.message_type === 'audio' && message.attachment_url && (
          <div className="min-w-[220px]">
            <audio
              controls
              src={message.attachment_url}
              className="h-9 w-full max-w-full [&::-webkit-media-controls-panel]:bg-transparent"
              preload="metadata"
            >
              <track kind="captions" />
            </audio>
          </div>
        )}

        {message.message_type === 'image' && message.attachment_url && (
          <a href={message.attachment_url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl">
            <Image
              src={message.attachment_url}
              alt={message.attachment_name ?? 'Photo'}
              width={280}
              height={280}
              className="max-h-64 w-full object-cover"
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
              'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition active:scale-[0.98]',
              isOwn ? 'bg-white/15 hover:bg-white/20' : 'bg-slate-50 hover:bg-slate-100'
            )}
          >
            <div className={cn('rounded-lg p-2', isOwn ? 'bg-white/20' : 'bg-[#EEF3FA] text-[#1B3A6B]')}>
              <FileText className="h-4 w-4" />
            </div>
            <span className="min-w-0 flex-1 truncate font-medium">{message.attachment_name ?? 'Fichier'}</span>
            <Download className="h-4 w-4 shrink-0 opacity-70" />
          </a>
        )}

        {message.body && message.message_type !== 'text' && (
          <p className="mt-1.5 whitespace-pre-wrap text-[15px] leading-relaxed opacity-90">{message.body}</p>
        )}

        <p className={cn('mt-1 text-right text-[10px]', isOwn ? 'text-white/65' : 'text-slate-400')}>
          {time}
        </p>
      </div>
    </div>
  )
}

export function ConversationRow({
  conversation,
  active,
  roleLabel,
  onClick,
}: {
  conversation: ChatConversationSummary
  active: boolean
  roleLabel: string
  onClick: () => void
}) {
  const unread = conversation.unread_count > 0

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full max-w-full items-center gap-2.5 overflow-hidden px-3 py-3.5 text-left transition active:bg-slate-100/80 sm:gap-3 sm:px-4',
        active && 'bg-[#EEF3FA]/80',
        unread && !active && 'bg-[#f0fdf4]/50'
      )}
    >
      <ChatAvatar
        name={conversation.other_user.display_name}
        avatarUrl={conversation.other_user.avatar_url}
        unread={unread}
        size="sm"
      />
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              'min-w-0 flex-1 truncate text-[15px]',
              unread ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'
            )}
          >
            {conversation.other_user.display_name}
          </p>
          {unread && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#7AB832] px-1 text-[10px] font-bold text-white">
              {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
            </span>
          )}
          <span
            className={cn(
              'shrink-0 text-[10px] sm:text-[11px]',
              unread ? 'font-semibold text-[#1a4d2e]' : 'text-slate-400'
            )}
          >
            {formatRelativeDateCompact(conversation.last_message_at)}
          </span>
        </div>
        <p className="truncate text-xs text-slate-500">{roleLabel}</p>
        <p
          className={cn(
            'truncate text-sm',
            unread ? 'font-medium text-slate-700' : 'text-slate-500'
          )}
        >
          {conversation.last_message_preview || 'Nouvelle conversation'}
        </p>
      </div>
    </button>
  )
}

export function StaffRow({
  name,
  roleLabel,
  avatarUrl,
  onClick,
}: {
  name: string
  roleLabel: string
  avatarUrl?: string | null
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full max-w-full items-center gap-2.5 overflow-hidden px-3 py-3.5 text-left transition active:bg-slate-100/80 sm:gap-3 sm:px-4"
    >
      <ChatAvatar name={name} avatarUrl={avatarUrl} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-slate-900">{name}</p>
        <p className="truncate text-xs text-slate-500">{roleLabel}</p>
      </div>
      <span className="hidden shrink-0 rounded-full bg-[#EEF3FA] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#1B3A6B] sm:inline">
        Écrire
      </span>
    </button>
  )
}

export function ChatHeader({
  title,
  subtitle,
  avatarName,
  avatarUrl,
  onBack,
  showBack = true,
}: {
  title: string
  subtitle?: string
  avatarName?: string
  avatarUrl?: string | null
  onBack?: () => void
  showBack?: boolean
}) {
  return (
    <header className="sticky top-0 z-20 flex shrink-0 items-center gap-3 border-b border-slate-200/70 bg-white/85 px-3 py-3 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70 sm:px-4">
      {showBack && onBack && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-full xl:hidden"
          onClick={onBack}
          aria-label="Retour"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}
      {avatarName && <ChatAvatar name={avatarName} avatarUrl={avatarUrl} size="sm" online />}
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-base font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
      </div>
    </header>
  )
}

export function InboxHeader({
  unreadCount,
  onNewChat,
}: {
  unreadCount: number
  onNewChat: () => void
}) {
  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-slate-200/70 bg-gradient-to-br from-[#1B3A6B] via-[#1a4d2e] to-[#14532d] px-3 pb-4 pt-3 text-white shadow-lg sm:rounded-t-3xl sm:px-4">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-[#7AB832]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">
              Temps réel
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Messages</h1>
          <p className="mt-0.5 truncate text-sm text-white/75">
            {unreadCount > 0
              ? `${unreadCount} message${unreadCount > 1 ? 's' : ''} non lu${unreadCount > 1 ? 's' : ''}`
              : 'Personnel de l\'établissement'}
          </p>
        </div>
        <Button
          type="button"
          size="icon"
          className="hidden h-10 w-10 shrink-0 rounded-full bg-white/15 text-white shadow-lg backdrop-blur hover:bg-white/25 sm:inline-flex"
          onClick={onNewChat}
          aria-label="Nouvelle conversation"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}

export function SearchField({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-2xl border-slate-200/80 bg-slate-50/80 pl-10 text-[15px] shadow-inner focus-visible:bg-white"
      />
    </div>
  )
}

export function EmptyInbox({ onNewChat }: { onNewChat: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#EEF3FA] to-[#f0fdf4] shadow-inner">
        <Sparkles className="h-9 w-9 text-[#1B3A6B]/40" />
      </div>
      <p className="text-base font-semibold text-slate-800">Aucune conversation</p>
      <p className="mt-1 max-w-xs text-sm text-slate-500">
        Contactez un collègue du personnel en un tap.
      </p>
      <Button className="mt-5 rounded-full px-6" onClick={onNewChat}>
        <Plus className="mr-2 h-4 w-4" />
        Nouvelle conversation
      </Button>
    </div>
  )
}

export function ChatComposer({
  draft,
  onDraftChange,
  onSend,
  isSending,
  isRecording,
  onToggleRecording,
  onPickImage,
  onPickFile,
  pendingAttachment,
  onClearAttachment,
  disabled,
}: {
  draft: string
  onDraftChange: (value: string) => void
  onSend: () => void
  isSending: boolean
  isRecording: boolean
  onToggleRecording: () => void
  onPickImage: () => void
  onPickFile: () => void
  pendingAttachment: { file: File; previewUrl?: string; messageType: string } | null
  onClearAttachment: () => void
  disabled?: boolean
}) {
  const [showTools, setShowTools] = useState(false)
  const canSend = !disabled && !isSending && (draft.trim().length > 0 || pendingAttachment)

  return (
    <div className="shrink-0 border-t border-slate-200/80 bg-white/95 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl">
      {isRecording && (
        <div className="flex items-center justify-center gap-2 border-b border-red-100 bg-red-50 px-4 py-2 text-sm font-medium text-red-600">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          Enregistrement en cours…
        </div>
      )}

      {pendingAttachment && (
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-2.5">
          {pendingAttachment.messageType === 'image' && pendingAttachment.previewUrl ? (
            <Image
              src={pendingAttachment.previewUrl}
              alt="Aperçu"
              width={48}
              height={48}
              className="h-12 w-12 rounded-xl object-cover ring-2 ring-[#7AB832]/30"
              unoptimized
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEF3FA] text-[#1B3A6B]">
              {pendingAttachment.messageType === 'audio' ? <Mic className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800">{pendingAttachment.file.name}</p>
            <p className="text-xs text-slate-500">Prêt à envoyer</p>
          </div>
          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={onClearAttachment}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {showTools && (
        <div className="grid grid-cols-3 gap-2 border-b border-slate-100 px-4 py-3 sm:hidden">
          <button type="button" onClick={onPickImage} className="flex flex-col items-center gap-1.5 rounded-2xl bg-slate-50 py-3 active:bg-slate-100">
            <ImageIcon className="h-5 w-5 text-[#1B3A6B]" />
            <span className="text-[11px] font-medium text-slate-600">Photo</span>
          </button>
          <button type="button" onClick={onPickFile} className="flex flex-col items-center gap-1.5 rounded-2xl bg-slate-50 py-3 active:bg-slate-100">
            <Paperclip className="h-5 w-5 text-[#1B3A6B]" />
            <span className="text-[11px] font-medium text-slate-600">Fichier</span>
          </button>
          <button type="button" onClick={onToggleRecording} className="flex flex-col items-center gap-1.5 rounded-2xl bg-slate-50 py-3 active:bg-slate-100">
            {isRecording ? <MicOff className="h-5 w-5 text-red-500" /> : <Mic className="h-5 w-5 text-[#1B3A6B]" />}
            <span className="text-[11px] font-medium text-slate-600">Vocal</span>
          </button>
        </div>
      )}

      <div className="flex items-end gap-1.5 px-3 pt-3 sm:gap-2 sm:px-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-11 w-11 shrink-0 rounded-full sm:hidden"
          onClick={() => setShowTools(v => !v)}
          aria-label="Pièces jointes"
        >
          <Plus className={cn('h-5 w-5 transition', showTools && 'rotate-45')} />
        </Button>

        <div className="hidden shrink-0 items-center gap-0.5 sm:flex">
          <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={onPickImage}>
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={onPickFile}>
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn('h-10 w-10 rounded-full', isRecording && 'text-red-500')}
            onClick={onToggleRecording}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        </div>

        <textarea
          value={draft}
          onChange={e => onDraftChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              if (canSend) onSend()
            }
          }}
          disabled={disabled}
          placeholder="Message…"
          rows={1}
          className="max-h-32 min-h-[44px] flex-1 resize-none rounded-[1.25rem] border border-slate-200/80 bg-slate-50/80 px-4 py-2.5 text-[15px] leading-snug shadow-inner focus:border-[#7AB832]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7AB832]/20 disabled:opacity-50"
        />

        <Button
          type="button"
          size="icon"
          disabled={!canSend}
          onClick={onSend}
          className="h-11 w-11 shrink-0 rounded-full bg-gradient-to-br from-[#1a4d2e] to-[#14532d] shadow-md disabled:opacity-40"
        >
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
