import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fetchPublishedStudentGrades } from '@/lib/grades/published-notes'
import { fetchClassAverageHintsForStudent } from '@/lib/grades/class-average-hints'
import { StudentPublishedNotesView } from '@/features/grades/student-published-notes-view'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mes notes — EduNation' }

export default async function EleveNotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/eleve')

  const { data: studentRaw } = await supabase
    .from('students')
    .select(`
      id, first_name, last_name, school_id,
      student_enrollments(classes(name), school_years(is_active))
    `)
    .eq('user_id', user.id)
    .single()

  const student = studentRaw as {
    id: string
    first_name: string
    last_name: string
    school_id: string
    student_enrollments: Array<{
      classes: { name: string } | null
      school_years: { is_active: boolean } | null
    }>
  } | null
  if (!student) redirect('/login/eleve')

  const activeEnrollment = student.student_enrollments?.find(e => e.school_years?.is_active)
  const className = activeEnrollment?.classes?.name ?? null
  const studentName = `${student.first_name} ${student.last_name}`.trim()

  const { data: schoolRaw } = await supabase
    .from('schools')
    .select('name')
    .eq('id', student.school_id)
    .single()

  const schoolName = (schoolRaw as { name: string } | null)?.name ?? 'Établissement'

  const [terms, classAverageHints] = await Promise.all([
    fetchPublishedStudentGrades(supabase, student.id),
    fetchClassAverageHintsForStudent(student.id),
  ])

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5">
        <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Mes notes</h1>
        <p className="mt-1.5 text-sm font-medium leading-relaxed text-slate-700">
          Consulte d&apos;abord toutes tes notes par trimestre (tableau récapitulatif), puis le détail
          par matière. L&apos;export PDF est disponible une fois tes notes affichées.
        </p>
      </div>

      <StudentPublishedNotesView
        terms={terms}
        enableGoalPlanner
        classAverageHints={classAverageHints}
        studentName={studentName}
        schoolName={schoolName}
        className={className}
      />
    </div>
  )
}
