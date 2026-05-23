'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { canEditSection } from '@/lib/settings/permissions'
import { mergeUserPreferences } from '@/lib/settings/defaults'
import type { NotificationPreferences, SettingsSectionId, TeachingPreferences, UserPreferences } from '@/lib/settings/types'
import type { UserRole } from '@/types/roles'
import { parseSchoolYearDates } from '@/lib/onboarding/constants'

type ActionResult = { success: true } | { error: string }

async function getActionContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée.' as const }

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) return { error: 'Aucun établissement associé.' as const }

  const role = ctx.role_code as UserRole
  return { supabase, user, ctx, role, schoolId: ctx.school_id }
}

function denyUnless(role: UserRole, section: SettingsSectionId): ActionResult | null {
  if (!canEditSection(role, section)) {
    return { error: 'Vous n\'avez pas les droits pour modifier cette section.' }
  }
  return null
}

export async function updateProfile(data: {
  fullName: string
  phone?: string
  country?: string
  preferredLanguage?: string
}) {
  const base = await getActionContext()
  if ('error' in base) return base

  const denied = denyUnless(base.role, 'profile')
  if (denied) return denied

  if (!data.fullName.trim()) {
    return { error: 'Le nom complet est requis.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (base.supabase as any)
    .from('profiles')
    .update({
      full_name: data.fullName.trim(),
      phone: data.phone?.trim() || null,
      country: data.country?.trim() || undefined,
      preferred_language: data.preferredLanguage || undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', base.user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateNotificationPreferences(prefs: NotificationPreferences) {
  const base = await getActionContext()
  if ('error' in base) return base

  const denied = denyUnless(base.role, 'notifications')
  if (denied) return denied

  const { data: profileRaw } = await base.supabase
    .from('profiles')
    .select('preferences')
    .eq('id', base.user.id)
    .limit(1)

  const current = mergeUserPreferences(
    (profileRaw as Array<{ preferences: unknown }> | null)?.[0]?.preferences
  )

  const next: UserPreferences = {
    ...current,
    notifications: prefs,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (base.supabase as any)
    .from('profiles')
    .update({
      preferences: next,
      updated_at: new Date().toISOString(),
    })
    .eq('id', base.user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function updateTeachingPreferences(prefs: TeachingPreferences) {
  const base = await getActionContext()
  if ('error' in base) return base

  const denied = denyUnless(base.role, 'teaching')
  if (denied) return denied

  const { data: profileRaw } = await base.supabase
    .from('profiles')
    .select('preferences')
    .eq('id', base.user.id)
    .limit(1)

  const current = mergeUserPreferences(
    (profileRaw as Array<{ preferences: unknown }> | null)?.[0]?.preferences
  )

  const next: UserPreferences = {
    ...current,
    teaching: prefs,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (base.supabase as any)
    .from('profiles')
    .update({
      preferences: next,
      updated_at: new Date().toISOString(),
    })
    .eq('id', base.user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function updateParentPreferences(data: {
  preferredLanguage: string
  simplifiedInterface: boolean
  notifySmsFallback: boolean
}) {
  const base = await getActionContext()
  if ('error' in base) return base

  const denied = denyUnless(base.role, 'parent-space')
  if (denied) return denied

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: parentError } = await (base.supabase as any)
    .from('parent_profiles')
    .update({
      preferred_language: data.preferredLanguage,
    })
    .eq('user_id', base.user.id)

  if (parentError) return { error: parentError.message }

  const { data: profileRaw } = await base.supabase
    .from('profiles')
    .select('preferences')
    .eq('id', base.user.id)
    .limit(1)

  const current = mergeUserPreferences(
    (profileRaw as Array<{ preferences: unknown }> | null)?.[0]?.preferences
  )

  const next: UserPreferences = {
    ...current,
    parent: {
      simplified_interface: data.simplifiedInterface,
      notify_sms_fallback: data.notifySmsFallback,
    },
    language: data.preferredLanguage,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (base.supabase as any)
    .from('profiles')
    .update({
      preferences: next,
      preferred_language: data.preferredLanguage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', base.user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function updateSchoolIdentity(data: {
  name: string
  structureName?: string
  type: string
  address?: string
  city?: string
  province?: string
  country?: string
  phone?: string
  email?: string
  motto?: string
  logoUrl?: string
}) {
  const base = await getActionContext()
  if ('error' in base) return base

  const denied = denyUnless(base.role, 'school-identity')
  if (denied) return denied

  if (!data.name.trim()) return { error: 'Le nom de l\'établissement est requis.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (base.supabase as any)
    .from('schools')
    .update({
      name: data.name.trim(),
      structure_name: data.structureName?.trim() || data.name.trim(),
      type: data.type,
      address: data.address?.trim() || null,
      city: data.city?.trim() || null,
      province: data.province?.trim() || null,
      country: data.country?.trim() || 'Burkina Faso',
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      motto: data.motto?.trim() || null,
      logo_url: data.logoUrl?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', base.schoolId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateSchoolAcademic(data: {
  evaluationSystem: string
  mainLanguage: string
  academicFormat: string
  accessLevel: string
  estimatedStudents?: number | null
}) {
  const base = await getActionContext()
  if ('error' in base) return base

  const denied = denyUnless(base.role, 'school-academic')
  if (denied) return denied

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (base.supabase as any)
    .from('schools')
    .update({
      evaluation_system: data.evaluationSystem,
      main_language: data.mainLanguage,
      academic_format: data.academicFormat,
      access_level: data.accessLevel,
      estimated_students: data.estimatedStudents ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', base.schoolId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function updateSchoolFinance(data: { currency: string }) {
  const base = await getActionContext()
  if ('error' in base) return base

  const denied = denyUnless(base.role, 'school-finance')
  if (denied) return denied

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (base.supabase as any)
    .from('schools')
    .update({
      currency: data.currency,
      updated_at: new Date().toISOString(),
    })
    .eq('id', base.schoolId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function setActiveSchoolYear(schoolYearId: string) {
  const base = await getActionContext()
  if ('error' in base) return base

  const denied = denyUnless(base.role, 'school-calendar')
  if (denied) return denied

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = base.supabase as any

  const { error: deactivateError } = await db
    .from('school_years')
    .update({ is_active: false })
    .eq('school_id', base.schoolId)

  if (deactivateError) return { error: deactivateError.message }

  const { error: activateError } = await db
    .from('school_years')
    .update({ is_active: true })
    .eq('id', schoolYearId)
    .eq('school_id', base.schoolId)

  if (activateError) return { error: activateError.message }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function setActiveTerm(termId: string) {
  const base = await getActionContext()
  if ('error' in base) return base

  const denied = denyUnless(base.role, 'school-calendar')
  if (denied) return denied

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = base.supabase as any

  const { data: termRaw } = await db
    .from('terms')
    .select('school_year_id')
    .eq('id', termId)
    .eq('school_id', base.schoolId)
    .limit(1)

  const term = (termRaw as Array<{ school_year_id: string }> | null)?.[0]
  if (!term) return { error: 'Période introuvable.' }

  const { error: deactivateError } = await db
    .from('terms')
    .update({ is_active: false })
    .eq('school_id', base.schoolId)
    .eq('school_year_id', term.school_year_id)

  if (deactivateError) return { error: deactivateError.message }

  const { error: activateError } = await db
    .from('terms')
    .update({ is_active: true })
    .eq('id', termId)
    .eq('school_id', base.schoolId)

  if (activateError) return { error: activateError.message }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function createSchoolYear(data: { name: string; startDate: string; endDate: string }) {
  const base = await getActionContext()
  if ('error' in base) return base

  const denied = denyUnless(base.role, 'school-calendar')
  if (denied) return denied

  if (!data.name.trim()) return { error: 'Le libellé de l\'année est requis.' }

  const parsed = parseSchoolYearDates(data.name)
  const startDate = data.startDate || parsed.start_date
  const endDate = data.endDate || parsed.end_date

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inserted, error } = await (base.supabase as any)
    .from('school_years')
    .insert({
      school_id: base.schoolId,
      name: data.name.trim(),
      start_date: startDate,
      end_date: endDate,
      is_active: false,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  const { data: schoolRaw } = await base.supabase
    .from('schools')
    .select('academic_format')
    .eq('id', base.schoolId)
    .limit(1)

  const academicFormat = (schoolRaw as Array<{ academic_format: string }> | null)?.[0]?.academic_format ?? 'trimestre'
  const termCount = academicFormat === 'semestre' ? 2 : academicFormat === 'annuel' ? 1 : 3
  const termType = academicFormat === 'semestre' ? 'semestre' : academicFormat === 'annuel' ? 'annuel' : 'trimestre'

  const startYear = new Date(startDate).getFullYear()
  const endYear = new Date(endDate).getFullYear()
  const totalMonths = (endYear - startYear) * 12
  const monthsPerTerm = Math.max(1, Math.floor(totalMonths / termCount))

  for (let i = 0; i < termCount; i++) {
    const termStart = new Date(startDate)
    termStart.setMonth(termStart.getMonth() + i * monthsPerTerm)
    const termEnd = new Date(termStart)
    termEnd.setMonth(termEnd.getMonth() + monthsPerTerm)
    if (i === termCount - 1) termEnd.setTime(new Date(endDate).getTime())

    const label =
      termType === 'semestre'
        ? `Semestre ${i + 1}`
        : termType === 'annuel'
          ? 'Année scolaire'
          : `Trimestre ${i + 1}`

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (base.supabase as any).from('terms').insert({
      school_id: base.schoolId,
      school_year_id: inserted.id,
      name: label,
      type: termType,
      start_date: termStart.toISOString().slice(0, 10),
      end_date: termEnd.toISOString().slice(0, 10),
      is_active: i === 0,
    })
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function updateOrganization(data: { name: string; logoUrl?: string }) {
  const base = await getActionContext()
  if ('error' in base) return base

  const denied = denyUnless(base.role, 'organization')
  if (denied) return denied

  if (!data.name.trim()) return { error: 'Le nom de l\'organisation est requis.' }

  const { data: schoolRaw } = await base.supabase
    .from('schools')
    .select('organization_id')
    .eq('id', base.schoolId)
    .limit(1)

  const organizationId = (schoolRaw as Array<{ organization_id: string | null }> | null)?.[0]?.organization_id
  if (!organizationId) return { error: 'Organisation introuvable.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (base.supabase as any)
    .from('organizations')
    .update({
      name: data.name.trim(),
      logo_url: data.logoUrl?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', organizationId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function toggleSchoolActive(isActive: boolean) {
  const base = await getActionContext()
  if ('error' in base) return base

  const denied = denyUnless(base.role, 'school-identity')
  if (denied) return denied

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (base.supabase as any)
    .from('schools')
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', base.schoolId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
  return { success: true }
}
