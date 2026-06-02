'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { hasPermission } from '@/types/permissions'
import type { UserRole } from '@/types/roles'
import { STUDENT_PHOTOS_BUCKET } from '@/lib/students/photo-upload'

function storagePathFromPublicUrl(photoUrl: string) {
  const marker = `/storage/v1/object/public/${STUDENT_PHOTOS_BUCKET}/`
  const index = photoUrl.indexOf(marker)
  if (index === -1) return null
  return decodeURIComponent(photoUrl.slice(index + marker.length).split('?')[0])
}

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

  let admin
  try {
    admin = createAdminClient()
  } catch {
    return { error: 'Configuration serveur incomplète.' }
  }

  const cleanUrl = photoUrl.split('?')[0]

  const { data: existingRaw } = await admin
    .from('students')
    .select('photo_url')
    .eq('id', studentId)
    .eq('school_id', ctx.school_id)
    .maybeSingle()

  const existing = existingRaw as { photo_url: string | null } | null
  if (!existing) return { error: 'Élève introuvable.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updatedRaw, error } = await (admin as any)
    .from('students')
    .update({ photo_url: cleanUrl })
    .eq('id', studentId)
    .eq('school_id', ctx.school_id)
    .select('id, updated_at')
    .maybeSingle()

  const updated = updatedRaw as { id: string; updated_at: string } | null
  if (error) return { error: error.message }
  if (!updated) return { error: 'Impossible d\'enregistrer la photo pour cet élève.' }

  const previousPath = existing.photo_url ? storagePathFromPublicUrl(existing.photo_url) : null
  const nextPath = storagePathFromPublicUrl(cleanUrl)
  if (previousPath && previousPath !== nextPath) {
    await admin.storage.from(STUDENT_PHOTOS_BUCKET).remove([previousPath])
  }

  revalidatePath(`/dashboard/students/${studentId}`)
  revalidatePath('/dashboard/students')
  return { success: true as const, updatedAt: updated.updated_at }
}
