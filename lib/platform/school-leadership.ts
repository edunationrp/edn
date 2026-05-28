import { normalizeRole } from '@/types/roles'

/** Rôles comptés comme direction avec autorité complète sur l'établissement */
export const SCHOOL_LEADERSHIP_ROLE_CODES = ['PROVISEUR', 'FONDATEUR', 'DIRECTEUR_ADJOINT'] as const

export type SchoolLeaderRow = {
  id: string
  userId: string
  roleCode: string
  fullName: string | null
  email: string | null
  isActive: boolean
}

export type PendingProviseurInviteRow = {
  id: string
  invitedEmail: string | null
  invitedName: string | null
  expiresAt: string
  token: string
}

export function isSchoolLeadershipRole(roleCode: string): boolean {
  const normalized = normalizeRole(roleCode)
  return normalized === 'PROVISEUR' || normalized === 'FONDATEUR'
}

export function isRemovableLeadershipRole(roleCode: string): boolean {
  const code = roleCode.toUpperCase()
  return code === 'PROVISEUR' || code === 'FONDATEUR'
}

export async function syncSchoolLeadershipOwnership(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  schoolId: string,
  newLeaderUserId: string,
): Promise<{ error?: string }> {
  const { data: schoolRaw, error: schoolError } = await db
    .from('schools')
    .select('id, organization_id, founder_id')
    .eq('id', schoolId)
    .limit(1)

  const school = (schoolRaw as Array<{
    id: string
    organization_id: string | null
    founder_id: string | null
  }> | null)?.[0]

  if (schoolError || !school) {
    return { error: schoolError?.message ?? 'Établissement introuvable.' }
  }

  const { error: updateSchoolError } = await db
    .from('schools')
    .update({ founder_id: newLeaderUserId })
    .eq('id', schoolId)

  if (updateSchoolError) {
    return { error: updateSchoolError.message }
  }

  if (school.organization_id) {
    const { error: updateOrgError } = await db
      .from('organizations')
      .update({ founder_id: newLeaderUserId })
      .eq('id', school.organization_id)

    if (updateOrgError) {
      return { error: updateOrgError.message }
    }
  }

  const { error: profileError } = await db
    .from('profiles')
    .update({ default_role: 'PROVISEUR' })
    .eq('id', newLeaderUserId)
    .neq('default_role', 'SUPER_ADMIN_EDUNATION')

  if (profileError) {
    return { error: profileError.message }
  }

  return {}
}

export async function countActiveSchoolLeaders(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  schoolId: string,
  excludeUserId?: string,
): Promise<number> {
  const { data } = await db
    .from('user_school_roles')
    .select('user_id, role_code')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .in('role_code', [...SCHOOL_LEADERSHIP_ROLE_CODES])

  return ((data ?? []) as Array<{ user_id: string; role_code: string }>).filter(row => {
    if (excludeUserId && row.user_id === excludeUserId) return false
    return isSchoolLeadershipRole(row.role_code)
  }).length
}

export async function hasPendingProviseurInvitation(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  schoolId: string,
): Promise<boolean> {
  const { data } = await db
    .from('staff_invitations')
    .select('id')
    .eq('school_id', schoolId)
    .eq('role_code', 'PROVISEUR')
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .limit(1)

  return ((data ?? []) as unknown[]).length > 0
}
