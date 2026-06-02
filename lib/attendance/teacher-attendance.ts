import { createClient } from '@/lib/supabase/server'
import { getTeacherAssignments } from '@/lib/classes/access'
import { getActiveSchoolYearId, getSchoolTimetableSlots } from '@/lib/timetable/data'

export type TeacherAssignmentOption = {
  id: string
  classId: string
  subjectId: string
  className: string
  subjectName: string
}

export type TeacherTodayCourse = {
  key: string
  classId: string
  subjectId: string
  className: string
  subjectName: string
  startTime: string | null
  endTime: string | null
  room: string | null
  source: 'timetable' | 'assignment'
  attendanceTaken: boolean
  attendancePartial: boolean
  enrolledCount: number
  recordedCount: number
}

export type TeacherAttendanceHistoryRow = {
  id: string
  status: string
  recorded_at: string
  studentName: string
  className: string
  subjectName: string
}

export type JustificationStatus = 'pending' | 'approved' | 'rejected'

function jsDateToTimetableDay(date: Date) {
  const day = date.getDay()
  return day === 0 ? 7 : day
}

function todayBounds() {
  const today = new Date().toISOString().split('T')[0]
  return { start: `${today}T00:00:00`, end: `${today}T23:59:59`, date: today }
}

export async function getTeacherAssignmentOptions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  schoolId: string,
): Promise<TeacherAssignmentOption[]> {
  const rows = await getTeacherAssignments(supabase, userId, schoolId)
  return rows
    .filter(row => row.classId && row.subjectId)
    .map(row => ({
      id: row.id,
      classId: row.classId!,
      subjectId: row.subjectId!,
      className: row.className,
      subjectName: row.subjectName,
    }))
}

export async function teacherCanAccessAssignment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  schoolId: string,
  classId: string,
  subjectId: string,
) {
  const { data } = await supabase
    .from('teacher_assignments')
    .select('id')
    .eq('teacher_id', userId)
    .eq('school_id', schoolId)
    .eq('class_id', classId)
    .eq('subject_id', subjectId)
    .eq('is_active', true)
    .limit(1)

  return (data?.length ?? 0) > 0
}

async function countEnrolledStudents(
  supabase: Awaited<ReturnType<typeof createClient>>,
  schoolId: string,
  schoolYearId: string,
  classId: string,
) {
  const { count } = await supabase
    .from('student_enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .eq('school_year_id', schoolYearId)
    .eq('class_id', classId)
    .eq('status', 'active')

  return count ?? 0
}

async function getRecordedAttendanceCounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  schoolId: string,
  teacherId: string,
  pairs: Array<{ classId: string; subjectId: string }>,
) {
  const { start, end } = todayBounds()
  const result = new Map<string, number>()

  await Promise.all(
    pairs.map(async pair => {
      const { count } = await supabase
        .from('attendance_records')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('class_id', pair.classId)
        .eq('subject_id', pair.subjectId)
        .eq('teacher_id', teacherId)
        .gte('recorded_at', start)
        .lte('recorded_at', end)

      result.set(`${pair.classId}:${pair.subjectId}`, count ?? 0)
    }),
  )

  return result
}

export async function getTeacherTodayCourses(
  schoolId: string,
  teacherId: string,
): Promise<TeacherTodayCourse[]> {
  const supabase = await createClient()
  const schoolYearId = await getActiveSchoolYearId(supabase, schoolId)
  if (!schoolYearId) return []

  const today = new Date()
  const dayOfWeek = jsDateToTimetableDay(today)

  const [slots, assignments] = await Promise.all([
    getSchoolTimetableSlots(schoolId, schoolYearId),
    getTeacherAssignmentOptions(supabase, teacherId, schoolId),
  ])

  const teacherSlots = slots.filter(
    slot => slot.teacherId === teacherId && slot.dayOfWeek === dayOfWeek,
  )

  const courseMap = new Map<string, Omit<TeacherTodayCourse, 'attendanceTaken' | 'attendancePartial' | 'enrolledCount' | 'recordedCount'>>()

  for (const slot of teacherSlots) {
    const key = `${slot.classId}:${slot.subjectId}`
    courseMap.set(key, {
      key,
      classId: slot.classId,
      subjectId: slot.subjectId,
      className: slot.className,
      subjectName: slot.subjectName,
      startTime: slot.startTime,
      endTime: slot.endTime,
      room: slot.room,
      source: 'timetable',
    })
  }

  if (courseMap.size === 0) {
    for (const assignment of assignments) {
      const key = `${assignment.classId}:${assignment.subjectId}`
      courseMap.set(key, {
        key,
        classId: assignment.classId,
        subjectId: assignment.subjectId,
        className: assignment.className,
        subjectName: assignment.subjectName,
        startTime: null,
        endTime: null,
        room: null,
        source: 'assignment',
      })
    }
  }

  const pairs = [...courseMap.values()].map(course => ({
    classId: course.classId,
    subjectId: course.subjectId,
  }))

  const [recordedCounts, enrolledCounts] = await Promise.all([
    getRecordedAttendanceCounts(supabase, schoolId, teacherId, pairs),
    Promise.all(
      pairs.map(pair => countEnrolledStudents(supabase, schoolId, schoolYearId, pair.classId)),
    ),
  ])

  return [...courseMap.values()].map((course, index) => {
    const enrolledCount = enrolledCounts[index] ?? 0
    const recordedCount = recordedCounts.get(course.key) ?? 0
    const attendanceTaken = enrolledCount > 0 && recordedCount >= enrolledCount
    const attendancePartial = recordedCount > 0 && recordedCount < enrolledCount

    return {
      ...course,
      enrolledCount,
      recordedCount,
      attendanceTaken,
      attendancePartial,
    }
  }).sort((a, b) => {
    if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime)
    if (a.startTime) return -1
    if (b.startTime) return 1
    return a.className.localeCompare(b.className)
  })
}

export async function getTeacherWeeklyAbsenceCount(
  schoolId: string,
  teacherId: string,
) {
  const supabase = await createClient()
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const { count } = await supabase
    .from('attendance_records')
    .select('id', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .eq('teacher_id', teacherId)
    .eq('status', 'absent')
    .gte('recorded_at', weekAgo.toISOString())

  return count ?? 0
}

export async function getTeacherAttendanceHistory(
  schoolId: string,
  teacherId: string,
  limit = 200,
): Promise<TeacherAttendanceHistoryRow[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('attendance_records')
    .select(`
      id,
      status,
      recorded_at,
      students(first_name, last_name),
      classes(name),
      subjects(name)
    `)
    .eq('school_id', schoolId)
    .eq('teacher_id', teacherId)
    .order('recorded_at', { ascending: false })
    .limit(limit)

  return ((data ?? []) as Array<{
    id: string
    status: string
    recorded_at: string
    students: { first_name: string; last_name: string } | null
    classes: { name: string } | null
    subjects: { name: string } | null
  }>).map(row => ({
    id: row.id,
    status: row.status,
    recorded_at: row.recorded_at,
    studentName: row.students
      ? `${row.students.last_name} ${row.students.first_name}`
      : 'Élève',
    className: row.classes?.name ?? '—',
    subjectName: row.subjects?.name ?? '—',
  }))
}
