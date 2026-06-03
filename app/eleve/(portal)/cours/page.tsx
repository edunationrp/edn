import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getStudentEnrollmentContext } from '@/lib/eleve/student-context'
import { getStudentCourseResources } from '@/lib/eleve/get-student-course-resources'
import { StudentCoursesView } from '@/features/eleve/student-courses-view'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Cours & ressources — EduNation' }
export const dynamic = 'force-dynamic'

export default async function EleveCoursPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/eleve')

  const ctx = await getStudentEnrollmentContext(user.id)
  if (!ctx) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-bold text-gray-900">Cours & ressources</h1>
        <p className="text-sm text-muted-foreground">
          Aucune inscription active trouvée. Contactez le secrétariat de votre établissement.
        </p>
      </div>
    )
  }

  const resources = await getStudentCourseResources(ctx.classId, ctx.schoolYearId)

  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600">
          Chargement des ressources…
        </div>
      }
    >
      <StudentCoursesView className={ctx.className} resources={resources} />
    </Suspense>
  )
}
