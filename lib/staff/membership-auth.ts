import {
  buildStaffMembershipAuthEmail,
  isStaffMembershipAuthEmail,
  normalizeContactEmail,
} from '@/lib/auth/staff-membership-email'

export type StaffSchoolOption = {
  schoolId: string
  schoolName: string
}

export async function lookupStaffSchoolsByContactEmail(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  contactEmail: string,
): Promise<StaffSchoolOption[]> {
  const normalized = normalizeContactEmail(contactEmail)
  if (!normalized) return []

  const { data, error } = await db.rpc('lookup_staff_schools_by_contact_email', {
    p_email: normalized,
  })

  if (error) return []

  return ((data ?? []) as Array<{ school_id: string; school_name: string }>).map(row => ({
    schoolId: row.school_id,
    schoolName: row.school_name,
  }))
}

export async function isStaffContactEmailUsedAtSchool(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  schoolId: string,
  contactEmail: string,
): Promise<boolean> {
  const { data, error } = await db.rpc('staff_contact_email_used_at_school', {
    p_school_id: schoolId,
    p_email: normalizeContactEmail(contactEmail),
  })

  if (error) return false
  return Boolean(data)
}

export async function resolveStaffLoginEmail(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  userId: string,
  contactEmail: string,
  schoolId: string,
): Promise<string> {
  const { data } = await admin.auth.admin.getUserById(userId)
  const authEmail = data.user?.email?.trim()
  if (authEmail) return authEmail
  return buildStaffMembershipAuthEmail(contactEmail, schoolId)
}

/** Supprime le compte Auth de l'adhésion école lorsqu'il n'a plus de rôle dans cet établissement. */
export async function deleteStaffSchoolAccountIfEmpty(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  userId: string,
  schoolId: string,
): Promise<{ deleted: boolean; error?: string }> {
  const { data: remainingAtSchoolRaw } = await admin
    .from('user_school_roles')
    .select('id')
    .eq('user_id', userId)
    .eq('school_id', schoolId)
    .limit(1)

  if ((remainingAtSchoolRaw ?? []).length > 0) {
    return { deleted: false }
  }

  const { data: authData } = await admin.auth.admin.getUserById(userId)
  const authEmail = authData.user?.email ?? null

  const { data: remainingAnywhereRaw } = await admin
    .from('user_school_roles')
    .select('id')
    .eq('user_id', userId)
    .limit(1)

  const hasOtherSchools = (remainingAnywhereRaw ?? []).length > 0
  const isSchoolScoped = isStaffMembershipAuthEmail(authEmail)

  if (hasOtherSchools && !isSchoolScoped) {
    return { deleted: false }
  }

  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) {
    return {
      deleted: false,
      error:
        'Compte non supprimé : ' +
        error.message +
        '. Appliquez la migration 025_profile_delete_references.sql si ce message persiste.',
    }
  }

  return { deleted: true }
}

export async function findStaffUserIdAtSchool(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  contactEmail: string,
  schoolId: string,
): Promise<string | null> {
  const normalized = normalizeContactEmail(contactEmail)

  const { data: rolesRaw } = await db
    .from('user_school_roles')
    .select('user_id, profiles!inner(email)')
    .eq('school_id', schoolId)
    .eq('is_active', true)

  const roles = (rolesRaw ?? []) as Array<{
    user_id: string
    profiles: { email: string | null } | { email: string | null }[]
  }>

  for (const row of roles) {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    if (profile?.email && normalizeContactEmail(profile.email) === normalized) {
      return row.user_id
    }
  }

  return null
}
