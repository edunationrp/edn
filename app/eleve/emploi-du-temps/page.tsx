import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StudentTimetableView } from '@/features/eleve/student-timetable-view'
import { getStudentEnrollmentContext } from '@/lib/eleve/student-context'
import { getClassTimetableSlots, getTimetableBreaks } from '@/lib/timetable/data'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Emploi du temps — EduNation' }

export const dynamic = 'force-dynamic'

export default async function EleveEmploiDuTempsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/eleve')

  const ctx = await getStudentEnrollmentContext(user.id)
  if (!ctx) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-bold text-gray-900">Emploi du temps</h1>
        <p className="text-sm text-muted-foreground">
          Aucune inscription active trouvée. Contactez le secrétariat de votre établissement.
        </p>
      </div>
    )
  }

  const [slots, breaks] = await Promise.all([
    getClassTimetableSlots(ctx.schoolId, ctx.schoolYearId, ctx.classId),
    getTimetableBreaks(ctx.schoolId, ctx.schoolYearId),
  ])

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Emploi du temps</h1>
      <StudentTimetableView
        className={ctx.className}
        slots={slots}
        breaks={breaks}
      />
    </div>
  )
}
