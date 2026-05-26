import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { excludeMessagingNotificationTypes } from '@/lib/notifications/categories'
import { getEffectiveUserRole, isPlatformAdmin } from '@/lib/platform/access'
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
    .select('id, full_name, email, avatar_url, default_role, is_active')
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
    }> | null
  )?.[0]

  if (!profile) redirect('/login')

  const { data: schoolRolesRaw } = await supabase
    .from('user_school_roles')
    .select('role_code, school_id')
    .eq('user_id', user.id)
    .eq('is_active', true)

  const schoolRoles = schoolRolesRaw as Array<{ role_code: string; school_id: string }> | null
  const schoolIds = [...new Set(schoolRoles?.map(r => r.school_id) ?? [])]

  const { data: schoolsRaw } =
    schoolIds.length > 0
      ? await supabase.from('schools').select('id, name, type, city, is_active').in('id', schoolIds)
      : { data: [] }

  const schools = (schoolsRaw ?? []) as Array<{
    id: string
    name: string
    type: string
    city: string | null
    is_active: boolean
  }>

  const activeSchool = schools[0] ?? null
  const effectiveRole = await getEffectiveUserRole(user.id)
  const isPlatformOwner = isPlatformAdmin(effectiveRole)
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

  return (
    <DashboardShell
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
