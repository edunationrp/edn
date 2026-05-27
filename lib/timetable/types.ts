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
  dayOfWeek: number
  startTime: string
  endTime: string
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
