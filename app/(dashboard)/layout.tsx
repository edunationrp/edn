import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/layout/dashboard-shell'

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
  const currentRole = schoolRoles?.[0]?.role_code ?? profile.default_role ?? 'ELEVE'

  const { data: schoolYearRaw } = activeSchool
    ? await supabase
        .from('school_years')
        .select('id, name')
        .eq('school_id', activeSchool.id)
        .eq('is_active', true)
        .limit(1)
    : { data: [] }

  const schoolYear = (schoolYearRaw as Array<{ id: string; name: string }> | null)?.[0]

  const { count: unreadMessages } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', user.id)
    .eq('is_read', false)

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
        schoolName: activeSchool?.name ?? 'Mon établissement',
        schoolYear: schoolYear?.name ?? '2025 — 2026',
        userName: fullName,
        userInitials: initials,
        userTitle: currentRole.toLowerCase().replace(/_/g, ' '),
      }}
      topbar={{
        userName: fullName,
        userTitle: currentRole.replace(/_/g, ' '),
        userInitials: initials,
        schoolName: activeSchool?.name ?? 'EduNation',
        schoolYear: schoolYear?.name ?? '2025-2026',
        unreadMessages: unreadMessages ?? 0,
      }}
    >
      {children}
    </DashboardShell>
  )
}
