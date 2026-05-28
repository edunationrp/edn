'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { PARENT_ACTIVE_CHILD_COOKIE, PARENT_ACTIVE_CHILD_COOKIE_OPTIONS } from '@/lib/parent/cookies'
import { getParentChildren } from '@/lib/parent/parent-context'

export async function setActiveParentChild(studentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const children = await getParentChildren(user.id)
  if (!children.some(child => child.studentId === studentId)) {
    return { error: 'Enfant introuvable.' }
  }

  const cookieStore = await cookies()
  cookieStore.set(PARENT_ACTIVE_CHILD_COOKIE, studentId, PARENT_ACTIVE_CHILD_COOKIE_OPTIONS)

  revalidatePath('/parent', 'layout')
  return { success: true as const }
}
