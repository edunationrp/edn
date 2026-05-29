import { createClient } from '@/lib/supabase/server'
import { getStudentEnrollmentContext } from '@/lib/eleve/student-context'
import { getStudentCourseResources } from '@/lib/eleve/get-student-course-resources'

export type StudentTutorContext = {
  userId: string
  studentId: string
  schoolId: string
  firstName: string
  className: string
  schoolName: string
  subjects: string[]
  recentGrades: Array<{ subject: string; value: number; maxValue: number }>
  isAuthenticated: true
}

export async function getStudentTutorContext(userId: string): Promise<StudentTutorContext | null> {
  const supabase = await createClient()
  const enrollment = await getStudentEnrollmentContext(userId)
  if (!enrollment) return null

  const { data: studentRaw } = await supabase
    .from('students')
    .select('id, first_name, school_id, schools(name)')
    .eq('user_id', userId)
    .single()

  const student = studentRaw as {
    id: string
    first_name: string
    school_id: string
    schools: { name: string } | null
  } | null

  if (!student) return null

  const resources = await getStudentCourseResources(
    enrollment.classId,
    enrollment.schoolYearId,
  )
  const subjectSet = new Set(resources.map(r => r.subjectName))

  const { data: gradesRaw } = await supabase
    .from('grades')
    .select('value, max_value, subjects(name)')
    .eq('student_id', student.id)
    .eq('school_year_id', enrollment.schoolYearId)
    .order('created_at', { ascending: false })
    .limit(8)

  const grades = (gradesRaw ?? []) as Array<{
    value: number
    max_value: number
    subjects: { name: string } | null
  }>

  for (const g of grades) {
    const name = g.subjects?.name
    if (name) subjectSet.add(name)
  }

  return {
    userId,
    studentId: student.id,
    schoolId: student.school_id,
    firstName: student.first_name,
    className: enrollment.className,
    schoolName: student.schools?.name ?? 'ton établissement',
    subjects: [...subjectSet].sort((a, b) => a.localeCompare(b, 'fr')),
    recentGrades: grades.map(g => ({
      subject: g.subjects?.name ?? 'Matière',
      value: g.value,
      maxValue: g.max_value,
    })),
    isAuthenticated: true,
  }
}
