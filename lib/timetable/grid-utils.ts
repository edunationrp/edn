import type { TimetableBreakView, TimetableSlotView } from '@/lib/timetable/types'

export const DEFAULT_BREAKS: TimetableBreakView[] = [
  { id: 'default-pause', label: 'Pause', breakType: 'pause', startTime: '09:30', endTime: '10:00', orderNum: 1 },
  { id: 'default-lunch', label: 'Déjeuner', breakType: 'lunch', startTime: '12:00', endTime: '13:00', orderNum: 2 },
]

export const DEFAULT_COURSE_SLOTS = [
  { start: '07:30', end: '08:30' },
  { start: '08:30', end: '09:30' },
  { start: '10:00', end: '11:00' },
  { start: '11:00', end: '12:00' },
  { start: '13:00', end: '14:00' },
  { start: '14:00', end: '15:00' },
  { start: '15:00', end: '16:00' },
]

export type GridTimeRow = {
  id: string
  label: string
  start?: string
  end?: string
  kind: 'course' | 'pause' | 'lunch'
}

export function buildGridTimeRows(
  breaks: TimetableBreakView[],
  slots: TimetableSlotView[],
): GridTimeRow[] {
  const courseStarts = new Set<string>()
  for (const slot of DEFAULT_COURSE_SLOTS) courseStarts.add(slot.start)
  for (const slot of slots) courseStarts.add(slot.startTime)

  const courseRows: GridTimeRow[] = [...courseStarts]
    .sort()
    .map(start => {
      const fromSlot = slots.find(s => s.startTime === start)
      const fromDefault = DEFAULT_COURSE_SLOTS.find(s => s.start === start)
      const end = fromSlot?.endTime ?? fromDefault?.end ?? addHour(start)
      return {
        id: `course-${start}`,
        label: `${start} - ${end}`,
        start,
        end,
        kind: 'course' as const,
      }
    })

  const breakRows: GridTimeRow[] = breaks.map(item => ({
    id: item.id,
    label: `${item.startTime} - ${item.endTime}`,
    start: item.startTime,
    end: item.endTime,
    kind: item.breakType,
  }))

  const merged = [...courseRows, ...breakRows].sort((a, b) => {
    const aTime = a.start ?? '99:99'
    const bTime = b.start ?? '99:99'
    if (a.kind !== 'course' && b.kind === 'course') {
      return aTime.localeCompare(b.start ?? '')
    }
    return aTime.localeCompare(bTime)
  })

  return merged
}

function addHour(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + 60
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export function detectTimetableConflicts(slots: TimetableSlotView[]) {
  const conflicts: Array<{ id: string; kind: 'teacher' | 'room' | 'class'; message: string; slotIds: string[] }> = []
  const seen = new Set<string>()

  function overlaps(a: TimetableSlotView, b: TimetableSlotView) {
    if (a.dayOfWeek !== b.dayOfWeek) return false
    return a.startTime < b.endTime && b.startTime < a.endTime
  }

  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i]
      const b = slots[j]
      if (!overlaps(a, b)) continue

      if (a.teacherId && b.teacherId && a.teacherId === b.teacherId) {
        const key = `teacher:${a.teacherId}:${a.dayOfWeek}:${a.startTime}:${b.startTime}`
        if (!seen.has(key)) {
          seen.add(key)
          conflicts.push({
            id: key,
            kind: 'teacher',
            message: `${a.teacherName} a deux cours le ${dayLabel(a.dayOfWeek)} (${a.startTime}–${a.endTime} et ${b.startTime}–${b.endTime})`,
            slotIds: [a.id, b.id],
          })
        }
      }

      if (a.room && b.room && a.room.trim().toLowerCase() === b.room.trim().toLowerCase()) {
        const key = `room:${a.room}:${a.dayOfWeek}:${a.startTime}:${b.startTime}`
        if (!seen.has(key)) {
          seen.add(key)
          conflicts.push({
            id: key,
            kind: 'room',
            message: `Salle ${a.room} double-bookée le ${dayLabel(a.dayOfWeek)}`,
            slotIds: [a.id, b.id],
          })
        }
      }

      if (a.classId === b.classId) {
        const key = `class:${a.classId}:${a.dayOfWeek}:${a.startTime}:${b.startTime}`
        if (!seen.has(key)) {
          seen.add(key)
          conflicts.push({
            id: key,
            kind: 'class',
            message: `${a.className} a deux cours le ${dayLabel(a.dayOfWeek)}`,
            slotIds: [a.id, b.id],
          })
        }
      }
    }
  }

  return conflicts
}

function dayLabel(day: number) {
  const labels: Record<number, string> = {
    1: 'lundi', 2: 'mardi', 3: 'mercredi', 4: 'jeudi', 5: 'vendredi', 6: 'samedi', 7: 'dimanche',
  }
  return labels[day] ?? `jour ${day}`
}

export const CALENDAR_EVENT_LABELS: Record<string, string> = {
  homework: 'Devoir',
  exam: 'Évaluation',
  holiday: 'Férié / congé',
  event: 'Événement',
  meeting: 'Réunion',
  replacement: 'Remplacement',
  note: 'Note',
}

export const CALENDAR_EVENT_COLORS: Record<string, string> = {
  homework: 'bg-orange-100 text-orange-800 border-orange-200',
  exam: 'bg-amber-100 text-amber-900 border-amber-200',
  holiday: 'bg-slate-200 text-slate-700 border-slate-300',
  event: 'bg-violet-100 text-violet-900 border-violet-200',
  meeting: 'bg-indigo-100 text-indigo-900 border-indigo-200',
  replacement: 'bg-rose-100 text-rose-900 border-rose-200',
  note: 'bg-teal-100 text-teal-900 border-teal-200',
}
