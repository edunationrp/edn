import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { hasPermission } from '@/types/permissions'
import type { UserRole } from '@/types/roles'

type AccessContext = {
  supabase: Awaited<ReturnType<typeof createClient>>
  userId: string
  schoolId: string
  role: UserRole
}

type AccessError = { error: string }
type AccessResult = AccessContext | AccessError

async function requireTimetableAccess(): Promise<AccessResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' }

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) return { error: 'Aucun établissement associé.' }

  const role = ctx.role_code as UserRole
  if (!hasPermission(role, 'timetable:read')) {
    return { error: 'Vous n\'avez pas accès aux emplois du temps.' }
  }

  return {
    supabase,
    userId: user.id,
    schoolId: ctx.school_id,
    role,
  }
}

export function canManageTimetable(role: UserRole | string) {
  return hasPermission(role, 'timetable:manage')
}

export function canRequestTimetableChange(role: UserRole | string) {
  return role === 'PROFESSEUR'
}

export async function requireTimetableRead() {
  return requireTimetableAccess()
}

export async function requireTimetableManage() {
  const access = await requireTimetableAccess()
  if ('error' in access) return access
  if (!canManageTimetable(access.role)) {
    return { error: 'Vous n\'avez pas les droits pour gérer les emplois du temps.' }
  }
  return access
}
