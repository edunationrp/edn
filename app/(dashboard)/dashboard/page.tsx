import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { DirecteurDashboard } from '@/features/dashboard/directeur-dashboard'
import { ProfesseurDashboard } from '@/features/dashboard/professeur-dashboard'
import { ParentDashboard } from '@/features/dashboard/parent-dashboard'
import { IntendantDashboard } from '@/features/dashboard/intendant-dashboard'
import { EleveDashboard } from '@/features/dashboard/eleve-dashboard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tableau de bord — EduNation',
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('id, full_name, default_role, is_active')
    .eq('id', user.id)
    .limit(1)

  const profile = (profileRaw as Array<{
    id: string; full_name: string | null; default_role: string | null; is_active: boolean
  }> | null)?.[0]
  if (!profile) redirect('/login')

  const schoolContext = await getUserSchoolContext(user.id)
  const currentRole = schoolContext?.role_code ?? profile.default_role ?? 'ELEVE'
  const schoolId = schoolContext?.school_id
  const firstName = profile.full_name?.split(' ')[0] ?? 'là'

  const greetingName = firstName.startsWith('M.') || firstName.startsWith('Mme')
    ? profile.full_name?.split(' ').slice(0, 2).join(' ') ?? firstName
    : firstName

  switch (currentRole) {
    case 'PROVISEUR':
    case 'DIRECTEUR_ADJOINT':
    case 'FONDATEUR':
    case 'CENSEUR':
    case 'CONSEILLER_EDUCATION':
    case 'SECRETAIRE':
    case 'SURVEILLANT_GENERAL':
    case 'SUPER_ADMIN_EDUNATION':
      return (
        <DirecteurDashboard
          schoolId={schoolId}
          userId={user.id}
          userName={greetingName}
        />
      )

    case 'PROFESSEUR':
      return (
        <ProfesseurDashboard
          schoolId={schoolId}
          userId={user.id}
          userName={greetingName}
        />
      )

    case 'INTENDANT':
      return (
        <IntendantDashboard
          schoolId={schoolId}
          userId={user.id}
          userName={greetingName}
        />
      )

    case 'PARENT':
    case 'PARENT_ILLETRE':
      return (
        <ParentDashboard
          schoolId={schoolId}
          userId={user.id}
          userName={greetingName}
        />
      )

    case 'ELEVE':
      return (
        <EleveDashboard
          schoolId={schoolId}
          userId={user.id}
          userName={greetingName}
        />
      )

    default:
      return (
        <EleveDashboard
          schoolId={schoolId}
          userId={user.id}
          userName={greetingName}
        />
      )
  }
}
