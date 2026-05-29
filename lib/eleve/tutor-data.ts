import { createClient } from '@/lib/supabase/server'
import { isTutorAiConfigured } from '@/lib/eleve/tutor-openai'
import { resolveTutorContext } from '@/lib/eleve/tutor-resolve-context'
import type { TutorConversationSummary } from '@/lib/actions/student-tutor'

export type TutorInitData = {
  mode: 'guest' | 'student'
  firstName: string
  className: string
  schoolName: string
  subjects: string[]
  conversations: TutorConversationSummary[]
  aiConfigured: boolean
  isAuthenticated: boolean
}

async function listConversationsForUser(
  userId: string,
): Promise<TutorConversationSummary[]> {
  const supabase = await createClient()

  const { data: rowsRaw, error } = await (supabase as any)
    .from('tutor_conversations')
    .select('id, title, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(30)

  if (error) return []

  const rows = (rowsRaw ?? []) as Array<{
    id: string
    title: string
    updated_at: string
  }>

  if (rows.length === 0) return []

  const { data: messagesRaw } = await (supabase as any)
    .from('tutor_messages')
    .select('conversation_id, content, created_at')
    .in(
      'conversation_id',
      rows.map(r => r.id),
    )
    .order('created_at', { ascending: false })

  const lastByConv = new Map<string, string>()
  for (const msg of (messagesRaw ?? []) as Array<{
    conversation_id: string
    content: string
  }>) {
    if (!lastByConv.has(msg.conversation_id)) {
      lastByConv.set(msg.conversation_id, msg.content)
    }
  }

  return rows.map(row => ({
    id: row.id,
    title: row.title,
    updated_at: row.updated_at,
    last_preview: lastByConv.get(row.id)?.slice(0, 80) ?? null,
  }))
}

export async function getTutorInitData(): Promise<TutorInitData> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const ctx = await resolveTutorContext()
  const isStudent = ctx.isAuthenticated

  let conversations: TutorConversationSummary[] = []
  if (isStudent && user) {
    conversations = await listConversationsForUser(user.id)
  }

  return {
    mode: isStudent ? 'student' : 'guest',
    firstName: ctx.firstName,
    className: ctx.className,
    schoolName: ctx.schoolName,
    subjects: ctx.subjects,
    conversations,
    aiConfigured: isTutorAiConfigured(),
    isAuthenticated: isStudent,
  }
}
