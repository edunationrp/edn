import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect } from 'next/navigation'
import { MessagesClient } from '@/features/messages/messages-client'
import { resolveProfileName } from '@/lib/profile/display-name'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inboxRaw } = await (supabase as any)
    .from('message_recipients')
    .select(`
      read_at,
      messages (
        id, subject, body, created_at, sender_id, message_type, audio_url
      )
    `)
    .eq('recipient_id', user.id)
    .order('created_at', { foreignTable: 'messages', ascending: false })
    .limit(50)

  type InboxRow = {
    read_at: string | null
    messages: {
      id: string
      subject: string
      body: string
      created_at: string
      sender_id: string
      message_type: string
      audio_url: string | null
    } | null
  }

  const inbox = (inboxRaw as InboxRow[] | null) ?? []

  const enrichedMessages = inbox
    .filter(row => row.messages)
    .map(row => ({
      id: row.messages!.id,
      subject: row.messages!.subject,
      body: row.messages!.body,
      is_read: !!row.read_at,
      created_at: row.messages!.created_at,
      sender_id: row.messages!.sender_id,
      has_audio: row.messages!.message_type === 'audio' || !!row.messages!.audio_url,
    }))

  const senderIds = [...new Set(enrichedMessages.map(m => m.sender_id))]
  const { data: profilesRaw } = senderIds.length > 0
    ? await supabase.from('profiles').select('id, full_name, first_name, last_name, avatar_url').in('id', senderIds)
    : { data: [] as Array<{ id: string; full_name: string | null; first_name: string | null; last_name: string | null; avatar_url: string | null }> }

  const profileMap: Record<string, { first_name: string; last_name: string; avatar_url: string | null }> = {}
  for (const p of profilesRaw ?? []) {
    const name = resolveProfileName(p)
    profileMap[p.id] = {
      first_name: name.first_name,
      last_name: name.last_name,
      avatar_url: p.avatar_url,
    }
  }

  const messagesWithSenders = enrichedMessages.map(m => ({
    ...m,
    sender: profileMap[m.sender_id] ?? { first_name: 'Inconnu', last_name: '', avatar_url: null },
  }))

  const unreadCount = messagesWithSenders.filter(m => !m.is_read).length

  return (
    <MessagesClient
      currentUserId={user.id}
      schoolId={ctx?.school_id ?? ''}
      messages={messagesWithSenders}
      unreadCount={unreadCount}
    />
  )
}
