export type TimetableClassOption = {
  id: string
  name: string
  mainTeacherName: string
}

export type TimetableStaffAssignment = {
  id: string
  classId: string
  className: string
  subjectId: string
  subjectName: string
  teacherId: string
  teacherName: string
}

export type TimetableTeacherOption = {
  id: string
  name: string
}

export type TimetableSlotView = {
  id: string
  schoolId: string
  schoolYearId: string
  classId: string
  subjectId: string
  teacherId: string | null
  className: string
  subjectName: string
  teacherName: string
  room: string | null
  description: string | null
  dayOfWeek: number
  startTime: string
  endTime: string
}

export type TimetableBreakView = {
  id: string
  label: string
  breakType: 'pause' | 'lunch'
  startTime: string
  endTime: string
  orderNum: number
}

export type CalendarEventType =
  | 'homework'
  | 'exam'
  | 'holiday'
  | 'event'
  | 'meeting'
  | 'replacement'
  | 'note'

export type CalendarEventView = {
  id: string
  eventType: CalendarEventType
  title: string
  description: string | null
  eventDate: string
  endDate: string | null
  allDay: boolean
  startTime: string | null
  endTime: string | null
  classId: string | null
  className: string | null
  subjectId: string | null
  subjectName: string | null
  teacherId: string | null
  teacherName: string | null
  room: string | null
}

export type TimetableConflict = {
  id: string
  kind: 'teacher' | 'room' | 'class'
  message: string
  slotIds: string[]
}

export type TimetableChangeRequestStatus = 'pending' | 'approved' | 'rejected'

export type TimetableChangeRequestView = {
  id: string
  slotId: string | null
  teacherId: string
  teacherName: string
  className: string
  subjectName: string
  currentDayOfWeek: number | null
  currentStartTime: string | null
  currentEndTime: string | null
  requestedDayOfWeek: number
  requestedStartTime: string
  requestedEndTime: string
  requestedRoom: string | null
  reason: string
  status: TimetableChangeRequestStatus
  reviewNote: string | null
  createdAt: string
}

export type TimetablePageMeta = {
  schoolYearName: string
  className: string
  trackName: string
  termName: string
  mainTeacherName: string
  lastModified: string
}

export type TimetableAssignmentOption = {
  id: string
  classId: string
  subjectId: string
  className: string
  subjectName: string
}

export type DayScheduleItem = {
  id: string
  kind: 'course' | 'event' | 'holiday'
  title: string
  description: string | null
  startTime: string | null
  endTime: string | null
  meta?: string
  eventType?: CalendarEventType
}
