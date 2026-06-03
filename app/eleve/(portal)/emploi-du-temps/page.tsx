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

  const { data: profileRaw } = await supabase
    .from('students')
    .select('first_name, last_name')
    .eq('user_id', user.id)
    .single()

  const profile = profileRaw as { first_name: string; last_name: string } | null
  const studentName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : 'Élève'

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

  const subjectCount = new Set(slots.map(s => s.subjectId)).size

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5">
        <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Emploi du temps</h1>
        <p className="mt-1.5 text-sm font-medium leading-relaxed text-slate-700">
          Emploi du temps de <span className="font-semibold text-gray-900">{ctx.className}</span>
          {' '}— consultation seule. Touchez ou cliquez sur un cours pour voir le détail.
        </p>
        {slots.length > 0 ? (
          <p className="mt-2 text-xs text-slate-500">
            {slots.length} créneau{slots.length !== 1 ? 'x' : ''} cette semaine
            {subjectCount > 0 && ` · ${subjectCount} matière${subjectCount !== 1 ? 's' : ''}`}
            {schoolYear?.name ? ` · ${schoolYear.name}` : ''}
          </p>
        ) : (
          <p className="mt-2 text-xs text-slate-500">
            Aucun créneau publié pour ta classe pour le moment.
          </p>
        )}
      </div>
      <StudentTimetableView
        className={ctx.className}
        studentName={studentName}
        schoolYearName={schoolYear?.name ?? null}
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
