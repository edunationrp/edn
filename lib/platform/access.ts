import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { getQaVerificationSession, isPlatformOwnerAccount } from '@/lib/platform/qa-verification'
import { hasPermission } from '@/types/permissions'
import type { UserRole } from '@/types/roles'

/** Propriétaire SaaS EduNation — aucun rattachement établissement requis */
export const PLATFORM_OWNER_ROLE = 'SUPER_ADMIN_EDUNATION' as const

export type PlatformAccessError = { error: string }
export type PlatformAccessOk = {
  user: { id: string; email?: string }
  role: UserRole
  supabase: Awaited<ReturnType<typeof createClient>>
}

export function isPlatformOwnerRole(role: string | null | undefined): boolean {
  return role === PLATFORM_OWNER_ROLE
}

export async function getEffectiveUserRole(userId: string): Promise<UserRole | null> {
  const qaSession = await getQaVerificationSession(userId)
  if (qaSession) {
    return qaSession.roleCode
  }

  const supabase = await createClient()

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('default_role')
    .eq('id', userId)
    .limit(1)

  const defaultRole = (profileRaw as Array<{ default_role: string | null }> | null)?.[0]?.default_role

  // Propriétaire plateforme : le profil prime sur tout rôle établissement
  if (isPlatformOwnerRole(defaultRole)) {
    return PLATFORM_OWNER_ROLE
  }

  const ctx = await getUserSchoolContext(userId)
  const role = (ctx?.role_code ?? defaultRole) as UserRole | undefined
  return role ?? null
}

export function isPlatformAdmin(role: string | null | undefined): boolean {
  if (!role) return false
  return hasPermission(role as UserRole, 'admin:platform')
}

export async function requirePlatformAdmin(): Promise<PlatformAccessError | PlatformAccessOk> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' }

  if (!(await isPlatformOwnerAccount(user.id))) {
    return { error: 'Accès réservé à la super-administration EduNation.' }
  }

  return { user, role: PLATFORM_OWNER_ROLE, supabase }
}
