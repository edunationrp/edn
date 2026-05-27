import { createClient } from '@/lib/supabase/server'
import { getUserSchoolContext } from '@/lib/supabase/helpers'
import { redirect } from 'next/navigation'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { PageHeader } from '@/components/dashboard/page-header'
import { EmptyPanel } from '@/components/dashboard/empty-panel'
import { getTeacherDashboardData } from '@/lib/dashboard/teacher-dashboard-data'
import { Calendar, Clock } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mon emploi du temps — EduNation',
}

export default async function TimetablePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getUserSchoolContext(user.id)
  const schoolId = ctx?.school_id
  const role = ctx?.role_code

  if (role !== 'PROFESSEUR' && role !== 'ELEVE') {
    redirect('/dashboard/classes')
  }

  const today = new Date()
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const todayLabel = dayNames[today.getDay()]

  if (role === 'PROFESSEUR' && schoolId) {
    const { assignments } = await getTeacherDashboardData(schoolId, user.id)

    return (
      <DashboardPage>
        <PageHeader
          title="Mon emploi du temps"
          description={`${todayLabel} · Vos cours assignés`}
        />

        {assignments.length === 0 ? (
          <EmptyPanel
            title="Aucun cours assigné"
            description="Vos créneaux apparaîtront ici dès que la direction vous aura affecté des classes."
          />
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <div className="flex items-center gap-2 font-medium text-slate-800">
                <Clock className="h-4 w-4" />
                Emploi du temps détaillé — bientôt disponible
              </div>
              <p className="mt-1 text-xs text-slate-500">
                En attendant, voici vos affectations classes / matières pour organiser votre semaine.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {assignments.map(item => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1B3A6B]/10 text-[#1B3A6B]">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900">{item.className}</p>
                      <p className="text-sm text-[#1B3A6B]">{item.subjectName}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {item.studentCount} élève{item.studentCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Consultez aussi{' '}
              <Link href="/dashboard/classes" className="font-semibold text-[#1B3A6B] hover:underline">
                Mes classes
              </Link>{' '}
              pour le détail de vos groupes.
            </p>
          </div>
        )}
      </DashboardPage>
    )
  }

  return (
    <DashboardPage>
      <PageHeader title="Mon emploi du temps" description={todayLabel} />
      <EmptyPanel
        title="Emploi du temps"
        description="Votre planning sera affiché ici prochainement."
      />
    </DashboardPage>
  )
}
