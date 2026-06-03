'use client'

import { CalendarClock, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatTimetableRoom } from '@/lib/timetable/display'
import {
  buildTodaySummary,
  getSlotStatus,
  type TodaySummary,
} from '@/lib/timetable/student-timetable-helpers'
import type { TimetableSlotView } from '@/lib/timetable/types'

type Props = {
  slots: TimetableSlotView[]
  onSelectSlot: (slot: TimetableSlotView) => void
  onGoToToday: () => void
}

function statusBadgeClass(status: ReturnType<typeof getSlotStatus>) {
  if (status === 'current') return 'bg-[#7AB832] text-white'
  if (status === 'upcoming') return 'bg-[#1B3A6B]/10 text-[#1B3A6B]'
  return 'bg-slate-100 text-slate-500'
}

function statusLabel(status: ReturnType<typeof getSlotStatus>) {
  if (status === 'current') return 'En cours'
  if (status === 'upcoming') return 'À venir'
  return 'Terminé'
}

function TodayTimeline({
  summary,
  onSelectSlot,
}: {
  summary: TodaySummary
  onSelectSlot: (slot: TimetableSlotView) => void
}) {
  if (summary.slotsToday.length === 0) return null

  return (
    <ul className="mt-3 space-y-2">
      {summary.slotsToday.map(slot => {
        const status = getSlotStatus(slot)
        const room = formatTimetableRoom(slot.room)
        return (
          <li key={slot.id}>
            <button
              type="button"
              onClick={() => onSelectSlot(slot)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition hover:shadow-sm',
                status === 'current'
                  ? 'border-[#7AB832]/40 bg-[#7AB832]/5'
                  : 'border-slate-200 bg-white hover:border-slate-300',
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold tabular-nums text-slate-600">
                    {slot.startTime} – {slot.endTime}
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      statusBadgeClass(status),
                    )}
                  >
                    {statusLabel(status)}
                  </span>
                </div>
                <p className="mt-0.5 text-sm font-bold text-gray-900">{slot.subjectName}</p>
                <p className="text-xs text-slate-600">
                  {slot.teacherName}
                  {room ? ` · ${room}` : ''}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export function StudentTimetableTodayPanel({ slots, onSelectSlot, onGoToToday }: Props) {
  const summary = buildTodaySummary(slots)

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-gradient-to-r from-[#1B3A6B]/5 to-white px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1B3A6B] text-white shadow-sm">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#1B3A6B]">
                Aujourd&apos;hui · {summary.dayLabel}
              </p>
              <h2 className="mt-0.5 text-base font-bold text-gray-900 sm:text-lg">{summary.headline}</h2>
              {summary.subline && (
                <p className="mt-1 text-sm text-slate-600">{summary.subline}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onGoToToday}
            className="w-full shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#1B3A6B] transition hover:bg-slate-50 sm:w-auto sm:py-1.5"
          >
            Voir la journée
          </button>
        </div>
      </div>

      {summary.slotsToday.length > 0 && (
        <div className="px-4 py-3 sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Programme du jour
          </p>
          <TodayTimeline summary={summary} onSelectSlot={onSelectSlot} />
        </div>
      )}
    </section>
  )
}
