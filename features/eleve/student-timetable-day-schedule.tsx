'use client'

import type { ComponentType } from 'react'
import { DAY_LABELS, DAY_SHORT_LABELS } from '@/lib/timetable/constants'
import { formatTimetableRoom } from '@/lib/timetable/display'
import type { GridTimeRow } from '@/lib/timetable/grid-utils'
import { getSchoolDayOfWeek } from '@/lib/timetable/student-timetable-helpers'
import type { TimetableBreakView, TimetableSlotView } from '@/lib/timetable/types'
import { cn } from '@/lib/utils'
import { ChevronRight, Coffee, Utensils } from 'lucide-react'

type SubjectStyle = {
  label: string
  color: string
  card: string
  icon: ComponentType<{ className?: string }>
}

type Props = {
  visibleDays: number[]
  selectedDay: number
  onSelectDay: (day: number) => void
  displayTimeRows: GridTimeRow[]
  breaks: TimetableBreakView[]
  slotsByCell: Map<string, TimetableSlotView[]>
  getSubjectStyle: (subject: string) => SubjectStyle
  onSlotClick: (slot: TimetableSlotView) => void
  className?: string
  viewOnly?: boolean
}

export function StudentTimetableDaySchedule({
  visibleDays,
  selectedDay,
  onSelectDay,
  displayTimeRows,
  breaks,
  slotsByCell,
  getSubjectStyle,
  onSlotClick,
  className,
  viewOnly = true,
}: Props) {
  const todayDay = getSchoolDayOfWeek()

  return (
    <div className={cn('w-full min-w-0 space-y-3', className)}>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {visibleDays.map(day => {
          const isToday = day === todayDay
          const isSelected = selectedDay === day
          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDay(day)}
              className={cn(
                'relative min-w-0 rounded-xl px-2 py-2.5 text-center text-xs font-bold transition sm:px-3 sm:py-3 sm:text-sm',
                isSelected
                  ? 'bg-[#1B3A6B] text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
              )}
            >
              {isToday && (
                <span
                  className={cn(
                    'absolute -right-1 -top-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide',
                    isSelected ? 'bg-[#7AB832] text-white' : 'bg-[#7AB832] text-white shadow-sm',
                  )}
                >
                  Auj.
                </span>
              )}
              <span className="sm:hidden">{DAY_SHORT_LABELS[day]}</span>
              <span className="hidden sm:inline">{DAY_LABELS[day]}</span>
            </button>
          )
        })}
      </div>

      <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-[#1B3A6B] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">Journée</p>
          <p className="text-base font-bold text-white">
            {DAY_LABELS[selectedDay]}
            {selectedDay === todayDay && (
              <span className="ml-2 text-xs font-medium text-[#7AB832]">· Aujourd&apos;hui</span>
            )}
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {displayTimeRows.map(row => {
            if (row.kind !== 'course') {
              const breakItem = breaks.find(item => item.id === row.id)
              const label = breakItem?.label ?? (row.kind === 'pause' ? 'Pause' : 'Déjeuner')
              const Icon = row.kind === 'pause' ? Coffee : Utensils
              return (
                <div
                  key={row.id}
                  className="flex items-center gap-3 bg-amber-50/50 px-3 py-2.5 sm:px-4 sm:py-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm sm:h-9 sm:w-9">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-amber-800/80">
                      {label}
                    </p>
                    <p className="text-sm font-semibold text-slate-700">{row.label}</p>
                  </div>
                </div>
              )
            }

            const cellSlots = slotsByCell.get(`${selectedDay}:${row.start!}`) ?? []
            return (
              <div key={row.id} className="px-3 py-2.5 sm:px-4 sm:py-3">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  {row.label}
                </p>
                {cellSlots.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-3 py-3 text-center text-xs font-medium text-slate-400">
                    Créneau libre
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cellSlots.map(slot => {
                      const style = getSubjectStyle(slot.subjectName)
                      const Icon = style.icon
                      const roomLabel = formatTimetableRoom(slot.room)
                      return (
                        <button
                          type="button"
                          key={slot.id}
                          onClick={() => onSlotClick(slot)}
                          className={cn(
                            'w-full min-w-0 rounded-xl border p-3 text-left shadow-sm transition active:scale-[0.99] hover:shadow-md',
                            style.card,
                          )}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${style.color}`} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start gap-1.5">
                                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                                <p className="min-w-0 flex-1 text-sm font-bold leading-snug text-gray-900">
                                  {slot.subjectName}
                                </p>
                              </div>
                              <p className="mt-1 text-xs font-medium text-slate-600">
                                {slot.teacherName}
                              </p>
                              {roomLabel && (
                                <p className="text-xs text-slate-500">{roomLabel}</p>
                              )}
                            </div>
                            {viewOnly && (
                              <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
