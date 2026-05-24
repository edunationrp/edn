import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect } from 'next/navigation'
import { MessagesClient } from '@/features/messages/messages-client'
import { getChatConversations } from '@/lib/actions/messages'

interface MessagesPageProps {
  searchParams: Promise<{ c?: string }>
}

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  const schoolId = ctx?.school_id ?? ''
  const params = await searchParams
  const initialConversationId = params.c ?? undefined

  const conversations = schoolId ? await getChatConversations(schoolId) : []

  return (
    <MessagesClient
      currentUserId={user.id}
      schoolId={schoolId}
      initialConversations={conversations}
      initialConversationId={initialConversationId}
    />
  )
}
