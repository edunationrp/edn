'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const HideItemSchema = z.object({
  studentId: z.string().uuid(),
  itemType: z.enum(['announcement', 'convocation', 'meeting']),
  itemId: z.string().uuid(),
})

export async function hideParentCommunicationItem(input: z.infer<typeof HideItemSchema>) {
  const parsed = HideItemSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { data: relation } = await supabase
    .from('parent_student_relations')
    .select('id')
    .eq('parent_user_id', user.id)
    .eq('student_id', parsed.data.studentId)
    .maybeSingle()

  if (!relation) return { error: 'Enfant non rattaché à votre compte.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('parent_communication_hides').insert({
    parent_user_id: user.id,
    student_id: parsed.data.studentId,
    item_type: parsed.data.itemType,
    item_id: parsed.data.itemId,
  })

  if (error) {
    if (error.code === '23505') return { success: true as const }
    return { error: error.message }
  }

  revalidatePath('/parent/communications')
  revalidatePath('/parent')
  return { success: true as const }
}
