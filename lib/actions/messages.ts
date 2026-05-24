'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { resolveProfileName } from '@/lib/profile/display-name'
import {
  isMessagingStaffRole,
  orderConversationParticipants,
} from '@/lib/messaging/staff-eligible'
import { dispatchNotification } from '@/lib/notifications/dispatch'

export type ChatConversationSummary = {
  id: string
  other_user_id: string
  other_user: {
    first_name: string
    last_name: string
    display_name: string
    avatar_url: string | null
    role_code: string | null
  }
  last_message_at: string
  last_message_preview: string | null
  unread_count: number
}

export type ChatMessageRow = {
  id: string
  conversation_id: string
  sender_id: string
  body: string | null
  message_type: 'text' | 'audio' | 'image' | 'file'
  attachment_url: string | null
  attachment_name: string | null
  attachment_mime: string | null
  attachment_size: number | null
  created_at: string
}

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' as const, supabase, user: null }
  return { supabase, user, error: null }
}

async function assertStaffRecipient(
  supabase: Awaited<ReturnType<typeof createClient>>,
  schoolId: string,
  recipientId: string
) {
  const { data: roleRaw } = await supabase
    .from('user_school_roles')
    .select('role_code')
    .eq('school_id', schoolId)
    .eq('user_id', recipientId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  const roleCode = (roleRaw as { role_code: string } | null)?.role_code
  if (!roleCode || !isMessagingStaffRole(roleCode)) {
    return { error: 'Destinataire invalide — seul le personnel de l\'école est autorisé.' }
  }
  return { roleCode }
}

export async function getChatConversations(
  schoolId: string
): Promise<ChatConversationSummary[]> {
  const { supabase, user, error } = await requireUser()
  if (error || !user) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: convsRaw } = await (supabase as any)
    .from('chat_conversations')
    .select('id, participant_one, participant_two, last_message_at, last_message_preview')
    .eq('school_id', schoolId)
    .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
    .order('last_message_at', { ascending: false })

  const convs = (convsRaw ?? []) as Array<{
    id: string
    participant_one: string
    participant_two: string
    last_message_at: string
    last_message_preview: string | null
  }>

  if (convs.length === 0) return []

  const otherUserIds = convs.map(c =>
    c.participant_one === user.id ? c.participant_two : c.participant_one
  )

  const { data: profilesRaw } = await supabase
    .from('profiles')
    .select('id, full_name, first_name, last_name, avatar_url')
    .in('id', otherUserIds)

  const { data: rolesRaw } = await supabase
    .from('user_school_roles')
    .select('user_id, role_code')
    .eq('school_id', schoolId)
    .in('user_id', otherUserIds)
    .eq('is_active', true)

  type ProfileRow = {
    id: string
    full_name: string | null
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
  }

  const profileMap = new Map<string, ReturnType<typeof resolveProfileName> & { avatar_url: string | null }>()
  for (const p of (profilesRaw ?? []) as ProfileRow[]) {
    const name = resolveProfileName(p)
    profileMap.set(p.id, { ...name, avatar_url: p.avatar_url })
  }

  const roleMap = new Map<string, string>()
  for (const r of (rolesRaw ?? []) as Array<{ user_id: string; role_code: string }>) {
    roleMap.set(r.user_id, r.role_code)
  }

  const convIds = convs.map(c => c.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: statesRaw } = await (supabase as any)
    .from('chat_participant_state')
    .select('conversation_id, last_read_at')
    .eq('user_id', user.id)
    .in('conversation_id', convIds)

  const readMap = new Map<string, string>()
  for (const s of (statesRaw ?? []) as Array<{ conversation_id: string; last_read_at: string }>) {
    readMap.set(s.conversation_id, s.last_read_at)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: messagesRaw } = await (supabase as any)
    .from('chat_messages')
    .select('conversation_id, sender_id, created_at')
    .in('conversation_id', convIds)

  const unreadMap = new Map<string, number>()
  for (const m of (messagesRaw ?? []) as Array<{
    conversation_id: string
    sender_id: string
    created_at: string
  }>) {
    if (m.sender_id === user.id) continue
    const lastRead = readMap.get(m.conversation_id)
    if (!lastRead || new Date(m.created_at) > new Date(lastRead)) {
      unreadMap.set(m.conversation_id, (unreadMap.get(m.conversation_id) ?? 0) + 1)
    }
  }

  return convs.map(c => {
    const otherId = c.participant_one === user.id ? c.participant_two : c.participant_one
    const profile = profileMap.get(otherId)
    return {
      id: c.id,
      other_user_id: otherId,
      other_user: {
        first_name: profile?.first_name ?? 'Utilisateur',
        last_name: profile?.last_name ?? '',
        display_name: profile?.display_name ?? 'Utilisateur',
        avatar_url: profile?.avatar_url ?? null,
        role_code: roleMap.get(otherId) ?? null,
      },
      last_message_at: c.last_message_at,
      last_message_preview: c.last_message_preview,
      unread_count: unreadMap.get(c.id) ?? 0,
    }
  })
}

export async function getChatMessages(
  conversationId: string
): Promise<ChatMessageRow[]> {
  const { supabase, user, error } = await requireUser()
  if (error || !user) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(200)

  return (data ?? []) as ChatMessageRow[]
}

export async function getOrCreateConversation(
  schoolId: string,
  otherUserId: string
): Promise<{ conversationId: string } | { error: string }> {
  const { supabase, user, error } = await requireUser()
  if (error || !user) return { error: error ?? 'Session expirée.' }

  if (otherUserId === user.id) {
    return { error: 'Impossible de démarrer une conversation avec vous-même.' }
  }

  const staffCheck = await assertStaffRecipient(supabase, schoolId, otherUserId)
  if ('error' in staffCheck && staffCheck.error) return { error: staffCheck.error }

  const [p1, p2] = orderConversationParticipants(user.id, otherUserId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('chat_conversations')
    .select('id')
    .eq('school_id', schoolId)
    .eq('participant_one', p1)
    .eq('participant_two', p2)
    .maybeSingle()

  if (existing?.id) {
    return { conversationId: existing.id as string }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: created, error: createError } = await (supabase as any)
    .from('chat_conversations')
    .insert({
      school_id: schoolId,
      participant_one: p1,
      participant_two: p2,
    })
    .select('id')
    .single()

  if (createError || !created) {
    return { error: createError?.message ?? 'Conversation impossible.' }
  }

  const conversationId = created.id as string

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('chat_participant_state').upsert([
    { conversation_id: conversationId, user_id: p1 },
    { conversation_id: conversationId, user_id: p2 },
  ])

  revalidatePath('/dashboard/messages')
  return { conversationId }
}

export async function sendChatMessage(input: {
  conversationId: string
  schoolId: string
  body?: string
  messageType: 'text' | 'audio' | 'image' | 'file'
  attachmentUrl?: string
  attachmentName?: string
  attachmentMime?: string
  attachmentSize?: number
}): Promise<{ message: ChatMessageRow } | { error: string }> {
  const { supabase, user, error } = await requireUser()
  if (error || !user) return { error: error ?? 'Session expirée.' }

  const hasText = !!input.body?.trim()
  const hasAttachment = !!input.attachmentUrl

  if (!hasText && !hasAttachment) {
    return { error: 'Message vide.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: messageRaw, error: insertError } = await (supabase as any)
    .from('chat_messages')
    .insert({
      conversation_id: input.conversationId,
      sender_id: user.id,
      body: hasText ? input.body!.trim() : null,
      message_type: input.messageType,
      attachment_url: input.attachmentUrl ?? null,
      attachment_name: input.attachmentName ?? null,
      attachment_mime: input.attachmentMime ?? null,
      attachment_size: input.attachmentSize ?? null,
    })
    .select('*')
    .single()

  if (insertError || !messageRaw) {
    return { error: insertError?.message ?? 'Envoi impossible.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: convRaw } = await (supabase as any)
    .from('chat_conversations')
    .select('participant_one, participant_two')
    .eq('id', input.conversationId)
    .single()

  const conv = convRaw as { participant_one: string; participant_two: string } | null
  const recipientId =
    conv?.participant_one === user.id ? conv.participant_two : conv?.participant_one

  if (recipientId) {
    const preview =
      input.messageType === 'text'
        ? (input.body?.trim().slice(0, 80) ?? 'Nouveau message')
        : input.messageType === 'audio'
          ? 'Message vocal'
          : input.messageType === 'image'
            ? 'Photo'
            : 'Fichier joint'

    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('full_name, first_name, last_name')
      .eq('id', user.id)
      .single()

    const senderName = resolveProfileName({
      id: user.id,
      full_name: (senderProfile as { full_name?: string | null } | null)?.full_name ?? null,
      first_name: (senderProfile as { first_name?: string | null } | null)?.first_name ?? null,
      last_name: (senderProfile as { last_name?: string | null } | null)?.last_name ?? null,
    }).display_name

    await dispatchNotification({
      userId: recipientId,
      schoolId: input.schoolId,
      title: `Message de ${senderName}`,
      body: preview,
      type: 'message',
      actionPath: `/dashboard/messages?c=${input.conversationId}`,
      sendEmail: false,
    })
  }

  revalidatePath('/dashboard/messages')
  return { message: messageRaw as ChatMessageRow }
}

export async function markConversationRead(conversationId: string) {
  const { supabase, user, error } = await requireUser()
  if (error || !user) return { error: error ?? 'Session expirée.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: upsertError } = await (supabase as any)
    .from('chat_participant_state')
    .upsert({
      conversation_id: conversationId,
      user_id: user.id,
      last_read_at: new Date().toISOString(),
    })

  if (upsertError) return { error: upsertError.message }
  revalidatePath('/dashboard/messages')
  return { success: true }
}

export async function searchStaffMessageRecipients(
  schoolId: string,
  query: string,
  limit = 15
) {
  const trimmed = query.trim()

  const { supabase, user, error } = await requireUser()
  if (error || !user) return []

  const { data: rolesRaw } = await supabase
    .from('user_school_roles')
    .select('user_id, role_code')
    .eq('school_id', schoolId)
    .eq('is_active', true)

  const staffUserIds = ((rolesRaw ?? []) as Array<{ user_id: string; role_code: string }>)
    .filter(row => row.user_id !== user.id && isMessagingStaffRole(row.role_code))
    .map(row => row.user_id)

  if (staffUserIds.length === 0) return []

  let profilesQuery = supabase
    .from('profiles')
    .select('id, full_name, first_name, last_name, avatar_url')
    .in('id', staffUserIds)

  if (trimmed.length >= 1) {
    const pattern = `%${trimmed.replace(/[%_\\]/g, '\\$&')}%`
    profilesQuery = profilesQuery.or(
      `full_name.ilike.${pattern},first_name.ilike.${pattern},last_name.ilike.${pattern}`
    )
  }

  const { data: profilesRaw } = await profilesQuery.limit(limit)

  const roleMap = new Map<string, string>()
  for (const r of (rolesRaw ?? []) as Array<{ user_id: string; role_code: string }>) {
    if (isMessagingStaffRole(r.role_code)) roleMap.set(r.user_id, r.role_code)
  }

  return ((profilesRaw ?? []) as Array<{
    id: string
    full_name: string | null
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
  }>).map(profile => {
    const name = resolveProfileName(profile)
    return {
      id: profile.id,
      first_name: name.first_name,
      last_name: name.last_name,
      display_name: name.display_name,
      avatar_url: profile.avatar_url,
      role_code: roleMap.get(profile.id) ?? null,
    }
  })
}

export async function listStaffMessageRecipients(schoolId: string) {
  return searchStaffMessageRecipients(schoolId, '', 50)
}

/** @deprecated Utiliser sendChatMessage */
export async function sendSchoolMessage(input: {
  schoolId: string
  recipientId: string
  subject: string
  body: string
}) {
  const conv = await getOrCreateConversation(input.schoolId, input.recipientId)
  if ('error' in conv) return { error: conv.error }

  const body = input.subject.trim()
    ? `${input.subject.trim()}\n\n${input.body.trim()}`
    : input.body.trim()

  return sendChatMessage({
    conversationId: conv.conversationId,
    schoolId: input.schoolId,
    body,
    messageType: 'text',
  })
}

/** @deprecated Utiliser markConversationRead */
export async function markMessageRead(messageId: string) {
  void messageId
  return { success: true }
}

/** @deprecated Utiliser searchStaffMessageRecipients */
export async function searchSchoolMessageRecipients(schoolId: string, query: string) {
  const results = await searchStaffMessageRecipients(schoolId, query)
  return results.map(r => ({
    id: r.id,
    first_name: r.first_name,
    last_name: r.last_name,
  }))
}
