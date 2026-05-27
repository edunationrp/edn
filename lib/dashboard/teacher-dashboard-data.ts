import { createClient } from '@/lib/supabase/server'

export type TeacherDashboardAssignment = {
  id: string
  classId: string
  subjectId: string
  className: string
  subjectName: string
  studentCount: number
}

export type TeacherDashboardData = {
  assignments: TeacherDashboardAssignment[]
  totalStudents: number
  classCount: number
}

export async function getTeacherDashboardData(
  schoolId: string,
  userId: string,
): Promise<TeacherDashboardData> {
  const supabase = await createClient()

  const { data: assignmentsRaw } = await supabase
    .from('teacher_assignments')
    .select('id, class_id, subject_id, classes(name), subjects(name)')
    .eq('teacher_id', userId)
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .order('class_id')

  const assignments = ((assignmentsRaw ?? []) as Array<{
    id: string
    class_id: string | null
    subject_id: string | null
    classes: { name: string } | { name: string }[] | null
    subjects: { name: string } | { name: string }[] | null
  }>)
    .filter(row => row.class_id && row.subject_id)
    .map(row => {
      const classRow = Array.isArray(row.classes) ? row.classes[0] : row.classes
      const subjectRow = Array.isArray(row.subjects) ? row.subjects[0] : row.subjects
      return {
        id: row.id,
        classId: row.class_id!,
        subjectId: row.subject_id!,
        className: classRow?.name ?? 'Classe',
        subjectName: subjectRow?.name ?? 'Matière',
        studentCount: 0,
      }
    })

  const classIds = [...new Set(assignments.map(row => row.classId))]
  const enrollmentsByClass = new Map<string, number>()

  if (classIds.length > 0) {
    const { data: yearRaw } = await supabase
      .from('school_years')
      .select('id')
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .limit(1)

    const schoolYearId = (yearRaw as Array<{ id: string }> | null)?.[0]?.id

    if (schoolYearId) {
      const { data: enrollmentsRaw } = await supabase
        .from('student_enrollments')
        .select('class_id')
        .eq('school_id', schoolId)
        .eq('school_year_id', schoolYearId)
        .eq('status', 'active')
        .in('class_id', classIds)

      for (const row of (enrollmentsRaw ?? []) as Array<{ class_id: string }>) {
        enrollmentsByClass.set(row.class_id, (enrollmentsByClass.get(row.class_id) ?? 0) + 1)
      }
    }
  }

  const assignmentsWithCounts = assignments.map(row => ({
    ...row,
    studentCount: enrollmentsByClass.get(row.classId) ?? 0,
  }))

  let totalStudents = 0
  for (const classId of classIds) {
    totalStudents += enrollmentsByClass.get(classId) ?? 0
  }

  return {
    assignments: assignmentsWithCounts,
    totalStudents,
    classCount: assignmentsWithCounts.length,
  }
}
