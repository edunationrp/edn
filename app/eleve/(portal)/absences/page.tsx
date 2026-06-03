import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getStudentEnrollmentContext } from '@/lib/eleve/student-context'
import { getStudentAbsencePageData } from '@/lib/eleve/student-attendance'
import { StudentAbsencesView } from '@/features/eleve/student-absences-view'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mes absences — EduNation' }

export default async function EleveAbsencesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/eleve')

  const ctx = await getStudentEnrollmentContext(user.id)
  if (!ctx) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <h1 className="text-lg font-bold text-gray-900">Mes absences & retards</h1>
          <p className="mt-2 text-sm text-slate-600">
            Aucune inscription active. Contacte le secrétariat de ton établissement.
          </p>
        </div>
      </div>
    )
  }

  const { data: studentRaw } = await supabase
    .from('students')
    .select('first_name, last_name')
    .eq('id', ctx.studentId)
    .single()

  const student = studentRaw as { first_name: string; last_name: string } | null
  const studentName = student
    ? `${student.first_name} ${student.last_name}`.trim()
    : 'Élève'

  const { data: schoolRaw } = await supabase
    .from('schools')
    .select('name, logo_url')
    .eq('id', ctx.schoolId)
    .single()

  const school = schoolRaw as { name: string; logo_url: string | null } | null
  const schoolName = school?.name ?? 'Établissement'
  const schoolLogoUrl = school?.logo_url ?? null

  const { records, alertConfig } = await getStudentAbsencePageData(
    ctx.studentId,
    ctx.schoolId,
    ctx.schoolYearId,
    ctx.className,
  )

  return (
    <StudentAbsencesView
      records={records}
      alertConfig={alertConfig}
      className={ctx.className}
      studentName={studentName}
      schoolName={schoolName}
      schoolLogoUrl={schoolLogoUrl}
    />
  )
}
