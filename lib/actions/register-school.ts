'use server'

import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAppUrl } from '@/lib/email/client'
import { getCountryLabel, parseSchoolYearDates, SUBSCRIPTION_PLANS } from '@/lib/onboarding/constants'
import type { DirectorAccountServerValues, OnboardingSchoolPayload } from '@/lib/onboarding/schemas'
import {
  directorAccountServerSchema,
  organizationSchema,
  schoolIdentitySchema,
  schoolSettingsSchema,
  schoolStructureSchema,
} from '@/lib/onboarding/schemas'
import { sendRegistrationCompleteEmail } from '@/lib/email/send'
import { dispatchNotification } from '@/lib/notifications/dispatch'

type AdminDb = SupabaseClient<any>

export type FullRegistrationDirectorInput = DirectorAccountServerValues

function termCountForFormat(format: 'trimestre' | 'semestre' | 'annuel') {
  if (format === 'semestre') return 2
  if (format === 'annuel') return 1
  return 3
}

function termLabel(format: 'trimestre' | 'semestre' | 'annuel', index: number) {
  if (format === 'semestre') return index === 1 ? 'Semestre 1' : 'Semestre 2'
  if (format === 'annuel') return 'Année scolaire'
  return `Trimestre ${index}`
}

function validateSchoolPayload(payload: OnboardingSchoolPayload) {
  const checks = [
    organizationSchema.safeParse(payload),
    schoolIdentitySchema.safeParse(payload),
    schoolSettingsSchema.safeParse(payload),
    schoolStructureSchema.safeParse(payload),
  ]

  if (checks.some(c => !c.success)) {
    return { error: 'Informations établissement incomplètes ou invalides.' }
  }

  return { payload }
}

async function createSchoolForFounder(
  admin: AdminDb,
  userId: string,
  director: {
    full_name: string
    phone: string
    country: string
    preferred_language?: string
  },
  payload: OnboardingSchoolPayload
) {
  const countryLabel = getCountryLabel(payload.country)

  const { data: organization, error: orgError } = await admin
    .from('organizations')
    .insert({
      founder_id: userId,
      name: payload.organization_name.trim(),
      plan_code: SUBSCRIPTION_PLANS.starter.code,
      max_schools: SUBSCRIPTION_PLANS.starter.maxSchools,
      is_active: true,
    })
    .select('id')
    .single()

  if (orgError || !organization) {
    return { error: orgError?.message ?? "Impossible de créer l'organisation." }
  }

  const { data: school, error: schoolError } = await admin
    .from('schools')
    .insert({
      founder_id: userId,
      organization_id: organization.id,
      name: payload.school_name.trim(),
      structure_name: payload.structure_name.trim(),
      type: payload.school_type,
      country: countryLabel,
      city: payload.city.trim(),
      address: payload.address.trim(),
      phone: payload.phone?.trim() || null,
      email: payload.email?.trim() || null,
      currency: payload.currency,
      evaluation_system: payload.evaluation_system,
      main_language: payload.main_language,
      estimated_students: payload.estimated_students ?? null,
      access_level: payload.access_level,
      academic_format: payload.academic_format,
      is_default: true,
      is_active: true,
    })
    .select('id')
    .single()

  if (schoolError || !school) {
    return { error: schoolError?.message ?? "Impossible de créer l'établissement." }
  }

  const { error: roleError } = await admin.from('user_school_roles').insert({
    user_id: userId,
    school_id: school.id,
    role_code: 'PROVISEUR',
    is_active: true,
  })

  if (roleError) {
    return { error: roleError.message }
  }

  const yearDates = parseSchoolYearDates(payload.school_year)
  const { data: schoolYear, error: yearError } = await admin
    .from('school_years')
    .insert({
      school_id: school.id,
      name: yearDates.name,
      start_date: yearDates.start_date,
      end_date: yearDates.end_date,
      is_active: true,
    })
    .select('id')
    .single()

  if (yearError || !schoolYear) {
    return { error: yearError?.message ?? "Impossible de créer l'année scolaire." }
  }

  const termCount = termCountForFormat(payload.academic_format)
  const start = new Date(yearDates.start_date)
  const end = new Date(yearDates.end_date)
  const totalMs = end.getTime() - start.getTime()
  const slice = totalMs / termCount

  for (let i = 0; i < termCount; i++) {
    const termStart = new Date(start.getTime() + slice * i)
    const termEnd = new Date(start.getTime() + slice * (i + 1) - 86400000)
    const termType =
      payload.academic_format === 'annuel' ? 'annuel' : payload.academic_format

    const { error: termError } = await admin.from('terms').insert({
      school_id: school.id,
      school_year_id: schoolYear.id,
      name: termLabel(payload.academic_format, i + 1),
      type: termType,
      start_date: termStart.toISOString().slice(0, 10),
      end_date: termEnd.toISOString().slice(0, 10),
      is_active: i === 0,
    })

    if (termError) {
      return { error: termError.message }
    }
  }

  const { error: profileError } = await admin
    .from('profiles')
    .update({
      default_role: 'PROVISEUR',
      full_name: director.full_name,
      phone: director.phone,
      country: director.country,
      preferred_language: director.preferred_language ?? payload.main_language,
    })
    .eq('id', userId)

  if (profileError) {
    return { error: profileError.message }
  }

  await dispatchNotification({
    userId,
    schoolId: school.id,
    title: 'Établissement créé avec succès',
    body: `Votre école « ${payload.school_name.trim()} » est prête. Confirmez votre email pour accéder au tableau de bord.`,
    type: 'success',
    actionPath: '/dashboard',
    sendEmail: false,
  })

  return {
    success: true as const,
    organizationId: organization.id,
    schoolId: school.id,
  }
}

export async function completeFullRegistration(
  director: FullRegistrationDirectorInput,
  payload: OnboardingSchoolPayload
) {
  const directorCheck = directorAccountServerSchema.safeParse(director)

  if (!directorCheck.success) {
    return { error: 'Informations directeur invalides.' }
  }

  const schoolCheck = validateSchoolPayload(payload)
  if ('error' in schoolCheck && schoolCheck.error) {
    return { error: schoolCheck.error }
  }

  let admin: AdminDb
  try {
    admin = createAdminClient() as AdminDb
  } catch {
    return { error: 'Configuration serveur incomplète (SUPABASE_SERVICE_ROLE_KEY).' }
  }

  const { data: existingProfile } = await admin
    .from('profiles')
    .select('id')
    .ilike('email', director.email)
    .maybeSingle()

  if (existingProfile) {
    return {
      error: 'Un compte existe déjà avec cet email. Connectez-vous ou utilisez une autre adresse.',
    }
  }

  const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
    email: director.email,
    password: director.password,
    email_confirm: false,
    user_metadata: {
      full_name: director.full_name,
      phone: director.phone,
      country: director.country,
      preferred_language: director.preferred_language ?? 'fr',
      default_role: 'PROVISEUR',
    },
  })

  if (createUserError || !createdUser.user) {
    return { error: createUserError?.message ?? 'Impossible de créer le compte directeur.' }
  }

  const userId = createdUser.user.id

  const schoolResult = await createSchoolForFounder(
    admin,
    userId,
    {
      full_name: director.full_name,
      phone: director.phone,
      country: director.country,
      preferred_language: director.preferred_language,
    },
    payload
  )

  if ('error' in schoolResult && schoolResult.error) {
    await admin.auth.admin.deleteUser(userId)
    return { error: schoolResult.error }
  }

  const appUrl = getAppUrl()
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'signup',
    email: director.email,
    password: director.password,
    options: {
      redirectTo: `${appUrl}/login?confirmed=1`,
    },
  })

  if (linkError || !linkData?.properties?.action_link) {
    return {
      error:
        linkError?.message ??
        'Inscription enregistrée, mais le lien de confirmation n\'a pas pu être généré. Contactez le support.',
    }
  }

  await sendRegistrationCompleteEmail(director.email, {
    fullName: director.full_name,
    schoolName: payload.school_name.trim(),
    organizationName: payload.organization_name.trim(),
    confirmationUrl: linkData.properties.action_link,
  })

  return {
    success: true as const,
    requiresEmailConfirmation: true as const,
    email: director.email,
  }
}

export async function completeSchoolOnboarding(payload: OnboardingSchoolPayload) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Session expirée. Reconnectez-vous pour continuer.' }
  }

  const schoolCheck = validateSchoolPayload(payload)
  if ('error' in schoolCheck && schoolCheck.error) {
    return { error: schoolCheck.error }
  }

  let admin: AdminDb
  try {
    admin = createAdminClient() as AdminDb
  } catch {
    return { error: 'Configuration serveur incomplète (SUPABASE_SERVICE_ROLE_KEY).' }
  }

  const schoolResult = await createSchoolForFounder(
    admin,
    user.id,
    {
      full_name: (user.user_metadata?.full_name as string | undefined) ?? payload.organization_name,
      phone: (user.user_metadata?.phone as string | undefined) ?? '',
      country: (user.user_metadata?.country as string | undefined) ?? payload.country,
      preferred_language: (user.user_metadata?.preferred_language as string | undefined) ?? 'fr',
    },
    payload
  )

  if ('error' in schoolResult && schoolResult.error) {
    return { error: schoolResult.error }
  }

  return {
    success: true,
    organizationId: schoolResult.organizationId,
    schoolId: schoolResult.schoolId,
  }
}

export async function getFounderRegistrationStatus() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { authenticated: false as const, hasSchools: false }
  }

  const { count } = await supabase
    .from('user_school_roles')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_active', true)

  return {
    authenticated: true as const,
    hasSchools: (count ?? 0) > 0,
    email: user.email ?? '',
    fullName: (user.user_metadata?.full_name as string | undefined) ?? '',
    country: (user.user_metadata?.country as string | undefined) ?? 'BF',
  }
}
