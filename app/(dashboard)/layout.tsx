import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Profil utilisateur
  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url, default_role, is_active')
    .eq('id', user.id)
    .limit(1)

  const profile = (profileRaw as Array<{
    id: string
    full_name: string | null
    email: string | null
    avatar_url: string | null
    default_role: string | null
    is_active: boolean
  }> | null)?.[0]

  if (!profile) redirect('/login')

  // Rôles & établissements
  const { data: schoolRolesRaw } = await supabase
    .from('user_school_roles')
    .select('role_code, school_id')
    .eq('user_id', user.id)
    .eq('is_active', true)

  const schoolRoles = schoolRolesRaw as Array<{ role_code: string; school_id: string }> | null
  const schoolIds = [...new Set(schoolRoles?.map(r => r.school_id) ?? [])]

  const { data: schoolsRaw } = schoolIds.length > 0
    ? await supabase
        .from('schools')
        .select('id, name, type, city, is_active')
        .in('id', schoolIds)
    : { data: [] }

  const schools = (schoolsRaw ?? []) as Array<{
    id: string; name: string; type: string; city: string | null; is_active: boolean
  }>

  const activeSchool = schools[0] ?? null
  const currentRole = schoolRoles?.[0]?.role_code ?? profile.default_role ?? 'ELEVE'

  // Année scolaire active
  const { data: schoolYearRaw } = activeSchool
    ? await supabase
        .from('school_years')
        .select('id, name')
        .eq('school_id', activeSchool.id)
        .eq('is_active', true)
        .limit(1)
    : { data: [] }

  const schoolYear = (schoolYearRaw as Array<{ id: string; name: string }> | null)?.[0]

  // Messages non lus
  const { count: unreadMessages } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', user.id)
    .eq('is_read', false)

  // Construire le path actuel (pour activer le bon nav item)
  const headersList = await headers()
  const currentPath = headersList.get('x-pathname') ?? '/dashboard'

  // Initiales utilisateur
  const fullName = profile.full_name ?? user.email ?? 'Utilisateur'
  const initials = fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="flex min-h-screen bg-[#F5F7FA]">
      {/* Sidebar fixe */}
      <Sidebar
        currentPath={currentPath}
        userRole={currentRole}
        schoolName={activeSchool?.name ?? 'Mon établissement'}
        schoolYear={schoolYear?.name ?? '2025 — 2026'}
        userName={fullName}
        userInitials={initials}
        userTitle={currentRole.toLowerCase().replace(/_/g, ' ')}
      />

      {/* Zone principale (décalée par la sidebar fixe) */}
      <div className="ml-[240px] flex-1 flex flex-col min-h-screen">
        <Topbar
          userName={fullName}
          userTitle={currentRole.replace(/_/g, ' ')}
          userInitials={initials}
          schoolName={activeSchool?.name ?? 'EduNation'}
          schoolYear={schoolYear?.name ?? '2025-2026'}
          unreadMessages={unreadMessages ?? 0}
        />

        {/* Contenu scrollable sous le topbar fixe */}
        <main className="flex-1 mt-14 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
