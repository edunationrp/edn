import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect } from 'next/navigation'
import { MessagesClient } from '@/features/messages/messages-client'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)

  // Charger les messages reçus
  const { data: messagesRaw } = await supabase
    .from('messages')
    .select('id, subject, body, is_read, created_at, sender_id, has_audio')
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const messages = messagesRaw as Array<{
    id: string
    subject: string
    body: string
    is_read: boolean
    created_at: string
    sender_id: string
    has_audio: boolean
  }> | null

  // Charger les profils des expéditeurs
  const senderIds = [...new Set((messages ?? []).map(m => m.sender_id))]
  const { data: profilesRaw } = senderIds.length > 0
    ? await supabase.from('profiles').select('id, first_name, last_name, avatar_url').in('id', senderIds)
    : { data: [] }

  const profiles = profilesRaw as Array<{ id: string; first_name: string; last_name: string; avatar_url: string | null }> | null

  const profileMap: Record<string, { first_name: string; last_name: string; avatar_url: string | null }> = {}
  for (const p of profiles ?? []) {
    profileMap[p.id] = { first_name: p.first_name, last_name: p.last_name, avatar_url: p.avatar_url }
  }

  const enrichedMessages = (messages ?? []).map(m => ({
    ...m,
    sender: profileMap[m.sender_id] ?? { first_name: 'Inconnu', last_name: '', avatar_url: null },
  }))

  const unreadCount = enrichedMessages.filter(m => !m.is_read).length

  return (
    <MessagesClient
      currentUserId={user.id}
      schoolId={ctx?.school_id ?? ''}
      messages={enrichedMessages}
      unreadCount={unreadCount}
    />
  )
}
