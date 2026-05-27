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
      return { success: true as const, mode: 'direct' as const }
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

  return { success: true as const, mode: 'school' as const }
}
