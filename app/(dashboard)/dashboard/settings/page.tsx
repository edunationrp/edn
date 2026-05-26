import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/dashboard/page-header'
import { SettingsClient } from '@/features/settings/settings-client'
import { ROLE_LABELS } from '@/types/roles'
import type { UserRole } from '@/types/roles'
import type { Metadata } from 'next'
import { getVisibleSections } from '@/lib/settings/permissions'
import { mergeUserPreferences } from '@/lib/settings/defaults'
import { excludeMessagingNotificationTypes } from '@/lib/notifications/categories'
import type {
  OrganizationRow,
  SchoolSettingsData,
  SchoolYearRow,
  SettingsOverviewStats,
  SettingsPagePayload,
  TermRow,
} from '@/lib/settings/types'

export const metadata: Metadata = {
  title: 'Paramètres — EduNation',
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  if (!ctx?.school_id) redirect('/dashboard')

  const roleCode = ctx.role_code as UserRole
  const sections = getVisibleSections(roleCode)
  const schoolId = ctx.school_id

  const [
    profileResult,
    schoolResult,
    yearsResult,
    termsResult,
    orgResult,
    parentResult,
    studentsCount,
    staffCount,
    classesCount,
    unreadNotifs,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, email, phone, country, preferred_language, avatar_url, preferences')
      .eq('id', user.id)
      .limit(1),
    supabase
      .from('schools')
      .select(`
        id, name, structure_name, type, address, city, province, country,
        phone, email, logo_url, motto, currency, evaluation_system,
        main_language, access_level, academic_format, estimated_students,
        is_active, organization_id
      `)
      .eq('id', schoolId)
      .limit(1),
    supabase
      .from('school_years')
      .select('id, name, start_date, end_date, is_active')
      .eq('school_id', schoolId)
      .order('start_date', { ascending: false }),
    supabase
      .from('terms')
      .select('id, name, type, start_date, end_date, is_active, school_year_id')
      .eq('school_id', schoolId)
      .order('start_date'),
    supabase
      .from('schools')
      .select('organization_id')
      .eq('id', schoolId)
      .limit(1)
      .then(async ({ data }) => {
        const orgId = (data as Array<{ organization_id: string | null }> | null)?.[0]?.organization_id
        if (!orgId) return { data: null }
        return supabase
          .from('organizations')
          .select('id, name, logo_url, plan_code, max_schools')
          .eq('id', orgId)
          .limit(1)
      }),
    (roleCode === 'PARENT' || roleCode === 'PARENT_ILLETRE')
      ? supabase
          .from('parent_profiles')
          .select('preferred_language, literacy_level')
          .eq('user_id', user.id)
          .limit(1)
      : Promise.resolve({ data: null }),
    supabase.from('students').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
    supabase
      .from('user_school_roles')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .eq('is_active', true),
    supabase.from('classes').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
    excludeMessagingNotificationTypes(
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
    ),
  ])

  const profile = (profileResult.data as Array<{
    full_name: string | null
    email: string | null
    phone: string | null
    country: string | null
    preferred_language: string | null
    avatar_url: string | null
    preferences: unknown
  }> | null)?.[0]

  const schoolRaw = (schoolResult.data as SchoolSettingsData[] | null)?.[0] ?? null
  const schoolYears = (yearsResult.data as SchoolYearRow[] | null) ?? []
  const terms = (termsResult.data as TermRow[] | null) ?? []
  const organization = (orgResult.data as OrganizationRow[] | null)?.[0] ?? null

  const parentRow = (parentResult.data as Array<{
    preferred_language: string
    literacy_level: string
  }> | null)?.[0]

  const canSeeOverview = sections.some(s => s.id === 'overview')
  const stats: SettingsOverviewStats | null = canSeeOverview
    ? {
        students: studentsCount.count ?? 0,
        staff: staffCount.count ?? 0,
        classes: classesCount.count ?? 0,
        unreadNotifications: unreadNotifs.count ?? 0,
      }
    : null

  const preferences = mergeUserPreferences(profile?.preferences)
  if (roleCode === 'PARENT_ILLETRE' && preferences.parent) {
    preferences.parent.simplified_interface = true
  }

  const payload: SettingsPagePayload = {
    role: roleCode,
    roleLabel: ROLE_LABELS[roleCode] ?? roleCode,
    schoolId,
    schoolName: schoolRaw?.name ?? 'Mon établissement',
    profile: {
      fullName: profile?.full_name ?? user.email ?? '',
      email: profile?.email ?? user.email ?? '',
      phone: profile?.phone ?? '',
      country: profile?.country ?? 'Burkina Faso',
      preferredLanguage: profile?.preferred_language ?? 'fr',
      avatarUrl: profile?.avatar_url ?? null,
    },
    preferences,
    school: schoolRaw,
    schoolYears,
    terms,
    organization,
    parentProfile: parentRow
      ? {
          preferredLanguage: parentRow.preferred_language,
          literacyLevel: parentRow.literacy_level,
        }
      : null,
    stats,
    sections: sections.map(s => ({ id: s.id, access: s.access })),
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title="Paramètres"
        description="Profil, établissement, alertes et préférences selon votre rôle"
      />
      <SettingsClient data={payload} />
    </div>
  )
}
