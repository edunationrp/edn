import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { hasPermission } from '@/types/permissions'
import { isSchoolFullAuthority } from '@/types/permissions'
import type { UserRole } from '@/types/roles'

type AccessContext = {
  supabase: Awaited<ReturnType<typeof createClient>>
  userId: string
  schoolId: string
  role: UserRole
}

type AccessError = { error: string }

export function canViewPromotions(role: UserRole | string) {
  return (
    hasPermission(role, 'promotions:read') ||
    hasPermission(role, 'reports:academic') ||
    isSchoolFullAuthority(role)
  )
}

export function canManagePromotions(role: UserRole | string) {
  return hasPermission(role, 'promotions:manage') || isSchoolFullAuthority(role)
}

export async function requirePromotionsRead(): Promise<AccessContext | AccessError> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' }

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) return { error: 'Aucun établissement associé.' }

  const role = ctx.role_code as UserRole
  if (!canViewPromotions(role)) {
    return { error: 'Vous n\'avez pas les droits pour consulter le bilan de passage.' }
  }

  return { supabase, userId: user.id, schoolId: ctx.school_id, role }
}

export async function requirePromotionsManage(): Promise<AccessContext | AccessError> {
  const read = await requirePromotionsRead()
  if ('error' in read) return read
  if (!canManagePromotions(read.role)) {
    return { error: 'Seul la direction peut gérer le bilan de passage.' }
  }
  return read
}
