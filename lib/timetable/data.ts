import { createClient } from '@/lib/supabase/server'
import { WEEKDAY_NUMBERS } from '@/lib/timetable/constants'
import { DEFAULT_BREAKS } from '@/lib/timetable/grid-utils'
import type {
  CalendarEventView,
  TimetableAssignmentOption,
  TimetableBreakView,
  TimetableChangeRequestView,
  TimetableClassOption,
  TimetablePageMeta,
  TimetableSlotView,
  TimetableStaffAssignment,
  TimetableTeacherOption,
} from '@/lib/timetable/types'

export { DAY_LABELS, WEEKDAY_NUMBERS } from '@/lib/timetable/constants'

function formatTime(value: string): string {
  return value.slice(0, 5)
}

function profileName(profile: { full_name: string | null } | null): string {
  if (!profile) return 'Professeur'
  return profile.full_name ?? 'Professeur'
}

type SlotRow = {
  id: string
  school_id: string
  school_year_id: string
  class_id: string
  subject_id: string
  teacher_id: string | null
  room: string | null
  description: string | null
  day_of_week: number
  start_time: string
  end_time: string
  classes: { name: string } | { name: string }[] | null
  subjects: { name: string } | { name: string }[] | null
  profiles: { full_name: string | null } | { full_name: string | null }[] | null
}

function mapSlotRow(row: SlotRow): TimetableSlotView {
  const classRow = Array.isArray(row.classes) ? row.classes[0] : row.classes
  const subjectRow = Array.isArray(row.subjects) ? row.subjects[0] : row.subjects
  const teacherRow = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles

  return {
    id: row.id,
    schoolId: row.school_id,
    schoolYearId: row.school_year_id,
    classId: row.class_id,
    subjectId: row.subject_id,
    teacherId: row.teacher_id,
    className: classRow?.name ?? 'Classe',
    subjectName: subjectRow?.name ?? 'Matière',
    teacherName: profileName(teacherRow),
    room: row.room,
    description: row.description ?? null,
    dayOfWeek: row.day_of_week,
    startTime: formatTime(row.start_time),
    endTime: formatTime(row.end_time),
  }
}

export async function getActiveSchoolYearId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  schoolId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('school_years')
    .select('id')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .limit(1)

  return (data as Array<{ id: string }> | null)?.[0]?.id ?? null
}

export async function getSchoolTimetableSlots(
  schoolId: string,
  schoolYearId: string,
): Promise<TimetableSlotView[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('timetable_slots')
    .select(`
      id, school_id, school_year_id, class_id, subject_id, teacher_id,
      room, description, day_of_week, start_time, end_time,
      classes(name), subjects(name),
      profiles:teacher_id(full_name)
    `)
    .eq('school_id', schoolId)
    .eq('school_year_id', schoolYearId)
    .order('day_of_week')
    .order('start_time')

  return ((data ?? []) as SlotRow[]).map(mapSlotRow)
}

export async function getTeacherTimetableSlots(
  schoolId: string,
  schoolYearId: string,
  teacherId: string,
): Promise<TimetableSlotView[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('timetable_slots')
    .select(`
      id, school_id, school_year_id, class_id, subject_id, teacher_id,
      room, description, day_of_week, start_time, end_time,
      classes(name), subjects(name),
      profiles:teacher_id(full_name)
    `)
    .eq('school_id', schoolId)
    .eq('school_year_id', schoolYearId)
    .eq('teacher_id', teacherId)
    .order('day_of_week')
    .order('start_time')

  return ((data ?? []) as SlotRow[]).map(mapSlotRow)
}

export async function getTeacherAssignmentOptions(
  schoolId: string,
  teacherId: string,
): Promise<TimetableAssignmentOption[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('teacher_assignments')
    .select('id, class_id, subject_id, classes(name), subjects(name)')
    .eq('school_id', schoolId)
    .eq('teacher_id', teacherId)
    .eq('is_active', true)

  return ((data ?? []) as Array<{
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
      }
    })
}

export async function getTimetableClasses(
  schoolId: string,
  schoolYearId: string,
): Promise<TimetableClassOption[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('classes')
    .select('id, name, profiles:main_teacher_id(full_name)')
    .eq('school_id', schoolId)
    .eq('school_year_id', schoolYearId)
    .order('name')

  return ((data ?? []) as Array<{
    id: string
    name: string
    profiles: { full_name: string | null } | { full_name: string | null }[] | null
  }>).map(row => {
    const mainTeacher = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    return {
      id: row.id,
      name: row.name,
      mainTeacherName: mainTeacher?.full_name ?? 'Non défini',
    }
  })
}

export async function getSchoolStaffAssignments(
  schoolId: string,
): Promise<TimetableStaffAssignment[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('teacher_assignments')
    .select('id, class_id, subject_id, teacher_id, classes(name), subjects(name), profiles:teacher_id(full_name)')
    .eq('school_id', schoolId)
    .eq('is_active', true)

  return ((data ?? []) as Array<{
    id: string
    class_id: string | null
    subject_id: string | null
    teacher_id: string | null
    classes: { name: string } | { name: string }[] | null
    subjects: { name: string } | { name: string }[] | null
    profiles: { full_name: string | null } | { full_name: string | null }[] | null
  }>)
    .filter(row => row.class_id && row.subject_id && row.teacher_id)
    .map(row => {
      const classRow = Array.isArray(row.classes) ? row.classes[0] : row.classes
      const subjectRow = Array.isArray(row.subjects) ? row.subjects[0] : row.subjects
      const teacherRow = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
      return {
        id: row.id,
        classId: row.class_id!,
        className: classRow?.name ?? 'Classe',
        subjectId: row.subject_id!,
        subjectName: subjectRow?.name ?? 'Matière',
        teacherId: row.teacher_id!,
        teacherName: teacherRow?.full_name ?? 'Professeur',
      }
    })
}

export async function getTimetablePageMeta(
  schoolId: string,
  schoolYearId: string,
): Promise<TimetablePageMeta> {
  const supabase = await createClient()

  const [schoolYearResult, classResult, termResult, lastSlotResult] = await Promise.all([
    supabase
      .from('school_years')
      .select('name')
      .eq('id', schoolYearId)
      .eq('school_id', schoolId)
      .maybeSingle(),
    supabase
      .from('classes')
      .select('name, profiles:main_teacher_id(full_name)')
      .eq('school_id', schoolId)
      .eq('school_year_id', schoolYearId)
      .order('name')
      .limit(1),
    supabase
      .from('terms')
      .select('name')
      .eq('school_id', schoolId)
      .eq('school_year_id', schoolYearId)
      .eq('is_active', true)
      .limit(1),
    supabase
      .from('timetable_slots')
      .select('id')
      .eq('school_id', schoolId)
      .eq('school_year_id', schoolYearId)
      .limit(1),
  ])

  const schoolYear = schoolYearResult.data as { name: string } | null
  const classRows = (classResult.data ?? []) as Array<{
    name: string
    profiles: { full_name: string | null } | { full_name: string | null }[] | null
  }>
  const firstClass = classRows[0]
  const mainTeacher = Array.isArray(firstClass?.profiles) ? firstClass?.profiles[0] : firstClass?.profiles
  const terms = (termResult.data ?? []) as Array<{ name: string }>

  return {
    schoolYearName: schoolYear?.name ?? 'Année scolaire',
    className: firstClass?.name ?? 'Toutes les classes',
    trackName: 'Aucune',
    termName: terms[0]?.name ?? 'Semestre 1',
    mainTeacherName: mainTeacher?.full_name ?? 'Non défini',
    lastModified: lastSlotResult.data && lastSlotResult.data.length > 0 ? 'Aujourd’hui' : 'Aucune modification',
  }
}

type ChangeRequestRow = {
  id: string
  timetable_slot_id: string | null
  teacher_id: string
  requested_day_of_week: number
  requested_start_time: string
  requested_end_time: string
  requested_room: string | null
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  review_note: string | null
  created_at: string
  profiles: { full_name: string | null } | { full_name: string | null }[] | null
  timetable_slots: {
    day_of_week: number
    start_time: string
    end_time: string
    classes: { name: string } | { name: string }[] | null
    subjects: { name: string } | { name: string }[] | null
  } | {
    day_of_week: number
    start_time: string
    end_time: string
    classes: { name: string } | { name: string }[] | null
    subjects: { name: string } | { name: string }[] | null
  }[] | null
}

export async function getTimetableChangeRequests(
  schoolId: string,
  teacherId?: string,
): Promise<TimetableChangeRequestView[]> {
  const supabase = await createClient()

  let query = supabase
    .from('timetable_change_requests')
    .select(`
      id, timetable_slot_id, teacher_id, requested_day_of_week,
      requested_start_time, requested_end_time, requested_room,
      reason, status, review_note, created_at,
      profiles:teacher_id(full_name),
      timetable_slots(
        day_of_week, start_time, end_time,
        classes(name), subjects(name)
      )
    `)
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })

  if (teacherId) {
    query = query.eq('teacher_id', teacherId)
  }

  const { data } = await query

  return ((data ?? []) as ChangeRequestRow[]).map(row => {
    const teacher = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    const slot = Array.isArray(row.timetable_slots) ? row.timetable_slots[0] : row.timetable_slots
    const classRow = Array.isArray(slot?.classes) ? slot?.classes[0] : slot?.classes
    const subjectRow = Array.isArray(slot?.subjects) ? slot?.subjects[0] : slot?.subjects

    return {
      id: row.id,
      slotId: row.timetable_slot_id,
      teacherId: row.teacher_id,
      teacherName: teacher?.full_name ?? 'Professeur',
      className: classRow?.name ?? 'Classe',
      subjectName: subjectRow?.name ?? 'Matière',
      currentDayOfWeek: slot?.day_of_week ?? null,
      currentStartTime: slot ? formatTime(slot.start_time) : null,
      currentEndTime: slot ? formatTime(slot.end_time) : null,
      requestedDayOfWeek: row.requested_day_of_week,
      requestedStartTime: formatTime(row.requested_start_time),
      requestedEndTime: formatTime(row.requested_end_time),
      requestedRoom: row.requested_room,
      reason: row.reason,
      status: row.status,
      reviewNote: row.review_note,
      createdAt: row.created_at,
    }
  })
}

export function groupSlotsByDay(slots: TimetableSlotView[]): Map<number, TimetableSlotView[]> {
  const grouped = new Map<number, TimetableSlotView[]>()
  for (const day of WEEKDAY_NUMBERS) {
    grouped.set(day, [])
  }
  for (const slot of slots) {
    const list = grouped.get(slot.dayOfWeek) ?? []
    list.push(slot)
    grouped.set(slot.dayOfWeek, list)
  }
  for (const [day, list] of grouped) {
    grouped.set(day, list.sort((a, b) => a.startTime.localeCompare(b.startTime)))
  }
  return grouped
}

export function getTodayDayOfWeek(): number {
  const jsDay = new Date().getDay()
  return jsDay === 0 ? 7 : jsDay
}

export async function getTimetableBreaks(
  schoolId: string,
  schoolYearId: string,
): Promise<TimetableBreakView[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('timetable_breaks')
    .select('id, label, break_type, start_time, end_time, order_num')
    .eq('school_id', schoolId)
    .or(`school_year_id.eq.${schoolYearId},school_year_id.is.null`)
    .order('order_num')

  const rows = (data ?? []) as Array<{
    id: string
    label: string
    break_type: 'pause' | 'lunch'
    start_time: string
    end_time: string
    order_num: number
  }>

  if (rows.length === 0) return DEFAULT_BREAKS

  return rows.map(row => ({
    id: row.id,
    label: row.label,
    breakType: row.break_type,
    startTime: formatTime(row.start_time),
    endTime: formatTime(row.end_time),
    orderNum: row.order_num,
  }))
}

export async function getCalendarEvents(
  schoolId: string,
  schoolYearId: string,
): Promise<CalendarEventView[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('calendar_events')
    .select(`
      id, event_type, title, description, event_date, end_date,
      all_day, start_time, end_time, class_id, subject_id, teacher_id, room,
      classes(name), subjects(name), profiles:teacher_id(full_name)
    `)
    .eq('school_id', schoolId)
    .eq('school_year_id', schoolYearId)
    .order('event_date')

  return ((data ?? []) as Array<{
    id: string
    event_type: CalendarEventView['eventType']
    title: string
    description: string | null
    event_date: string
    end_date: string | null
    all_day: boolean
    start_time: string | null
    end_time: string | null
    class_id: string | null
    subject_id: string | null
    teacher_id: string | null
    room: string | null
    classes: { name: string } | { name: string }[] | null
    subjects: { name: string } | { name: string }[] | null
    profiles: { full_name: string | null } | { full_name: string | null }[] | null
  }>).map(row => {
    const classRow = Array.isArray(row.classes) ? row.classes[0] : row.classes
    const subjectRow = Array.isArray(row.subjects) ? row.subjects[0] : row.subjects
    const teacherRow = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    return {
      id: row.id,
      eventType: row.event_type,
      title: row.title,
      description: row.description,
      eventDate: row.event_date,
      endDate: row.end_date,
      allDay: row.all_day,
      startTime: row.start_time ? formatTime(row.start_time) : null,
      endTime: row.end_time ? formatTime(row.end_time) : null,
      classId: row.class_id,
      className: classRow?.name ?? null,
      subjectId: row.subject_id,
      subjectName: subjectRow?.name ?? null,
      teacherId: row.teacher_id,
      teacherName: teacherRow?.full_name ?? null,
      room: row.room,
    }
  })
}

export async function getSchoolTeachers(
  schoolId: string,
): Promise<TimetableTeacherOption[]> {
  const assignments = await getSchoolStaffAssignments(schoolId)
  const seen = new Map<string, string>()
  for (const row of assignments) {
    if (!seen.has(row.teacherId)) seen.set(row.teacherId, row.teacherName)
  }
  return [...seen.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name))
}
