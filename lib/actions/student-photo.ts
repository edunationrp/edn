'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { hasPermission } from '@/types/permissions'
import type { UserRole } from '@/types/roles'

export async function updateStudentPhotoUrl(studentId: string, photoUrl: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' }

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) return { error: 'Aucun établissement associé.' }

  const role = ctx.role_code as UserRole
  if (!hasPermission(role, 'students:update')) {
    return { error: 'Vous n\'avez pas les droits pour modifier la photo.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('students')
    .update({ photo_url: photoUrl })
    .eq('id', studentId)
    .eq('school_id', ctx.school_id)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/students/${studentId}`)
  revalidatePath('/dashboard/students')
  return { success: true as const }
}
