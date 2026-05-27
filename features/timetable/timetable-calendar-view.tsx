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
const WEEKDAY_HEADERS_SHORT = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

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
  const monthLabelShort = new Date(year, month, 1).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })

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
    <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:gap-5">
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm sm:rounded-3xl">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:justify-start">
            <Button type="button" variant="outline" size="sm" className="h-9 w-9 shrink-0 p-0" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="min-w-0 flex-1 text-center text-sm font-black capitalize text-slate-900 sm:min-w-[180px] sm:text-base">
              <span className="sm:hidden">{monthLabelShort}</span>
              <span className="hidden sm:inline">{monthLabel}</span>
            </h2>
            <Button type="button" variant="outline" size="sm" className="h-9 w-9 shrink-0 p-0" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {canAddEvents && (
            <Button type="button" size="sm" variant="navy" className="w-full sm:w-auto" onClick={openAddEvent}>
              <Plus className="h-4 w-4" />
              Événement
            </Button>
          )}
        </div>

        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/80">
          {WEEKDAY_HEADERS.map((label, index) => (
            <div key={label} className="px-0.5 py-1.5 text-center text-[10px] font-black uppercase tracking-wide text-slate-400 sm:px-2 sm:py-2 sm:text-[11px]">
              <span className="sm:hidden">{WEEKDAY_HEADERS_SHORT[index]}</span>
              <span className="hidden sm:inline">{label}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {monthCells.map((cell, index) => {
            if (!cell.date || !cell.key) {
              return (
                <div
                  key={`empty-${index}`}
                  className="min-h-[52px] border-b border-r border-slate-100 bg-slate-50/40 sm:min-h-[72px] md:min-h-[88px]"
                />
              )
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
                className={`min-h-[52px] border-b border-r border-slate-100 p-1 text-left transition hover:bg-slate-50 sm:min-h-[72px] sm:p-2 md:min-h-[88px] ${
                  isSelected ? 'bg-[#1B3A6B]/5 ring-2 ring-inset ring-[#1B3A6B]/20' : ''
                } ${hasHoliday ? 'bg-slate-100/80' : ''}`}
              >
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black sm:h-7 sm:w-7 sm:text-xs ${
                  isToday ? 'bg-[#1B3A6B] text-white' : 'text-slate-700'
                }`}>
                  {cell.date.getDate()}
                </span>
                <div className="mt-0.5 space-y-0.5 sm:mt-1 sm:space-y-1">
                  <div className="flex flex-wrap gap-0.5 sm:hidden">
                    {dayEvents.slice(0, 3).map(event => (
                      <span
                        key={event.id}
                        className={`h-1.5 w-1.5 rounded-full ${CALENDAR_EVENT_COLORS[event.eventType].split(' ')[0]}`}
                        title={event.title}
                      />
                    ))}
                  </div>
                  <div className="hidden sm:block">
                    {dayEvents.slice(0, 2).map(event => (
                      <div
                        key={event.id}
                        className={`truncate rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${CALENDAR_EVENT_COLORS[event.eventType]}`}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <p className="text-[10px] font-bold text-slate-400">+{dayEvents.length - 2}</p>
                    )}
                  </div>
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
        <div className="hidden min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500 lg:flex lg:min-h-[280px] lg:rounded-3xl lg:px-6">
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
