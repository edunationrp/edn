import { DAY_LABELS } from '@/lib/timetable/constants'
import { timeToMinutes } from '@/lib/timetable/grid-utils'
import type { TimetableSlotView } from '@/lib/timetable/types'

export type TodaySlotStatus = 'past' | 'current' | 'upcoming'

export function getSchoolDayOfWeek(date = new Date()): number {
  const jsDay = date.getDay()
  return jsDay === 0 ? 7 : jsDay
}

export function getSlotStatus(
  slot: Pick<TimetableSlotView, 'dayOfWeek' | 'startTime' | 'endTime'>,
  now = new Date(),
): TodaySlotStatus {
  const today = getSchoolDayOfWeek(now)
  if (slot.dayOfWeek !== today) return 'past'

  const nowMin = now.getHours() * 60 + now.getMinutes()
  const start = timeToMinutes(slot.startTime)
  const end = timeToMinutes(slot.endTime)
  if (nowMin >= end) return 'past'
  if (nowMin >= start && nowMin < end) return 'current'
  return 'upcoming'
}

export type TodaySummary = {
  dayOfWeek: number
  dayLabel: string
  isSchoolDay: boolean
  slotsToday: TimetableSlotView[]
  current: TimetableSlotView | null
  next: TimetableSlotView | null
  finishedCount: number
  remainingCount: number
  headline: string
  subline: string | null
}

export function buildTodaySummary(slots: TimetableSlotView[], now = new Date()): TodaySummary {
  const dayOfWeek = getSchoolDayOfWeek(now)
  const isSchoolDay = dayOfWeek >= 1 && dayOfWeek <= 6
  const slotsToday = slots
    .filter(s => s.dayOfWeek === dayOfWeek)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  let current: TimetableSlotView | null = null
  let next: TimetableSlotView | null = null
  let finishedCount = 0

  for (const slot of slotsToday) {
    const status = getSlotStatus(slot, now)
    if (status === 'current') current = slot
    if (status === 'past') finishedCount++
    if (status === 'upcoming' && !next) next = slot
  }

  const remainingCount = slotsToday.length - finishedCount - (current ? 1 : 0)

  let headline = 'Consulte ta semaine ci-dessous'
  let subline: string | null = null

  if (!isSchoolDay) {
    headline = 'Pas de cours aujourd\'hui'
    subline = 'Profite de ton week-end — retrouve ta semaine type ci-dessous.'
  } else if (slotsToday.length === 0) {
    headline = 'Aucun cours prévu aujourd\'hui'
    subline = 'Ton établissement n\'a pas encore renseigné de créneau pour ce jour.'
  } else if (current) {
    headline = `En cours : ${current.subjectName}`
    subline = `${current.startTime} – ${current.endTime} · ${current.teacherName}`
  } else if (next) {
    headline = `Prochain cours : ${next.subjectName}`
    subline = `À ${next.startTime} · ${next.teacherName}`
  } else if (finishedCount === slotsToday.length) {
    headline = 'Journée terminée'
    subline = `${finishedCount} cours aujourd'hui — bravo pour ta journée !`
  } else {
    headline = `${slotsToday.length} cours aujourd'hui`
    subline = remainingCount > 0 ? `${remainingCount} encore à venir` : null
  }

  return {
    dayOfWeek,
    dayLabel: DAY_LABELS[dayOfWeek] ?? 'Aujourd\'hui',
    isSchoolDay,
    slotsToday,
    current,
    next,
    finishedCount,
    remainingCount,
    headline,
    subline,
  }
}

export type SubjectFilterOption = {
  id: string
  name: string
}

export function listSubjectFilterOptions(slots: TimetableSlotView[]): SubjectFilterOption[] {
  const map = new Map<string, SubjectFilterOption>()
  for (const slot of slots) {
    if (!map.has(slot.subjectId)) {
      map.set(slot.subjectId, { id: slot.subjectId, name: slot.subjectName })
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr'))
}

export function filterSlotsBySubject(
  slots: TimetableSlotView[],
  subjectId: string | null,
): TimetableSlotView[] {
  if (!subjectId) return slots
  return slots.filter(s => s.subjectId === subjectId)
}
