import type { CalendarEventView, DayScheduleItem, TimetableSlotView } from '@/lib/timetable/types'

export function jsDayToIsoWeekday(date: Date): number {
  const day = date.getDay()
  return day === 0 ? 7 : day
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function isDateInRange(dateKey: string, start: string, end: string | null): boolean {
  if (!end) return dateKey === start
  return dateKey >= start && dateKey <= end
}

export function getEventsForDate(events: CalendarEventView[], dateKey: string) {
  return events.filter(event => isDateInRange(dateKey, event.eventDate, event.endDate))
}

export function getSlotsForDate(slots: TimetableSlotView[], date: Date, classId?: string, teacherId?: string) {
  const weekday = jsDayToIsoWeekday(date)
  return slots.filter(slot => {
    if (slot.dayOfWeek !== weekday) return false
    if (classId && slot.classId !== classId) return false
    if (teacherId && slot.teacherId !== teacherId) return false
    return true
  })
}

export function buildDaySchedule(
  dateKey: string,
  slots: TimetableSlotView[],
  events: CalendarEventView[],
  options?: { classId?: string; teacherId?: string },
): DayScheduleItem[] {
  const date = parseDateKey(dateKey)
  const dayEvents = getEventsForDate(events, dateKey)
  const daySlots = getSlotsForDate(slots, date, options?.classId, options?.teacherId)

  const items: DayScheduleItem[] = []

  for (const event of dayEvents) {
    items.push({
      id: event.id,
      kind: event.eventType === 'holiday' ? 'holiday' : 'event',
      title: event.title,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      meta: event.className ?? undefined,
      eventType: event.eventType,
    })
  }

  if (!dayEvents.some(event => event.eventType === 'holiday')) {
    for (const slot of daySlots) {
      items.push({
        id: slot.id,
        kind: 'course',
        title: slot.subjectName,
        description: slot.description,
        startTime: slot.startTime,
        endTime: slot.endTime,
        meta: `${slot.className} · ${slot.teacherName}${slot.room ? ` · Salle ${slot.room}` : ''}`,
      })
    }
  }

  return items.sort((a, b) => (a.startTime ?? '00:00').localeCompare(b.startTime ?? '00:00'))
}

export function getMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1)
  const startOffset = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: Array<{ date: Date | null; key: string | null }> = []

  for (let i = 0; i < startOffset; i++) cells.push({ date: null, key: null })
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    cells.push({ date, key: formatDateKey(date) })
  }
  while (cells.length % 7 !== 0) cells.push({ date: null, key: null })
  return cells
}
