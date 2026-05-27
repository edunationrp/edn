'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { TimetableDayDetailPanel } from '@/features/timetable/timetable-day-detail-panel'
import { TimetableEventDialog } from '@/features/timetable/timetable-event-dialog'
import { formatDateKey, getEventsForDate, getMonthGrid } from '@/lib/timetable/calendar-utils'
import { CALENDAR_EVENT_COLORS } from '@/lib/timetable/grid-utils'
import type { CalendarEventView, TimetableClassOption, TimetableSlotView, TimetableTeacherOption } from '@/lib/timetable/types'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'

const WEEKDAY_HEADERS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

type TimetableCalendarViewProps = {
  slots: TimetableSlotView[]
  events: CalendarEventView[]
  classes: TimetableClassOption[]
  teachers: TimetableTeacherOption[]
  canManage: boolean
  canAddEvents?: boolean
  filterClassId?: string
  filterTeacherId?: string
  viewMode?: 'class' | 'teacher' | 'all'
  selectedClassId?: string
  selectedTeacherId?: string
}

export function TimetableCalendarView({
  slots,
  events,
  classes,
  canManage,
  canAddEvents = canManage,
  filterClassId,
  filterTeacherId,
}: TimetableCalendarViewProps) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(formatDateKey(today))
  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEventView | null>(null)

  const monthCells = useMemo(() => getMonthGrid(year, month), [year, month])
  const monthLabel = new Date(year, month, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  const filteredSlots = useMemo(() => {
    return slots.filter(slot => {
      if (filterClassId && slot.classId !== filterClassId) return false
      if (filterTeacherId && slot.teacherId !== filterTeacherId) return false
      return true
    })
  }, [slots, filterClassId, filterTeacherId])

  function prevMonth() {
    if (month === 0) {
      setMonth(11)
      setYear(y => y - 1)
    } else {
      setMonth(m => m - 1)
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0)
      setYear(y => y + 1)
    } else {
      setMonth(m => m + 1)
    }
  }

  function openAddEvent() {
    setEditingEvent(null)
    setEventDialogOpen(true)
  }

  function openEditEvent(event: CalendarEventView) {
    setEditingEvent(event)
    setEventDialogOpen(true)
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="min-w-[180px] text-center text-base font-black capitalize text-slate-900">{monthLabel}</h2>
            <Button type="button" variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {canAddEvents && (
            <Button type="button" size="sm" variant="navy" onClick={openAddEvent}>
              <Plus className="h-4 w-4" />
              Événement
            </Button>
          )}
        </div>

        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/80">
          {WEEKDAY_HEADERS.map(label => (
            <div key={label} className="px-2 py-2 text-center text-[11px] font-black uppercase tracking-wide text-slate-400">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {monthCells.map((cell, index) => {
            if (!cell.date || !cell.key) {
              return <div key={`empty-${index}`} className="min-h-[88px] border-b border-r border-slate-100 bg-slate-50/40" />
            }

            const dayEvents = getEventsForDate(events, cell.key)
            const isToday = cell.key === formatDateKey(today)
            const isSelected = cell.key === selectedDate
            const hasHoliday = dayEvents.some(event => event.eventType === 'holiday')

            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => setSelectedDate(cell.key)}
                className={`min-h-[88px] border-b border-r border-slate-100 p-2 text-left transition hover:bg-slate-50 ${
                  isSelected ? 'bg-[#1B3A6B]/5 ring-2 ring-inset ring-[#1B3A6B]/20' : ''
                } ${hasHoliday ? 'bg-slate-100/80' : ''}`}
              >
                <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${
                  isToday ? 'bg-[#1B3A6B] text-white' : 'text-slate-700'
                }`}>
                  {cell.date.getDate()}
                </span>
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 2).map(event => (
                    <div
                      key={event.id}
                      className={`truncate rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${CALENDAR_EVENT_COLORS[event.eventType]}`}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <p className="text-[10px] font-bold text-slate-400">+{dayEvents.length - 2} autre(s)</p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {selectedDate ? (
        <TimetableDayDetailPanel
          dateKey={selectedDate}
          slots={filteredSlots}
          events={events}
          filterClassId={filterClassId}
          filterTeacherId={filterTeacherId}
          canManage={canManage}
          canAddEvents={canAddEvents}
          onClose={() => setSelectedDate(null)}
          onAddEvent={openAddEvent}
          onEditEvent={openEditEvent}
        />
      ) : (
        <div className="flex min-h-[280px] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-500">
          Cliquez sur une date pour voir le détail du jour (cours, devoirs, fériés…).
        </div>
      )}

      <TimetableEventDialog
        open={eventDialogOpen}
        event={editingEvent}
        defaultDate={selectedDate ?? formatDateKey(today)}
        classes={classes}
        canManage={canManage}
        onClose={() => {
          setEventDialogOpen(false)
          setEditingEvent(null)
        }}
      />
    </div>
  )
}
