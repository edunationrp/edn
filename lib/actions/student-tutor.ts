'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getStudentTutorContext } from '@/lib/eleve/tutor-context'

export type TutorMessageRow = {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export type TutorConversationSummary = {
  id: string
  title: string
  updated_at: string
  last_preview: string | null
}

async function requireStudentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' as const, user: null, supabase, ctx: null }
  const ctx = await getStudentTutorContext(user.id)
  if (!ctx) return { error: 'Profil élève introuvable.' as const, user: null, supabase, ctx: null }
  return { error: null, user, supabase, ctx }
}

export async function listTutorConversations(): Promise<{
  conversations: TutorConversationSummary[]
  error?: string
}> {
  const gate = await requireStudentUser()
  if (gate.error || !gate.user) return { conversations: [], error: gate.error ?? undefined }

  const { data: rowsRaw } = await (gate.supabase as any)
    .from('tutor_conversations')
    .select('id, title, updated_at')
    .eq('user_id', gate.user.id)
    .order('updated_at', { ascending: false })
    .limit(30)

  const rows = (rowsRaw ?? []) as Array<{ id: string; title: string; updated_at: string }>
  const conversations: TutorConversationSummary[] = []

  for (const row of rows) {
    const { data: lastMsg } = await (gate.supabase as any)
      .from('tutor_messages')
      .select('content')
      .eq('conversation_id', row.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    conversations.push({
      id: row.id,
      title: row.title,
      updated_at: row.updated_at,
      last_preview: (lastMsg as { content: string } | null)?.content?.slice(0, 80) ?? null,
    })
  }

  return { conversations }
}

export async function getTutorMessages(conversationId: string): Promise<{
  messages: TutorMessageRow[]
  error?: string
}> {
  const gate = await requireStudentUser()
  if (gate.error || !gate.user) return { messages: [], error: gate.error ?? undefined }

  const { data: conv } = await (gate.supabase as any)
    .from('tutor_conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('user_id', gate.user.id)
    .maybeSingle()

  if (!conv) return { messages: [], error: 'Conversation introuvable.' }

  const { data: messagesRaw } = await (gate.supabase as any)
    .from('tutor_messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  return {
    messages: (messagesRaw ?? []) as TutorMessageRow[],
  }
}

export async function createTutorConversation(title?: string): Promise<{
  conversationId?: string
  error?: string
}> {
  const gate = await requireStudentUser()
  if (gate.error || !gate.user || !gate.ctx) return { error: gate.error ?? undefined }

  const { data, error } = await (gate.supabase as any)
    .from('tutor_conversations')
    .insert({
      user_id: gate.user.id,
      student_id: gate.ctx.studentId,
      school_id: gate.ctx.schoolId,
      title: title?.trim() || 'Nouvelle conversation',
    })
    .select('id')
    .single()

  if (error || !data) return { error: 'Impossible de créer la conversation.' }

  revalidatePath('/eleve/tuteur')
  return { conversationId: (data as { id: string }).id }
}

export async function deleteTutorConversation(conversationId: string): Promise<{ error?: string }> {
  const gate = await requireStudentUser()
  if (gate.error || !gate.user) return { error: gate.error ?? undefined }

  const { error } = await (gate.supabase as any)
    .from('tutor_conversations')
    .delete()
    .eq('id', conversationId)
    .eq('user_id', gate.user.id)

  if (error) return { error: 'Suppression impossible.' }
  revalidatePath('/eleve/tuteur')
  return {}
}

export async function saveTutorExchange(
  conversationId: string,
  userContent: string,
  assistantContent: string,
  options?: { conversationTitle?: string },
): Promise<{ error?: string }> {
  const gate = await requireStudentUser()
  if (gate.error || !gate.user) return { error: gate.error ?? undefined }

  const { data: conv } = await (gate.supabase as any)
    .from('tutor_conversations')
    .select('id, title')
    .eq('id', conversationId)
    .eq('user_id', gate.user.id)
    .maybeSingle()

  if (!conv) return { error: 'Conversation introuvable.' }

  const { error: insertError } = await (gate.supabase as any).from('tutor_messages').insert([
    { conversation_id: conversationId, role: 'user', content: userContent },
    { conversation_id: conversationId, role: 'assistant', content: assistantContent },
  ])

  if (insertError) return { error: 'Enregistrement impossible.' }

  const updates: { updated_at: string; title?: string } = {
    updated_at: new Date().toISOString(),
  }
  const currentTitle = (conv as { title: string }).title
  if (
    options?.conversationTitle
    && (currentTitle === 'Nouvelle conversation' || currentTitle.length < 4)
  ) {
    updates.title = options.conversationTitle.slice(0, 60)
  }

  await (gate.supabase as any)
    .from('tutor_conversations')
    .update(updates)
    .eq('id', conversationId)
    .eq('user_id', gate.user.id)

  revalidatePath('/eleve/tuteur')
  return {}
}
