'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeContactEmail } from '@/lib/auth/staff-membership-email'
import {
  findStaffUserIdAtSchool,
  lookupStaffSchoolsByContactEmail,
  resolveStaffLoginEmail,
  type StaffSchoolOption,
} from '@/lib/staff/membership-auth'

export async function lookupStaffLoginSchools(
  contactEmail: string,
): Promise<{ schools: StaffSchoolOption[] } | { error: string }> {
  const normalized = normalizeContactEmail(contactEmail)
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { error: 'Email invalide.' }
  }

  try {
    const admin = createAdminClient()
    const schools = await lookupStaffSchoolsByContactEmail(admin, normalized)
    return { schools }
  } catch {
    return { error: 'Service de connexion indisponible.' }
  }
}

export async function loginStaffMember(input: {
  contactEmail: string
  password: string
  schoolId?: string
}) {
  const contactEmail = normalizeContactEmail(input.contactEmail)
  const password = input.password

  if (!contactEmail || password.length < 6) {
    return { error: 'Email ou mot de passe invalide.' }
  }

  const supabase = await createClient()

  if (!input.schoolId) {
    const { error } = await supabase.auth.signInWithPassword({
      email: contactEmail,
      password,
    })
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profileOperationalRaw } = await (supabase as any).rpc('is_profile_operational', {
          p_user_id: user.id,
        })
        if (!profileOperationalRaw) {
          return { success: true as const, mode: 'direct' as const, redirectTo: '/suspended' }
        }
      }
      return { success: true as const, mode: 'direct' as const, redirectTo: '/dashboard' }
    }
    return { error: 'Email ou mot de passe incorrect.' }
  }

  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return { error: 'Service de connexion indisponible.' }
  }

  const userId = await findStaffUserIdAtSchool(admin, contactEmail, input.schoolId)
  if (!userId) {
    return {
      error:
        'Aucun compte pour cet établissement. Finalisez d\'abord votre inscription via le lien d\'invitation reçu par email.',
    }
  }

  const loginEmail = await resolveStaffLoginEmail(admin, userId, contactEmail, input.schoolId)
  const { error } = await supabase.auth.signInWithPassword({
    email: loginEmail,
    password,
  })

  if (error) {
    return { error: 'Email ou mot de passe incorrect.' }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profileOperationalRaw } = await (supabase as any).rpc('is_profile_operational', {
      p_user_id: user.id,
    })
    if (!profileOperationalRaw) {
      return { success: true as const, mode: 'school' as const, redirectTo: '/suspended' }
    }

    const { data: schoolRaw } = await supabase
      .from('schools')
      .select('id, is_active, platform_status, suspended_until')
      .eq('id', input.schoolId)
      .limit(1)

    const school = (schoolRaw as Array<{
      id: string
      is_active: boolean
      platform_status?: 'ACTIVE' | 'SUSPENDED' | 'DISABLED' | null
      suspended_until?: string | null
    }> | null)?.[0]

    if (school) {
      const status = school.platform_status ?? (school.is_active ? 'ACTIVE' : 'DISABLED')
      const blocked =
        status === 'DISABLED' ||
        (status === 'SUSPENDED' && (!school.suspended_until || new Date(school.suspended_until).getTime() > Date.now()))
      if (blocked) {
        return { success: true as const, mode: 'school' as const, redirectTo: '/suspended' }
      }
    }
  }

  return { success: true as const, mode: 'school' as const, redirectTo: '/dashboard' }
}
