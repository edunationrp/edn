import { createClient } from '@/lib/supabase/server'

export type StudentEnrollmentContext = {
  studentId: string
  schoolId: string
  classId: string
  className: string
  schoolYearId: string
}

export async function getStudentEnrollmentContext(
  userId: string,
): Promise<StudentEnrollmentContext | null> {
  const supabase = await createClient()

  const { data: studentRaw } = await supabase
    .from('students')
    .select(`
      id,
      school_id,
      student_enrollments(
        class_id,
        school_year_id,
        status,
        classes(name),
        school_years(is_active)
      )
    `)
    .eq('user_id', userId)
    .limit(1)

  const student = (studentRaw as Array<{
    id: string
    school_id: string
    student_enrollments: Array<{
      class_id: string
      school_year_id: string
      status: string
      classes: { name: string } | null
      school_years: { is_active: boolean } | null
    }> | null
  }> | null)?.[0]

  if (!student) return null

  const activeEnrollment = (student.student_enrollments ?? []).find(
    e => e.school_years?.is_active && e.status === 'active',
  )

  if (!activeEnrollment?.class_id || !activeEnrollment.school_year_id) return null

  return {
    studentId: student.id,
    schoolId: student.school_id,
    classId: activeEnrollment.class_id,
    className: activeEnrollment.classes?.name ?? 'Ma classe',
    schoolYearId: activeEnrollment.school_year_id,
  }
}
