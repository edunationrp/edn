import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { excludeMessagingNotificationTypes } from '@/lib/notifications/categories'
import { getEffectiveUserRole, isPlatformAdmin, isPlatformOwnerRole } from '@/lib/platform/access'
import { ROLE_LABELS } from '@/types/roles'
import type { UserRole } from '@/types/roles'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url, default_role, is_active, account_status, suspended_until')
    .eq('id', user.id)
    .limit(1)

  const profile = (
    profileRaw as Array<{
      id: string
      full_name: string | null
      email: string | null
      avatar_url: string | null
      default_role: string | null
      is_active: boolean
      account_status?: 'ACTIVE' | 'SUSPENDED_TOTAL' | 'SUSPENDED_TEMPORARY' | null
      suspended_until?: string | null
    }> | null
  )?.[0]

  if (!profile) redirect('/login')

  const accountStatus = profile.account_status ?? 'ACTIVE'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileOperationalRaw } = await (supabase as any).rpc('is_profile_operational', {
    p_user_id: user.id,
  })
  const profileOperational = Boolean(profileOperationalRaw)

  if (!profile.is_active || accountStatus === 'SUSPENDED_TOTAL' || !profileOperational) {
    redirect('/suspended')
  }

  const { data: schoolRolesRaw } = await supabase
    .from('user_school_roles')
    .select('role_code, school_id')
    .eq('user_id', user.id)
    .eq('is_active', true)

  const schoolRoles = schoolRolesRaw as Array<{ role_code: string; school_id: string }> | null
  const schoolIds = [...new Set(schoolRoles?.map(r => r.school_id) ?? [])]

  const { data: schoolsRaw } =
    schoolIds.length > 0
      ? await supabase
          .from('schools')
          .select('id, name, type, city, is_active, logo_url, logo_watermark_opacity')
          .in('id', schoolIds)
      : { data: [] }

  const schools = (schoolsRaw ?? []) as Array<{
    id: string
    name: string
    type: string
    city: string | null
    is_active: boolean
    logo_url: string | null
    logo_watermark_opacity: number | null
  }>

  const roleRows = schoolRoles ?? []
  const schoolsById = new Map(schools.map(s => [s.id, s] as const))
  const firstOperationalRole = roleRows.find(r => {
    const school = schoolsById.get(r.school_id)
    return Boolean(school?.is_active)
  })
  const activeSchool = firstOperationalRole ? (schoolsById.get(firstOperationalRole.school_id) ?? null) : null
  const effectiveRole = await getEffectiveUserRole(user.id)
  const isPlatformOwner = isPlatformAdmin(effectiveRole)
  const defaultIsPlatformOwner = isPlatformOwnerRole(profile.default_role)
  if (!isPlatformOwner && !activeSchool && !defaultIsPlatformOwner) {
    redirect('/suspended')
  }
  const currentRole = (effectiveRole ?? profile.default_role ?? 'ELEVE') as UserRole
  const roleLabel = ROLE_LABELS[currentRole] ?? currentRole

  const displaySchoolName = isPlatformOwner
    ? 'EduNation — Administration plateforme'
    : (activeSchool?.name ?? 'Mon établissement')

  const displaySchoolYear = isPlatformOwner
    ? 'SaaS multi-établissements'
    : undefined

  const { data: schoolYearRaw } = activeSchool && !isPlatformOwner
    ? await supabase
        .from('school_years')
        .select('id, name')
        .eq('school_id', activeSchool.id)
        .eq('is_active', true)
        .limit(1)
    : { data: [] }

  const schoolYear = (schoolYearRaw as Array<{ id: string; name: string }> | null)?.[0]
  const schoolYearLabel = displaySchoolYear ?? schoolYear?.name ?? '2025 — 2026'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: chatUnreadRaw } = await (supabase as any).rpc('get_my_unread_chat_count')
  const unreadMessages =
    typeof chatUnreadRaw === 'number'
      ? chatUnreadRaw
      : (
          await supabase
            .from('message_recipients')
            .select('id', { count: 'exact', head: true })
            .eq('recipient_id', user.id)
            .is('read_at', null)
        ).count ?? 0

  const { count: unreadNotifications } = await excludeMessagingNotificationTypes(
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
  )

  const fullName = profile.full_name ?? user.email ?? 'Utilisateur'
  const initials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const schoolLogoUrl = isPlatformOwner ? null : (activeSchool?.logo_url ?? null)
  const schoolWatermarkOpacity = isPlatformOwner
    ? null
    : (activeSchool?.logo_watermark_opacity ?? null)

  return (
    <DashboardShell
      schoolLogoUrl={schoolLogoUrl}
      schoolWatermarkOpacity={schoolWatermarkOpacity}
      sidebar={{
        userRole: currentRole,
        schoolName: displaySchoolName,
        schoolYear: schoolYearLabel,
        userName: fullName,
        userInitials: initials,
        userTitle: roleLabel,
      }}
      topbar={{
        userName: fullName,
        userTitle: roleLabel,
        userRole: currentRole,
        userInitials: initials,
        userId: user.id,
        schoolName: displaySchoolName,
        schoolYear: schoolYearLabel,
        unreadMessages: unreadMessages ?? 0,
        unreadNotifications: unreadNotifications ?? 0,
      }}
    >
      {children}
    </DashboardShell>
  )
}
