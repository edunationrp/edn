'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function sendSchoolMessage(input: {
  schoolId: string
  recipientId: string
  subject: string
  body: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' }

  if (!input.subject.trim() || !input.body.trim()) {
    return { error: 'Objet et message requis.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: messageRaw, error: messageError } = await (supabase as any)
    .from('messages')
    .insert({
      school_id: input.schoolId,
      sender_id: user.id,
      subject: input.subject.trim(),
      body: input.body.trim(),
      message_type: 'text',
    })
    .select('id')
    .single()

  if (messageError || !messageRaw) {
    return { error: messageError?.message ?? 'Envoi impossible.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: recipientError } = await (supabase as any)
    .from('message_recipients')
    .insert({
      message_id: messageRaw.id,
      recipient_id: input.recipientId,
    })

  if (recipientError) return { error: recipientError.message }

  revalidatePath('/dashboard/messages')
  return { success: true }
}

export async function markMessageRead(messageId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('message_recipients')
    .update({ read_at: new Date().toISOString() })
    .eq('message_id', messageId)
    .eq('recipient_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/messages')
  return { success: true }
}
