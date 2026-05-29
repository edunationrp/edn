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

  const [slots, breaks, schoolRaw, schoolYearRaw] = await Promise.all([
    getClassTimetableSlots(ctx.schoolId, ctx.schoolYearId, ctx.classId),
    getTimetableBreaks(ctx.schoolId, ctx.schoolYearId),
    supabase
      .from('schools')
      .select('name, logo_url, logo_watermark_opacity')
      .eq('id', ctx.schoolId)
      .single(),
    supabase
      .from('school_years')
      .select('name')
      .eq('id', ctx.schoolYearId)
      .single(),
  ])

  const school = schoolRaw.data as {
    name: string
    logo_url: string | null
    logo_watermark_opacity: number | null
  } | null

  const schoolYear = schoolYearRaw.data as { name: string } | null

  return (
    <div className="w-full min-w-0 space-y-4">
      <div>
        <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Emploi du temps</h1>
      </div>
      <StudentTimetableView
        className={ctx.className}
        slots={slots}
        breaks={breaks}
        schoolName={school?.name ?? 'Mon établissement'}
        schoolLogoUrl={school?.logo_url}
        schoolWatermarkOpacity={school?.logo_watermark_opacity}
        meta={{
          schoolYearName: schoolYear?.name ?? 'Année scolaire',
          className: ctx.className,
          trackName: '—',
          termName: '—',
          mainTeacherName: '—',
          lastModified: new Date().toLocaleDateString('fr-FR'),
        }}
      />
    </div>
  )
}
